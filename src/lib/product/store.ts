import bcrypt from "bcryptjs";

import { isSuperAdminEmail } from "@/lib/brand";
import { getSupabaseAdmin } from "@/lib/supabase/server";

import { GB, PARTNER_PLAN, PARTNER_PRODUCTS, planLabel, productForQuota, rupee, rupeesToPaise } from "./money";
import { sessionUserId } from "./session";

export type Role = "super_admin" | "partner" | "company_admin" | "employee";

export type ProductUser = {
  id: string;
  email: string;
  name: string;
  mobile: string;
  whatsapp: string;
  role: Role;
  state: string;
  city: string;
  status: string;
  partner_id: string | null;
  company_id: string | null;
  storage_gb: number;
  created_at: string;
};

type CompanyRow = {
  id: string;
  partner_id: string;
  name: string;
  admin_user_id: string | null;
  yearly_paise: number;
  monthly_paise: number;
  cycle: "monthly" | "yearly" | "both";
  allocated_ids: number;
  allocated_gb: number;
  demo_started_at: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
};

const SCHEMA_HINT =
  "Supabase tables abhi nahi bani. Supabase SQL editor me supabase/migrations/041_bc_product.sql chalao.";

function admin() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase service role set nahi hai.");
  return supabase;
}

function fail(error: { message: string } | null): never {
  if (error && /relation|does not exist|schema cache/i.test(error.message)) {
    throw new Error(SCHEMA_HINT);
  }
  throw new Error(error?.message || "Database error");
}

export async function loadSession() {
  try {
    return { user: await currentUser(), error: "" };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : "Page nahi khuli." };
  }
}

export async function currentUser() {
  const id = await sessionUserId();
  if (!id) return null;
  const { data, error } = await admin().from("bc_users").select("*").eq("id", id).maybeSingle();
  if (error) fail(error);
  if (!data) return null;
  return publicUser(data);
}

function publicUser(row: ProductUser & { password_hash?: string }): ProductUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    mobile: row.mobile,
    whatsapp: row.whatsapp,
    role: row.role,
    state: row.state,
    city: row.city,
    status: row.status,
    partner_id: row.partner_id,
    company_id: row.company_id,
    storage_gb: row.storage_gb,
    created_at: row.created_at,
  };
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  mobile: string;
  whatsapp: string;
  state: string;
  city: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const mobile = input.mobile.replace(/\D/g, "").slice(-10);
  const whatsapp = (input.whatsapp || input.mobile).replace(/\D/g, "").slice(-10);
  if (!name || !email || !input.password || input.password.length < 6) {
    throw new Error("Naam, email aur password (6+) zaroori hai.");
  }
  if (mobile.length !== 10 || whatsapp.length !== 10) {
    throw new Error("Mobile aur WhatsApp 10 digit ka hona chahiye.");
  }
  if (!input.state.trim() || !input.city.trim()) {
    throw new Error("State aur city likho.");
  }
  const superAdmin = isSuperAdminEmail(email);
  const password_hash = await bcrypt.hash(input.password, 10);
  const { data: user, error } = await admin()
    .from("bc_users")
    .insert({
      email,
      password_hash,
      name,
      mobile,
      whatsapp,
      role: superAdmin ? "super_admin" : "partner",
      state: input.state.trim(),
      city: input.city.trim(),
      status: superAdmin ? "active" : "pending",
    })
    .select("*")
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error("Ye email pehle se hai. Login karo.");
    fail(error);
  }
  if (!superAdmin) {
    const { data: partner, error: partnerError } = await admin()
      .from("bc_partners")
      .insert({ user_id: user.id, buy_price_paise: PARTNER_PLAN.pricePaise })
      .select("*")
      .single();
    if (partnerError) fail(partnerError);
    const { error: linkError } = await admin().from("bc_users").update({ partner_id: partner.id }).eq("id", user.id);
    if (linkError) fail(linkError);
  }
  return publicUser(user);
}

export async function loginAccount(email: string, password: string) {
  const { data, error } = await admin()
    .from("bc_users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error("Email ya password galat hai.");
  const match = await bcrypt.compare(password, data.password_hash);
  if (!match) throw new Error("Email ya password galat hai.");
  if (data.role === "partner" && data.status === "rejected") {
    throw new Error("Partner request reject ho chuki hai.");
  }
  if (data.role === "partner" && data.status === "pending") {
    throw new Error("Super Admin ke approve ka wait karo. WhatsApp pe update aayega.");
  }
  return publicUser(data);
}

async function requireRole(roles: Role[]) {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) throw new Error("Permission nahi hai.");
  return user;
}

export async function superOverview() {
  return loadSuper();
}

async function loadSuper() {
  await requireRole(["super_admin"]);
  const db = admin();
  const { data: partnerRows, error } = await db.from("bc_partners").select("*").order("created_at", { ascending: false });
  if (error) fail(error);
  const { data: users, error: userError } = await db.from("bc_users").select("*").eq("role", "partner");
  if (userError) fail(userError);
  const { data: companies, error: companyError } = await db.from("bc_companies").select("*").order("created_at", { ascending: false });
  if (companyError) fail(companyError);
  const { data: payments, error: payError } = await db.from("bc_payments").select("*").order("created_at", { ascending: false });
  if (payError) fail(payError);
  const { data: commissions, error: commissionError } = await db.from("bc_commissions").select("*");
  if (commissionError) fail(commissionError);
  const byUser = new Map((users || []).map((row) => [row.id, publicUser(row)]));
  const confirmed = (payments || []).filter((row) => row.status === "confirmed");
  return {
    partners: (partnerRows || []).map((partner) => ({
      ...partner,
      user: byUser.get(partner.user_id) || null,
    })),
    companies: companies || [],
    payments: payments || [],
    commissions: commissions || [],
    pendingPartners: (partnerRows || []).filter((partner) => byUser.get(partner.user_id)?.status === "pending"),
    stats: {
      partners: (partnerRows || []).length,
      companies: (companies || []).length,
      revenuePaise: confirmed.reduce((sum, row) => sum + Number(row.amount_paise), 0),
      pendingApprovals: (users || []).filter((row) => row.status === "pending").length,
      pendingCommissionPaise: (commissions || [])
        .filter((row) => row.status === "pending")
        .reduce((sum, row) => sum + Number(row.amount_paise), 0),
    },
  };
}

export async function reviewPartner(partnerId: string, action: "approve" | "reject") {
  await requireRole(["super_admin"]);
  const db = admin();
  const { data: partner, error } = await db.from("bc_partners").select("*").eq("id", partnerId).maybeSingle();
  if (error) fail(error);
  if (!partner) throw new Error("Partner nahi mila.");
  const status = action === "approve" ? "approved" : "rejected";
  const { error: updateError } = await db.from("bc_users").update({ status }).eq("id", partner.user_id);
  if (updateError) fail(updateError);
  const { data: person, error: personError } = await db.from("bc_users").select("*").eq("id", partner.user_id).single();
  if (personError) fail(personError);
  const phone = String(person.whatsapp || person.mobile || "").replace(/\D/g, "").slice(-10);
  const text =
    action === "approve"
      ? `Namaste ${person.name}, BharatCloud partner approve ho gaya. Login karke Starter plan ₹6,999 / Year lo.`
      : `Namaste ${person.name}, BharatCloud partner request abhi approve nahi hui.`;
  return {
    whatsapp: phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : "",
    status,
  };
}

export async function submitPayment(input: { kind: "partner_plan" | "company_plan"; upiRef: string; cycle?: "monthly" | "yearly" }) {
  const user = await currentUser();
  if (!user) throw new Error("Login karo.");
  const upiRef = input.upiRef.trim();
  if (upiRef.length < 4) throw new Error("UPI reference likho.");
  const db = admin();
  if (input.kind === "partner_plan") {
    if (user.role !== "partner" || !user.partner_id) throw new Error("Sirf partner plan kharid sakta hai.");
    if (user.status !== "approved" && user.status !== "active") throw new Error("Pehle approve hona zaroori hai.");
    const { error } = await db.from("bc_payments").insert({
      kind: "partner_plan",
      user_id: user.id,
      partner_id: user.partner_id,
      amount_paise: PARTNER_PLAN.pricePaise,
      cycle: "yearly",
      upi_ref: upiRef,
    });
    if (error) fail(error);
    const { error: statusError } = await db.from("bc_partners").update({ payment_status: "pending" }).eq("id", user.partner_id);
    if (statusError) fail(statusError);
    return { ok: true };
  }
  if (user.role !== "company_admin" || !user.company_id) throw new Error("Company admin hi plan pay karega.");
  const company = await companyById(user.company_id);
  const cycle = input.cycle || (company.cycle === "monthly" ? "monthly" : "yearly");
  if (company.cycle !== "both" && company.cycle !== cycle) throw new Error("Ye billing option partner ne nahi di.");
  const amount = cycle === "monthly" ? company.monthly_paise : company.yearly_paise;
  const { error } = await db.from("bc_payments").insert({
    kind: "company_plan",
    user_id: user.id,
    partner_id: company.partner_id,
    company_id: company.id,
    amount_paise: amount,
    cycle,
    upi_ref: upiRef,
  });
  if (error) fail(error);
  const { error: statusError } = await db.from("bc_companies").update({ payment_status: "pending" }).eq("id", company.id);
  if (statusError) fail(statusError);
  return { ok: true };
}

export async function confirmPayment(paymentId: string) {
  await requireRole(["super_admin"]);
  const db = admin();
  const { data: payment, error } = await db.from("bc_payments").select("*").eq("id", paymentId).maybeSingle();
  if (error) fail(error);
  if (!payment) throw new Error("Payment nahi mili.");
  if (payment.status === "confirmed") return { ok: true };
  const { error: updateError } = await db.from("bc_payments").update({ status: "confirmed" }).eq("id", payment.id);
  if (updateError) fail(updateError);
  if (payment.kind === "partner_plan" && payment.partner_id) {
    const { error: partnerError } = await db
      .from("bc_partners")
      .update({ payment_status: "paid", total_ids: PARTNER_PLAN.ids, total_gb: PARTNER_PLAN.gb })
      .eq("id", payment.partner_id);
    if (partnerError) fail(partnerError);
  }
  if (payment.kind === "company_plan" && payment.company_id && payment.partner_id) {
    const { error: companyError } = await db
      .from("bc_companies")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.company_id);
    if (companyError) fail(companyError);
    const amount = Number(payment.amount_paise);
    const commission =
      payment.cycle === "monthly" ? amount - Math.round(PARTNER_PLAN.pricePaise / 10) : amount - PARTNER_PLAN.pricePaise;
    const { error: commissionError } = await db.from("bc_commissions").insert({
      partner_id: payment.partner_id,
      company_id: payment.company_id,
      payment_id: payment.id,
      amount_paise: commission,
    });
    if (commissionError) fail(commissionError);
  }
  return { ok: true };
}

export async function markCommissionPaid(commissionId: string) {
  await requireRole(["super_admin"]);
  const { error } = await admin().from("bc_commissions").update({ status: "paid" }).eq("id", commissionId);
  if (error) fail(error);
  return { ok: true };
}

async function partnerRow(partnerId: string) {
  const { data, error } = await admin().from("bc_partners").select("*").eq("id", partnerId).maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error("Partner record nahi mila.");
  return data;
}

async function companyById(id: string): Promise<CompanyRow> {
  const { data, error } = await admin().from("bc_companies").select("*").eq("id", id).maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error("Company nahi mili.");
  return data as CompanyRow;
}

function prices(yearlyRupees: number, monthlyRupees: number | undefined, cycle: "monthly" | "yearly" | "both") {
  const yearly = cycle === "monthly" ? Math.round((monthlyRupees || 0) * 10) : yearlyRupees;
  const monthly = cycle === "yearly" ? Math.round(yearly / 10) : monthlyRupees || Math.round(yearly / 10);
  if (!Number.isFinite(yearly) || !Number.isFinite(monthly) || yearly <= 0 || monthly <= 0) {
    throw new Error("Price 0 se zyada likho.");
  }
  return { yearly_paise: rupeesToPaise(yearly), monthly_paise: rupeesToPaise(monthly) };
}

export async function partnerOverview() {
  const user = await requireRole(["partner"]);
  const partner = await partnerRow(user.partner_id || "");
  const db = admin();
  const { data: companies, error } = await db.from("bc_companies").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
  if (error) fail(error);
  const { data: commissions, error: commissionError } = await db.from("bc_commissions").select("*").eq("partner_id", partner.id);
  if (commissionError) fail(commissionError);
  const usedIds = (companies || []).reduce((sum, row) => sum + Number(row.allocated_ids || 0), 0);
  const usedGb = (companies || []).reduce((sum, row) => sum + Number(row.allocated_gb || 0), 0);
  const totalIds = Number(partner.total_ids) || 0;
  const totalGb = Number(partner.total_gb) || 0;
  const owned = partner.payment_status === "paid" ? productForQuota(totalIds, totalGb) : null;
  const earning = (commissions || []).reduce((sum, row) => sum + Number(row.amount_paise), 0);
  const pending = (commissions || []).filter((row) => row.status === "pending").reduce((sum, row) => sum + Number(row.amount_paise), 0);
  const plan = {
    code: owned?.code || "",
    name: owned?.name || "Koi plan nahi",
    priceLabel: owned?.label || rupee(Number(partner.buy_price_paise) || 0),
    paymentStatus: partner.payment_status,
    totalIds,
    totalGb,
    usedIds,
    usedGb,
    leftIds: Math.max(0, totalIds - usedIds),
    leftGb: Math.max(0, totalGb - usedGb),
  };
  const products = PARTNER_PRODUCTS.map((product) => ({
    code: product.code,
    name: product.name,
    ids: product.ids,
    gb: product.gb,
    priceLabel: product.label,
    owned: owned?.code === product.code,
  }));
  return {
    user,
    plan,
    products,
    companies: (companies || []).map((company) => ({
      ...company,
      planLabel: planLabel(company.cycle, company.yearly_paise, company.monthly_paise),
      profitPaise: company.yearly_paise - PARTNER_PLAN.pricePaise,
    })),
    earningPaise: earning,
    pendingCommissionPaise: pending,
    upi: upiId(),
  };
}

function textField(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function numberField(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() === "") return NaN;
  return Number(value);
}

export async function createCompany(input: {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  cycle: "monthly" | "yearly" | "both";
  yearlyRupees: number;
  monthlyRupees?: number;
  ids: number;
  storageGb: number;
}) {
  const user = await requireRole(["partner"]);
  const partner = await partnerRow(user.partner_id || "");
  if (partner.payment_status !== "paid") throw new Error("Pehle Starter plan ka payment confirm hona chahiye.");
  const companyName = textField(input.companyName);
  const adminName = textField(input.adminName);
  const adminEmail = textField(input.adminEmail).toLowerCase();
  const adminPassword = typeof input.adminPassword === "string" ? input.adminPassword : "";
  const cycle = input.cycle === "monthly" || input.cycle === "both" ? input.cycle : "yearly";
  const yearlyRupees = numberField(input.yearlyRupees);
  const monthlyRupees = numberField(input.monthlyRupees);
  const ids = Math.floor(numberField(input.ids));
  const storageGb = Math.floor(numberField(input.storageGb));
  if (!companyName) throw new Error("Company ka naam likho.");
  if (!adminName) throw new Error("Admin ka naam likho.");
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error("Admin email sahi format me likho.");
  if (!adminPassword) throw new Error("Admin password likho.");
  if (adminPassword.length < 6) throw new Error("Admin password kam se kam 6 character ka hona chahiye.");
  if (!Number.isFinite(ids) || ids < 1) throw new Error("ID likho. Kam se kam 1 ID.");
  if (!Number.isFinite(storageGb) || storageGb < 1) throw new Error("Storage GB likho. Kam se kam 1 GB.");
  if (cycle === "yearly" && !(yearlyRupees > 0)) throw new Error("Yearly price likho, jaise 8999.");
  if (cycle === "monthly" && !(monthlyRupees > 0)) throw new Error("Monthly price likho, jaise 899.");
  if (cycle === "both" && !(yearlyRupees > 0) && !(monthlyRupees > 0)) {
    throw new Error("Yearly ya monthly price likho.");
  }
  const overview = await partnerOverview();
  if (ids > overview.plan.leftIds || storageGb > overview.plan.leftGb) {
    const error = new Error(
      `Bacha hua quota: ${overview.plan.leftIds} ID / ${overview.plan.leftGb} GB. Total ${overview.plan.totalIds} ID / ${overview.plan.totalGb} GB, used ${overview.plan.usedIds} ID / ${overview.plan.usedGb} GB.`,
    );
    (error as Error & { plan: typeof overview.plan }).plan = overview.plan;
    throw error;
  }
  const derivedYearly = yearlyRupees > 0 ? yearlyRupees : Math.round(monthlyRupees * 10);
  const derivedMonthly = monthlyRupees > 0 ? monthlyRupees : Math.round(derivedYearly / 10);
  const price = { yearly_paise: rupeesToPaise(derivedYearly), monthly_paise: rupeesToPaise(derivedMonthly) };
  const db = admin();
  const { data: company, error } = await db
    .from("bc_companies")
    .insert({
      partner_id: partner.id,
      name: companyName,
      yearly_paise: price.yearly_paise,
      monthly_paise: price.monthly_paise,
      cycle,
      allocated_ids: ids,
      allocated_gb: storageGb,
    })
    .select("*")
    .single();
  if (error) fail(error);
  const password_hash = await bcrypt.hash(adminPassword, 10);
  const { data: adminUser, error: adminError } = await db
    .from("bc_users")
    .insert({
      email: adminEmail,
      password_hash,
      name: adminName,
      role: "company_admin",
      status: "active",
      partner_id: partner.id,
      company_id: company.id,
    })
    .select("*")
    .single();
  if (adminError) {
    await db.from("bc_companies").delete().eq("id", company.id);
    if (/duplicate|unique/i.test(adminError.message)) throw new Error("Admin email pehle se hai.");
    fail(adminError);
  }
  const { error: linkError } = await db.from("bc_companies").update({ admin_user_id: adminUser.id }).eq("id", company.id);
  if (linkError) fail(linkError);
  return { companyId: company.id };
}

export async function updateCompanyOffer(input: {
  companyId: string;
  cycle: "monthly" | "yearly" | "both";
  yearlyRupees: number;
  monthlyRupees?: number;
  ids: number;
  storageGb: number;
}) {
  const user = await requireRole(["partner"]);
  const company = await companyById(input.companyId);
  if (company.partner_id !== user.partner_id) throw new Error("Ye company aapki nahi hai.");
  const overview = await partnerOverview();
  const ids = Math.floor(input.ids);
  const storageGb = Math.floor(input.storageGb);
  const extraIds = ids - company.allocated_ids;
  const extraGb = storageGb - company.allocated_gb;
  if (extraIds > overview.plan.leftIds || extraGb > overview.plan.leftGb) {
    throw new Error("Itna ID ya storage bacha nahi hai.");
  }
  const usage = await companyUsage(company.id);
  if (ids < usage.usedIds || storageGb < usage.usedGb) {
    throw new Error(`Company use kar chuki hai: ${usage.usedIds} ID / ${usage.usedGb} GB.`);
  }
  const { data: members, error: memberError } = await admin().from("bc_users").select("id").eq("company_id", company.id);
  if (memberError) fail(memberError);
  let stored = 0;
  for (const member of members || []) stored += await usedBytes(member.id);
  if (stored > storageGb * GB) throw new Error("Company me itna data pehle se pada hai. Storage kam nahi kar sakte.");
  const price = prices(input.yearlyRupees, input.monthlyRupees, input.cycle);
  const { error } = await admin()
    .from("bc_companies")
    .update({
      cycle: input.cycle,
      yearly_paise: price.yearly_paise,
      monthly_paise: price.monthly_paise,
      allocated_ids: ids,
      allocated_gb: storageGb,
    })
    .eq("id", company.id);
  if (error) fail(error);
  return { ok: true };
}

async function companyUsage(companyId: string) {
  const { data, error } = await admin().from("bc_users").select("role, storage_gb").eq("company_id", companyId);
  if (error) fail(error);
  const employees = (data || []).filter((row) => row.role === "employee");
  return {
    usedIds: 1 + employees.length,
    usedGb: employees.reduce((sum, row) => sum + Number(row.storage_gb), 0),
    employees,
  };
}

export function companyAccess(company: CompanyRow) {
  if (company.payment_status === "paid") return "full" as const;
  const end = new Date(company.demo_started_at).getTime() + 7 * 24 * 60 * 60 * 1000;
  if (Date.now() <= end) return "demo" as const;
  return "locked" as const;
}

export async function workspaceOverview() {
  const user = await requireRole(["company_admin", "employee"]);
  if (!user.company_id) throw new Error("Company link nahi hai.");
  const company = await companyById(user.company_id);
  const db = admin();
  const { data: people, error } = await db.from("bc_users").select("*").eq("company_id", company.id).order("created_at", { ascending: true });
  if (error) fail(error);
  const employees = (people || []).filter((row) => row.role === "employee").map((row) => publicUser(row));
  const usage = await usageFor(user, company, employees);
  const { data: notes, error: noteError } = await db
    .from("bc_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (noteError) fail(noteError);
  const demoEnds = new Date(new Date(company.demo_started_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    user,
    company: {
      id: company.id,
      name: company.name,
      planLabel: planLabel(company.cycle, company.yearly_paise, company.monthly_paise),
      cycle: company.cycle,
      yearlyPaise: company.yearly_paise,
      monthlyPaise: company.monthly_paise,
      allocatedIds: company.allocated_ids,
      allocatedGb: company.allocated_gb,
      usedIds: 1 + employees.length,
      usedGb: employees.reduce((sum, row) => sum + row.storage_gb, 0),
      paymentStatus: company.payment_status,
      access: companyAccess(company),
      demoEnds,
    },
    employees,
    usage,
    notifications: notes || [],
    upi: upiId(),
  };
}

async function usageFor(user: ProductUser, company: CompanyRow, employees: ProductUser[]) {
  const limitGb =
    user.role === "employee"
      ? user.storage_gb
      : Math.max(0, company.allocated_gb - employees.reduce((sum, row) => sum + row.storage_gb, 0));
  const used = await usedBytes(user.id);
  return { limitBytes: limitGb * GB, usedBytes: used, limitGb };
}

async function usedBytes(userId: string) {
  const db = admin();
  const { data: files, error } = await db.from("bc_files").select("size_bytes").eq("owner_id", userId);
  if (error) fail(error);
  const { data: backups, error: backupError } = await db.from("bc_email_backups").select("size_bytes").eq("user_id", userId);
  if (backupError) fail(backupError);
  return (
    (files || []).reduce((sum, row) => sum + Number(row.size_bytes), 0) +
    (backups || []).reduce((sum, row) => sum + Number(row.size_bytes), 0)
  );
}

export async function createEmployee(input: { name: string; email: string; password: string; storageGb: number }) {
  const user = await requireRole(["company_admin"]);
  const company = await companyById(user.company_id || "");
  assertOpen(company);
  const storageGb = Math.floor(input.storageGb);
  if (!input.name.trim() || input.password.length < 6 || storageGb < 1) {
    throw new Error("Naam, password aur storage GB likho.");
  }
  const overview = await workspaceOverview();
  if (overview.company.usedIds + 1 > company.allocated_ids) throw new Error("ID quota khatam. Partner se ID lo.");
  const assigned = overview.company.usedGb;
  if (assigned + storageGb > company.allocated_gb) throw new Error("Storage quota kam pad raha hai.");
  const password_hash = await bcrypt.hash(input.password, 10);
  const { error } = await admin().from("bc_users").insert({
    email: input.email.trim().toLowerCase(),
    password_hash,
    name: input.name.trim(),
    role: "employee",
    status: "active",
    partner_id: company.partner_id,
    company_id: company.id,
    storage_gb: storageGb,
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error("Employee email pehle se hai.");
    fail(error);
  }
  return { ok: true };
}

function upiId() {
  return process.env.NEXT_PUBLIC_BILLING_UPI_VPA || process.env.BILLING_UPI_VPA || "";
}

function assertOpen(company: CompanyRow) {
  if (companyAccess(company) === "locked") {
    throw new Error("7 din ka demo khatam. Plan pay karke aage badho.");
  }
}

async function visibleFiles(user: ProductUser) {
  const db = admin();
  const { data: files, error } = await db.from("bc_files").select("*").eq("company_id", user.company_id).limit(500);
  if (error) fail(error);
  const { data: shares, error: shareError } = await db.from("bc_shares").select("*").eq("company_id", user.company_id);
  if (shareError) fail(shareError);
  const { data: stars, error: starError } = await db.from("bc_stars").select("file_id").eq("user_id", user.id);
  if (starError) fail(starError);
  const starSet = new Set((stars || []).map((row) => row.file_id));
  const sharedWithMe = new Set(
    (shares || []).filter((row) => row.shared_with === user.id).map((row) => row.file_id),
  );
  const list = (files || []).filter((file) => {
    if (user.role === "company_admin") return true;
    if (file.owner_id === user.id) return true;
    return sharedWithMe.has(file.id);
  });
  return { files: list, shares: shares || [], starred: starSet };
}

export async function driveList(filter: string, folderId: string | null, query: string) {
  const user = await requireRole(["company_admin", "employee"]);
  const company = await companyById(user.company_id || "");
  const { files, shares, starred } = await visibleFiles(user);
  const people = await companyPeople(company.id);
  let rows = files;
  if (filter === "trash") rows = files.filter((file) => file.trashed_at && (user.role === "company_admin" || file.owner_id === user.id));
  else {
    rows = files.filter((file) => !file.trashed_at);
    if (filter === "recent") rows = [...rows].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 40);
    else if (filter === "starred") rows = rows.filter((file) => starred.has(file.id));
    else if (filter === "shared") {
      const ids = new Set(shares.filter((row) => row.shared_with === user.id).map((row) => row.file_id));
      rows = rows.filter((file) => ids.has(file.id));
    } else if (filter === "search") {
      const q = query.trim().toLowerCase();
      rows = rows.filter((file) => file.name.toLowerCase().includes(q));
    } else {
      rows = rows.filter((file) => (file.parent_id || null) === (folderId || null));
    }
  }
  const employees = people.filter((person) => person.role === "employee");
  const usage = await usageFor(user, company, employees);
  return {
    access: companyAccess(company),
    files: rows.map((file) => ({ ...file, starred: starred.has(file.id) })),
    usage,
    people: people.map((person) => ({ id: person.id, name: person.name, email: person.email, role: person.role })),
    breadcrumb: breadcrumb(files, folderId),
  };
}

function breadcrumb(files: { id: string; name: string; parent_id: string | null }[], folderId: string | null) {
  const trail: { id: string | null; name: string }[] = [{ id: null, name: "My Drive" }];
  const chain: { id: string; name: string }[] = [];
  let current = folderId;
  const guard = new Set<string>();
  while (current && !guard.has(current)) {
    guard.add(current);
    const folder = files.find((file) => file.id === current);
    if (!folder) break;
    chain.push({ id: folder.id, name: folder.name });
    current = folder.parent_id;
  }
  return trail.concat(chain.reverse());
}

async function companyPeople(companyId: string) {
  const { data, error } = await admin().from("bc_users").select("*").eq("company_id", companyId);
  if (error) fail(error);
  return (data || []).map((row) => publicUser(row));
}

async function assertCanWrite(user: ProductUser, parentId: string | null) {
  const company = await companyById(user.company_id || "");
  assertOpen(company);
  if (!parentId) return;
  const { data: parent, error } = await admin().from("bc_files").select("*").eq("id", parentId).maybeSingle();
  if (error) fail(error);
  if (!parent || parent.kind !== "folder" || parent.company_id !== user.company_id) throw new Error("Folder nahi mila.");
  if (!(await canEdit(user, parent))) throw new Error("Is folder me likhne ki permission nahi hai.");
}

async function canEdit(user: ProductUser, file: { id: string; owner_id: string; company_id: string }) {
  if (user.role === "company_admin" && file.company_id === user.company_id) return true;
  if (file.owner_id === user.id) return true;
  const { data, error } = await admin().from("bc_shares").select("permission").eq("file_id", file.id).eq("shared_with", user.id);
  if (error) fail(error);
  return (data || []).some((row) => row.permission === "edit");
}

export async function createFolder(name: string, parentId: string | null) {
  const user = await requireRole(["company_admin", "employee"]);
  const clean = name.trim();
  if (!clean) throw new Error("Folder ka naam likho.");
  await assertCanWrite(user, parentId);
  const { data, error } = await admin()
    .from("bc_files")
    .insert({
      company_id: user.company_id,
      owner_id: user.id,
      parent_id: parentId,
      name: clean,
      kind: "folder",
    })
    .select("*")
    .single();
  if (error) fail(error);
  return data;
}

export async function addFile(input: {
  name: string;
  parentId: string | null;
  size: number;
  mime: string;
  path: string;
}) {
  const user = await requireRole(["company_admin", "employee"]);
  await assertCanWrite(user, input.parentId);
  const company = await companyById(user.company_id || "");
  const people = await companyPeople(company.id);
  const usage = await usageFor(
    user,
    company,
    people.filter((person) => person.role === "employee"),
  );
  if (usage.usedBytes + input.size > usage.limitBytes) {
    throw new Error("Storage full hai. Drive aur Email Backup ek hi quota me aate hain.");
  }
  const { data, error } = await admin()
    .from("bc_files")
    .insert({
      company_id: user.company_id,
      owner_id: user.id,
      parent_id: input.parentId,
      name: input.name,
      kind: "file",
      size_bytes: input.size,
      storage_path: input.path,
      mime: input.mime,
    })
    .select("*")
    .single();
  if (error) fail(error);
  return data;
}

export async function removeStoredFile(path: string) {
  await admin().storage.from("bc-drive").remove([path]);
}

export async function toggleStar(fileId: string) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, fileId);
  if (!file) throw new Error("File nahi mili.");
  const db = admin();
  const { data, error } = await db.from("bc_stars").select("file_id").eq("user_id", user.id).eq("file_id", fileId).maybeSingle();
  if (error) fail(error);
  if (data) {
    const { error: deleteError } = await db.from("bc_stars").delete().eq("user_id", user.id).eq("file_id", fileId);
    if (deleteError) fail(deleteError);
    return { starred: false };
  }
  const { error: insertError } = await db.from("bc_stars").insert({ user_id: user.id, file_id: fileId });
  if (insertError) fail(insertError);
  return { starred: true };
}

export async function moveTrash(fileId: string, restore: boolean) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, fileId);
  if (!file) throw new Error("File nahi mili.");
  if (user.role !== "company_admin" && file.owner_id !== user.id && !(await canEdit(user, file))) {
    throw new Error("Trash ki permission nahi hai.");
  }
  const { error } = await admin()
    .from("bc_files")
    .update({ trashed_at: restore ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", fileId);
  if (error) fail(error);
  return { ok: true };
}

async function ownCompanyFile(user: ProductUser, fileId: string) {
  const { data, error } = await admin().from("bc_files").select("*").eq("id", fileId).maybeSingle();
  if (error) fail(error);
  if (!data || data.company_id !== user.company_id) return null;
  if (user.role === "company_admin" || data.owner_id === user.id) return data;
  const { data: share, error: shareError } = await admin()
    .from("bc_shares")
    .select("id")
    .eq("file_id", fileId)
    .eq("shared_with", user.id)
    .maybeSingle();
  if (shareError) fail(shareError);
  return share ? data : null;
}

export async function fileForDownload(fileId: string) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, fileId);
  if (!file || file.kind !== "file" || !file.storage_path) throw new Error("Download ke liye file nahi mili.");
  if (user.role !== "company_admin" && file.owner_id !== user.id) {
    const { data, error } = await admin().from("bc_shares").select("permission").eq("file_id", fileId).eq("shared_with", user.id);
    if (error) fail(error);
    if (!(data || []).some((row) => row.permission === "download")) throw new Error("Download permission nahi hai.");
  }
  await admin().from("bc_activity").insert({ file_id: fileId, actor_id: user.id, action: "download" });
  const { data: signed, error: signError } = await admin().storage.from("bc-drive").createSignedUrl(file.storage_path, 60);
  if (signError || !signed) throw new Error(signError?.message || "Download link nahi bana.");
  return { url: signed.signedUrl, name: file.name };
}

export async function shareFile(input: { fileId: string; userIds: string[]; permission: string; linkEnabled: boolean }) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, input.fileId);
  if (!file) throw new Error("File nahi mili.");
  if (user.role !== "company_admin" && file.owner_id !== user.id) throw new Error("Share sirf owner ya company admin karega.");
  const permission = ["view", "comment", "edit", "download"].includes(input.permission) ? input.permission : "view";
  const people = await companyPeople(user.company_id || "");
  const allowed = new Set(people.map((person) => person.id));
  const db = admin();
  for (const personId of input.userIds) {
    if (!allowed.has(personId) || personId === user.id) continue;
    const { data: existing, error } = await db
      .from("bc_shares")
      .select("id")
      .eq("file_id", file.id)
      .eq("shared_with", personId)
      .maybeSingle();
    if (error) fail(error);
    if (existing) {
      const { error: updateError } = await db.from("bc_shares").update({ permission }).eq("id", existing.id);
      if (updateError) fail(updateError);
    } else {
      const { error: insertError } = await db.from("bc_shares").insert({
        file_id: file.id,
        company_id: user.company_id,
        shared_by: user.id,
        shared_with: personId,
        permission,
      });
      if (insertError) fail(insertError);
      await db.from("bc_notifications").insert({
        user_id: personId,
        message: `Aapke saath ek file share hui hai: ${file.name}`,
      });
    }
  }
  await setLink(file.id, user, input.linkEnabled, permission);
  return shareBoard(file.id, user);
}

async function setLink(fileId: string, user: ProductUser, enabled: boolean, permission: string) {
  const db = admin();
  const { data, error } = await db.from("bc_shares").select("*").eq("file_id", fileId).is("shared_with", null).maybeSingle();
  if (error) fail(error);
  if (!data) {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error: insertError } = await db.from("bc_shares").insert({
      file_id: fileId,
      company_id: user.company_id,
      shared_by: user.id,
      link_token: token,
      link_enabled: enabled,
      permission,
    });
    if (insertError) fail(insertError);
    return;
  }
  const { error: updateError } = await db
    .from("bc_shares")
    .update({ link_enabled: enabled, permission, link_token: data.link_token || crypto.randomUUID().replace(/-/g, "") })
    .eq("id", data.id);
  if (updateError) fail(updateError);
}

export async function shareBoard(fileId: string, user = null as ProductUser | null) {
  const actor = user || (await requireRole(["company_admin", "employee"]));
  const file = await ownCompanyFile(actor, fileId);
  if (!file) throw new Error("File nahi mili.");
  const db = admin();
  const { data: shares, error } = await db.from("bc_shares").select("*").eq("file_id", fileId).order("created_at", { ascending: false });
  if (error) fail(error);
  const { data: activity, error: activityError } = await db.from("bc_activity").select("*").eq("file_id", fileId).order("created_at", { ascending: false }).limit(30);
  if (activityError) fail(activityError);
  const { data: comments, error: commentError } = await db.from("bc_comments").select("*").eq("file_id", fileId).order("created_at", { ascending: true });
  if (commentError) fail(commentError);
  const people = await companyPeople(actor.company_id || "");
  const byId = new Map(people.map((person) => [person.id, person]));
  return {
    file: { id: file.id, name: file.name, kind: file.kind },
    shares: (shares || []).map((share) => ({
      ...share,
      person: share.shared_with ? byId.get(share.shared_with) || null : null,
    })),
    activity: (activity || []).map((row) => ({
      ...row,
      actor: row.actor_id ? byId.get(row.actor_id)?.name || "User" : "User",
    })),
    comments: (comments || []).map((row) => ({ ...row, author: byId.get(row.user_id)?.name || "User" })),
  };
}

export async function updateShare(input: { shareId?: string; fileId: string; permission?: string; remove?: boolean; removeAll?: boolean; linkEnabled?: boolean }) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, input.fileId);
  if (!file || (user.role !== "company_admin" && file.owner_id !== user.id)) throw new Error("Manage share ki permission nahi hai.");
  const db = admin();
  if (input.removeAll) {
    const { error } = await db.from("bc_shares").delete().eq("file_id", input.fileId);
    if (error) fail(error);
    return shareBoard(input.fileId, user);
  }
  if (input.shareId && input.remove) {
    const { error } = await db.from("bc_shares").delete().eq("id", input.shareId).eq("file_id", input.fileId);
    if (error) fail(error);
  } else if (input.shareId && input.permission) {
    const { error } = await db.from("bc_shares").update({ permission: input.permission }).eq("id", input.shareId);
    if (error) fail(error);
  }
  if (typeof input.linkEnabled === "boolean") {
    const { error } = await db.from("bc_shares").update({ link_enabled: input.linkEnabled }).eq("file_id", input.fileId).is("shared_with", null);
    if (error) fail(error);
  }
  return shareBoard(input.fileId, user);
}

export async function addComment(fileId: string, body: string) {
  const user = await requireRole(["company_admin", "employee"]);
  const text = body.trim();
  if (!text) throw new Error("Comment likho.");
  const file = await ownCompanyFile(user, fileId);
  if (!file) throw new Error("File nahi mili.");
  if (user.role !== "company_admin" && file.owner_id !== user.id) {
    const { data, error } = await admin().from("bc_shares").select("permission").eq("file_id", fileId).eq("shared_with", user.id);
    if (error) fail(error);
    if (!(data || []).some((row) => row.permission === "comment" || row.permission === "edit")) {
      throw new Error("Comment ki permission nahi hai.");
    }
  }
  const { error } = await admin().from("bc_comments").insert({ file_id: fileId, user_id: user.id, body: text });
  if (error) fail(error);
  await admin().from("bc_activity").insert({ file_id: fileId, actor_id: user.id, action: "comment" });
  return shareBoard(fileId, user);
}

export async function markOpened(fileId: string) {
  const user = await requireRole(["company_admin", "employee"]);
  const file = await ownCompanyFile(user, fileId);
  if (!file) return { ok: false };
  await admin().from("bc_activity").insert({ file_id: fileId, actor_id: user.id, action: "open" });
  return { ok: true };
}

export async function listBackups() {
  const user = await requireRole(["company_admin", "employee"]);
  const company = await companyById(user.company_id || "");
  let query = admin().from("bc_email_backups").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
  if (user.role === "employee") query = query.eq("user_id", user.id);
  const { data, error } = await query;
  if (error) fail(error);
  const rows = data || [];
  const mine = rows.filter((row) => row.user_id === user.id);
  const people = await companyPeople(company.id);
  const usage = await usageFor(
    user,
    company,
    people.filter((person) => person.role === "employee"),
  );
  return {
    access: companyAccess(company),
    backups: user.role === "company_admin" ? rows : mine,
    lastBackup: mine[0]?.created_at || rows[0]?.created_at || null,
    totalBytes: (user.role === "company_admin" ? rows : mine).reduce((sum, row) => sum + Number(row.size_bytes), 0),
    usage,
  };
}

export async function addBackup(input: { subject: string; fromEmail: string; size: number; path: string }) {
  const user = await requireRole(["company_admin", "employee"]);
  const company = await companyById(user.company_id || "");
  assertOpen(company);
  const people = await companyPeople(company.id);
  const usage = await usageFor(
    user,
    company,
    people.filter((person) => person.role === "employee"),
  );
  if (usage.usedBytes + input.size > usage.limitBytes) {
    throw new Error("Storage full hai. Email Backup bhi isi quota me save hota hai.");
  }
  const { error } = await admin().from("bc_email_backups").insert({
    company_id: company.id,
    user_id: user.id,
    subject: input.subject.trim() || "Email backup",
    from_email: input.fromEmail.trim(),
    size_bytes: input.size,
    storage_path: input.path,
  });
  if (error) fail(error);
  return { ok: true };
}

export async function openLink(token: string) {
  const { data: share, error } = await admin().from("bc_shares").select("*").eq("link_token", token).maybeSingle();
  if (error) fail(error);
  if (!share || !share.link_enabled) throw new Error("Ye link band hai.");
  const actor = await currentUser();
  if (actor && (actor.role === "partner" || actor.role === "super_admin")) {
    throw new Error("Partner aur Super Admin ko files dekhne ki permission nahi hai.");
  }
  const { data: file, error: fileError } = await admin().from("bc_files").select("*").eq("id", share.file_id).maybeSingle();
  if (fileError) fail(fileError);
  if (!file || file.trashed_at) throw new Error("File maujood nahi hai.");
  let url = "";
  if (file.kind === "file" && share.permission === "download" && file.storage_path) {
    const signed = await admin().storage.from("bc-drive").createSignedUrl(file.storage_path, 60);
    url = signed.data?.signedUrl || "";
  }
  return {
    name: file.name,
    kind: file.kind,
    permission: share.permission,
    size: file.size_bytes,
    url,
  };
}

export async function ensureDriveBucket() {
  const { data } = await admin().storage.getBucket("bc-drive");
  if (!data) {
    const { error } = await admin().storage.createBucket("bc-drive", { public: false });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  }
}

export { PARTNER_PLAN };
