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
];

const DRUGS: { keys: string[]; name: string; use: string }[] = [
  { keys: ["tachipirina", "paracetamolo", "acetaminofene", "efferalgan", "tachidol"], name: "Paracetamolo (Tachipirina)", use: "Febbre e dolore lieve-moderato. Dose adulta tipica 500-1000 mg, max 3 g/die. Attenzione al fegato." },
  { keys: ["nurofen", "brufen", "ibuprofene", "moment"], name: "Ibuprofene", use: "Dolore infiammatorio, mal di testa, mestruazioni. Da prendere a stomaco pieno. Evitare in ulcera o asma grave." },
  { keys: ["aspirina", "cardioaspirin", "acido acetilsalicilico"], name: "Aspirina", use: "Dolore / antiaggregante. Non nei bambini con febbre virale. Rischio gastrico." },
  { keys: ["okiroki", "ketoprofene", "fastum"], name: "Ketoprofene", use: "Antinfiammatorio. Gel per traumi; orale solo se prescritto/indicato." },
  { keys: ["gaviscon", "maalox", "antiacido", "bruciore stomaco", "reflusso"], name: "Antiacido / alginato", use: "Bruciore di stomaco. Se dolore irradiato al braccio o sudore freddo → 118." },
  { keys: ["imodium", "loperamide", "diarrea"], name: "Loperamide", use: "Diarrea occasionale adulto. Non se febbre alta o sangue nelle feci. Idratazione." },
  { keys: ["buscopan", "ioscina", "crampi addome"], name: "Butilscopolamina", use: "Spasmi addominali / coliche." },
  { keys: ["momentact", "mal di denti"], name: "Analgesico denti", use: "Dolore dentale: ibuprofene se non controindicato + dentista." },
  { keys: ["zerinol", "raffreddore", "congestione", "naso chiuso"], name: "Decongestionante / raffreddore", use: "Sintomi da raffreddore. Attenzione se ipertensione." },
  { keys: ["benagol", "mal di gola", "stropsils"], name: "Pastiglie gola", use: "Mal di gola lieve. Se dura >3 giorni o febbre alta valuta medico." },
  { keys: ["enterogermina", "fermenti", "probiotici"], name: "Fermenti lattici", use: "Supporto flora intestinale, anche dopo antibiotico." },
  { keys: ["augumentin", "augmentin", "amoxicillina", "antibiotico"], name: "Antibiotico (es. Amoxicillina)", use: "SOLO su prescrizione. Non automedicare. Porta la ricetta in farmacia." },
  { keys: ["xanax", "lorazepam", "tavor", "ansiolitico"], name: "Ansiolitico", use: "Farmaco soggetto a prescrizione. Non iniziare da soli." },
  { keys: ["alleria", "cetirizina", "loratadina", "antistaminico", "orticaria", "allergia"], name: "Antistaminico", use: "Allergia lieve / prurito. Se labbra/gola gonfie → 118." },
  { keys: ["gocce occhi", "congiuntivite", "collirio"], name: "Collirio", use: "Arrossamento lieve. Se dolore intenso o calo vista → pronto soccorso oculistico." },
  { keys: ["cerotto", "disinfettante", "ferita", "betadine"], name: "Medicazione", use: "Ferite superficiali: lava, disinfetta, copri. Profonde o che sanguinano → PS." },
];

const SYMPTOMS: { keys: string[]; title: string; advice: string; kind: Intent["kind"] }[] = [
  { keys: ["febbre", "temperatura", "38", "39"], title: "Febbre", advice: "Idratazione, riposo, paracetamolo se necessario. PS se >39 persistente, rigidità nuca, petecchie, bambino piccolo." , kind: "pharmacy" },
  { keys: ["mal di testa", "emicrania", "cefalea"], title: "Cefalea", advice: "Ambiente buio, idratazione, analgesico. PS se improvviso “peggiore della vita”, vomito, deficit neurologici.", kind: "pharmacy" },
  { keys: ["tosse", "raffreddore", "influenza", "malanni"], title: "Vie respiratorie alte", advice: "Riposo, liquidi, sintomatici da banco. PS se fiato corto a riposo o labbra blu.", kind: "pharmacy" },
  { keys: ["mal di schiena", "lombalgia", "cervicale"], title: "Dolore muscolare", advice: "Antinfiammatorio se consentito, ghiaccio/calore, movimento dolce. PS se deficit di forza o incontinenza.", kind: "pharmacy" },
  { keys: ["cistite", "bruciore pipì", "urine"], title: "Disturbi urinari", advice: "Tanta acqua. Farmacia per consulenza; medico se sangue, febbre, dolore fianco.", kind: "pharmacy" },
  { keys: ["nause", "vomito"], title: "Nausea", advice: "Sorsi d’acqua, dieta in bianco. PS se sangue, disidratazione, dolore addome intenso.", kind: "pharmacy" },
];

export function interpret(text: string): Intent {
  const t = text.toLowerCase();
  if (EMERGENCY.some((k) => t.includes(k))) {
    return {
      kind: "emergency",
      title: "Possibile emergenza",
      advice: "Chiama subito il 118. Non guidare. Se c’è un DAE vicino usalo solo se la persona è incosciente e non respira.",
      drugs: [],
    };
  }
  if (HOSPITAL.some((k) => t.includes(k))) {
    return {
      kind: "hospital",
      title: "Valutazione in Pronto Soccorso",
      advice: "Sintomo che può richiedere visita ospedaliera. Ti indico l’ospedale / PS più vicino.",
      drugs: [],
    };
  }
  const drugs = DRUGS.filter((d) => d.keys.some((k) => t.includes(k)));
  const sym = SYMPTOMS.find((s) => s.keys.some((k) => t.includes(k)));
  if (drugs.length || sym) {
    const advice = [
      ...drugs.map((d) => `${d.name}: ${d.use}`),
      sym?.advice || "",
      "Non sostituisce il parere di un medico o farmacista. In dubbio: 112 / medico di base.",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      kind: "pharmacy",
      title: drugs[0]?.name || sym?.title || "Consiglio farmacia",
      advice,
      drugs: drugs.map((d) => d.name),
    };
  }
  return {
    kind: "info",
    title: "Come posso aiutarti",
    advice:
      "Descrivi un sintomo (es. febbre, mal di gola) o un farmaco (Tachipirina, Nurofen). Ti porto alla farmacia o al PS più vicino. Per emergenze chiama 118.",
    drugs: [],
  };
}
