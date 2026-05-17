import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "super_admin")) {
    return NextResponse.json({ message: "Only super admins can impersonate users" }, { status: 403 });
  }

  const { id } = await params;
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, last_business_id")
    .eq("id", id)
    .single();

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  // Resolve which business to land on
  let businessId = user.last_business_id;
  if (!businessId) {
    const { data: member } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", id)
      .limit(1)
      .maybeSingle();
    businessId = member?.business_id ?? null;
  }

  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    businessId: businessId ?? undefined,
    impersonatedBy: session.id,
  });

  await logAdminAudit({
    adminId: session.id,
    action: "user_impersonated",
    entityType: "user",
    entityId: id,
    payload: { targetEmail: user.email, adminEmail: session.email },
  });

  const res = NextResponse.json({ ok: true, redirectTo: businessId ? "/dashboard" : "/business-setup" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  return res;
}
