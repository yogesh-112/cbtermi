import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("super_admins")
    .select("id, name, email, role, is_active, last_login_at, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ admins: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ message: "Name, email, and password required" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("super_admins")
    .insert({ name, email: email.toLowerCase().trim(), password_hash: hash, role: role ?? "readonly" })
    .select("id, name, email, role, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ admin: data }, { status: 201 });
}
