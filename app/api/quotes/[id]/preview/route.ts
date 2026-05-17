import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}
