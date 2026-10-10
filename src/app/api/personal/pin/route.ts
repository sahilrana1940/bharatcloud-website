import { NextResponse } from "next/server";

import {
  demoGetLock,
  demoSetLock,
  demoSetUnlocked,
} from "@/lib/personal/locks-demo";
import { generateWords12, hashBackupCode, hashPin } from "@/lib/personal/pin";
import { getUploadContext } from "@/lib/personal/access";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const UNLOCK_COOKIE = "bc_vault_unlocked";

export async function GET() {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const lock = demoGetLock(ctx.email);
    return NextResponse.json({
      hasPin: Boolean(lock),
      is_device_locked: lock?.is_device_locked ?? false,
    });
  }

  const { data } = await supabase
    .from("app_locks")
    .select("user_email, is_device_locked, failed_attempts")
    .eq("user_email", ctx.email)
    .maybeSingle();

  return NextResponse.json({
    hasPin: Boolean(data),
    is_device_locked: data?.is_device_locked ?? false,
    failed_attempts: data?.failed_attempts ?? 0,
  });
}

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action as string;

  if (action === "setup") {
    const pin = String(body.pin || "");
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
    }
    const backupWords = generateWords12();
    const backupHash = hashBackupCode(backupWords);
    const pinHash = hashPin(pin);
    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      demoSetLock({
        user_email: ctx.email,
        pin_hash: pinHash,
        biometric_enabled: false,
        failed_attempts: 0,
        is_device_locked: false,
        backup_code_hash: backupHash,
      });
      return NextResponse.json({ ok: true, backupWords, showOnce: true });
    }
    await supabase.from("app_locks").upsert({
      user_email: ctx.email,
      pin_hash: pinHash,
      backup_code_hash: backupHash,
      is_device_locked: false,
      failed_attempts: 0,
    });
    return NextResponse.json({ ok: true, backupWords, showOnce: true });
  }

  if (action === "verify") {
    const pin = String(body.pin || "");
    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      const lock = demoGetLock(ctx.email);
      if (!lock || lock.pin_hash !== hashPin(pin)) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }
      demoSetUnlocked(ctx.email, true);
      const res = NextResponse.json({ ok: true });
      res.cookies.set(UNLOCK_COOKIE, ctx.email, {
        httpOnly: true,
        path: "/",
        maxAge: 3600,
      });
      return res;
    }
    const { data: lock } = await supabase
      .from("app_locks")
      .select("*")
      .eq("user_email", ctx.email)
      .maybeSingle();
    if (!lock || lock.pin_hash !== hashPin(pin)) {
      await supabase
        .from("app_locks")
        .update({ failed_attempts: (lock?.failed_attempts || 0) + 1 })
        .eq("user_email", ctx.email);
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(UNLOCK_COOKIE, ctx.email, {
      httpOnly: true,
      path: "/",
      maxAge: 3600,
    });
    return res;
  }

  if (action === "lock_device") {
    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      const lock = demoGetLock(ctx.email);
      if (lock) demoSetLock({ ...lock, is_device_locked: true });
      return NextResponse.json({ ok: true });
    }
    await supabase
      .from("app_locks")
      .update({ is_device_locked: true })
      .eq("user_email", ctx.email);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
