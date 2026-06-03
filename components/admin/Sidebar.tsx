"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt,
  ClipboardList, Shield, Settings, LogOut,
  Activity, Layers, BarChart2, Megaphone, Tag, PlayCircle,
} from "lucide-react";

const NAV = [
  { section: "Overview", items: [
    { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/analytics",  icon: BarChart2,        label: "Analytics" },
  ]},
  { section: "Customers", items: [
    { href: "/admin/businesses", icon: Building2,       label: "Businesses" },
    { href: "/admin/users",      icon: Users,           label: "Users" },
  ]},
  { section: "Billing", items: [
    { href: "/admin/subscriptions", icon: Layers,       label: "Subscriptions" },
    { href: "/admin/payments",   icon: Receipt,         label: "Payments" },
    { href: "/admin/plans",      icon: CreditCard,      label: "Plans" },
    { href: "/admin/coupons",    icon: Tag,             label: "Coupons" },
  ]},
  { section: "Tools", items: [
    { href: "/admin/broadcasts", icon: Megaphone,       label: "Broadcasts" },
    { href: "/admin/tutorials",  icon: PlayCircle,      label: "Tutorials" },
  ]},
  { section: "System", items: [
    { href: "/admin/audit-logs", icon: ClipboardList,   label: "Audit Logs" },
    { href: "/admin/admins",     icon: Shield,          label: "Admins" },
    { href: "/admin/settings",   icon: Settings,        label: "Settings" },
  ]},
];

interface Props {
  admin: { name: string; email: string; role: string };
  counts: { businesses: number; users: number; activeSubs: number };
}

export default function AdminSidebar({ admin, counts }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const getBadge = (href: string) => {
    if (href === "/admin/businesses") return counts.businesses > 0 ? counts.businesses : null;
    if (href === "/admin/users")      return counts.users > 0 ? counts.users : null;
    if (href === "/admin/subscriptions") return counts.activeSubs > 0 ? counts.activeSubs : null;
    return null;
  };

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-[#0B0F1A] flex flex-col z-40 border-r border-white/[0.05]">
      {/* Red top rail */}
      <div className="h-0.5 w-full bg-[#b33a4b] flex-shrink-0" />

      {/* Logo */}
      <div className="px-4 py-4 flex-shrink-0 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#b33a4b]/10 border border-[#b33a4b]/20 rounded-[7px] flex items-center justify-center flex-shrink-0">
            <Shield size={13} className="text-[#b33a4b]" />
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold leading-tight">Clear Build</p>
            <p className="text-[10px] font-semibold text-[#b33a4b]/80 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-3">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 py-1.5">
              {group.section}
            </p>
            {group.items.map(item => {
              const active = isActive(item.href);
              const badge = getBadge(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] mb-0.5 transition-all text-[13px] group
                    ${active
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                    }`}
                >
                  <item.icon size={14} className={`flex-shrink-0 ${active ? "text-[#b33a4b]" : "group-hover:text-white/60"}`} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {badge !== null && (
                    <span className="min-w-[18px] h-[18px] bg-white/10 text-white/60 text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {badge > 999 ? "999+" : badge}
                    </span>
                  )}
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-[#b33a4b] flex-shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System status */}
      <div className="px-4 py-2.5 border-t border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/30">Systems operational</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#b33a4b]/20 flex items-center justify-center text-[#b33a4b] text-[11px] font-bold flex-shrink-0">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white font-medium truncate">{admin.name}</p>
            <p className="text-[10px] text-white/30 truncate">{admin.role.replace(/_/g, " ")}</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            title="Logout"
            className="w-6 h-6 flex items-center justify-center rounded-[6px] text-white/25 hover:text-[#e06070] hover:bg-[#b33a4b]/10 transition-colors flex-shrink-0">
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
