import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) return NextResponse.json({ message: "File must be under 2 MB" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) return NextResponse.json({ message: "Only JPG, PNG, WebP and GIF allowed" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${session.businessId}-${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from("uploads").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
