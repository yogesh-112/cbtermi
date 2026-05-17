import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("payments").select("*, contacts(full_name), invoices(invoice_number)").eq("business_id", session.businessId).eq("is_reversed", false).order("created_at", { ascending: false });
  return NextResponse.json({ payments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const body = await request.json();
  if (!body.amount || body.amount <= 0) return NextResponse.json({ message: "Valid amount required" }, { status: 400 });

  const { data: payment, error } = await supabase.from("payments").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Update invoice balance
  if (body.invoice_id) {
    const { data: inv } = await supabase.from("invoices").select("total, amount_paid").eq("id", body.invoice_id).single();
    if (inv) {
      const amount_paid = (inv.amount_paid ?? 0) + body.amount;
      const amount_due  = Math.max(0, inv.total - amount_paid);
      const status = amount_due <= 0 ? "paid" : "partially_paid";
      await supabase.from("invoices").update({ amount_paid, amount_due, status }).eq("id", body.invoice_id);
    }
  }
  await logAudit({ businessId: session.businessId, userId: session.id, entityType: "payment", entityId: payment.id, action: "recorded", payload: { amount: body.amount, invoice_id: body.invoice_id } });
  return NextResponse.json({ payment }, { status: 201 });
}
