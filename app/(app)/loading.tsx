export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy"
      style={{ background: "linear-gradient(135deg, #16265a 0%, #1a3575 40%, #0f1e3d 100%)" }}>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #3FA66B 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-[#2453E4] rounded-2xl flex items-center justify-center mb-5 shadow-lg">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="12" width="8" height="12" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="14" y="6" width="10" height="18" rx="1.5" fill="white"/>
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-white text-[22px] font-semibold tracking-tight">Clear</span>
          <span className="text-[#2453E4] text-[22px] font-semibold tracking-tight">Build</span>
        </div>
        <p className="text-white/40 text-[13px] font-medium tracking-[0.12em] uppercase mb-8">USA</p>

        {/* Dot animation */}
        <div className="flex items-center gap-2 mb-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1s" }} />
          ))}
        </div>
        <p className="text-white/50 text-[13px]">Preparing your workspace…</p>
      </div>

      {/* Version footer */}
      <p className="absolute bottom-6 text-white/20 text-[11px]">v1.0.0 · © 2026 Clear Build USA</p>
    </div>
  );
}
