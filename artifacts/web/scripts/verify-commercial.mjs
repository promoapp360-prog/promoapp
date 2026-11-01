// Offline checks: simulated DB/email/browser only; no real leads or conversions.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import { once } from "node:events";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(new URL("../../api-server/package.json", import.meta.url));
const { build } = require("esbuild");
const express = require("express");
let groups = 0;
const ok = (name) => { groups++; console.log(`OK — ${name}`); };
async function bundle(path, options = {}) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, platform: "node", format: "cjs", ...options });
  return result.outputFiles[0].text;
}
function evaluate(code, globals = {}) {
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, require, console, Date, URLSearchParams, ...globals });
  vm.runInContext(code, context);
  return module.exports;
}
const sectors = JSON.parse(await readFile(resolve(root, "src/lib/sector-config.json"), "utf8"));
const commercial = evaluate(await bundle(resolve(root, "src/lib/commercial.ts")));
assert.equal(Object.keys(sectors).length, 11);
const descriptions = [];
for (const sector of Object.values(sectors)) {
  assert.equal(sector.benefits.length, 4);
  for (const benefit of sector.benefits) {
    assert.ok(benefit.title.length > 5 && benefit.description.length > 50);
    assert.ok(!benefit.description.includes("Una soluzione progettata sul modo"));
    descriptions.push(benefit.description);
  }
  assert.equal(sector.faq.length, 3);
  assert.equal(sector.mockup.rows.length, 3);
  assert.ok(sector.mockup.title && sector.mockup.tabs.length);
  assert.ok(!sector.offers.includes("menu") || sector.menu);
}
assert.equal(new Set(descriptions).size, 44);
ok("11 settori, 44 descrizioni distinte, 11 mockup e 33 FAQ");
for (const service of ["website", "webapp", "management"]) {
  assert.equal(commercial.prices[service].label, "399 € + IVA · Attivazione definitiva");
}
assert.equal(commercial.prices.menu.amount, 99);
assert.equal(commercial.prices.menu.label, "99 € + IVA · Attivazione definitiva");
assert.ok(commercial.prices.note.includes("da 9,90 € al mese"));
for (const route of ["", "preventivo", "siti-web", "sitiweb", "web-app", "menu-digitali", "whatsapp", ...Object.keys(sectors).map(slug => `per/${slug}`)]) {
  const html = await readFile(resolve(root, "dist/public", route, "index.html"), "utf8");
  assert.ok(!/\bda\s+399\s*€|una tantum|nessun costo ricorrente|nessun canone/i.test(html), `${route}: obsolete offer`);
  assert.ok(html.includes("da 9,90 € al mese"), `${route}: running costs visible`);
  if (route !== "menu-digitali") assert.ok(html.includes("399 €"), `${route}: activation price visible`);
}
ok("offerta 399 € per siti, web app e gestionali; Menu QR 99 €; costi tecnici da 9,90 € su tutte le landing");
const settings = { mode: "personalized_demo", demoDeliveryConfirmed: false, demoDeliveryHours: 48,
  whatsappResponseConfirmed: false, whatsappResponseHours: 2 };
assert.equal(commercial.commercialIncentive().demoActive, false);
assert.equal(commercial.commercialIncentive(settings).demoActive, false);
assert.equal(commercial.commercialIncentive({ ...settings, demoDeliveryConfirmed: true }).demoActive, true);
assert.ok(commercial.commercialIncentive({ ...settings, demoDeliveryConfirmed: true }).promise.includes("48 ore"));
for (const hours of [0, -1, null, NaN, Infinity]) {
  assert.equal(commercial.commercialIncentive({ ...settings, demoDeliveryConfirmed: true, demoDeliveryHours: hours }).demoActive, false);
}
assert.ok(!commercial.commercialIncentive(settings).responseNote.includes("entro"));
assert.ok(commercial.commercialIncentive({ ...settings, whatsappResponseConfirmed: true }).responseNote.includes("entro 2 ore"));
assert.equal(commercial.webappStartingPrice(), null);
assert.equal(commercial.webappStartingPrice({ approved: false, amount: 1000 }), null);
assert.ok(commercial.webappStartingPrice({ approved: true, amount: 1000 }).includes(new Intl.NumberFormat("it-IT").format(1000)));
for (const amount of [0, -1, null, NaN, Infinity]) assert.equal(commercial.webappStartingPrice({ approved: true, amount }), null);
ok("demo, tempi WhatsApp e prezzo facoltativo invisibili senza conferma valida");
const webRequire = createRequire(new URL("../package.json", import.meta.url));
const React = webRequire("react");
const { renderToStaticMarkup } = webRequire("react-dom/server");
const componentOptions = { jsx: "automatic", external: ["react", "react/jsx-runtime"], loader: { ".css": "empty" },
  define: { "import.meta.env.BASE_URL": '"/"' } };
const Mockup = evaluate(await bundle(resolve(root, "src/components/marketing/SectorMockup.tsx"), componentOptions),
  { require: webRequire }).default;
for (const sector of Object.values(sectors)) {
  const markup = renderToStaticMarkup(React.createElement(Mockup, { sector, businessName: "La <mia> attività" }));
  assert.ok(markup.includes("Esempio illustrativo"));
  assert.ok(markup.includes("La &lt;mia&gt; attività"));
  assert.ok(!markup.includes("<mia>"));
}
const Trust = evaluate(await bundle(resolve(root, "src/components/marketing/TrustPoints.tsx"), componentOptions),
  { require: webRequire }).default;
const trustMarkup = renderToStaticMarkup(React.createElement(Trust));
assert.equal((trustMarkup.match(/<article/g) ?? []).length, 5);
assert.ok(!trustMarkup.includes("Pagamento a fasi"));
assert.ok(!trustMarkup.includes("giorni di assistenza"));
assert.ok(!trustMarkup.includes("Chi segue il tuo progetto"));
ok("render dei mockup personalizzati con escaping e fiducia senza promesse o referenti non configurati");
const inlineErrors = [];
let preventedInvalid = 0, focusedInvalid = 0, unexpectedSubmissions = 0;
const formRequire = (id) => {
  if (id === "react") return { ...React, useId: () => "test-form", useRef: () => ({ current: false }),
    useState: (value) => [value, (next) => inlineErrors.push(next)] };
  if (id === "wouter") return { useLocation: () => ["/siti-web", () => {}] };
  if (id === "@workspace/api-client-react") return { submitContact: () => { unexpectedSubmissions++; } };
  return webRequire(id);
};
const Form = evaluate(await bundle(resolve(root, "src/components/marketing/LeadForm.tsx"), {
  ...componentOptions, external: [...componentOptions.external, "wouter", "@workspace/api-client-react"],
}), { require: formRequire }).default;
const formElement = Form({ service: "siti-web" });
assert.equal(formElement.props.noValidate, undefined);
for (const name of ["whatsapp", "nome_attivita"]) formElement.props.onInvalid({
  preventDefault() { preventedInvalid++; }, target: { name, focus() { focusedInvalid++; } },
});
assert.equal(preventedInvalid, 2); assert.equal(focusedInvalid, 2);
assert.equal(unexpectedSubmissions, 0);
assert.ok(inlineErrors[0].includes("WhatsApp") && inlineErrors[1].includes("privacy"));
ok("errore mobile inline: vincoli nativi conservati, tooltip soppresso, campo focalizzato e nessun invio");

class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}
const localStorage = new Storage(), sessionStorage = new Storage(), scripts = [];
const browser = { dataLayer: [], location: { search: "?utm_source=prova&gclid=click-simulato" } };
const tracking = evaluate(await bundle(resolve(root, "src/lib/analytics.ts"), {
  platform: "browser", define: { "import.meta.env.BASE_URL": '"/"' },
}), {
  window: browser, localStorage, sessionStorage,
  document: { getElementById: (id) => scripts.find((s) => s.id === id),
    createElement: () => ({}), head: { appendChild: (node) => scripts.push(node) } },
  fetch: async () => ({ ok: true, json: async () => ({ gtmId: "GTM-TEST", ga4Id: "G-TEST", metaPixelId: "12345" }) }),
});
await tracking.initTracking();
tracking.trackEvent("cta_click");
assert.equal(scripts.length, 0);
assert.equal(browser.dataLayer.filter((e) => e.event === "cta_click").length, 0);
localStorage.setItem("promoapp-consent-v1", JSON.stringify({ analytics: true, marketing: true }));
tracking.updateTrackingConsent({ analytics: true, marketing: true });
tracking.trackPage("/per/centri-estetici");
tracking.trackConversion("generale", "form", "lead-simulato", "centri-estetici", sectors["centri-estetici"].activity);
tracking.trackConversion("generale", "form", "lead-simulato", "centri-estetici", sectors["centri-estetici"].activity);
const acquired = browser.dataLayer.filter((e) => e.event === "generate_lead");
assert.equal(acquired.length, 1);
assert.equal(acquired[0].servizio, "sector_custom");
assert.equal(acquired[0].slug, "centri-estetici");
assert.equal(acquired[0].business_type, sectors["centri-estetici"].activity);
assert.equal(acquired[0].event_id, "lead-simulato");
assert.equal(scripts.filter((s) => s.src.includes("gtm.js")).length, 1);
assert.equal(scripts.filter((s) => s.src.includes("gtag/js")).length, 0);
assert.equal(browser.fbq.queue.filter((e) => e[1] === "Lead").length, 1);
tracking.trackWhatsApp("generale", "form", "centri-estetici");
assert.equal(browser.dataLayer.filter((e) => e.event === "generate_lead").length, 1);
tracking.trackConversion("generale", "form", "lead-tipo-non-ammesso", "centri-estetici", "dato-personale-da-non-trasmettere");
assert.equal(browser.dataLayer.filter((e) => e.event === "generate_lead").at(-1).business_type, "Altro");
assert.ok(!JSON.stringify(browser.dataLayer).includes("dato-personale-da-non-trasmettere"));
const eventsBeforePrivate = browser.dataLayer.filter((e) => e.event).length;
const pixelEventsBeforePrivate = browser.fbq.queue.length;
tracking.trackPage("/admin");
tracking.trackEvent("cta_click");
tracking.trackConversion("generale", "form", "lead-privato");
tracking.trackWhatsApp("generale", "admin");
tracking.trackPage("/per/inesistente");
tracking.trackEvent("cta_click");
tracking.trackConversion("generale", "form", "lead-sconosciuto");
tracking.trackWhatsApp("generale", "pagina-sconosciuta");
assert.equal(browser.dataLayer.filter((e) => e.event).length, eventsBeforePrivate);
assert.equal(browser.fbq.queue.length, pixelEventsBeforePrivate);
localStorage.setItem("promoapp-consent-v1", JSON.stringify({ analytics: false, marketing: false }));
tracking.updateTrackingConsent({ analytics: false, marketing: false });
tracking.trackPage("/siti-web");
tracking.trackConversion("siti-web", "form", "lead-negato");
assert.ok(!browser.dataLayer.some((e) => e.event_id === "lead-negato"));
ok("consensi, GTM non duplicato, dedup Google/Meta, WhatsApp separato e assenza di dati personali (browser simulato)");

// Real HTTP handler and generated validators, with a fake DB and fake notifier.
const rows = [];
let notifyCalls = 0, notificationSucceeds = false, storageFails = false;
const database = {
  select: () => ({ from: () => ({ where: (condition) => {
    const selected = rows.filter((row) => condition.op === "in" ? condition.value.includes(row.dedupKey) : row.dedupKey === condition.value);
    return Object.assign(Promise.resolve(selected), { limit: async (n) => selected.slice(0, n) });
  } }) }),
  insert: () => ({ values: (data) => ({ onConflictDoNothing: () => ({ returning: async () => {
    if (storageFails) throw new Error("Salvataggio simulato fallito");
    if (rows.some((row) => row.dedupKey === data.dedupKey)) return [];
    const row = { ...data, notification: "pending" }; rows.push(row); return [row];
  } }) }) }),
};
const fixtureRequire = (id) => {
  if (id === "@workspace/db") return { db: database, leadsTable: { dedupKey: "dedupKey" } };
  if (id === "drizzle-orm") return { eq: (_field, value) => ({ op: "eq", value }), inArray: (_field, value) => ({ op: "in", value }) };
  if (id === "../lib/leads") return {
    ensureLeadSchema: async () => {},
    notifyLead: async (lead) => { notifyCalls++; if (notificationSucceeds) lead.notification = "sent"; return notificationSucceeds; },
  };
  return require(id);
};
const contact = evaluate(await bundle(resolve(root, "../api-server/src/routes/contatto.ts"), {
  external: ["express", "@workspace/db", "drizzle-orm", "../lib/leads"],
}), { require: fixtureRequire, process: { env: {} } });
const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.log = { error() {}, warn() {}, info() {} }; next(); });
app.use("/api", contact.default);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = `http://127.0.0.1:${server.address().port}/api/invia-contatto`;
const sample = { nome_attivita: "Attività illustrativa di prova", settore: "Altro", whatsapp: "+393123456789",
  privacy: true, website: "", servizio: "sector_custom", slug: "centri-estetici", pagina: "/per/centri-estetici",
  attribution: { utm_source: "prova", gclid: "click-simulato" }, analyticsConsent: true, marketingConsent: false };
async function post(data, headers = {}) {
  const response = await fetch(address, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data) });
  return { status: response.status, data: await response.json() };
}
try {
  const first = await post(sample);
  assert.equal(first.status, 200); assert.equal(first.data.success, true);
  assert.equal(first.data.notification, "pending"); assert.equal(rows.length, 1);
  assert.equal(rows[0].attribution.utm_source, "prova"); assert.ok(!rows[0].attribution.gclid);
  const duplicate = await post(sample);
  assert.equal(duplicate.data.duplicate, true); assert.equal(duplicate.data.leadId, first.data.leadId);
  assert.equal(rows.length, 1); assert.equal(notifyCalls, 1);
  notificationSucceeds = true;
  const sent = await post({ ...sample, whatsapp: "+393223456789", marketingConsent: true });
  assert.equal(sent.data.notification, "sent"); assert.equal(notifyCalls, 2);
  assert.equal(rows[1].attribution.gclid, "click-simulato");
  for (const patch of [{ nome_attivita: "" }, { privacy: false }, { whatsapp: "abc" }, { website: "bot" }, { servizio: "sconosciuto" }]) {
    assert.equal((await post({ ...sample, ...patch })).status, 400);
  }
  assert.equal((await post(sample, { Origin: "https://origine-non-autorizzata.invalid" })).status, 403);
  const noConsent = await post({ ...sample, whatsapp: "+393323456789", analyticsConsent: false, marketingConsent: false });
  assert.equal(noConsent.data.success, true); assert.equal(Object.keys(rows[2].attribution).length, 0);
  storageFails = true;
  const failed = await post({ ...sample, whatsapp: "+393423456789" });
  assert.equal(failed.status, 500); assert.equal(failed.data.success, false);
  assert.equal(rows.length, 3);
  ok("HTTP contatto: salvataggio, notifica pending/sent, duplicati, privacy, honeypot, origine, attribuzione e fallimento DB (dipendenze simulate)");
} finally { await new Promise((done) => server.close(done)); }

// Exercise production sendFile paths without importing server startup/Stripe.
const publicRouting = evaluate(await bundle(resolve(root, "../api-server/src/lib/public-routing.ts"), {
  define: { "import.meta.url": JSON.stringify(new URL("../../api-server/dist/index.mjs", import.meta.url).href) },
}), { process: { env: { NODE_ENV: "production" } }, URL });
const publicApp = express();
publicRouting.registerPublicRouting(publicApp);
const publicServer = publicApp.listen(0, "127.0.0.1");
await once(publicServer, "listening");
const publicAddress = `http://127.0.0.1:${publicServer.address().port}`;
try {
  for (const [slug, sector] of Object.entries(sectors)) {
    const page = await fetch(`${publicAddress}/per/${slug}`);
    assert.equal(page.status, 200);
    const html = await page.text();
    const escapedTitle = sector.metaTitle.replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    assert.ok(html.includes(`<title>${escapedTitle}</title>`));
    assert.ok(html.includes('data-testid="sector-mockup"'));
  }
  const missing = await fetch(`${publicAddress}/per/settore-inesistente`);
  assert.equal(missing.status, 404);
  assert.ok((await missing.text()).includes("noindex"));
  const alias = await fetch(`${publicAddress}/menu-digitale?utm_source=prova`, { redirect: "manual" });
  assert.equal(alias.status, 301);
  assert.equal(alias.headers.get("Location"), "/menu-digitali?utm_source=prova");
  ok("routing produzione isolato: 11 HTML specifici, pagina 404 noindex e alias 301 con UTM");
} finally { await new Promise((done) => publicServer.close(done)); }

const receipt = evaluate(await bundle(resolve(root, "src/lib/lead-receipt.ts")), { window: {}, sessionStorage: new Storage() });
assert.throws(() => receipt.rememberLead({ success: false }, "generale"));
receipt.rememberLead({ success: true, leadId: "ricevuta-simulata", notification: "pending" }, "generale");
assert.equal(receipt.getReceipt().viewed, undefined);
receipt.markReceiptViewed();
assert.equal(receipt.getReceipt().viewed, true);
ok("ricevuta solo dopo il salvataggio, conferma coerente e marcatura anti-ripetizione");
console.log(`Verificati ${groups} gruppi di controlli. Nessun accesso al DB reale, nessuna email o conversione reale.`);
