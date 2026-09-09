import { NextRequest, NextResponse } from "next/server";
import { haversineKm } from "@/lib/geo";
import { parseOpeningHours } from "@/lib/opening";
import { waitFor } from "@/lib/wait";
import { farmacieVicine } from "@/lib/ministero";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type OsmEl = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

async function overpass(query: string) {
  let last = "";
  for (const base of MIRRORS) {
    try {
      const url = `${base}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DottorSOS/1.2", Accept: "application/json" },
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        last = text.slice(0, 160);
        continue;
      }
      return JSON.parse(text) as { elements?: OsmEl[] };
    } catch (e) {
      last = String(e);
    }
  }
  throw new Error(last || "Overpass down");
}

function coords(el: OsmEl) {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  return lat != null && lng != null ? { lat, lng } : null;
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const radiusM = Math.min(15000, Math.max(2000, Number(req.nextUrl.searchParams.get("r") || 8000)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng richiesti" }, { status: 400 });
  }

  let farmacie: any[] = [];
  let registry = 0;
  try {
    const msal = await farmacieVicine(lat, lng, radiusM / 1000, 50);
    farmacie = msal.list;
    registry = msal.total;
  } catch (e) {
    console.error("ministero", e);
  }

  const ospedali: any[] = [];
  const dae: any[] = [];
  const medici: any[] = [];
  const pedvet: any[] = [];

  try {
    const q = `[out:json][timeout:20];(
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      node["amenity"="clinic"](around:${radiusM},${lat},${lng});
      node["emergency"="defibrillator"](around:${radiusM},${lat},${lng});
      node["amenity"="doctors"](around:${radiusM},${lat},${lng});
      node["amenity"="veterinary"](around:${radiusM},${lat},${lng});
    );out center tags 50;`;
    const data = await overpass(q);
    for (const el of data.elements || []) {
      const c = coords(el);
      if (!c) continue;
      const tags = el.tags || {};
      const nome = tags.name || tags.operator || "Punto salute";
      const dist = haversineKm(lat, lng, c.lat, c.lng);
      const tel = tags.phone || tags["contact:phone"] || "";
      const addr = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean).join(" ");
      const oh = parseOpeningHours(tags.opening_hours);
      const key = `${el.type}-${el.id}`;
      if (tags.emergency === "defibrillator") {
        dae.push({ id: key, tipo: "dae", nome: nome === "Punto salute" ? "Defibrillatore DAE" : nome, lat: c.lat, lng: c.lng, dist, luogo: tags.location || addr || "Accesso pubblico" });
      } else if (tags.amenity === "veterinary") {
        pedvet.push({ id: key, tipo: "vet", nome, lat: c.lat, lng: c.lng, dist, tel, addr, aperta: oh.aperta, chiusura: oh.label });
      } else if (tags.amenity === "doctors") {
        const ped = nome.toLowerCase().includes("pediatr");
        const item = { id: key, tipo: ped ? "pediatra" : "medico", nome, lat: c.lat, lng: c.lng, dist, tel, addr, aperta: oh.aperta, chiusura: oh.label };
        (ped ? pedvet : medici).push(item);
      } else {
        const w = waitFor(key);
        ospedali.push({ id: key, tipo: "ps", nome, lat: c.lat, lng: c.lng, dist, tel, addr, attesa: w.label, persone: w.people, stato: w.stato, min: w.min });
      }
    }
  } catch {
    /* OSM opzionale */
  }

  return NextResponse.json({
    fonte: `Ministero della Salute · ${registry} farmacie in anagrafe · IODL 2.0`,
    count: farmacie.length,
    registry,
    farmacie: farmacie.slice(0, 40),
    ospedali: ospedali.sort((a, b) => a.dist - b.dist).slice(0, 20),
    dae: dae.sort((a, b) => a.dist - b.dist).slice(0, 25),
    medici: medici.sort((a, b) => a.dist - b.dist).slice(0, 25),
    pedvet: pedvet.sort((a, b) => a.dist - b.dist).slice(0, 25),
  });
}
