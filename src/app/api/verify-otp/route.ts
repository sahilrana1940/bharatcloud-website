import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, deleteDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import bcrypt from "bcryptjs";

import { db } from "@/lib/firebase";

type OtpRecord = {
  email?: string;
  company?: string;
  phone?: string;
  password?: string;
  otp?: string | number;
  createdAt?: { seconds?: number };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const otp = body.otp;

    if (!email || otp === undefined || otp === null || String(otp).trim() === "") {
      return NextResponse.json({ error: "OTP required - Please enter OTP" }, { status: 400 });
    }

    const snap = await getDocs(query(collection(db, "otps"), where("email", "==", email)));
    if (snap.empty) {
      return NextResponse.json({ error: "No OTP found, please click Send OTP first" }, { status: 400 });
    }

    let latest: OtpRecord | null = null;
    let latestTime = -1;
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as OtpRecord;
      const time = data.createdAt?.seconds ?? 0;
      if (time >= latestTime) {
        latestTime = time;
        latest = data;
      }
    }

    if (!latest || String(latest.otp) !== String(otp).trim()) {
      return NextResponse.json({ error: "Wrong OTP" }, { status: 400 });
    }

    const existing = await getDocs(query(collection(db, "workspaces"), where("email", "==", email)));
    if (!existing.empty) {
      return NextResponse.json({ error: "Account already exists, please login" }, { status: 400 });
    }

    if (!latest.password) {
      return NextResponse.json({ error: "Password missing. Send OTP again." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(latest.password, 10);
    const workspace = await addDoc(collection(db, "workspaces"), {
      company: latest.company || "My Company",
      email,
      phone: latest.phone || "",
      password: hashed,
      createdAt: serverTimestamp(),
      verified: true,
    });

    await Promise.all(snap.docs.map((docSnap) => deleteDoc(docSnap.ref)));

    return NextResponse.json({ success: true, company: latest.company || "My Company", id: workspace.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify OTP";
    console.error("verify-otp:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
