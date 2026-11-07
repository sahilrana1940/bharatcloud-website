/**
 * Reset a Supabase Auth password with the Admin API.
 * Does not SQL-update auth.users.confirmed_at (that column is generated).
 *
 * Usage:
 *   node scripts/reset-supabase-auth-user.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function findUser(admin, email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => (user.email || "").toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureEmailIdentity(url, serviceKey, user) {
  const identities = user.identities || [];
  const hasEmail = identities.some((row) => row.provider === "email");
  if (hasEmail) {
    return { created: false, providers: identities.map((row) => row.provider) };
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    "Content-Profile": "auth",
    Accept: "application/json",
  };
  const body = {
    user_id: user.id,
    provider: "email",
    provider_id: user.id,
    identity_data: {
      sub: user.id,
      email: user.email,
      email_verified: true,
    },
  };
  const res = await fetch(`${url}/rest/v1/identities`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`email identity missing and create failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return { created: true, providers: ["email"] };
}

export async function resetSupabaseAuthPassword(email, password) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const user = await findUser(admin, email);
  if (!user) throw new Error(`No auth user for ${email}`);

  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const identity = await ensureEmailIdentity(url, serviceKey, data.user || user);
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await anon.auth.signInWithPassword({ email, password });

  return {
    userId: user.id,
    emailConfirmed: Boolean(data.user?.email_confirmed_at || user.email_confirmed_at),
    identity,
    signInOk: !signIn.error,
    signInError: signIn.error
      ? { message: signIn.error.message, status: signIn.error.status, code: signIn.error.code }
      : null,
  };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith("reset-supabase-auth-user.mjs");
if (isDirectRun) {
  loadEnvLocal();
  const email = (process.argv[2] || "").trim().toLowerCase();
  const password = process.argv[3] || "";
  if (!email || !password) {
    console.error("Usage: node scripts/reset-supabase-auth-user.mjs <email> <password>");
    process.exit(1);
  }
  resetSupabaseAuthPassword(email, password)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.signInOk) process.exit(2);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
