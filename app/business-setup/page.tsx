"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const BUSINESS_TYPES = ["General Contractor","Remodeler","Electrician","Plumber","HVAC","Painter","Landscaper","Roofer","Flooring","Other"];

export default function BusinessSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", legal_name: "", business_type: "",
    service_area: "", address: "", city: "", state: "", zip: "", country: "US",
    default_tax_rate: "0", payment_terms: "Net 30",
    quote_prefix: "Q-", invoice_prefix: "INV-", project_prefix: "PRJ-",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Business name is required"); return; }
    if (!form.email.trim() && !form.phone.trim()) { setErr("Email or phone is required"); return; }
    setLoading(true); setErr("");
    const res = await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setErr(data.message || "Failed to create business");
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg w-full max-w-2xl">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Clear Build USA" width={40} height={40} className="rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">Set up your business</h1>
              <p className="text-sm text-[#6B7280]">This helps personalize your experience on Clear Build USA</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          {err && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{err}</div>}

          <div>
            <p className="section-title">Business details <span className="text-red-400">*required</span></p>
            <div className="form-row">
              <div>
                <label className="label">Business name *</label>
                <input value={form.name} onChange={set("name")} placeholder="ABC Remodeling LLC" className="field" />
              </div>
              <div>
                <label className="label">Legal name</label>
                <input value={form.legal_name} onChange={set("legal_name")} placeholder="Optional" className="field" />
              </div>
              <div>
                <label className="label">Business email *</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="info@yourbusiness.com" className="field" />
              </div>
              <div>
                <label className="label">Business phone</label>
                <input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="field" />
              </div>
              <div>
                <label className="label">Business type</label>
                <select value={form.business_type} onChange={set("business_type")} className="field">
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Service area</label>
                <input value={form.service_area} onChange={set("service_area")} placeholder="e.g. Dallas / Fort Worth" className="field" />
              </div>
            </div>
          </div>

          <div>
            <p className="section-title">Address</p>
            <div className="space-y-3">
              <input value={form.address} onChange={set("address")} placeholder="Street address" className="field" />
              <div className="form-row-3">
                <input value={form.city} onChange={set("city")} placeholder="City" className="field" />
                <input value={form.state} onChange={set("state")} placeholder="State" className="field" />
                <input value={form.zip} onChange={set("zip")} placeholder="ZIP" className="field" />
              </div>
              <select value={form.country} onChange={set("country")} className="field">
                <option value="US">United States</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>

          <div>
            <p className="section-title">Defaults & numbering</p>
            <div className="form-row">
              <div>
                <label className="label">Default tax rate (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={form.default_tax_rate} onChange={set("default_tax_rate")} className="field" />
              </div>
              <div>
                <label className="label">Payment terms</label>
                <select value={form.payment_terms} onChange={set("payment_terms")} className="field">
                  {["Due on receipt","Net 7","Net 15","Net 30","Net 45","Net 60"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quote prefix</label>
                <input value={form.quote_prefix} onChange={set("quote_prefix")} className="field" />
              </div>
              <div>
                <label className="label">Invoice prefix</label>
                <input value={form.invoice_prefix} onChange={set("invoice_prefix")} className="field" />
              </div>
              <div>
                <label className="label">Project prefix</label>
                <input value={form.project_prefix} onChange={set("project_prefix")} className="field" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary py-2.5 flex-1">{loading ? "Creating…" : "Create business & continue"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
