import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("admin_settings").select("*");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const updates: Record<string, string> = await request.json();
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from("admin_settings").upsert({ key, value }, { onConflict: "key" });
  }
  return NextResponse.json({ ok: true });
}
