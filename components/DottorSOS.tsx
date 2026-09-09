"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistance } from "@/lib/geo";

type Farmacia = {
  id: string; tipo: "farmacia"; nome: string; lat: number; lng: number; dist: number;
  tel: string; addr: string; aperta: boolean; chiusura: string; orari: string;
};
type Dae = { id: string; tipo: "dae"; nome: string; lat: number; lng: number; dist: number; luogo: string };
type Ps = { id: string; tipo: "ps"; nome: string; lat: number; lng: number; dist: number; tel: string; addr: string; emergency?: boolean };
type Selected = Farmacia | Dae | Ps;

function pinIcon(html: string, size = 40) {
  return L.divIcon({ className: "custom-pin", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? Math.max(map.getZoom(), 14), { duration: 0.7 });
  }, [lat, lng, zoom, map]);
  return null;
}

export default function DottorSOS() {
  const [filter, setFilter] = useState("tutti");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [farmacie, setFarmacie] = useState<Farmacia[]>([]);
  const [dae, setDae] = useState<Dae[]>([]);
  const [ps, setPs] = useState<Ps[]>([]);
  const [fonte, setFonte] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "nurse"; text: string }[]>([
    { role: "nurse", text: "Sono l’infermiere virtuale DOTTOR SOS. Dimmi un sintomo o un farmaco: ti porto alla farmacia o all’ospedale più vicino in Italia. Per emergenze chiama 118." },
  ]);

  const askGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoErr("Geolocalizzazione non supportata");
      setPos({ lat: 41.9028, lng: 12.4964 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoErr("");
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        setGeoErr("Posizione negata — uso Roma. Consenti la geo per dati intorno a te.");
        setPos({ lat: 41.9028, lng: 12.4964 });
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  useEffect(() => {
    askGeo();
  }, [askGeo]);

  useEffect(() => {
    if (!pos) return;
    let stop = false;
    setLoading(true);
    fetch(`/api/nearby?lat=${pos.lat}&lng=${pos.lng}`)
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        setFarmacie(d.farmacie || []);
        setDae(d.dae || []);
        setPs(d.ospedali || []);
        setFonte(d.fonte || "");
      })
      .catch(() => {
        if (!stop) setFonte("Errore rete dati OSM");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [pos]);

  const q = search.toLowerCase();
  const farmacieFiltrate = farmacie.filter(
    (f) => !q || f.nome.toLowerCase().includes(q) || f.addr.toLowerCase().includes(q) || f.orari.toLowerCase().includes(q)
  );

  const lista = useMemo(() => {
    if (filter === "farmacie" || filter === "tutti") return farmacieFiltrate;
    return [];
  }, [filter, farmacieFiltrate]);

  const fly = selected || pos;

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    const res = await fetch("/api/nurse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lat: pos?.lat, lng: pos?.lng }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "nurse", text: data.reply }]);
    if (data.nearest) {
      setSelected(data.nearest);
      if (data.nearest.tipo === "farmacia") setFilter("farmacie");
      if (data.nearest.tipo === "ps") setFilter("ps");
    }
  }

  return (
    <div className="w-full h-screen bg-[#F5F5F7] relative font-sans overflow-hidden">
      {pos && (
        <MapContainer center={[pos.lat, pos.lng]} zoom={14} className="w-full h-full" zoomControl={false}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {fly && <FlyTo lat={fly.lat} lng={fly.lng} />}
          <CircleMarker center={[pos.lat, pos.lng]} radius={9} pathOptions={{ color: "#111", fillColor: "#3b82f6", fillOpacity: 1 }} />

          {(filter === "tutti" || filter === "farmacie") &&
            farmacieFiltrate.map((f) => (
              <Marker
                key={f.id}
                position={[f.lat, f.lng]}
                icon={pinIcon(
                  `<div style="width:40px;height:40px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:${f.aperta ? "#22c55e" : "#f87171"};cursor:pointer">💊</div>`
                )}
                eventHandlers={{ click: () => setSelected(f) }}
              />
            ))}
          {(filter === "tutti" || filter === "dae") &&
            dae.map((d) => (
              <Marker
                key={d.id}
                position={[d.lat, d.lng]}
                icon={pinIcon(
                  `<div style="width:40px;height:40px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:#2563eb;cursor:pointer">⚡</div>`
                )}
                eventHandlers={{ click: () => setSelected(d) }}
              />
            ))}
          {(filter === "tutti" || filter === "ps") &&
            ps.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={pinIcon(
                  `<div style="width:44px;height:44px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:#f97316;cursor:pointer">🏥</div>`,
                  44
                )}
                eventHandlers={{ click: () => setSelected(p) }}
              />
            ))}
        </MapContainer>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-[500]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 pointer-events-auto">
          <div className="bg-white rounded-[20px] shadow-xl px-5 py-3 flex items-center gap-4 flex-1">
            <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white font-black">+</div>
            <div>
              <p className="font-bold leading-none">DOTTOR SOS</p>
              <p className="text-xs text-gray-500">{loading ? "Aggiorno punti vicini…" : geoErr || "Italia · OSM live intorno a te"}</p>
            </div>
            <button onClick={askGeo} className="ml-auto text-xs font-bold px-3 py-2 rounded-full border">
              📍 Posizione
            </button>
            <div className="hidden lg:flex gap-2">
              {[
                { id: "tutti", label: "Tutti" },
                { id: "farmacie", label: "💊 Farmacie" },
                { id: "dae", label: "⚡ DAE" },
                { id: "ps", label: "🏥 Ospedali" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setFilter(b.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${filter === b.id ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-xl px-5 py-3 flex items-center gap-2">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtra farmacia / comune…" className="outline-none w-[200px] text-sm" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[400px] bg-white rounded-[24px] shadow-2xl p-4 max-h-[46vh] overflow-auto z-[500]">
        <h3 className="font-bold text-[15px] mb-3">Vicino a te ora {loading ? "…" : `(${farmacie.length} farmacie)`}</h3>
        {filter !== "ps" && filter !== "dae" &&
          lista.slice(0, 12).map((f) => (
            <div key={f.id} onClick={() => setSelected(f)} className="flex justify-between items-center py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-xl px-2">
              <div>
                <p className="font-semibold text-sm">{f.nome}</p>
                <p className="text-xs text-gray-500">{formatDistance(f.dist)} · {f.chiusura}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${f.aperta ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {f.aperta ? "APERTA" : "CHIUSA / N.D."}
              </span>
            </div>
          ))}
        {filter === "ps" &&
          ps.slice(0, 12).map((p) => (
            <div key={p.id} onClick={() => setSelected(p)} className="py-3 border-b cursor-pointer hover:bg-gray-50 rounded-xl px-2">
              <p className="font-semibold text-sm">{p.nome}</p>
              <p className="text-xs text-gray-500">{formatDistance(p.dist)} · {p.addr}</p>
            </div>
          ))}
        {filter === "dae" &&
          dae.slice(0, 12).map((d) => (
            <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b cursor-pointer hover:bg-gray-50 rounded-xl px-2">
              <p className="font-semibold text-sm">{d.nome}</p>
              <p className="text-xs text-gray-500">{formatDistance(d.dist)} · {d.luogo}</p>
            </div>
          ))}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-xs text-blue-600">DAE più vicino</p>
            <p className="font-bold text-sm">{dae[0] ? `${formatDistance(dae[0].dist)} · ${dae[0].nome}` : "Nessun DAE mappato vicino"}</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3">
            <p className="text-xs text-orange-600">Ospedale / PS</p>
            <p className="font-bold text-sm">{ps[0] ? `${formatDistance(ps[0].dist)} · ${ps[0].nome}` : "Nessun ospedale vicino"}</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">{fonte || "OpenStreetMap"} · Verifica sempre in farmacia i turni notturni</p>
      </div>

      <button
        onClick={() => setChatOpen(true)}
        className="absolute bottom-4 right-4 z-[600] bg-black text-white rounded-full px-5 py-4 font-bold shadow-2xl"
      >
        Infermiere IA
      </button>

      {chatOpen && (
        <div className="absolute inset-0 z-[1100] bg-black/30 flex items-end md:items-center justify-center p-4" onClick={() => setChatOpen(false)}>
          <div className="bg-white rounded-[28px] w-full max-w-md h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b font-bold">Infermiere IA · non sostituisce il 118</div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm rounded-2xl px-3 py-2 ${m.role === "nurse" ? "bg-blue-50" : "bg-gray-100 ml-8"}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2 border-t">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Es. ho febbre / cerco Tachipirina"
                className="flex-1 outline-none bg-gray-100 rounded-full px-4 py-3 text-sm"
              />
              <button onClick={sendChat} className="bg-black text-white rounded-full px-4 font-bold">
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center z-[1000] p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-2 w-full bg-black" />
            <div className="p-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{selected.tipo} · {formatDistance(selected.dist)}</p>
              <h2 className="font-bold text-xl mt-1">{selected.nome}</h2>
              {selected.tipo === "farmacia" && (
                <>
                  <p className="text-sm mt-2">{selected.chiusura}</p>
                  <p className="text-xs text-gray-500 mt-1">{selected.orari}</p>
                  {selected.tel && <p className="text-sm mt-2">📞 {selected.tel}</p>}
                  {selected.tel && (
                    <a href={`tel:${selected.tel.replace(/\s/g, "")}`} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold block text-center">
                      Chiama Farmacia
                    </a>
                  )}
                </>
              )}
              {selected.tipo === "dae" && <p className="text-sm mt-2">📍 {selected.luogo}</p>}
              {selected.tipo === "ps" && selected.tel && <p className="text-sm mt-2">📞 {selected.tel}</p>}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full bg-gray-100 rounded-full py-4 font-bold block text-center"
              >
                Indicazioni
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
