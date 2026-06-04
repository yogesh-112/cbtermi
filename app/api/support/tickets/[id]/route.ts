import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!ticket) return NextResponse.json({ message: "Ticket not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("*, users(full_name, email)")
    .eq("ticket_id", id)
    .order("created_at");

  return NextResponse.json({ ticket, messages: messages ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed = ["status", "priority"];
  const updates: Record<string, string> = {};
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Update failed" }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
