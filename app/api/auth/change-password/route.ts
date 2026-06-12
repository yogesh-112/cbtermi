import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "Current password and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: "New password must be at least 8 characters." }, { status: 400 });
  }

  const { data: user } = await supabase.from("users").select("password").eq("id", session.id).single();
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await supabase.from("users").update({ password: hashed, force_logout_at: new Date().toISOString() }).eq("id", session.id);

  return NextResponse.json({ message: "Password changed successfully." });
}
