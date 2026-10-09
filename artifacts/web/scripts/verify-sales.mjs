// Historical commercial-value and portfolio checks. No credentials or customer DB.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(new URL("../../api-server/package.json", import.meta.url));
const webRequire = createRequire(new URL("../package.json", import.meta.url));
const { build } = require("esbuild");
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

// The retired sales-admin endpoints are intentionally gone.
// Current HTTP/session/contact/review/visit checks: api-server/scripts/verify-admin.mjs.
