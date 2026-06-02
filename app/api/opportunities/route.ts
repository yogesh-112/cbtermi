import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status  = sp.get("status");
  const limit   = Math.min(parseInt(sp.get("limit")  ?? "100"), 200);
  const offset  = parseInt(sp.get("offset") ?? "0");

  let q = supabase
    .from("opportunities")
    .select("*, contacts(id, full_name, email, phone)", { count: "exact" })
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") q = q.eq("status", status);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ opportunities: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ message: "Opportunity name is required" }, { status: 400 });

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      business_id:         session.businessId,
      contact_id:          body.contact_id || null,
      name:                body.name.trim(),
      project_type:        body.project_type || null,
      property_address:    body.property_address?.trim() || null,
      estimated_value:     body.estimated_value ? parseFloat(body.estimated_value) : null,
      expected_start_date: body.expected_start_date || null,
      status:              body.status ?? "open",
      priority:            body.priority ?? "medium",
      notes:               body.notes?.trim() || null,
      created_by:          session.id,
      owner_user_id:       session.id,
    })
    .select("*, contacts(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "created",
    payload: { name: body.name, status: "open" },
  });

  return NextResponse.json({ opportunity }, { status: 201 });
}
