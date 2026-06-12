/**
 * Clear Build USA — Professional Board-Ready PowerPoint Generator
 * Usage: node scripts/generate-pptx.mjs
 * Output: public/docs/clearbuild-presentation.pptx
 */
import PptxGenJS from "pptxgenjs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "docs");
const OUT_FILE = path.join(OUT_DIR, "clearbuild-presentation.pptx");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Brand colors ──────────────────────────────────────
const NAVY    = "123B5D";
const NAVY2   = "0F2D4A";
const GREEN   = "3FA66B";
const GREEN2  = "22C55E";
const BLUE    = "2563EB";
const LIGHT   = "EFF6FF";
const GRAY    = "6B7280";
const LGRAY   = "E5E7EB";
const VLIGHT  = "F5F7FA";
const WHITE   = "FFFFFF";
const BLACK   = "1F2937";
const AMBER   = "F59E0B";
const RED     = "EF4444";

const prs = new PptxGenJS();
prs.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 inches

// ── Helper: add a navy background to any slide ────────
function navyBg(slide, h = 7.5) {
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h, fill: { color: NAVY2 }, line: { color: NAVY2 } });
}

// ── Helper: section label (small all-caps colored text) ──
function sectionLabel(slide, text, x, y, color = GREEN) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 8, h: 0.22,
    fontSize: 9, bold: true, color,
    charSpacing: 3,
  });
}

// ── Helper: tick/cross table cell ─────────────────────
function tc(text, fg, bold = false) {
  return { text, options: { color: fg, bold, fontSize: 11, align: "center" } };
}

// ── Helper: icon bullet list ──────────────────────────
function bulletList(slide, items, x, y, w, h, fontSize = 11.5) {
  const lines = items.map(i => ({ text: i, options: { bullet: { code: "25CF", color: GREEN }, fontSize, color: BLACK, breakLine: true } }));
  slide.addText(lines, { x, y, w, h, valign: "top" });
}

// ════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ════════════════════════════════════════════════════════
const s1 = prs.addSlide();
// Full background gradient via two rects
s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: NAVY2 }, line: { color: NAVY2 } });
s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 4.5, h: 7.5, fill: { color: NAVY, transparency: 40 }, line: { color: NAVY2 } });
// Green accent bar
s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: GREEN }, line: { color: GREEN } });
// Badge
s1.addShape(prs.ShapeType.roundRect, {
  x: 1.8, y: 1.4, w: 2.6, h: 0.34,
  fill: { color: GREEN, transparency: 75 },
  line: { color: GREEN, width: 1 },
  rectRadius: 0.17,
});
s1.addText("CONFIDENTIAL  ·  INTERNAL DOCUMENT", {
  x: 1.8, y: 1.42, w: 2.6, h: 0.3,
  fontSize: 7.5, bold: true, color: "86EFAC", align: "center", charSpacing: 2,
});
// Main title
s1.addText("Clear Build USA", {
  x: 0.6, y: 1.9, w: 7.5, h: 0.9,
  fontSize: 52, bold: true, color: WHITE,
  fontFace: "Arial",
});
// Tagline
s1.addText("Complete Application Overview &\nStrategic Documentation Package", {
  x: 0.6, y: 2.95, w: 7.8, h: 0.9,
  fontSize: 20, color: "A7B4CE",
});
// Sub
s1.addText("Field Service & Commercial Control for Owner-Led Remodelers", {
  x: 0.6, y: 3.9, w: 8, h: 0.35,
  fontSize: 13, color: "7A8FA6", italic: true,
});
// Horizontal rule
s1.addShape(prs.ShapeType.rect, { x: 0.6, y: 4.4, w: 7, h: 0.015, fill: { color: "2A4A6A" }, line: { color: "2A4A6A" } });
// Meta row
const metaItems = [
  ["Version", "1.0"],
  ["Date", "June 2026"],
  ["Status", "Live in Production"],
  ["Domain", "clearbuildusa.com"],
];
metaItems.forEach(([label, val], i) => {
  const x = 0.6 + i * 1.8;
  s1.addText(label.toUpperCase(), { x, y: 4.55, w: 1.6, h: 0.2, fontSize: 7.5, color: "6B8AA8", bold: true, charSpacing: 1.5 });
  s1.addText(val, { x, y: 4.78, w: 1.6, h: 0.26, fontSize: 12, color: WHITE, bold: true });
});
// Right side decorative
s1.addShape(prs.ShapeType.rect, { x: 9.5, y: 0, w: 3.83, h: 7.5, fill: { color: NAVY, transparency: 55 }, line: { color: NAVY2 } });
s1.addText("🏗️", { x: 10.2, y: 2.6, w: 2.4, h: 2.4, fontSize: 80, align: "center", valign: "middle" });

// ════════════════════════════════════════════════════════
// SLIDE 2 — TABLE OF CONTENTS
// ════════════════════════════════════════════════════════
const s2 = prs.addSlide();
navyBg(s2);
sectionLabel(s2, "Navigation", 0.6, 0.5);
s2.addText("What's Inside", { x: 0.6, y: 0.75, w: 12, h: 0.6, fontSize: 34, bold: true, color: WHITE, fontFace: "Arial" });
s2.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.45, w: 1.4, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const tocItems = [
  ["01", "Application Overview & Vision"],
  ["02", "The Problem We Solve"],
  ["03", "Target Audience & Personas"],
  ["04", "Value Proposition & USPs"],
  ["05", "Complete Feature Set (16 Modules)"],
  ["06", "User Journey (10-Step Walkthrough)"],
  ["07", "Competitor Analysis"],
  ["08", "Pricing & Business Model"],
  ["09", "Admin Panel & Operations"],
  ["10", "Business Analysis & SWOT"],
  ["11", "Technology Stack & Security"],
  ["12", "Design, UX & Recommendations"],
];
const cols = [tocItems.slice(0, 6), tocItems.slice(6)];
cols.forEach((col, ci) => {
  const bx = 0.5 + ci * 6.4;
  col.forEach(([num, title], ri) => {
    const by = 1.65 + ri * 0.85;
    s2.addShape(prs.ShapeType.rect, { x: bx, y: by, w: 0.42, h: 0.42, fill: { color: NAVY }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.06 });
    s2.addText(num, { x: bx, y: by, w: 0.42, h: 0.42, fontSize: 10, bold: true, color: GREEN, align: "center", valign: "middle" });
    s2.addText(title, { x: bx + 0.52, y: by + 0.04, w: 5.5, h: 0.38, fontSize: 12, color: "C8D4E0" });
  });
});

// ════════════════════════════════════════════════════════
// SLIDE 3 — APPLICATION OVERVIEW
// ════════════════════════════════════════════════════════
const s3 = prs.addSlide();
navyBg(s3);
sectionLabel(s3, "01 · Application Overview", 0.6, 0.5);
s3.addText("What is Clear Build USA?", { x: 0.6, y: 0.78, w: 10, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s3.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.44, w: 1.4, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

s3.addText(
  "Clear Build USA is a cloud-based SaaS business management platform built exclusively for owner-operated remodeling and construction businesses in the United States. It unifies the entire commercial control chain — from the first client lead through final payment collection — into a single, coherent digital workspace.",
  { x: 0.6, y: 1.6, w: 7.2, h: 1.0, fontSize: 12.5, color: "A7B4CE", lineSpacingMultiple: 1.4 }
);

const overviewCards = [
  { icon: "🏗️", title: "Industry Focus", body: "Residential & commercial remodeling, specialty trades, kitchen/bath, roofing, HVAC, flooring", color: BLUE },
  { icon: "🔗", title: "Core Concept", body: "Lead → Quote → Approval → Change Order → Invoice → Payment — all on one job record", color: GREEN },
  { icon: "🌐", title: "Delivery Model", body: "100% web-based SaaS, mobile-responsive. No app download. Vercel CDN. 3 languages (EN/ES/PT)", color: AMBER },
  { icon: "💼", title: "Market Size", body: "$500K–$5M revenue businesses; teams of 1–15 people. US remodeling market >$500B/yr", color: "8B5CF6" },
];
overviewCards.forEach((c, i) => {
  const x = 0.55 + (i % 2) * 6.2;
  const y = 2.75 + Math.floor(i / 2) * 1.85;
  s3.addShape(prs.ShapeType.rect, { x, y, w: 5.9, h: 1.65, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s3.addShape(prs.ShapeType.rect, { x, y, w: 0.08, h: 1.65, fill: { color: c.color }, line: { color: c.color }, rectRadius: 0.04 });
  s3.addText(c.icon, { x: x + 0.2, y: y + 0.2, w: 0.7, h: 0.7, fontSize: 24, align: "center", valign: "middle" });
  s3.addText(c.title, { x: x + 1.0, y: y + 0.18, w: 4.6, h: 0.32, fontSize: 13, bold: true, color: WHITE });
  s3.addText(c.body, { x: x + 1.0, y: y + 0.52, w: 4.6, h: 0.9, fontSize: 10.5, color: "8AA0BB", lineSpacingMultiple: 1.35 });
});

// ════════════════════════════════════════════════════════
// SLIDE 4 — THE PROBLEM
// ════════════════════════════════════════════════════════
const s4 = prs.addSlide();
navyBg(s4);
sectionLabel(s4, "02 · The Problem We Solve", 0.6, 0.5);
s4.addText("Revenue Leakage in Remodeling", { x: 0.6, y: 0.78, w: 12, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s4.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.44, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

s4.addText("Contractors don't lose money because of bad work — they lose it because the information trail breaks down between approved work and collected payment.", {
  x: 0.6, y: 1.6, w: 12, h: 0.55, fontSize: 13, color: "A7B4CE", italic: true, lineSpacingMultiple: 1.4,
});

const problems = [
  { num: "01", title: "Disconnected Tools", body: "Quotes in email. Approvals verbal. Change orders on paper. Invoices re-keyed manually. Every handoff is a data gap.", color: RED },
  { num: "02", title: "Approval Disputes", body: "No signed record of change orders. Contractors absorb cost or fight clients without digital proof.", color: AMBER },
  { num: "03", title: "Slow Payment Collection", body: "Paper invoices, manual follow-ups, no online payment option. Cash flow suffers while work is already done.", color: BLUE },
  { num: "04", title: "Zero Financial Visibility", body: "Owners cannot answer 'how much did we invoice vs. collect this month?' without digging through multiple systems.", color: "8B5CF6" },
];
problems.forEach((p, i) => {
  const x = 0.45 + (i % 2) * 6.2;
  const y = 2.35 + Math.floor(i / 2) * 2.1;
  s4.addShape(prs.ShapeType.rect, { x, y, w: 5.9, h: 1.85, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s4.addShape(prs.ShapeType.rect, { x, y, w: 5.9, h: 0.5, fill: { color: p.color, transparency: 80 }, line: { color: NAVY2, width: 0 }, rectRadius: 0.1 });
  s4.addText(`Problem ${p.num}`, { x: x + 0.2, y: y + 0.1, w: 2.5, h: 0.28, fontSize: 8.5, color: p.color, bold: true, charSpacing: 1.5 });
  s4.addText(p.title, { x: x + 0.2, y: y + 0.48, w: 5.5, h: 0.35, fontSize: 15, bold: true, color: WHITE });
  s4.addText(p.body, { x: x + 0.2, y: y + 0.87, w: 5.5, h: 0.75, fontSize: 11, color: "8AA0BB", lineSpacingMultiple: 1.35 });
});

// ════════════════════════════════════════════════════════
// SLIDE 5 — THE SOLUTION (VALUE PROP)
// ════════════════════════════════════════════════════════
const s5 = prs.addSlide();
navyBg(s5);
sectionLabel(s5, "03 · The Solution", 0.6, 0.5);
s5.addText("How Clear Build Fixes This", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s5.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.4, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

// Flow diagram
const flowItems = ["Lead\nCaptured", "Quote\nCreated", "Digital\nApproval", "Change\nOrders", "Invoice\nSent", "Payment\nCollected"];
const flowColors = [GREEN, BLUE, GREEN, AMBER, BLUE, GREEN];
flowItems.forEach((f, i) => {
  const x = 0.5 + i * 2.04;
  s5.addShape(prs.ShapeType.rect, { x, y: 1.6, w: 1.8, h: 1.0, fill: { color: flowColors[i], transparency: 15 }, line: { color: flowColors[i], width: 1 }, rectRadius: 0.1 });
  s5.addText(f, { x, y: 1.6, w: 1.8, h: 1.0, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle" });
  if (i < flowItems.length - 1) {
    s5.addShape(prs.ShapeType.rect, { x: x + 1.82, y: 2.01, w: 0.2, h: 0.2, fill: { color: WHITE, transparency: 50 }, line: { color: WHITE }, rectRadius: 0 });
    s5.addText("→", { x: x + 1.8, y: 1.93, w: 0.24, h: 0.36, fontSize: 14, color: WHITE, align: "center" });
  }
});
s5.addText("All linked to ONE job record. Nothing disconnected. Nothing lost.", {
  x: 0.6, y: 2.75, w: 12, h: 0.3, fontSize: 11.5, color: "86EFAC", bold: true, align: "center",
});

const usps = [
  { icon: "🔐", title: "Digital Approval Proof", body: "Timestamped + IP-recorded digital signatures. Disputes prevented before they start." },
  { icon: "💳", title: "Online Payment Collection", body: "Clients pay by card from the invoice link. Stripe-powered. Partial payments supported." },
  { icon: "📊", title: "Real-Time Financial View", body: "Outstanding amounts, invoiced vs. collected, pipeline value — all live on the dashboard." },
  { icon: "👥", title: "No Per-User Pricing", body: "Add every crew member at no extra cost. Plans include fixed team sizes." },
  { icon: "⚡", title: "15-Minute Setup", body: "No consultants, no training period. Quote on day one." },
  { icon: "🌍", title: "Multilingual Client Pages", body: "Client-facing surfaces in English, Spanish, and Portuguese." },
];
usps.forEach((u, i) => {
  const x = 0.45 + (i % 3) * 4.2;
  const y = 3.2 + Math.floor(i / 3) * 1.75;
  s5.addShape(prs.ShapeType.rect, { x, y, w: 4.0, h: 1.55, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.1 });
  s5.addText(u.icon, { x: x + 0.15, y: y + 0.2, w: 0.6, h: 0.6, fontSize: 22, align: "center" });
  s5.addText(u.title, { x: x + 0.82, y: y + 0.18, w: 3.0, h: 0.3, fontSize: 12, bold: true, color: WHITE });
  s5.addText(u.body, { x: x + 0.82, y: y + 0.5, w: 3.0, h: 0.8, fontSize: 10, color: "8AA0BB", lineSpacingMultiple: 1.3 });
});

// ════════════════════════════════════════════════════════
// SLIDE 6 — TARGET AUDIENCE
// ════════════════════════════════════════════════════════
const s6 = prs.addSlide();
navyBg(s6);
sectionLabel(s6, "04 · Target Audience", 0.6, 0.5);
s6.addText("Who Clear Build Is Built For", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s6.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.4, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

// Primary persona
s6.addShape(prs.ShapeType.rect, { x: 0.5, y: 1.58, w: 5.9, h: 5.6, fill: { color: NAVY }, line: { color: GREEN, width: 1 }, rectRadius: 0.14 });
s6.addShape(prs.ShapeType.rect, { x: 0.5, y: 1.58, w: 5.9, h: 0.6, fill: { color: GREEN, transparency: 20 }, line: { color: GREEN, width: 0 }, rectRadius: 0.1 });
s6.addText("👷  PRIMARY PERSONA", { x: 0.65, y: 1.67, w: 5.6, h: 0.4, fontSize: 12, bold: true, color: WHITE, charSpacing: 1.5 });
s6.addText("The Owner-Operator", { x: 0.65, y: 2.26, w: 5.5, h: 0.4, fontSize: 18, bold: true, color: WHITE });
const p1items = [
  "Runs a residential remodeling business",
  "Annual revenue $500K–$5M, growing",
  "Currently using spreadsheets + email",
  "Lost money on undocumented change orders",
  "Wants to look professional, not hire office staff",
  "Needs software that works from a job site phone",
  "English, Spanish, or Portuguese primary language",
  "Bilingual crews that share job data in one place",
];
bulletList(s6, p1items, 0.65, 2.72, 5.5, 4.0, 10.5);

// Right side personas
const secondaryPersonas = [
  { name: "Project Manager / Admin", desc: "Creates quotes, tracks project stages, follows up on overdue invoices" },
  { name: "Field Crew Lead", desc: "Logs updates from mobile, marks stages complete, communicates with office" },
  { name: "Bookkeeper", desc: "Views invoice/payment history, exports for reconciliation" },
  { name: "Client / Homeowner", desc: "Reviews quotes, digitally approves, pays invoices online — no account needed" },
  { name: "Investor / Stakeholder", desc: "Monitors MRR, churn, plan adoption via admin analytics dashboard" },
];
s6.addText("SECONDARY USERS", { x: 7.0, y: 1.68, w: 5.8, h: 0.28, fontSize: 9, bold: true, color: GREEN, charSpacing: 2 });
secondaryPersonas.forEach((sp, i) => {
  const y = 2.06 + i * 1.0;
  s6.addShape(prs.ShapeType.rect, { x: 7.0, y, w: 6.0, h: 0.82, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.08 });
  s6.addText(sp.name, { x: 7.15, y: y + 0.06, w: 5.7, h: 0.28, fontSize: 12, bold: true, color: WHITE });
  s6.addText(sp.desc, { x: 7.15, y: y + 0.36, w: 5.7, h: 0.35, fontSize: 10, color: "8AA0BB" });
});

s6.addText("INDUSTRY VERTICALS", { x: 7.0, y: 7.08, w: 6.0, h: 0.22, fontSize: 8.5, bold: true, color: AMBER, charSpacing: 2 });
const verticals = ["General Contractors", "Kitchen & Bath", "Roofing", "Flooring", "HVAC / Electrical", "Landscaping"];
verticals.forEach((v, i) => {
  s6.addShape(prs.ShapeType.rect, { x: 7.0 + (i % 3) * 2.02, y: 7.3, w: 1.9, h: 0.28, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 0.5 }, rectRadius: 0.06 });
  s6.addText(v, { x: 7.0 + (i % 3) * 2.02, y: 7.3, w: 1.9, h: 0.28, fontSize: 8.5, color: "A7B4CE", align: "center", valign: "middle" });
});

// ════════════════════════════════════════════════════════
// SLIDE 7 — FEATURE OVERVIEW MAP
// ════════════════════════════════════════════════════════
const s7 = prs.addSlide();
navyBg(s7);
sectionLabel(s7, "05 · Feature Set", 0.6, 0.5);
s7.addText("16 Integrated Modules", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s7.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.2, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const features = [
  { icon: "👥", name: "Lead & CRM", cat: "Sales" },
  { icon: "💡", name: "Opportunities", cat: "Sales" },
  { icon: "📋", name: "Quotes", cat: "Financial" },
  { icon: "🔄", name: "Change Orders", cat: "Financial" },
  { icon: "📄", name: "Invoices", cat: "Financial" },
  { icon: "💳", name: "Payments", cat: "Financial" },
  { icon: "🏗️", name: "Projects", cat: "Operations" },
  { icon: "📅", name: "Scheduling", cat: "Operations" },
  { icon: "💬", name: "Communications", cat: "Operations" },
  { icon: "🔔", name: "Notifications", cat: "Operations" },
  { icon: "💰", name: "Expenses", cat: "Operations" },
  { icon: "📦", name: "Templates", cat: "Tools" },
  { icon: "🤖", name: "AI Chatbot", cat: "Tools" },
  { icon: "📊", name: "Audit Log", cat: "Tools" },
  { icon: "⚙️", name: "Settings", cat: "Tools" },
  { icon: "🌟", name: "Client Portal", cat: "Client" },
];
const catColors = { Sales: GREEN, Financial: BLUE, Operations: AMBER, Tools: "8B5CF6", Client: "EC4899" };
const cols4 = 4;
features.forEach((f, i) => {
  const col = i % cols4;
  const row = Math.floor(i / cols4);
  const x = 0.4 + col * 3.14;
  const y = 1.6 + row * 1.4;
  s7.addShape(prs.ShapeType.rect, { x, y, w: 3.0, h: 1.25, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.1 });
  s7.addShape(prs.ShapeType.rect, { x, y, w: 3.0, h: 0.22, fill: { color: catColors[f.cat], transparency: 70 }, line: { color: NAVY2, width: 0 }, rectRadius: 0.08 });
  s7.addText(f.cat, { x: x + 0.08, y: y + 0.02, w: 2.8, h: 0.18, fontSize: 7, bold: true, color: catColors[f.cat], charSpacing: 1.5 });
  s7.addText(f.icon, { x: x + 0.12, y: y + 0.28, w: 0.55, h: 0.55, fontSize: 22, align: "center", valign: "middle" });
  s7.addText(f.name, { x: x + 0.72, y: y + 0.3, w: 2.1, h: 0.5, fontSize: 13, bold: true, color: WHITE, valign: "middle" });
});

// ════════════════════════════════════════════════════════
// SLIDE 8 — FEATURE DEEP DIVE: FINANCIAL CHAIN
// ════════════════════════════════════════════════════════
const s8 = prs.addSlide();
navyBg(s8);
sectionLabel(s8, "05 · Feature Deep Dive", 0.6, 0.5);
s8.addText("The Financial Control Chain", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s8.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const chainDetails = [
  {
    title: "Quotes", icon: "📋", color: BLUE,
    points: ["Itemized line items + tax + discounts", "Auto-numbered Q-0001…", "Status: Draft → Sent → Viewed → Approved", "Public preview page (no client login)", "Quote history & versions"],
  },
  {
    title: "Digital Approval", icon: "✅", color: GREEN,
    points: ["Shareable link — client reviews on any device", "One-click approval with full audit trail", "Proof record: timestamp + IP address", "Status updates to contractor in real time", "Rejection captures reason"],
  },
  {
    title: "Change Orders", icon: "🔄", color: AMBER,
    points: ["Formal scope change linked to original job", "Same approval proof mechanism as quotes", "Auto-updates project budget on approval", "Sequential numbering (CO-0001…)", "Status: Pending → Approved → Voided"],
  },
  {
    title: "Invoices & Payment", icon: "💳", color: "EC4899",
    points: ["Auto-generated from approved quote", "Stripe card payments from pay link", "Partial payments & deposit collection", "Auto overdue reminders", "Pays direct to contractor's Stripe account"],
  },
];
chainDetails.forEach((c, i) => {
  const x = 0.35 + i * 3.16;
  s8.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 5.55, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s8.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 0.55, fill: { color: c.color, transparency: 20 }, line: { color: c.color, width: 1 }, rectRadius: 0.1 });
  s8.addText(`${c.icon}  ${c.title}`, { x: x + 0.12, y: 1.65, w: 2.7, h: 0.42, fontSize: 14, bold: true, color: WHITE, valign: "middle" });
  const bullets = c.points.map(p => ({ text: p, options: { bullet: { code: "25CF", color: c.color }, fontSize: 10.5, color: "A7B4CE", breakLine: true } }));
  s8.addText(bullets, { x: x + 0.12, y: 2.28, w: 2.75, h: 4.5, valign: "top" });
  if (i < chainDetails.length - 1) {
    s8.addText("→", { x: x + 3.02, y: 3.85, w: 0.14, h: 0.4, fontSize: 20, color: "2A4A6A", align: "center" });
  }
});

// ════════════════════════════════════════════════════════
// SLIDE 9 — USER JOURNEY
// ════════════════════════════════════════════════════════
const s9 = prs.addSlide();
navyBg(s9);
sectionLabel(s9, "06 · User Journey", 0.6, 0.5);
s9.addText("10-Step End-to-End Workflow", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s9.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const steps = [
  { n: "1", title: "Register & Setup Business", body: "Create account → verify email → business profile → number prefixes → 14-day trial begins" },
  { n: "2", title: "Invite Team Members", body: "Settings → Team → Email invite → Role assigned (Admin/Member) → Shared workspace access" },
  { n: "3", title: "Add Leads & Clients", body: "Import contacts → Set lead status → Log every interaction (call, email, WhatsApp, SMS)" },
  { n: "4", title: "Create & Send Quote", body: "Add line items + tax → Auto-numbered → Client receives preview link → System tracks views" },
  { n: "5", title: "Client Approves Quote", body: "Client clicks 'Approve' → Timestamp + IP recorded → Contractor sees real-time status change" },
  { n: "6", title: "Manage Change Orders", body: "Scope changes → Formal CO linked to job → Client digitally approves → Budget auto-updates" },
  { n: "7", title: "Create Invoice", body: "One-click from approved quote → Line items carry over → Due date set → Project auto-created" },
  { n: "8", title: "Client Pays Online", body: "Pay link emailed → Stripe card payment → Invoice marks paid → Both parties get email confirmation" },
  { n: "9", title: "Track Project Progress", body: "Budget vs. collected metrics → Stage advancement → Team task assignment → Progress log" },
  { n: "10", title: "Dashboard Monitoring", body: "Active projects, overdue invoices, pending approvals, pipeline value — all actionable in one view" },
];
const stepsPerRow = 5;
steps.forEach((st, i) => {
  const col = i % stepsPerRow;
  const row = Math.floor(i / stepsPerRow);
  const x = 0.35 + col * 2.54;
  const y = 1.58 + row * 2.65;
  const isOdd = row === 1;
  s9.addShape(prs.ShapeType.rect, { x, y, w: 2.4, h: 2.48, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s9.addShape(prs.ShapeType.rect, { x: x + 0.08, y: y + 0.1, w: 0.42, h: 0.42, fill: { color: GREEN }, line: { color: GREEN }, rectRadius: 0.08 });
  s9.addText(st.n, { x: x + 0.08, y: y + 0.1, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });
  s9.addText(st.title, { x: x + 0.12, y: y + 0.6, w: 2.2, h: 0.55, fontSize: 11, bold: true, color: WHITE, lineSpacingMultiple: 1.2 });
  s9.addText(st.body, { x: x + 0.12, y: y + 1.2, w: 2.18, h: 1.1, fontSize: 9.5, color: "7A8FA6", lineSpacingMultiple: 1.3 });
  if (col < stepsPerRow - 1) {
    s9.addText("→", { x: x + 2.4, y: y + 1.0, w: 0.14, h: 0.35, fontSize: 14, color: "2A4A6A" });
  }
});

// ════════════════════════════════════════════════════════
// SLIDE 10 — COMPETITOR COMPARISON
// ════════════════════════════════════════════════════════
const s10 = prs.addSlide();
navyBg(s10);
sectionLabel(s10, "07 · Competitor Analysis", 0.6, 0.5);
s10.addText("How Clear Build Compares", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s10.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const cmpHeaders = ["Feature", "Spreadsheets", "FreshBooks / Wave", "Jobber / ServiceTitan", "Clear Build USA ★"];
const cmpRows = [
  ["Professional itemized quotes",       "✗", "✓", "✓", "✓"],
  ["Digital approval + proof of record", "✗", "✗", "~", "✓"],
  ["Formal change order tracking",       "✗", "✗", "~", "✓"],
  ["Online card payment collection",     "✗", "✓", "✓", "✓"],
  ["Quote → Invoice → Payment on one job","✗", "✗", "✓", "✓"],
  ["Budget vs. collected real-time view","✗", "✗", "✓", "✓"],
  ["Mobile-friendly for field use",      "✗", "~", "✓", "✓"],
  ["Multilingual client surfaces",       "✗", "✗", "✗", "✓"],
  ["No per-user pricing",                "✓", "✗", "✗", "✓"],
  ["Setup in under 15 minutes",          "✓", "✓", "✗", "✓"],
  ["Built for remodeling specifically",  "✗", "✗", "~", "✓"],
  ["Integrated AI assistant",            "✗", "✗", "✗", "✓"],
  ["Starting price / month",             "$0*", "$19+", "$49/user", "$49 flat"],
];
const cmpColW = [3.4, 1.6, 2.1, 2.35, 2.35];
const cmpX = [0.35, 3.78, 5.4, 7.54, 9.92];
const cmpRowH = 0.38;
const cmpStartY = 1.62;
// Header row
cmpHeaders.forEach((h, ci) => {
  const isCB = ci === 4;
  s10.addShape(prs.ShapeType.rect, {
    x: cmpX[ci], y: cmpStartY, w: cmpColW[ci], h: 0.42,
    fill: { color: isCB ? GREEN : "1A3050" },
    line: { color: "2A4A6A", width: 0.5 },
    rectRadius: ci === 0 ? 0 : 0,
  });
  s10.addText(h, { x: cmpX[ci] + 0.08, y: cmpStartY, w: cmpColW[ci] - 0.1, h: 0.42, fontSize: isCB ? 10.5 : 9.5, bold: true, color: isCB ? NAVY2 : WHITE, valign: "middle", align: ci > 0 ? "center" : "left" });
});
// Data rows
cmpRows.forEach((row, ri) => {
  const rowY = cmpStartY + 0.42 + ri * cmpRowH;
  const even = ri % 2 === 0;
  row.forEach((cell, ci) => {
    const isCB = ci === 4;
    const fg = cell === "✓" ? GREEN2 : cell === "✗" ? RED : cell === "~" ? AMBER : (isCB ? WHITE : "A7B4CE");
    s10.addShape(prs.ShapeType.rect, {
      x: cmpX[ci], y: rowY, w: cmpColW[ci], h: cmpRowH,
      fill: { color: isCB ? "1A3B6E" : even ? "192E4A" : "1A3050" },
      line: { color: "2A4A6A", width: 0.3 },
    });
    s10.addText(cell, {
      x: cmpX[ci] + 0.08, y: rowY, w: cmpColW[ci] - 0.1, h: cmpRowH,
      fontSize: 10.5, bold: cell === "✓" || cell === "✗", color: fg,
      align: ci > 0 ? "center" : "left", valign: "middle",
    });
  });
});
s10.addText("* Spreadsheets have hidden costs: re-keying time, disputes, lost cash flow.  ~ = partial support only", {
  x: 0.35, y: 7.22, w: 12.6, h: 0.22, fontSize: 8, color: "4A6880", italic: true,
});

// ════════════════════════════════════════════════════════
// SLIDE 11 — PRICING
// ════════════════════════════════════════════════════════
const s11 = prs.addSlide();
navyBg(s11);
sectionLabel(s11, "08 · Pricing & Business Model", 0.6, 0.5);
s11.addText("Simple, Flat Pricing", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s11.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.2, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });
s11.addText("No per-user penalty. No hidden fees. Yearly billing saves 2 months.", {
  x: 0.6, y: 1.55, w: 12, h: 0.3, fontSize: 12.5, color: "8AA0BB", italic: true,
});

const plans = [
  { name: "Solo", icon: "👤", price: "$49", per: "/mo", yearly: "~$490/yr", tag: "For solo operators", color: BLUE, feats: ["Up to 2 team members", "Quotes + Approvals", "Change orders", "Invoices + Stripe payments", "Project tracking", "Notifications + Email"] },
  { name: "Crew", icon: "👥", price: "$99", per: "/mo", yearly: "~$990/yr", tag: "Most Popular", color: GREEN, feats: ["Up to 8 team members", "Everything in Solo", "Scheduling & calendar", "Budget vs. collected", "Approval proof history", "Priority support"] },
  { name: "Business", icon: "🏢", price: "$179", per: "/mo", yearly: "~$1,790/yr", tag: "For established remodelers", color: AMBER, feats: ["Up to 15 team members", "Everything in Crew", "Advanced project stages", "Multilingual client surfaces", "Custom templates", "Full audit logging"] },
];
plans.forEach((pl, i) => {
  const x = 0.45 + i * 4.24;
  const isPop = i === 1;
  s11.addShape(prs.ShapeType.rect, { x, y: 2.0, w: 4.0, h: 5.12, fill: { color: isPop ? "1A3B6E" : "1A3050" }, line: { color: isPop ? pl.color : "2A4A6A", width: isPop ? 2 : 1 }, rectRadius: 0.14 });
  if (isPop) {
    s11.addShape(prs.ShapeType.rect, { x: x + 0.8, y: 1.85, w: 2.4, h: 0.3, fill: { color: pl.color }, line: { color: pl.color }, rectRadius: 0.12 });
    s11.addText("MOST POPULAR", { x: x + 0.8, y: 1.85, w: 2.4, h: 0.3, fontSize: 8, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1.5 });
  }
  s11.addText(pl.icon + "  " + pl.name, { x: x + 0.18, y: 2.12, w: 3.6, h: 0.42, fontSize: 17, bold: true, color: WHITE });
  s11.addText(pl.tag, { x: x + 0.18, y: 2.56, w: 3.6, h: 0.24, fontSize: 9.5, color: "8AA0BB" });
  s11.addShape(prs.ShapeType.rect, { x: x + 0.18, y: 2.86, w: 3.6, h: 0.015, fill: { color: "2A4A6A" }, line: { color: "2A4A6A" } });
  s11.addText(pl.price, { x: x + 0.18, y: 2.95, w: 1.8, h: 0.7, fontSize: 40, bold: true, color: pl.color, fontFace: "Arial" });
  s11.addText(pl.per, { x: x + 1.5, y: 3.32, w: 0.8, h: 0.28, fontSize: 14, color: "8AA0BB" });
  s11.addText("monthly · " + pl.yearly + " yearly", { x: x + 0.18, y: 3.7, w: 3.6, h: 0.22, fontSize: 9, color: "6B8AA8" });
  s11.addShape(prs.ShapeType.rect, { x: x + 0.18, y: 4.0, w: 3.6, h: 0.015, fill: { color: "2A4A6A" }, line: { color: "2A4A6A" } });
  const featBullets = pl.feats.map(f => ({ text: f, options: { bullet: { code: "25CF", color: pl.color }, fontSize: 10.5, color: "A7B4CE", breakLine: true } }));
  s11.addText(featBullets, { x: x + 0.18, y: 4.12, w: 3.6, h: 2.6, valign: "top" });
});

s11.addText("14-day free trial  ·  No credit card required  ·  Cancel anytime", {
  x: 0, y: 7.18, w: 13.33, h: 0.28, fontSize: 11, bold: true, color: GREEN, align: "center",
});

// ════════════════════════════════════════════════════════
// SLIDE 12 — ADMIN PANEL
// ════════════════════════════════════════════════════════
const s12 = prs.addSlide();
navyBg(s12);
sectionLabel(s12, "09 · Admin Panel & Operations", 0.6, 0.5);
s12.addText("Platform Operations Dashboard", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s12.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

s12.addText("Separate admin panel at /admin — secured with own JWT auth (12h expiry). Full platform management without touching the database.", {
  x: 0.6, y: 1.55, w: 12, h: 0.35, fontSize: 11.5, color: "8AA0BB",
});

const adminFeats = [
  { icon: "📊", title: "Admin Dashboard", body: "MRR, signups (30/90d), churn rate, plan distribution, revenue trends" },
  { icon: "🏢", title: "Business Management", body: "Inspect every business, subscription, trial status, member count. Extend trials manually." },
  { icon: "👤", title: "User Management", body: "View/ban users, force logout, reset passwords, impersonate for support" },
  { icon: "💳", title: "Subscription Control", body: "View all plans: active/trial/cancelled. Cancel or override subscriptions." },
  { icon: "💰", title: "Payment History", body: "Stripe-sourced records across all businesses. Filter by date, monitor failures." },
  { icon: "🏷️", title: "Coupon Codes", body: "Create promo codes: discount %, expiry date, max-use limits. Real-time usage counter." },
  { icon: "📣", title: "Broadcasts", body: "System-wide announcements to all users or targeted segments via in-app notifications" },
  { icon: "📋", title: "Full Audit Trail", body: "Every admin action logged: actor, entity, action, payload, timestamp" },
  { icon: "🎭", title: "User Impersonation", body: "Debug on behalf of any user (1hr scoped session). Fully audit-logged. Proof of exit." },
  { icon: "📖", title: "FAQs & Tutorials", body: "Manage help center content. Publish FAQ articles and tutorial videos in-app." },
  { icon: "📈", title: "Analytics", body: "Signup cohorts, revenue by plan, active vs. churned, 30/60/90-day comparison" },
  { icon: "⚙️", title: "Plans & Pricing", body: "Create/edit plans with Stripe price IDs. Changes sync live via Stripe webhook." },
];
adminFeats.forEach((a, i) => {
  const x = 0.35 + (i % 4) * 3.16;
  const y = 2.1 + Math.floor(i / 4) * 1.7;
  s12.addShape(prs.ShapeType.rect, { x, y, w: 3.02, h: 1.55, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.1 });
  s12.addText(a.icon, { x: x + 0.12, y: y + 0.12, w: 0.55, h: 0.55, fontSize: 20, align: "center", valign: "middle" });
  s12.addText(a.title, { x: x + 0.72, y: y + 0.1, w: 2.2, h: 0.3, fontSize: 11, bold: true, color: WHITE });
  s12.addText(a.body, { x: x + 0.72, y: y + 0.43, w: 2.2, h: 0.85, fontSize: 9.5, color: "7A8FA6", lineSpacingMultiple: 1.3 });
});
// Role table
s12.addText("Admin Roles: super_admin → developer → billing → support → readonly", {
  x: 0.35, y: 7.18, w: 12.6, h: 0.26, fontSize: 9.5, color: GREEN, bold: true,
});

// ════════════════════════════════════════════════════════
// SLIDE 13 — BUSINESS ANALYSIS & SWOT
// ════════════════════════════════════════════════════════
const s13 = prs.addSlide();
navyBg(s13);
sectionLabel(s13, "10 · Business Analysis", 0.6, 0.5);
s13.addText("SWOT Analysis", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s13.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.0, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const swot = [
  {
    label: "STRENGTHS", color: GREEN, icon: "💪",
    items: ["Complete quote-to-payment chain in one tool", "Digital approval proof — unique differentiator", "No per-user pricing — grows with team", "EN/ES/PT multilingual for diverse US workforce", "Modern tech stack with low operational overhead", "14-day trial removes friction to conversion"],
  },
  {
    label: "WEAKNESSES", color: RED, icon: "⚠️",
    items: ["No native mobile app (web only)", "No QuickBooks / accounting sync", "E2E test coverage still in progress", "Brand awareness limited — early stage", "Admin-only coupon system, no self-serve promo UI", "No document e-sign integration (DocuSign)"],
  },
  {
    label: "OPPORTUNITIES", color: BLUE, icon: "🚀",
    items: ["$500B+ US remodeling market growing 5%/yr", "High portion of contractors still on spreadsheets", "Bilingual workforce = underserved EN/ES segment", "Expand to Canada, UK, Australia remodelers", "QuickBooks integration opens accounting channel", "White-label for franchise / large contractor groups"],
  },
  {
    label: "THREATS", color: AMBER, icon: "⚡",
    items: ["Jobber / ServiceTitan adding more features", "Generic tools (Notion, Monday) as DIY alternatives", "Stripe pricing changes could affect margins", "AI-powered competitors entering the market", "Customer concentration risk in early stage", "Payment processing regulatory changes"],
  },
];
swot.forEach((q, i) => {
  const x = 0.35 + (i % 2) * 6.3;
  const y = 1.58 + Math.floor(i / 2) * 2.82;
  s13.addShape(prs.ShapeType.rect, { x, y, w: 6.1, h: 2.64, fill: { color: "1A3050" }, line: { color: q.color, width: 1 }, rectRadius: 0.12 });
  s13.addShape(prs.ShapeType.rect, { x, y, w: 6.1, h: 0.48, fill: { color: q.color, transparency: 20 }, line: { color: NAVY2, width: 0 }, rectRadius: 0.1 });
  s13.addText(`${q.icon}  ${q.label}`, { x: x + 0.15, y: y + 0.08, w: 5.7, h: 0.34, fontSize: 13, bold: true, color: WHITE, charSpacing: 1 });
  const bul = q.items.map(it => ({ text: it, options: { bullet: { code: "25CF", color: q.color }, fontSize: 10, color: "A7B4CE", breakLine: true } }));
  s13.addText(bul, { x: x + 0.15, y: y + 0.56, w: 5.75, h: 1.9, valign: "top" });
});

// ════════════════════════════════════════════════════════
// SLIDE 14 — MARKET & REVENUE
// ════════════════════════════════════════════════════════
const s14 = prs.addSlide();
navyBg(s14);
sectionLabel(s14, "10 · Market Opportunity", 0.6, 0.5);
s14.addText("Market Size & Revenue Model", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s14.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.5, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const mktStats = [
  { val: "$500B+", label: "US Remodeling Market\n(annual, growing 5%/yr)", color: GREEN },
  { val: "~3M", label: "US Remodeling Businesses\n(target segment: 10–15%)", color: BLUE },
  { val: "~70%", label: "Still Using Spreadsheets\nor Paper-Based Tools", color: AMBER },
  { val: "$49–$179", label: "Monthly Revenue per\nCustomer (MRR potential)", color: "8B5CF6" },
];
mktStats.forEach((ms, i) => {
  const x = 0.4 + i * 3.1;
  s14.addShape(prs.ShapeType.rect, { x, y: 1.62, w: 2.9, h: 2.0, fill: { color: "1A3050" }, line: { color: ms.color, width: 1.5 }, rectRadius: 0.14 });
  s14.addText(ms.val, { x, y: 1.75, w: 2.9, h: 0.7, fontSize: 30, bold: true, color: ms.color, align: "center", fontFace: "Arial" });
  s14.addText(ms.label, { x: x + 0.1, y: 2.5, w: 2.7, h: 0.8, fontSize: 10.5, color: "A7B4CE", align: "center", lineSpacingMultiple: 1.3 });
});

s14.addText("Revenue Model", { x: 0.6, y: 3.82, w: 6, h: 0.38, fontSize: 16, bold: true, color: WHITE });
const revItems = [
  "Monthly / Annual SaaS subscriptions (Solo $49, Crew $99, Business $179)",
  "Yearly billing at ~17% discount drives higher LTV and lower churn",
  "14-day free trial → conversion funnel with no credit card friction",
  "Coupon/promo system for partnerships and growth campaigns",
  "Future: white-label licensing for franchise contractor networks",
];
bulletList(s14, revItems, 0.6, 4.25, 6.4, 3.0, 11);

s14.addText("Growth Opportunity", { x: 7.2, y: 3.82, w: 6, h: 0.38, fontSize: 16, bold: true, color: WHITE });
const growItems = [
  "Expand to Canada, UK, Australia (same remodeler profile)",
  "QuickBooks + Xero integrations open accounting advisory channel",
  "Mobile native app to capture field-first users",
  "API webhooks for third-party ecosystem integrations",
  "Enterprise / franchise white-label licensing (high ACV)",
  "Referral program: contractors recommend to peers",
];
bulletList(s14, growItems, 7.2, 4.25, 6.0, 3.0, 11);

// ════════════════════════════════════════════════════════
// SLIDE 15 — TECHNOLOGY STACK
// ════════════════════════════════════════════════════════
const s15 = prs.addSlide();
navyBg(s15);
sectionLabel(s15, "11 · Technology Stack", 0.6, 0.5);
s15.addText("Modern, Production-Grade Architecture", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s15.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.6, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const techLayers = [
  {
    layer: "FRONTEND",
    color: BLUE,
    items: ["Next.js 15 (App Router)", "React 19", "TypeScript 5", "Tailwind CSS 3", "next-intl (EN/ES/PT)"],
  },
  {
    layer: "BACKEND / API",
    color: GREEN,
    items: ["Next.js API Routes", "Custom JWT auth (jose)", "bcryptjs (12 rounds)", "Multi-tenant isolation", "Supabase PostgreSQL"],
  },
  {
    layer: "INTEGRATIONS",
    color: AMBER,
    items: ["Stripe (payments + billing)", "Resend (email)", "Google Gemini AI", "Google Maps (autocomplete)", "Stripe Webhooks"],
  },
  {
    layer: "INFRASTRUCTURE",
    color: "8B5CF6",
    items: ["Vercel (hosting + CDN)", "GitHub CI/CD", "Pre-built .next artifacts", "Playwright E2E tests", "Supabase Storage"],
  },
];
techLayers.forEach((tl, i) => {
  const x = 0.35 + i * 3.18;
  s15.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 4.0, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s15.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 0.46, fill: { color: tl.color, transparency: 20 }, line: { color: tl.color, width: 1 }, rectRadius: 0.1 });
  s15.addText(tl.layer, { x: x + 0.1, y: 1.65, w: 2.8, h: 0.32, fontSize: 10, bold: true, color: WHITE, charSpacing: 2, align: "center" });
  const bul = tl.items.map(it => ({ text: it, options: { bullet: { code: "25CF", color: tl.color }, fontSize: 11, color: "A7B4CE", breakLine: true } }));
  s15.addText(bul, { x: x + 0.1, y: 2.1, w: 2.8, h: 3.2, valign: "top" });
});

// Security pillars
s15.addText("Security Architecture", { x: 0.5, y: 5.75, w: 5, h: 0.35, fontSize: 15, bold: true, color: WHITE });
const secItems = [
  "Custom JWT auth — no third-party auth provider",
  "force_logout_at — sessions invalidated on password change",
  "Multi-tenancy: every API filters by session.businessId",
  "Admin impersonation fully audit-logged, 1hr session limit",
  "Stripe webhooks verified with signing secret + idempotency guard",
];
bulletList(s15, secItems, 0.5, 6.15, 6.2, 1.2, 10.5);

const perfItems = [
  "Vercel global CDN — sub-100ms TTFB worldwide",
  "Pre-built .next artifacts (Hostinger never needs to build)",
  "Static pages (132 routes) pre-rendered at build time",
  "Dynamic routes server-rendered on demand",
  "Application-level RLS bypass for query performance",
];
s15.addText("Performance & Scalability", { x: 7.0, y: 5.75, w: 5.8, h: 0.35, fontSize: 15, bold: true, color: WHITE });
bulletList(s15, perfItems, 7.0, 6.15, 6.1, 1.2, 10.5);

// ════════════════════════════════════════════════════════
// SLIDE 16 — DESIGN & UX
// ════════════════════════════════════════════════════════
const s16 = prs.addSlide();
navyBg(s16);
sectionLabel(s16, "12 · Design & User Experience", 0.6, 0.5);
s16.addText("UI/UX Evaluation", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s16.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.0, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const uxStrengths = [
  "Consistent design system (btn, card, badge, table classes)",
  "Brand colors: Navy #123B5D + Green #3FA66B — professional, trustworthy",
  "Mobile-responsive — works seamlessly on phones/tablets in the field",
  "Client-facing pages are clean, branded, and require no login",
  "Empty state components guide new users to first action",
  "Toast notifications confirm every user action",
  "Multilingual client surfaces (EN/ES/PT) — unique in the market",
];
const uxImprove = [
  "Native mobile app — critical for field-first contractors",
  "Drag-and-drop quote builder for non-technical users",
  "Dark mode for admin and dashboard views",
  "Onboarding tour/checklist for new users (tour system exists, expand it)",
  "Keyboard shortcut system for power users",
  "Rich text / signature block in quote templates",
  "Bulk actions on tables (bulk delete, bulk status change)",
];
s16.addText("✓  Design Strengths", { x: 0.5, y: 1.58, w: 6, h: 0.34, fontSize: 14, bold: true, color: GREEN });
bulletList(s16, uxStrengths, 0.5, 1.96, 6.2, 2.8, 11);
s16.addText("→  Improvement Opportunities", { x: 7.0, y: 1.58, w: 6, h: 0.34, fontSize: 14, bold: true, color: AMBER });
bulletList(s16, uxImprove, 7.0, 1.96, 6.0, 2.8, 11);

// Accessibility
s16.addShape(prs.ShapeType.rect, { x: 0.5, y: 4.9, w: 12.4, h: 0.04, fill: { color: "2A4A6A" }, line: { color: "2A4A6A" } });
s16.addText("Accessibility", { x: 0.5, y: 5.05, w: 4, h: 0.34, fontSize: 14, bold: true, color: WHITE });
const a11yItems = [
  "Semantic HTML structure — native screen reader support",
  "Focus-visible styles — keyboard navigation possible",
  "Color contrast: Navy on white passes AA standard",
  "Improvement needed: explicit ARIA labels on icon-only buttons",
  "Improvement needed: form error messages linked via aria-describedby",
];
bulletList(s16, a11yItems, 0.5, 5.42, 12.2, 1.8, 11);

// ════════════════════════════════════════════════════════
// SLIDE 17 — ROADMAP
// ════════════════════════════════════════════════════════
const s17 = prs.addSlide();
navyBg(s17);
sectionLabel(s17, "13 · Future Roadmap", 0.6, 0.5);
s17.addText("Strategic Roadmap", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 32, bold: true, color: WHITE, fontFace: "Arial" });
s17.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.2, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const roadmap = [
  {
    phase: "Phase 1 — Now", horizon: "Q3 2026", color: GREEN,
    items: ["Complete Playwright E2E test suite (BrowserStack)", "Expense tracking module completion", "Mobile responsive polish for field users", "QuickBooks / Xero integration (accounting sync)", "Advanced CSV exports and reporting"],
  },
  {
    phase: "Phase 2 — Near", horizon: "Q4 2026", color: BLUE,
    items: ["Native iOS + Android mobile app", "Drag-and-drop quote builder", "Recurring invoices and subscription billing for clients", "Client portal (persistent login for homeowners)", "Advanced analytics: project profitability reports"],
  },
  {
    phase: "Phase 3 — Medium", horizon: "H1 2027", color: AMBER,
    items: ["API webhooks for third-party integrations", "White-label platform for franchise groups", "Multi-currency support (Canada, Australia, UK)", "Referral + affiliate program for growth", "DocuSign / HelloSign e-signature integration"],
  },
  {
    phase: "Phase 4 — Vision", horizon: "H2 2027+", color: "8B5CF6",
    items: ["AI-powered quote generation from job description", "Predictive payment risk scoring", "Automated scope-to-quote from photo/video input", "Marketplace: subcontractor / material sourcing", "Enterprise tier for 50+ employee organizations"],
  },
];
roadmap.forEach((rp, i) => {
  const x = 0.35 + i * 3.18;
  s17.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 5.6, fill: { color: "1A3050" }, line: { color: "2A4A6A", width: 1 }, rectRadius: 0.12 });
  s17.addShape(prs.ShapeType.rect, { x, y: 1.58, w: 3.0, h: 0.54, fill: { color: rp.color, transparency: 20 }, line: { color: rp.color, width: 1 }, rectRadius: 0.1 });
  s17.addText(rp.phase, { x: x + 0.1, y: 1.65, w: 2.8, h: 0.28, fontSize: 11, bold: true, color: WHITE });
  s17.addShape(prs.ShapeType.roundRect, { x: x + 0.1, y: 1.96, w: 1.5, h: 0.22, fill: { color: rp.color, transparency: 50 }, line: { color: rp.color, width: 0.5 }, rectRadius: 0.08 });
  s17.addText(rp.horizon, { x: x + 0.1, y: 1.96, w: 1.5, h: 0.22, fontSize: 8.5, color: WHITE, align: "center", valign: "middle" });
  const bul = rp.items.map(it => ({ text: it, options: { bullet: { code: "25CF", color: rp.color }, fontSize: 10.5, color: "A7B4CE", breakLine: true } }));
  s17.addText(bul, { x: x + 0.1, y: 2.24, w: 2.8, h: 4.6, valign: "top" });
});

// ════════════════════════════════════════════════════════
// SLIDE 18 — RECOMMENDATIONS
// ════════════════════════════════════════════════════════
const s18 = prs.addSlide();
navyBg(s18);
sectionLabel(s18, "14 · Recommendations", 0.6, 0.5);
s18.addText("Strategic Recommendations", { x: 0.6, y: 0.78, w: 12, h: 0.55, fontSize: 30, bold: true, color: WHITE, fontFace: "Arial" });
s18.addShape(prs.ShapeType.rect, { x: 0.6, y: 1.38, w: 1.5, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const recs = [
  {
    area: "Product", icon: "🛠️", color: BLUE,
    items: ["Build mobile app (React Native) — field-use is where competitors win", "Add QuickBooks integration — most requested by target customers", "Launch client portal so homeowners can view all their job history"],
  },
  {
    area: "Technical", icon: "⚙️", color: GREEN,
    items: ["Complete E2E test suite (Playwright/BrowserStack) before scaling marketing", "Add row-level security as backup defense-in-depth layer", "Introduce API rate limiting per business_id to prevent abuse"],
  },
  {
    area: "Business Growth", icon: "📈", color: AMBER,
    items: ["Launch contractor referral program ($25 credit per successful signup)", "Partner with building supply stores for co-marketing", "Create YouTube tutorial series for SEO + inbound marketing"],
  },
  {
    area: "Marketing", icon: "📣", color: "EC4899",
    items: ["Target Spanish-speaking contractor Facebook groups (unserved market)", "List on Capterra, G2, GetApp for B2B SaaS discovery", "Offer free CSV quote import from competitors to reduce switching friction"],
  },
];
recs.forEach((r, i) => {
  const x = 0.35 + (i % 2) * 6.35;
  const y = 1.62 + Math.floor(i / 2) * 2.8;
  s18.addShape(prs.ShapeType.rect, { x, y, w: 6.15, h: 2.55, fill: { color: "1A3050" }, line: { color: r.color, width: 1 }, rectRadius: 0.12 });
  s18.addShape(prs.ShapeType.rect, { x, y, w: 6.15, h: 0.48, fill: { color: r.color, transparency: 22 }, line: { color: NAVY2, width: 0 }, rectRadius: 0.1 });
  s18.addText(`${r.icon}  ${r.area}`, { x: x + 0.15, y: y + 0.1, w: 5.8, h: 0.32, fontSize: 13, bold: true, color: WHITE });
  const bul = r.items.map(it => ({ text: it, options: { bullet: { code: "25CF", color: r.color }, fontSize: 11, color: "A7B4CE", breakLine: true } }));
  s18.addText(bul, { x: x + 0.15, y: y + 0.56, w: 5.8, h: 1.8, valign: "top" });
});

// ════════════════════════════════════════════════════════
// SLIDE 19 — CLOSING / CTA
// ════════════════════════════════════════════════════════
const s19 = prs.addSlide();
s19.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: NAVY2 }, line: { color: NAVY2 } });
s19.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.1, fill: { color: GREEN }, line: { color: GREEN } });
s19.addShape(prs.ShapeType.rect, { x: 0, y: 7.4, w: 13.33, h: 0.1, fill: { color: GREEN }, line: { color: GREEN } });

s19.addText("Clear Build USA", { x: 1.0, y: 1.5, w: 11.33, h: 0.8, fontSize: 48, bold: true, color: WHITE, align: "center", fontFace: "Arial" });
s19.addText("The One Tool That Connects the Whole Job", {
  x: 1.0, y: 2.4, w: 11.33, h: 0.5, fontSize: 20, color: "A7B4CE", align: "center",
});
s19.addShape(prs.ShapeType.rect, { x: 5.0, y: 3.05, w: 3.33, h: 0.04, fill: { color: GREEN }, line: { color: GREEN } });

const ctaItems = ["✓ 14-day free trial", "✓ No credit card required", "✓ Setup in 15 minutes", "✓ No per-user pricing"];
s19.addText(ctaItems.join("     "), {
  x: 1.0, y: 3.3, w: 11.33, h: 0.4, fontSize: 13, color: "86EFAC", bold: true, align: "center",
});
s19.addText("clearbuildusa.com", {
  x: 1.0, y: 4.0, w: 11.33, h: 0.6, fontSize: 28, bold: true, color: GREEN, align: "center", fontFace: "Arial",
});
s19.addText("Questions? Internal distribution only. June 2026.", {
  x: 1.0, y: 6.8, w: 11.33, h: 0.3, fontSize: 9.5, color: "4A6880", align: "center",
});

// ── WRITE ─────────────────────────────────────────────
await prs.writeFile({ fileName: OUT_FILE });
console.log(`✅ Presentation saved: ${OUT_FILE}`);
console.log(`   Slides: 19`);
