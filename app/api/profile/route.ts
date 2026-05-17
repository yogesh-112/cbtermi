import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("users").select("id, full_name, email, phone, role, about, display_name, skills, created_at").eq("id", session.id).single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  const { new_password, current_password, ...profileFields } = body;

  if (new_password) {
    if (!current_password) return NextResponse.json({ message: "Current password required" }, { status: 400 });
    const { data: user } = await supabase.from("users").select("password_hash").eq("id", session.id).single();
    const valid = user?.password_hash && await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    profileFields.password_hash = await bcrypt.hash(new_password, 10);
  }

  const allowed = ["full_name", "display_name", "phone", "role", "about", "skills", "password_hash"];
  const update: Record<string, any> = {};
  for (const k of allowed) {
    if (k in profileFields) update[k] = profileFields[k];
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ message: "Nothing to update" });

  const { data, error } = await supabase.from("users").update({ ...update, updated_at: new Date().toISOString() }).eq("id", session.id).select("id, full_name, email, phone, role, about, display_name, skills").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const newName = data.full_name ?? session.name;
  const newToken = await signToken({ id: session.id, name: newName, email: session.email, businessId: session.businessId, role: session.role });
  const res = NextResponse.json({ user: data });
  res.cookies.set(SESSION_COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}

export async function DELETE() {
  const session = await requireSession().catch(() => null);
  if (!session?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await supabase.from("business_members").delete().eq("user_id", session.id);
  await supabase.from("users").delete().eq("id", session.id);
  const res = NextResponse.json({ message: "Account deleted" });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
