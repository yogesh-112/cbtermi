"use client";
import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

interface AddressResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
}

interface AddressFill {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (fill: AddressFill) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder = "123 Main St", className = "field" }: Props) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 4) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=6&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { "Accept-Language": "en-US" } });
        const data: AddressResult[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const pick = (r: AddressResult) => {
    const a = r.address;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village || "";
    const state = a.state || "";
    const zip = a.postcode || "";
    const country = (a.country_code || "us").toUpperCase();
    onSelect({ address: street, city, state, zip, country });
    onChange(street);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); search(e.target.value); }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e7e6e1] rounded-xl shadow-lg z-50 overflow-hidden max-h-[260px] overflow-y-auto">
          {suggestions.map((r, i) => {
            const a = r.address;
            const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
            const line2 = [a.city || a.town || a.village, a.state, a.postcode].filter(Boolean).join(", ");
            return (
              <button key={i} type="button"
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f6f6f3] transition-colors border-b border-[#f3f4f6] last:border-0"
                onMouseDown={e => { e.preventDefault(); pick(r); }}>
                <MapPin size={14} className="text-brand-navy mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-[#0c1226]">{line1 || r.display_name.split(",")[0]}</p>
                  <p className="text-[11px] text-[#8a8fa3] mt-0.5">{line2}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
