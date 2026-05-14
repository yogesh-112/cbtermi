import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const { data: user } = await supabase.from("users").select("id, full_name").eq("email", email).single();
  if (user) {
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await supabase.from("users").update({ password_reset_token: token, password_reset_expires_at: expires }).eq("id", user.id);
    const link = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await sendEmail({ to: email, subject: "Reset your Clear Build USA password", html: passwordResetEmail(user.full_name, link) });
  }
  return NextResponse.json({ message: "If the email exists, a reset link was sent." });
}
