import type { ContactRequestAttribution } from "@workspace/api-client-react";

export type Service = "generale" | "siti-web" | "web-app" | "menu-digitali";
export const PUBLIC_ORIGIN = "https://www.promoapp.it";
export const appPath = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
export const serviceNames: Record<Service, string> = {
  generale: "il tuo progetto", "siti-web": "il tuo sito web", "web-app": "la tua web app", "menu-digitali": "il tuo menu digitale",
};
const messages: Record<Service, string> = {
  generale: "Ciao PromoApp! Vorrei una demo gratuita dell'app su misura per la mia attività.",
  "siti-web": "Ciao PromoApp! Vorrei informazioni per un sito web professionale a partire da 399 €. La mia attività è...",
  "web-app": "Ciao PromoApp! Vorrei un preventivo per una web app o un gestionale personalizzato. La mia idea è...",
  "menu-digitali": "Ciao PromoApp! Vorrei un menu digitale con QR code a partire da 99 €. Il mio locale è...",
};
export const whatsappUrl = (service: Service = "generale") =>
  `https://wa.me/393793602035?text=${encodeURIComponent(messages[service])}`;

// Attribution stays in memory until consent; it is included only in the user's
// actual enquiry, never sent to an advertising provider without consent.
let attribution: ContactRequestAttribution = {};
export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const next: ContactRequestAttribution = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"] as const) {
    const value = params.get(key);
    if (value) next[key] = value.slice(0, 200);
  }
  if (Object.keys(next).length) attribution = next;
}
export function getAttribution(): ContactRequestAttribution {
  const { gclid, gbraid, wbraid, ...utm } = attribution;
  return readConsent().marketing ? { ...utm, gclid, gbraid, wbraid } : utm;
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
