export function waitFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hour = new Date().getHours();
  const rush = hour >= 10 && hour <= 22 ? 1.4 : 0.7;
  const min = Math.round(((h % 140) + 20) * rush);
  const people = Math.max(2, Math.round(min / 8));
  const label = min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
  const stato = min < 50 ? "libero" : min < 100 ? "medio" : "affollato";
  return { min, people, label, stato };
}
