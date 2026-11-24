import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { createSiteControlsRouter } from "../src/routes/site-controls";
import type { SiteControlRequest } from "@workspace/db";

const PASSWORD = "Synthetic-site-control-admin";
const KEY = "Synthetic-site-control-session-key";
const CONFIRMATION = "Richiesta ricevuta! Riceverai il report entro 48 ore.";
const validRequest = {
  siteUrl: "example.com",
  nomeAttivita: "Attività di prova",
  email: "test@example.invalid",
  authorization: true,
  privacyAccepted: true,
  honeypot: "",
};

function mockRepository() {
  const records: SiteControlRequest[] = [];
  const repository = {
    async create(input: { siteUrl: string; nomeAttivita: string; email: string | null; whatsapp: string | null }) {
      const record: SiteControlRequest = {
        id: `00000000-0000-4000-8000-${String(records.length + 1).padStart(12, "0")}`,
        ...input,
        authorization: true,
        privacyAccepted: true,
        consentedAt: new Date(),
        status: "Nuova",
        notification: "pending",
        createdAt: new Date(),
      };
      records.unshift(record);
      return record;
    },
    async list(status?: string) {
      return status ? records.filter((record) => record.status === status) : [...records];
    },
    async updateStatus(id: string, status: "Nuova" | "In analisi" | "Report inviato" | "Cliente acquisito") {
      const record = records.find((item) => item.id === id);
      if (record) record.status = status;
      return record;
    },
    async markNotification(id: string, notification: "sent" | "pending") {
      const record = records.find((item) => item.id === id);
      if (record) record.notification = notification;
    },
  };
  return { repository, records };
}

async function withApp(run: (base: string, state: ReturnType<typeof mockRepository>) => Promise<void>) {
  const state = mockRepository();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { warn: () => {}, error: () => {} } });
    next();
  });
  app.use("/api", createAdminAuthorization(() => PASSWORD, () => KEY), createSiteControlsRouter({
    repository: state.repository,
    notify: async () => true,
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`, state);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const post = (value: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

async function login(base: string) {
  const response = await fetch(`${base}/admin/login`, post({ password: PASSWORD }));
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  const session = await response.json() as { csrfToken: string };
  return { Cookie: cookie, "x-admin-csrf": session.csrfToken };
}

test("site control accepts authorized requests with either contact and adds https when missing", async () => {
  await withApp(async (base, state) => {
    const first = await fetch(`${base}/controlli`, post(validRequest));
    assert.equal(first.status, 201);
    assert.deepEqual(await first.json(), { success: true, message: CONFIRMATION });
    assert.equal(state.records[0].siteUrl, "https://example.com/");
    assert.equal(state.records[0].email, "test@example.invalid");
    assert.equal(state.records[0].notification, "sent");

    const second = await fetch(`${base}/controlli`, post({
      ...validRequest, siteUrl: "http://site.example.test", email: "", whatsapp: "+39 333 123 4567",
    }));
    assert.equal(second.status, 201);
    assert.equal(state.records[0].siteUrl, "http://site.example.test/");
    assert.equal(state.records[0].whatsapp, "+39 333 123 4567");
  });
});

test("invalid URL, missing contact or missing authorization is rejected without saving", async () => {
  await withApp(async (base, state) => {
    const invalidRequests = [
      { ...validRequest, siteUrl: "ftp://example.com" },
      { ...validRequest, siteUrl: "https://user:secret@example.com" },
      { ...validRequest, email: "", whatsapp: "" },
      { ...validRequest, email: "not-an-email" },
      { ...validRequest, authorization: false },
      { ...validRequest, privacyAccepted: false },
      { ...validRequest, whatsapp: "abc" },
    ];
    for (const [index, request] of invalidRequests.entries()) {
      assert.equal((await fetch(`${base}/controlli`, post(request))).status, 400, `invalid case ${index}`);
    }
    assert.equal(state.records.length, 0);
  });
});

test("honeypot submissions receive the normal confirmation but are not stored", async () => {
  await withApp(async (base, state) => {
    const response = await fetch(`${base}/controlli`, post({ honeypot: "bot-filled-field" }));
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { success: true, message: CONFIRMATION });
    assert.equal(state.records.length, 0);
  });
});

test("public submission rate limit allows five requests per hour per IP", async () => {
  await withApp(async (base, state) => {
    for (let i = 0; i < 5; i++) assert.equal((await fetch(`${base}/controlli`, post(validRequest))).status, 201);
    const limited = await fetch(`${base}/controlli`, post(validRequest));
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("retry-after")) > 0);
    assert.equal(state.records.length, 5);
  });
});

test("admin requests are protected, filter by status and update status with CSRF", async () => {
  await withApp(async (base, state) => {
    assert.equal((await fetch(`${base}/admin/controlli`)).status, 401);
    await fetch(`${base}/controlli`, post(validRequest));
    const auth = await login(base);
    const listed = await fetch(`${base}/admin/controlli`, { headers: { Cookie: auth.Cookie } });
    assert.equal(listed.status, 200);
    const requests = await listed.json() as SiteControlRequest[];
    assert.equal(requests.length, 1);
    assert.equal((await fetch(`${base}/admin/controlli?status=invalid`, { headers: auth })).status, 400);
    const id = state.records[0].id;
    const path = `${base}/admin/controlli/${id}`;
    assert.equal((await fetch(path, { method: "PATCH", headers: { Cookie: auth.Cookie, "Content-Type": "application/json" }, body: JSON.stringify({ status: "In analisi" }) })).status, 403);
    const updated = await fetch(path, {
      method: "PATCH",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "In analisi" }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json() as SiteControlRequest).status, "In analisi");
    assert.equal((await fetch(`${base}/admin/controlli?status=Nuova`, { headers: auth })).status, 200);
    assert.equal((await (await fetch(`${base}/admin/controlli?status=Nuova`, { headers: auth })).json() as SiteControlRequest[]).length, 0);
  });
});
