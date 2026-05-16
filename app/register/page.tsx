"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", language: "en" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-card shadow-card w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Clear Build USA" width={160} height={45} className="object-contain" priority />
        </div>

        <h2 className="text-xl font-bold text-[#111827] mb-1" style={{ letterSpacing: "-0.02em" }}>Create account</h2>
        <p className="text-sm text-[#9CA3AF] mb-6">Get started with Clear Build USA today.</p>

        {err.general && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {err.general}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="John Doe" className="field" />
            {err.name && <p className="mt-1 text-xs text-red-500">{err.name}</p>}
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" className="field" />
            {err.email && <p className="mt-1 text-xs text-red-500">{err.email}</p>}
          </div>
          <div>
            <label className="label">
              Password
              <span className="text-[#9CA3AF] font-normal ml-1.5">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                placeholder="••••••••" className="field pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {err.password && <p className="mt-1 text-xs text-red-500">{err.password}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")}
              placeholder="••••••••" className="field" />
            {err.confirm && <p className="mt-1 text-xs text-red-500">{err.confirm}</p>}
          </div>
          <div>
            <label className="label">Preferred Language</label>
            <select value={form.language} onChange={set("language")} className="field">
              <option value="en">English</option>
              <option value="pt">Portuguese</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-navy font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
