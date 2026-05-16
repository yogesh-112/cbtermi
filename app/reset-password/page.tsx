"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setErr("Min 8 characters"); return; }
    if (form.password !== form.confirm) { setErr("Passwords do not match"); return; }
    setLoading(true); setErr("");
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: form.password }) });
    setLoading(false);
    if (res.ok) router.push("/login");
    else setErr("Invalid or expired reset link.");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <Image src="/logo.png" alt="Clear Build USA" width={40} height={40} className="rounded-lg object-cover" />
          <div>
            <h1 className="text-lg font-bold text-[#1F2937] leading-tight">Clear Build USA</h1>
            <p className="text-xs text-[#6B7280]">Set new password</p>
          </div>
        </div>
        {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" className="field" />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" className="field" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">{loading ? "Saving…" : "Set new password"}</button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
