// Isolated HTTP/auth/DB fixtures: never accesses real credentials or customer data.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { once } from "node:events";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(new URL("../../api-server/package.json", import.meta.url));
const webRequire = createRequire(new URL("../package.json", import.meta.url));
const { build } = require("esbuild"), express = require("express");
async function moduleAt(path, globals = {}, options = {}) {
  const built = await build({ entryPoints: [resolve(root, path)], bundle: true, write: false, format: "cjs", platform: "node", ...options });
  const module = { exports: {} };
  vm.runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, require, console, Date, Buffer, ...globals });
  return module.exports;
}
const values = await moduleAt("../api-server/src/lib/commercial-values.ts");
const sales = await moduleAt("src/lib/lead-sales.ts");
assert.equal(sales.parseEuros("1200,50"), 120050);
assert.equal(sales.parseEuros("0"), 0); assert.equal(sales.parseEuros(""), null);
for (const invalid of ["-1", "1.234", "1.2.3", "1,234", "NaN", "Infinity", "21474836.48"]) assert.throws(() => sales.parseEuros(invalid));
const original = [{ event: "generate_lead", at: "2026-10-08T00:00:00Z" }];
const next = values.recordCommercialValues(original, { quoteAmountCents: 120050, saleAmountCents: 95000 });
assert.equal(original.length, 1); assert.equal(next.length, 2);
assert.equal(values.commercialValues(next).saleAmountCents, 95000);
assert.equal(values.recordCommercialValues(next, { quoteAmountCents: 120050 }).length, 2);
const cleared = values.recordCommercialValues(next, { quoteAmountCents: null });
assert.equal(values.commercialValues(cleared).quoteAmountCents, null);
assert.equal(values.commercialValues(cleared).saleAmountCents, 95000);
const summary = sales.salesSummary([
  { servizio: "webapp_custom", stato: "Cliente acquisito", saleAmountCents: 95000, qualifiedAt: "date" },
  { servizio: "web-app", stato: "Cliente acquisito", saleAmountCents: null },
  { servizio: "webapp_custom", stato: "Interessato", saleAmountCents: 500000 },
  { servizio: "website_399", stato: "Preventivo inviato", saleAmountCents: null },
]);
assert.equal(summary[0].won, 2); assert.equal(summary[0].missing, 1);
assert.equal(summary[0].revenue, 95000); assert.equal(summary[0].qualified, 1);
assert.equal(summary[0].negotiations, 1); assert.equal(summary[1].quotes, 1);
console.log("OK importi precisi, null/zero distinti, rimozione, storico preservato e vendite non inventate");

const React = webRequire("react"), { renderToStaticMarkup } = webRequire("react-dom/server");
const portfolio = await moduleAt("src/components/marketing/PortfolioExamples.tsx", { require: webRequire },
  { jsx: "automatic", external: ["react", "react/jsx-runtime"], define: { "import.meta.env.BASE_URL": '"/"' } });
assert.equal(renderToStaticMarkup(React.createElement(portfolio.default)), "");
assert.equal(portfolio.approvedProjects([{ approved: true, title: "Non completo" }]).length, 0);
assert.equal(portfolio.approvedProjects([{ approved: false, title: "Non approvato" }]).length, 0);
console.log("OK nessun progetto, segnaposto o caso cliente pubblicato senza autorizzazione completa");

const { PgDialect } = require("drizzle-orm/pg-core");
const rows = [{ id: "fixture", nomeAttivita: "Esempio non pubblicato", settore: "Altro", whatsapp: "+390000000099",
  servizio: "webapp_custom", slug: "generale", pagina: "/web-app", stato: "Nuovo", notification: "sent", privacy: true,
  createdAt: new Date(), attribution: { utm_campaign: "campagna-fixture" }, events: [...original],
  qualifiedAt: null, marketingConsent: true, dedupKey: "private", email: "private", messaggio: "private" }];
let latestCondition;
const db = {
  select: () => ({ from: () => ({ where: (condition) => {
    latestCondition = condition;
    const id = new PgDialect().sqlToQuery(condition).params.find((p) => p === "fixture" || p === "missing");
    const selected = id === "missing" ? [] : rows;
    return { orderBy: async () => selected, for: async () => selected };
  } }) }),
  update: () => ({ set: (patch) => ({ where: () => ({ returning: async () => { Object.assign(rows[0], patch); return [rows[0]]; } }) }) }),
  transaction: async (fn) => fn(db),
};
const fixtureRequire = (id) => {
  if (id === "@workspace/db") return { db, leadsTable: table };
  if (id === "../lib/leads") return { ensureLeadSchema: async () => {}, notifyLead: async () => { throw new Error("Unexpected notification"); } };
  return require(id);
};
const { pgTable, text, boolean, jsonb, timestamp } = require("drizzle-orm/pg-core");
const table = pgTable("commercial_leads", { id: text("id"), privacy: boolean("privacy"), slug: text("slug"),
  stato: text("stato"), servizio: text("servizio"), settore: text("settore"), attribution: jsonb("attribution"), createdAt: timestamp("created_at") });
const routes = await moduleAt("../api-server/src/routes/leadsAdmin.ts", { require: fixtureRequire },
  { external: ["express", "@workspace/db", "drizzle-orm", "../lib/leads"] });
const auth = await moduleAt("../api-server/src/middlewares/adminAuthorization.ts");
const app = express(); app.use(express.json());
app.use("/api", auth.createAdminAuthorization(() => "ISOLATED-FIXTURE-ONLY"), routes.default);
const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}/api/admin/leads`;
async function patch(body, id = "fixture") {
  const response = await fetch(`${base}/${id}`, { method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-password": "ISOLATED-FIXTURE-ONLY" }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
try {
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(`${base}/export`)).status, 401);
  assert.equal((await fetch(`${base}/fixture`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 401);
  assert.equal((await patch({ stato: "Nuovo", quoteAmountCents: -1 })).status, 400);
  assert.equal((await patch({ stato: "Nuovo", saleAmountCents: 1.5 })).status, 400);
  assert.equal((await patch({ stato: "Nuovo", saleAmountCents: "1000" })).status, 400);
  assert.equal((await patch({ stato: "Nuovo", saleAmountCents: 2147483648 })).status, 400);
  const first = await patch({ stato: "Preventivo inviato", quoteAmountCents: 120050 });
  assert.equal(first.status, 200); assert.equal(first.data.quoteAmountCents, 120050);
  assert.equal(first.data.saleAmountCents, null); assert.equal(rows[0].events[0].event, "generate_lead");
  assert.ok(!("dedupKey" in first.data) && !("email" in first.data) && !("messaggio" in first.data));
  const acquired = await patch({ stato: "Cliente acquisito", saleAmountCents: 95000, qualified: true });
  assert.equal(acquired.data.quoteAmountCents, 120050); assert.equal(acquired.data.saleAmountCents, 95000);
  await patch({ stato: "Cliente acquisito", saleAmountCents: 95000, qualified: true });
  assert.equal(rows[0].events.filter((e) => e.event === "qualified_lead").length, 1);
  assert.equal(rows[0].events.filter((e) => e.event === "commercial_values").length, 2);
  const list = await fetch(base, { headers: { "x-admin-password": "ISOLATED-FIXTURE-ONLY" } });
  assert.equal((await list.json())[0].saleAmountCents, 95000);
  const exported = await fetch(`${base}/export`, { headers: { "x-admin-password": "ISOLATED-FIXTURE-ONLY" } });
  const csv = await exported.text(); assert.ok(csv.includes("Servizio") && csv.includes("950.00") && csv.includes("webapp_custom"));
  assert.equal((await patch({ stato: "Nuovo" }, "missing")).status, 404);
  await patch({ stato: "Nuovo", quoteAmountCents: null, saleAmountCents: null });
  assert.equal(values.commercialValues(rows[0].events).saleAmountCents, null);
  const injection = "' OR 1=1 --";
  await fetch(`${base}?servizio=webapp_custom&tipoAttivita=Altro&campagna=${encodeURIComponent(injection)}`, { headers: { "x-admin-password": "ISOLATED-FIXTURE-ONLY" } });
  const query = new PgDialect().sqlToQuery(latestCondition);
  assert.ok(query.params.includes(injection)); assert.ok(!query.sql.includes(injection));
  assert.ok(query.params.includes("webapp_custom") && query.params.includes("web-app"));
  console.log("OK HTTP admin: auth, vincoli, salvataggio/rilettura, qualificazione unica, CSV, filtri parametrizzati, 404 e rimozione importi (DB isolato)");
} finally { await new Promise((done) => server.close(done)); }
