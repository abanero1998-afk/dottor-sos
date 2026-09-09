import { haversineKm } from "./geo";
import { parseOpeningHours } from "./opening";

export type MsalFarm = {
  id: string;
  nome: string;
  addr: string;
  comune: string;
  provincia: string;
  cap: string;
  lat: number;
  lng: number;
  tipo: string;
};

const PAGE = "https://www.dati.salute.gov.it/it/dataset/farmacie/";
const FALLBACK =
  "https://www.dati.salute.gov.it/sites/default/files/opendata/FRM_FARMA_5_20260909.csv";

let cache: MsalFarm[] | null = null;
let cacheAt = 0;

function numIT(s: string) {
  const n = Number(String(s || "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(s: string) {
  const m = String(s || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function parseCsv(text: string): MsalFarm[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].split(";").map((h) => h.trim());
  const idx = (name: string) => head.indexOf(name);
  const iCod = idx("cod_farmacia");
  const iNome = idx("descrizione_farmacia");
  const iInd = idx("indirizzo");
  const iCom = idx("comune");
  const iProv = idx("sigla_provincia");
  const iCap = idx("cap");
  const iLat = idx("latitudine");
  const iLng = idx("longitudine");
  const iFine = idx("data_fine_validita");
  const iTipo = idx("descrizione_tipologia");
  const now = new Date();
  const out: MsalFarm[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < 10) continue;
    const fine = iFine >= 0 ? parseDate(cols[iFine]) : null;
    if (fine && fine < now) continue;
    const lat = numIT(cols[iLat]);
    const lng = numIT(cols[iLng]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < 35 || lat > 48 || lng < 6 || lng > 19) continue;
    const nome = (cols[iNome] || "Farmacia").trim();
    const comune = (cols[iCom] || "").trim();
    const addr = [(cols[iInd] || "").trim(), (cols[iCap] || "").trim(), comune].filter(Boolean).join(", ");
    out.push({
      id: `msal-${cols[iCod] || i}-${comune}`,
      nome: nome.startsWith("FARMACIA") ? nome : `Farmacia ${nome}`,
      addr,
      comune,
      provincia: (cols[iProv] || "").trim(),
      cap: (cols[iCap] || "").trim(),
      lat,
      lng,
      tipo: (cols[iTipo] || "Ordinaria").trim(),
    });
  }
  return out;
}

async function resolveCsvUrl() {
  try {
    const html = await fetch(PAGE, {
      headers: { "User-Agent": "DottorSOS/1.2" },
      next: { revalidate: 86400 },
    }).then((r) => r.text());
    const m = html.match(/\/sites\/default\/files\/opendata\/FRM_FARMA_5_[0-9]+\.csv/);
    if (m) return "https://www.dati.salute.gov.it" + m[0];
  } catch {
    /* fallback */
  }
  return FALLBACK;
}

export async function loadMinistero() {
  if (cache && Date.now() - cacheAt < 24 * 60 * 60 * 1000) return cache;
  const url = await resolveCsvUrl();
  const text = await fetch(url, {
    headers: { "User-Agent": "DottorSOS/1.2" },
    next: { revalidate: 86400 },
  }).then((r) => {
    if (!r.ok) throw new Error("CSV Ministero " + r.status);
    return r.text();
  });
  cache = parseCsv(text);
  cacheAt = Date.now();
  return cache;
}

export async function farmacieVicine(lat: number, lng: number, km = 8, limit = 40) {
  const all = await loadMinistero();
  const dlat = km / 111;
  const dlng = km / (111 * Math.cos((lat * Math.PI) / 180));
  const oh = parseOpeningHours(null);
  const hits = [];
  for (const f of all) {
    if (Math.abs(f.lat - lat) > dlat || Math.abs(f.lng - lng) > dlng) continue;
    const dist = haversineKm(lat, lng, f.lat, f.lng);
    if (dist > km) continue;
    hits.push({
      id: f.id,
      tipo: "farmacia" as const,
      nome: f.nome,
      lat: f.lat,
      lng: f.lng,
      dist,
      tel: "",
      addr: `${f.addr} (${f.provincia})`,
      aperta: oh.aperta,
      chiusura: oh.label,
      orari: "Anagrafica Ministero della Salute · orario da verificare in sede",
      fonte: "ministero",
      comune: f.comune,
      tipologia: f.tipo,
    });
  }
  hits.sort((a, b) => a.dist - b.dist);
  return { total: all.length, list: hits.slice(0, limit) };
}
