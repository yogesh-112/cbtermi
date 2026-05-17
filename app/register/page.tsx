"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function AuthHero({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <div className="hidden lg:flex auth-hero">
      <div className="auth-hero-grid" />
      <div className="auth-hero-glow" />
      <div className="absolute top-20 right-12 w-72 p-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="text-[11px] text-white/70 uppercase tracking-widest">Quote approved · 2:14 pm</div>
        <div className="text-2xl font-semibold mt-1 tabular-nums">Q-1042 · $9,200</div>
        <div className="text-sm text-white/75 mt-0.5">Vega Deck Build</div>
      </div>
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BD89A]">{badge}</div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight mt-3 max-w-md text-white">{title}</h2>
        <p className="text-white/75 text-[15px] mt-3 max-w-md leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", business_name: "", email: "", password: "", agree: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const pwdStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    return s;
  };
  const strength = pwdStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Strong", "Very strong"][strength];
  const strengthColor = ["", "#b53a4b", "#b6750a", "#2f8a4a", "#2f8a4a"][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.email) errs.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    if (!form.agree) errs.agree = "You must agree to continue";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setLoading(true); setErr({});
    const name = [form.first_name, form.last_name].filter(Boolean).join(" ");
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setErr({ general: data.message || "Registration failed" });
    else router.push("/login?registered=true");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-10">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5 mb-8">
            <Image src="/logo.png" alt="Clear Build USA" width={32} height={32} className="object-contain" priority />
            <div className="flex items-baseline gap-1 text-[18px] font-semibold">
              <span style={{ color: "#16265a" }}>Clear</span>
              <span style={{ color: "#2453E4" }}>Build</span>
            </div>
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">Start your free trial.</h1>
          <p className="text-[14px] text-[#4a5168] mt-2">14 days free. No card required.</p>

          {err.general && (
            <div className="mt-5 p-3.5 bg-brand-rose-50 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
              {err.general}
            </div>
          )}

          {/* Google SSO */}
          <button type="button" disabled
            className="mt-6 w-full flex items-center justify-center gap-2.5 h-[42px] border border-[#e7e6e1] rounded-lg text-[14px] text-[#4a5168] font-medium hover:bg-[#f6f6f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg width="17" height="17" viewBox="0 0 48 48" fill="none">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="flex-1 h-px bg-[#e7e6e1]" />
            <span className="text-[12px] text-[#8a8fa3]">or sign up with email</span>
            <div className="flex-1 h-px bg-[#e7e6e1]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input type="text" value={form.first_name} onChange={set("first_name")}
                  placeholder="Marcus" className="field" />
                {err.first_name && <p className="mt-1 text-xs text-brand-rose">{err.first_name}</p>}
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" value={form.last_name} onChange={set("last_name")}
                  placeholder="Kane" className="field" />
              </div>
            </div>
            <div>
              <label className="label">Business name</label>
              <input type="text" value={form.business_name} onChange={set("business_name")}
                placeholder="Riverbend Remodel" className="field" />
            </div>
            <div>
              <label className="label">Work email</label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="marcus@riverbendremodel.com" className="field" />
              {err.email && <p className="mt-1 text-xs text-brand-rose">{err.email}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="••••••••" className="field pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] hover:text-[#4a5168]">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <span key={i} className="flex-1 h-0.5 rounded-full transition-colors duration-200"
                        style={{ background: i <= strength ? strengthColor : "#e7e6e1" }} />
                    ))}
                  </div>
                  {strengthLabel && <p className="text-[11.5px] mt-1 font-medium" style={{ color: strengthColor }}>
                    Strong · 12+ characters, mixed case, number
                  </p>}
                </div>
              )}
              {err.password && <p className="mt-1 text-xs text-brand-rose">{err.password}</p>}
            </div>
            <div className="flex items-start gap-2">
              <input id="agree" type="checkbox" checked={form.agree}
                onChange={e => setForm(f => ({ ...f, agree: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded border-[#e7e6e1] text-brand-navy focus:ring-brand-navy/20 flex-shrink-0" />
              <label htmlFor="agree" className="text-[13px] text-[#4a5168] cursor-pointer leading-snug">
                I agree to the{" "}
                <button type="button" className="text-brand-blue font-medium hover:underline">Terms</button>
                {" "}and{" "}
                <button type="button" className="text-brand-blue font-medium hover:underline">Privacy Policy</button>
              </label>
            </div>
            {err.agree && <p className="text-xs text-brand-rose">{err.agree}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4a5168] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-blue font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right — hero */}
      <AuthHero
        badge="14-day free trial"
        title="The clean way to run a remodel business."
        body="Quotes, projects, invoices and customer chat — one calm workspace from the truck to the books."
      />
    </div>
  );
}
