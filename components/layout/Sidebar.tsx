"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase, CreditCard,
  ClipboardList, MessageSquare, Star, Bell, MessagesSquare, UserCog,
  Settings, X, GitPullRequestDraft, UserCheck, UserCircle,
  ChevronsLeft, ChevronsRight, ShieldCheck, HelpCircle, Calendar, LayoutTemplate,
} from "lucide-react";
import { useT } from "@/lib/i18n";

type CountKey = "contacts" | "leads" | "customers";
interface Counts { contacts: number; leads: number; customers: number }

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function Sidebar({ user, businesses, currentBusiness }: Props) {
  const pathname = usePathname();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState<Counts>({ contacts: 0, leads: 0, customers: 0 });
  const [trialDays, setTrialDays] = useState({ used: 0, total: 14 });

  const PRIMARY_NAV = [
    { href: "/dashboard",         icon: LayoutDashboard,      label: t.nav.dashboard,      countKey: null },
    { href: "/contacts",          icon: Users,                label: t.nav.contacts,       countKey: "contacts" as const },
    { href: "/projects",          icon: Briefcase,            label: t.nav.projects,       countKey: null },
    { href: "/quotes",            icon: FileText,             label: t.nav.quotes,         countKey: null },
    { href: "/change-orders",     icon: GitPullRequestDraft,  label: t.nav.changeOrders,   countKey: null },
    { href: "/invoices",          icon: Receipt,              label: t.nav.invoices,       countKey: null },
    { href: "/payments",          icon: CreditCard,           label: t.nav.payments,       countKey: null },
  ];

  const CONTACTS_SUB = [
    { href: "/leads",     icon: UserCheck,  label: t.nav.leads,     countKey: "leads" as const },
    { href: "/customers", icon: UserCircle, label: t.nav.customers, countKey: "customers" as const },
  ];

  const SECONDARY_NAV = [
    { href: "/scheduling",        icon: Calendar,       label: "Scheduling",           countKey: null },
    { href: "/templates",         icon: LayoutTemplate, label: "Templates",            countKey: null },
    { href: "/notifications",     icon: Bell,           label: t.nav.notifications,    countKey: null },
    { href: "/communications",    icon: MessagesSquare, label: t.nav.communications,   countKey: null },
    { href: "/item-requirements", icon: ClipboardList,  label: t.nav.itemRequirements, countKey: null },
    { href: "/project-updates",   icon: MessageSquare,  label: t.nav.projectUpdates,   countKey: null },
    { href: "/feedback",          icon: Star,           label: t.nav.feedback,         countKey: null },
    { href: "/team",              icon: UserCog,        label: t.nav.team,             countKey: null },
    { href: "/audit-log",         icon: ShieldCheck,    label: t.nav.auditLog,         countKey: null },
    { href: "/settings",          icon: Settings,       label: t.nav.settings,         countKey: null },
    { href: "/help",              icon: HelpCircle,     label: "Help & Support",       countKey: null },
  ];

  // Restore collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sb-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  // Sync collapsed state to CSS variable via html data attribute
  useEffect(() => {
    document.documentElement.dataset.sb = collapsed ? "1" : "0";
    localStorage.setItem("sb-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Fetch nav counts + trial info — re-run on each navigation so counts stay fresh
  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then(r => r.json()),
      fetch("/api/contacts?type=lead").then(r => r.json()),
      fetch("/api/contacts?type=customer").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([all, leads, customers, sub]) => {
      setCounts({
        contacts:  (all.contacts ?? []).length,
        leads:     (leads.contacts ?? []).length,
        customers: (customers.contacts ?? []).length,
      });
      if (sub.subscription?.created_at) {
        const used = Math.max(0, Math.min(14,
          Math.floor((Date.now() - new Date(sub.subscription.created_at).getTime()) / 86400000)
        ));
        setTrialDays({ used, total: 15 });
      }
    }).catch(err => console.error("[sidebar] counts fetch failed:", err));
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const contactsActive = ["/contacts", "/leads", "/customers"].some(p =>
    pathname === p || pathname.startsWith(p + "/")
  );

  const CountBadge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-auto min-w-[18px] h-[18px] bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  /** Tooltip shown when sidebar is collapsed and user hovers an icon */
  const Tooltip = ({ label, count }: { label: string; count?: number }) => (
    <span className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#0c1226] border border-white/10 text-white text-[12px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-lg transition-opacity duration-100 flex items-center gap-1.5">
      {label}
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-white/50">({count})</span>
      )}
    </span>
  );

  /** Collapsed nav link — icon only, tooltip on hover */
  const CollapsedLink = ({
    href, icon: Icon, label, countKey,
  }: { href: string; icon: any; label: string; countKey: CountKey | null }) => {
    const count = countKey ? counts[countKey] : 0;
    return (
      <div className="relative group">
        <Link href={href} onClick={() => setMobileOpen(false)}
          className={`flex items-center justify-center w-full h-9 rounded-[8px] transition-all duration-150
            ${isActive(href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
        >
          <Icon size={17} className="flex-shrink-0" />
          {countKey && count > 0 && (
            <span className="absolute top-1 right-1 w-[7px] h-[7px] bg-brand-green rounded-full" />
          )}
        </Link>
        <Tooltip label={label} count={countKey ? counts[countKey] : undefined} />
      </div>
    );
  };

  /** Expanded nav link — icon + text + count badge */
  const ExpandedLink = ({
    href, icon: Icon, label, countKey,
  }: { href: string; icon: any; label: string; countKey: CountKey | null }) => (
    <Link href={href} onClick={() => setMobileOpen(false)}
      className={`sidebar-link ${isActive(href) ? "active" : ""}`}>
      <Icon size={16} className="flex-shrink-0 opacity-75" />
      <span className="truncate flex-1">{label}</span>
      {countKey && <CountBadge n={counts[countKey]} />}
    </Link>
  );

  const trialPct = Math.min(100, (trialDays.used / trialDays.total) * 100);
  const daysLeft = trialDays.total - trialDays.used;

  const SidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo + toggle button */}
      <div className={`flex items-center flex-shrink-0 pt-4 pb-3 ${collapsed && !inDrawer ? "justify-center px-2" : "justify-between px-4"}`}>
        {/* Logo */}
        {collapsed && !inDrawer ? (
          /* Compact: show icon portion of logo */
          <Link href="/dashboard" title="Clear Build USA">
            <Image src="/logo.png" alt="CB" width={30} height={30} className="object-contain object-left" />
          </Link>
        ) : (
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="Clear Build USA" width={126} height={34} className="object-contain object-left" />
          </Link>
        )}

        {/* Collapse toggle — desktop only, not in mobile drawer */}
        {!inDrawer && (
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ${collapsed ? "mt-1" : ""}`}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-1 space-y-0.5 ${collapsed && !inDrawer ? "px-1.5" : "px-3"}`}>
        {PRIMARY_NAV.map((item) => (
          <div key={item.href}>
            {collapsed && !inDrawer
              ? <CollapsedLink {...item} />
              : <ExpandedLink {...item} />
            }
            {/* Contacts sub-nav (only when expanded) */}
            {item.href === "/contacts" && contactsActive && !collapsed && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                {CONTACTS_SUB.map(sub => (
                  <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors ${
                      isActive(sub.href)
                        ? "text-white font-medium bg-white/10"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}>
                    <sub.icon size={13} className="flex-shrink-0" />
                    <span className="flex-1">{sub.label}</span>
                    <CountBadge n={counts[sub.countKey]} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* "More" section */}
        {(!collapsed || inDrawer) && (
          <div className="sidebar-section">{t.nav.more}</div>
        )}
        {collapsed && !inDrawer && <div className="my-2 mx-1 border-t border-white/10" />}

        {SECONDARY_NAV.map((item) => (
          collapsed && !inDrawer
            ? <CollapsedLink key={item.href} {...item} />
            : <ExpandedLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Trial badge — hidden when collapsed */}
      {(!collapsed || inDrawer) && (
        <div className="mx-3 mb-4 p-3.5 rounded-[10px] bg-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-[12.5px] font-semibold">{t.nav.trialLabel}</span>
            <span className="text-white/50 text-[11px]">{daysLeft}{t.nav.daysLeft}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${trialPct}%`,
                background: trialPct > 80 ? "#ef4444" : trialPct > 50 ? "#f59e0b" : "#3FA66B",
              }}
            />
          </div>
          <div className="text-white/50 text-[11px] mb-2.5">
            {t.nav.dayOf} {trialDays.used} {t.nav.of} {trialDays.total} · {t.nav.proFrom}
          </div>
          <Link href="/subscription"
            className="block text-center text-[12px] font-medium py-1.5 rounded-[7px] bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors">
            {t.nav.upgradePlan}
          </Link>
        </div>
      )}

      {/* Collapsed: small upgrade dot */}
      {collapsed && !inDrawer && (
        <div className="relative group mx-1.5 mb-4 flex-shrink-0">
          <Link href="/subscription"
            className="flex items-center justify-center h-9 rounded-[8px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
            <CreditCard size={16} />
          </Link>
          <Tooltip label={`${t.nav.upgradePlan} · ${daysLeft}${t.nav.daysLeft}`} />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[240px] bg-brand-navy shadow-modal animate-slide-up">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all z-10">
              <X size={16} />
            </button>
            <SidebarContent inDrawer />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col bg-brand-navy flex-shrink-0 fixed top-0 left-0 bottom-0 z-30 overflow-visible"
        style={{
          width: collapsed ? "64px" : "240px",
          transition: "width 200ms ease",
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export { };
