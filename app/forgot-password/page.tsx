"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <Image src="/logo.png" alt="Clear Build USA" width={40} height={40} className="rounded-lg object-cover" />
          <div>
            <h1 className="text-lg font-bold text-[#1F2937] leading-tight">Clear Build USA</h1>
            <p className="text-xs text-[#6B7280]">Reset your password</p>
          </div>
        </div>
        {sent ? (
          <div className="text-center">
            <p className="text-[#1F2937] mb-2 font-medium">Check your email</p>
            <p className="text-[#6B7280] text-sm mb-6">If an account with <strong>{email}</strong> exists, we sent a password reset link.</p>
            <Link href="/login" className="btn btn-primary w-full">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-[#6B7280]">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            <div>
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">{loading ? "Sending…" : "Send reset link"}</button>
            <p className="text-center text-sm text-[#6B7280]"><Link href="/login" className="text-brand-navy hover:underline">Back to login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
