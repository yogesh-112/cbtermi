"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Plus, LogOut, Bell, Menu, X } from "lucide-react";

interface Props {
  user: { name: string; email: string };
  businesses: Array<{ id: string; name: string }>;
  currentBusiness: { id: string; name: string } | null;
}

export default function MobileHeader({ user, businesses, currentBusiness }: Props) {
  const router = useRouter();
  const [bizOpen, setBizOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

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

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#E5E7EB] h-14 flex items-center px-4 gap-3">
      {/* Logo */}
      <div className="flex-1">
        <Image src="/logo.png" alt="Clear Build USA" width={100} height={28} className="object-contain" priority />
      </div>

      {/* Business switcher */}
      <div className="relative">
        <button onClick={() => { setBizOpen(!bizOpen); setUserOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F4F6] text-[#374151] text-xs font-medium max-w-[140px]">
          <span className="truncate">{currentBusiness?.name ?? "Business"}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>
        {bizOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-dropdown z-20 overflow-hidden animate-scale-in">
            <div className="py-1">
              {businesses.map((b) => (
                <button key={b.id} onClick={() => switchBusiness(b.id)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors
                    ${b.id === currentBusiness?.id ? "text-brand-navy font-semibold bg-brand-navy-light" : "text-[#374151] hover:bg-[#F9FAFB]"}`}>
                  {b.name}
                </button>
              ))}
            </div>
            <div className="border-t border-[#E5E7EB] py-1">
              <Link href="/business-setup" onClick={() => setBizOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-brand-green hover:bg-brand-green-light font-medium">
                <Plus size={13} /> New Business
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <div className="relative">
        <button onClick={() => { setUserOpen(!userOpen); setBizOpen(false); }}
          className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
        </button>
        {userOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-dropdown z-20 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-sm font-semibold text-[#111827] truncate">{user.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user.email}</p>
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Close dropdowns on overlay */}
      {(bizOpen || userOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setBizOpen(false); setUserOpen(false); }} />
      )}
    </header>
  );
}
