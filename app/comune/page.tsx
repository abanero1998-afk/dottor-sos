"use client";

export default function ComunePage() {
  return (
    <div className="min-h-screen bg-[#111] text-white p-6 font-sans">
      <p className="text-sm uppercase tracking-widest text-gray-400">Login Comune · demo</p>
      <h1 className="text-3xl font-black mt-2">Dashboard DOTTOR SOS</h1>
      <p className="text-gray-300 mt-2 text-lg">Collesalvetti · zero pubblicità · logo Comune</p>
      <div className="grid md:grid-cols-4 gap-4 mt-8">
        {[
          ["Chiamate SOS mese", "47"],
          ["Zone scoperte farmacie", "2"],
          ["DAE mancanti stimati", "5"],
          ["Vite supportate (stima)", "12"],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#1c1c1e] rounded-3xl p-6">
            <p className="text-gray-400 text-base">{k}</p>
            <p className="text-4xl font-black mt-2">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-[#1c1c1e] rounded-3xl p-6">
        <h2 className="text-2xl font-bold">Push al Comune</h2>
        <p className="text-gray-400 mt-2">Allerta caldo, farmacie aperte fino alle 22:00</p>
        <button className="mt-4 h-[60px] px-8 rounded-full bg-white text-black text-lg font-bold">Invia allerta (demo)</button>
      </div>
      <div className="mt-6 bg-[#1c1c1e] rounded-3xl p-6 h-64 flex items-center justify-center text-gray-400 text-lg">
        Mappa calore emergenze · layer da integrare con i check-in cittadini
      </div>
      <a href="/" className="inline-block mt-8 text-lg underline">Torna alla mappa</a>
    </div>
  );
}
