"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Bell, Plus, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "@/lib/i18n";

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function Topbar({ user, businesses, currentBusiness }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [bizOpen, setBizOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_META: Record<string, { label: string; ctaLabel?: string; ctaHref?: string }> = {
    "/dashboard":         { label: t.nav.dashboard,        ctaLabel: t.topbar.newQuote,       ctaHref: "/quotes/new" },
    "/contacts":          { label: t.nav.contacts,          ctaLabel: t.topbar.newContact,     ctaHref: "/contacts/new" },
    "/leads":             { label: t.nav.leads,             ctaLabel: t.topbar.addLead,        ctaHref: "/contacts/new" },
    "/customers":         { label: t.nav.customers,         ctaLabel: t.topbar.addCustomer,    ctaHref: "/contacts/new" },
    "/projects":          { label: t.nav.projects,          ctaLabel: t.projects.newProject,   ctaHref: "/projects/new" },
    "/quotes":            { label: t.nav.quotes,            ctaLabel: t.topbar.newQuote,       ctaHref: "/quotes/new" },
    "/invoices":          { label: t.nav.invoices,          ctaLabel: t.topbar.newInvoice,     ctaHref: "/invoices/new" },
    "/payments":          { label: t.nav.payments },
    "/change-orders":     { label: t.nav.changeOrders,      ctaLabel: t.topbar.newOrder,       ctaHref: "/change-orders/new" },
    "/notifications":     { label: t.nav.notifications },
    "/communications":    { label: t.nav.communications },
    "/item-requirements": { label: t.nav.itemRequirements },
    "/project-updates":   { label: t.nav.projectUpdates },
    "/feedback":          { label: t.nav.feedback },
    "/team":              { label: t.nav.team },
    "/settings":          { label: t.nav.settings },
    "/subscription":      { label: t.nav.subscription },
    "/profile":           { label: t.nav.profile },
    "/more":              { label: t.nav.more },
  };

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setSearchOpen(true);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentPage = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find(k => pathname === k || pathname.startsWith(k + "/"));
  const meta = currentPage ? PAGE_META[currentPage] : { label: "" };

  const switchBusiness = async (id: string) => {
    const res = await fetch("/api/businesses/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    if (res.ok) {
      setBizOpen(false);
      window.location.reload();
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <header className="hidden lg:flex fixed top-0 right-0 z-20 h-[52px] bg-white border-b border-[#e7e6e1] items-center px-5 gap-4 sb-left">
      {/* Business + breadcrumb */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => { setBizOpen(!bizOpen); setUserOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef2ff] hover:bg-[#e5ebff] text-brand-navy text-[13px] font-semibold transition-colors"
          >
            <span className="max-w-[150px] truncate">{currentBusiness?.name ?? "Business"}</span>
            <ChevronDown size={11} className={`flex-shrink-0 transition-transform ${bizOpen ? "rotate-180" : ""}`} />
          </button>
          {bizOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-30 overflow-hidden animate-scale-in">
              <div className="py-1">
                {businesses.map((b) => (
                  <button key={b.id} onClick={() => switchBusiness(b.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors
                      ${b.id === currentBusiness?.id ? "text-brand-navy font-semibold bg-[#eef2ff]" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                    <div className="w-5 h-5 bg-brand-navy/10 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-navy text-[9px] font-bold">{b.name[0]?.toUpperCase()}</span>
                    </div>
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[#e7e6e1] py-1">
                <Link href="/business-setup" onClick={() => setBizOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-green hover:bg-[#f0faf4] font-medium">
                  <Plus size={13} /> {t.nav.newBusiness}
                </Link>
              </div>
            </div>
          )}
        </div>
        {meta.label && (
          <>
            <span className="text-[#c8c6bf] text-base leading-none">›</span>
            <span className="text-[13px] text-[#4a5168] font-medium">{meta.label}</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[420px] relative" ref={searchRef}>
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none z-10" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
          placeholder={t.topbar.searchPlaceholder}
          className="w-full h-[34px] pl-8 pr-11 text-[13px] bg-[#f6f6f3] border border-[#e7e6e1] rounded-lg text-[#0c1226] placeholder:text-[#8a8fa3] focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:bg-white transition-colors"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8a8fa3] font-medium bg-white border border-[#e7e6e1] rounded px-1 py-0.5 pointer-events-none">⌘K</span>
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-30 overflow-hidden animate-scale-in">
            {searchResults.map((r) => (
              <Link key={r.id + r.type} href={r.href}
                onClick={() => { setSearch(""); setSearchOpen(false); }}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#f6f6f3] transition-colors">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8fa3] w-14 flex-shrink-0">{r.type}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0c1226] truncate">{r.label}</p>
                  {r.sub && <p className="text-[11px] text-[#8a8fa3] truncate">{r.sub}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
        {searchOpen && search.length >= 2 && searchResults.length === 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-30 px-4 py-3 text-[13px] text-[#8a8fa3]">
            {t.topbar.noResultsFor} &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Bell */}
        <Link href="/notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-red-500 rounded-full border-[1.5px] border-white" />
        </Link>

        {/* CTA */}
        {meta.ctaLabel && (
          meta.ctaHref ? (
            <Link href={meta.ctaHref}
              className="flex items-center gap-1.5 px-3.5 py-[7px] bg-brand-navy text-white text-[13px] font-medium rounded-lg hover:bg-brand-navy/90 transition-colors whitespace-nowrap">
              <Plus size={13} strokeWidth={2.5} /> {meta.ctaLabel}
            </Link>
          ) : (
            <button className="flex items-center gap-1.5 px-3.5 py-[7px] bg-brand-navy text-white text-[13px] font-medium rounded-lg hover:bg-brand-navy/90 transition-colors whitespace-nowrap">
              <Plus size={13} strokeWidth={2.5} /> {meta.ctaLabel}
            </button>
          )
        )}

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setBizOpen(false); }}
            aria-label="Open user menu"
            className="w-[30px] h-[30px] bg-brand-navy rounded-full flex items-center justify-center hover:ring-2 hover:ring-brand-navy/30 transition-all"
          >
            <span className="text-white text-[11px] font-bold tracking-wide">{initials}</span>
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-30 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-[#e7e6e1]">
                <p className="text-sm font-semibold text-[#0c1226] truncate">{user.name}</p>
                <p className="text-xs text-[#8a8fa3] truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link href="/profile" onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
                  <UserCircle size={14} /> {t.common.profile}
                </Link>
                <Link href="/settings" onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
                  <Settings size={14} /> {t.common.settings}
                </Link>
              </div>
              <div className="border-t border-[#e7e6e1] py-1">
                <button onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={14} /> {t.common.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close overlay */}
      {(bizOpen || userOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setBizOpen(false); setUserOpen(false); }} />
      )}
    </header>
  );
}
