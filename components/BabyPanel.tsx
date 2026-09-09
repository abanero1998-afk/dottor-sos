"use client";

import { useMemo, useState } from "react";
import { BABY, CATS, searchBaby, type BabyProduct } from "@/lib/baby";

export default function BabyPanel({
  onClose,
  onPickPharmacy,
}: {
  onClose: () => void;
  onPickPharmacy: (product: BabyProduct) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const list = useMemo(() => {
    const base = searchBaby(q);
    return cat === "all" ? base : base.filter((p) => p.cat === cat);
  }, [q, cat]);

  return (
    <div className="absolute inset-0 z-[1100] bg-black/50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white text-black rounded-[28px] w-full max-w-md max-h-[82vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-black text-2xl">Bimbo: latte e necessario</h2>
        <p className="text-base text-black/70 mt-1">Catalogo orientativo. La giacenza vera la conferma la farmacia.</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Aptamil, febbre, pannolini…"
          className="mt-3 w-full h-[60px] rounded-2xl border-2 px-4"
        />
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
          <button onClick={() => setCat("all")} className={`h-[48px] px-4 rounded-full font-bold border-2 whitespace-nowrap ${cat === "all" ? "bg-black text-white" : "bg-white"}`}>
            Tutto
          </button>
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`h-[48px] px-4 rounded-full font-bold border-2 whitespace-nowrap ${cat === c.id ? "bg-black text-white" : "bg-white"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => onPickPharmacy(p)}
              className="w-full text-left p-4 rounded-2xl border-2 hover:bg-violet-50"
            >
              <p className="font-black text-lg">{p.name}</p>
              <p className="text-base">{p.age} · {p.price}</p>
              <p className="text-sm text-black/70 mt-1">{p.note}</p>
              <p className="mt-2 font-bold text-violet-800">Trova in farmacia vicina →</p>
            </button>
          ))}
          {list.length === 0 && <p className="p-4">Nessun prodotto. Prova “latte” o “febbre”.</p>}
        </div>
        <p className="text-sm text-black/50 mt-3">Sotto i 3 mesi con febbre: pediatra o PS. Allattamento al seno va protetto, la formula è alternativa non obbligatoria.</p>
      </div>
    </div>
  );
}
