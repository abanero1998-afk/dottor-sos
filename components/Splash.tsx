"use client";
import { useEffect, useState } from "react";

export default function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-[3000] flex flex-col items-center justify-center bg-[#0b1220]">
      <img src="/logo.svg" alt="DOTTOR SOS" className="w-28 h-28 rounded-[32px] shadow-2xl" />
      <p className="mt-5 text-white font-black text-3xl tracking-tight">DOTTOR SOS</p>
      <p className="text-white/70 text-lg mt-1">Comune di Collesalvetti</p>
    </div>
  );
}
