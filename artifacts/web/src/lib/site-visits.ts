import { appPath, readConsent } from "./marketing";

let lastPath = "";
let memorySession = "";
export function recordSitePage(path: string) {
  if (!readConsent().analytics) {
    try { sessionStorage.removeItem("promoapp-visit-session"); } catch { /* Optional storage. */ }
    lastPath = ""; memorySession = ""; return;
  }
  if (/^\/(admin|gestione-contatti|lavori)(\/|$)/i.test(path) || path === lastPath) return;
  const clean = path.split(/[?#]/)[0];
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(clean) || clean.length > 200 || !globalThis.crypto?.randomUUID) return;
  memorySession ||= crypto.randomUUID();
  let sessionId = memorySession;
  try {
    const stored = sessionStorage.getItem("promoapp-visit-session");
    if (stored && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(stored)) sessionId = stored;
    else sessionStorage.setItem("promoapp-visit-session", sessionId);
  } catch { /* A session remains in memory when storage is unavailable. */ }
  lastPath = path;
  void fetch(appPath("/api/visits"), {
    method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
    body: JSON.stringify({ id: crypto.randomUUID(), sessionId, path: clean, analyticsConsent: true }),
  }).catch(() => { /* Statistics must never prevent visitors from using the site. */ });
}
