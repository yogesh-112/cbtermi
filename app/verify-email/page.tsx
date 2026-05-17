"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, Mail } from "lucide-react";

function AuthHero() {
  return (
    <div className="hidden lg:flex auth-hero">
      <div className="auth-hero-grid" />
      <div className="auth-hero-glow" />
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BD89A]">Almost there</div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight mt-3 max-w-md text-white">One last click to confirm it&apos;s really you.</h2>
        <p className="text-white/75 text-[15px] mt-3 max-w-md leading-relaxed">We verify your email so customers know quotes and invoices are coming from a real, trusted business.</p>
      </div>
    </div>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.ok ? setStatus("success") : setStatus("error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — content */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-10">
        <div className="w-full max-w-[440px]">
          <div className="flex items-center gap-2.5 mb-10">
            <Image src="/logo.png" alt="Clear Build USA" width={32} height={32} className="object-contain" priority />
            <div className="flex items-baseline gap-1 text-[18px] font-semibold">
              <span style={{ color: "#16265a" }}>Clear</span>
              <span style={{ color: "#2453E4" }}>Build</span>
            </div>
          </div>

          {status === "loading" && (
            <>
              <div className="w-[88px] h-[88px] rounded-3xl bg-brand-blue-50 flex items-center justify-center text-brand-blue mb-7">
                <Mail size={42} strokeWidth={1.4} />
              </div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">Check your inbox.</h1>
              <p className="text-[14.5px] text-[#4a5168] mt-3 leading-relaxed">
                We sent a verification link to your email address. Click it to confirm your address and continue setting up your business.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-surface border border-[#e7e6e1] flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-brand-amber-50 text-brand-amber flex items-center justify-center text-[13px] font-bold flex-shrink-0">!</span>
                <p className="text-[12.5px] text-[#4a5168] leading-relaxed">Can&apos;t find it? Check spam, or wait up to 2 minutes. Your verification link is valid for 24 hours.</p>
              </div>
              <p className="text-[13px] text-[#4a5168] mt-8">
                Wrong email? <a href="/register" className="text-brand-blue font-medium hover:underline">Start over</a>{" · "}
                <a href="/login" className="text-brand-blue font-medium hover:underline">Sign in</a>
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle size={56} className="text-brand-green mb-6" strokeWidth={1.5} />
              <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">Email verified!</h1>
              <p className="text-[14.5px] text-[#4a5168] mt-3 leading-relaxed">Your email has been confirmed. You can now sign in and start setting up your business.</p>
              <button onClick={() => router.push("/login?verified=true")} className="btn btn-primary btn-lg w-full mt-8">
                Continue to sign in
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={56} className="text-brand-rose mb-6" strokeWidth={1.5} />
              <h1 className="text-[28px] font-semibold tracking-tight text-[#0c1226]">Verification failed.</h1>
              <p className="text-[14.5px] text-[#4a5168] mt-3 leading-relaxed">The link is invalid or has expired. Please request a new verification email from the sign in page.</p>
              <button onClick={() => router.push("/login")} className="btn btn-primary btn-lg w-full mt-8">
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right — hero */}
      <AuthHero />
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
