import { searchBaby } from "./baby";

export type Intent = {
  kind: "emergency" | "hospital" | "pharmacy" | "info";
  title: string;
  advice: string;
  drugs: string[];
};

const EMERGENCY = [
  "dolore al petto", "dolore toracico", "infarto", "ictus", "paralisi", "non parla",
  "difficoltà a respirare", "non respiro", "dispnea grave", "svenimento", "incosciente",
  "convulsioni", "emorragia", "sangue dalla bocca", "tentato suicidio", "overdose",
  "reazione allergica grave", "anafilassi", "gonfiore gola", "ustione grave",
];

const HOSPITAL = [
  "frattura", "osso rotto", "ferita profonda", "sutura", "punti",
  "febbre alta bambino", "convulsione febbrile", "trauma testa", "svenuto",
  "sangue urine", "dolore addome forte", "colica", "calcoli",
  "neonato febbre", "bimbo 2 mesi febbre", "lattante febbre",
];

const DRUGS: { keys: string[]; name: string; use: string }[] = [
  { keys: ["tachipirina", "paracetamolo", "acetaminofene", "efferalgan", "tachidol"], name: "Paracetamolo (Tachipirina)", use: "Febbre e dolore. Nel bambino la dose è in base al peso. No aspirina sotto i 16 anni." },
  { keys: ["nurofen", "brufen", "ibuprofene", "moment"], name: "Ibuprofene", use: "Antinfiammatorio. Versione bambini solo sopra l’età/peso in etichetta." },
  { keys: ["aspirina", "cardioaspirin", "acido acetilsalicilico"], name: "Aspirina", use: "Non nei bambini con febbre virale." },
  { keys: ["okiroki", "ketoprofene", "fastum"], name: "Ketoprofene", use: "Antinfiammatorio." },
  { keys: ["gaviscon", "maalox", "antiacido", "bruciore stomaco", "reflusso"], name: "Antiacido / alginato", use: "Bruciore stomaco adulto. Nel lattante il reflusso lo valuta il pediatra." },
  { keys: ["imodium", "loperamide", "diarrea"], name: "Loperamide", use: "Non nei bambini piccoli. Diarrea pediatrica: reidratazione e pediatra." },
  { keys: ["buscopan", "ioscina", "crampi addome"], name: "Butilscopolamina", use: "Spasmi addominali." },
  { keys: ["zerinol", "raffreddore", "congestione", "naso chiuso"], name: "Raffreddore", use: "Nel lattante solo lavaggi nasali, niente decongestionanti da adulto." },
  { keys: ["enterogermina", "fermenti", "probiotici"], name: "Fermenti lattici", use: "Anche formulazioni pediatriche." },
  { keys: ["augmentin", "amoxicillina", "antibiotico"], name: "Antibiotico", use: "Solo su prescrizione." },
  { keys: ["cetirizina", "loratadina", "antistaminico", "orticaria", "allergia"], name: "Antistaminico", use: "Allergia lieve. Gonfiore gola → 118." },
];

export function interpret(text: string): Intent {
  const t = text.toLowerCase();
  if (EMERGENCY.some((k) => t.includes(k))) {
    return {
      kind: "emergency",
      title: "Possibile emergenza",
      advice: "Chiama subito il 118.",
      drugs: [],
    };
  }
  if (HOSPITAL.some((k) => t.includes(k))) {
    return {
      kind: "hospital",
      title: "Valutazione in Pronto Soccorso",
      advice: "Sintomo che può richiedere visita ospedaliera o pediatrica urgente.",
      drugs: [],
    };
  }
  const baby = searchBaby(t);
  const babyHit = t.length >= 3 ? baby.find((p) => p.keys.some((k) => t.includes(k)) || t.includes(p.name.toLowerCase())) : undefined;
  if (babyHit) {
    return {
      kind: "pharmacy",
      title: babyHit.name,
      advice: `${babyHit.name} (${babyHit.age}, ${babyHit.price}). ${babyHit.note} Ti porto alla farmacia aperta più vicina. Se è latte speciale (HA, AR, APLV) conferma con il pediatra.`,
      drugs: [babyHit.name],
    };
  }
  const drugs = DRUGS.filter((d) => d.keys.some((k) => t.includes(k)));
  if (drugs.length) {
    return {
      kind: "pharmacy",
      title: drugs[0].name,
      advice: drugs.map((d) => `${d.name}: ${d.use}`).join(" ") + " Non sostituisce medico o farmacista.",
      drugs: drugs.map((d) => d.name),
    };
  }
  return {
    kind: "info",
    title: "Come posso aiutarti",
    advice:
      "Scrivi un sintomo, un farmaco o un prodotto bimbo (Aptamil, Mellin, pannolini, Tachipirina gocce). Ti porto alla farmacia o al PS. Emergenza: 118.",
    drugs: [],
  };
}
