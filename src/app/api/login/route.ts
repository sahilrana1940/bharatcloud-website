import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Yehi tujhe 401 de raha tha
      return NextResponse.json(
        { error: "Wrong password", code: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Success
    const response = NextResponse.json(
      { success: true, redirectTo: "/dashboard" },
      { status: 200 }
    );

    // Optional: Cookie set karna hai toh yahan
    // response.cookies.set("sb-access-token", data.session.access_token)

    return response;

  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[api/login] server error", err);
    return NextResponse.json(
      { error: "Server error", code: message },
      { status: 500 }
    );
  }
}