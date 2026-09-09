export const DRUGS = [
  { q: ["tachipirina 500", "tachipirina", "paracetamolo"], name: "Tachipirina 500 mg", price: "4,90 €", note: "OTC febbre/dolore" },
  { q: ["tachipirina 1000", "paracetamolo 1000"], name: "Tachipirina 1000 mg", price: "6,20 €", note: "OTC" },
  { q: ["nurofen", "ibuprofene"], name: "Nurofen 200 mg", price: "7,50 €", note: "OTC antinfiammatorio" },
  { q: ["moment", "ibuprofene 400"], name: "Moment 400 mg", price: "8,90 €", note: "SOP" },
  { q: ["augmentin", "amoxicillina"], name: "Augmentin", price: "su ricetta", note: "Ricetta obbligatoria" },
  { q: ["okiroki", "ketoprofene"], name: "Oki / ketoprofene", price: "6,80 €", note: "Dolore" },
  { q: ["gaviscon"], name: "Gaviscon", price: "7,20 €", note: "Reflusso" },
  { q: ["imodium", "loperamide"], name: "Imodium", price: "9,10 €", note: "Diarrea" },
  { q: ["enterogermina"], name: "Enterogermina", price: "8,40 €", note: "Fermenti" },
  { q: ["cetirizina", "reactine", "allergia"], name: "Cetirizina", price: "5,50 €", note: "Antistaminico" },
];

export function findDrug(text: string) {
  const t = text.toLowerCase();
  return DRUGS.find((d) => d.q.some((k) => t.includes(k))) || null;
}
