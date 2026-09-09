import { NextRequest, NextResponse } from "next/server";
import { interpret } from "@/lib/nurse";
import { formatDistance } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").slice(0, 500);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const intent = interpret(text || "aiuto");

  let nearest: any = null;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const origin = req.nextUrl.origin;
    const r = await fetch(`${origin}/api/nearby?lat=${lat}&lng=${lng}&r=6000`, { cache: "no-store" }).catch(() => null);
    const data = r && r.ok ? await r.json() : { farmacie: [], ospedali: [], dae: [] };
    if (intent.kind === "emergency" || intent.kind === "hospital") {
      nearest = data.ospedali?.[0] || data.farmacie?.[0];
    } else {
      const open = (data.farmacie || []).find((f: any) => f.aperta);
      nearest = open || data.farmacie?.[0];
    }
  }

  const extra = nearest
    ? `\n\nPunto consigliato: ${nearest.nome} (${formatDistance(nearest.dist)}). ${nearest.chiusura || nearest.addr || ""}`
    : "\n\nAttiva la posizione per indicarti la struttura più vicina in Italia.";

  return NextResponse.json({
    intent,
    reply: intent.advice + extra,
    nearest,
    call118: intent.kind === "emergency",
  });
}
