"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistance } from "@/lib/geo";
import { STR, type Lang } from "@/lib/i18n";
import { findDrug } from "@/lib/drugs";

type Poi = {
  id: string; tipo: string; nome: string; lat: number; lng: number; dist: number;
  tel?: string; addr?: string; aperta?: boolean; chiusura?: string; orari?: string;
  luogo?: string; attesa?: string; persone?: number; stato?: string; min?: number;
};

function pinIcon(html: string, size = 40) {
  return L.divIcon({ className: "custom-pin", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
  }, [lat, lng, map]);
  return null;
}
function dot(bg: string, emoji: string, extra = "") {
  return pinIcon(
    `<div style="width:42px;height:42px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.35);border:3px solid white;background:${bg};font-size:16px">${emoji}${extra}</div>`
  );
}

export default function DottorSOS() {
  const [lang, setLang] = useState<Lang>("it");
  const t = STR[lang];
  const [filter, setFilter] = useState("tutti");
  const [selected, setSelected] = useState<Poi | null>(null);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [farmacie, setFarmacie] = useState<Poi[]>([]);
  const [dae, setDae] = useState<Poi[]>([]);
  const [ps, setPs] = useState<Poi[]>([]);
  const [medici, setMedici] = useState<Poi[]>([]);
  const [pedvet, setPedvet] = useState<Poi[]>([]);
  const [fonte, setFonte] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [drugOpen, setDrugOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [drugQ, setDrugQ] = useState("");
  const [drugHit, setDrugHit] = useState<ReturnType<typeof findDrug>>(null);
  const [deaf, setDeaf] = useState(false);
  const [flash, setFlash] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "nurse"; text: string }[]>([]);

  useEffect(() => {
    setMessages([{ role: "nurse", text: t.disclaimer }]);
  }, [t.disclaimer]);

  const pulse = useCallback(() => {
    if (!deaf) return;
    setFlash(true);
    navigator.vibrate?.([200, 80, 200]);
    setTimeout(() => setFlash(false), 900);
  }, [deaf]);

  const askGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setPos({ lat: 43.594, lng: 10.476 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoErr("");
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        setGeoErr("GPS off — Collesalvetti");
        setPos({ lat: 43.594, lng: 10.476 });
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
        setMedici(d.medici || []);
        setPedvet(d.pedvet || []);
        setFonte(d.fonte || "");
        setOffline(false);
        localStorage.setItem("dottor-cache", JSON.stringify(d));
      })
      .catch(() => {
        const raw = localStorage.getItem("dottor-cache");
        if (raw) {
          const d = JSON.parse(raw);
          setFarmacie(d.farmacie || []);
          setDae(d.dae || []);
          setPs(d.ospedali || []);
          setMedici(d.medici || []);
          setPedvet(d.pedvet || []);
          setOffline(true);
        }
      })
      .finally(() => !stop && setLoading(false));
    return () => {
      stop = true;
    };
  }, [pos]);

  const q = search.toLowerCase();
  const farmList = farmacie.filter((f) => !q || f.nome.toLowerCase().includes(q) || (f.addr || "").toLowerCase().includes(q));
  const bestPs = [...ps].sort((a, b) => (a.min || 99) - (b.min || 99) || a.dist - b.dist)[0];
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
    pulse();
    if (data.nearest) setSelected(data.nearest);
  }

  function searchDrug() {
    const hit = findDrug(drugQ);
    setDrugHit(hit);
    pulse();
    const open = farmList.find((f) => f.aperta) || farmList[0];
    if (open) setSelected(open);
  }

  const layers = [
    { id: "tutti", label: t.all },
    { id: "farmacie", label: "💊 " + t.pharmacies },
    { id: "dae", label: "⚡ " + t.dae },
    { id: "ps", label: "🏥 " + t.er },
    { id: "medici", label: "💛 " + t.doctors },
    { id: "pedvet", label: "💜 " + t.kidsVet },
  ];

  return (
    <div className="w-full h-screen bg-black relative font-sans overflow-hidden text-[18px]">
      {flash && <div className="absolute inset-0 z-[2000] deaf-flash" />}
      {pos && (
        <MapContainer center={[pos.lat, pos.lng]} zoom={14} className="w-full h-full" zoomControl={false}>
          <TileLayer attribution="&copy; OSM" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {fly && <FlyTo lat={fly.lat} lng={fly.lng} />}
          <CircleMarker center={[pos.lat, pos.lng]} radius={10} pathOptions={{ color: "#fff", fillColor: "#3b82f6", fillOpacity: 1 }} />
          {(filter === "tutti" || filter === "farmacie") &&
            farmList.map((f) => (
              <Marker key={f.id} position={[f.lat, f.lng]} icon={dot(f.aperta ? "#16a34a" : "#b91c1c", "💊")} eventHandlers={{ click: () => { setSelected(f); pulse(); } }} />
            ))}
          {(filter === "tutti" || filter === "dae") &&
            dae.map((d) => (
              <Marker key={d.id} position={[d.lat, d.lng]} icon={dot("#2563eb", "⚡")} eventHandlers={{ click: () => setSelected(d) }} />
            ))}
          {(filter === "tutti" || filter === "ps") &&
            ps.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={dot("#dc2626", "🏥")} eventHandlers={{ click: () => setSelected(p) }} />
            ))}
          {(filter === "tutti" || filter === "medici") &&
            medici.map((m) => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={dot("#ca8a04", "👨")} eventHandlers={{ click: () => setSelected(m) }} />
            ))}
          {(filter === "tutti" || filter === "pedvet") &&
            pedvet.map((m) => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={dot("#7c3aed", m.tipo === "vet" ? "🐾" : "👶")} eventHandlers={{ click: () => setSelected(m) }} />
            ))}
        </MapContainer>
      )}

      <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none z-[500]">
        <div className="max-w-6xl mx-auto flex flex-col gap-2 pointer-events-auto">
          <div className="bg-white text-black rounded-[20px] shadow-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-2xl">+</div>
            <div>
              <p className="font-black leading-none text-xl">{t.title}</p>
              <p className="text-base text-black/70">{offline ? t.offline : geoErr || t.subtitle}</p>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              {(["it", "en", "sq"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`h-[48px] px-3 rounded-full font-bold border-2 ${lang === l ? "bg-black text-white" : "bg-white"}`}>{l.toUpperCase()}</button>
              ))}
              <button onClick={() => { setDeaf(!deaf); pulse(); }} className={`h-[48px] px-3 rounded-full font-bold border-2 ${deaf ? "bg-yellow-300" : "bg-white"}`}>{t.deaf}</button>
              <a href="/comune" className="h-[48px] px-3 rounded-full font-bold border-2 flex items-center">{t.dashboard}</a>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {layers.map((b) => (
              <button key={b.id} onClick={() => setFilter(b.id)} className={`h-[60px] px-5 rounded-full font-bold border-2 whitespace-nowrap ${filter === b.id ? "bg-white text-black" : "bg-black/70 text-white border-white"}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[420px] bg-white text-black rounded-[24px] shadow-2xl p-4 max-h-[42vh] overflow-auto z-[500]">
        <h3 className="font-black text-xl mb-2">{t.nearYou}</h3>
        {bestPs && (
          <div className="bg-red-50 border-2 border-red-700 rounded-2xl p-3 mb-3">
            <p className="font-bold">{t.er}: {ps[0]?.nome} · {ps[0]?.attesa} · {ps[0]?.persone} pax</p>
            {bestPs.id !== ps[0]?.id && (
              <p className="text-base mt-1">{t.better} {bestPs.nome} ({bestPs.attesa})</p>
            )}
          </div>
        )}
        {filter !== "ps" && filter !== "dae" && filter !== "medici" && filter !== "pedvet" &&
          farmList.slice(0, 8).map((f) => (
            <div key={f.id} onClick={() => setSelected(f)} className="flex justify-between items-center py-3 border-b cursor-pointer">
              <div>
                <p className="font-bold">{f.nome}</p>
                <p className="text-base text-black/70">{formatDistance(f.dist)} · {f.chiusura}</p>
              </div>
              <span className={`px-3 py-2 rounded-full font-black text-sm ${f.aperta ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>{f.aperta ? t.open : t.closed}</span>
            </div>
          ))}
        {filter === "ps" && ps.slice(0, 8).map((p) => (
          <div key={p.id} onClick={() => setSelected(p)} className="py-3 border-b cursor-pointer">
            <p className="font-bold">{p.nome}</p>
            <p>{formatDistance(p.dist)} · {t.wait} {p.attesa} · {p.persone} pax</p>
          </div>
        ))}
        {filter === "dae" && dae.slice(0, 8).map((d) => (
          <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b cursor-pointer">
            <p className="font-bold">{d.nome}</p>
            <p>{formatDistance(d.dist)} · {d.luogo}</p>
          </div>
        ))}
        {filter === "medici" && medici.slice(0, 8).map((d) => (
          <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b cursor-pointer">
            <p className="font-bold">{d.nome}</p>
            <p>{formatDistance(d.dist)} {d.tel ? `· ${d.tel}` : ""}</p>
          </div>
        ))}
        {filter === "pedvet" && pedvet.slice(0, 8).map((d) => (
          <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b cursor-pointer">
            <p className="font-bold">{d.nome} · {d.tipo}</p>
            <p>{formatDistance(d.dist)}</p>
          </div>
        ))}
        <p className="text-sm text-black/50 mt-3 text-center">{loading ? "…" : fonte}</p>
      </div>

      <div className="absolute bottom-4 right-4 z-[600] flex flex-col gap-2">
        <button onClick={() => setDrugOpen(true)} className="h-[60px] px-6 bg-white text-black rounded-full font-black shadow-2xl border-2 border-black">{t.drug}</button>
        <button onClick={() => setChatOpen(true)} className="h-[60px] px-6 bg-black text-white rounded-full font-black shadow-2xl border-2 border-white">{t.nurse}</button>
        <button onClick={askGeo} className="h-[60px] px-6 bg-blue-700 text-white rounded-full font-black shadow-2xl">{t.position}</button>
      </div>

      {chatOpen && (
        <div className="absolute inset-0 z-[1100] bg-black/50 flex items-end md:items-center justify-center p-4" onClick={() => setChatOpen(false)}>
          <div className="bg-white rounded-[28px] w-full max-w-md h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b font-black text-xl">{t.nurse}</div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`rounded-2xl px-4 py-3 ${m.role === "nurse" ? "bg-blue-100" : "bg-gray-200 ml-6"}`}>{m.text}</div>
              ))}
            </div>
            <a href="tel:116117" className="mx-4 mb-2 h-[60px] rounded-full bg-yellow-400 text-black font-black flex items-center justify-center">{t.speakGM}</a>
            <div className="p-3 flex gap-2 border-t">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Febbre / Tachipirina…" className="flex-1 bg-gray-100 rounded-full px-4 h-[60px]" />
              <button onClick={sendChat} className="h-[60px] px-5 bg-black text-white rounded-full font-black">OK</button>
            </div>
          </div>
        </div>
      )}

      {drugOpen && (
        <div className="absolute inset-0 z-[1100] bg-black/50 flex items-end md:items-center justify-center p-4" onClick={() => setDrugOpen(false)}>
          <div className="bg-white rounded-[28px] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-black text-2xl">{t.drug}</h2>
            <input value={drugQ} onChange={(e) => setDrugQ(e.target.value)} placeholder="Tachipirina 500" className="mt-4 w-full h-[60px] rounded-2xl border-2 px-4" />
            <button onClick={searchDrug} className="mt-3 w-full h-[60px] bg-black text-white rounded-full font-black">Cerca</button>
            <label className="mt-3 w-full h-[60px] bg-gray-100 rounded-full font-bold flex items-center justify-center cursor-pointer">
              {t.scan}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => setDrugQ((q) => q || "Tachipirina 500")} />
            </label>
            {drugHit && (
              <div className="mt-4 p-4 bg-green-50 rounded-2xl border-2 border-green-800">
                <p className="font-black text-xl">{drugHit.name}</p>
                <p>Prezzo indicativo: {drugHit.price}</p>
                <p className="text-base mt-1">{drugHit.note}. Giacenza reale non è pubblica: ti porto alla farmacia aperta più vicina.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-black/40 flex items-end md:items-center justify-center z-[1000] p-4" onClick={() => setSelected(null)}>
          <div className="bg-white text-black rounded-[28px] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <p className="uppercase font-bold tracking-widest text-base">{selected.tipo} · {formatDistance(selected.dist)}</p>
            <h2 className="font-black text-2xl mt-1">{selected.nome}</h2>
            {selected.chiusura && <p className="mt-2">{selected.chiusura}</p>}
            {selected.attesa && <p className="mt-2 font-bold text-red-700">{t.wait}: {selected.attesa} · {selected.persone} pax</p>}
            {selected.luogo && <p className="mt-2">{selected.luogo}</p>}
            {selected.tipo === "dae" && (
              <div className="mt-3 bg-blue-50 p-4 rounded-2xl">1. Apri teca 2. Accendi 3. Segui la voce
                <a className="block mt-2 underline font-bold" href="https://www.youtube.com/results?search_query=uso+defibrillatore+DAE" target="_blank" rel="noreferrer">Video 30s</a>
              </div>
            )}
            {selected.tel && <a href={`tel:${selected.tel.replace(/\s/g, "")}`} className="mt-4 w-full h-[60px] bg-black text-white rounded-full font-black flex items-center justify-center">{t.call}</a>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer" className="mt-2 w-full h-[60px] bg-gray-200 rounded-full font-black flex items-center justify-center">{t.directions}</a>
          </div>
        </div>
      )}
    </div>
  );
}
