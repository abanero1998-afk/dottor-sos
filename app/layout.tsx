import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOTTOR SOS",
  description: "Farmacie, DAE, pronto soccorso, medici e infermiere IA · Italia",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased text-[18px] bg-[#0b0b0b] text-white">{children}</body>
    </html>
  );
}
