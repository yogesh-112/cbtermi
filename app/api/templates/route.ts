import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type");

  let q = supabase
    .from("templates")
    .select("*")
    .or(`business_id.eq.${session.businessId},business_id.is.null`)
    .eq("is_active", true)
    .order("is_system", { ascending: false })
    .order("name");

  if (type) q = q.eq("type", type);

  const { data } = await q;
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ message: "Name is required" }, { status: 400 });
  if (!body.body?.trim()) return NextResponse.json({ message: "Body is required" }, { status: 400 });
  if (!body.type) return NextResponse.json({ message: "Type is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("templates")
    .insert({
      business_id: session.businessId,
      created_by: session.id,
      type: body.type,
      name: body.name.trim(),
      subject: body.subject?.trim() ?? null,
      body: body.body.trim(),
      variables: body.variables ?? [],
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to create template" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "template",
    entityId: data.id,
    action: "template_created",
    payload: { name: data.name, type: data.type },
  });

  return NextResponse.json({ template: data }, { status: 201 });
}
