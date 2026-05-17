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
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", language: "en" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email) errs.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setLoading(true); setErr({});
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, language: form.language }),
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

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" value={form.name} onChange={set("name")}
                placeholder="John Doe" className="field" />
              {err.name && <p className="mt-1 text-xs text-brand-rose">{err.name}</p>}
            </div>
            <div>
              <label className="label">Work email</label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="you@yourbusiness.com" className="field" />
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
                  {strengthLabel && <p className="text-[11.5px] mt-1 font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>}
                </div>
              )}
              {err.password && <p className="mt-1 text-xs text-brand-rose">{err.password}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" value={form.confirm} onChange={set("confirm")}
                placeholder="••••••••" className="field" />
              {err.confirm && <p className="mt-1 text-xs text-brand-rose">{err.confirm}</p>}
            </div>
            <div>
              <label className="label">Preferred language</label>
              <select value={form.language} onChange={set("language")} className="field">
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-1">
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
