import { inferB3AiTag } from "@/lib/b3/ai-tag";
import { demoB3Insert, demoB3List } from "@/lib/b3/demo-store";
import type { B3FileRecord } from "@/lib/b3/types";
import { B3_DEFAULT_LIMIT_GB } from "@/lib/b3/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

function mapRow(r: Record<string, unknown>): B3FileRecord {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    fileName: String(r.file_name),
    fileUrl: String(r.file_url),
    fileSize: Number(r.file_size),
    aiTag: String(r.ai_tag),
    createdAt: String(r.created_at),
  };
}

export async function uploadB3Blob(
  companyId: string,
  fileName: string,
  body: Buffer,
  contentType?: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return `https://blob.vercel-storage.com/b3-mock/${companyId}/${encodeURIComponent(fileName)}`;
  }
  const key = `b3/${companyId}/${Date.now()}-${fileName.replace(/[^\w.-]+/g, "_")}`;
  const blob = await put(key, body, {
    access: "public",
    contentType: contentType || "application/octet-stream",
    token,
  });
  return blob.url;
}

async function seedDemoRowsIfEmpty(
  supabase: SupabaseClient,
  companyId: string,
): Promise<void> {
  const { count } = await supabase
    .from("b3_files")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (count && count > 0) return;

  const demos = demoB3List(companyId);
  await supabase.from("b3_files").insert(
    demos.map((d) => ({
      company_id: companyId,
      file_name: d.fileName,
      file_url: d.fileUrl,
      file_size: Math.round(d.fileSize),
      ai_tag: d.aiTag,
      created_at: d.createdAt,
    })),
  );
}

export async function listB3Files(
  supabase: SupabaseClient | null,
  companyId: string,
  limitGb = B3_DEFAULT_LIMIT_GB,
): Promise<{ files: B3FileRecord[]; usedBytes: number; limitGb: number }> {
  if (!supabase) {
    const files = demoB3List(companyId);
    const usedBytes = files.reduce((s, f) => s + f.fileSize, 0);
    return { files, usedBytes, limitGb };
  }

  try {
    await seedDemoRowsIfEmpty(supabase, companyId);
  } catch {
    /* table may not exist yet */
  }

  const { data, error } = await supabase
    .from("b3_files")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error?.message?.includes("b3_files") || !data) {
    const files = demoB3List(companyId);
    const usedBytes = files.reduce((s, f) => s + f.fileSize, 0);
    return { files, usedBytes, limitGb };
  }

  const files = data.map((r) => mapRow(r as Record<string, unknown>));
  const usedBytes = files.reduce((s, f) => s + f.fileSize, 0);
  return { files, usedBytes, limitGb };
}

export async function createB3File(
  supabase: SupabaseClient | null,
  companyId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
): Promise<B3FileRecord> {
  const aiTag = inferB3AiTag(fileName);
  const createdAt = new Date().toISOString();

  if (!supabase) {
    const row: B3FileRecord = {
      id: randomUUID(),
      companyId,
      fileName,
      fileUrl,
      fileSize,
      aiTag,
      createdAt,
    };
    return demoB3Insert(companyId, row);
  }

  const { data, error } = await supabase
    .from("b3_files")
    .insert({
      company_id: companyId,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      ai_tag: aiTag,
    })
    .select("*")
    .single();

  if (error || !data) {
    const row: B3FileRecord = {
      id: randomUUID(),
      companyId,
      fileName,
      fileUrl,
      fileSize,
      aiTag,
      createdAt,
    };
    return demoB3Insert(companyId, row);
  }

  return mapRow(data as Record<string, unknown>);
}
