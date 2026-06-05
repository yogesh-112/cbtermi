"use client";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import Link from "next/link";
import "./landing.css";
import { LANDING_T, type LandingT } from "./landing-translations";

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

/* ── Translations context ───────────────────────────────────────────── */
const TCtx = createContext<LandingT>(LANDING_T.en);
function useT() { return useContext(TCtx); }

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
  const t = useT();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links: [string, string][] = [
    [t.nav.features, "#features"],
    [t.nav.how,      "#how"],
    [t.nav.pricing,  "#pricing"],
    [t.nav.faq,      "#faq"],
  ];
  return (
    <header className={`nav${solid ? " nav--solid" : ""}`}>
      <div className="wrap nav-inner">
        <a href="#top" className="nav-brand"><Logo height={34} /></a>
        <nav className="nav-links">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="nav-cta">
          <LangSwitcher />
          <Link href="/login" className="nav-signin">{t.nav.signIn}</Link>
          <Link href="/login" className="btn btn-soft btn-sm">{t.nav.bookDemo}</Link>
          <Link href="/register" className="btn btn-primary btn-sm">{t.nav.startTrial}</Link>
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
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          <Link href="/login" className="nav-mobile-signin" onClick={() => setOpen(false)}>{t.nav.signIn}</Link>
          <LangSegment />
          <Link href="/login" onClick={() => setOpen(false)} className="btn btn-soft">{t.nav.bookDemo}</Link>
          <Link href="/register" onClick={() => setOpen(false)} className="btn btn-primary">{t.nav.startTrial}</Link>
        </div>
      )}
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */
function HeroChain() {
  const t = useT();
  const { chainSteps: steps, chainTitle, chainJob, chainBadge } = t.hero;
  const nodeColors = ["var(--blue)", "var(--green)", "var(--navy)", "var(--blue)", "var(--green)"];
  const nodeLabels = ["Q", "✓", "+", "$", "✓"];
  const pillKinds: Record<string, string> = { Sent: "sent", Enviada: "sent", Enviado: "sent", Approved: "approved", Aprobado: "approved", Aprovado: "approved", Paid: "paid", Pagado: "paid", Pago: "paid" };
  return (
    <div className="chain">
      <div className="chain-head">
        <span className="chain-head-title"><span className="d" />{chainTitle}</span>
        <span className="chain-head-id mono">{chainJob}</span>
      </div>
      <div className="chain-rail" />
      {steps.map((s, i) => (
        <div className="chain-step" key={i} style={{ animationDelay: (0.5 + i * 0.14) + "s" }}>
          <div className="chain-node" style={{ background: nodeColors[i] }}>{nodeLabels[i]}</div>
          <div className="chain-card">
            <div className="chain-card-top">
              <span className="chain-name">{s.name}</span>
              {"pill" in s && s.pill
                ? <Pill kind={pillKinds[s.pill] ?? "sent"}>{s.pill}</Pill>
                : <span className="chain-amt archivo">{"amt" in s ? s.amt : ""}</span>}
            </div>
            <div className="chain-meta">{s.meta}</div>
          </div>
        </div>
      ))}
      <div className="chain-badge"><Icon name="link" /> {chainBadge}</div>
    </div>
  );
}

function Hero() {
  const t = useT();
  const h = t.hero;
  return (
    <section className="hero" id="top">
      <div className="hero-glow" />
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow reveal">{h.eyebrow}</span>
          <h1 className="display hero-h1 reveal" data-d="1">
            {h.h1a} <span className="hl">{h.h1b}</span>
          </h1>
          <p className="hero-sub reveal" data-d="2">{h.sub}</p>
          <div className="hero-cta reveal" data-d="3">
            <Btn href="/register" variant="primary" size="lg">{h.cta1} <Icon name="arrow" /></Btn>
            <Btn href="/login" variant="soft" size="lg">{h.cta2}</Btn>
          </div>
          <div className="hero-trust reveal" data-d="4">
            {h.trust.map(item => (
              <span key={item} className="hero-trust-item">
                <span className="tick"><Icon name="check" /></span>{item}
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
  const t = useT();
  const { label, steps } = t.pipeline;
  return (
    <div className="pipestrip">
      <div className="wrap pipestrip-inner">
        <span className="pipestrip-label mono">{label}</span>
        <div className="pipestrip-flow">
          {steps.map((s, i) => (
            <span key={i}>
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
  const t = useT();
  const f = t.features;
  const icons = ["quote", "card", "link", "shield"];
  const cols  = ["blue",  "green","navy", "blue"];
  const secIcons = ["pipeline", "calendar"];
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />{f.kicker}</span>
          <h2 className="section-title">{f.title}</h2>
          <p className="section-sub">{f.sub}</p>
        </div>
        <div className="feat-primary">
          {f.primary.map((item, i) => (
            <article className="feat-card reveal" data-d={String(i + 1)} key={i}>
              <div className={`ico ico-${cols[i]} feat-ico`}><Icon name={icons[i]} /></div>
              <h3 className="feat-title">{item.t}</h3>
              <p className="feat-desc">{item.d}</p>
              <span className="feat-rank mono">0{i + 1}</span>
            </article>
          ))}
        </div>
        <div className="feat-secondary reveal">
          <span className="feat-also mono">{f.alsoIncluded}</span>
          <div className="feat-secondary-grid">
            {f.secondary.map((item, i) => (
              <article className="feat-card-2" key={i}>
                <div className="ico ico-navy feat-ico-2"><Icon name={secIcons[i]} /></div>
                <div>
                  <h3 className="feat-title-2">{item.t}</h3>
                  <p className="feat-desc-2">{item.d}</p>
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
  const t = useT();
  const h = t.how;
  const icons = ["pipeline", "quote", "shield", "invoice", "chart"];
  const [active, setActive] = useState(0);
  return (
    <section className="section bg-cool" id="how">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />{h.kicker}</span>
          <h2 className="section-title">{h.title}</h2>
          <p className="section-sub">{h.sub}</p>
        </div>
        <div className="how-grid reveal">
          <ol className="how-steps">
            {h.steps.map((s, i) => (
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
              <div className="how-visual-ico ico ico-blue"><Icon name={icons[active]} /></div>
              <span className="how-visual-step mono">STEP {active + 1} / 5</span>
              <h3 className="how-visual-title">{h.steps[active].t}</h3>
              <p className="how-visual-desc">{h.steps[active].d}</p>
              <div className="how-visual-chain">
                {h.steps.map((_, i) => <span key={i} className={`hv-dot${i <= active ? " on" : ""}`} />)}
              </div>
              <div className="how-visual-tag"><Icon name="link" /> {h.linkedTag}</div>
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
        {nav.map(([label, ic]) => (
          <div key={label} className={`app-nav-item${label === active ? " on" : ""}`}><Icon name={ic} /> <span>{label}</span></div>
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
  const t = useT();
  const d = t.demo;
  const tabKeys = ["quote", "approve", "invoice", "project"] as const;
  const tabIcons = ["quote", "shield", "card", "layers"];
  const [tab, setTab] = useState<typeof tabKeys[number]>("quote");
  const url = tab === "approve" ? "app.clearbuildusa.com/q/1042/approve" : `app.clearbuildusa.com/${tab}`;
  return (
    <section className="section demo">
      <div className="demo-glow" />
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow" style={{ color: "var(--green-bright)" }}><span className="dot" />{d.kicker}</span>
          <h2 className="section-title" style={{ color: "#fff" }}>{d.title}</h2>
          <p className="section-sub" style={{ color: "#a7b4ce" }}>{d.sub}</p>
        </div>
        <div className="demo-tabs reveal">
          {tabKeys.map((k, i) => (
            <button type="button" key={k} className={`demo-tab${tab === k ? " is-active" : ""}`} onClick={() => setTab(k)}>
              <Icon name={tabIcons[i]} /> {d.tabs[i]}
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
  const t = useT();
  const inv = t.invoice;
  const icons = ["card", "globe", "refresh", "bell"];
  return (
    <section className="section" id="invoicing">
      <div className="wrap split">
        <div className="split-copy reveal">
          <span className="kicker eyebrow"><span className="dot" />{inv.kicker}</span>
          <h2 className="section-title">{inv.title}</h2>
          <p className="section-sub">{inv.sub}</p>
          <ul className="bullet-list">
            {inv.bullets.map((b, i) => (
              <li className="bullet" key={i}>
                <span className="bullet-ico ico ico-green"><Icon name={icons[i]} /></span>
                <div><span className="bullet-t">{b.t}</span><span className="bullet-d">{b.d}</span></div>
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
  const t = useT();
  const p = t.projects;
  return (
    <section className="section bg-cool" id="projects">
      <div className="wrap split reverse">
        <div className="split-visual reveal"><ProjectMiniMock /></div>
        <div className="split-copy reveal" data-d="1">
          <span className="kicker eyebrow"><span className="dot" />{p.kicker}</span>
          <h2 className="section-title">{p.title}</h2>
          <p className="section-sub">{p.sub}</p>
          <ul className="check-list">
            {p.bullets.map((b, i) => <li key={i}><span className="cl-tick"><Icon name="check" /></span>{b}</li>)}
          </ul>
          <Btn href="/register" variant="dark" className="mt">{p.cta} <Icon name="arrow" /></Btn>
        </div>
      </div>
    </section>
  );
}

/* ── Comparison ─────────────────────────────────────────────────────── */
function Comparison() {
  const t = useT();
  const c = t.comparison;
  const data: [boolean | "part", boolean | "part", boolean | "part"][] = [
    [false, true,   true],
    [false, true,   true],
    [false, true,   true],
    [false, "part", true],
    [false, true,   true],
    ["part",false,  true],
    [false, false,  true],
    [true,  false,  true],
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
          <span className="kicker eyebrow"><span className="dot" />{c.kicker}</span>
          <h2 className="section-title">{c.title}</h2>
        </div>
        <div className="cmp reveal">
          <div className="cmp-row cmp-headrow">
            <span className="cmp-feat" />
            <span className="cmp-col">{c.headers[0]}</span>
            <span className="cmp-col">{c.headers[1]}</span>
            <span className="cmp-col cmp-col-us"><Logo height={22} /></span>
          </div>
          {c.rows.map((row, i) => (
            <div className="cmp-row" key={i}>
              <span className="cmp-feat">{row}</span>
              <span className="cmp-col"><Cell v={data[i][0]} /></span>
              <span className="cmp-col"><Cell v={data[i][1]} /></span>
              <span className="cmp-col cmp-col-us"><Cell v={data[i][2]} /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Best Fit ───────────────────────────────────────────────────────── */
function BestFit() {
  const t = useT();
  const b = t.bestfit;
  const metricIcons = ["bolt", "lock", "globe", "users"];
  return (
    <section className="section bg-cool" id="bestfit">
      <div className="wrap bestfit">
        <div className="bestfit-copy reveal">
          <span className="kicker eyebrow"><span className="dot" />{b.kicker}</span>
          <h2 className="section-title">{b.title}</h2>
          <ul className="check-list lg">
            {b.bullets.map((item, i) => <li key={i}><span className="cl-tick"><Icon name="check" /></span>{item}</li>)}
          </ul>
        </div>
        <div className="bestfit-metrics reveal" data-d="1">
          {b.metrics.map((m, i) => (
            <div className="metric-card" key={i}>
              <span className="metric-ico"><Icon name={metricIcons[i]} /></span>
              <h3 className="metric-t">{m.t}</h3>
              <p className="metric-d">{m.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────── */
function Pricing() {
  const t = useT();
  const p = t.pricing;
  const [yearly, setYearly] = useState(true);
  const price = (m: number) => yearly ? Math.round(m * 10 / 12 * 10) / 10 : m;
  const baseMonthly = [49, 99, 179];
  const popIndex = 1;
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="section-head center reveal">
          <span className="kicker eyebrow"><span className="dot" />{p.kicker}</span>
          <h2 className="section-title">{p.title}</h2>
          <p className="section-sub">{p.sub}</p>
        </div>
        <div className="price-toggle reveal">
          <button type="button" className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>{p.monthly}</button>
          <button type="button" className={yearly ? "on" : ""} onClick={() => setYearly(true)}>
            {p.yearly} <span className="price-save">{p.save}</span>
          </button>
        </div>
        <div className="price-grid reveal">
          {p.plans.map((plan, i) => (
            <div className={`price-card${i === popIndex ? " pop" : ""}`} key={i}>
              {i === popIndex && <span className="price-badge mono">{p.popular}</span>}
              <span className="price-name archivo">{plan.name}</span>
              <span className="price-tag">{plan.tag}</span>
              <div className="price-amt">
                <span className="price-cur">$</span>
                <span className="price-num archivo">{price(baseMonthly[i])}</span>
                <span className="price-per">/mo</span>
              </div>
              <span className="price-bill mono">{yearly ? p.billedYearly : p.billedMonthly}</span>
              <p className="price-blurb">{plan.blurb}</p>
              <Btn href="/register" variant={i === popIndex ? "primary" : "soft"} className="price-cta">{p.startTrial}</Btn>
              <ul className="price-feats">
                {plan.feats.map((f, j) => (
                  <li key={j}><span className="pf-tick"><Icon name="check" /></span>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="price-note reveal"><Icon name="shield" /> {p.note}</p>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────── */
function FAQ() {
  const t = useT();
  const f = t.faq;
  const [open, setOpen] = useState(1);
  return (
    <section className="section bg-cool" id="faq">
      <div className="wrap faq-wrap">
        <div className="faq-head reveal">
          <span className="kicker eyebrow"><span className="dot" />{f.kicker}</span>
          <h2 className="section-title">{f.title}</h2>
          <p className="section-sub">{f.sub}</p>
          <div className="faq-help"><Icon name="phone" /> {f.help} <a href="/login">{f.bookDemo}</a></div>
        </div>
        <div className="faq-list reveal" data-d="1">
          {f.qa.map((x, i) => (
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
  const t = useT();
  const c = t.cta;
  return (
    <section className="section finalcta" id="demo">
      <div className="finalcta-tex" />
      <div className="wrap finalcta-inner reveal">
        <span className="eyebrow" style={{ color: "var(--green-bright)" }}>{c.eyebrow}</span>
        <h2 className="display finalcta-h">{c.h2}</h2>
        <p className="finalcta-sub">{c.sub}</p>
        <div className="finalcta-cta">
          <Btn href="/register" variant="green" size="lg">{c.cta1} <Icon name="arrow" /></Btn>
          <Btn href="/login" variant="outline-light" size="lg">{c.cta2}</Btn>
        </div>
        <div className="finalcta-trust">
          {c.trust.map(item => (
            <span key={item}><Icon name="check" /> {item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
  const t = useT();
  const f = t.footer;
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Logo variant="white" height={36} />
          <p className="footer-tag">{f.tag}</p>
          <div className="footer-langs">
            <span className="mono">{f.clientFacing}</span>
            <span className="footer-lang">English</span>
            <span className="footer-lang">Español</span>
            <span className="footer-lang">Português</span>
          </div>
        </div>
        <div className="footer-cols">
          {f.cols.map(([heading, items]) => (
            <div className="footer-col" key={heading}>
              <span className="footer-col-h">{heading}</span>
              {items.map(item => <a key={item} href="#">{item}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="wrap footer-bot">
        <span>{f.copy}</span>
        <div className="footer-bot-links">
          <a href="#">Privacy</a><a href="#">Terms</a><Link href="/login">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

/* ── App ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [lang, setLang] = useLang();
  const t = LANDING_T[lang];
  useReveal();
  return (
    <TCtx.Provider value={t}>
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
    </TCtx.Provider>
  );
}
