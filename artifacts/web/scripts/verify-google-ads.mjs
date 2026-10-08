// Offline regression checks. No advertising requests, leads or notifications.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const require = createRequire(new URL("../../api-server/package.json", import.meta.url));
const { build } = require("esbuild");
const { outputFiles } = await build({
  entryPoints: [new URL("../src/lib/analytics.ts", import.meta.url).pathname],
  bundle: true, write: false, platform: "browser", format: "cjs",
  define: { "import.meta.env.BASE_URL": '"/"' },
});
const ads = "AW-18500380450";
const defaults = JSON.parse(await readFile(new URL("../public/marketing-config.json", import.meta.url), "utf8"));
assert.equal(defaults.googleAdsId, ads);
assert.equal(defaults.googleAdsLeadLabel, "");
class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
async function browser({ ga4Id = "", gtmId = "", apiFails = false, googleOnly = false } = {}) {
  const localStorage = new Storage(), scripts = [];
  const window = { location: { origin: "https://www.promoapp.it", search: "?email=never-transmit" }, dataLayer: [] };
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, console, URLSearchParams, Date,
    localStorage, sessionStorage: new Storage(), window,
    document: { title: "PromoApp", getElementById: (id) => scripts.find((s) => s.id === id),
      createElement: () => ({}), head: { appendChild: (node) => scripts.push(node) } },
    fetch: async (path) => {
      if (path.startsWith("/api/") && apiFails) throw new Error("Offline API");
      return { ok: true, json: async () => path.startsWith("/api/") ? {} : { ...defaults, ga4Id, gtmId } };
    },
  });
  vm.runInContext(outputFiles[0].text, context);
  const tracking = module.exports;
  tracking.trackPage("/siti-web");
  await tracking.initTracking({ googleOnly });
  const commands = () => window.dataLayer.filter((v) => !v.event).map((v) => Array.from(v));
  const pages = (destination = ads) => commands().filter(([command, event, params]) =>
    command === "event" && event === "page_view" && params.send_to === destination);
  const consent = (analytics, marketing) => {
    localStorage.setItem("promoapp-consent-v1", JSON.stringify({ analytics, marketing }));
    tracking.updateTrackingConsent({ analytics, marketing });
  };
  return { tracking, scripts, commands, pages, consent };
}
const basic = await browser();
assert.equal(basic.scripts.length, 0);
const initialConsent = basic.commands()[0];
assert.equal(initialConsent[0], "consent");
assert.equal(initialConsent[1], "default");
for (const signal of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"])
  assert.equal(initialConsent[2][signal], "denied");
basic.consent(false, false);
assert.equal(basic.scripts.length, 0);
basic.consent(false, true);
assert.equal(basic.scripts.filter((s) => s.src.includes("gtag/js")).length, 1);
assert.equal(basic.pages().length, 1);
assert.equal(basic.pages()[0][2].page_location, "https://www.promoapp.it/siti-web");
basic.tracking.trackPage("/siti-web");
assert.equal(basic.pages().length, 1);
basic.tracking.trackConversion("siti-web", "form", "offline-test");
assert.ok(!basic.commands().some(([command, event]) => command === "event" && event === "conversion"));
basic.tracking.trackPage("/grazie");
assert.equal(basic.pages().length, 2);
assert.equal(basic.pages()[1][2].page_location, "https://www.promoapp.it/grazie");
basic.tracking.trackPage("/grazie");
assert.equal(basic.pages().length, 2);
basic.consent(false, false);
basic.tracking.trackPage("/web-app");
assert.equal(basic.pages().length, 2);
assert.ok(!JSON.stringify(basic.commands()).includes("never-transmit"));
console.log("OK: consent v2 denied, refusal, marketing-only, singleton script, SPA /grazie, no explicit conversion, revocation and no query data");
const coexist = await browser({ ga4Id: "G-TEST123" });
coexist.consent(true, false);
assert.equal(coexist.pages().length, 0);
assert.equal(coexist.pages("G-TEST123").length, 1);
coexist.consent(true, true);
assert.equal(coexist.pages().length, 1);
assert.equal(coexist.scripts.filter((s) => s.src.includes("gtag/js")).length, 1);
coexist.tracking.trackPage("/grazie");
assert.equal(coexist.pages().length, 2);
assert.equal(coexist.pages("G-TEST123").length, 2);
coexist.tracking.trackPage("/admin");
assert.equal(coexist.pages().length, 2);
console.log("OK: GA4 independent consent, shared loader, one page view per destination, private pages excluded");
const offline = await browser({ apiFails: true });
offline.consent(false, true);
assert.equal(offline.pages().length, 1);
const managed = await browser({ gtmId: "GTM-TEST123" });
managed.consent(true, true);
assert.equal(managed.scripts.filter((s) => s.src.includes("gtm.js")).length, 1);
assert.equal(managed.scripts.filter((s) => s.src.includes("gtag/js")).length, 0);
assert.equal(managed.pages().length, 0);
console.log("OK: static configuration survives API failure; existing GTM retains sole ownership of Google tags");
const legal = await browser({ googleOnly: true });
legal.consent(false, true);
legal.tracking.trackPage("/privacy.html");
assert.equal(legal.pages().at(-1)[2].page_location, "https://www.promoapp.it/privacy.html");
assert.equal(legal.scripts.filter((s) => s.src.includes("facebook")).length, 0);
assert.equal(legal.scripts.filter((s) => s.src.includes("gtag/js")).length, 1);
console.log("OK: informational pages reuse Google tracking without adding Meta or changing their UI");
