"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, CheckCircle, XCircle } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-md p-8 text-center">
        <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center mx-auto mb-6">
          <Building2 size={18} className="text-white" />
        </div>
        {status === "loading" && <><p className="text-slate-600">Verifying your email…</p></>}
        {status === "success" && (
          <>
            <CheckCircle size={40} className="text-brand-green mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h2>
            <p className="text-slate-500 mb-6">Your email has been verified. You can now sign in.</p>
            <button onClick={() => router.push("/login?verified=true")} className="btn-primary btn btn-lg w-full">Go to Login</button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h2>
            <p className="text-slate-500 mb-6">The link is invalid or has expired. Please request a new verification email.</p>
            <button onClick={() => router.push("/login")} className="btn-primary btn btn-lg w-full">Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
