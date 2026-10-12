#!/usr/bin/env node
/**
 * List company users for handoff checklist.
 * Usage: node scripts/verify-client-tenant.mjs gorjrmcourier.com
 */
import { createClient } from "@supabase/supabase-js";

const domain = (process.argv[2] || "gorjrmcourier.com").toLowerCase();
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: company, error: cErr } = await supabase
  .from("companies")
  .select("id, domain, admin_email, subscription_status")
  .eq("domain", domain)
  .maybeSingle();

if (cErr) {
  console.error(cErr.message);
  process.exit(1);
}
if (!company) {
  console.error(`No company for domain: ${domain}`);
  process.exit(1);
}

const { data: users, error: uErr } = await supabase
  .from("company_users")
  .select("email, role, saas_role, display_name")
  .eq("company_id", company.id)
  .order("email");

if (uErr) {
  console.error(uErr.message);
  process.exit(1);
}

console.log("\n=== BharatCloud tenant handoff ===\n");
console.log("Domain:", company.domain);
console.log("Admin:", company.admin_email);
console.log("Subscription:", company.subscription_status ?? "(null)");
console.log("\n--- Users (tick login / drive / backup per employee) ---\n");

const sorted = [...(users || [])].sort((a, b) => {
  if (a.email === company.admin_email) return -1;
  if (b.email === company.admin_email) return 1;
  return a.email.localeCompare(b.email);
});

sorted.forEach((u, i) => {
  const tag = u.email === company.admin_email ? "OWNER" : `EMP-${i}`;
  console.log(`[ ] ${tag}  ${u.email}  (${u.role}${u.saas_role ? ` / ${u.saas_role}` : ""})`);
});

const staff = sorted.filter((u) => u.email !== company.admin_email);
if (staff.length < 3) {
  console.log(`\nNote: only ${staff.length} employee(s) in DB — invite ${3 - staff.length} more on Team page.`);
}

console.log("\nHandoff doc: docs/clients/GORJRM_HANDOFF.md\n");
