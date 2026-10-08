import type { CommercialLead } from "@workspace/api-client-react";
export const statusLabels: Record<string, string> = { Nuovo: "Richiesta ricevuta", Contattato: "Contattato",
  Interessato: "Trattativa in corso", "Preventivo inviato": "Preventivo inviato",
  "Cliente acquisito": "Cliente acquisito", "Non interessato": "Trattativa non conclusa" };
export const serviceLabels: Record<string, string> = { general: "Progetto da definire", generale: "Progetto da definire",
  webapp_custom: "Web app / gestionale", "web-app": "Web app / gestionale",
  website_399: "Sito web", "siti-web": "Sito web", menu_qr_99: "Menu digitale QR", "menu-digitali": "Menu digitale QR",
  sector_custom: "Soluzione per settore" };
export const euro = (cents: number | null | undefined) => cents == null ? "Non registrato" :
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
export function parseEuros(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (!clean) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) throw new Error("Usa importi positivi senza separatori delle migliaia, ad esempio 1200,50.");
  const [whole, fraction = ""] = clean.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 2147483647) throw new Error("Importo troppo elevato.");
  return cents;
}
export function salesSummary(rows: CommercialLead[]) {
  const groups = new Map<string, { service: string; leads: number; qualified: number; quotes: number; negotiations: number; won: number; lost: number; revenue: number; missing: number }>();
  for (const row of rows) {
    const service = serviceLabels[row.servizio ?? "general"] ?? row.servizio ?? "Progetto da definire";
    const stats = groups.get(service) ?? { service, leads: 0, qualified: 0, quotes: 0, negotiations: 0, won: 0, lost: 0, revenue: 0, missing: 0 };
    stats.leads++; if (row.qualifiedAt) stats.qualified++;
    if (row.stato === "Preventivo inviato") stats.quotes++;
    if (row.stato === "Interessato") stats.negotiations++;
    if (row.stato === "Non interessato") stats.lost++;
    if (row.stato === "Cliente acquisito") {
      stats.won++;
      if (row.saleAmountCents == null) stats.missing++; else stats.revenue += row.saleAmountCents;
    }
    groups.set(service, stats);
  }
  return [...groups.values()];
}
