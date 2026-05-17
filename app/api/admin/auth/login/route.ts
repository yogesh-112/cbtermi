import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const { data: admin } = await supabase
    .from("super_admins")
    .select("id, email, name, role, password_hash, is_active")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!admin || !admin.is_active) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminToken({
    id: admin.id, email: admin.email, name: admin.name, role: admin.role,
  });

  await supabase.from("super_admins").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);
  await logAdminAudit({
    adminId: admin.id,
    action: "admin_login",
    payload: { email: admin.email },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });
  return res;
}
