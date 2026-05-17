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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Clear Build USA"
          width={160}
          height={44}
          className="object-contain mb-8"
          style={{ filter: "brightness(0) invert(1)" }}
        />

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
