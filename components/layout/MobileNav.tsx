"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Receipt, MoreHorizontal } from "lucide-react";
import { useT } from "@/lib/i18n";

const MORE_PATHS = [
  "/quotes", "/payments", "/notifications", "/communications",
  "/item-requirements", "/project-updates", "/feedback",
  "/team", "/settings", "/change-orders", "/more",
  "/scheduling", "/templates", "/help",
];

export default function MobileNav() {
  const pathname = usePathname();
  const t = useT();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isMoreActive = MORE_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));

  const PRIMARY = [
    { href: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { href: "/contacts",  icon: Users,           label: t.nav.contacts },
    { href: "/projects",  icon: Briefcase,       label: t.nav.projects },
    { href: "/invoices",  icon: Receipt,         label: t.nav.invoices },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e7e6e1]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-stretch h-16">
        {PRIMARY.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                ${active ? "text-brand-navy" : "text-[#8a8fa3]"}`}>
              <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-[#eef2ff]" : ""}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}

        <Link href="/more"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
            ${isMoreActive ? "text-brand-navy" : "text-[#8a8fa3]"}`}>
          <div className={`p-1.5 rounded-lg transition-all ${isMoreActive ? "bg-[#eef2ff]" : ""}`}>
            <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-medium leading-none">{t.nav.more}</span>
        </Link>
      </div>
    </nav>
  );
}
