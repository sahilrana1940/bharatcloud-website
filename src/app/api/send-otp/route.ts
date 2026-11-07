import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

function sixDigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const otp = sixDigitOtp();
    await addDoc(collection(db, "otps"), {
      email,
      company,
      phone,
      password,
      otp,
      createdAt: serverTimestamp(),
    });

    console.log("OTP:", otp);
    return NextResponse.json({ success: true, otp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send OTP";
    console.error("send-otp:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
