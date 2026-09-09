"use client";

import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistance } from "@/lib/geo";
import { STR, type Lang } from "@/lib/i18n";
import { findDrug } from "@/lib/drugs";
import BabyPanel from "@/components/BabyPanel";

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
function dot(bg: string, emoji: string) {
  return pinIcon(
    `<div style="width:42px;height:42px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.55);background:${bg};font-size:16px">${emoji}</div>`
  );
}

export default function DottorSOS() {
  const [lang, setLang] = useState<Lang>("it");
  const t = STR[lang];
  const [filter, setFilter] = useState("tutti");
  const [selected, setSelected] = useState<Poi | null>(null);
  const [address, setAddress] = useState("");
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
  const [babyOpen, setBabyOpen] = useState(false);
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
    fetch(`/api/geocode?lat=${pos.lat}&lng=${pos.lng}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.[0]) setAddress(d.results[0].label);
      })
      .catch(() => {});
  }, [pos]);

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

  const farmList = farmacie;
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
        <div className="max-w-5xl mx-auto flex flex-col gap-2 pointer-events-auto">
          <div className="glass rounded-[22px] px-3 py-3 flex items-center gap-3">
            <img src="/logo.svg" alt="DOTTOR SOS" className="w-14 h-14 rounded-[14px] shadow-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-black leading-none text-xl">DOTTOR SOS</p>
              <p className="text-sm text-white/70 truncate">{address || (offline ? t.offline : geoErr || t.subtitle)}</p>
            </div>
            <div className="flex gap-1">
              {(["it", "en", "sq"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`h-[44px] px-2 rounded-full font-bold text-sm ${lang === l ? "glass-btn-on" : "glass-btn"}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {layers.map((b) => (
              <button key={b.id} onClick={() => setFilter(b.id)} className={`h-[56px] px-5 rounded-full font-bold whitespace-nowrap ${filter === b.id ? "glass-btn-on" : "glass-btn"}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[400px] z-[500] flex flex-col gap-2">
        <div className="glass-strong rounded-[24px] p-4 max-h-[34vh] overflow-auto">
          <h3 className="font-black text-xl mb-2">{t.nearYou}</h3>
          {filter !== "ps" && filter !== "dae" && filter !== "medici" && filter !== "pedvet" &&
            farmList.slice(0, 7).map((f) => (
              <div key={f.id} onClick={() => setSelected(f)} className="flex justify-between items-center py-3 border-b border-white/15 cursor-pointer">
                <div>
                  <p className="font-bold">{f.nome}</p>
                  <p className="text-sm text-white/70">{formatDistance(f.dist)} · {f.chiusura}</p>
                </div>
                <span className="px-3 py-2 rounded-full font-black text-sm glass-chip">{f.aperta ? t.open : t.closed}</span>
              </div>
            ))}
          {filter === "ps" && ps.slice(0, 7).map((p) => (
            <div key={p.id} onClick={() => setSelected(p)} className="py-3 border-b border-white/15 cursor-pointer">
              <p className="font-bold">{p.nome}</p>
              <p className="text-white/70">{formatDistance(p.dist)} · {p.attesa}</p>
            </div>
          ))}
          {filter === "dae" && dae.slice(0, 7).map((d) => (
            <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b border-white/15 cursor-pointer">
              <p className="font-bold">{d.nome}</p>
              <p className="text-white/70">{formatDistance(d.dist)}</p>
            </div>
          ))}
          {filter === "medici" && medici.slice(0, 7).map((d) => (
            <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b border-white/15 cursor-pointer">
              <p className="font-bold">{d.nome}</p>
            </div>
          ))}
          {filter === "pedvet" && pedvet.slice(0, 7).map((d) => (
            <div key={d.id} onClick={() => setSelected(d)} className="py-3 border-b border-white/15 cursor-pointer">
              <p className="font-bold">{d.nome}</p>
            </div>
          ))}
          <p className="text-xs text-white/50 mt-3 text-center">{loading ? "…" : fonte}</p>
        </div>
        <div className="glass rounded-[22px] p-2 grid grid-cols-2 gap-2">
          <button onClick={() => setBabyOpen(true)} className="h-[56px] rounded-2xl font-black glass-btn">Bimbo</button>
          <button onClick={() => setDrugOpen(true)} className="h-[56px] rounded-2xl font-black glass-btn">{t.drug}</button>
          <button onClick={() => setChatOpen(true)} className="h-[56px] rounded-2xl font-black glass-btn-on">{t.nurse}</button>
          <button onClick={askGeo} className="h-[56px] rounded-2xl font-black glass-btn">{t.position}</button>
        </div>
      </div>

      {babyOpen && (
        <BabyPanel
          onClose={() => setBabyOpen(false)}
          onPickPharmacy={() => {
            setBabyOpen(false);
            setFilter("farmacie");
            const open = farmList.find((f) => f.aperta) || farmList[0];
            if (open) setSelected(open);
          }}
        />
      )}

      {chatOpen && (
        <div className="absolute inset-0 z-[1100] bg-black/20 flex items-end md:items-center justify-center p-4" onClick={() => setChatOpen(false)}>
          <div className="glass-strong rounded-[28px] w-full max-w-md h-[75vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 font-black text-xl flex items-center gap-3">
              <img src="/logo.svg" alt="" className="w-10 h-10 rounded-xl" />
              {t.nurse}
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`rounded-2xl px-4 py-3 glass ${m.role === "user" ? "ml-6" : ""}`}>{m.text}</div>
              ))}
            </div>
            <a href="tel:116117" className="mx-4 mb-2 h-[56px] rounded-full glass-btn-on font-black flex items-center justify-center">{t.speakGM}</a>
            <div className="p-3 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Sintomo o farmaco…" className="flex-1 glass rounded-full px-4 h-[56px] outline-none" />
              <button onClick={sendChat} className="h-[56px] px-5 rounded-full font-black glass-btn-on">OK</button>
            </div>
          </div>
        </div>
      )}

      {drugOpen && (
        <div className="absolute inset-0 z-[1100] bg-black/20 flex items-end md:items-center justify-center p-4" onClick={() => setDrugOpen(false)}>
          <div className="glass-strong rounded-[28px] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-black text-2xl">{t.drug}</h2>
            <input value={drugQ} onChange={(e) => setDrugQ(e.target.value)} placeholder="Tachipirina 500" className="mt-4 w-full h-[56px] rounded-2xl glass px-4 outline-none" />
            <button onClick={searchDrug} className="mt-3 w-full h-[56px] rounded-full font-black glass-btn-on">Cerca</button>
            {drugHit && (
              <div className="mt-4 p-4 glass rounded-2xl">
                <p className="font-black text-xl">{drugHit.name}</p>
                <p>{drugHit.price}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-black/20 flex items-end md:items-center justify-center z-[1000] p-4" onClick={() => setSelected(null)}>
          <div className="glass-strong rounded-[28px] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <p className="uppercase font-bold tracking-widest text-sm text-white/70">{selected.tipo} · {formatDistance(selected.dist)}</p>
            <h2 className="font-black text-2xl mt-1">{selected.nome}</h2>
            {selected.chiusura && <p className="mt-2 text-white/80">{selected.chiusura}</p>}
            {selected.attesa && <p className="mt-2 font-bold">{t.wait}: {selected.attesa}</p>}
            {selected.luogo && <p className="mt-2">{selected.luogo}</p>}
            {selected.tel && <a href={`tel:${selected.tel.replace(/\s/g, "")}`} className="mt-4 w-full h-[56px] rounded-full font-black glass-btn-on flex items-center justify-center">{t.call}</a>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer" className="mt-2 w-full h-[56px] rounded-full font-black glass-btn flex items-center justify-center">{t.directions}</a>
          </div>
        </div>
      )}
    </div>
  );
}
