"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./landing.css";

/* ── Icons ─────────────────────────────────────────────────────────── */
const ICONS: Record<string, string> = {
  check:        "M4 12.5l5 5L20 6.5",
  arrow:        "M5 12h14M13 6l6 6-6 6",
  arrowUpRight: "M7 17L17 7M9 7h8v8",
  quote:        "M7 4h7l4 4v12H7zM14 4v4h4M9.5 12h5M9.5 15.5h5",
  invoice:      "M6 3h12v18l-2.2-1.6L13.5 21l-2.3-1.6L9 21l-2.3-1.6L6 21zM9.5 8.5h5M9.5 12h5",
  link:         "M9.5 14.5l5-5M8 12l-2 2a3.5 3.5 0 105 5l2-2M16 12l2-2a3.5 3.5 0 10-5-5l-2 2",
  shield:       "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M8.5 12l2.3 2.3L15.5 9.7",
  pipeline:     "M5 7h9M5 7a2 2 0 11-.001-.001M14 7a3 3 0 003 3h2M19 10a2 2 0 11.001.001M19 17h-9M19 17a2 2 0 10.001-.001M10 17a3 3 0 00-3-3H5M5 14a2 2 0 10-.001.001",
  calendar:     "M5 6h14v14H5zM5 10h14M8 3v4M16 3v4M8.5 14h2M14 14h1.5",
  bell:         "M7 9a5 5 0 0110 0c0 5 2 6 2 6H5s2-1 2-6M10 19a2 2 0 004 0",
  bolt:         "M13 3L5 13h6l-1 8 8-10h-6z",
  lock:         "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 117 0v3M12 15v2",
  chart:        "M5 19V5M5 19h14M9 19v-6M13 19v-9M17 19v-4",
  plus:         "M12 5v14M5 12h14",
  chevron:      "M6 9l6 6 6-6",
  spark:        "M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2z",
  globe:        "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18",
  phone:        "M6 4h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A14 14 0 014 6a2 2 0 012-2z",
  menu:         "M4 7h16M4 12h16M4 17h16",
  close:        "M6 6l12 12M18 6L6 18",
  users:        "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20a6 6 0 0112 0M16 11a3 3 0 100-6M15 14.5c3 .4 5 2.4 5 5.5",
  card:         "M3 7h18v11H3zM3 10h18M6.5 14.5h3",
  doc:          "M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 15.5h3",
  refresh:      "M5 7a8 8 0 0113-1M19 5v4h-4M19 17a8 8 0 01-13 1M5 19v-4h4",
  eye:          "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  star:         "M12 4l2.4 5 5.6.8-4 3.9 1 5.6L12 16.6 6.9 19.3l1-5.6-4-3.9 5.6-.8z",
  layers:       "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
};

function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const d = ICONS[name] ?? ICONS.check;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      width="1em" height="1em" aria-hidden="true">
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

function Pill({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={`s-pill s-${kind}`}><span className="d" />{children}</span>;
}

function Logo({ variant = "color", height = 32 }: { variant?: "color" | "white"; height?: number }) {
  const src = variant === "white" ? "/logo-white.png" : "/logo-transparent.png";
  return <img src={src} alt="Clear Build USA" style={{ height: height + "px", width: "auto", display: "block" }} />;
}

function Btn({ href, variant = "primary", size, className = "", onClick, children }: {
  href?: string; variant?: string; size?: string; className?: string;
  onClick?: () => void; children: React.ReactNode;
}) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ""}${className ? ` ${className}` : ""}`.trim();
  if (href?.startsWith("/")) return <Link href={href} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button type="button" className={cls} onClick={onClick}>{children}</button>;
}

/* ── Language switcher ──────────────────────────────────────────────── */
const CB_LANGS = [
  { code: "en" as const, short: "EN", label: "English",   sub: "United States" },
  { code: "es" as const, short: "ES", label: "Español",   sub: "Spanish" },
  { code: "pt" as const, short: "PT", label: "Português", sub: "Portuguese" },
];
type LangCode = "en" | "es" | "pt";

function applyLang(code: LangCode) {
  try { document.documentElement.setAttribute("lang", code); } catch {}
  try { localStorage.setItem("cb_lang", code); } catch {}
  try { window.dispatchEvent(new CustomEvent("cb:langchange", { detail: { lang: code } })); } catch {}
}

function useLang(): [LangCode, (code: LangCode) => void] {
  const [lang, setLangState] = useState<LangCode>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem("cb_lang") as LangCode | null;
      if (s && CB_LANGS.some(l => l.code === s)) { setLangState(s); applyLang(s); }
    } catch {}
  }, []);
  useEffect(() => {
    const fn = (e: Event) => {
      const code = (e as CustomEvent).detail?.lang as LangCode;
      if (code && CB_LANGS.some(l => l.code === code)) setLangState(code);
    };
    window.addEventListener("cb:langchange", fn);
    return () => window.removeEventListener("cb:langchange", fn);
  }, []);
  const setLang = (code: LangCode) => { applyLang(code); setLangState(code); };
  return [lang, setLang];
}

function LangSwitcher() {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = CB_LANGS.find(l => l.code === lang) ?? CB_LANGS[0];
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="lang" ref={ref}>
      <button type="button" className="lang-btn" onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label="Change language">
        <Icon name="globe" className="lang-globe" />
        <span className="lang-short">{current.short}</span>
        <Icon name="chevron" className="lang-caret" style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      {open && (
        <div className="lang-menu" role="listbox">
          <span className="lang-menu-label mono">LANGUAGE</span>
          {CB_LANGS.map(l => (
            <button type="button" key={l.code} role="option" aria-selected={l.code === lang}
              className={`lang-opt${l.code === lang ? " is-active" : ""}`}
              onClick={() => { setLang(l.code); setOpen(false); }}>
              <span className="lang-opt-code">{l.short}</span>
              <span className="lang-opt-text">
                <span className="lang-opt-label">{l.label}</span>
                <span className="lang-opt-sub">{l.sub}</span>
              </span>
              {l.code === lang && <span className="lang-opt-check"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LangSegment() {
  const [lang, setLang] = useLang();
  return (
    <div className="lang-seg" role="group" aria-label="Change language">
      <span className="lang-seg-label"><Icon name="globe" /> Language</span>
      <div className="lang-seg-options">
        {CB_LANGS.map(l => (
          <button type="button" key={l.code}
            className={`lang-seg-opt${l.code === lang ? " is-active" : ""}`}
            aria-pressed={l.code === lang}
            onClick={() => setLang(l.code)}>
            {l.short}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Reveal hook ────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".lp .reveal"));
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  });
}

/* ── Nav ────────────────────────────────────────────────────────────── */
function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links: [string, string][] = [["Features", "#features"], ["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (
    <header className={`nav${solid ? " nav--solid" : ""}`}>
      <div className="wrap nav-inner">
        <a href="#top" className="nav-brand"><Logo height={34} /></a>
        <nav className="nav-links">
          {links.map(([t, h]) => <a key={t} href={h}>{t}</a>)}
        </nav>
        <div className="nav-cta">
          <LangSwitcher />
          <Link href="/login" className="nav-signin">Sign In</Link>
          <Link href="/login" className="btn btn-soft btn-sm">Book Demo</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Start Free Trial</Link>
        </div>
        <div className="nav-mobile-controls">
          <LangSwitcher />
          <button type="button" className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-mobile">
          {links.map(([t, h]) => <a key={t} href={h} onClick={() => setOpen(false)}>{t}</a>)}
          <Link href="/login" className="nav-mobile-signin" onClick={() => setOpen(false)}>Sign In</Link>
          <LangSegment />
          <Link href="/login" onClick={() => setOpen(false)} className="btn btn-soft">Book Demo</Link>
          <Link href="/register" onClick={() => setOpen(false)} className="btn btn-primary">Start Free Trial</Link>
        </div>
      )}
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */
function HeroChain() {
  const steps = [
    { n: "Q", color: "var(--blue)",  name: "Quote #1042",          meta: "Kitchen remodel · Maple St.",    pill: ["sent",     "Sent"]     as [string,string] | null, amt: null },
    { n: "✓", color: "var(--green)", name: "Approval captured",    meta: "Signed by client · Mar 14",      pill: ["approved", "Approved"] as [string,string] | null, amt: null },
    { n: "+", color: "var(--navy)",  name: "Change order #2",      meta: "Tile upgrade · +$2,400",          pill: ["approved", "Approved"] as [string,string] | null, amt: null },
    { n: "$", color: "var(--blue)",  name: "Invoice #1042",        meta: "From approved work",             pill: null, amt: "$18,400" },
    { n: "✓", color: "var(--green)", name: "Payment received",     meta: "Card · linked to job",           pill: ["paid",     "Paid"]     as [string,string] | null, amt: null },
  ];
  return (
    <div className="chain">
      <div className="chain-head">
        <span className="chain-head-title"><span className="d" />One job, one connected record</span>
        <span className="chain-head-id mono">JOB&nbsp;#1042</span>
      </div>
      <div className="chain-rail" />
      {steps.map((s, i) => (
        <div className="chain-step" key={i} style={{ animationDelay: (0.5 + i * 0.14) + "s" }}>
          <div className="chain-node" style={{ background: s.color }}>{s.n}</div>
          <div className="chain-card">
            <div className="chain-card-top">
              <span className="chain-name">{s.name}</span>
              {s.pill ? <Pill kind={s.pill[0]}>{s.pill[1]}</Pill> : <span className="chain-amt archivo">{s.amt}</span>}
            </div>
            <div className="chain-meta">{s.meta}</div>
          </div>
        </div>
      ))}
      <div className="chain-badge"><Icon name="link" /> Everything linked</div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-glow" />
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow reveal">FIELD SERVICE &amp; COMMERCIAL CONTROL</span>
          <h1 className="display hero-h1 reveal" data-d="1">
            Keep approved work, billing &amp; payment <span className="hl">in&nbsp;sync.</span>
          </h1>
          <p className="hero-sub reveal" data-d="2">
            Clear Build connects quotes, approvals, change orders, invoices, and payments to every job — so owner-led remodelers stop losing money between approved work and collected payment.
          </p>
          <div className="hero-cta reveal" data-d="3">
            <Btn href="/register" variant="primary" size="lg">Start Free Trial <Icon name="arrow" /></Btn>
            <Btn href="/login" variant="soft" size="lg">Book a Demo</Btn>
          </div>
          <div className="hero-trust reveal" data-d="4">
            {["No credit card required", "Set up fast", "No per-user pricing"].map(t => (
              <span key={t} className="hero-trust-item">
                <span className="tick"><Icon name="check" /></span>{t}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-visual reveal" data-d="2">
          <HeroChain />
        </div>
      </div>
    </section>
  );
}

/* ── Pipeline Strip ─────────────────────────────────────────────────── */
function PipelineStrip() {
  const steps = ["Lead", "Quote", "Approval", "Change order", "Invoice", "Payment"];
  return (
    <div className="pipestrip">
      <div className="wrap pipestrip-inner">
        <span className="pipestrip-label mono">THE CONNECTED CHAIN</span>
        <div className="pipestrip-flow">
          {steps.map((s, i) => (
            <span key={s}>
              <span className="pipestrip-node">{s}</span>
              {i < steps.length - 1 && <Icon name="arrow" className="pipestrip-arrow" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Features ───────────────────────────────────────────────────────── */
function Features() {
  const primary = [
    { ic: "quote",  col: "blue",  t: "Quotes & Change Orders",          d: "Create professional quotes, capture approval, and keep change orders formally linked to the original job." },
    { ic: "card",   col: "green", t: "Invoices & Online Payments",       d: "Send invoices, collect payments online, and track paid, due, and overdue amounts clearly." },
    { ic: "link",   col: "navy",  t: "Project-Linked Financial Control", d: "Keep quotes, invoices, payments, and updates tied to the same job so nothing gets lost." },
    { ic: "shield", col: "blue",  t: "Approval Proof",                   d: "Capture quote and change-order approvals digitally so billing disputes are easier to prevent." },
  ];
  const secondary = [
    { ic: "pipeline", t: "Leads & Client Pipeline",      d: "Track prospects and customers from first contact through signed work without spreadsheet chaos." },
    { ic: "calendar", t: "Scheduling & Team Coordination", d: "Assign work, track upcoming jobs, and keep the team aligned without bloated dispatch software." },
  ];
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />FEATURES</span>
          <h2 className="section-title">Everything you need to keep approved work,<br />billing &amp; payment in sync</h2>
          <p className="section-sub">The first four are the wedge — formal commercial control most contractor tools blur over. The rest keep the day-to-day moving.</p>
        </div>
        <div className="feat-primary">
          {primary.map((f, i) => (
            <article className="feat-card reveal" data-d={String(i + 1)} key={f.t}>
              <div className={`ico ico-${f.col} feat-ico`}><Icon name={f.ic} /></div>
              <h3 className="feat-title">{f.t}</h3>
              <p className="feat-desc">{f.d}</p>
              <span className="feat-rank mono">0{i + 1}</span>
            </article>
          ))}
        </div>
        <div className="feat-secondary reveal">
          <span className="feat-also mono">ALSO INCLUDED</span>
          <div className="feat-secondary-grid">
            {secondary.map(f => (
              <article className="feat-card-2" key={f.t}>
                <div className="ico ico-navy feat-ico-2"><Icon name={f.ic} /></div>
                <div>
                  <h3 className="feat-title-2">{f.t}</h3>
                  <p className="feat-desc-2">{f.d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ───────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { ic: "pipeline", t: "Add leads and client details",             d: "Capture leads manually or import them, and keep every opportunity in one place." },
    { ic: "quote",    t: "Create and send professional quotes",       d: "Build itemized quotes quickly and send them for digital approval." },
    { ic: "shield",   t: "Capture approval and manage change orders", d: "Keep proof of what was approved and handle changes formally before they affect billing." },
    { ic: "invoice",  t: "Turn approved work into invoices",          d: "Create invoices from approved work so commercial details stay connected." },
    { ic: "chart",    t: "Track projects, payments & next actions",   d: "See what's active, what's paid, and what still needs attention across every job." },
  ];
  const [active, setActive] = useState(0);
  return (
    <section className="section bg-cool" id="how">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />HOW IT WORKS</span>
          <h2 className="section-title">Built for how remodelers actually work</h2>
          <p className="section-sub">Five connected steps — the approval and change-order bridge most tools skip is right in the middle.</p>
        </div>
        <div className="how-grid reveal">
          <ol className="how-steps">
            {steps.map((s, i) => (
              <li key={i} className={`how-step${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}>
                <span className="how-num archivo">{i + 1}</span>
                <div className="how-step-body">
                  <h3 className="how-step-title">{s.t}</h3>
                  <p className="how-step-desc">{s.d}</p>
                </div>
                <span className="how-line" aria-hidden="true" />
              </li>
            ))}
          </ol>
          <div className="how-visual">
            <div className="how-visual-card" key={active}>
              <div className="how-visual-ico ico ico-blue"><Icon name={steps[active].ic} /></div>
              <span className="how-visual-step mono">STEP {active + 1} / 5</span>
              <h3 className="how-visual-title">{steps[active].t}</h3>
              <p className="how-visual-desc">{steps[active].d}</p>
              <div className="how-visual-chain">
                {steps.map((_, i) => <span key={i} className={`hv-dot${i <= active ? " on" : ""}`} />)}
              </div>
              <div className="how-visual-tag"><Icon name="link" /> Stays linked to the same job</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Product Demo ───────────────────────────────────────────────────── */
function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  const nav: [string, string][] = [["Dashboard", "chart"], ["Leads", "pipeline"], ["Quotes", "quote"], ["Projects", "layers"], ["Invoices", "card"], ["Schedule", "calendar"]];
  return (
    <div className="appshell">
      <aside className="app-side">
        <div className="app-side-brand"><img src="/logo-white.png" alt="" style={{ height: "26px" }} /></div>
        {nav.map(([t, ic]) => (
          <div key={t} className={`app-nav-item${t === active ? " on" : ""}`}><Icon name={ic} /> <span>{t}</span></div>
        ))}
        <div className="app-side-foot">
          <span className="app-avatar">JR</span>
          <div><div className="app-u">Jordan Reyes</div><div className="app-r">Owner</div></div>
        </div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}

function ScreenQuote() {
  const items = [
    ["Demolition & site protection", "1",    "$2,400", "$2,400"],
    ["Cabinetry — shaker, painted",  "1",    "$8,600", "$8,600"],
    ["Quartz countertop & install",  "42 sf","$78",    "$3,276"],
    ["Tile backsplash",              "1",    "$1,520", "$1,520"],
  ];
  return (
    <AppShell active="Quotes">
      <div className="scr-head">
        <div>
          <span className="scr-eyebrow mono">QUOTE #1042 · DRAFT</span>
          <h3 className="scr-title">Maple St. Kitchen Remodel</h3>
          <p className="scr-meta">Client: Dana &amp; Marc Whitfield · 128 Maple St.</p>
        </div>
        <div className="scr-actions">
          <button type="button" className="scr-btn ghost">Save draft</button>
          <button type="button" className="scr-btn primary"><Icon name="arrow" /> Send for approval</button>
        </div>
      </div>
      <div className="qtable">
        <div className="qrow qhead"><span>Line item</span><span>Qty</span><span>Rate</span><span className="r">Amount</span></div>
        {items.map((it, i) => (
          <div className="qrow" key={i}>
            <span className="qname">{it[0]}</span><span>{it[1]}</span><span>{it[2]}</span><span className="r archivo">{it[3]}</span>
          </div>
        ))}
        <div className="qrow qadd"><Icon name="plus" /> Add line item</div>
      </div>
      <div className="qtotals">
        <div className="qtot-row"><span>Subtotal</span><span className="archivo">$15,796</span></div>
        <div className="qtot-row"><span>Tax (estimated)</span><span className="archivo">$1,204</span></div>
        <div className="qtot-row qtot-grand"><span>Total</span><span className="archivo">$16,000</span></div>
      </div>
    </AppShell>
  );
}

function ScreenApprove() {
  return (
    <AppShell active="Quotes">
      <div className="approve-wrap">
        <div className="approve-doc">
          <div className="approve-doc-top">
            <img src="/logo-transparent.png" alt="" style={{ height: "24px" }} />
            <span className="mono" style={{ fontSize: "11px", color: "var(--muted-2)" }}>QUOTE #1042</span>
          </div>
          <h3 className="approve-h">Kitchen Remodel — $16,000</h3>
          <p className="approve-sub">Sent by Clear Build Co. · Valid 30 days</p>
          <div className="approve-lines">
            {[["Cabinetry & install", "$8,600"], ["Countertop & backsplash", "$4,796"], ["Demolition & prep", "$2,400"]].map((l, i) => (
              <div className="approve-line" key={i}><span>{l[0]}</span><span className="archivo">{l[1]}</span></div>
            ))}
          </div>
        </div>
        <div className="approve-side">
          <div className="approve-status">
            <span className="approve-check"><Icon name="check" /></span>
            <div>
              <div className="approve-status-t">Approved by client</div>
              <div className="approve-status-m">Dana Whitfield · Mar 14, 9:21 AM</div>
            </div>
          </div>
          <div className="approve-proof">
            <span className="mono approve-proof-l">APPROVAL PROOF ON FILE</span>
            <div className="approve-proof-row"><Icon name="eye" /> Viewed Mar 14, 9:18 AM</div>
            <div className="approve-proof-row"><Icon name="check" /> Approved Mar 14, 9:21 AM</div>
            <div className="approve-proof-row"><Icon name="lock" /> IP &amp; timestamp recorded</div>
          </div>
          <div className="approve-note"><Icon name="shield" /> Disputes are easier to prevent when approval is captured digitally.</div>
        </div>
      </div>
    </AppShell>
  );
}

function ScreenInvoice() {
  return (
    <AppShell active="Invoices">
      <div className="scr-head">
        <div>
          <span className="scr-eyebrow mono">INVOICE #1042</span>
          <h3 className="scr-title">$18,400 <Pill kind="due">Partially paid</Pill></h3>
          <p className="scr-meta">From approved work + change order #2 · Due Apr 2</p>
        </div>
      </div>
      <div className="inv-grid">
        <div className="inv-bars">
          <div className="inv-bar-row"><span>Invoiced</span><span className="archivo">$18,400</span></div>
          <div className="inv-track"><div className="inv-fill" style={{ width: "100%", background: "var(--blue)" }} /></div>
          <div className="inv-bar-row"><span>Collected</span><span className="archivo">$10,000</span></div>
          <div className="inv-track"><div className="inv-fill" style={{ width: "54%", background: "var(--green)" }} /></div>
          <div className="inv-bar-row"><span>Outstanding</span><span className="archivo" style={{ color: "var(--amber)" }}>$8,400</span></div>
          <div className="inv-track"><div className="inv-fill" style={{ width: "46%", background: "var(--amber)" }} /></div>
        </div>
        <div className="inv-pay">
          <span className="mono" style={{ fontSize: "11px", color: "var(--muted-2)" }}>CLIENT PAYMENT</span>
          <div className="inv-methods">
            <div className="inv-method on"><Icon name="card" /> Card •••• 4242</div>
            <div className="inv-method"><Icon name="invoice" /> Bank transfer</div>
          </div>
          <button type="button" className="scr-btn primary full"><Icon name="check" /> Record payment</button>
          <div className="inv-reminders"><Icon name="bell" /> Overdue reminder scheduled for Apr 3</div>
        </div>
      </div>
    </AppShell>
  );
}

function ScreenProject() {
  const kpis: [string, string, string][] = [["Budget", "$16,000", ""], ["Change orders", "+$2,400", "blue"], ["Invoiced", "$18,400", ""], ["Collected", "$10,000", "green"]];
  const events: [string, string, string, string][] = [
    ["quote",    "Quote approved",           "Mar 14", "approved"],
    ["shield",   "Change order #2 approved", "Mar 22", "approved"],
    ["card",     "Deposit collected",         "Mar 24", "paid"],
    ["calendar", "Install scheduled",         "Apr 1",  "sent"],
  ];
  const stages = ["Demolition", "Rough-in", "Installation", "Finishing", "Final walk-through"];
  return (
    <AppShell active="Projects">
      <div className="scr-head">
        <div>
          <span className="scr-eyebrow mono">PROJECT · ACTIVE</span>
          <h3 className="scr-title">Maple St. Kitchen Remodel</h3>
          <p className="scr-meta">Stage 3 of 5 · Installation</p>
        </div>
        <div className="scr-actions">
          <button type="button" className="scr-btn ghost">Schedule</button>
          <button type="button" className="scr-btn primary">Update stage</button>
        </div>
      </div>
      <div className="proj-kpis">
        {kpis.map((k, i) => (
          <div className="proj-kpi" key={i}>
            <span className="proj-kpi-l">{k[0]}</span>
            <span className={`proj-kpi-v archivo${k[2] ? " " + k[2] : ""}`}>{k[1]}</span>
          </div>
        ))}
      </div>
      <div className="proj-cols">
        <div className="proj-timeline">
          <span className="mono proj-col-l">LINKED TIMELINE</span>
          {events.map((e, i) => (
            <div className="proj-event" key={i}>
              <span className="proj-event-ic"><Icon name={e[0]} /></span>
              <div className="proj-event-body"><div className="proj-event-t">{e[1]}</div><div className="proj-event-m">{e[2]}</div></div>
              <Pill kind={e[3]}>{e[3] === "sent" ? "Scheduled" : e[3][0].toUpperCase() + e[3].slice(1)}</Pill>
            </div>
          ))}
        </div>
        <div className="proj-stages">
          <span className="mono proj-col-l">STAGES</span>
          {stages.map((s, i) => (
            <div className={`proj-stage${i < 2 ? " done" : i === 2 ? " now" : ""}`} key={i}>
              <span className="proj-stage-dot" />{s}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProductDemo() {
  const tabs: [string, string, string][] = [
    ["quote",   "Quote builder",  "quote"],
    ["approve", "Approval proof", "shield"],
    ["invoice", "Invoice & pay",  "card"],
    ["project", "Project view",   "layers"],
  ];
  const [tab, setTab] = useState("quote");
  const url = tab === "approve" ? "app.clearbuildusa.com/q/1042/approve" : `app.clearbuildusa.com/${tab}`;
  return (
    <section className="section demo">
      <div className="demo-glow" />
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow" style={{ color: "var(--green-bright)" }}><span className="dot" />SEE IT IN ACTION</span>
          <h2 className="section-title" style={{ color: "#fff" }}>One connected workspace,<br />from quote to collected payment</h2>
          <p className="section-sub" style={{ color: "#a7b4ce" }}>Click through the real screens owner-led teams use every day.</p>
        </div>
        <div className="demo-tabs reveal">
          {tabs.map(([k, label, ic]) => (
            <button type="button" key={k} className={`demo-tab${tab === k ? " is-active" : ""}`} onClick={() => setTab(k)}>
              <Icon name={ic} /> {label}
            </button>
          ))}
        </div>
        <div className="browser reveal">
          <div className="browser-bar">
            <span className="bd bd-r" /><span className="bd bd-y" /><span className="bd bd-g" />
            <span className="browser-url mono"><Icon name="lock" /> {url}</span>
          </div>
          <div className="browser-body" key={tab}>
            {tab === "quote"   && <ScreenQuote />}
            {tab === "approve" && <ScreenApprove />}
            {tab === "invoice" && <ScreenInvoice />}
            {tab === "project" && <ScreenProject />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Invoice Section ────────────────────────────────────────────────── */
function InvoiceCardMock() {
  return (
    <div className="invmock">
      <div className="invmock-head">
        <div><div className="invmock-id mono">INVOICE #1042</div><div className="invmock-amt archivo">$18,400</div></div>
        <Pill kind="due">$8,400 due</Pill>
      </div>
      <div className="invmock-from"><Icon name="link" /> From approved quote + change order #2</div>
      <div className="invmock-track"><div style={{ width: "54%" }} /></div>
      <div className="invmock-track-l"><span>$10,000 collected</span><span>54%</span></div>
      <button type="button" className="invmock-pay"><Icon name="card" /> Pay invoice</button>
      <div className="invmock-methods"><span>Visa •••• 4242</span><span className="mono" style={{ color: "var(--green)", fontWeight: 600, letterSpacing: ".08em" }}>SECURE</span></div>
    </div>
  );
}

function InvoiceSection() {
  const bullets = [
    ["card",    "Create invoices directly from approved work", "No re-keying — billing inherits the approved scope and change orders."],
    ["globe",   "Clients pay online by card",                  "A pay link on every invoice, so money moves faster."],
    ["refresh", "Accept partial payments",                      "Take a deposit now, collect the balance on completion."],
    ["bell",    "Automatic overdue reminders",                  "Stop chasing payments manually — Clear Build nudges for you."],
  ];
  return (
    <section className="section" id="invoicing">
      <div className="wrap split">
        <div className="split-copy reveal">
          <span className="kicker eyebrow"><span className="dot" />GET PAID FASTER</span>
          <h2 className="section-title">Get paid faster without losing<br />track of approved work</h2>
          <p className="section-sub">Payment speed tied to the actual wedge: every invoice traces back to what the client approved.</p>
          <ul className="bullet-list">
            {bullets.map((b, i) => (
              <li className="bullet" key={i}>
                <span className="bullet-ico ico ico-green"><Icon name={b[0]} /></span>
                <div><span className="bullet-t">{b[1]}</span><span className="bullet-d">{b[2]}</span></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="split-visual reveal" data-d="1"><InvoiceCardMock /></div>
      </div>
    </section>
  );
}

/* ── Projects Section ───────────────────────────────────────────────── */
function ProjectMiniMock() {
  const bars: [string, string, number, string][] = [
    ["Budget",    "$16,000", 100, "var(--navy)"],
    ["Invoiced",  "$18,400", 100, "var(--blue)"],
    ["Collected", "$10,000",  54, "var(--green)"],
  ];
  return (
    <div className="pmini">
      <div className="pmini-head"><span className="pmini-name">Maple St. Kitchen</span><Pill kind="approved">On track</Pill></div>
      <div className="pmini-bars">
        {bars.map((b, i) => (
          <div key={i}>
            <div className="pmini-bar-top"><span>{b[0]}</span><span className="archivo">{b[1]}</span></div>
            <div className="pmini-track"><div style={{ width: b[2] + "%", background: b[3] }} /></div>
          </div>
        ))}
      </div>
      <div className="pmini-links mono">QUOTE · CHANGE ORDER · INVOICE · PAYMENT — all linked</div>
    </div>
  );
}

function ProjectsSection() {
  const bullets = [
    "Link quotes, change orders, invoices, and payments to one job",
    "Track budget vs invoiced and collected amounts in real time",
    "Keep team updates and project history in one timeline",
    "Stop approved work from slipping through the cracks",
  ];
  return (
    <section className="section bg-cool" id="projects">
      <div className="wrap split reverse">
        <div className="split-visual reveal"><ProjectMiniMock /></div>
        <div className="split-copy reveal" data-d="1">
          <span className="kicker eyebrow"><span className="dot" />PROJECTS</span>
          <h2 className="section-title">Keep every job, invoice<br />&amp; payment connected</h2>
          <p className="section-sub">Not generic "project organization." Every dollar and decision stays tied to the work it belongs to.</p>
          <ul className="check-list">
            {bullets.map((b, i) => <li key={i}><span className="cl-tick"><Icon name="check" /></span>{b}</li>)}
          </ul>
          <Btn href="/register" variant="dark" className="mt">Track your first job free <Icon name="arrow" /></Btn>
        </div>
      </div>
    </section>
  );
}

/* ── Comparison ─────────────────────────────────────────────────────── */
function Comparison() {
  const rows: [string, boolean | "part", boolean | "part", boolean | "part"][] = [
    ["Professional quotes & e-signatures", false, true,   true],
    ["Online payment collection",          false, true,   true],
    ["Change order tracking",              false, true,   true],
    ["Approval proof",                     false, "part", true],
    ["Mobile-friendly UI",                 false, true,   true],
    ["Set up in under 15 minutes",         "part",false,  true],
    ["Built for remodelers specifically",  false, false,  true],
    ["No per-user pricing",                true,  false,  true],
  ];
  function Cell({ v }: { v: boolean | "part" }) {
    if (v === true)   return <span className="cmp-mark cmp-yes"><Icon name="check" /></span>;
    if (v === "part") return <span className="cmp-mark cmp-part">~</span>;
    return <span className="cmp-mark cmp-no"><Icon name="close" /></span>;
  }
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />WHY CLEAR BUILD</span>
          <h2 className="section-title">Better than spreadsheets.<br />Simpler than bloated contractor software.</h2>
        </div>
        <div className="cmp reveal">
          <div className="cmp-row cmp-headrow">
            <span className="cmp-feat" />
            <span className="cmp-col">Spreadsheets</span>
            <span className="cmp-col">Bloated FSM software</span>
            <span className="cmp-col cmp-col-us"><Logo height={22} /></span>
          </div>
          {rows.map((r, i) => (
            <div className="cmp-row" key={i}>
              <span className="cmp-feat">{r[0]}</span>
              <span className="cmp-col"><Cell v={r[1]} /></span>
              <span className="cmp-col"><Cell v={r[2]} /></span>
              <span className="cmp-col cmp-col-us"><Cell v={r[3]} /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Best Fit ───────────────────────────────────────────────────────── */
function BestFit() {
  const bullets = [
    "Owner-operators running $500K–$5M remodeling businesses",
    "Remodelers tired of losing track of approved quotes, changes, and invoices",
    "Contractors who want to look more professional to clients",
    "Teams of 1–15 who don't need bloated enterprise software",
    "Businesses moving off spreadsheets, email chains, and generic tools",
  ];
  const metrics: [string, string, string][] = [
    ["bolt",  "Fast setup",              "Be quoting in an afternoon, not a quarter."],
    ["lock",  "Private business workspace", "Your jobs, clients, and money — kept to your team."],
    ["globe", "EN · ES · PT",            "Client-facing quotes, invoices & approvals."],
    ["users", "No per-user pricing",     "Add the whole crew without the penalty."],
  ];
  return (
    <section className="section bg-cool" id="bestfit">
      <div className="wrap bestfit">
        <div className="bestfit-copy reveal">
          <span className="kicker eyebrow"><span className="dot" />BEST FIT</span>
          <h2 className="section-title">Built for owner-led<br />remodeling businesses</h2>
          <ul className="check-list lg">
            {bullets.map((b, i) => <li key={i}><span className="cl-tick"><Icon name="check" /></span>{b}</li>)}
          </ul>
        </div>
        <div className="bestfit-metrics reveal" data-d="1">
          {metrics.map((m, i) => (
            <div className="metric-card" key={i}>
              <span className="metric-ico"><Icon name={m[0]} /></span>
              <h3 className="metric-t">{m[1]}</h3>
              <p className="metric-d">{m[2]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────── */
function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = [
    { name: "Solo", tag: "Owner-operators", m: 49, pop: false,
      blurb: "Everything to quote, get approval, and get paid.",
      feats: ["Digital quote approval", "Change orders", "Online payments", "Project-linked billing", "Up to 2 team members"] },
    { name: "Crew", tag: "Growing teams", m: 99, pop: true,
      blurb: "The full commercial-control chain for a working crew.",
      feats: ["Everything in Solo", "Approval proof & history", "Scheduling & coordination", "Budget vs collected tracking", "Up to 8 team members", "Priority support"] },
    { name: "Business", tag: "Established remodelers", m: 179, pop: false,
      blurb: "Structure and visibility for a bigger book of work.",
      feats: ["Everything in Crew", "Advanced project stages", "Multi-language client surfaces", "Custom templates", "Up to 15 team members"] },
  ];
  const price = (m: number) => yearly ? Math.round(m * 10 / 12 * 10) / 10 : m;
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />PRICING</span>
          <h2 className="section-title">Simple pricing. No surprises.</h2>
          <p className="section-sub">No per-user pricing. Start free for 14 days — no credit card required.</p>
        </div>
        <div className="price-toggle reveal">
          <button type="button" className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Monthly</button>
          <button type="button" className={yearly ? "on" : ""} onClick={() => setYearly(true)}>
            Yearly <span className="price-save">2 months free</span>
          </button>
        </div>
        <div className="price-grid reveal">
          {plans.map((p, i) => (
            <div className={`price-card${p.pop ? " pop" : ""}`} key={i}>
              {p.pop && <span className="price-badge mono">MOST POPULAR</span>}
              <span className="price-name archivo">{p.name}</span>
              <span className="price-tag">{p.tag}</span>
              <div className="price-amt">
                <span className="price-cur">$</span>
                <span className="price-num archivo">{price(p.m)}</span>
                <span className="price-per">/mo</span>
              </div>
              <span className="price-bill mono">{yearly ? "billed yearly" : "billed monthly"}</span>
              <p className="price-blurb">{p.blurb}</p>
              <Btn href="/register" variant={p.pop ? "primary" : "soft"} className="price-cta">Start Free Trial</Btn>
              <ul className="price-feats">
                {p.feats.map((f, j) => (
                  <li key={j}><span className="pf-tick"><Icon name="check" /></span>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="price-note reveal"><Icon name="shield" /> All plans are built for small remodeling teams that want clarity without enterprise complexity.</p>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────── */
function FAQ() {
  const qa = [
    ["Is there really a free trial with no credit card?", "Yes. Start a 14-day free trial with full access — no card required. You only add billing if you decide to keep going."],
    ["Can customers approve quotes and change orders online?", "Yes. Clients review and approve quotes and change orders from a link, and every approval is captured digitally with a timestamp so you keep proof on file."],
    ["How is Clear Build different from spreadsheets or generic contractor software?", "Clear Build keeps quotes, approvals, change orders, invoices, and payments connected to the same job. Spreadsheets lose the thread; bloated enterprise tools add complexity you don't need."],
    ["Can I track invoices and payments by project?", "Yes. Every invoice and payment links back to its job, so you can see budget vs invoiced vs collected for each project in real time."],
    ["How does online payment collection work?", "Send an invoice with a pay link. Clients pay by card, you can accept partial payments, and overdue reminders go out automatically."],
    ["Can I invite my team?", "Yes. Add your crew with no per-user pricing — plans include set team sizes, and the whole team sees the work they need to."],
    ["Is it mobile-friendly?", "Yes. Clear Build works in the field on a phone or tablet, so quoting, approvals, and updates happen on site."],
    ["Can I import my existing contacts and data?", "Yes. Bring leads and client details in by import, or add them manually, and keep everything in one place from day one."],
  ];
  const [open, setOpen] = useState(1);
  return (
    <section className="section bg-cool" id="faq">
      <div className="wrap faq-wrap">
        <div className="faq-head reveal">
          <span className="kicker eyebrow"><span className="dot" />FAQ</span>
          <h2 className="section-title">Questions, answered</h2>
          <p className="section-sub">The things owner-led teams ask before switching.</p>
          <div className="faq-help"><Icon name="phone" /> Still deciding? <a href="/login">Book a demo →</a></div>
        </div>
        <div className="faq-list reveal" data-d="1">
          {qa.map((x, i) => (
            <div className={`faq-item${open === i ? " is-open" : ""}`} key={i}>
              <div className="faq-q-wrap">
                <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{x[0]}</span>
                  <span className="faq-chev" style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <Icon name="chevron" />
                  </span>
                </button>
                {open === i && <div className="faq-a-wrap"><div className="faq-a">{x[1]}</div></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="section finalcta" id="demo">
      <div className="finalcta-tex" />
      <div className="wrap finalcta-inner reveal">
        <span className="eyebrow" style={{ color: "var(--green-bright)" }}>STOP THE LEAKAGE</span>
        <h2 className="display finalcta-h">Stop losing money between approved<br />work and collected payment.</h2>
        <p className="finalcta-sub">Use Clear Build to keep quotes, approvals, change orders, invoices, and payments connected across every job.</p>
        <div className="finalcta-cta">
          <Btn href="/register" variant="green" size="lg">Start Free Trial <Icon name="arrow" /></Btn>
          <Btn href="/login" variant="outline-light" size="lg">Book a Demo</Btn>
        </div>
        <div className="finalcta-trust">
          {["No credit card", "Set up fast", "Cancel anytime"].map(t => (
            <span key={t}><Icon name="check" /> {t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
  const cols: [string, string[]][] = [
    ["Product",   ["Features", "How it works", "Pricing", "Product tour", "Mobile app"]],
    ["Company",   ["About", "Careers", "Contact", "Book a demo"]],
    ["Resources", ["Help center", "Video tutorials", "Importing data", "Status"]],
    ["Legal",     ["Privacy", "Terms", "Security"]],
  ];
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Logo variant="white" height={36} />
          <p className="footer-tag">Field service &amp; commercial control for owner-led remodelers. Keep approved work, billing, and payment in sync.</p>
          <div className="footer-langs">
            <span className="mono">CLIENT-FACING IN</span>
            <span className="footer-lang">English</span>
            <span className="footer-lang">Español</span>
            <span className="footer-lang">Português</span>
          </div>
        </div>
        <div className="footer-cols">
          {cols.map(([h, items]) => (
            <div className="footer-col" key={h}>
              <span className="footer-col-h">{h}</span>
              {items.map(it => <a key={it} href="#">{it}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="wrap footer-bot">
        <span>© 2026 Clear Build USA. Made for American remodelers. 🇺🇸</span>
        <div className="footer-bot-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <Link href="/login">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

/* ── App ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  return (
    <div className="lp">
      <Nav />
      <main>
        <Hero />
        <PipelineStrip />
        <Features />
        <HowItWorks />
        <ProductDemo />
        <InvoiceSection />
        <ProjectsSection />
        <Comparison />
        <BestFit />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
