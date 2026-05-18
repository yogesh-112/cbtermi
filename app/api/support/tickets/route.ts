import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("support_tickets")
    .select("*, support_ticket_messages(count)")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.subject?.trim()) return NextResponse.json({ message: "Subject is required" }, { status: 400 });
  if (!body.description?.trim()) return NextResponse.json({ message: "Description is required" }, { status: 400 });

  const userAgent = request.headers.get("user-agent") ?? "";
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      business_id: session.businessId,
      user_id: session.id,
      subject: body.subject.trim(),
      category: body.category ?? "Other",
      priority: body.priority ?? "medium",
      description: body.description.trim(),
      status: "open",
      device_info: { user_agent: userAgent },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to create ticket" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "support_ticket",
    entityId: data.id,
    action: "support_ticket_created",
    payload: { subject: data.subject, priority: data.priority },
  });

  return NextResponse.json({ ticket: data }, { status: 201 });
}
