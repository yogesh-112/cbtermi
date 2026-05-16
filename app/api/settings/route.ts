import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { signToken, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("businesses").select("*").eq("id", session.businessId).single();
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from("businesses").update({ ...body, updated_at: new Date().toISOString() }).eq("id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const newToken = await signToken({ id: session.id, name: session.name, email: session.email, businessId: session.businessId, role: session.role });
  const res = NextResponse.json({ settings: data });
  res.cookies.set(SESSION_COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}
