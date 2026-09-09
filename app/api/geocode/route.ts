import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function googleGeocode(params: Record<string, string>) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const qs = new URLSearchParams({ ...params, key, language: "it", region: "it" });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${qs}`, { cache: "no-store" });
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) return { provider: "google", error: data.status, results: [] };
  const hits = data.results.slice(0, 5).map((r: any) => ({
    label: r.formatted_address as string,
    lat: r.geometry.location.lat as number,
    lng: r.geometry.location.lng as number,
    placeId: r.place_id as string,
    types: r.types as string[],
  }));
  return { provider: "google", results: hits };
}

async function nominatim(q?: string, lat?: number, lng?: number) {
  const url = q
    ? `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=it&q=${encodeURIComponent(q)}`
    : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DottorSOS/1.0 (comune-collesalvetti)" },
    cache: "no-store",
  });
  const data = await res.json();
  const arr = Array.isArray(data) ? data : data?.lat ? [data] : [];
  return {
    provider: "nominatim",
    results: arr.slice(0, 5).map((r: any) => ({
      label: r.display_name as string,
      lat: Number(r.lat),
      lng: Number(r.lon),
    })),
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  try {
    if (q) {
      const g = await googleGeocode({ address: q, components: "country:IT" });
      if (g?.results?.length) return NextResponse.json(g);
      const n = await nominatim(q);
      return NextResponse.json(n);
    }
    if (lat && lng) {
      const g = await googleGeocode({ latlng: `${lat},${lng}` });
      if (g?.results?.length) return NextResponse.json(g);
      const n = await nominatim(undefined, Number(lat), Number(lng));
      return NextResponse.json(n);
    }
    return NextResponse.json({ error: "q oppure lat/lng" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e), results: [] }, { status: 502 });
  }
}
