import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Record first open only
  await supabase
    .from("invoices")
    .update({ email_opened_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("email_opened_at", null);

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
