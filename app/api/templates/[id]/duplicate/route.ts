import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: source } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .or(`business_id.eq.${session.businessId},business_id.is.null`)
    .single();

  if (!source) return NextResponse.json({ message: "Template not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("templates")
    .insert({
      business_id: session.businessId,
      created_by: session.id,
      type: source.type,
      name: `${source.name} (Copy)`,
      subject: source.subject,
      body: source.body,
      variables: source.variables,
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to duplicate" }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
