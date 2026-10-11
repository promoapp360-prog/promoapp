// Offline checks only: no advertising requests, WhatsApp messages, leads or DB writes.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import { createServer } from "node:http";
const require = createRequire(new URL("../../api-server/package.json", import.meta.url));
const { build } = require("esbuild");
const source = new URL("../src/lib/analytics.ts", import.meta.url).pathname;
const sectors = JSON.parse(await readFile(new URL("../src/lib/sector-config.json", import.meta.url), "utf8"));
const publicConfig = JSON.parse(await readFile(new URL("../public/marketing-config.json", import.meta.url), "utf8"));
const choices = [
  { slug: "ristoranti", label: "Ristorante / Bar", message: "Ciao PromoApp, ho un ristorante/bar e vorrei capire come potete aiutarmi (sito, prenotazioni o menu)." },
  { slug: "negozi", label: "Negozio", message: "Ciao PromoApp, ho un negozio e vorrei capire come potete aiutarmi (sito, catalogo o gestione clienti)." },
  { slug: "parrucchiere-estetica", label: "Parrucchiere / Estetica", message: "Ciao PromoApp, ho un'attività di parrucchiere/estetica e vorrei capire come potete aiutarmi (sito, appuntamenti o gestione clienti)." },
  { slug: "studio-professionista", label: "Studio / Professionista", message: "Ciao PromoApp, ho uno studio professionale e vorrei capire come potete aiutarmi (sito, appuntamenti o gestionale)." },
  { slug: "altro", label: "Altro", message: "Ciao PromoApp, ho un'attività e vorrei raccontarvi la mia idea." },
];
assert.equal(publicConfig.googleAdsId, "AW-18500380450");
assert.equal(publicConfig.googleAdsWhatsAppLabel, "sLl9CMfG_JgdEKLO1fVE");
assert.equal(publicConfig.googleAdsLeadLabel, "");
const { outputFiles } = await build({ entryPoints: [source], bundle: true, write: false,
  platform: "browser", format: "cjs", define: { "import.meta.env.BASE_URL": '"/"' } });
class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
async function browser({ consent = { analytics: true, marketing: true }, overrides = {}, deferred = false } = {}) {
  const localStorage = new Storage(), scripts = [], warnings = [];
  localStorage.setItem("promoapp-consent-v1", JSON.stringify(consent));
  const window = { location: { origin: "https://example.invalid", search: "?email=never-transmit&gclid=private-click" }, dataLayer: [] };
  const config = { ga4Id: "G-OFFLINE", googleAdsId: "AW-123456", googleAdsLeadLabel: "Form_Only",
    googleAdsWhatsAppLabel: "WhatsApp_Only", metaPixelId: "123456", ...overrides };
  let release;
  const gate = deferred ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  const module = { exports: {} };
  vm.runInNewContext(outputFiles[0].text, {
    module, exports: module.exports, console: { ...console, warn: (...args) => warnings.push(args) },
    URLSearchParams, Date, crypto: { randomUUID }, localStorage, sessionStorage: new Storage(), window,
    document: { title: "WhatsApp", getElementById: id => scripts.find(s => s.id === id),
      createElement: () => ({}), head: { appendChild: node => scripts.push(node) } },
    fetch: async (path) => {
      if (path === "/api/visits") return { ok: true };
      await gate;
      return { ok: true, json: async () => ({ ...config }) };
    },
  });
  const tracking = module.exports;
  tracking.trackPage("/whatsapp");
  const initialized = tracking.initTracking();
  if (!deferred) await initialized;
  return { tracking, initialized, release, window, scripts, warnings, localStorage,
    calls: name => window.dataLayer.filter(e => e[0] === "event" && e[1] === name) };
}
const both = await browser();
await both.tracking.trackWhatsAppLanding("hero");
await both.tracking.trackWhatsAppLanding("sticky");
assert.equal(both.calls("whatsapp_click").length, 2);
assert.equal(both.calls("conversion").length, 2);
assert.equal(both.calls("conversion")[0][2].send_to, "AW-123456/WhatsApp_Only");
assert.notEqual(both.calls("conversion")[0][2].transaction_id, both.calls("conversion")[1][2].transaction_id);
assert.equal(both.window.fbq.queue.filter(e => e[1] === "WhatsAppClick").length, 2);
assert.equal(both.window.fbq.queue.filter(e => e[1] === "Lead").length, 0);
assert.ok(!JSON.stringify(both.window.dataLayer).includes("never-transmit"));
assert.ok(!JSON.stringify(both.window.dataLayer).includes("private-click"));
both.tracking.trackPage("/siti-web");
both.tracking.trackWhatsApp("siti-web", "hero");
await both.tracking.trackWhatsAppLanding("hero");
assert.equal(both.calls("conversion").length, 2, "other pages must not generate the new conversion");
both.tracking.trackConversion("siti-web", "form", "synthetic-lead");
assert.equal(both.calls("conversion").at(-1)[2].send_to, "AW-123456/Form_Only");
console.log("OK: both landing buttons, distinct click IDs, existing Meta/lead tracking and other pages preserved");
const sectorClicks = await browser({ overrides: publicConfig });
for (const { slug } of choices) await sectorClicks.tracking.trackWhatsAppLanding("sector", slug);
assert.equal(sectorClicks.calls("conversion").length, choices.length);
assert.ok(sectorClicks.calls("conversion").every(event => event[2].send_to === "AW-18500380450/sLl9CMfG_JgdEKLO1fVE"));
assert.equal(new Set(sectorClicks.calls("conversion").map(event => event[2].transaction_id)).size, choices.length);
assert.ok(sectorClicks.scripts.some(script => script.src === "https://www.googletagmanager.com/gtag/js?id=AW-18500380450"));
assert.equal(sectorClicks.scripts.filter(script => script.src.includes("gtag/js")).length, 1);
assert.equal(JSON.stringify(sectorClicks.window.fbq.queue.filter(event => event[1] === "WhatsAppClick").map(event => event[2].sector)), JSON.stringify(choices.map(choice => choice.slug)));
assert.equal(sectorClicks.calls("whatsapp_click").length, 0, "GA4 is intentionally unconfigured in the site's public config");
await sectorClicks.tracking.trackWhatsAppLanding("sector", "non-disponibile");
assert.equal(sectorClicks.calls("conversion").length, choices.length);
const sectorAnalytics = await browser();
for (const { slug } of choices) await sectorAnalytics.tracking.trackWhatsAppLanding("sector", slug);
assert.deepEqual(sectorAnalytics.calls("whatsapp_click").map(event => event[2].sector), choices.map(choice => choice.slug));
console.log("OK: configured Google tag and all five choices use the dedicated conversion, with distinct sector context");
for (const consent of [{ analytics: false, marketing: false }, { analytics: true, marketing: false }]) {
  const denied = await browser({ consent });
  await denied.tracking.trackWhatsAppLanding("hero");
   await denied.tracking.trackWhatsAppLanding("sector", "ristoranti");
  assert.equal(denied.calls("conversion").length, 0);
  assert.equal(denied.scripts.filter(s => s.src.includes("facebook")).length, 0);
  if (!consent.analytics) assert.equal(denied.scripts.length, 0);
   else assert.equal(denied.calls("whatsapp_click").length, 2);
}
const marketing = await browser({ consent: { analytics: false, marketing: true } });
await marketing.tracking.trackWhatsAppLanding("sticky");
assert.equal(marketing.calls("conversion").length, 1);
const missing = await browser({ overrides: { googleAdsWhatsAppLabel: "" } });
await missing.tracking.trackWhatsAppLanding("hero");
assert.equal(missing.calls("conversion").length, 0);
assert.equal(missing.warnings.length, 1);
for (const overrides of [{ googleAdsId: "INVALID" }, { googleAdsWhatsAppLabel: "invalid/label" }]) {
  const invalid = await browser({ overrides });
  await invalid.tracking.trackWhatsAppLanding("hero");
  assert.equal(invalid.calls("conversion").length, 0);
}
const revoked = await browser();
revoked.localStorage.setItem("promoapp-consent-v1", JSON.stringify({ analytics: false, marketing: false }));
await revoked.tracking.trackWhatsAppLanding("hero");
assert.equal(revoked.calls("conversion").length, 0);
console.log("OK: consent denied, analytics-only, marketing-only, revoked consent and missing/invalid labels");
const slow = await browser({ deferred: true });
const fastClick = slow.tracking.trackWhatsAppLanding("hero");
slow.release(); await slow.initialized; await fastClick;
assert.equal(slow.calls("conversion").length, 1);
const changed = await browser({ deferred: true });
const pendingClick = changed.tracking.trackWhatsAppLanding("hero");
changed.localStorage.setItem("promoapp-consent-v1", JSON.stringify({ analytics: false, marketing: false }));
changed.release(); await changed.initialized; await pendingClick;
assert.equal(changed.calls("conversion").length, 0);
const gtm = await browser({ overrides: { gtmId: "GTM-OFFLINE" } });
await gtm.tracking.trackWhatsAppLanding("hero");
assert.equal(gtm.window.dataLayer.filter(e => e.event === "whatsapp_click").length, 1);
assert.equal(gtm.window.dataLayer.filter(e => e.event === "whatsapp_ads_conversion").length, 1);
assert.equal(gtm.calls("conversion").length, 0);
assert.equal(gtm.scripts.filter(s => s.src.includes("gtag/js")).length, 0);
await gtm.tracking.trackWhatsAppLanding("sector", "ristoranti");
assert.equal(gtm.window.dataLayer.filter(e => e.event === "whatsapp_ads_conversion").length, 2);
assert.equal(gtm.window.dataLayer.filter(e => e.event === "whatsapp_ads_conversion").at(-1).sector, "ristoranti");
console.log("OK: fast clicks while config loads, consent changes and GTM ownership without a duplicate Google tag");

// Exercise the real page's JSX links and banner-offset effect with a tiny React harness.
const page = await build({ entryPoints: [new URL("../src/pages/WhatsAppLanding.tsx", import.meta.url).pathname],
  bundle: true, write: false, platform: "browser", format: "cjs", jsx: "automatic",
  define: { "import.meta.env.BASE_URL": '"/test-base/"' },
  plugins: [{ name: "offline-ui", setup(b) {
    b.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, args => ({ path: args.path, namespace: "fake-react" }));
    b.onLoad({ filter: /.*/, namespace: "fake-react" }, args => ({ loader: "js", contents:
      args.path === "analytics" ? "export const trackWhatsAppLanding=(...args)=>globalThis.clicks.push(args);" :
      args.path === "react" ? "export const useEffect=fn=>globalThis.effects.push(fn); export const useRef=value=>({current:value});" :
        "export const jsx=(type,props)=>({type,props}); export const jsxs=jsx;" }));
    b.onResolve({ filter: /\/lib\/analytics$/ }, () => ({ path: "analytics", namespace: "fake-react" }));
    b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  } }],
});
const effects = [], clicks = [], offsets = new Map();
let panel = { getBoundingClientRect: () => ({ height: 280 }) }, mutationCallback, resizeCallback;
const uiModule = { exports: {} };
const ui = vm.createContext({ module: uiModule, exports: uiModule.exports, effects, clicks, URLSearchParams,
  window: { addEventListener() {}, removeEventListener() {} },
  document: { body: {}, querySelector: () => panel },
  MutationObserver: class { constructor(fn) { mutationCallback = fn; } observe() {} disconnect() {} },
  ResizeObserver: class { constructor(fn) { resizeCallback = fn; } observe() {} disconnect() {} } });
vm.runInContext(page.outputFiles[0].text, ui);
const tree = uiModule.exports.default();
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(2).flatMap(nodes)];
}
const elements = nodes(tree);
assert.ok(!elements.some(n => ["nav", "form", "iframe", "img"].includes(n.type)));
const buttons = elements.filter(n => n.type === "a" && n.props.href.startsWith("https://wa.me/"));
assert.equal(buttons.length, 2 + choices.length);
for (const [index, link] of buttons.entries()) {
  const url = new URL(link.props.href);
  assert.equal(url.pathname, "/393793602035");
   assert.equal(url.searchParams.get("text"), index < choices.length
     ? choices[index].message : "Ciao PromoApp, vorrei informazioni per la mia attività.");
   if (index < choices.length) assert.equal(link.props.children, choices[index].label);
  assert.equal(link.props.target, "_blank");
  assert.equal(link.props.rel, "noopener noreferrer");
  link.props.onClick();
}
assert.equal(JSON.stringify(clicks), JSON.stringify([...choices.map(choice => ["sector", choice.slug]), ["hero"], ["sticky"]]));
assert.equal(elements.filter(node => node.type === "article").length, 0, "compact choice grid, not long sector catalogue");
assert.equal(elements.find(node => node.type === "h2").props.children, "Che attività hai?");
assert.equal(buttons[4].props.className, "wl-sector-cta wl-sector-other");
assert.ok(buttons[5].props.children.includes("Oppure scrivici direttamente"));
assert.ok(elements.some(node => node.props?.children === "Seguiamo pochi progetti al mese per curarli bene: scrivici ora per una demo gratuita entro 48 ore."));
assert.ok(elements.some(node => node.props?.children === "Nessun vincolo"));
assert.ok(elements.some(node => node.props?.children === "Parli direttamente con chi realizza il tuo progetto, non con un call center."));
const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
assert.match(mainSource, /import WhatsAppLanding from/);
assert.ok(!/WhatsAppLanding\s*=\s*lazy/.test(mainSource));
assert.ok(elements.some(n => n.type === "a" && n.props.href === "/test-base/privacy.html"));
assert.ok(elements.some(n => n.type === "a" && n.props.href === "/test-base/cookie.html"));
tree.props.ref.current = { style: { setProperty: (key, value) => offsets.set(key, value) } };
const cleanup = effects[0]();
assert.equal(offsets.get("--wl-consent"), "280px");
panel = { getBoundingClientRect: () => ({ height: 350 }) }; resizeCallback();
assert.equal(offsets.get("--wl-consent"), "350px");
panel = null; mutationCallback();
assert.equal(offsets.get("--wl-consent"), "0px");
cleanup();
const css = await readFile(new URL("../src/styles/whatsapp-landing.css", import.meta.url), "utf8");
assert.ok(css.includes("env(safe-area-inset-bottom) + var(--wl-consent)"), "mobile footer clears both overlays");
assert.ok(css.includes(".wl-page{padding-bottom:var(--wl-consent)}"), "desktop footer clears consent panel");
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"));
assert.ok(css.includes(".wl-sector-other{grid-column:1/-1}"));
assert.ok(css.includes("min-height:64px"));
console.log("OK: real CTA handlers/URLs, base-prefixed privacy links, no forms/navigation and sticky clears cookie controls");

if (process.argv.includes("--production")) {
  const html = await readFile(new URL("../dist/public/whatsapp/index.html", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../dist/public/sitemap.xml", import.meta.url), "utf8");
  const toml = await readFile(new URL("../.replit-artifact/artifact.toml", import.meta.url), "utf8");
  assert.ok(html.includes("<title>Parliamo del tuo progetto | PromoApp.it</title>"));
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.ok(!sitemap.includes("/whatsapp"));
  assert.match(html, /<link rel="stylesheet"[^>]*href="[^"]*\/assets\/[^"]+\.css"/);
  assert.equal((html.match(/href="https:\/\/wa.me\//g) ?? []).length, 2 + choices.length);
  for (const choice of choices) assert.ok(html.includes(choice.label));
  assert.ok(html.indexOf('class="wl-points"') < html.indexOf("Che attività hai?"));
  assert.ok(html.indexOf("Che attività hai?") < html.indexOf("Oppure scrivici direttamente"));
  assert.ok(!/<(?:nav|form|iframe|img)\b/.test(html));
  assert.ok(!html.includes("marketing-float"));
  for (const route of ["/whatsapp", "/whatsapp/"]) {
    assert.ok(toml.includes(`from = "${route}"\nto = "/whatsapp/index.html"`));
    assert.ok(toml.indexOf(`from = "${route}"`) < toml.indexOf('from = "/*"'));
  }
  // Serve the built files using the validated production rewrite order, not Vite's SPA fallback.
  const rules = [...toml.matchAll(/\[\[services.production.rewrites\]\]\s*from = "([^"]+)"\s*to = "([^"]+)"/g)]
    .map(([, from, to]) => ({ from, to }));
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      const file = path.startsWith("/assets/") ? path : rules.find(rule => rule.from === path || rule.from === "/*")?.to;
      if (!file) { res.writeHead(404).end(); return; }
      const data = await readFile(new URL(`../dist/public${file}`, import.meta.url));
      res.setHeader("Content-Type", file.endsWith(".css") ? "text/css" : "text/html; charset=utf-8");
      res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ["/whatsapp", "/whatsapp/", "/whatsapp?gclid=synthetic&utm_campaign=test"]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), html);
    }
    const cssPath = html.match(/href="([^"]*\/assets\/[^"]+\.css)"/)[1];
    const cssResponse = await fetch(`${base}${cssPath}`);
    assert.equal(cssResponse.status, 200);
    assert.ok((await cssResponse.text()).includes(".wl-page"));
    const sitiWeb = await fetch(`${base}/siti-web`);
    const sitiHtml = await sitiWeb.text();
    assert.equal(sitiWeb.status, 200);
    assert.match(sitiHtml, /Sempre incluso<\/h3>[\s\S]*?Design responsive per smartphone, tablet e computer[\s\S]*?Modulo di contatto funzionante[\s\S]*?Da concordare nel preventivo/);
    const offersSource = new URL("../src/lib/sector-offers.ts", import.meta.url).pathname;
    const offersBundle = await build({ entryPoints: [offersSource], bundle: true, write: false, platform: "node", format: "cjs" });
    const offerModule = { exports: {} };
    vm.runInNewContext(offersBundle.outputFiles[0].text, { module: offerModule, exports: offerModule.exports });
    for (const [slug, sector] of Object.entries(sectors)) {
      for (const suffix of ["", "/"]) {
        const response = await fetch(`${base}/per/${slug}${suffix}`);
        const sectorHtml = (await response.text()).replaceAll("&amp;", "&").replaceAll("&#x27;", "'");
        assert.equal(response.status, 200);
        assert.ok(sectorHtml.includes(sector.headline), `${slug}: own prerender, not homepage fallback`);
        assert.ok(sectorHtml.includes(offerModule.exports.sectorOfferCopy[slug].website));
        assert.ok(sectorHtml.includes(offerModule.exports.sectorOfferCopy[slug].webapp));
      }
    }
    const homeHtml = await readFile(new URL("../dist/public/index.html", import.meta.url), "utf8");
    assert.ok(!/href="\/admin"/.test(homeHtml), "no public Admin footer link");
  } finally { await new Promise(resolve => server.close(resolve)); }
  console.log("OK: production prerender/CSS/noindex, HTTP rewrites, 11 distinct sector offers, website inclusions and no public Admin link");
}
