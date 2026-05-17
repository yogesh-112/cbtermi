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
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#e7e6e1] h-14 flex items-center px-4 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-1">
        <Image src="/logo.png" alt="Clear Build USA" width={24} height={24} className="object-contain rounded" priority />
        <div className="flex flex-col leading-tight">
          <span className="text-[#0c1226] text-[13px] font-semibold tracking-tight">Clear Build</span>
          <span className="text-[#8a8fa3] text-[10px]">USA</span>
        </div>
      </div>

      {/* Business switcher */}
      <div className="relative">
        <button onClick={() => { setBizOpen(!bizOpen); setUserOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0efea] text-[#4a5168] text-xs font-medium max-w-[140px]">
          <span className="truncate">{currentBusiness?.name ?? "Business"}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>
        {bizOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 overflow-hidden animate-scale-in">
            <div className="py-1">
              {businesses.map((b) => (
                <button key={b.id} onClick={() => switchBusiness(b.id)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors
                    ${b.id === currentBusiness?.id ? "text-brand-navy font-semibold bg-brand-blue-50" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                  {b.name}
                </button>
              ))}
            </div>
            <div className="border-t border-[#e7e6e1] py-1">
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
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-[#e7e6e1]">
              <p className="text-sm font-semibold text-[#0c1226] truncate">{user.name}</p>
              <p className="text-xs text-[#8a8fa3] truncate">{user.email}</p>
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
