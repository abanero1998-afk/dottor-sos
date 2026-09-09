export type BabyProduct = {
  id: string;
  name: string;
  cat: "latte" | "svezzamento" | "febbre" | "igiene" | "pelle" | "sonno" | "allattamento";
  age: string;
  price: string;
  note: string;
  keys: string[];
};

export const BABY: BabyProduct[] = [
  { id: "aptamil1", name: "Aptamil 1 Profutura", cat: "latte", age: "0-6 mesi", price: "≈ 24 €", note: "Latte formula 1. Non sostituisce il latte materno se disponibile.", keys: ["aptamil", "latte 1", "formula 1", "neonato"] },
  { id: "aptamil2", name: "Aptamil 2", cat: "latte", age: "6-12 mesi", price: "≈ 22 €", note: "Proseguimento dopo i 6 mesi.", keys: ["aptamil 2", "latte 2"] },
  { id: "nido", name: "Nidina / NAN Optipro 1", cat: "latte", age: "0-6 mesi", price: "≈ 23 €", note: "Formula starter Nestlé.", keys: ["nidina", "nan", "nestle latte"] },
  { id: "mellin1", name: "Mellin 1", cat: "latte", age: "0-6 mesi", price: "≈ 19 €", note: "Formula 1 comune in farmacia.", keys: ["mellin", "latte mellin"] },
  { id: "humanalatte", name: "Humana 1", cat: "latte", age: "0-6 mesi", price: "≈ 21 €", note: "Formula 1.", keys: ["humana"] },
  { id: "planta", name: "Latte di soia / riso infanzia", cat: "latte", age: "su indicazione", price: "≈ 26 €", note: "Solo se allergia/intolleranza certificata dal pediatra.", keys: ["soia", "riso", "allergia latte", "aplv"] },
  { id: "ha", name: "Latte HA / idrolizzato", cat: "latte", age: "su indicazione", price: "≈ 28 €", note: "Per rischio allergico. Chiedi al pediatra prima di cambiare.", keys: ["ha", "idrolizzato", "allergia"] },
  { id: "arv", name: "Latte AR anti-rigurgito", cat: "latte", age: "0-12 mesi", price: "≈ 25 €", note: "Addensato per reflusso lieve. Se scarso accrescimento → pediatra.", keys: ["rigurgito", "reflusso", "ar ", "anti rigurgito"] },
  { id: "homo", name: "Latte di crescita 3", cat: "latte", age: "12+ mesi", price: "≈ 16 €", note: "Dopo l’anno si può usare anche latte vaccino intero se il pediatra è d’accordo.", keys: ["crescita", "latte 3", "12 mesi"] },
  { id: "omogeneizzato", name: "Omogeneizzato carne/verdure", cat: "svezzamento", age: "4-6 mesi+", price: "≈ 1,50 €", note: "Svezzamento. Introduci un alimento alla volta.", keys: ["omogeneizzato", "svezzamento", "pappa"] },
  { id: "crema", name: "Crema di riso / mais e tapioca", cat: "svezzamento", age: "4 mesi+", price: "≈ 4 €", note: "Primo cereale senza glutine.", keys: ["crema riso", "cereali", "tapioca"] },
  { id: "tachi", name: "Tachipirina neonati gocce / sciroppo", cat: "febbre", age: "dal peso in etichetta", price: "≈ 6 €", note: "Dose dal peso, mai a occhio. No aspirina sotto i 16 anni.", keys: ["tachipirina", "paracetamolo", "febbre", "gocce"] },
  { id: "nurofenbb", name: "Nurofen bambini sciroppo", cat: "febbre", age: ">3 mesi / peso min.", price: "≈ 8 €", note: "Ibuprofene pediatrico. Evitare se disidratato o varicella.", keys: ["nurofen bambini", "ibuprofene bimbo"] },
  { id: "fisiol", name: "Soluzione fisiologica / lavaggi nasali", cat: "igiene", age: "0+", price: "≈ 5 €", note: "Naso chiuso del lattante: lavaggi, no decongestionanti spray adulti.", keys: ["fisiologica", "naso", "lavaggio", "acqua mare"] },
  { id: "sonda", name: "Aspiratore nasale", cat: "igiene", age: "0+", price: "≈ 9 €", note: "Prima dei lavaggi se tanto muco.", keys: ["aspiratore", "nasale"] },
  { id: "pannolino", name: "Pannolini (varie taglie)", cat: "igiene", age: "tutte", price: "≈ 8-14 €", note: "Taglia sul peso. Cambio frequente per dermatite.", keys: ["pannolini", "pannolino", "diaper"] },
  { id: "salviette", name: "Salviette detergenti baby", cat: "igiene", age: "0+", price: "≈ 3 €", note: "Senza profumo se pelle sensibile.", keys: ["salviette", "wipes"] },
  { id: "pasta", name: "Pasta all’acqua / barriera", cat: "pelle", age: "0+", price: "≈ 7 €", note: "Rossore da pannolino: lava, asciuga, strato sottile.", keys: ["pasta acqua", "rossore", "dermatite pannolino", "zinco"] },
  { id: "emolliente", name: "Crema emolliente / atopica", cat: "pelle", age: "0+", price: "≈ 12 €", note: "Pelle secca o dermatite atopica lieve.", keys: ["atopica", "emolliente", "pelle secca"] },
  { id: "termometro", name: "Termometro digitale / auricolare", cat: "febbre", age: "0+", price: "≈ 10 €", note: "Sotto i 3 mesi con febbre: pediatra o PS subito.", keys: ["termometro", "temperatura"] },
  { id: "ciuccio", name: "Succhietto / biberon anticolica", cat: "allattamento", age: "0+", price: "≈ 8 €", note: "Tettarella flusso neonato. Sterilizza all’inizio.", keys: ["biberon", "ciuccio", "tettarella", "anticolica"] },
  { id: "tiralatte", name: "Tiralatte manuale / elettrico", cat: "allattamento", age: "mamma", price: "≈ 25-80 €", note: "Noleggio in alcune farmacie.", keys: ["tiralatte", "latte materno"] },
  { id: "vitd", name: "Vitamina D gocce pediatriche", cat: "allattamento", age: "0-12 mesi", price: "≈ 12 €", note: "Profilassi spesso consigliata dal pediatra.", keys: ["vitamina d", "d3"] },
  { id: "probb", name: "Fermenti pediatrici", cat: "igiene", age: "su etichetta", price: "≈ 10 €", note: "Dopo diarrea o antibiotico, se indicato.", keys: ["fermenti", "enterogermina bambini", "probiotici"] },
];

export const CATS: { id: BabyProduct["cat"]; label: string }[] = [
  { id: "latte", label: "Latte e formula" },
  { id: "svezzamento", label: "Svezzamento" },
  { id: "febbre", label: "Febbre e dolore" },
  { id: "igiene", label: "Igiene" },
  { id: "pelle", label: "Pelle" },
  { id: "allattamento", label: "Allattamento" },
];

export function searchBaby(q: string) {
  const t = q.toLowerCase().trim();
  if (!t) return BABY;
  return BABY.filter(
    (p) =>
      p.name.toLowerCase().includes(t) ||
      p.cat.includes(t) ||
      p.keys.some((k) => k.includes(t) || t.includes(k))
  );
}
