import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureCompanyUserForArchive } from "@/lib/archive/resolve-archive-company";
import { upsertArchiveEmailFileRow } from "@/lib/archive/save-archive-file-row";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { gmailClient } from "@/lib/google/client";

export const EMAIL_ARCHIVE_BUCKET =
  process.env.SUPABASE_EMAIL_BUCKET?.trim() || "company-vault";

const DEFAULT_MAX = 50;

function headerValue(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string,
) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

export type EmailArchiveResult =
  | { success: true; count: number; status: string; progress: string; warning?: string }
  | { success: false; error: string; status?: string };

export async function runEmailArchiveForUser(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    email: string;
    domain: string;
    maxMessages?: number;
  },
): Promise<EmailArchiveResult> {
  const email = opts.email.toLowerCase();
  const maxMessages = opts.maxMessages ?? DEFAULT_MAX;

  await ensureCompanyUserForArchive(supabase, opts.companyId, email);

  await supabase
    .from("company_users")
    .update({ email_sync_status: "syncing", email_sync_progress: `0/${maxMessages}` })
    .eq("company_id", opts.companyId)
    .eq("email", email);

  const accessToken = await getValidGoogleAccessToken(
    supabase,
    opts.companyId,
    email,
  );

  if (!accessToken) {
    await supabase
      .from("company_users")
      .update({ email_sync_status: "error", email_sync_progress: "no_token" })
      .eq("company_id", opts.companyId)
      .eq("email", email);
    return { success: false, error: "Connect Google with Gmail access first.", status: "error" };
  }

  const gmail = gmailClient(accessToken);
  if (!gmail) {
    return { success: false, error: "Gmail client unavailable", status: "error" };
  }

  let imported = 0;
  let archiveIndexWarning = "";
  try {
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: maxMessages,
    });

    const messages = list.data.messages || [];
    const total = messages.length || maxMessages;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.id) continue;

      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const payload = full.data;
      const headers = payload.payload?.headers;
      const subject = headerValue(headers, "Subject") || "(no subject)";
      const from = headerValue(headers, "From");
      const to = headerValue(headers, "To");
      const dateStr = headerValue(headers, "Date");
      const jsonBody = JSON.stringify(payload);
      const buf = Buffer.from(jsonBody, "utf8");
      const storagePath = `${opts.companyId}/email/${msg.id}.json`;

      const { error: uploadErr } = await supabase.storage
        .from(EMAIL_ARCHIVE_BUCKET)
        .upload(storagePath, buf, {
          upsert: true,
          contentType: "application/json",
        });
      if (uploadErr) {
        throw new Error(
          `Vault bucket "${EMAIL_ARCHIVE_BUCKET}" upload failed: ${uploadErr.message}. Create the bucket in Supabase Storage (private).`,
        );
      }

      const { error: ebErr } = await supabase.from("email_backups").upsert(
        {
          company_id: opts.companyId,
          company_domain: opts.domain,
          owner_email: email,
          gmail_id: msg.id,
          thread_id: payload.threadId,
          subject,
          from_email: from,
          to_email: to,
          date: dateStr ? new Date(dateStr).toISOString() : null,
          body_text: payload.snippet || subject,
          has_attachment: false,
          folder: "INBOX",
          s3_path: storagePath,
        },
        { onConflict: "gmail_id" },
      );
      if (ebErr) {
        throw new Error(`Could not save email_backups (${ebErr.message}).`);
      }

      if (process.env.EMAIL_ARCHIVE_FILES_INDEX === "1") {
        const archiveRow = {
          company_id: opts.companyId,
          uploaded_by: email,
          owner_email: email,
          type: "email" as const,
          file_name: `${subject.slice(0, 120)}.json`,
          size: buf.length,
          storage_path: storagePath,
          gmail_id: msg.id,
          subject,
          from_email: from,
          message_date: dateStr ? new Date(dateStr).toISOString() : null,
          metadata: { to, threadId: payload.threadId },
        };

        const indexResult = await upsertArchiveEmailFileRow(
          supabase,
          opts.companyId,
          msg.id,
          archiveRow,
        );
        if (!indexResult.ok && indexResult.warning && !archiveIndexWarning) {
          archiveIndexWarning = indexResult.warning;
        }
      }

      imported += 1;
      await supabase
        .from("company_users")
        .update({
          email_sync_status: "syncing",
          email_sync_progress: `${imported}/${total}`,
        })
        .eq("company_id", opts.companyId)
        .eq("email", email);
    }

    const progress = `${imported}/${imported || total}`;
    await supabase
      .from("company_users")
      .update({ email_sync_status: "completed", email_sync_progress: progress })
      .eq("company_id", opts.companyId)
      .eq("email", email);

    return {
      success: true,
      count: imported,
      status: "completed",
      progress,
      warning: archiveIndexWarning || undefined,
    };
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Gmail sync failed";
    if (/insufficient.*scope|403|Forbidden/i.test(msg)) {
      msg =
        "Gmail permission missing — open My mail archive → Connect Gmail again and allow Gmail on the Google screen.";
    }
    await supabase
      .from("company_users")
      .update({ email_sync_status: "error", email_sync_progress: msg.slice(0, 200) })
      .eq("company_id", opts.companyId)
      .eq("email", email);
    return { success: false, error: msg, status: "error" };
  }
}

export async function getEmailArchiveStatus(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
) {
  const normalized = email.toLowerCase();

  const { data: cu } = await supabase
    .from("company_users")
    .select("email_sync_status, email_sync_progress")
    .eq("company_id", companyId)
    .eq("email", normalized)
    .maybeSingle();

  const { count: mineAf } = await supabase
    .from("archive_files")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("type", "email")
    .eq("owner_email", normalized);

  const { count: companyAf } = await supabase
    .from("archive_files")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("type", "email");

  const { count: mineEb } = await supabase
    .from("email_backups")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("owner_email", normalized);

  const { count: coEb } = await supabase
    .from("email_backups")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  const archivedCount = Math.max(mineAf || 0, mineEb || 0);
  const companyEmailArchiveCount = Math.max(companyAf || 0, coEb || 0);

  const syncStatus = (cu?.email_sync_status as string) || "idle";
  const progress = (cu?.email_sync_progress as string) || "";

  return {
    status: syncStatus,
    progress,
    lastError: syncStatus === "error" ? progress : "",
    archivedCount,
    companyEmailArchiveCount,
  };
}
