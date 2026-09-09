import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOTTOR SOS · Collesalvetti",
  description: "Farmacie, DAE, pronto soccorso, medici e infermiere IA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased text-[18px] bg-[#F5F5F7] text-black">{children}</body>
    </html>
  );
}
