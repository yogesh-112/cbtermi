"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, Receipt, MoreHorizontal,
  FileText, CreditCard, Bell, Star, MessageSquare, MessagesSquare,
  ClipboardList, UserCog, Settings, X, ChevronRight,
} from "lucide-react";

const PRIMARY = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/contacts",  icon: Users,           label: "Contacts" },
  { href: "/projects",  icon: Briefcase,       label: "Projects" },
  { href: "/invoices",  icon: Receipt,         label: "Invoices" },
];

const MORE_ITEMS = [
  { href: "/quotes",            icon: FileText,       label: "Quotes" },
  { href: "/payments",          icon: CreditCard,     label: "Payments" },
  { href: "/notifications",     icon: Bell,           label: "Notifications" },
  { href: "/communications",    icon: MessagesSquare, label: "Communications" },
  { href: "/item-requirements", icon: ClipboardList,  label: "Item Requirements" },
  { href: "/project-updates",   icon: MessageSquare,  label: "Project Updates" },
  { href: "/feedback",          icon: Star,           label: "Feedback" },
  { href: "/team",              icon: UserCog,        label: "Team" },
  { href: "/settings",          icon: Settings,       label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isMoreActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-stretch h-16">
          {PRIMARY.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors
                  ${active ? "text-brand-navy" : "text-[#9CA3AF]"}`}>
                <div className={`p-1 rounded-lg transition-all ${active ? "bg-brand-navy-light" : ""}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-brand-navy" : "text-[#9CA3AF]"}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More */}
          <button onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors
              ${isMoreActive ? "text-brand-navy" : "text-[#9CA3AF]"}`}>
            <div className={`p-1 rounded-lg transition-all ${isMoreActive ? "bg-brand-navy-light" : ""}`}>
              <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isMoreActive ? "text-brand-navy" : "text-[#9CA3AF]"}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-modal animate-slide-in-bottom"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="text-base font-bold text-[#111827]" style={{ letterSpacing: "-0.02em" }}>
                More
              </h2>
              <button onClick={() => setMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
                <X size={16} />
              </button>
            </div>

            <div className="px-4 pb-4 grid grid-cols-1 gap-1">
              {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all
                      ${active ? "bg-brand-navy-light text-brand-navy" : "text-[#374151] hover:bg-[#F9FAFB]"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${active ? "bg-brand-navy text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                      <Icon size={17} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${active ? "text-brand-navy font-semibold" : ""}`}>
                      {label}
                    </span>
                    <ChevronRight size={14} className="text-[#D1D5DB]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
