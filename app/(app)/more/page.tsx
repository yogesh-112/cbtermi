"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitPullRequestDraft, ClipboardList, MessagesSquare, Star, Bell,
  UserCog, CreditCard, Settings, ChevronRight, ArrowRight,
} from "lucide-react";

const WORKSPACE = [
  { href: "/change-orders",     icon: GitPullRequestDraft, label: "Change orders",      badge: null },
  { href: "/item-requirements", icon: ClipboardList,       label: "Item requirements",  badge: null },
  { href: "/communications",    icon: MessagesSquare,      label: "Communications",     badge: null },
  { href: "/feedback",          icon: Star,                label: "Feedback",           badge: null },
  { href: "/notifications",     icon: Bell,                label: "Notifications",      badge: null },
];

const BUSINESS = [
  { href: "/team",         icon: UserCog,    label: "Team",             badge: null },
  { href: "/subscription", icon: CreditCard, label: "Subscription",     badge: "Pro" },
  { href: "/settings",     icon: Settings,   label: "Business profile", badge: null },
];

export default function MorePage() {
  const [user, setUser] = useState<any>(null);
  const [counts, setCounts] = useState({ quotes: 0, invoices: 0, team: 0 });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    Promise.all([
      fetch("/api/quotes").then(r => r.json()),
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/team").then(r => r.json()),
    ]).then(([q, inv, t]) => {
      setCounts({
        quotes: (q.quotes ?? []).length,
        invoices: (inv.invoices ?? []).length,
        team: (t.members ?? []).length,
      });
    });
  }, []);

  const initials = user?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="lg:hidden min-h-screen bg-[#f6f6f3] pb-20">
      {/* Navy header */}
      <div className="bg-brand-navy px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#2453E4] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[15px] font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-tight">{user?.name ?? "—"}</p>
              <p className="text-white/60 text-[12px] mt-0.5">Owner · Pro plan · 11d trial</p>
            </div>
          </div>
          <Link href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-[12px] font-medium rounded-lg">
            View <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 bg-white border-b border-[#e7e6e1]">
        {[
          { label: "Quotes",   value: counts.quotes },
          { label: "Invoices", value: counts.invoices },
          { label: "Team",     value: counts.team },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-4 border-r border-[#f0efea] last:border-r-0">
            <span className="text-[22px] font-bold text-[#0c1226]">{s.value}</span>
            <span className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Workspace section */}
        <div>
          <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2 px-1">Workspace</p>
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0efea]">
            {WORKSPACE.map(({ href, icon: Icon, label, badge }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f6f6f3] transition-colors">
                <Icon size={18} className="text-[#4a5168] flex-shrink-0" />
                <span className="flex-1 text-[14px] text-[#0c1226]">{label}</span>
                {badge && (
                  <span className="w-5 h-5 bg-brand-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
                <ChevronRight size={14} className="text-[#d8d6cf]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Business section */}
        <div>
          <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2 px-1">Business</p>
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0efea]">
            {BUSINESS.map(({ href, icon: Icon, label, badge }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f6f6f3] transition-colors">
                <Icon size={18} className="text-[#4a5168] flex-shrink-0" />
                <span className="flex-1 text-[14px] text-[#0c1226]">{label}</span>
                {badge && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-brand-green">
                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full" /> {badge}
                  </span>
                )}
                <ChevronRight size={14} className="text-[#d8d6cf]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
