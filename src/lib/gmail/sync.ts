import { achieverReduce } from "@/lib/upload/achiever";
import { uploadToE2E } from "@/lib/e2e/client";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type TeamMailInput = {
  headers: Record<string, string | undefined>;
  toList: string[];
  raw: string | Uint8Array;
  subject?: string;
  from_email?: string;
  snippet?: string;
};

function headerValue(headers: Record<string, string | undefined>, name: string): string {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && value) return value;
  }
  return "";
}

function safeObjectId(messageId: string): string {
  return messageId.replace(/[<>\s]/g, "").replace(/[^a-zA-Z0-9._@-]/g, "_").slice(0, 180);
}

function bytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 1000) / 1000;
}

function toFile(raw: string | Uint8Array, name: string): File {
  if (typeof raw === "string") {
    return new File([raw], name, { type: "message/rfc822" });
  }
  const copy = new Uint8Array(raw);
  return new File([copy], name, { type: "message/rfc822" });
}

/**
 * Store one team copy of a message. Extra recipients only get an inbox row.
 */
export async function saveTeamMail(
  mail: TeamMailInput,
  teamId: string,
): Promise<{ duplicate: boolean; savedMb: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const messageId = headerValue(mail.headers, "message-id").trim();
  if (!messageId) throw new Error("Mail is missing a Message-ID header.");

  const viewers = Array.from(
    new Set(mail.toList.map((email) => email.trim().toLowerCase()).filter((email) => email.includes("@"))),
  );

  const existing = await supabase
    .from("team_emails")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    if (viewers.length) {
      const inserted = await supabase.from("user_inbox_view").upsert(
        viewers.map((user_email) => ({
          message_id: messageId,
          team_id: teamId,
          user_email,
          is_read: false,
        })),
        { onConflict: "message_id,team_id,user_email", ignoreDuplicates: true },
      );
      if (inserted.error) throw new Error(inserted.error.message);
    }
    return { duplicate: true, savedMb: 0 };
  }

  const original = toFile(mail.raw, `${safeObjectId(messageId)}.eml`);
  const reduced = await achieverReduce(original);
  const uploaded = await uploadToE2E(reduced.file, teamId);
  const originalMb = bytesToMb(original.size);
  const sizeMb = bytesToMb(reduced.file.size);
  const savedMb = Math.max(0, Math.round((originalMb - sizeMb) * 1000) / 1000);

  const row = await supabase.from("team_emails").insert({
    message_id: messageId,
    team_id: teamId,
    subject: mail.subject || headerValue(mail.headers, "subject") || "(no subject)",
    from_email: mail.from_email || headerValue(mail.headers, "from"),
    snippet: mail.snippet || "",
    storage_path: `${uploaded.bucket}/${uploaded.key}`,
    size_mb: sizeMb,
    original_size_mb: originalMb,
    saved_mb: savedMb,
  });
  if (row.error) throw new Error(row.error.message);

  if (viewers.length) {
    const inbox = await supabase.from("user_inbox_view").insert(
      viewers.map((user_email) => ({
        message_id: messageId,
        team_id: teamId,
        user_email,
        is_read: false,
      })),
    );
    if (inbox.error) throw new Error(inbox.error.message);
  }

  return { duplicate: false, savedMb };
}
