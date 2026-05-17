"use client";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  "/admin/dashboard":    "Dashboard",
  "/admin/businesses":   "Businesses",
  "/admin/users":        "Users",
  "/admin/subscriptions":"Subscriptions",
  "/admin/payments":     "Payments",
  "/admin/plans":        "Plans",
  "/admin/audit-logs":   "Audit Logs",
  "/admin/admins":       "Admins",
  "/admin/settings":     "Settings",
};

export default function AdminTopbar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const base = "/" + pathname.split("/").slice(1, 3).join("/");
  const pageLabel = PAGE_LABELS[base] ?? "Admin";

  return (
    <header className="fixed top-0 left-[220px] right-0 h-[52px] bg-white border-b border-[#e8e9ed] z-30 flex items-center px-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#9399a8]">
        <span className="text-[#b33a4b] font-semibold tracking-widest uppercase text-[10px]">ADMIN</span>
        <span className="text-[#c8cad2]">/</span>
        <span className="text-[#1a2030] font-semibold text-[13px]">{pageLabel}</span>
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-[8px] text-[#9399a8] hover:text-[#1a2030] hover:bg-[#f0f1f5] transition-colors">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-[#e8e9ed]">
          <div className="w-7 h-7 rounded-full bg-[#b33a4b]/10 flex items-center justify-center text-[#b33a4b] text-[11px] font-bold">
            {adminName?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <span className="text-[13px] font-medium text-[#1a2030] hidden sm:block">{adminName}</span>
        </div>
      </div>
    </header>
  );
}
