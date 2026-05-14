"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase, CreditCard,
  ClipboardList, MessageSquare, Star, Bell, MessagesSquare, UserCog,
  CreditCard as SubIcon, Settings, ChevronDown, Building2, Plus,
  LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contacts",            icon: Users,           label: "Contacts" },
  { href: "/quotes",              icon: FileText,        label: "Quotes" },
  { href: "/invoices",            icon: Receipt,         label: "Invoices" },
  { href: "/projects",            icon: Briefcase,       label: "Projects" },
  { href: "/payments",            icon: CreditCard,      label: "Payments" },
  { href: "/item-requirements",   icon: ClipboardList,   label: "Item Requirements" },
  { href: "/project-updates",     icon: MessageSquare,   label: "Project Updates" },
  { href: "/feedback",            icon: Star,            label: "Feedback" },
  { href: "/notifications",       icon: Bell,            label: "Notifications" },
  { href: "/communications",      icon: MessagesSquare,  label: "Communications" },
  { href: "/team",                icon: UserCog,         label: "Team" },
  { href: "/subscription",        icon: SubIcon,         label: "Subscription" },
  { href: "/settings",            icon: Settings,        label: "Settings" },
];

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function Sidebar({ user, businesses, currentBusiness }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [bizOpen, setBizOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const switchBusiness = async (id: string) => {
    await fetch("/api/businesses/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) });
    router.refresh();
    setBizOpen(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Clear Build</p>
            <p className="text-blue-200 text-xs">USA</p>
          </div>
        </div>
      </div>

      {/* Business Switcher */}
      <div className="px-3 py-3 border-b border-white/10">
        <button
          onClick={() => setBizOpen(!bizOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={14} className="text-blue-200 flex-shrink-0" />
            <span className="text-white text-sm font-medium truncate">
              {currentBusiness?.name ?? "Select Business"}
            </span>
          </div>
          <ChevronDown size={14} className={`text-blue-200 transition-transform flex-shrink-0 ${bizOpen ? "rotate-180" : ""}`} />
        </button>
        {bizOpen && (
          <div className="mt-1 bg-white rounded-md shadow-lg z-10 overflow-hidden">
            {businesses.map((b) => (
              <button key={b.id} onClick={() => switchBusiness(b.id)}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${b.id === currentBusiness?.id ? "text-brand-navy font-semibold" : "text-slate-700"}`}>
                {b.name}
              </button>
            ))}
            <div className="border-t border-slate-100">
              <Link href="/business-setup" onClick={() => setBizOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand-green hover:bg-slate-50 transition-colors">
                <Plus size={14} /> New Business
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${active ? "active" : ""}`}>
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-blue-200 text-xs truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="text-blue-200 hover:text-white transition-colors" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-brand-navy text-white p-2 rounded-md">
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-brand-navy">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-blue-200 hover:text-white">
              <X size={18} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-brand-navy flex-shrink-0 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
