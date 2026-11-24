import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import type { Recensione } from "@workspace/db";
import { createReviewsRouter } from "../src/routes/recensioni";
import { buildPendingReviewEmail } from "../src/lib/review-email";

const validReview = {
  nome: "Cliente di prova",
  attivita: "Attività di prova",
  testo: "Servizio rapido e molto professionale.",
  stelle: "5",
};

function makeReview(overrides: Partial<Recensione> = {}): Recensione {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    ...validReview,
    verificata: false,
    createdAt: new Date("2026-11-24T10:00:00.000Z"),
    ...overrides,
  };
}

async function withApp(
  dependencies: Parameters<typeof createReviewsRouter>[0],
  run: (base: string) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { info: () => {}, warn: () => {}, error: () => {} } });
    next();
  });
  app.use("/api", createReviewsRouter(dependencies));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const post = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

test("valid review is saved pending approval before notification", async () => {
  const events: string[] = [];
  let saved: Recensione | undefined;
  let notified: Recensione | undefined;
  await withApp({
    saveReview: async (review) => {
      events.push("save");
      saved = review;
    },
    notify: async (review) => {
      events.push("notify");
      notified = review;
      return true;
    },
  }, async (base) => {
    const response = await fetch(`${base}/recensioni`, post(validReview));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
  });

  assert.deepEqual(events, ["save", "notify"]);
  assert.ok(saved);
  assert.equal(saved.verificata, false);
  assert.equal(saved.nome, validReview.nome);
  assert.equal(notified?.id, saved.id);
  assert.equal(notified?.testo, validReview.testo);
});

test("invalid review is rejected without saving or notifying", async () => {
  let saveCount = 0;
  let notifyCount = 0;
  await withApp({
    saveReview: async () => { saveCount++; },
    notify: async () => { notifyCount++; return true; },
  }, async (base) => {
    for (const body of [
      { ...validReview, stelle: "6" },
      { ...validReview, testo: "Breve" },
      { ...validReview, nome: " " },
    ]) {
      assert.equal((await fetch(`${base}/recensioni`, post(body))).status, 400);
    }
  });
  assert.equal(saveCount, 0);
  assert.equal(notifyCount, 0);
});

test("email failure does not fail a review already saved", async () => {
  let saveCount = 0;
  await withApp({
    saveReview: async () => { saveCount++; },
    notify: async () => { throw new Error("mail provider unavailable"); },
  }, async (base) => {
    const response = await fetch(`${base}/recensioni`, post(validReview));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
  });
  assert.equal(saveCount, 1);
});

test("failed database save does not send a notification", async () => {
  let notifyCount = 0;
  await withApp({
    saveReview: async () => { throw new Error("database unavailable"); },
    notify: async () => { notifyCount++; return true; },
  }, async (base) => {
    const response = await fetch(`${base}/recensioni`, post(validReview));
    assert.equal(response.status, 500);
  });
  assert.equal(notifyCount, 0);
});

test("review email formatter uses the moderation destination and approval link", async () => {
  const message = buildPendingReviewEmail(makeReview());
  assert.equal(message.to, "promoapp360@gmail.com");
  assert.match(message.subject, /Nuova recensione da approvare/);
  assert.match(message.text, /in attesa di approvazione/);
  assert.match(message.text, /https:\/\/www\.promoapp\.it\/admin/);
});
