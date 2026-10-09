import type { TrackingConfig } from "@workspace/api-client-react";
import { appPath, captureAttribution, persistAttribution, readConsent, serviceCodes, type Service, type Consent } from "./marketing";
import { commercialVariant, sectors } from "./commercial";
import { recordSitePage } from "./site-visits";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: Window["fbq"] };
    _fbq?: Window["fbq"];
  }
}
let config: TrackingConfig = {};
let googleOnly = false;
let ready = false, googleStarted = false, metaStarted = false, gtmStarted = false;
let consentDefaultSet = false;
let activePath = "/", lastPage = "";
let lastAdsPage = "";
let gaConfigured = false, adsConfigured = false;
const sentLeads = new Set<string>();
const privatePage = () => /^\/(?:admin|gestione-contatti|lavori)(?:\/|$)/.test(activePath) ||
  (activePath.startsWith("/per/") && !Object.hasOwn(sectors, activePath.slice(5)));
let eventSequence = 0;
function gtag(..._args: unknown[]) {
  window.dataLayer ??= [];
  window.dataLayer.push(arguments);
}
function script(id: string, src: string) {
  if (document.getElementById(id)) return;
  const node = document.createElement("script");
  node.id = id; node.async = true; node.src = src; document.head.appendChild(node);
}
function consentValues(consent: Consent) {
  return {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  };
}
function configure(consent: Consent) {
  if (privatePage()) return;
  persistAttribution();
  if (!ready) return;
  recordSitePage(activePath);
  if (!window.gtag) {
    window.gtag = gtag;
  }
  if (!consentDefaultSet) {
    gtag("consent", "default", consentValues({ analytics: false, marketing: false }));
    consentDefaultSet = true;
  }
  gtag("consent", "update", consentValues(consent));
  const gtm = /^GTM-[A-Z0-9]+$/.test(config.gtmId ?? "") ? config.gtmId : "";
  // A configured GTM container owns Google tags: never also load direct gtag.
  // Strict/basic consent mode: the container is not loaded without marketing consent.
  if (gtm && consent.marketing && !gtmStarted) {
    window.dataLayer ??= [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    script("promoapp-gtm", `https://www.googletagmanager.com/gtm.js?id=${gtm}`);
    gtmStarted = true;
  }
  const ga = /^G-[A-Z0-9]+$/.test(config.ga4Id ?? "") ? config.ga4Id : "";
  const ads = /^AW-\d+$/.test(config.googleAdsId ?? "") ? config.googleAdsId : "";
  const googleId = consent.analytics && ga || consent.marketing && ads;
  if (!gtm && googleId && !googleStarted) {
    gtag("js", new Date());
    script("promoapp-google-tag", `https://www.googletagmanager.com/gtag/js?id=${googleId}`);
    googleStarted = true;
  }
  if (!gtm && googleStarted) {
    if (ga && consent.analytics && !gaConfigured) { gtag("config", ga, { send_page_view: false }); gaConfigured = true; }
    if (ads && consent.marketing && !adsConfigured) { gtag("config", ads, { send_page_view: false }); adsConfigured = true; }
  }
  // Google Ads URL-based goals need the current virtual page, not just GA4 events.
  // Keep a separate marker so granting marketing after analytics also measures
  // the current page. No conversion event or label is added to the landing.
  if (!gtm && adsConfigured && consent.marketing && lastAdsPage !== activePath) {
    window.gtag?.("event", "page_view", {
      send_to: ads,
      page_location: `${window.location.origin}${appPath(activePath)}`,
      page_path: activePath,
      page_title: document.title,
    });
    lastAdsPage = activePath;
  }
  if (!googleOnly && consent.marketing && /^\d+$/.test(config.metaPixelId ?? "") && !metaStarted) {
    const pixel: NonNullable<Window["fbq"]> = (...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue!.push(args);
    };
    pixel.queue = []; pixel.loaded = true; pixel.version = "2.0"; pixel.push = pixel;
    window.fbq = pixel; window._fbq = pixel;
    pixel("init", config.metaPixelId); metaStarted = true;
    script("promoapp-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  }
  if (metaStarted) window.fbq?.("consent", consent.marketing ? "grant" : "revoke");
  if (lastPage !== activePath) {
    trackEvent("page_view", "generale", activePath);
    if (metaStarted && consent.marketing) window.fbq?.("track", "PageView");
    if (consent.analytics || consent.marketing) lastPage = activePath;
  }
}
export async function initTracking(options: { googleOnly?: boolean } = {}) {
  googleOnly = options.googleOnly === true;
  captureAttribution();
  try {
    const [staticConfig, runtimeConfig] = await Promise.all([
      "/marketing-config.json", "/api/marketing-config",
    ].map(async (path) => {
      try {
        const response = await fetch(appPath(path));
        return response.ok ? await response.json() as TrackingConfig : {};
      } catch { return {}; }
    }));
    config = staticConfig;
    if (runtimeConfig) {
      const runtime = runtimeConfig;
      for (const [key, value] of Object.entries(runtime)) if (value) (config as Record<string, string>)[key] = value;
    }
  } catch { /* Tracking must never block enquiries. */ }
  ready = true; configure(readConsent());
}
export function updateTrackingConsent(consent: Consent) { configure(consent); }
export function trackPage(path: string) { activePath = path; captureAttribution(); configure(readConsent()); }
export function trackEvent(event: string, service: Service = "generale", placement = "form", slug = "generale", eventId?: string, extra: { business_type?: string } = {}) {
  if (privatePage()) return;
  const consent = readConsent();
  if (!consent.analytics && !consent.marketing) return;
  // No names, phone numbers, email, free text, URL query or raw advertising parameters.
  const context = { service, placement, position: placement, posizione: placement, page_path: activePath, sector: slug, slug,
    servizio: slug === "generale" ? serviceCodes[service] : "sector_custom", variant: commercialVariant().key,
    event_id: eventId ?? globalThis.crypto?.randomUUID?.() ?? `ui-${Date.now()}-${++eventSequence}`, ...extra };
  if (gtmStarted) {
    window.dataLayer ??= [];
    window.dataLayer.push({ event, ...context });
  } else if (consent.analytics && googleStarted && config.ga4Id) {
    window.gtag?.("event", event, { ...context, send_to: config.ga4Id });
  }
}
export function trackConversion(service: Service, placement = "form", leadId?: string, slug = "generale", businessType?: string) {
  if (privatePage() || !leadId || sentLeads.has(leadId)) return;
  try { if (sessionStorage.getItem(`promoapp-counted-${leadId}`)) return; } catch { /* In-memory dedup still works. */ }
  const consent = readConsent();
  if (!consent.analytics && !consent.marketing) return;
  sentLeads.add(leadId);
  try { sessionStorage.setItem(`promoapp-counted-${leadId}`, "1"); } catch { /* Optional. */ }
  const safeType = Object.values(sectors).some((sector) => sector.activity === businessType) ? businessType : "Altro";
  trackEvent("generate_lead", service, placement, slug, leadId, { business_type: safeType });
  if (!gtmStarted && consent.marketing && googleStarted && config.googleAdsId && config.googleAdsLeadLabel)
    window.gtag?.("event", "conversion", { send_to: `${config.googleAdsId}/${config.googleAdsLeadLabel}`, transaction_id: leadId });
  if (consent.marketing && metaStarted) window.fbq?.("track", "Lead", { service }, { eventID: leadId });
}
export function trackWhatsApp(service: Service, placement: string, slug = "generale") {
  if (privatePage()) return;
  trackEvent("whatsapp_click", service, placement, slug);
  if (readConsent().marketing && metaStarted) window.fbq?.("trackCustom", "WhatsAppClick", { service, placement, sector: slug });
}
