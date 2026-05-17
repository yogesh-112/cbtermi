"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function AuthHero({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <div className="hidden lg:flex auth-hero">
      <div className="auth-hero-grid" />
      <div className="auth-hero-glow" />
      {/* Floating card */}
      <div className="absolute top-20 right-12 w-72 p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="text-[11px] text-white/70 uppercase tracking-widest">Invoice paid · 11:42 am</div>
        <div className="text-2xl font-semibold mt-1 tabular-nums">+ $4,820.00</div>
        <div className="text-sm text-white/75 mt-0.5">Hartwell · Kitchen Remodel</div>
      </div>
      <div className="absolute top-56 right-52 w-56 p-3.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#7BD89A] flex items-center justify-center text-[#0c1226] text-xs font-bold flex-shrink-0">SH</div>
          <div>
            <div className="text-[13px] font-semibold">Sara Hartwell</div>
            <div className="text-[11px] text-white/70">approved Quote Q-1042</div>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BD89A]">{badge}</div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight mt-3 max-w-md text-white">{title}</h2>
        <p className="text-white/75 text-[15px] mt-3 max-w-md leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "true";
  const verified = params.get("verified") === "true";
  const next = params.get("next") ?? "";

  const [form, setForm] = useState({ email: "", password: "", remember: true });
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
    <div className="min-h-screen bg-white flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-10">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2.5 mb-8">
            <Image src="/logo.png" alt="Clear Build USA" width={32} height={32} className="object-contain" priority />
            <div className="flex items-baseline gap-1 text-[18px] font-semibold">
              <span style={{ color: "#16265a" }}>Clear</span>
              <span style={{ color: "#2453E4" }}>Build</span>
            </div>
          </div>

          <h1 className="text-[30px] font-semibold tracking-tight text-[#0c1226]">Welcome back.</h1>
          <p className="text-[14px] text-[#4a5168] mt-2">Sign in to your business workspace.</p>

          {registered && (
            <div className="mt-5 p-3.5 bg-brand-green-light border border-brand-green/20 rounded-xl text-brand-green text-sm">
              Account created! Check your email to verify before signing in.
            </div>
          )}
          {verified && (
            <div className="mt-5 p-3.5 bg-brand-green-light border border-brand-green/20 rounded-xl text-brand-green text-sm">
              Email verified! You can now sign in.
            </div>
          )}
          {err.general && (
            <div className="mt-5 p-3.5 bg-brand-rose-50 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
              {err.general}
            </div>
          )}
          {unverified && (
            <div className="mt-5 p-3.5 bg-brand-amber-50 border border-brand-amber/20 rounded-xl text-sm">
              <p className="text-brand-amber font-medium mb-2">Your email is not verified.</p>
              {resent
                ? <p className="text-brand-green text-xs">Verification email sent! Check your inbox.</p>
                : <button onClick={resend} disabled={resending} className="btn btn-outline btn-sm">
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
              }
            </div>
          )}

          {/* Google SSO */}
          <button type="button" disabled
            className="mt-7 w-full flex items-center justify-center gap-2.5 h-[42px] border border-[#e7e6e1] rounded-lg text-[14px] text-[#4a5168] font-medium hover:bg-[#f6f6f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg width="17" height="17" viewBox="0 0 48 48" fill="none">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="flex-1 h-px bg-[#e7e6e1]" />
            <span className="text-[12px] text-[#8a8fa3]">or</span>
            <div className="flex-1 h-px bg-[#e7e6e1]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="you@example.com" className="field" />
              {err.email && <p className="mt-1 text-xs text-brand-rose">{err.email}</p>}
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-blue font-medium hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="••••••••" className="field pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] hover:text-[#4a5168]">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {err.password && <p className="mt-1 text-xs text-brand-rose">{err.password}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input id="remember" type="checkbox" checked={form.remember}
                onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                className="w-4 h-4 rounded border-[#e7e6e1] text-brand-navy focus:ring-brand-navy/20" />
              <label htmlFor="remember" className="text-[13px] text-[#4a5168] cursor-pointer">
                Keep me signed in on this device
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4a5168] mt-6">
            New to Clear Build?{" "}
            <Link href="/register" className="text-brand-blue font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      {/* Right — hero */}
      <AuthHero
        badge="Built for the trades"
        title="Get paid on time. Keep every job clear."
        body="Quotes, change orders, invoices, and customer chat — one calm workspace from the truck to the books."
      />
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
