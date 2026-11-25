import type { AdminFinanceEntry, AdminFinanceProject } from "@workspace/api-client-react";
export const categoryLabels: Record<AdminFinanceEntry["category"],string> = {
  deposit:"Acconto",balance:"Saldo",monthly_fee:"Canone",facebook:"Facebook / Instagram Ads",google:"Google Ads",
  replit:"Replit",canva:"Canva",hosting:"Hosting e database",domains:"Domini internet",software:"Software e abbonamenti",
  administration:"Spese amministrative",accountant:"Commercialista",consulting:"Consulenze",equipment:"Attrezzature e tecnologia",research:"Ricerca e sviluppo",other:"Altro",
};
export const money=(cents:number)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(cents/100);
export const confirmed=(p:AdminFinanceProject)=>p.details?.agreementConfirmed && p.details.amountKnown && p.details.commercialState==="confirmed";
export const cash=(e:AdminFinanceEntry)=>Boolean(e.paidAt && !e.details?.cancelled && e.details?.amountConfirmed && e.details.reconciliation==="reconciled");
export const iso=(date:Date|string)=>date instanceof Date?date.toISOString().slice(0,10):date.slice(0,10);
export const fieldClass="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
