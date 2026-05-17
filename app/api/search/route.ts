import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const bId = session.businessId;
  const like = `%${q}%`;

  const [contacts, invoices, quotes, projects, payments] = await Promise.all([
    supabase.from("contacts").select("id, full_name, email, phone, contact_type")
      .eq("business_id", bId).ilike("full_name", like).limit(5),

    supabase.from("invoices").select("id, invoice_number, status, total, contacts(full_name)")
      .eq("business_id", bId).or(`invoice_number.ilike.${like},notes.ilike.${like}`).limit(5),

    supabase.from("quotes").select("id, quote_number, title, status, total, contacts(full_name)")
      .eq("business_id", bId).or(`quote_number.ilike.${like},title.ilike.${like}`).limit(5),

    supabase.from("projects").select("id, name, project_number, status, contacts(full_name)")
      .eq("business_id", bId).or(`name.ilike.${like},project_number.ilike.${like}`).limit(5),

    supabase.from("payments").select("id, amount, payment_date, payment_method, invoices(invoice_number)")
      .eq("business_id", bId).eq("is_reversed", false).ilike("reference", like).limit(3),
  ]);

  const results = [
    ...(contacts.data ?? []).map(c => ({ type: "contact", id: c.id, label: c.full_name, sub: c.email ?? c.phone ?? c.contact_type, href: `/contacts/${c.id}` })),
    ...(invoices.data ?? []).map(i => ({ type: "invoice", id: i.id, label: i.invoice_number, sub: `${i.status} · $${(i.total ?? 0).toFixed(2)}`, href: `/invoices/${i.id}` })),
    ...(quotes.data ?? []).map(q => ({ type: "quote", id: q.id, label: q.quote_number, sub: q.title ?? q.status, href: `/quotes/${q.id}` })),
    ...(projects.data ?? []).map(p => ({ type: "project", id: p.id, label: p.name, sub: p.project_number, href: `/projects/${p.id}` })),
    ...(payments.data ?? []).map(p => ({ type: "payment", id: p.id, label: `$${Math.abs(p.amount ?? 0).toFixed(2)}`, sub: p.payment_date, href: `/payments` })),
  ];

  return NextResponse.json({ results });
}
