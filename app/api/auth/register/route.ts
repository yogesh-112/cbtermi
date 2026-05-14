import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { sendEmail, verificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { name, email, password, language = "en" } = await request.json();

  if (!name || !email || !password)
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });

  const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
  if (existing)
    return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("users").insert({
    full_name: name, email, password: hashedPassword,
    email_verified: false,
    email_verification_token: token,
    email_verification_expires_at: expires,
    preferred_language: language,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  await sendEmail({ to: email, subject: "Verify your Clear Build USA email", html: verificationEmail(name, verifyLink) });

  return NextResponse.json({ message: "Account created" }, { status: 201 });
}
