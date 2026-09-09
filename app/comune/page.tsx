"use client";

export default function ComunePage() {
  return (
    <div className="min-h-screen bg-[#111] text-white p-6 font-sans">
      <p className="text-sm uppercase tracking-widest text-gray-400">Area enti · demo</p>
      <h1 className="text-3xl font-black mt-2">Dashboard DOTTOR SOS</h1>
      <p className="text-gray-300 mt-2 text-lg">Italia · zero pubblicità</p>
      <div className="grid md:grid-cols-4 gap-4 mt-8">
        {[
          ["Accessi mappa", "—"],
          ["Farmacie in anagrafe", "Ministero"],
          ["DAE in cache offline", "Sì"],
          ["Mappa senza API key", "OSM"],
        ].map(([k, v]) => (
          <div key={k} className="glass rounded-3xl p-6">
            <p className="text-white/60 text-base">{k}</p>
            <p className="text-3xl font-black mt-2">{v}</p>
          </div>
        ))}
      </div>
      <a href="/" className="inline-block mt-8 text-lg underline">Torna alla mappa</a>
    </div>
  );
}
