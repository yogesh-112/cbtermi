"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false); setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div><h1 className="text-lg font-bold text-slate-900">Reset password</h1>
          <p className="text-xs text-slate-500">Clear Build USA</p></div>
        </div>
        {sent ? (
          <div className="text-center">
            <p className="text-slate-700 mb-2 font-medium">Check your email</p>
            <p className="text-slate-500 text-sm mb-6">If an account with <strong>{email}</strong> exists, we sent a password reset link.</p>
            <Link href="/login" className="btn-primary btn w-full">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">Enter your email address and we'll send you a link to reset your password.</p>
            <div>
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn w-full btn-lg">{loading ? "Sending…" : "Send reset link"}</button>
            <p className="text-center text-sm text-slate-500"><Link href="/login" className="text-brand-navy hover:underline">Back to login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
