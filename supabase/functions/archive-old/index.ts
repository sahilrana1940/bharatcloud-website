import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const COLD = "bharatcloud-cold";
const HOT_BUCKETS = ["bharatcloud-personal-hot", "bharatcloud-company-hot"];
const COLD_AFTER_DAYS = 30;

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COLD_AFTER_DAYS);

  const { data: rows, error } = await supabase
    .from("personal_vault")
    .select("*")
    .eq("storage_tier", "hot")
    .eq("is_deleted", false)
    .lt("created_at", cutoff.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let moved = 0;
  for (const row of rows || []) {
    const hotPath = row.hot_path as string;
    if (!hotPath) continue;
    const bucket = row.company_domain ? HOT_BUCKETS[1] : HOT_BUCKETS[0];

    const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(hotPath);
    if (dlErr || !blob) continue;

    const { error: upErr } = await supabase.storage
      .from(COLD)
      .upload(hotPath, blob, { upsert: true, contentType: row.mime_type || undefined });
    if (upErr) continue;

    await supabase
      .from("personal_vault")
      .update({ storage_tier: "cold", cold_path: hotPath })
      .eq("id", row.id);

    await supabase.storage.from(bucket).remove([hotPath]);
    moved += 1;
  }

  return new Response(JSON.stringify({ ok: true, moved }), {
    headers: { "Content-Type": "application/json" },
  });
});
