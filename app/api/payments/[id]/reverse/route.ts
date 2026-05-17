import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can reverse payments." }, { status: 403 });
  }

  const { id } = await params;

  const { data: original } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!original) return NextResponse.json({ message: "Payment not found." }, { status: 404 });
  if (original.is_reversed) return NextResponse.json({ message: "Payment has already been reversed." }, { status: 400 });

  // Mark original as reversed
  await supabase.from("payments").update({ is_reversed: true }).eq("id", id);

  // Create reversal row (negative amount)
  const { data: reversal, error } = await supabase
    .from("payments")
    .insert({
      business_id: session.businessId,
      invoice_id: original.invoice_id,
      contact_id: original.contact_id,
      amount: -Math.abs(original.amount),
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: original.payment_method,
      reference: `Reversal of ${original.reference ?? original.id}`,
      notes: `Reversal of payment ${original.id}`,
      payment_type: "reversal",
      reversal_of_payment_id: original.id,
      is_reversed: false,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Restore invoice balance
  if (original.invoice_id) {
    const { data: inv } = await supabase
      .from("invoices")
      .select("total, amount_paid, status")
      .eq("id", original.invoice_id)
      .single();

    if (inv) {
      const amount_paid = Math.max(0, (inv.amount_paid ?? 0) - Math.abs(original.amount));
      const amount_due = Math.max(0, inv.total - amount_paid);
      const status = amount_due <= 0 ? "paid" : amount_paid > 0 ? "partially_paid" : "sent";
      await supabase.from("invoices").update({ amount_paid, amount_due, status }).eq("id", original.invoice_id);
    }
  }

  await logAudit({ businessId: session.businessId, userId: session.id, entityType: "payment", entityId: id, action: "reversed", payload: { amount: original.amount, reversal_id: reversal.id } });
  return NextResponse.json({ reversal }, { status: 201 });
}
