import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();
  const { data: user } = await supabase.from("users").select("id, password_reset_expires_at").eq("password_reset_token", token).single();
  if (!user) return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  if (new Date(user.password_reset_expires_at) < new Date()) return NextResponse.json({ message: "Token expired" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await supabase.from("users").update({ password: hashed, password_reset_token: null, password_reset_expires_at: null }).eq("id", user.id);
  return NextResponse.json({ message: "Password reset" });
}
