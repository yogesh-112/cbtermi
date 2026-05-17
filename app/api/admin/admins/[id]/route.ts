import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action, role, password } = await request.json();

  // Prevent self-deactivation
  if (id === session.id && action === "deactivate") {
    return NextResponse.json({ message: "Cannot deactivate your own account" }, { status: 400 });
  }

  let update: Record<string, unknown> = {};
  if (action === "activate")   update = { is_active: true };
  if (action === "deactivate") update = { is_active: false };
  if (action === "role" && role) update = { role };
  if (action === "password" && password) {
    update = { password_hash: await bcrypt.hash(password, 12) };
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ message: "No update" }, { status: 400 });

  const { data, error } = await supabase
    .from("super_admins")
    .update(update)
    .eq("id", id)
    .select("id, name, email, role, is_active, last_login_at, created_at")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ admin: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.id) return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 });

  await supabase.from("super_admins").delete().eq("id", id);
  return NextResponse.json({ message: "Deleted" });
}
