"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "true";
  const verified = params.get("verified") === "true";
  const next = params.get("next") ?? "";

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = "Required";
    if (!form.password) errs.password = "Required";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setLoading(true); setErr({}); setUnverified(false);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.unverified) { setUnverified(true); return; }
      setErr({ general: data.message || "Login failed" });
    } else {
      router.push(next || data.redirect || "/dashboard");
    }
  };

  const resend = async () => {
    setResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    setResending(false); setResent(true);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-card shadow-card w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Clear Build USA" width={160} height={45} className="object-contain" priority />
        </div>

        <h2 className="text-xl font-bold text-[#111827] mb-1" style={{ letterSpacing: "-0.02em" }}>Sign in</h2>
        <p className="text-sm text-[#9CA3AF] mb-6">Welcome back — sign in to your account.</p>

        {registered && (
          <div className="mb-4 p-3.5 bg-brand-green-light border border-brand-green/20 rounded-xl text-brand-green text-sm">
            Account created! Check your email to verify your account.
          </div>
        )}
        {verified && (
          <div className="mb-4 p-3.5 bg-brand-green-light border border-brand-green/20 rounded-xl text-brand-green text-sm">
            Email verified! You can now sign in.
          </div>
        )}
        {err.general && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {err.general}
          </div>
        )}
        {unverified && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-sm">
            <p className="text-amber-800 font-medium mb-2">Your email is not verified.</p>
            {resent
              ? <p className="text-brand-green text-xs">Verification email sent! Check your inbox.</p>
              : <button onClick={resend} disabled={resending} className="btn btn-outline btn-sm">
                  {resending ? "Sending…" : "Resend Verification Email"}
                </button>
            }
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" className="field" />
            {err.email && <p className="mt-1 text-xs text-red-500">{err.email}</p>}
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="label mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs text-brand-navy hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                placeholder="••••••••" className="field pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {err.password && <p className="mt-1 text-xs text-red-500">{err.password}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-navy font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
