import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: co, error } = await supabase
    .from("change_orders")
    .select("*, contacts(full_name, email, phone), change_order_items(*), businesses(name, address, city, state, zip, phone, email, logo_url), projects(name)")
    .eq("id", id)
    .single();
  if (error || !co) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ changeOrder: co });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const allowed = ["approved", "rejected"] as const;
  if (!allowed.includes(body.status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const { data: existing } = await supabase
    .from("change_orders")
    .select("id, status, co_number, businesses(name, email), contacts(full_name)")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (!["draft", "sent"].includes(existing.status)) {
    return NextResponse.json({ message: "Change order is not awaiting approval" }, { status: 409 });
  }

  const updates: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
  if (body.status === "approved") {
    updates.approved_by  = body.approved_by ?? null;
    updates.approved_at  = new Date().toISOString();
  }

  const { data: co, error } = await supabase
    .from("change_orders")
    .update(updates)
    .eq("id", id)
    .select("*, contacts(full_name, email), businesses(name, email)")
    .single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Write formal approval record
  if (body.status === "approved" && co) {
    await supabase.from("approvals").insert({
      business_id:       co.business_id,
      object_type:       "change_order",
      object_id:         id,
      approver_name:     body.approved_by ?? null,
      total_at_approval: co.total ?? null,
      ip_address:        request.headers.get("x-forwarded-for") ?? null,
    });
  }

  // Notify business when approved
  if (body.status === "approved" && co) {
    const biz = co.businesses as any;
    const contact = co.contacts as any;
    if (biz?.email) {
      await sendEmail({
        to: biz.email,
        subject: `Change Order ${co.co_number} approved by ${contact?.full_name ?? "customer"}`,
        html: `<p>Change Order <strong>${co.co_number}</strong> has been approved by <strong>${body.approved_by ?? contact?.full_name ?? "customer"}</strong>.</p><p>Log in to Clear Build to view the details.</p>`,
      });
    }
  }

  return NextResponse.json({ changeOrder: co });
}
