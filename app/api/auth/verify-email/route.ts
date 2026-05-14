import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Missing token" }, { status: 400 });

  const { data: user } = await supabase
    .from("users")
    .select("id, email_verification_expires_at")
    .eq("email_verification_token", token)
    .single();

  if (!user) return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  if (new Date(user.email_verification_expires_at) < new Date())
    return NextResponse.json({ message: "Token expired" }, { status: 400 });

  await supabase.from("users").update({
    email_verified: true,
    email_verification_token: null,
    email_verification_expires_at: null,
  }).eq("id", user.id);

  return NextResponse.json({ message: "Verified" });
}
