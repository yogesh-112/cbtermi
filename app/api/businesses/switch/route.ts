import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { signToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { businessId } = await request.json();

  const { data: member } = await supabase.from("business_members")
    .select("role").eq("user_id", session.id).eq("business_id", businessId).single();
  if (!member) return NextResponse.json({ message: "Access denied" }, { status: 403 });

  await supabase.from("users").update({ last_business_id: businessId, last_used_business_id: businessId }).eq("id", session.id);

  const newToken = await signToken({ ...session, businessId, role: member.role });
  const res = NextResponse.json({ message: "Switched" });
  res.cookies.set(SESSION_COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}
