import assert from "node:assert/strict";
import express from "express";
import { randomInt } from "node:crypto";
import { db, leadsTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import contact from "../src/routes/contatto";
import { logger } from "../src/lib/logger";

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  if (url.startsWith("https://api.resend.com/"))
    return new Response(JSON.stringify({ name: "application_error", message: "Simulated notification outage" }), { status: 503, headers: { "Content-Type": "application/json" } });
  return realFetch(input, init);
};
const app = express();
app.use(express.json(), (req, _res, next) => { req.log = logger; next(); }, contact);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server unavailable");
let ownedId: string | undefined;
try {
  const response = await realFetch(`http://127.0.0.1:${address.port}/invia-contatto`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome_attivita: "Verifica tecnica notifica simulata", settore: "Ristorante", whatsapp: `+39000${randomInt(100000, 999999)}`, privacy: true, slug: "ristoranti", pagina: "/per/ristoranti" }),
  });
  assert.equal(response.status, 200);
  const result = await response.json(); ownedId = result.leadId;
  assert.ok(ownedId); assert.equal(result.success, true); assert.equal(result.notification, "pending");
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, ownedId!));
  assert.ok(lead); assert.equal(lead.notification, "pending");
  logger.info("Verifica superata: un guasto email non perde il contatto e non trasforma il salvataggio in un errore.");
} finally {
  globalThis.fetch = realFetch;
  if (ownedId) await db.delete(leadsTable).where(eq(leadsTable.id, ownedId));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}
