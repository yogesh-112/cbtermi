import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const FINANCIAL_FIELDS = ["subtotal", "tax_amount", "total", "amount_due", "amount_paid", "discount"];

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: invoice } = await supabase.from("invoices").select("*, contacts(*), projects(name)").eq("id", id).eq("business_id", session.businessId).single();
  if (!invoice) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order");
  const { data: payments } = await supabase.from("payments").select("*").eq("invoice_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ invoice, items: items ?? [], payments: payments ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { items, ...body } = await request.json();

  const { data: existing } = await supabase.from("invoices").select("is_sent, status, amount_paid").eq("id", id).eq("business_id", session.businessId).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Void guard: block void if payments exist
  if (body.status === "voided") {
    if ((existing.amount_paid ?? 0) > 0) {
      return NextResponse.json({ message: "Cannot void an invoice with recorded payments. Reverse all payments first." }, { status: 400 });
    }
    if (existing.status === "voided") {
      return NextResponse.json({ message: "Invoice is already voided." }, { status: 400 });
    }
  }

  // Sent invoice lock: financial fields and line items are immutable after send
  if (existing.is_sent) {
    if (items) {
      return NextResponse.json({ message: "Cannot edit line items of a sent invoice. Create a corrected invoice instead." }, { status: 400 });
    }
    const attemptedFinancialFields = Object.keys(body).filter(k => FINANCIAL_FIELDS.includes(k));
    if (attemptedFinancialFields.length > 0) {
      return NextResponse.json({ message: "Cannot edit financial fields of a sent invoice. Only due date, notes, and terms may be changed." }, { status: 400 });
    }
  }

  if (items) {
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    const subtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const tax_amount = items.reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
    body.subtotal = subtotal; body.tax_amount = tax_amount; body.total = subtotal + tax_amount;
    body.amount_due = body.total - (existing.amount_paid ?? 0);
    await supabase.from("invoice_items").insert(items.map((item: any, i: number) => ({ ...item, invoice_id: id, sort_order: i })));
  }

  const { data, error } = await supabase.from("invoices").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (body.is_sent) await logAudit({ businessId: session.businessId, userId: session.id, entityType: "invoice", entityId: id, action: "sent" });
  if (body.status === "voided") await logAudit({ businessId: session.businessId, userId: session.id, entityType: "invoice", entityId: id, action: "voided" });

  return NextResponse.json({ invoice: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can delete invoices." }, { status: 403 });
  }
  const { id } = await params;

  // Block delete if payments exist
  const { data: inv } = await supabase.from("invoices").select("amount_paid").eq("id", id).eq("business_id", session.businessId).single();
  if (!inv) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if ((inv.amount_paid ?? 0) > 0) {
    return NextResponse.json({ message: "Cannot delete an invoice with recorded payments." }, { status: 400 });
  }

  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  await supabase.from("invoices").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
