import { getSupabaseOrNull } from "@/lib/workspace/db";

  const supabase = await getSupabaseOrNull();
  let companies: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("organizations").select("id, name, domain, total_storage_gb, per_user_gb, max_users, storage_plan, storage_used_gb").limit(50);
    companies = (data || []).map((c: any) => ({
      name: c.name || c.domain || c.id,
      email: c.domain || c.id,
      plan: c.storage_plan || "Free",
      storage: `${c.total_storage_gb || 50} GB (Per user: ${c.per_user_gb || 10} GB)`,
      rawStorage: c.total_storage_gb || 50,
      status: "Active",
    }));
  }
  // Fallback agar DB empty ho
  if (companies.length === 0) {
    companies = [
      { name: "GoJRM Courier", email: "rajouriodh@gojrmcourier.com", plan: "Pro", storage: "50 GB", status: "Active" },
    ];
  }