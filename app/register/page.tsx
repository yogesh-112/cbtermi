"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", language: "en" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Clear Build USA</h1>
            <p className="text-xs text-slate-500">Create your account</p>
          </div>
        </div>

        {err.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{err.general}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="John Doe" className="field" />
            {err.name && <p className="mt-1 text-xs text-red-500">{err.name}</p>}
          </div>
          <div>
            <label className="label">Email address</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="field" />
            {err.email && <p className="mt-1 text-xs text-red-500">{err.email}</p>}
          </div>
          <div>
            <label className="label">Password <span className="text-slate-400 font-normal">(min. 8 characters)</span></label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" className="field pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {err.password && <p className="mt-1 text-xs text-red-500">{err.password}</p>}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" className="field" />
            {err.confirm && <p className="mt-1 text-xs text-red-500">{err.confirm}</p>}
          </div>
          <div>
            <label className="label">Preferred language</label>
            <select value={form.language} onChange={set("language")} className="field">
              <option value="en">English</option>
              <option value="pt">Portuguese</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary btn w-full btn-lg">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-navy font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
