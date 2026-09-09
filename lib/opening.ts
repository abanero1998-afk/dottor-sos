const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function parseOpeningHours(oh?: string | null) {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (!oh) {
    const h = now.getHours();
    const weekday = now.getDay() >= 1 && now.getDay() <= 5;
    const sat = now.getDay() === 6;
    const aperta = weekday ? (h >= 8 && h < 13) || (h >= 16 && h < 20) : sat ? h >= 8 && h < 13 : false;
    return {
      aperta,
      label: aperta ? "Probabilmente aperta" : "Orario non confermato",
      raw: "Orari OSM non disponibili — stima fascia tipica italiana",
    };
  }
  const lower = oh.toLowerCase().replace(/\s+/g, " ").trim();
  if (lower.includes("24/7")) return { aperta: true, label: "Aperta 24/7", raw: oh };

  const ranges: { days: string[]; start: number; end: number }[] = [];
  for (const part of lower.split(";")) {
    const p = part.trim();
    if (!p || p === "off") continue;
    const m = p.match(/^([a-z,–-]+)?\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!m) continue;
    const daysSpec = (m[1] || "mo-su").replace(/–/g, "-");
    const days: string[] = [];
    for (const chunk of daysSpec.split(",")) {
      const [a, b] = chunk.split("-").map((x) => x.trim());
      if (!a) continue;
      if (!b) days.push(a.slice(0, 2));
      else {
        const i1 = DAYS.indexOf(a.slice(0, 2));
        const i2 = DAYS.indexOf(b.slice(0, 2));
        if (i1 >= 0 && i2 >= 0) {
          for (let i = i1; ; i = (i + 1) % 7) {
            days.push(DAYS[i]);
            if (i === i2) break;
          }
        }
      }
    }
    const [sh, sm] = m[2].split(":").map(Number);
    const [eh, em] = m[3].split(":").map(Number);
    ranges.push({ days, start: sh * 60 + sm, end: eh * 60 + em });
  }

  const today = ranges.filter((r) => r.days.includes(day));
  const aperta = today.some((r) => mins >= r.start && mins < r.end);
  const next = today.find((r) => r.end > mins);
  const label = aperta
    ? `Aperta fino alle ${pad(Math.floor((next || today[today.length - 1]).end / 60))}:${pad((next || today[today.length - 1]).end % 60)}`
    : today.length
      ? `Chiude / riprende secondo orario`
      : "Chiusa oggi";
  return { aperta, label, raw: oh };
}
