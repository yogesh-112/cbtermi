import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail, quoteApprovedEmail } from "@/lib/email";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("quotes")
    .select("*, contacts(full_name, email, phone, address, city, state), quote_items(*), businesses(name, address, city, state, zip, phone, email, logo_url)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ quote: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const allowed = ["approved", "rejected"] as const;
  if (!allowed.includes(body.status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const updates: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };

  if (body.status === "approved") {
    updates.approved_by = body.approved_by ?? null;
    updates.approved_at = new Date().toISOString();
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", id)
    .select("*, contacts(full_name, email), businesses(name, email), quote_items(*)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Fire approval notification emails
  if (body.status === "approved" && quote) {
    const biz = quote.businesses as any;
    const contact = quote.contacts as any;
    const items = (quote.quote_items as any[]) ?? [];
    const total = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Notify business owner
    if (biz?.email) {
      await sendEmail({
        to: biz.email,
        subject: `Quote ${quote.quote_number} approved by ${contact?.full_name ?? "customer"}`,
        html: quoteApprovedEmail(biz.email, contact?.full_name ?? "Customer", quote.quote_number, fmt(total)),
      });
    }
  }

  return NextResponse.json({ quote });
}
