"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Bell, Plus, ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

const PAGE_META: Record<string, { label: string; ctaLabel?: string; ctaHref?: string }> = {
  "/dashboard":         { label: "Dashboard",        ctaLabel: "New quote",       ctaHref: "/quotes/new" },
  "/contacts":          { label: "Contacts",          ctaLabel: "New contact",     ctaHref: "/contacts/new" },
  "/projects":          { label: "Projects",          ctaLabel: "New project",     ctaHref: "/projects/new" },
  "/quotes":            { label: "Quotes",            ctaLabel: "New quote",       ctaHref: "/quotes/new" },
  "/invoices":          { label: "Invoices",          ctaLabel: "New invoice",     ctaHref: "/invoices/new" },
  "/payments":          { label: "Payments" },
  "/change-orders":     { label: "Change Orders",     ctaLabel: "New order",       ctaHref: "/change-orders/new" },
  "/notifications":     { label: "Notifications" },
  "/communications":    { label: "Communications" },
  "/item-requirements": { label: "Item Requirements" },
  "/project-updates":   { label: "Project Updates" },
  "/feedback":          { label: "Feedback" },
  "/team":              { label: "Team" },
  "/settings":          { label: "Settings" },
  "/subscription":      { label: "Subscription" },
};

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function Topbar({ user, businesses, currentBusiness }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [bizOpen, setBizOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentPage = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find(k => pathname === k || pathname.startsWith(k + "/"));
  const meta = currentPage ? PAGE_META[currentPage] : { label: "" };

  const switchBusiness = async (id: string) => {
    await fetch("/api/businesses/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    router.refresh();
    setBizOpen(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <header className="hidden lg:flex fixed top-0 left-[240px] right-0 z-20 h-[52px] bg-white border-b border-[#e7e6e1] items-center px-5 gap-4">
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
                  <Plus size={13} /> New Business
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
      <div className="flex-1 max-w-[420px] relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts, projects, invoices…"
          className="w-full h-[34px] pl-8 pr-11 text-[13px] bg-[#f6f6f3] border border-[#e7e6e1] rounded-lg text-[#0c1226] placeholder:text-[#8a8fa3] focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:bg-white transition-colors"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8a8fa3] font-medium bg-white border border-[#e7e6e1] rounded px-1 py-0.5 pointer-events-none">⌘K</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
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
                <Link href="/settings" onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
                  <Settings size={14} /> Settings
                </Link>
              </div>
              <div className="border-t border-[#e7e6e1] py-1">
                <button onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={14} /> Sign out
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
