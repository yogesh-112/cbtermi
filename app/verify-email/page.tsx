"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg w-full max-w-md p-8 text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Image src="/logo.png" alt="Clear Build USA" width={40} height={40} className="rounded-lg object-cover" />
          <div className="text-left">
            <h1 className="text-lg font-bold text-[#1F2937] leading-tight">Clear Build USA</h1>
            <p className="text-xs text-[#6B7280]">Email Verification</p>
          </div>
        </div>
        {status === "loading" && <p className="text-[#6B7280]">Verifying your email…</p>}
        {status === "success" && (
          <>
            <CheckCircle size={40} className="text-brand-green mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#1F2937] mb-2">Email verified!</h2>
            <p className="text-[#6B7280] mb-6">Your email has been verified. You can now sign in.</p>
            <button onClick={() => router.push("/login?verified=true")} className="btn btn-primary w-full py-2.5">Go to Login</button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#1F2937] mb-2">Verification failed</h2>
            <p className="text-[#6B7280] mb-6">The link is invalid or has expired. Please request a new verification email.</p>
            <button onClick={() => router.push("/login")} className="btn btn-primary w-full py-2.5">Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
