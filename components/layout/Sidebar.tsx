"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase, CreditCard,
  ClipboardList, MessageSquare, Star, Bell, MessagesSquare, UserCog,
  Settings, X, GitPullRequestDraft, UserCheck, UserCircle,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/dashboard",         icon: LayoutDashboard,      label: "Dashboard",       countKey: null },
  { href: "/contacts",          icon: Users,                label: "Contacts",         countKey: "contacts" as const },
  { href: "/projects",          icon: Briefcase,            label: "Projects",         countKey: null },
  { href: "/quotes",            icon: FileText,             label: "Quotes",           countKey: null },
  { href: "/change-orders",     icon: GitPullRequestDraft,  label: "Change Orders",    countKey: null },
  { href: "/invoices",          icon: Receipt,              label: "Invoices",         countKey: null },
  { href: "/payments",          icon: CreditCard,           label: "Payments",         countKey: null },
];

const CONTACTS_SUB = [
  { href: "/leads",     icon: UserCheck,  label: "Leads",     countKey: "leads" as const },
  { href: "/customers", icon: UserCircle, label: "Customers", countKey: "customers" as const },
];

const SECONDARY_NAV = [
  { href: "/notifications",     icon: Bell,           label: "Notifications",     countKey: null },
  { href: "/communications",    icon: MessagesSquare, label: "Communications",    countKey: null },
  { href: "/item-requirements", icon: ClipboardList,  label: "Item Requirements", countKey: null },
  { href: "/project-updates",   icon: MessageSquare,  label: "Project Updates",   countKey: null },
  { href: "/feedback",          icon: Star,           label: "Feedback",          countKey: null },
  { href: "/team",              icon: UserCog,        label: "Team",              countKey: null },
  { href: "/settings",          icon: Settings,       label: "Settings",          countKey: null },
];

type CountKey = "contacts" | "leads" | "customers";

interface Counts { contacts: number; leads: number; customers: number }

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function Sidebar({ user, businesses, currentBusiness }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ contacts: 0, leads: 0, customers: 0 });
  const [trialDays, setTrialDays] = useState({ used: 0, total: 14 });

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then(r => r.json()),
      fetch("/api/contacts?type=lead").then(r => r.json()),
      fetch("/api/contacts?type=customer").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([all, leads, customers, sub]) => {
      setCounts({
        contacts: (all.contacts ?? []).length,
        leads:    (leads.contacts ?? []).length,
        customers:(customers.contacts ?? []).length,
      });
      if (sub.subscription?.created_at) {
        const start = new Date(sub.subscription.created_at);
        const used = Math.max(0, Math.min(14, Math.floor((Date.now() - start.getTime()) / 86400000)));
        setTrialDays({ used, total: 14 });
      }
    }).catch(() => {});
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const contactsActive = ["/contacts", "/leads", "/customers"].some(p =>
    pathname === p || pathname.startsWith(p + "/")
  );

  const Badge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-auto min-w-[18px] h-[18px] bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  const NavLink = ({
    href, icon: Icon, label, countKey,
  }: { href: string; icon: any; label: string; countKey: CountKey | null }) => (
    <Link href={href} onClick={() => setMobileOpen(false)}
      className={`sidebar-link ${isActive(href) ? "active" : ""}`}>
      <Icon size={16} className="flex-shrink-0 opacity-75" />
      <span className="truncate flex-1">{label}</span>
      {countKey && <Badge n={counts[countKey]} />}
    </Link>
  );

  const trialPct = Math.min(100, (trialDays.used / trialDays.total) * 100);
  const daysLeft = trialDays.total - trialDays.used;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.png"
            alt="Clear Build USA"
            width={130}
            height={36}
            className="object-contain object-left"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <div key={item.href}>
            <NavLink {...item} />
            {item.href === "/contacts" && contactsActive && (
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
                    <Badge n={counts[sub.countKey]} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="sidebar-section">More</div>
        {SECONDARY_NAV.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Trial / plan badge */}
      <div className="mx-3 mb-4 p-3.5 rounded-[10px] bg-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-[12.5px] font-semibold">Trial · explore free</span>
          <span className="text-white/50 text-[11px]">{daysLeft}d left</span>
        </div>
        {/* Timeline progress bar */}
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
          Day {trialDays.used} of {trialDays.total} · Pro from $39/mo
        </div>
        <Link href="/subscription"
          className="block text-center text-[12px] font-medium py-1.5 rounded-[7px] bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors">
          Upgrade plan
        </Link>
      </div>
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
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[240px] bg-brand-navy flex-shrink-0 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}

export { };
