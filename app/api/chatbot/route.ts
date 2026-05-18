import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireSession } from "@/lib/auth";

const SYSTEM_PROMPT = `You are the ClearBuild USA in-app assistant — a smart helper for construction business management.

APP PAGES & FEATURES:
• Dashboard (/dashboard): Overview stats — total revenue, active projects, pending invoices, new leads. Monthly revenue bar chart.
• Contacts (/contacts): All leads and customers. Lead statuses: New Lead, In Conversation, Quoted, Won, Lost. Can convert leads to customers.
• Leads (/leads): Contacts who are leads (potential customers).
• Customers (/customers): Converted leads and direct contacts.
• Quotes (/quotes): Create quotes with line items, taxes. Send review links — customers e-sign online. Statuses: Draft, Sent, Approved, Rejected.
• Projects (/projects): Link quotes, invoices, payments to a project. Track budget vs actual. Statuses: Active, On Hold, Completed.
• Invoices (/invoices): Create invoices linked to projects. Online payment via Stripe. Statuses: Draft, Sent, Paid, Overdue.
• Payments (/payments): Record payments against invoices. Partial payments supported.
• Communications (/communications): Send Email/SMS/WhatsApp to contacts. View message logs.
• Templates (/templates): Reusable templates for notifications, communications, quotes, invoices. System templates (read-only) + custom.
• Scheduling (/scheduling): Create time slots, share booking links with contacts, track scheduled meetings.
• Team (/team): Invite team members by email. Roles: Owner, Manager, Staff, Crew.
• Settings (/settings): Business name, logo, address, tax rate, quote/invoice prefixes.
• Help & Support (/help): FAQs, common issues, raise support tickets.
• Notifications (/notifications): Send push/email notifications to contacts.
• Subscription (/subscription): Free Trial (15 days), Monthly ($49/mo), Yearly ($490/yr).
• Change Orders (/change-orders): Track project change orders.
• Audit Log (/audit-log): Track all system changes.

COMMON WORKFLOWS:
- New customer flow: Contacts → Add lead → Convert to customer → Create quote → Create invoice
- Invoice flow: Invoices → New Invoice → Select/create project → Add line items → Send
- Quote flow: Quotes → New Quote → Select customer → Add items → Send review link
- Booking flow: Scheduling → Add slots → Create booking link → Share with customer
- Team invite: Team → Invite Member → Enter email → Select role
- Support ticket: Help & Support → Tickets tab → New Ticket

RESPONSE FORMAT (CRITICAL):
Respond ONLY with valid JSON — no text before or after:
{"message": "...", "actions": [...]}

message rules:
- Use **bold** for key terms and UI elements
- Use numbered lists (1. 2. 3.) for steps
- Use bullet points (- item) for lists
- Keep under 120 words
- Be friendly and professional

actions array (optional, 0-3 items):
- Navigate: {"label": "Go to Invoices", "type": "navigate", "href": "/invoices"}
- Copy text: {"label": "Copy message", "type": "copy", "value": "the text to copy"}
- Support ticket: {"label": "Raise a ticket", "type": "ticket"}

RESTRICTIONS — never help with:
- Deleting records
- Auto-sending invoices or quotes
- Auto-recording payments
- Changing subscription plans
- Changing team permissions`;

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      message: "The AI assistant isn't configured yet. Add **GEMINI_API_KEY** to your environment variables to enable this feature.",
      actions: [{ label: "Go to Help Center", type: "navigate", href: "/help" }],
    });
  }

  const { messages, currentPage } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    currentPage?: string;
  };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT + (currentPage ? `\n\nUser is currently on: ${currentPage}` : ""),
  });

  // Gemini uses "model" instead of "assistant" for role
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1]?.content ?? "";

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
  });

  const result = await chat.sendMessage(lastMessage);
  const raw = result.response.text().trim();

  let parsed: { message: string; actions?: unknown[] };
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    parsed = start !== -1 && end !== -1 ? JSON.parse(raw.slice(start, end + 1)) : { message: raw };
  } catch {
    parsed = { message: raw || "Sorry, I couldn't process that. Please try again." };
  }

  return NextResponse.json(parsed);
}
