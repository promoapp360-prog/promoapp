import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import express from "express";
import { db, leadsTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import contact from "../src/routes/contatto";
import admin from "../src/routes/leadsAdmin";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { logger } from "../src/lib/logger";

// Real development DB + two real test notifications; removes only its own fixtures.
// The injected credential exists solely in this isolated test server, not in Secrets.
const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.log = logger; next(); });
app.use("/api", createAdminAuthorization(() => "isolated-test-credential"));
app.use("/api", contact, admin);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server unavailable");
const base = `http://127.0.0.1:${address.port}/api`;
let ownedId: string | undefined;
const data = {
  nome_attivita: "Verifica tecnica PromoApp (test da ignorare)",
  settore: "Ristorante / Bar / Pizzeria", whatsapp: `+39000${randomInt(100000, 999999)}`,
  privacy: true, marketingConsent: true, analyticsConsent: true, slug: "ristoranti",
  pagina: "/per/ristoranti", variant: "control",
  attribution: { utm_source: "test", utm_campaign: "verifica-tecnica", gclid: "test-non-reale" },
};
const post = (body: unknown) => fetch(`${base}/invia-contatto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const auth = { "x-admin-password": "isolated-test-credential", "Content-Type": "application/json" };
try {
  assert.equal((await post({ ...data, privacy: false })).status, 400);
  assert.equal((await post({ ...data, whatsapp: "abc" })).status, 400);
  assert.equal((await post({ ...data, website: "spam" })).status, 400);
  assert.equal((await fetch(`${base}/admin/leads`)).status, 401);
  const response = await post(data); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.success, true); assert.ok(result.leadId);
  ownedId = result.leadId;
  const [stored] = await db.select().from(leadsTable).where(eq(leadsTable.id, ownedId!));
  assert.equal(stored.slug, "ristoranti"); assert.equal(stored.attribution.gclid, "test-non-reale");
  assert.equal(stored.events.filter((event) => event.event === "generate_lead").length, 1);
  const duplicate = await (await post(data)).json();
  assert.equal(duplicate.leadId, ownedId); assert.equal(duplicate.duplicate, true);
  const listed = await (await fetch(`${base}/admin/leads?settore=ristoranti&stato=Nuovo`, { headers: auth })).json();
  assert.ok(listed.some((lead: { id: string }) => lead.id === ownedId));
  const patch = (body: unknown) => fetch(`${base}/admin/leads/${ownedId}`, { method: "PATCH", headers: auth, body: JSON.stringify(body) });
  assert.equal((await patch({ stato: "invalido" })).status, 400);
  const statusOnly = await (await patch({ stato: "Interessato" })).json();
  assert.equal(statusOnly.qualifiedAt, null);
  await patch({ stato: "Interessato", qualified: true });
  const qualified = await (await patch({ stato: "Preventivo inviato", qualified: true })).json();
  assert.ok(qualified.qualifiedAt);
  assert.equal(qualified.events.filter((event: { event: string }) => event.event === "qualified_lead").length, 1);
  const csv = await (await fetch(`${base}/admin/leads/export?settore=ristoranti`, { headers: auth })).text();
  assert.ok(csv.includes(ownedId!)); assert.ok(csv.includes("verifica-tecnica")); assert.ok(csv.includes("test-non-reale"));
  assert.equal((await fetch(`${base}/admin/leads?from=2026-02-31`, { headers: auth })).status, 400);
  // Reuse the fixture after deletion to verify no-consent minimization separately.
  await db.delete(leadsTable).where(eq(leadsTable.id, ownedId!)); ownedId = undefined;
  const without = await (await post({ ...data, marketingConsent: false, analyticsConsent: false })).json();
  ownedId = without.leadId; assert.ok(ownedId);
  const [noConsent] = await db.select().from(leadsTable).where(eq(leadsTable.id, ownedId!));
  assert.deepEqual(noConsent.attribution, {});
  logger.info({ notification: result.notification, noConsentNotification: without.notification }, "Verifica acquisizione superata: validazione, DB, duplicati, filtri, stati, qualificazione unica, CSV e consenso");
  if (result.notification !== "sent") logger.warn("Invio email non confermato; verificare configurazione Resend");
} finally {
  if (ownedId) await db.delete(leadsTable).where(eq(leadsTable.id, ownedId));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
