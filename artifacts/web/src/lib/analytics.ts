import { captureAttribution, getAttribution, readConsent, type Service, type Consent } from "./marketing";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: Window["fbq"] };
    _fbq?: Window["fbq"];
  }
}

// Empty Google fields are intentional. Configure real IDs in marketing-config.json.
type TrackingConfig = { ga4Id?: string; googleAdsId?: string; googleAdsLeadLabel?: string; metaPixelId?: string };
let config: TrackingConfig = {};
let ready = false;
let googleStarted = false;
let metaStarted = false;
let lastPath = "";
let activePath = "/";

function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // Google expects Arguments objects rather than arrays in dataLayer.
  window.dataLayer.push(arguments);
}
function sendPageView(path: string) {
  if (lastPath === path) return;
  if (googleStarted && readConsent().analytics && config.ga4Id) {
    window.gtag?.("event", "page_view", {
      send_to: config.ga4Id, page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  }
  if (metaStarted && readConsent().marketing) window.fbq?.("track", "PageView");
  lastPath = path;
}
function loadScript(id: string, src: string, onError?: () => void) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id; script.async = true; script.src = src;
  if (onError) script.onerror = onError;
  document.head.appendChild(script);
}
function configureTracking(consent: Consent) {
  if (!ready) return;
  const ga4Id = /^G-[A-Z0-9]+$/.test(config.ga4Id ?? "") ? config.ga4Id : undefined;
  const adsId = /^AW-\d+$/.test(config.googleAdsId ?? "") ? config.googleAdsId : undefined;
  const googleId = (consent.analytics && ga4Id) || (consent.marketing && adsId);
  if (googleId && !googleStarted) {
    window.gtag = gtag;
    gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date());
    googleStarted = true;
    loadScript("promoapp-google-tag", `https://www.googletagmanager.com/gtag/js?id=${googleId}`);
  }
  if (googleStarted) {
    gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
    });
    if (consent.analytics && ga4Id) gtag("config", ga4Id, { send_page_view: false });
    if (consent.marketing && adsId) gtag("config", adsId, { send_page_view: false });
  }
  if (consent.marketing && /^\d+$/.test(config.metaPixelId ?? "") && !metaStarted) {
    const pixel: NonNullable<Window["fbq"]> = (...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue!.push(args);
    };
    pixel.queue = []; pixel.loaded = true; pixel.version = "2.0";
    pixel.push = pixel;
    window.fbq = pixel; window._fbq = pixel;
    pixel("init", config.metaPixelId);
    metaStarted = true;
    loadScript("promoapp-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  }
  if (metaStarted) window.fbq?.("consent", consent.marketing ? "grant" : "revoke");
  lastPath = "";
  sendPageView(activePath);
}
export async function initTracking() {
  captureAttribution();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}marketing-config.json`);
    if (!response.ok) throw new Error("Tracking configuration unavailable");
    config = await response.json() as TrackingConfig;
    ready = true;
    configureTracking(readConsent());
  } catch {
    // Analytics must never block enquiries or navigation.
    ready = true;
  }
}
export function updateTrackingConsent(consent: Consent) {
  configureTracking(consent);
}
export function trackPage(path: string) {
  activePath = path;
  captureAttribution();
  if (ready) sendPageView(path);
}
export function trackConversion(service: Service, placement = "form") {
  const consent = readConsent();
  const context = { service, placement, ...getAttribution() };
  if (consent.analytics && googleStarted && config.ga4Id) window.gtag?.("event", "generate_lead", { ...context, send_to: config.ga4Id });
  if (consent.marketing && googleStarted && config.googleAdsId && config.googleAdsLeadLabel) {
    window.gtag?.("event", "conversion", { send_to: `${config.googleAdsId}/${config.googleAdsLeadLabel}`, service });
  }
  if (consent.marketing && metaStarted) window.fbq?.("track", "Lead", { service });
}
export function trackWhatsApp(service: Service, placement: string) {
  if (readConsent().analytics && googleStarted && config.ga4Id) {
    window.gtag?.("event", "whatsapp_click", { service, placement, send_to: config.ga4Id });
  }
  if (readConsent().marketing && metaStarted) window.fbq?.("trackCustom", "WhatsAppClick", { service, placement });
}
