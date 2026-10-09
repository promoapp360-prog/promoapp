import assert from "node:assert/strict";
import test from "node:test";
import { createHmac, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { createAdminRouter } from "../src/routes/admin";
import { createVisitsRouter } from "../src/routes/visits";

const PASSWORD = "Synthetic-admin-caffè-中文!";
const KEY = "Synthetic-only-session-signing-key";
const contact = { id: "contact-test", nomeAttivita: "Attività di prova", settore: "Test", whatsapp: "+390000000",
  email: "test@example.invalid", messaggio: "Messaggio di prova", servizio: "generale", pagina: "/", stato: "Nuovo", createdAt: new Date().toISOString() };
const review = { id: "review-test", nome: "Persona di prova", attivita: "Test", testo: "Recensione di prova non pubblica",
  stelle: "5", verificata: false, createdAt: new Date().toISOString() };

async function withApp(run: (base: string, records: unknown[]) => Promise<void>, secret: string | undefined = PASSWORD, key: string | undefined = KEY) {
  let contacts = [{ ...contact }], reviews = [{ ...review }];
  const visits: { id: string; sessionId: string; path: string }[] = [];
  const records: unknown[] = [];
  const data = {
    async overview(days: number) {
      return { days, contacts: contacts.length, newContacts: contacts.filter(c => c.stato === "Nuovo").length,
        reviews: reviews.length, pendingReviews: reviews.filter(r => !r.verificata).length,
        averageRating: reviews.some(r => r.verificata) ? 5 : null, visits: new Set(visits.map(v => v.sessionId)).size,
        pageViews: visits.length, trackingStartedAt: visits.length ? new Date().toISOString() : null, daily: [], pages: [] };
    },
    async contacts() { return contacts; },
    async updateContact(id: string, stato: string) {
      const found = contacts.find(c => c.id === id);
      if (found) found.stato = stato;
      return found;
    },
    async reviews() { return reviews; },
    async publishReview(id: string, verificata: boolean) {
      const found = reviews.find(r => r.id === id);
      if (found) found.verificata = verificata;
      return found;
    },
    async deleteReview(id: string) {
      const found = reviews.find(r => r.id === id);
      reviews = reviews.filter(r => r.id !== id); return found;
    },
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { warn: (...args: unknown[]) => records.push(args), error: (...args: unknown[]) => records.push(args) } }); next();
  });
  app.use("/api", createAdminAuthorization(() => secret, () => key), createAdminRouter(data),
    createVisitsRouter(async input => { if (!visits.some(v => v.id === input.id)) visits.push(input); }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`, records); }
  finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}
const body = (value: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
async function login(base: string) {
  const response = await fetch(`${base}/admin/login`, body({ password: ` ${PASSWORD}\n` }));
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/); assert.match(cookie, /Path=\/api/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(!cookie.includes(PASSWORD));
  const result = await response.json();
  assert.equal(result.authenticated, true); assert.match(result.csrfToken, /^[a-f0-9]{48}$/);
  return { Cookie: cookie.split(";")[0], "x-admin-csrf": result.csrfToken, "Content-Type": "application/json" };
}

test("Unicode login creates a session; session survives a new middleware instance; legacy headers cannot authenticate", async () => {
  let cookie: string;
  await withApp(async base => {
    for (const headers of [{}, { "x-admin-password": PASSWORD.replace(/[^a-z]/gi, "") }, { "x-admin-credential": Buffer.from(PASSWORD).toString("base64") }]) {
      assert.equal((await fetch(`${base}/admin/contacts`, { headers })).status, 401);
    }
    const auth = await login(base); cookie = auth.Cookie;
    const resumed = await fetch(`${base}/admin/session`, { headers: { Cookie: cookie } });
    assert.equal(resumed.status, 200); assert.equal((await resumed.json()).csrfToken, auth["x-admin-csrf"]);
    for (const path of ["/admin/contacts", "/admin/reviews", "/admin/overview"]) {
      assert.equal((await fetch(`${base}${path}`, { headers: { Cookie: cookie } })).status, 200);
    }
    for (const path of ["/admin/verify", "/admin/progetti", "/admin/clienti", "/admin/codes", "/admin/acconti", "/admin/leads"]) {
      assert.equal((await fetch(`${base}${path}`, { headers: auth })).status, 404);
    }
  });
  await withApp(async base => { assert.equal((await fetch(`${base}/admin/session`, { headers: { Cookie: cookie! } })).status, 200); });
});

test("contact messages are readable; status changes persist and update statistics; invalid/not-found states fail", async () => {
  await withApp(async base => {
    const auth = await login(base);
    const listed = await (await fetch(`${base}/admin/contacts`, { headers: auth })).json();
    assert.equal(listed[0].messaggio, contact.messaggio); assert.equal(listed[0].email, contact.email);
    for (const [id, value, expected] of [["contact-test", "bad", 400], ["missing", "Contattato", 404], ["contact-test", "Contattato", 200]] as const) {
      const result = await fetch(`${base}/admin/contacts/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ stato: value }) });
      assert.equal(result.status, expected);
    }
    const after = await (await fetch(`${base}/admin/contacts`, { headers: auth })).json();
    assert.equal(after[0].stato, "Contattato");
    const stats = await (await fetch(`${base}/admin/overview?days=7`, { headers: auth })).json();
    assert.equal(stats.contacts, 1); assert.equal(stats.newContacts, 0); assert.equal(stats.days, 7);
    assert.equal((await fetch(`${base}/admin/overview?days=17`, { headers: auth })).status, 400);
  });
});

test("reviews can be approved, hidden, and deleted, with fresh statistics and not-found checks", async () => {
  await withApp(async base => {
    const auth = await login(base);
    const patch = (value: unknown, id = review.id) => fetch(`${base}/admin/reviews/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ verificata: value }) });
    assert.equal((await patch("true")).status, 400); assert.equal((await patch(true, "missing")).status, 404);
    assert.equal((await patch(true)).status, 200);
    let stats = await (await fetch(`${base}/admin/overview`, { headers: auth })).json();
    assert.equal(stats.pendingReviews, 0); assert.equal(stats.averageRating, 5);
    assert.equal((await patch(false)).status, 200);
    stats = await (await fetch(`${base}/admin/overview`, { headers: auth })).json();
    assert.equal(stats.pendingReviews, 1); assert.equal(stats.averageRating, null);
    assert.equal((await fetch(`${base}/admin/reviews/${review.id}`, { method: "DELETE", headers: auth })).status, 204);
    assert.deepEqual(await (await fetch(`${base}/admin/reviews`, { headers: auth })).json(), []);
    assert.equal((await fetch(`${base}/admin/reviews/${review.id}`, { method: "DELETE", headers: auth })).status, 404);
  });
});

test("writes require session plus CSRF; cross-origin access and password fields cannot bypass authorization", async () => {
  await withApp(async base => {
    const auth = await login(base), path = `${base}/admin/contacts/${contact.id}`;
    assert.equal((await fetch(path, body({ password: PASSWORD, stato: "Contattato" }))).status, 401);
    for (const csrf of ["", "wrong"]) {
      assert.equal((await fetch(path, { method: "PATCH", headers: { ...auth, "x-admin-csrf": csrf }, body: JSON.stringify({ stato: "Contattato" }) })).status, 403);
    }
    assert.equal((await fetch(`${base}/admin/session`, { headers: { ...auth, Origin: "https://untrusted.example.invalid" } })).status, 403);
    const tampered = auth.Cookie.slice(0, -1) + (auth.Cookie.endsWith("a") ? "b" : "a");
    assert.equal((await fetch(`${base}/admin/session`, { headers: { Cookie: tampered } })).status, 401);
    const expiredPayload = `${Math.floor(Date.now() / 1000) - 1}.${"a".repeat(48)}`;
    const mac = createHmac("sha256", KEY).update(PASSWORD).update("\0").update(expiredPayload).digest("hex");
    assert.equal((await fetch(`${base}/admin/session`, { headers: { Cookie: `promoapp_admin=${expiredPayload}.${mac}` } })).status, 401);
    const logout = await fetch(`${base}/admin/logout`, { method: "POST", headers: auth });
    assert.equal(logout.status, 200); assert.match(logout.headers.get("set-cookie")!, /Expires=Thu, 01 Jan 1970/);
    assert.equal((await fetch(`${base}/admin/session`)).status, 401);
  });
});

test("missing configuration fails closed; ten failures are rate limited without logging credentials", async () => {
  for (const [password, key] of [["", KEY], [PASSWORD, ""]] as const) {
    await withApp(async base => { assert.equal((await fetch(`${base}/admin/login`, body({ password: PASSWORD }))).status, 503); }, password, key);
  }
  await withApp(async (base, records) => {
    assert.equal((await fetch(`${base}/admin/login`, { method: "POST", body: PASSWORD })).status, 415);
    for (let i = 0; i < 10; i++) assert.equal((await fetch(`${base}/admin/login`, body({ password: "wrong-fixture" }))).status, 401);
    const response = await fetch(`${base}/admin/login`, body({ password: PASSWORD }));
    assert.equal(response.status, 429); assert.ok(Number(response.headers.get("Retry-After")) > 0);
    assert.ok(!JSON.stringify(records).includes(PASSWORD)); assert.ok(!JSON.stringify(records).includes("wrong-fixture"));
  });
});

test("site visits require consent, exclude private pages and bots, deduplicate events and count sessions", async () => {
  await withApp(async base => {
    const visit = { id: randomUUID(), sessionId: randomUUID(), path: "/", analyticsConsent: true };
    for (const invalid of [{ ...visit, analyticsConsent: false }, { ...visit, path: "/admin" }, { ...visit, path: "/lavori/private" }, { ...visit, path: "/?email=private" }, { ...visit, id: "bad" }]) {
      assert.equal((await fetch(`${base}/visits`, body(invalid))).status, 400);
    }
    assert.equal((await fetch(`${base}/visits`, { ...body(visit), headers: { ...body(visit).headers, "User-Agent": "ExampleBot" } })).status, 204);
    for (const input of [visit, visit, { ...visit, id: randomUUID(), path: "/siti-web" }]) {
      assert.equal((await fetch(`${base}/visits`, body(input))).status, 204);
    }
    const auth = await login(base);
    const stats = await (await fetch(`${base}/admin/overview`, { headers: auth })).json();
    assert.equal(stats.pageViews, 2); assert.equal(stats.visits, 1);
  });
});
