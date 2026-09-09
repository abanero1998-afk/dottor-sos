export type OfflineDae = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  luogo: string;
};

/** Punti DAE di riferimento (stazioni, aeroporti, piazze) usabili senza rete */
export const DAE_OFFLINE: OfflineDae[] = [
  { id: "dae-rm-term", nome: "DAE Roma Termini", lat: 41.9009, lng: 12.502, luogo: "Stazione Termini" },
  { id: "dae-rm-cam", nome: "DAE Campidoglio", lat: 41.8933, lng: 12.4828, luogo: "Piazza del Campidoglio" },
  { id: "dae-mi-cent", nome: "DAE Milano Centrale", lat: 45.486, lng: 9.204, luogo: "Stazione Centrale" },
  { id: "dae-mi-duo", nome: "DAE Duomo Milano", lat: 45.4642, lng: 9.19, luogo: "Piazza Duomo" },
  { id: "dae-na-gar", nome: "DAE Napoli Garibaldi", lat: 40.852, lng: 14.272, luogo: "Stazione Garibaldi" },
  { id: "dae-to-port", nome: "DAE Torino Porta Nuova", lat: 45.061, lng: 7.678, luogo: "Stazione Porta Nuova" },
  { id: "dae-fi-smn", nome: "DAE Firenze SMN", lat: 43.7765, lng: 11.247, luogo: "Stazione Santa Maria Novella" },
  { id: "dae-bo-cent", nome: "DAE Bologna Centrale", lat: 44.506, lng: 11.342, luogo: "Stazione Centrale" },
  { id: "dae-ge-pri", nome: "DAE Genova Piazza Principe", lat: 44.417, lng: 8.921, luogo: "Stazione Principe" },
  { id: "dae-pa-cent", nome: "DAE Palermo Centrale", lat: 38.11, lng: 13.366, luogo: "Stazione Centrale" },
  { id: "dae-ct-cent", nome: "DAE Catania Centrale", lat: 37.506, lng: 15.09, luogo: "Stazione Centrale" },
  { id: "dae-ba-cent", nome: "DAE Bari Centrale", lat: 41.1177, lng: 16.87, luogo: "Stazione Centrale" },
  { id: "dae-ve-sl", nome: "DAE Venezia Santa Lucia", lat: 45.441, lng: 12.321, luogo: "Stazione Santa Lucia" },
  { id: "dae-vr-port", nome: "DAE Verona Porta Nuova", lat: 45.429, lng: 10.982, luogo: "Stazione Porta Nuova" },
  { id: "dae-pd-cent", nome: "DAE Padova Centrale", lat: 45.417, lng: 11.88, luogo: "Stazione" },
  { id: "dae-ts-cent", nome: "DAE Trieste Centrale", lat: 45.657, lng: 13.772, luogo: "Stazione" },
  { id: "dae-an-cent", nome: "DAE Ancona", lat: 43.607, lng: 13.51, luogo: "Stazione" },
  { id: "dae-pe-cent", nome: "DAE Pescara Centrale", lat: 42.468, lng: 14.205, luogo: "Stazione" },
  { id: "dae-ca-cent", nome: "DAE Cagliari", lat: 39.215, lng: 9.114, luogo: "Stazione" },
  { id: "dae-li-cent", nome: "DAE Livorno Centrale", lat: 43.554, lng: 10.307, luogo: "Stazione" },
  { id: "dae-pi-cent", nome: "DAE Pisa Centrale", lat: 43.708, lng: 10.399, luogo: "Stazione" },
];

export function mergeDae(online: any[], lat: number, lng: number) {
  const seen = new Set(online.map((d) => `${d.lat.toFixed(4)}-${d.lng.toFixed(4)}`));
  const extra = DAE_OFFLINE.filter((d) => !seen.has(`${d.lat.toFixed(4)}-${d.lng.toFixed(4)}`)).map((d) => ({
    id: d.id,
    tipo: "dae",
    nome: d.nome,
    lat: d.lat,
    lng: d.lng,
    dist: 0,
    luogo: d.luogo + " · offline",
  }));
  const all = [...online, ...extra];
  for (const d of all) {
    const R = 6371;
    const p1 = (lat * Math.PI) / 180;
    const p2 = (d.lat * Math.PI) / 180;
    const dp = ((d.lat - lat) * Math.PI) / 180;
    const dl = ((d.lng - lng) * Math.PI) / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    d.dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  all.sort((a, b) => a.dist - b.dist);
  try {
    localStorage.setItem("dottor-dae", JSON.stringify(all.slice(0, 40)));
  } catch {}
  return all;
}

export function cachedDae() {
  try {
    const raw = localStorage.getItem("dottor-dae");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DAE_OFFLINE.map((d) => ({
    id: d.id,
    tipo: "dae",
    nome: d.nome,
    lat: d.lat,
    lng: d.lng,
    dist: 0,
    luogo: d.luogo + " · offline",
  }));
}
