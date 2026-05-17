"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

export default function ImpersonationBanner({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  async function exitImpersonation() {
    setExiting(true);
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    router.push("/admin/users");
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white flex items-center justify-between px-4 py-2 text-[13px] font-medium shadow-lg">
      <div className="flex items-center gap-2">
        <ShieldAlert size={15} />
        <span>Admin impersonation session — viewing as this user</span>
        <span className="opacity-60 text-[11px] font-mono">(adminId: {adminId.slice(0, 8)}…)</span>
      </div>
      <button
        onClick={exitImpersonation}
        disabled={exiting}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-[6px] text-[12px] transition-colors"
      >
        <X size={12} />
        {exiting ? "Exiting…" : "Exit Impersonation"}
      </button>
    </div>
  );
}
