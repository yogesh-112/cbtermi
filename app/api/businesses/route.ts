import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, requireSession } from "@/lib/auth";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ message: "Business name required" }, { status: 400 });

  // Whitelist insertable fields — never spread the raw body (protects
  // stripe_customer_id, trial_ends_at, restricted_mode, etc.)
  const ALLOWED_FIELDS = [
    "name", "email", "phone", "address", "city", "state", "zip", "country",
    "business_type", "website", "timezone", "currency",
    "legal_name", "service_area", "default_tax_rate", "payment_terms",
    "quote_prefix", "invoice_prefix", "project_prefix",
  ] as const;
  const insert: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) if (body[f] !== undefined) insert[f] = body[f];

  const { data: biz, error } = await supabase.from("businesses").insert(insert).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("business_members").insert({ business_id: biz.id, user_id: session.id, role: "owner" });
  await supabase.from("subscriptions").insert({ business_id: biz.id });
  await supabase.from("users").update({ last_business_id: biz.id }).eq("id", session.id);

  const newToken = await signToken({ ...session, businessId: biz.id, role: "owner" });
  const res = NextResponse.json({ message: "Created", business: biz });
  res.cookies.set(SESSION_COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("business_members").select("role, businesses(*)").eq("user_id", session.id);
  return NextResponse.json({ businesses: data ?? [] });
}
