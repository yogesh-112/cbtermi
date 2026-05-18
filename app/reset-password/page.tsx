"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useT } from "@/lib/i18n";

function AuthHero({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <div className="hidden lg:flex auth-hero">
      <div className="auth-hero-grid" />
      <div className="auth-hero-glow" />
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BD89A]">{badge}</div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight mt-3 max-w-md text-white">{title}</h2>
        <p className="text-white/75 text-[15px] mt-3 max-w-md leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

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
  const strengthLabels = ["", t.auth.errors.weak, t.auth.errors.fair, t.auth.errors.strong, t.auth.errors.veryStrong];
  const strengthLabel = strengthLabels[strength];
  const strengthColor = ["", "#b53a4b", "#b6750a", "#2f8a4a", "#2f8a4a"][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setErr(t.auth.errors.minPassword); return; }
    if (form.password !== form.confirm) { setErr(t.auth.resetPassword.passwordsNoMatch); return; }
    setLoading(true); setErr("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.password }),
    });
    setLoading(false);
    if (res.ok) router.push("/login");
    else setErr(t.auth.resetPassword.invalidLink);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center justify-between">
            <Image src="/logo.png" alt="Clear Build USA" width={140} height={38} className="object-contain object-left" priority />
            <LanguageSwitcher variant="auth" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-brand-blue-50 flex items-center justify-center text-brand-blue mb-6">
            <Lock size={26} />
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">{t.auth.resetPassword.title}</h1>
          <p className="text-[14px] text-[#4a5168] mt-2">{t.auth.resetPassword.subtitle}</p>

          {err && (
            <div className="mt-5 p-3.5 bg-brand-rose-50 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label">{t.auth.resetPassword.newPassword}</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t.auth.resetPassword.minChars} className="field pr-10" />
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
            </div>
            <div>
              <label className="label">{t.auth.resetPassword.confirmPassword}</label>
              <input type="password" required value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••" className="field" />
            </div>

            {/* Requirements checklist */}
            <div className="p-3 bg-surface rounded-xl border border-[#e7e6e1] space-y-2 text-[12.5px] text-[#4a5168]">
              {([
                [t.auth.resetPassword.checks.minChars, form.password.length >= 8],
                [t.auth.resetPassword.checks.mixedCase, /[A-Z]/.test(form.password) && /[a-z]/.test(form.password)],
                [t.auth.resetPassword.checks.number, /[0-9]/.test(form.password)],
              ] as [string, boolean][]).map(([label, met], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: met ? "#2f8a4a" : "#e7e6e1" }}>
                    {met && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {label}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? t.auth.resetPassword.saving : t.auth.resetPassword.updatePassword}
            </button>
          </form>
        </div>
      </div>

      {/* Right — hero */}
      <AuthHero
        badge={t.auth.resetPassword.badge}
        title={t.auth.resetPassword.heroTitle}
        body={t.auth.resetPassword.heroBody}
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
