"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false); setSent(true);
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

          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-[#4a5168] font-medium hover:text-[#0c1226] transition-colors mb-8">
            <ArrowLeft size={14} /> {t.auth.forgotPassword.backToLogin}
          </Link>

          {sent ? (
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand-green-light flex items-center justify-center mb-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2f8a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">{t.auth.forgotPassword.checkEmail}</h1>
              <p className="text-[14px] text-[#4a5168] mt-2 leading-relaxed">
                {t.auth.forgotPassword.emailSentMsg} <span className="text-[#0c1226] font-medium">{email}</span>, {t.auth.forgotPassword.emailSentMsg2}
              </p>
              <Link href="/login" className="btn btn-primary btn-lg w-full mt-8">{t.auth.forgotPassword.backToLogin}</Link>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">{t.auth.forgotPassword.title}</h1>
              <p className="text-[14px] text-[#4a5168] mt-2 leading-relaxed">{t.auth.forgotPassword.subtitle}</p>

              <form onSubmit={submit} className="mt-7 space-y-4">
                <div>
                  <label className="label">{t.auth.workEmail}</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className="field" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                  {loading ? t.common.sending : t.auth.forgotPassword.sendResetLink}
                </button>
              </form>

              <div className="mt-6 p-3.5 bg-surface rounded-xl border border-[#e7e6e1] text-[12.5px] text-[#4a5168]">
                {t.auth.forgotPassword.troubleAccess}{" "}
                <a href="mailto:support@clearbuildusa.com" className="text-brand-blue font-medium">{t.auth.forgotPassword.contactSupport}</a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right — hero */}
      <AuthHero
        badge={t.auth.forgotPassword.badge}
        title={t.auth.forgotPassword.heroTitle}
        body={t.auth.forgotPassword.heroBody}
      />
    </div>
  );
}
