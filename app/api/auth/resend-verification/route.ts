import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail, verificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const { data: user } = await supabase.from("users").select("id, full_name, email_verified").eq("email", email).single();
  if (!user || user.email_verified) return NextResponse.json({ message: "OK" });

  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("users").update({ email_verification_token: token, email_verification_expires_at: expires }).eq("id", user.id);

  const link = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  await sendEmail({ to: email, subject: "Verify your Clear Build USA email", html: verificationEmail(user.full_name, link) });
  return NextResponse.json({ message: "Sent" });
}
