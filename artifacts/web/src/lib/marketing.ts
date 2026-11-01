import type { ContactRequestAttribution } from "@workspace/api-client-react";
import { sectors, commercialIncentive } from "./commercial";

export type Service = "generale" | "siti-web" | "web-app" | "menu-digitali";
export const serviceCodes = { generale: "general", "siti-web": "website_399", "web-app": "webapp_custom", "menu-digitali": "menu_qr_99" } as const;
const standardServiceCta: Record<Service, string> = {
   generale: "Richiedi una proposta personalizzata", "siti-web": "Richiedi una proposta personalizzata",
   "menu-digitali": "Richiedi il tuo menu digitale a 99 €", "web-app": "Richiedi una proposta personalizzata",
};
export const serviceCta = Object.fromEntries(Object.entries(standardServiceCta).map(([service, label]) =>
  [service, label])) as Record<Service, string>;
export const PUBLIC_ORIGIN = "https://www.promoapp.it";
export const appPath = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
export const serviceNames: Record<Service, string> = {
  generale: "il tuo progetto", "siti-web": "il tuo sito web", "web-app": "la tua web app", "menu-digitali": "il tuo menu digitale",
};
const messages: Record<Service, string> = {
  generale: "Buongiorno, ho visto PromoApp e vorrei una proposta gratuita e senza impegno per la mia attività.",
  "siti-web": "Buongiorno, vorrei informazioni sul sito web a 399 € + IVA di attivazione definitiva.",
  "web-app": "Ciao PromoApp! Vorrei un preventivo per una web app o un gestionale personalizzato. La mia idea è...",
  "menu-digitali": "Buongiorno, vorrei informazioni sul menu digitale QR a 99 € + IVA di attivazione definitiva per il mio locale.",
};
export const WHATSAPP_NUMBER = "393793602035";
export const whatsappUrl = (service: Service = "generale", slug?: string) => {
  const sector = slug && sectors[slug as keyof typeof sectors];
  const base = sector ? sector.whatsappMessage : messages[service];
  const incentive = commercialIncentive();
  const message = `${base} ${incentive.demoActive ?
    `Vorrei richiedere la demo illustrativa gratuita con il nome della mia attività. ${incentive.promise}` :
    "Posso richiedere un’anteprima gratuita?"}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

// Attribution stays in memory until consent; it is included only in the user's
// actual enquiry, never sent to an advertising provider without consent.
let attribution: ContactRequestAttribution = {};
const ATTRIBUTION_KEY = "promoapp-attribution-v1";
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const consent = readConsent();
  if (consent.analytics || consent.marketing) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null");
      if (stored?.at > Date.now() - 86400000 && stored?.data && !Object.keys(attribution).length) attribution = stored.data;
    } catch { /* Storage is optional; navigation still keeps in-memory attribution. */ }
  }
  const params = new URLSearchParams(window.location.search);
  const next: ContactRequestAttribution = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"] as const) {
    const value = params.get(key);
    if (value) next[key] = value.slice(0, 200);
  }
  if (Object.keys(next).length) attribution = next;
  persistAttribution();
}
export function getAttribution(): ContactRequestAttribution {
  const consent = readConsent();
  if (!consent.analytics && !consent.marketing) return {};
  const { gclid, gbraid, wbraid, ...utm } = attribution;
  return consent.marketing ? { ...utm, gclid, gbraid, wbraid } : utm;
}
export function persistAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (readConsent().analytics || readConsent().marketing)
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ data: getAttribution(), at: Date.now() }));
    else sessionStorage.removeItem(ATTRIBUTION_KEY);
  } catch { /* Do not block the form when storage is unavailable. */ }
}

export type Consent = { analytics: boolean; marketing: boolean };
export const CONSENT_KEY = "promoapp-consent-v1";
export function readConsent(): Consent {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    return { analytics: value?.analytics === true, marketing: value?.marketing === true };
  } catch {
    return { analytics: false, marketing: false };
  }
}
export function hasConsentChoice() {
  try { return localStorage.getItem(CONSENT_KEY) !== null; } catch { return false; }
}
