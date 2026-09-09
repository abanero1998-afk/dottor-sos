import { NextRequest, NextResponse } from "next/server";
import { haversineKm } from "@/lib/geo";
import { parseOpeningHours } from "@/lib/opening";

export const dynamic = "force-dynamic";

type OsmEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function overpass(query: string) {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
  ];
  let last = "";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        next: { revalidate: 120 },
      });
      if (!res.ok) {
        last = await res.text();
        continue;
      }
      return (await res.json()) as { elements: OsmEl[] };
    } catch (e) {
      last = String(e);
    }
  }
  throw new Error(last || "Overpass non disponibile");
}

function coords(el: OsmEl) {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  return lat != null && lng != null ? { lat, lng } : null;
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const radius = Math.min(12000, Math.max(1500, Number(req.nextUrl.searchParams.get("r") || 4500)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng richiesti" }, { status: 400 });
  }

  const q = `[out:json][timeout:25];(
    nwr["amenity"="pharmacy"](around:${radius},${lat},${lng});
    nwr["amenity"="hospital"](around:${radius},${lat},${lng});
    nwr["amenity"="clinic"]["emergency"="yes"](around:${radius},${lat},${lng});
    nwr["emergency"="defibrillator"](around:${radius},${lat},${lng});
  );out center tags 80;`;

  try {
    const data = await overpass(q);
    const farmacie = [];
    const ospedali = [];
    const dae = [];
    const seen = new Set<string>();

    for (const el of data.elements || []) {
      const c = coords(el);
      if (!c) continue;
      const key = `${el.type}-${el.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tags = el.tags || {};
      const nome = tags.name || tags.operator || tags.brand || "Punto salute";
      const dist = haversineKm(lat, lng, c.lat, c.lng);
      const tel = tags.phone || tags["contact:phone"] || "";
      const addr = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean).join(" ");

      if (tags.amenity === "pharmacy") {
        const oh = parseOpeningHours(tags.opening_hours);
        farmacie.push({
          id: key,
          tipo: "farmacia",
          nome,
          lat: c.lat,
          lng: c.lng,
          dist,
          tel,
          addr,
          aperta: oh.aperta,
          chiusura: oh.label,
          orari: oh.raw,
          website: tags.website || "",
        });
      } else if (tags.emergency === "defibrillator") {
        dae.push({
          id: key,
          tipo: "dae",
          nome: nome === "Punto salute" ? "Defibrillatore DAE" : nome,
          lat: c.lat,
          lng: c.lng,
          dist,
          luogo: tags.location || tags.description || addr || "Accesso pubblico",
        });
      } else {
        ospedali.push({
          id: key,
          tipo: "ps",
          nome,
          lat: c.lat,
          lng: c.lng,
          dist,
          tel,
          addr,
          emergency: tags.emergency === "yes",
        });
      }
    }

    farmacie.sort((a, b) => a.dist - b.dist);
    ospedali.sort((a, b) => a.dist - b.dist);
    dae.sort((a, b) => a.dist - b.dist);

    return NextResponse.json({
      fonte: "OpenStreetMap Overpass · orari OSM quando presenti",
      farmacie: farmacie.slice(0, 40),
      ospedali: ospedali.slice(0, 20),
      dae: dae.slice(0, 20),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), farmacie: [], ospedali: [], dae: [] }, { status: 502 });
  }
}
