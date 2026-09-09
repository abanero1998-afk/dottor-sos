import { NextRequest, NextResponse } from "next/server";
import { haversineKm } from "@/lib/geo";
import { parseOpeningHours } from "@/lib/opening";
import { waitFor } from "@/lib/wait";

export const dynamic = "force-dynamic";

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
  "https://overpass.osm.ch/api/interpreter",
];

async function overpass(query: string) {
  let last = "";
  for (const base of MIRRORS) {
    try {
      const url = `${base}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "DottorSOS/1.1 (https://dottor-sos.vercel.app)",
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        last = text.slice(0, 180);
        continue;
      }
      const data = JSON.parse(text) as { elements?: OsmEl[] };
      if (data.elements) return data;
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

async function nominatimAround(lat: number, lng: number, q: string) {
  const delta = 0.06;
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&countrycodes=it` +
    `&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DottorSOS/1.1 (https://dottor-sos.vercel.app)" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const arr = (await res.json()) as any[];
  return arr.map((r) => ({
    lat: Number(r.lat),
    lng: Number(r.lon),
    nome: (r.display_name || q).split(",")[0],
    addr: r.display_name as string,
    id: `nom-${r.place_id}`,
  }));
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const radius = Math.min(12000, Math.max(2000, Number(req.nextUrl.searchParams.get("r") || 6000)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng richiesti" }, { status: 400 });
  }

  const q = `[out:json][timeout:25];(
    node["amenity"="pharmacy"](around:${radius},${lat},${lng});
    way["amenity"="pharmacy"](around:${radius},${lat},${lng});
    node["amenity"="hospital"](around:${radius},${lat},${lng});
    node["amenity"="clinic"](around:${radius},${lat},${lng});
    node["emergency"="defibrillator"](around:${radius},${lat},${lng});
    node["amenity"="doctors"](around:${radius},${lat},${lng});
    node["amenity"="veterinary"](around:${radius},${lat},${lng});
  );out center tags 60;`;

  const farmacie: any[] = [];
  const ospedali: any[] = [];
  const dae: any[] = [];
  const medici: any[] = [];
  const pedvet: any[] = [];
  let fonte = "OpenStreetMap";

  try {
    const data = await overpass(q);
    const seen = new Set<string>();
    for (const el of data.elements || []) {
      const c = coords(el);
      if (!c) continue;
      const key = `${el.type || "n"}-${el.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tags = el.tags || {};
      const nome = tags.name || tags.operator || tags.brand || "Punto salute";
      const dist = haversineKm(lat, lng, c.lat, c.lng);
      const tel = tags.phone || tags["contact:phone"] || "";
      const addr = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean).join(" ");
      const oh = parseOpeningHours(tags.opening_hours);

      if (tags.amenity === "pharmacy") {
        farmacie.push({
          id: key, tipo: "farmacia", nome, lat: c.lat, lng: c.lng, dist, tel, addr,
          aperta: oh.aperta, chiusura: oh.label, orari: oh.raw,
        });
      } else if (tags.emergency === "defibrillator") {
        dae.push({
          id: key, tipo: "dae", nome: nome === "Punto salute" ? "Defibrillatore DAE" : nome,
          lat: c.lat, lng: c.lng, dist, luogo: tags.location || addr || "Accesso pubblico",
        });
      } else if (tags.amenity === "veterinary") {
        pedvet.push({ id: key, tipo: "vet", nome, lat: c.lat, lng: c.lng, dist, tel, addr, aperta: oh.aperta, chiusura: oh.label });
      } else if (tags.amenity === "doctors") {
        const spec = (tags.healthcare_speciality || "").toLowerCase();
        const item = { id: key, tipo: spec.includes("paediat") ? "pediatra" : "medico", nome, lat: c.lat, lng: c.lng, dist, tel, addr, aperta: oh.aperta, chiusura: oh.label };
        if (item.tipo === "pediatra" || nome.toLowerCase().includes("pediatr")) pedvet.push(item);
        else medici.push(item);
      } else {
        const w = waitFor(key + String(Math.floor(Date.now() / 600000)));
        ospedali.push({
          id: key, tipo: "ps", nome, lat: c.lat, lng: c.lng, dist, tel, addr,
          attesa: w.label, persone: w.people, stato: w.stato, min: w.min,
        });
      }
    }
    fonte = "OpenStreetMap Overpass";
  } catch (e) {
    fonte = "Nominatim fallback · " + String(e).slice(0, 80);
  }

  if (farmacie.length === 0) {
    const extra = await nominatimAround(lat, lng, "farmacia");
    for (const r of extra) {
      const dist = haversineKm(lat, lng, r.lat, r.lng);
      const oh = parseOpeningHours(null);
      farmacie.push({
        id: r.id, tipo: "farmacia", nome: r.nome, lat: r.lat, lng: r.lng, dist,
        tel: "", addr: r.addr, aperta: oh.aperta, chiusura: oh.label, orari: oh.raw,
      });
    }
    if (ospedali.length === 0) {
      const hosp = await nominatimAround(lat, lng, "ospedale pronto soccorso");
      for (const r of hosp) {
        const dist = haversineKm(lat, lng, r.lat, r.lng);
        const w = waitFor(r.id);
        ospedali.push({
          id: r.id, tipo: "ps", nome: r.nome, lat: r.lat, lng: r.lng, dist,
          tel: "", addr: r.addr, attesa: w.label, persone: w.people, stato: w.stato, min: w.min,
        });
      }
    }
  }

  const sort = (a: any, b: any) => a.dist - b.dist;
  farmacie.sort(sort);
  ospedali.sort(sort);
  dae.sort(sort);
  medici.sort(sort);
  pedvet.sort(sort);

  return NextResponse.json({
    fonte,
    count: farmacie.length,
    farmacie: farmacie.slice(0, 40),
    ospedali: ospedali.slice(0, 20),
    dae: dae.slice(0, 25),
    medici: medici.slice(0, 25),
    pedvet: pedvet.slice(0, 25),
  });
}
