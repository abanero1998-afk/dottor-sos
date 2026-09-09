"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FARMACIE = [
  { id: 1, nome: "Farmacia Comunale Colle Salvetti", lat: 43.594, lng: 10.476, aperta: true, chiusura: "19:30", tel: "0586 962XXX", farmaci: ["Tachipirina", "Augmentin"] },
  { id: 2, nome: "Farmacia del Corso Livorno", lat: 43.548, lng: 10.31, aperta: true, chiusura: "20:00", tel: "0586 88XXXX", farmaci: ["Tachipirina"] },
  { id: 3, nome: "Farmacia Parenti", lat: 43.6, lng: 10.48, aperta: false, chiusura: "Domani 08:30", tel: "0586 96XXXX", farmaci: [] as string[] },
];

const DAE = [
  { id: 1, nome: "DAE - Comune", lat: 43.595, lng: 10.477, luogo: "Ingresso Comune" },
  { id: 2, nome: "DAE - Conad", lat: 43.592, lng: 10.475, luogo: "Cassa 1" },
  { id: 3, nome: "DAE - Palazzetto", lat: 43.598, lng: 10.48, luogo: "Spogliatoi" },
];

const PS = [
  { id: 1, nome: "PS Livorno", lat: 43.552, lng: 10.325, attesa: "2h 15m", persone: 18, stato: "affollato" },
  { id: 2, nome: "PS Cecina", lat: 43.31, lng: 10.52, attesa: "45m", persone: 4, stato: "libero" },
];

type Selected =
  | ({ tipo: "farmacia" } & (typeof FARMACIE)[number])
  | ({ tipo: "dae" } & (typeof DAE)[number])
  | ({ tipo: "ps" } & (typeof PS)[number]);

function pinIcon(html: string, size = 40) {
  return L.divIcon({
    className: "custom-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 14, { duration: 0.8 });
  return null;
}

export default function DottorSOS() {
  const [filter, setFilter] = useState("tutti");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [searchFarmaco, setSearchFarmaco] = useState("");

  const farmacieFiltrate = FARMACIE.filter(
    (f) => !searchFarmaco || f.farmaci.join(" ").toLowerCase().includes(searchFarmaco.toLowerCase())
  );

  const listaFarmacie = filter === "ps" ? [] : farmacieFiltrate.filter((f) => filter === "tutti" || filter === "farmacie");

  const fly = useMemo(() => {
    if (!selected) return null;
    return { lat: selected.lat, lng: selected.lng };
  }, [selected]);

  return (
    <div className="w-full h-screen bg-[#F5F5F7] relative font-sans overflow-hidden">
      <MapContainer center={[43.594, 10.476]} zoom={13} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {fly && <FlyTo lat={fly.lat} lng={fly.lng} />}

        {(filter === "tutti" || filter === "farmacie") &&
          farmacieFiltrate.map((f) => (
            <Marker
              key={`f-${f.id}`}
              position={[f.lat, f.lng]}
              icon={pinIcon(
                `<div style="width:40px;height:40px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:${f.aperta ? "#22c55e" : "#f87171"};cursor:pointer">💊</div>`
              )}
              eventHandlers={{ click: () => setSelected({ ...f, tipo: "farmacia" }) }}
            />
          ))}

        {(filter === "tutti" || filter === "dae") &&
          DAE.map((d) => (
            <Marker
              key={`d-${d.id}`}
              position={[d.lat, d.lng]}
              icon={pinIcon(
                `<div style="width:40px;height:40px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:#2563eb;cursor:pointer">⚡</div>`
              )}
              eventHandlers={{ click: () => setSelected({ ...d, tipo: "dae" }) }}
            />
          ))}

        {(filter === "tutti" || filter === "ps") &&
          PS.map((p) => (
            <Marker
              key={`p-${p.id}`}
              position={[p.lat, p.lng]}
              icon={pinIcon(
                `<div style="width:48px;height:48px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.2);border:2px solid white;background:${p.stato === "libero" ? "#16a34a" : "#f97316"};cursor:pointer">${p.attesa}</div>`,
                48
              )}
              eventHandlers={{ click: () => setSelected({ ...p, tipo: "ps" }) }}
            />
          ))}
      </MapContainer>

      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-[500]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 pointer-events-auto">
          <div className="bg-white rounded-[20px] shadow-xl px-5 py-3 flex items-center gap-4 flex-1">
            <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white font-black">+</div>
            <div>
              <p className="font-bold leading-none">DOTTOR SOS</p>
              <p className="text-xs text-gray-500">Comune di Collesalvetti · Dati demo</p>
            </div>
            <div className="ml-auto hidden md:flex gap-2">
              {[
                { id: "tutti", label: "Tutti" },
                { id: "farmacie", label: "💊 Farmacie" },
                { id: "dae", label: "⚡ DAE" },
                { id: "ps", label: "🏥 Pronto Soccorso" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setFilter(b.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${filter === b.id ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-xl px-5 py-3 flex items-center gap-2">
            <span>🔍</span>
            <input
              value={searchFarmaco}
              onChange={(e) => setSearchFarmaco(e.target.value)}
              placeholder="Cerca farmaco: Tachipirina..."
              className="outline-none w-[220px] text-sm"
            />
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-3 flex md:hidden gap-2 pointer-events-auto overflow-x-auto">
          {[
            { id: "tutti", label: "Tutti" },
            { id: "farmacie", label: "Farmacie" },
            { id: "dae", label: "DAE" },
            { id: "ps", label: "PS" },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setFilter(b.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap ${filter === b.id ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[380px] bg-white rounded-[24px] shadow-2xl p-4 max-h-[50vh] overflow-auto z-[500]">
        <h3 className="font-bold text-[15px] mb-3">Vicino a te ora</h3>
        {listaFarmacie.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelected({ ...f, tipo: "farmacia" })}
            className="flex justify-between items-center py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-xl px-2"
          >
            <div>
              <p className="font-semibold text-sm">{f.nome}</p>
              <p className="text-xs text-gray-500">Chiude {f.chiusura} · {f.tel}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${f.aperta ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {f.aperta ? "APERTA" : "CHIUSA"}
            </span>
          </div>
        ))}
        {filter === "ps" &&
          PS.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected({ ...p, tipo: "ps" })}
              className="flex justify-between items-center py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-xl px-2"
            >
              <div>
                <p className="font-semibold text-sm">{p.nome}</p>
                <p className="text-xs text-gray-500">{p.persone} persone in attesa</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${p.stato === "libero" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                {p.attesa}
              </span>
            </div>
          ))}
        {filter === "dae" &&
          DAE.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected({ ...d, tipo: "dae" })}
              className="py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-xl px-2"
            >
              <p className="font-semibold text-sm">{d.nome}</p>
              <p className="text-xs text-gray-500">{d.luogo}</p>
            </div>
          ))}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-xs text-blue-600">DAE più vicino</p>
            <p className="font-bold text-sm">30 metri - Comune</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3">
            <p className="text-xs text-orange-600">PS consigliato</p>
            <p className="font-bold text-sm">Cecina - 45m attesa</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">Dati demo · Adatto a tutti, font grande, contrasto alto</p>
      </div>

      {selected && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center z-[1000] p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-2 w-full bg-black" />
            <div className="p-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{selected.tipo}</p>
              <h2 className="font-bold text-xl mt-1">{selected.nome}</h2>
              {selected.tipo === "farmacia" && (
                <>
                  <p className="text-sm mt-2">📞 {selected.tel} · Chiude {selected.chiusura}</p>
                  {selected.farmaci.length > 0 && (
                    <p className="text-sm mt-1 text-gray-600">In stock: {selected.farmaci.join(", ")}</p>
                  )}
                  <a href={`tel:${selected.tel.replace(/\s/g, "")}`} className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold block text-center">
                    Chiama Farmacia
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full bg-gray-100 rounded-full py-4 font-bold block text-center"
                  >
                    Indicazioni
                  </a>
                </>
              )}
              {selected.tipo === "dae" && (
                <>
                  <p className="text-sm mt-2">📍 {selected.luogo}</p>
                  <div className="mt-4 bg-blue-50 rounded-2xl p-4 text-sm">1. Apri teca 2. Accendi 3. Segui voce. Video 30 sec su come usarlo.</div>
                  <a
                    href="https://www.youtube.com/results?search_query=come+usare+defibrillatore+DAE"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full bg-blue-600 text-white rounded-full py-4 font-bold block text-center"
                  >
                    Vedi Video Istruzioni
                  </a>
                </>
              )}
              {selected.tipo === "ps" && (
                <>
                  <p className="text-sm mt-2">
                    ⏱ Attesa: <b>{selected.attesa}</b> · {selected.persone} persone davanti
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded-2xl p-3 text-center">
                      <p className="text-xs">Meno affollato</p>
                      <p className="font-bold">Cecina 45m</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full bg-black text-white rounded-full py-4 font-bold block text-center"
                  >
                    Naviga al PS
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
