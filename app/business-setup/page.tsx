"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useT } from "@/lib/i18n";

const BUSINESS_TYPES = ["General Contractor","Remodeler","Electrician","Plumber","HVAC","Painter","Landscaper","Roofer","Flooring","Other"];

export default function BusinessSetupPage() {
  const router = useRouter();
  const t = useT();
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
    if (!form.name.trim()) { setErr(`${t.businessSetup.businessName} ${t.common.required.toLowerCase()}`); return; }
    if (!form.email.trim() && !form.phone.trim()) { setErr(`${t.businessSetup.businessEmail} ${t.common.required.toLowerCase()}`); return; }
    setLoading(true); setErr("");
    const res = await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setErr(data.message || t.businessSetup.creating);
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e7e6e1] rounded-[20px] shadow-card w-full max-w-2xl">
        <div className="px-7 pt-7 pb-5 border-b border-[#e7e6e1]">
          <div className="flex items-center gap-3.5">
            <Image src="/logo.png" alt="Clear Build USA" width={36} height={36} className="rounded-xl object-contain" />
            <div>
              <h1 className="text-lg font-bold text-[#0c1226]" style={{ letterSpacing: "-0.02em" }}>{t.businessSetup.title}</h1>
              <p className="text-sm text-[#8a8fa3]">{t.businessSetup.subtitle}</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="px-7 py-6 space-y-6">
          {err && <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{err}</div>}

          <div>
            <p className="section-title">{t.businessSetup.detailsSection} <span className="text-red-400">{t.businessSetup.requiredNote}</span></p>
            <div className="form-row">
              <div>
                <label className="label">{t.businessSetup.businessName} *</label>
                <input value={form.name} onChange={set("name")} placeholder="ABC Remodeling LLC" className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.legalName}</label>
                <input value={form.legal_name} onChange={set("legal_name")} placeholder={t.businessSetup.legalNamePlaceholder} className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.businessEmail} *</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="info@yourbusiness.com" className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.businessPhone}</label>
                <input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.businessType}</label>
                <select value={form.business_type} onChange={set("business_type")} className="field">
                  <option value="">{t.businessSetup.selectType}</option>
                  {BUSINESS_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.businessSetup.serviceArea}</label>
                <input value={form.service_area} onChange={set("service_area")} placeholder={t.businessSetup.serviceAreaPlaceholder} className="field" />
              </div>
            </div>
          </div>

          <div>
            <p className="section-title">{t.common.address}</p>
            <div className="space-y-3">
              <input value={form.address} onChange={set("address")} placeholder={t.businessSetup.streetAddress} className="field" />
              <div className="form-row-3">
                <input value={form.city} onChange={set("city")} placeholder={t.businessSetup.city} className="field" />
                <input value={form.state} onChange={set("state")} placeholder={t.businessSetup.state} className="field" />
                <input value={form.zip} onChange={set("zip")} placeholder={t.businessSetup.zip} className="field" />
              </div>
              <select value={form.country} onChange={set("country")} className="field">
                <option value="US">{t.businessSetup.countries.us}</option>
                <option value="BR">{t.businessSetup.countries.br}</option>
                <option value="MX">{t.businessSetup.countries.mx}</option>
                <option value="CA">{t.businessSetup.countries.ca}</option>
              </select>
            </div>
          </div>

          <div>
            <p className="section-title">{t.businessSetup.defaultsSection}</p>
            <div className="form-row">
              <div>
                <label className="label">{t.businessSetup.taxRate}</label>
                <input type="number" step="0.01" min="0" max="100" value={form.default_tax_rate} onChange={set("default_tax_rate")} className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.paymentTerms}</label>
                <select value={form.payment_terms} onChange={set("payment_terms")} className="field">
                  <option value="Due on receipt">{t.businessSetup.dueOnReceipt}</option>
                  <option value="Net 7">{t.businessSetup.terms.net7}</option>
                  <option value="Net 15">{t.businessSetup.terms.net15}</option>
                  <option value="Net 30">{t.businessSetup.terms.net30}</option>
                  <option value="Net 45">{t.businessSetup.terms.net45}</option>
                  <option value="Net 60">{t.businessSetup.terms.net60}</option>
                </select>
              </div>
              <div>
                <label className="label">{t.businessSetup.quotePrefix}</label>
                <input value={form.quote_prefix} onChange={set("quote_prefix")} className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.invoicePrefix}</label>
                <input value={form.invoice_prefix} onChange={set("invoice_prefix")} className="field" />
              </div>
              <div>
                <label className="label">{t.businessSetup.projectPrefix}</label>
                <input value={form.project_prefix} onChange={set("project_prefix")} className="field" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? t.businessSetup.creating : t.businessSetup.createButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
