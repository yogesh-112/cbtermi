"use client";
import { ReactNode } from "react";

// ── Status pill ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trialing:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  trial:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  past_due:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspended:    "bg-red-500/10 text-red-400 border-red-500/20",
  canceled:     "bg-white/5 text-white/40 border-white/10",
  cancelled:    "bg-white/5 text-white/40 border-white/10",
  banned:       "bg-rose-900/30 text-rose-400 border-rose-500/20",
  inactive:     "bg-white/5 text-white/40 border-white/10",
  unpaid:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
  super_admin:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  support:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  billing:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  developer:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  readonly:     "bg-white/5 text-white/40 border-white/10",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status?.toLowerCase()] ?? "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Monospace ID ─────────────────────────────────────────────────────────────
export function MonoId({ id, prefix }: { id: string; prefix?: string }) {
  const short = id?.slice(0, 7) ?? "—";
  return (
    <span className="font-mono text-[11px] text-white/40 tracking-wider">
      {prefix ? `${prefix}_${short}` : short}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, color = "white",
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#141822] border border-white/[0.06] rounded-[12px] p-4">
      <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[26px] font-semibold leading-none ${color === "red" ? "text-[#e06070]" : color === "green" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ── Admin table ──────────────────────────────────────────────────────────────
export function AdminTable({ headers, children, empty = "No data" }: {
  headers: string[];
  children: ReactNode;
  empty?: string;
}) {
  return (
    <div className="bg-[#141822] border border-white/[0.06] rounded-[12px] overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map(h => (
              <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest px-4 py-2.5">
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
      className={`border-b border-white/[0.04] last:border-0 ${onClick ? "cursor-pointer hover:bg-white/[0.02]" : ""} transition-colors`}
    >
      {children}
    </tr>
  );
}

export function AdminTd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 text-white/70 ${className}`}>{children}</td>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AdminModal({ open, onClose, title, children, width = "max-w-[480px]" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-[#0d1117] border border-white/[0.08] rounded-[16px] shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors text-lg leading-none">
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
      className={`w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]/50 focus:ring-1 focus:ring-[#b33a4b]/20 transition-all ${props.className ?? ""}`}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-[#0d1117] border border-white/[0.08] text-white rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]/50 transition-all ${props.className ?? ""}`}
    />
  );
}

export function AdminLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1">{children}</label>;
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
    default: "bg-white/[0.07] text-white/80 hover:bg-white/10 border border-white/[0.08]",
    red:     "bg-[#b33a4b]/10 text-[#e06070] hover:bg-[#b33a4b]/20 border border-[#b33a4b]/20",
    purple:  "bg-[#6b5bff]/10 text-[#9b8fff] hover:bg-[#6b5bff]/20 border border-[#6b5bff]/20",
    ghost:   "text-white/50 hover:text-white hover:bg-white/[0.04]",
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
      <span className="text-[12px] text-white/30">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1 rounded-[6px] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
          ←
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-[6px] text-[12px] transition-colors ${p === page ? "bg-[#b33a4b] text-white" : "text-white/50 hover:text-white hover:bg-white/[0.06]"}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          className="px-2.5 py-1 rounded-[6px] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
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
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/[0.04] border border-white/[0.07] text-white placeholder-white/20 rounded-[8px] pl-9 pr-3 py-2 text-[13px] outline-none focus:border-white/20 transition-all w-[220px]"
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
    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-[8px] p-0.5">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${
            value === opt.value
              ? "bg-[#1a2030] text-white shadow-sm"
              : "text-white/40 hover:text-white/70"
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
      <td colSpan={99} className="py-12 text-center text-white/25 text-[13px]">{message}</td>
    </tr>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-white/30">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          <span className={i === items.length - 1 ? "text-white/60" : ""}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
