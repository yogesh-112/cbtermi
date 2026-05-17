"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Login failed"); return; }
      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(179,58,75,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(179,58,75,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-[400px]">
        {/* Red top rail */}
        <div className="h-0.5 w-full bg-[#b33a4b] rounded-t-sm mb-0" />

        <div className="bg-[#0d1117] border border-white/[0.08] rounded-b-[16px] p-8">
          {/* Logo + badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#b33a4b]/10 border border-[#b33a4b]/20 mb-4">
              <Shield size={22} className="text-[#b33a4b]" />
            </div>
            <h1 className="text-white text-xl font-semibold tracking-tight mb-1">
              Clear Build USA
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#b33a4b]/10 border border-[#b33a4b]/25 rounded-full text-[#e06070] text-[11px] font-semibold tracking-widest uppercase">
              Admin Access
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] rounded-[8px] px-3 py-2.5 mb-5">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-white/50 mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@clearbuildusa.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#b33a4b]/50 focus:ring-1 focus:ring-[#b33a4b]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/50 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-[10px] px-3.5 py-2.5 pr-10 text-[14px] outline-none focus:border-[#b33a4b]/50 focus:ring-1 focus:ring-[#b33a4b]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#b33a4b] hover:bg-[#c4414e] active:scale-[0.99] text-white font-semibold rounded-[10px] py-2.5 text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? "Authenticating…" : "Sign in to Admin"}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/20 mt-6">
            Restricted access — authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
