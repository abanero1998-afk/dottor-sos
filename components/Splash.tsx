"use client";

export default function Splash({ progress, label }: { progress: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="absolute inset-0 z-[3000] flex flex-col items-center justify-center bg-[#0b0b0b]">
      <img src="/logo.svg" alt="DOTTOR SOS" className="w-32 h-32 rounded-[36px] shadow-2xl" />
      <p className="mt-6 text-white font-black text-3xl tracking-tight">DOTTOR SOS</p>
      <p className="text-white/60 text-base mt-2">{label}</p>
      <div className="w-64 h-2 rounded-full bg-white/15 mt-6 overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-white font-black mt-3 text-xl">{pct}%</p>
    </div>
  );
}
