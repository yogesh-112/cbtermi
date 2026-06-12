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

const ALLOWED_SETTINGS_FIELDS = [
  "name", "phone", "email", "address", "city", "state", "zip", "country",
  "logo_url", "business_type", "timezone", "currency", "tax_rate", "default_tax_rate", "tax_label",
  "quote_prefix", "invoice_prefix", "project_prefix",
  "quote_next_number", "invoice_next_number",
  "website", "about", "facebook", "instagram", "twitter", "whatsapp",
  "default_payment_terms", "default_notes", "calendly_url",
  "legal_name", "service_area", "trade_license", "payment_terms", "date_format", "language",
  "n_payment", "n_quote", "n_invoice", "n_message", "n_review",
  "notify_new_quote", "notify_invoice_due", "notify_payment",
];

export async function PATCH(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ALLOWED_SETTINGS_FIELDS) {
    if (key in body) update[key] = body[key];
  }
  const { data, error } = await supabase.from("businesses").update(update).eq("id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const newToken = await signToken({ id: session.id, name: session.name, email: session.email, businessId: session.businessId, role: session.role });
  const res = NextResponse.json({ settings: data });
  res.cookies.set(SESSION_COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}
