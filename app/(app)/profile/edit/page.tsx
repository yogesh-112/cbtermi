"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, AlertTriangle } from "lucide-react";
import { toast, Modal } from "@/components/ui";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}>
      <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-[3px]"}`} />
    </button>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOnDocs, setShowOnDocs] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    role: "",
    email: "",
    phone: "",
    about: "",
    skills: "",
  });

  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        const u = d.user;
        if (!u) return;
        const parts = (u.full_name ?? "").split(" ");
        const first = parts[0] ?? "";
        const last = parts.slice(1).join(" ");
        const skills = Array.isArray(u.skills) ? u.skills.join(", ") : (u.skills ?? "");
        setForm({
          first_name: first,
          last_name: last,
          display_name: u.display_name ?? "",
          role: u.role ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          about: u.about ?? "",
          skills,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const initials = [form.first_name[0], form.last_name[0]].filter(Boolean).join("").toUpperCase() || "?";

  const save = async () => {
    setSaving(true);
    const full_name = [form.first_name, form.last_name].filter(Boolean).join(" ");
    const skills = form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        display_name: form.display_name || undefined,
        role: form.role || undefined,
        phone: form.phone || undefined,
        about: form.about || undefined,
        skills: skills.length ? skills : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Profile updated");
      router.push("/profile");
    } else {
      const d = await res.json();
      toast(d.message ?? "Failed to update profile", "error");
    }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { toast("Passwords do not match", "error"); return; }
    if (pwForm.new_password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setSavingPw(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
    });
    setSavingPw(false);
    if (res.ok) {
      toast("Password changed");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setShowPw(false);
    } else {
      const d = await res.json();
      toast(d.message ?? "Failed to change password", "error");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      router.push("/login");
    } else {
      setDeleting(false);
      setDeleteOpen(false);
      toast("Failed to delete account", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-[820px]">
        <div className="h-8 w-48 skeleton rounded mb-2" />
        <div className="h-4 w-72 skeleton rounded mb-6" />
        <div className="card h-48 skeleton animate-pulse mb-4" />
        <div className="card h-64 skeleton animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[820px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Profile details</h1>
          <p className="page-desc">This information appears on quotes, invoices, and the customer portal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/profile" className="btn btn-outline btn-sm">Discard</Link>
          <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        {/* Main form */}
        <div className="space-y-4">

          {/* Photo */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Photo</h2>
            <div className="flex items-center gap-5">
              <div className="w-[72px] h-[72px] bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[24px] font-bold">{initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <button type="button" className="btn btn-outline btn-sm gap-1.5">
                    <Upload size={12} /> Upload photo
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm text-red-500 hover:text-red-600">Remove</button>
                </div>
                <p className="text-[11px] text-[#8a8fa3]">JPG, PNG up to 2MB · 400 × 400 minimum</p>
              </div>
            </div>
          </div>

          {/* Personal */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Personal</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                  placeholder="Marcus" className="field" />
              </div>
              <div>
                <label className="label">Last name</label>
                <input value={form.last_name} onChange={e => set("last_name", e.target.value)}
                  placeholder="Kane" className="field" />
              </div>
              <div>
                <label className="label">Display name</label>
                <input value={form.display_name} onChange={e => set("display_name", e.target.value)}
                  placeholder="Marcus K." className="field" />
              </div>
              <div>
                <label className="label">Role / title</label>
                <input value={form.role} onChange={e => set("role", e.target.value)}
                  placeholder="Owner" className="field" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} readOnly
                  className="field bg-[#f6f6f3] cursor-not-allowed text-[#8a8fa3]" />
                <p className="text-[11px] text-[#8a8fa3] mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="(828) 555-0100" className="field" />
              </div>
              <div className="col-span-2">
                <label className="label">About you</label>
                <textarea value={form.about} onChange={e => set("about", e.target.value)}
                  rows={3} placeholder="Brief bio shown on the customer portal and your profile…"
                  className="field resize-none" />
              </div>
              <div className="col-span-2">
                <label className="label">Skills / specialties</label>
                <input value={form.skills} onChange={e => set("skills", e.target.value)}
                  placeholder="Kitchens, Bathrooms, Custom carpentry, Additions"
                  className="field" />
                <p className="text-[11px] text-[#8a8fa3] mt-1">Comma-separated tags shown on your profile.</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card p-5">
            <h2 className="section-title mb-1">Security</h2>
            <div className="flex items-center justify-between py-3 border-b border-[#f0efea]">
              <div>
                <p className="text-[13px] font-medium text-[#0c1226]">Password</p>
                <p className="text-[11px] text-[#8a8fa3]">Last changed — days ago</p>
              </div>
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="btn btn-outline btn-sm">
                {showPw ? "Cancel" : "Change"}
              </button>
            </div>
            {showPw && (
              <div className="pt-4 space-y-3">
                <div>
                  <label className="label">Current password</label>
                  <input type="password" value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    className="field max-w-sm" />
                </div>
                <div>
                  <label className="label">New password</label>
                  <input type="password" value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                    placeholder="Min. 8 characters" className="field max-w-sm" />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" value={pwForm.confirm_password}
                    onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                    className="field max-w-sm" />
                </div>
                <button onClick={changePassword} disabled={savingPw} className="btn btn-primary btn-sm">
                  {savingPw ? "Saving…" : "Update password"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Visibility */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Visibility</p>
            <p className="text-[12px] text-[#4a5168] leading-relaxed mb-4">
              Your name, role, and photo show on the customer portal and on every quote and invoice you send.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#0c1226]">Show on documents</span>
              <Toggle checked={showOnDocs} onChange={() => setShowOnDocs(!showOnDocs)} />
            </div>
          </div>

          {/* Danger zone */}
          <div className="card p-4 border-red-100">
            <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-3">Danger zone</p>
            <button type="button" onClick={() => setDeleteOpen(true)}
              className="w-full py-2 px-3 text-[13px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Delete account
            </button>
            <p className="text-[11px] text-[#8a8fa3] mt-2 leading-relaxed">
              Permanent. Removes you from this business. Customer history is preserved.
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-[13px] text-[#4a5168] leading-relaxed">
              This will permanently remove your account from this business. Your projects, invoices, and customer history will be preserved, but you will lose access immediately.
            </p>
            <p className="text-[13px] font-semibold text-red-600 mt-2">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn btn-outline" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
