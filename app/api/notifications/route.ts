import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const lang = request.nextUrl.searchParams.get("lang") ?? "en";
  const { data } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("business_id", session.businessId)
    .in("language", lang !== "en" ? [lang, "en"] : ["en"])
    .order("created_at", { ascending: false });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  if (body.action === "send") {
    let userRole = session.role;
    if (!userRole) {
      const { data: member } = await supabase.from("business_members").select("role").eq("user_id", session.id).eq("business_id", session.businessId).single();
      userRole = member?.role;
    }
    if (!["owner", "admin"].includes(userRole ?? "")) {
      return NextResponse.json({ message: "Only owners and admins can send notifications." }, { status: 403 });
    }
    const { template_id, contact_id, subject, message, channel } = body;
    const { data: contact } = await supabase.from("contacts").select("email, phone, whatsapp, full_name").eq("id", contact_id).single();
    const { data: biz } = await supabase.from("businesses").select("name").eq("id", session.businessId).single();

    const replaced = (message || "").replace(/\{\{contact_name\}\}/g, contact?.full_name ?? "").replace(/\{\{business_name\}\}/g, biz?.name ?? "");

    if (channel === "email" && contact?.email) {
      await sendEmail({ to: contact.email, subject: subject || "Message from " + biz?.name, html: `<p>${replaced.replace(/\n/g,"<br/>")}</p>` });
      await supabase.from("communication_logs").insert({ business_id: session.businessId, contact_id, type: "notification", channel, subject, message: replaced, sent_by: session.id });
      return NextResponse.json({ message: "Sent", channel: "email" });
    }

    if (channel === "whatsapp") {
      const phone = (contact?.whatsapp || contact?.phone || "").replace(/\D/g, "");
      await supabase.from("communication_logs").insert({ business_id: session.businessId, contact_id, type: "notification", channel, subject, message: replaced, sent_by: session.id, status: "draft" });
      return NextResponse.json({ message: "Draft ready", channel: "whatsapp", link: `https://wa.me/${phone}?text=${encodeURIComponent(replaced)}` });
    }

    if (channel === "sms") {
      const phone = (contact?.phone || "").replace(/\D/g, "");
      await supabase.from("communication_logs").insert({ business_id: session.businessId, contact_id, type: "notification", channel, subject, message: replaced, sent_by: session.id, status: "draft" });
      return NextResponse.json({ message: "Draft ready", channel: "sms", link: `sms:+${phone}?body=${encodeURIComponent(replaced)}` });
    }

    return NextResponse.json({ message: "Sent" });
  }

  // Create template
  const { data, error } = await supabase.from("notification_templates").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  await supabase.from("notification_templates").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
