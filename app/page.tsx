"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Check, ChevronDown, Menu, X, FileText, Receipt,
  Briefcase, Users, Bell, Calendar, CreditCard,
  BarChart3, Zap, Shield, ArrowRight, Star,
  Clock, TrendingUp, CheckCircle,
} from "lucide-react";

/* ─── Brand tokens ────────────────────────────────────────────────── */
const N900 = "#0D1836";   // very dark navy
const N700 = "#1B2D5E";   // primary navy
const GREEN = "#3FA66B";  // accent green
const GBG   = "#F0FBF4";  // green tint bg

/* ─── Content ─────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: FileText,   title: "Quotes & Change Orders",   desc: "Build professional quotes with line items, taxes, and optional add-ons. Clients approve and e-sign online — no printing, no PDFs." },
  { icon: Receipt,    title: "Invoices & Online Payment", desc: "Send invoices and collect card payments via a secure link. Track paid, outstanding, and overdue at a glance." },
  { icon: Briefcase,  title: "Project Tracking",          desc: "Link quotes, invoices, and progress updates to a project. Track budget vs actual cost in real time." },
  { icon: Users,      title: "Contacts & Lead Pipeline",  desc: "Manage every lead and customer in one place. Track status from first call through to closed deal." },
  { icon: Bell,       title: "Notifications & Comms",     desc: "Send email, SMS, and WhatsApp from inside the app using saved templates. Never chase a client manually again." },
  { icon: Calendar,   title: "Scheduling & Booking",      desc: "Share a booking link — clients pick a slot that works. Confirmation emails sent to both sides automatically." },
];

const STEPS = [
  {
    step: "01", title: "Add contacts & leads",
    desc: "Import or add contacts in seconds. Track every lead from first touch through to signed contract — no spreadsheet needed.",
    mock: <LeadMock />,
  },
  {
    step: "02", title: "Create & send quotes",
    desc: "Build itemized quotes in minutes. Send a review link — clients approve and sign online. You get notified instantly.",
    mock: <QuoteMock />,
  },
  {
    step: "03", title: "Invoice & collect payment",
    desc: "Convert approved quotes into invoices. Clients pay by card online. Funds land in your account automatically.",
    mock: <InvoiceMock />,
  },
];

const CALLOUTS = [
  {
    label: "QUOTES",
    title: "Win more jobs with quotes that look the part",
    points: [
      "Line-item breakdowns clients actually understand",
      "Optional add-ons so clients can upgrade themselves",
      "E-signature — approved in one click, no PDF required",
      "Change orders linked directly to the original quote",
    ],
    mock: <QuoteMock large />,
    flip: false,
  },
  {
    label: "INVOICES",
    title: "Get paid faster. Stop chasing payments manually",
    points: [
      "One-click invoice from an approved quote",
      "Clients pay by card via a secure payment link",
      "Partial payments and running balance tracked",
      "Overdue reminders sent automatically",
    ],
    mock: <InvoiceMock large />,
    flip: true,
  },
  {
    label: "PROJECTS",
    title: "Keep every job organized from start to finish",
    points: [
      "Link quotes, invoices, and payments to a project",
      "Budget vs actual cost tracked in real time",
      "Team updates and notes in one timeline",
      "Change orders don't fall through the cracks",
    ],
    mock: <ProjectMock />,
    flip: false,
  },
];

const COMPARISON = [
  { feature: "Professional quotes & e-signatures",  cb: true,  sheets: false, software: true },
  { feature: "Online payment collection",           cb: true,  sheets: false, software: "Limited" },
  { feature: "Change order tracking",               cb: true,  sheets: false, software: "Add-on" },
  { feature: "Client booking links",                cb: true,  sheets: false, software: false },
  { feature: "Mobile-friendly UI",                  cb: true,  sheets: false, software: false },
  { feature: "Set up in under 15 minutes",          cb: true,  sheets: true,  software: false },
  { feature: "Built for remodelers specifically",   cb: true,  sheets: false, software: false },
  { feature: "No per-user pricing",                 cb: true,  sheets: false, software: false },
];

const FIT_FOR = [
  "Owner-operators running $500K – $5M revenue businesses",
  "Remodelers tired of losing track of quotes and invoices",
  "Contractors who want to look more professional to clients",
  "Teams of 1–15 who don't need enterprise complexity",
  "Businesses moving off spreadsheets or generic software",
];

const PLANS = [
  {
    name: "Free Trial",
    price: "Free",
    period: "15 days, no card needed",
    desc: "Full access to everything — see if it fits before you commit.",
    features: [
      "All Pro features included",
      "Unlimited contacts",
      "Quotes, invoices & projects",
      "Online payment collection",
      "Team up to 3 members",
      "Scheduling & booking links",
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlight: false,
    badge: "",
  },
  {
    name: "Pro Monthly",
    price: "$49",
    period: "/ month",
    desc: "Everything you need to run a professional remodeling business.",
    features: [
      "Unlimited contacts",
      "Unlimited quotes & invoices",
      "Unlimited projects",
      "Online payment collection",
      "Team up to 15 members",
      "Scheduling & booking links",
      "Priority support",
    ],
    cta: "Get Started",
    href: "/register",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Pro Yearly",
    price: "$490",
    period: "/ year",
    desc: "Two months free when you commit annually. Best value.",
    features: [
      "Everything in Pro Monthly",
      "Save $98 per year",
      "~$40.83 per month",
      "Unlimited contacts",
      "Unlimited quotes & invoices",
      "Priority support",
    ],
    cta: "Get Started Yearly",
    href: "/register",
    highlight: false,
    badge: "Best Value",
  },
];

const FAQS = [
  { q: "Is there really a free trial with no credit card?", a: "Yes — 15 days of full access, nothing required upfront. We want you to see the value before you commit." },
  { q: "What happens when my trial ends?", a: "Your account is paused. Your data is kept safe. Upgrade to Monthly ($49/mo) or Yearly ($490/yr) to continue. We'll remind you before it expires." },
  { q: "How does online payment collection work?", a: "Each invoice gets a unique payment link. Clients pay by card via Stripe. Funds are transferred directly to your bank account, typically within 2 business days." },
  { q: "Can I invite my team?", a: "Yes — invite team members with role-based access: Owner, Manager, Staff, or Crew. Each role has the right level of permissions for field vs. office work." },
  { q: "Is it mobile-friendly?", a: "Yes — Clear Build works on any device browser. A native mobile app for iOS and Android is on the roadmap." },
  { q: "Can I import my existing contacts and data?", a: "You can add contacts manually or use our import tool. CSV import is available for contacts. If you need help migrating from another tool, reach out and we'll assist." },
];

/* ─── Small mock UI components ────────────────────────────────────── */
function LeadMock() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden w-full max-w-[340px]">
      <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#374151]">Contacts</span>
        <span className="text-[10px] text-[#3FA66B] font-medium bg-[#F0FBF4] px-2 py-0.5 rounded-full">+ Add Lead</span>
      </div>
      <div className="divide-y divide-[#f3f4f6]">
        {[
          { name: "Marcus Webb", status: "Quoted", color: "#3FA66B" },
          { name: "Diane Torres", status: "In Conversation", color: "#f59e0b" },
          { name: "Ray Foster", status: "New Lead", color: "#6b7280" },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-bold text-[#1B2D5E]">{c.name[0]}</div>
              <span className="text-[12px] font-medium text-[#1f2937]">{c.name}</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.color + "18" }}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteMock({ large }: { large?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden ${large ? "w-full max-w-[400px]" : "w-full max-w-[340px]"}`}>
      <div className="bg-[#1B2D5E] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-[13px]">Quote #Q-0024</span>
          <span className="text-[10px] bg-[#3FA66B] text-white px-2 py-0.5 rounded-full font-medium">Approved ✓</span>
        </div>
        <span className="text-[#90b4d8] text-[11px]">Marcus Webb · Kitchen Remodel</span>
      </div>
      <div className="p-4 space-y-2">
        {[
          { item: "Demo & Prep",     price: "$1,200" },
          { item: "Cabinetry",       price: "$8,400" },
          { item: "Countertops",     price: "$3,200" },
          { item: "Labour (48 hrs)", price: "$5,760" },
        ].map(r => (
          <div key={r.item} className="flex justify-between text-[11px]">
            <span className="text-[#6b7280]">{r.item}</span>
            <span className="font-medium text-[#1f2937]">{r.price}</span>
          </div>
        ))}
        <div className="border-t border-[#e5e7eb] pt-2 mt-2 flex justify-between">
          <span className="text-[12px] font-bold text-[#1f2937]">Total</span>
          <span className="text-[12px] font-bold text-[#3FA66B]">$18,560</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceMock({ large }: { large?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden ${large ? "w-full max-w-[400px]" : "w-full max-w-[340px]"}`}>
      <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-[#1f2937]">Invoice #INV-0031</p>
          <p className="text-[10px] text-[#9ca3af]">Due May 30, 2026</p>
        </div>
        <span className="text-[10px] bg-[#fef3c7] text-[#d97706] px-2 py-0.5 rounded-full font-semibold">Due</span>
      </div>
      <div className="p-4">
        <div className="space-y-1.5 mb-3">
          {[
            { label: "Invoice total", val: "$18,560" },
            { label: "Paid (deposit)", val: "$5,000" },
            { label: "Balance due",   val: "$13,560", bold: true },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-[11px]">
              <span className="text-[#6b7280]">{r.label}</span>
              <span className={r.bold ? "font-bold text-[#1B2D5E]" : "text-[#1f2937]"}>{r.val}</span>
            </div>
          ))}
        </div>
        <button className="w-full py-2 rounded-lg text-[11px] font-semibold text-white" style={{ background: GREEN }}>
          Pay $13,560 Online →
        </button>
      </div>
    </div>
  );
}

function ProjectMock() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden w-full max-w-[380px]">
      <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-[#1f2937]">PRJ-0018 · Kitchen Remodel</p>
          <p className="text-[10px] text-[#9ca3af]">Marcus Webb · Started May 3</p>
        </div>
        <span className="text-[10px] bg-[#dcfce7] text-[#16a34a] px-2 py-0.5 rounded-full font-semibold">Active</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#6b7280]">Budget progress</span>
            <span className="font-medium text-[#1B2D5E]">$13,200 / $18,560</span>
          </div>
          <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: "71%", background: GREEN }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Quotes",   val: "1 approved" },
            { label: "Invoices", val: "2 sent" },
            { label: "Payments", val: "$5,000" },
          ].map(s => (
            <div key={s.label} className="bg-[#f9fafb] rounded-lg p-2 text-center border border-[#f3f4f6]">
              <p className="text-[9px] text-[#9ca3af]">{s.label}</p>
              <p className="text-[10px] font-semibold text-[#1f2937] mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative w-full max-w-[600px] mx-auto lg:mx-0">
      <div className="absolute -inset-4 rounded-3xl opacity-20 blur-3xl -z-10" style={{ background: `radial-gradient(circle, ${GREEN}, ${N700})` }} />
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] overflow-hidden">
        {/* Browser bar */}
        <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-4 py-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fca5a5]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#fde68a]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#6ee7b7]" />
          <div className="ml-3 flex-1 bg-white border border-[#e5e7eb] rounded-md px-3 py-0.5">
            <span className="text-[10px] text-[#9ca3af]">clearbuildusa.com/dashboard</span>
          </div>
        </div>
        <div className="flex" style={{ height: 360 }}>
          {/* Sidebar */}
          <div className="w-[130px] flex-shrink-0 flex flex-col p-3 gap-0.5" style={{ background: N900 }}>
            <div className="flex items-center gap-1.5 px-2 py-2 mb-2">
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: GREEN }}>
                <span className="text-white text-[8px] font-black">CB</span>
              </div>
              <span className="text-white text-[10px] font-bold">Clear Build</span>
            </div>
            {[
              { label: "Dashboard", active: true },
              { label: "Contacts", active: false },
              { label: "Quotes", active: false },
              { label: "Invoices", active: false },
              { label: "Projects", active: false },
              { label: "Payments", active: false },
            ].map(({ label, active }) => (
              <div key={label} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${active ? "text-white" : "text-[#7a95b8]"}`}
                style={active ? { background: "rgba(255,255,255,0.12)" } : {}}>
                {label}
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden" style={{ background: "#F8F9FC" }}>
            <p className="text-[11px] font-bold text-[#374151] mb-3">Dashboard Overview</p>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Total Revenue",  val: "$48,200", color: GREEN,    bg: GBG },
                { label: "Active Projects",val: "8",       color: N700,    bg: "#EEF2FF" },
                { label: "Pending Quotes", val: "12",      color: "#d97706", bg: "#fef3c7" },
                { label: "Amount Due",     val: "$9,400",  color: "#dc2626", bg: "#fef2f2" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-2.5 border border-[#e5e7eb]">
                  <p className="text-[9px] text-[#9ca3af] mb-0.5">{s.label}</p>
                  <p className="text-[13px] font-bold" style={{ color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
            {/* Bar chart */}
            <div className="bg-white rounded-xl p-3 border border-[#e5e7eb]">
              <p className="text-[9px] text-[#9ca3af] mb-2">Monthly Revenue</p>
              <div className="flex items-end gap-1" style={{ height: 72 }}>
                {[28, 45, 38, 62, 55, 72, 66, 80, 70, 85, 78, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm"
                    style={{ height: `${h}%`, background: i === 11 ? GREEN : N700, opacity: i === 11 ? 1 : 0.12 + i * 0.06 }} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["J","F","M","A","M","J","J","A","S","O","N","D"].map(m => (
                  <span key={m} className="flex-1 text-center text-[8px] text-[#d1d5db]">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Small helpers ───────────────────────────────────────────────── */
function ChipVal({ val }: { val: boolean | string }) {
  if (val === true)  return <div className="w-6 h-6 rounded-full flex items-center justify-center mx-auto" style={{ background: GBG }}><Check size={13} color={GREEN} strokeWidth={2.5} /></div>;
  if (val === false) return <span className="block text-center text-[#d1d5db] text-lg">—</span>;
  return <span className="block text-center text-[11px] text-[#6b7280] font-medium">{val}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e5e7eb] last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="text-[15px] font-semibold text-[#1f2937]">{q}</span>
        <ChevronDown size={18} className="flex-shrink-0 text-[#6b7280] transition-transform" style={{ transform: open ? "rotate(180deg)" : "" }} />
      </button>
      {open && <p className="pb-5 text-[14px] text-[#6b7280] leading-relaxed -mt-1">{a}</p>}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "var(--font-geist-sans, 'Inter', ui-sans-serif, system-ui, sans-serif)" }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: N700 }}>
              <span className="text-white text-[11px] font-black">CB</span>
            </div>
            <span className="font-bold text-[16px]" style={{ color: N700 }}>Clear Build <span style={{ color: GREEN }}>USA</span></span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How it works", "Pricing", "FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-[14px] text-[#4b5563] hover:text-[#111827] font-medium transition-colors">{l}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[14px] font-semibold px-4 py-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors" style={{ color: N700 }}>Sign In</Link>
            <Link href="/register" className="text-[14px] font-semibold px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90" style={{ background: GREEN }}>Start Free Trial</Link>
          </div>
          {/* Mobile burger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-[#f3f4f6]" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e5e7eb] bg-white px-4 py-4 space-y-1">
            {["Features", "How it works", "Pricing", "FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-[14px] font-medium text-[#4b5563] hover:bg-[#f9fafb]">{l}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-center rounded-lg border border-[#e5e7eb] text-[14px] font-semibold" style={{ color: N700 }}>Sign In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-center rounded-lg text-white text-[14px] font-semibold" style={{ background: GREEN }}>Start Free Trial</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28" style={{ background: `linear-gradient(160deg, #f8f9ff 0%, #ffffff 50%, #f0fbf4 100%)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5" style={{ color: GREEN, background: GBG }}>
              <Zap size={12} /> Construction Business Platform
            </span>
            <h1 className="text-[36px] sm:text-[44px] lg:text-[52px] font-extrabold leading-[1.1] tracking-tight mb-5" style={{ color: N900 }}>
              Keep every quote,<br className="hidden sm:block" /> change order, invoice,<br className="hidden sm:block" /> and payment{" "}
              <span style={{ color: GREEN }}>in sync.</span>
            </h1>
            <p className="text-[17px] text-[#4b5563] leading-relaxed mb-8 max-w-[480px] mx-auto lg:mx-0">
              One connected platform built for remodeling contractors. From first contact to final payment — no more juggling spreadsheets, texts, and PDFs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-[15px] shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{ background: GREEN }}>
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] border-2 border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb] transition-all"
                style={{ color: N700 }}>
                Sign In
              </Link>
            </div>
            <p className="text-[13px] text-[#9ca3af] mt-4">15 days free · No credit card required · Cancel any time</p>
          </div>
          <div className="flex-1 w-full lg:max-w-[580px]">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── Pain point band ────────────────────────────────────── */}
      <section className="py-14" style={{ background: N900 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[22px] sm:text-[28px] font-bold text-white leading-snug max-w-2xl mx-auto mb-10">
            Remodelers don't lose money because they forgot to work.<br />
            <span style={{ color: GREEN }}>They lose it because nothing is connected.</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText,  label: "Quotes sent,",       sub: "never followed up" },
              { icon: Receipt,   label: "Invoices unpaid",    sub: "no reminder sent" },
              { icon: Briefcase, label: "Change orders",      sub: "lost in text threads" },
              { icon: CreditCard,label: "Payments delayed",   sub: "no online option" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-xl p-4 border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon size={22} color={GREEN} className="mx-auto mb-2" />
                <p className="text-white font-semibold text-[13px]">{label}</p>
                <p className="text-[#7a95b8] text-[12px]">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value prop band ────────────────────────────────────── */}
      <section className="py-14 border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>One control layer</span>
          <h2 className="text-[28px] sm:text-[36px] font-extrabold mt-2 mb-4 tracking-tight" style={{ color: N900 }}>
            From approved work to collected payment
          </h2>
          <p className="text-[16px] text-[#6b7280] max-w-xl mx-auto mb-10">
            Clear Build connects your contacts, quotes, projects, invoices, and payments into one workflow — so nothing falls through the cracks.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Users,      label: "Contacts" },
              { icon: FileText,   label: "Quotes" },
              { icon: Briefcase,  label: "Projects" },
              { icon: Receipt,    label: "Invoices" },
              { icon: CreditCard, label: "Payments" },
              { icon: BarChart3,  label: "Reports" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e5e7eb] bg-white hover:border-[#c7d2fe] transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: i % 2 === 0 ? "#EEF2FF" : GBG }}>
                  <Icon size={18} color={i % 2 === 0 ? N700 : GREEN} />
                </div>
                <span className="text-[12px] font-semibold text-[#374151]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────── */}
      <section id="features" className="py-20" style={{ background: "#F8F9FC" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Features</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold mt-2 tracking-tight" style={{ color: N900 }}>
              Everything you need to protect margin<br className="hidden sm:block" /> and keep jobs organized
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[#e5e7eb] hover:shadow-md hover:border-[#c7d2fe] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#EEF2FF" }}>
                  <Icon size={20} color={N700} />
                </div>
                <h3 className="font-bold text-[15px] mb-2" style={{ color: N900 }}>{title}</h3>
                <p className="text-[13px] text-[#6b7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-t border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>How it works</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold mt-2 tracking-tight" style={{ color: N900 }}>
              Built for how remodelers actually work
            </h2>
          </div>
          <div className="space-y-20">
            {STEPS.map(({ step, title, desc, mock }, i) => (
              <div key={step} className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-10 lg:gap-16`}>
                <div className="flex-1 text-center lg:text-left">
                  <span className="text-[48px] font-black leading-none" style={{ color: N700, opacity: 0.12 }}>{step}</span>
                  <h3 className="text-[22px] sm:text-[26px] font-extrabold mt-1 mb-3 tracking-tight" style={{ color: N900 }}>{title}</h3>
                  <p className="text-[15px] text-[#6b7280] leading-relaxed max-w-md mx-auto lg:mx-0">{desc}</p>
                </div>
                <div className="flex-1 flex justify-center">
                  {mock}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature callouts ───────────────────────────────────── */}
      {CALLOUTS.map(({ label, title, points, mock, flip }) => (
        <section key={label} className="py-16 border-t border-[#e5e7eb]" style={{ background: flip ? "#F8F9FC" : "white" }}>
          <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex flex-col ${flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}>
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>{label}</span>
              <h2 className="text-[24px] sm:text-[30px] font-extrabold mt-2 mb-5 tracking-tight" style={{ color: N900 }}>{title}</h2>
              <ul className="space-y-3">
                {points.map(p => (
                  <li key={p} className="flex items-start gap-3 text-[14px] text-[#4b5563]">
                    <CheckCircle size={17} color={GREEN} className="flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              {mock}
            </div>
          </div>
        </section>
      ))}

      {/* ── Comparison ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight" style={{ color: N900 }}>
              Better than spreadsheets.<br className="hidden sm:block" /> Simpler than bloated contractor software.
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
            <div className="grid grid-cols-4">
              <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]" />
              {["Clear Build", "Spreadsheets", "Other Software"].map((h, i) => (
                <div key={h} className={`p-4 border-b border-[#e5e7eb] text-center ${i === 0 ? "text-white font-bold text-[13px]" : "text-[#6b7280] text-[13px] font-medium"}`}
                  style={i === 0 ? { background: N700 } : { background: "#f9fafb" }}>{h}</div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 ${i % 2 === 1 ? "bg-[#fafafa]" : ""}`}>
                <div className="p-3.5 border-b border-[#f3f4f6] text-[13px] font-medium text-[#374151] flex items-center">{row.feature}</div>
                <div className="p-3.5 border-b border-[#f3f4f6] flex items-center justify-center" style={{ background: i % 2 === 1 ? "#f8fffe" : "#f0fbf4" }}>
                  <ChipVal val={row.cb} />
                </div>
                <div className="p-3.5 border-b border-[#f3f4f6] flex items-center justify-center"><ChipVal val={row.sheets} /></div>
                <div className="p-3.5 border-b border-[#f3f4f6] flex items-center justify-center"><ChipVal val={row.software} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best fit ───────────────────────────────────────────── */}
      <section className="py-20 border-t border-[#e5e7eb]" style={{ background: "#F8F9FC" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Best fit</span>
              <h2 className="text-[28px] sm:text-[36px] font-extrabold mt-2 mb-6 tracking-tight" style={{ color: N900 }}>
                Built for owner-led<br /> remodeling businesses
              </h2>
              <ul className="space-y-3.5">
                {FIT_FOR.map(f => (
                  <li key={f} className="flex items-start gap-3 text-[14px] text-[#4b5563]">
                    <Check size={17} color={GREEN} className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { icon: Clock,      val: "< 15 min",   label: "Average setup time" },
                { icon: TrendingUp, val: "Zero",        label: "Spreadsheets needed" },
                { icon: Star,       val: "1–15",        label: "Team members supported" },
                { icon: Shield,     val: "100%",        label: "Data secure & private" },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-[#e5e7eb] text-center shadow-sm">
                  <Icon size={22} color={GREEN} className="mx-auto mb-2" />
                  <p className="text-[22px] font-extrabold" style={{ color: N700 }}>{val}</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 border-t border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Pricing</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold mt-2 tracking-tight" style={{ color: N900 }}>Simple pricing. No surprises.</h2>
            <p className="text-[16px] text-[#6b7280] mt-3">Start free for 15 days. No credit card required.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border overflow-hidden flex flex-col ${plan.highlight ? "shadow-2xl border-[#1B2D5E] scale-[1.03]" : "border-[#e5e7eb] shadow-sm"}`}>
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 text-center py-1.5 text-[11px] font-bold text-white"
                    style={{ background: plan.highlight ? N700 : GREEN }}>{plan.badge}</div>
                )}
                <div className={`p-6 ${plan.badge ? "pt-9" : ""}`} style={{ background: plan.highlight ? N700 : "white" }}>
                  <h3 className={`font-bold text-[16px] mb-1 ${plan.highlight ? "text-white" : ""}`} style={{ color: plan.highlight ? "white" : N900 }}>{plan.name}</h3>
                  <div className="flex items-end gap-1 my-3">
                    <span className="text-[36px] font-extrabold leading-none" style={{ color: plan.highlight ? "white" : N900 }}>{plan.price}</span>
                    <span className="text-[13px] mb-1" style={{ color: plan.highlight ? "#90b4d8" : "#6b7280" }}>{plan.period}</span>
                  </div>
                  <p className="text-[13px]" style={{ color: plan.highlight ? "#90b4d8" : "#6b7280" }}>{plan.desc}</p>
                </div>
                <div className="p-6 flex-1 flex flex-col" style={{ background: plan.highlight ? "#162548" : "#fafafa" }}>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: plan.highlight ? "#c4d9ef" : "#4b5563" }}>
                        <Check size={14} color={GREEN} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}
                    className="block text-center py-3 rounded-xl font-bold text-[14px] transition-all hover:opacity-90"
                    style={plan.highlight
                      ? { background: GREEN, color: "white" }
                      : { background: N700, color: "white" }}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-[#9ca3af] mt-8">All plans include the same features. Pay monthly or save 2 months by going yearly.</p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-[#e5e7eb]" style={{ background: "#F8F9FC" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>FAQ</span>
            <h2 className="text-[28px] sm:text-[34px] font-extrabold mt-2 tracking-tight" style={{ color: N900 }}>Common questions. Answered.</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] px-6 shadow-sm">
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA band ───────────────────────────────────────────── */}
      <section className="py-20" style={{ background: N900 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[28px] sm:text-[38px] font-extrabold text-white leading-tight mb-4 tracking-tight">
            Stop losing money between<br className="hidden sm:block" /> approved work and collected payment.
          </h2>
          <p className="text-[16px] mb-8" style={{ color: "#90b4d8" }}>Join remodelers who use Clear Build to run tighter, more profitable businesses.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[15px] text-white shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl"
            style={{ background: GREEN }}>
            Start Your Free Trial <ArrowRight size={17} />
          </Link>
          <p className="text-[12px] mt-4" style={{ color: "#4a6a8a" }}>15 days free · No credit card · Cancel any time</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e3a5f] py-10" style={{ background: N900 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GREEN }}>
              <span className="text-white text-[10px] font-black">CB</span>
            </div>
            <span className="font-bold text-white text-[14px]">Clear Build USA</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Sign In", href: "/login" },
              { label: "Register", href: "/register" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-[13px] transition-colors hover:text-white" style={{ color: "#4a6a8a" }}>{l.label}</Link>
            ))}
          </div>
          <p className="text-[12px]" style={{ color: "#4a6a8a" }}>© {new Date().getFullYear()} Clear Build USA</p>
        </div>
      </footer>

    </div>
  );
}
