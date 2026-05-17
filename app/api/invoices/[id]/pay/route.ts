import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

// Public GET — load invoice summary for the public pay page
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, amount_due, amount_paid, status, due_date, contacts(full_name, email), businesses(name, email, phone)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice: data });
}

// Public POST — create Stripe Checkout session for invoice payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount_due, status, contacts(full_name, email), businesses(name, stripe_customer_id)")
    .eq("id", id)
    .single();

  if (error || !invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ message: "Invoice already paid" }, { status: 400 });

  const amountDue = Math.round((invoice.amount_due ?? 0) * 100); // cents
  if (amountDue < 50) return NextResponse.json({ message: "Amount too small" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const contact = invoice.contacts as any;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: contact?.email ?? undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: amountDue,
        product_data: {
          name: `Invoice ${invoice.invoice_number}`,
          description: `Payment to ${(invoice.businesses as any)?.name ?? "contractor"}`,
        },
      },
    }],
    metadata: { invoiceId: id, mode: "invoice_payment" },
    success_url: `${appUrl}/invoices/${id}/pay?success=1`,
    cancel_url: `${appUrl}/invoices/${id}/pay`,
  });

  // Store the pay URL on the invoice
  await supabase.from("invoices").update({ pay_url: session.url }).eq("id", id);

  return NextResponse.json({ url: session.url });
}
