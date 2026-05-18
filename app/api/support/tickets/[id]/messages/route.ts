import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  if (!body.message?.trim()) return NextResponse.json({ message: "Message is required" }, { status: 400 });

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!ticket) return NextResponse.json({ message: "Ticket not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("support_ticket_messages")
    .insert({ ticket_id: id, user_id: session.id, message: body.message.trim(), is_admin: false })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to send message" }, { status: 500 });

  await supabase
    .from("support_tickets")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ message: data }, { status: 201 });
}
