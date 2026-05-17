"use client";
import { ReactNode } from "react";

// ── Status pill ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  trialing:     "bg-blue-50 text-blue-700 border-blue-200",
  trial:        "bg-blue-50 text-blue-700 border-blue-200",
  past_due:     "bg-amber-50 text-amber-700 border-amber-200",
  suspended:    "bg-red-50 text-red-700 border-red-200",
  canceled:     "bg-gray-100 text-gray-500 border-gray-200",
  cancelled:    "bg-gray-100 text-gray-500 border-gray-200",
  banned:       "bg-red-100 text-red-800 border-red-200",
  inactive:     "bg-gray-100 text-gray-500 border-gray-200",
  unpaid:       "bg-amber-50 text-amber-700 border-amber-200",
  super_admin:  "bg-purple-50 text-purple-700 border-purple-200",
  support:      "bg-blue-50 text-blue-700 border-blue-200",
  billing:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  developer:    "bg-amber-50 text-amber-700 border-amber-200",
  readonly:     "bg-gray-100 text-gray-500 border-gray-200",
  owner:        "bg-indigo-50 text-indigo-700 border-indigo-200",
  admin:        "bg-purple-50 text-purple-700 border-purple-200",
  member:       "bg-gray-100 text-gray-600 border-gray-200",
  paid:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  partially_paid: "bg-amber-50 text-amber-700 border-amber-200",
  draft:        "bg-gray-100 text-gray-500 border-gray-200",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status?.toLowerCase()] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Monospace ID ─────────────────────────────────────────────────────────────
export function MonoId({ id, prefix }: { id: string; prefix?: string }) {
  const short = id?.slice(0, 7) ?? "—";
  return (
    <span className="font-mono text-[11px] text-[#9399a8] tracking-wider">
      {prefix ? `${prefix}_${short}` : short}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, color = "default",
}: { label: string; value: string | number; sub?: string; color?: string }) {
  const valCls =
    color === "red"   ? "text-red-600" :
    color === "green" ? "text-emerald-600" :
    color === "amber" ? "text-amber-600" :
    "text-[#0d1117]";
  return (
    <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-[#9399a8] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[26px] font-bold leading-none ${valCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-[#9399a8] mt-1">{sub}</p>}
    </div>
  );
}

// ── Admin table ──────────────────────────────────────────────────────────────
export function AdminTable({ headers, children }: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-[#e8e9ed] rounded-[12px] overflow-hidden shadow-sm">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[#f8f9fb] border-b border-[#e8e9ed]">
            {headers.map(h => (
              <th key={h} className="text-left text-[11px] font-semibold text-[#9399a8] uppercase tracking-widest px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#f0f1f5] last:border-0 ${onClick ? "cursor-pointer hover:bg-[#fafbfc]" : ""} transition-colors`}
    >
      {children}
    </tr>
  );
}

export function AdminTd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 text-[#374151] ${className}`}>{children}</td>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AdminModal({ open, onClose, title, children, width = "max-w-[480px]" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white border border-[#e8e9ed] rounded-[16px] shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e9ed]">
          <h3 className="text-[15px] font-semibold text-[#0d1117]">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9399a8] hover:text-[#0d1117] hover:bg-[#f0f1f5] transition-colors text-lg leading-none">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Admin input ───────────────────────────────────────────────────────────────
export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] focus:ring-1 focus:ring-[#b33a4b]/20 transition-all ${props.className ?? ""}`}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-white border border-[#e2e4e9] text-[#1a2030] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] transition-all ${props.className ?? ""}`}
    />
  );
}

export function AdminLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">{children}</label>;
}

// ── Btn variants ──────────────────────────────────────────────────────────────
export function AdminBtn({
  children, onClick, variant = "default", disabled, type = "button", className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "red" | "purple" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white text-[#374151] hover:bg-[#f8f9fb] border border-[#e2e4e9] shadow-sm",
    red:     "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    purple:  "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200",
    ghost:   "text-[#6b7280] hover:text-[#1a2030] hover:bg-[#f0f1f5]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }: {
  page: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <span className="text-[12px] text-[#9399a8]">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1 rounded-[6px] text-[12px] text-[#6b7280] hover:text-[#0d1117] hover:bg-[#f0f1f5] disabled:opacity-30 transition-colors">
          ←
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-[6px] text-[12px] transition-colors ${p === page ? "bg-[#b33a4b] text-white" : "text-[#6b7280] hover:text-[#0d1117] hover:bg-[#f0f1f5]"}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          className="px-2.5 py-1 rounded-[6px] text-[12px] text-[#6b7280] hover:text-[#0d1117] hover:bg-[#f0f1f5] disabled:opacity-30 transition-colors">
          →
        </button>
      </div>
    </div>
  );
}

// ── Search input ─────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0c3cc]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] focus:ring-1 focus:ring-[#b33a4b]/20 transition-all w-[220px]"
      />
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
export function FilterTabs({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-[#f0f1f5] rounded-[8px] p-0.5">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${
            value === opt.value
              ? "bg-white text-[#0d1117] shadow-sm border border-[#e2e4e9]"
              : "text-[#6b7280] hover:text-[#1a2030]"
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function AdminEmpty({ message = "No data found" }: { message?: string }) {
  return (
    <tr>
      <td colSpan={99} className="py-12 text-center text-[#9399a8] text-[13px]">{message}</td>
    </tr>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-[#9399a8]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          <span className={i === items.length - 1 ? "text-[#374151]" : ""}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── Info card ────────────────────────────────────────────────────────────────
export function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-[#9399a8] uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}
