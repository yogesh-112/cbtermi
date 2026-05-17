"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, Receipt, Briefcase, CreditCard,
  ClipboardList, MessageSquare, Star, Bell, MessagesSquare, UserCog,
  Settings, ChevronDown, Plus, LogOut, X,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contacts",          icon: Users,           label: "Contacts" },
  { href: "/projects",          icon: Briefcase,       label: "Projects" },
  { href: "/quotes",            icon: FileText,        label: "Quotes" },
  { href: "/invoices",          icon: Receipt,         label: "Invoices" },
  { href: "/payments",          icon: CreditCard,      label: "Payments" },
];

const SECONDARY_NAV = [
  { href: "/notifications",     icon: Bell,            label: "Notifications" },
  { href: "/communications",    icon: MessagesSquare,  label: "Communications" },
  { href: "/item-requirements", icon: ClipboardList,   label: "Item Requirements" },
  { href: "/project-updates",   icon: MessageSquare,   label: "Project Updates" },
  { href: "/feedback",          icon: Star,            label: "Feedback" },
  { href: "/team",              icon: UserCog,         label: "Team" },
  { href: "/settings",          icon: Settings,        label: "Settings" },
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href} onClick={() => setMobileOpen(false)}
      className={`sidebar-link ${isActive(href) ? "active" : ""}`}>
      <Icon size={16} className="flex-shrink-0 opacity-75" />
      <span className="truncate">{label}</span>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Clear Build USA"
            width={28}
            height={28}
            className="object-contain rounded"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-white text-[14px] font-semibold tracking-tight">Clear Build</span>
            <span className="text-white/50 text-[11px]">USA</span>
          </div>
        </div>
      </div>

      {/* Business Switcher */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="relative">
          <button onClick={() => setBizOpen(!bizOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] bg-white/[0.08] hover:bg-white/[0.12] transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold">
                  {currentBusiness?.name?.[0]?.toUpperCase() ?? "B"}
                </span>
              </div>
              <span className="text-white text-[13px] font-medium truncate leading-tight">
                {currentBusiness?.name ?? "Select Business"}
              </span>
            </div>
            <ChevronDown size={12} className={`text-white/40 transition-transform flex-shrink-0 ${bizOpen ? "rotate-180" : ""}`} />
          </button>
          {bizOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-dropdown z-20 overflow-hidden border border-[#e7e6e1] animate-scale-in">
              <div className="py-1">
                {businesses.map((b) => (
                  <button key={b.id} onClick={() => switchBusiness(b.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors
                      ${b.id === currentBusiness?.id ? "text-brand-navy font-semibold bg-brand-blue-50" : "text-[#4a5168] hover:bg-surface"}`}>
                    <div className="w-5 h-5 bg-brand-navy/10 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-navy text-[9px] font-bold">{b.name[0]?.toUpperCase()}</span>
                    </div>
                    {b.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#e7e6e1] py-1">
                <Link href="/business-setup" onClick={() => setBizOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-green hover:bg-brand-green-light transition-colors font-medium">
                  <Plus size={14} /> New Business
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {PRIMARY_NAV.map((item) => <NavLink key={item.href} {...item} />)}
        <div className="sidebar-section">More</div>
        {SECONDARY_NAV.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Trial badge */}
      <div className="mx-3 mb-3 p-3 rounded-[10px] bg-white/[0.06]">
        <div className="text-white text-[12.5px] font-semibold">Trial · explore free</div>
        <div className="text-white/55 text-[11.5px] mt-0.5">Pro plan from $39/mo</div>
        <Link href="/subscription"
          className="mt-2.5 block text-center text-[12px] font-medium py-1.5 rounded-[7px] bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors">
          Upgrade plan
        </Link>
      </div>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-white/[0.08] pt-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-white/[0.06] transition-colors group cursor-pointer">
          <div className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12.5px] font-semibold truncate leading-tight">{user.name}</p>
            <p className="text-white/45 text-[11px] truncate">{user.email}</p>
          </div>
          <button onClick={logout} title="Sign out"
            className="text-white/35 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
            <LogOut size={14} />
          </button>
        </div>
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
