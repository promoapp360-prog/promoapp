import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import type { Router } from "express";
import acconto from "../src/routes/acconto";
import checkout from "../src/routes/checkout";
import { getStripeSecretKey } from "../src/lib/stripeClient";
import { reset, state } from "./mocks/payments";

// No server startup or network access: invoke the real Express handlers directly.
globalThis.fetch = async () => { throw new Error("Unexpected network access"); };
const blockedFetch = globalThis.fetch;
beforeEach(() => {
  reset();
  globalThis.fetch = blockedFetch;
  process.env.STRIPE_SECRET_KEY = "sk_test_synthetic";
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_synthetic";
  process.env.REPLIT_DOMAINS = "payments.example.test,unused.example.test";
  for (const key of ["REPLIT_CONNECTORS_HOSTNAME", "REPL_IDENTITY", "WEB_REPL_RENEWAL", "REPLIT_DEPLOYMENT"]) {
    delete process.env[key];
  }
});

async function invoke(router: Router, path: string, body: unknown = {}, query = {}) {
  const layer = router.stack.find((item: any) => item.route?.path === path);
  assert.ok(layer, `Missing route ${path}`);
  let status = 200;
  let payload: any;
  let sends = 0;
  const res = {
    status(value: number) { status = value; return this; },
    json(value: unknown) { sends++; payload = value; return this; },
  };
  const result = await layer.route.stack[0].handle(
    { body, query, log: { error() {} } }, res,
  );
  assert.equal(result, undefined, "Handlers resolve without returning an Express response");
  assert.equal(sends, 1, "Exactly one response must be sent");
  return { status, payload };
}

const customer = {
  progetto: "Progetto sintetico", nome: "Test", cognome: "Cliente",
  email: "test@example.test", telefono: "000", indirizzo: "Via Test",
  cap: "00000", citta: "Test", importoEuro: "123.456", importoTotaleEuro: "300",
};
const original = {
  ...customer, id: "synthetic-project", stato: "in_attesa", tipo: "privato",
  importoCentesimi: 10000, importoTotaleCentesimi: 30000, progettoRef: null,
};
const createPaths = ["/acconto/paypal/create", "/acconto/stripe/create-session"];
const saldoPaths = ["/acconto/saldo/paypal/create", "/acconto/saldo/stripe/create-session"];
const confirmPaths = ["/acconto/paypal/confirm", "/acconto/paypal/saldo/confirm"];

for (const path of createPaths) {
  test(`${path}: invalid inputs stop before side effects`, async () => {
    for (const [changes, error] of [
      [{ progetto: " " }, "Descrizione progetto obbligatoria"],
      [{ nome: "" }, "Dati cliente incompleti"],
      [{ indirizzo: "" }, "Indirizzo obbligatorio"],
      [{ importoEuro: "0.99" }, "Importo minimo 1€"],
      [{ importoEuro: "invalid" }, "Importo minimo 1€"],
    ] as const) {
      assert.deepEqual(await invoke(acconto, path, { ...customer, ...changes }), { status: 400, payload: { error } });
    }
    assert.equal(state.reads + state.inserts.length + state.sessions.length + state.emails.length, 0);
  });

  test(`${path}: successful creation preserves cents, state and response`, async () => {
    const response = await invoke(acconto, path, customer);
    assert.equal(response.status, 200);
    assert.equal(state.inserts.length, 1);
    const saved = state.inserts[0];
    assert.equal(saved.importoCentesimi, 12346);
    assert.equal(saved.importoTotaleCentesimi, 30000);
    assert.equal(saved.stato, "in_attesa");
    assert.equal(saved.tipoPagamento, "acconto");
    if (path.includes("stripe")) assertSession("acconto", 12346, saved.id);
    else assert.deepEqual(response.payload, { accontoId: saved.id });
  });

  test(`${path}: failed save returns the same error and creates no session`, async () => {
    state.fail = "insert";
    assert.deepEqual(await invoke(acconto, path, customer), { status: 500, payload: { error: "Synthetic insert failure" } });
    assert.equal(state.sessions.length, 0);
  });
}

function assertSession(tipo: string, amount: number, id: unknown) {
  assert.equal(state.sessions.length, 1);
  const session = state.sessions[0];
  assert.deepEqual(session, {
    payment_method_types: ["card"], mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur", unit_amount: amount,
        product_data: { name: `${tipo === "saldo" ? "Saldo" : "Acconto"}: ${customer.progetto}`, description: "PromoApp.it — Sophia 2005 S.r.l." },
      }, quantity: 1,
    }],
    customer_email: customer.email,
    metadata: { accontoId: id, tipoPagamento: tipo },
    success_url: `https://payments.example.test/pagamenti?stripe_success=1&tipo=${tipo}`,
    cancel_url: "https://payments.example.test/pagamenti?stripe_cancel=1", locale: "it",
  });
  assert.deepEqual(state.clients, [{ key: "sk_test_synthetic", options: { apiVersion: "2025-08-27.basil" } }]);
}

for (const path of saldoPaths) {
  test(`${path}: missing data, invalid amount, absent project and overpayment`, async () => {
    assert.equal((await invoke(acconto, path)).status, 400);
    assert.equal((await invoke(acconto, path, { progettoRef: original.id, importoEuro: "0" })).status, 400);
    assert.equal(state.reads, 0);
    state.rows = [[]];
    assert.deepEqual(await invoke(acconto, path, { progettoRef: original.id, importoEuro: "1" }),
      { status: 404, payload: { error: "Progetto non trovato" } });
    state.rows = [[original], [{ importoCentesimi: 10000 }]];
    assert.deepEqual(await invoke(acconto, path, { progettoRef: original.id, importoEuro: "200.02" }),
      { status: 400, payload: { error: "Il saldo rimanente è 200.00€" } });
    assert.equal(state.inserts.length + state.sessions.length, 0);
  });

  test(`${path}: preserves the existing one-cent tolerance and remaining balance`, async () => {
    state.rows = [[original], [{ importoCentesimi: 10000 }]];
    const response = await invoke(acconto, path, { progettoRef: original.id, importoEuro: "200.01" });
    assert.equal(response.status, 200);
    assert.equal(state.inserts[0].importoCentesimi, 20001);
    assert.equal(state.inserts[0].progettoRef, original.id);
    assert.equal(state.inserts[0].tipoPagamento, "saldo");
    assert.equal(state.inserts[0].stato, "in_attesa");
    if (path.includes("stripe")) {
      assertSession("saldo", 20001, state.inserts[0].id);
      assert.deepEqual(response.payload, { url: "https://checkout.example.test/session" });
    } else assert.deepEqual(response.payload, { accontoId: state.inserts[0].id, saldoRimanente: 20000, progetto: customer.progetto });
  });
}

for (const path of confirmPaths) {
  test(`${path}: missing, absent and already-paid confirmations terminate once`, async () => {
    assert.deepEqual(await invoke(acconto, path), { status: 400, payload: { error: "Dati mancanti" } });
    assert.equal(state.reads, 0);
    state.rows = [[]];
    const body = { accontoId: original.id, orderId: "synthetic-order" };
    assert.deepEqual(await invoke(acconto, path, body), { status: 404, payload: { error: "Acconto non trovato" } });
    state.rows = [[{ ...original, stato: "pagato" }]];
    assert.deepEqual(await invoke(acconto, path, body), { status: 200, payload: { ok: true, already: true } });
    assert.equal(state.updates.length + state.emails.length, 0);
  });

  test(`${path}: confirmation updates only the mock and sends two mock receipts`, async () => {
    state.rows = [[original], []];
    assert.deepEqual(await invoke(acconto, path, { accontoId: original.id, orderId: "synthetic-order" }), { status: 200, payload: { ok: true } });
    assert.equal(state.updates.length, 1);
    assert.equal(state.updates[0].stato, "pagato");
    assert.equal(state.updates[0].stripePaymentIntentId, "paypal_synthetic-order");
    assert.ok(state.updates[0].paidAt instanceof Date);
    assert.equal(state.emails.length, 2);
    assert.equal(state.emails[0].to, customer.email);
  });
}

test("project lookup rejects empty email and preserves remaining-balance filtering", async () => {
  assert.deepEqual(await invoke(acconto, "/acconto/cerca-progetto"), { status: 400, payload: { error: "Email obbligatoria" } });
  assert.equal(state.reads, 0);
  state.rows = [[original, { ...original, id: "fully-paid" }], [{ importoCentesimi: 10000 }], [{ importoCentesimi: 30000 }]];
  const result = await invoke(acconto, "/acconto/cerca-progetto", {}, { email: " test@example.test " });
  assert.equal(result.status, 200);
  assert.equal(result.payload.length, 1);
  assert.equal(result.payload[0].saldoRimanente, 20000);
});

test("discount validation preserves all rejection and success responses", async () => {
  const path = "/checkout/validate-code";
  assert.deepEqual(await invoke(checkout, path), { status: 400, payload: { error: "Codice mancante" } });
  assert.equal(state.reads, 0);
  const discount = { active: true, maxUses: 2, usedCount: 0, expiresAt: null, discountPercent: 15, description: "Synthetic" };
  for (const [rows, status, error] of [
    [[], 404, "Codice sconto non valido o scaduto"],
    [[{ ...discount, active: false }], 404, "Codice sconto non valido o scaduto"],
    [[{ ...discount, usedCount: 2 }], 400, "Codice sconto esaurito"],
    [[{ ...discount, expiresAt: new Date(0) }], 400, "Codice sconto scaduto"],
  ] as const) {
    state.rows = [rows as unknown as unknown[]];
    assert.deepEqual(await invoke(checkout, path, { code: " test " }), { status, payload: { error } });
  }
  state.rows = [[discount]];
  assert.deepEqual(await invoke(checkout, path, { code: " test " }), { status: 200, payload: { valid: true, discountPercent: 15, description: "Synthetic" } });
  assert.equal(state.updates.length, 0);
});

test("bank checkout preserves plan amounts, discount rounding and usage updates", async () => {
  const path = "/checkout/bonifico";
  assert.deepEqual(await invoke(checkout, path, { piano: "missing" }), { status: 400, payload: { error: "Piano non valido" } });
  for (const [piano, importo] of Object.entries({ base: 69000, pro: 89000, gestionale360: 19900, agentipro: 19900, sitoistituzionale: 39900 })) {
    const response = await invoke(checkout, path, { piano, customerName: "Test" });
    assert.equal(response.status, 200);
    assert.equal(response.payload.importo, importo);
    assert.equal(response.payload.discountApplied, 0);
    assert.equal(response.payload.iban, "IT00 X000 0000 0000 0000 0000 000");
    assert.equal(response.payload.intestatario, "Sophia 2005 S.r.l.");
  }
  state.rows = [[{ id: "discount", active: true, maxUses: null, usedCount: 0, discountPercent: 17 }]];
  const response = await invoke(checkout, path, { piano: "base", customerName: "Test", discountCode: "TEST" });
  assert.equal(response.payload.importo, 57270);
  assert.equal(response.payload.discountApplied, 17);
  assert.equal(response.payload.causale, "PromoApp Piano Base - Test (sconto 17%)");
  assert.equal(state.updates.length, 1);
});

test("Stripe session failure preserves the pending record and error response", async () => {
  state.fail = "session";
  assert.deepEqual(await invoke(acconto, "/acconto/stripe/create-session", customer),
    { status: 500, payload: { error: "Synthetic session failure" } });
  assert.equal(state.inserts[0].stato, "in_attesa");
});

test("explicit Stripe keys take priority without fetching connector credentials", async () => {
  assert.equal(await getStripeSecretKey(), "sk_test_synthetic");
});

test("connector selection, missing connection and missing configuration stay unchanged", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  await assert.rejects(getStripeSecretKey(), /Chiavi Stripe non configurate/);
  process.env.REPLIT_CONNECTORS_HOSTNAME = "connector.example.test";
  process.env.REPL_IDENTITY = "synthetic-identity";
  for (const environment of ["development", "production"]) {
    process.env.REPLIT_DEPLOYMENT = environment === "production" ? "1" : "0";
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.host, "connector.example.test");
      assert.equal(url.searchParams.get("environment"), environment);
      assert.equal(url.searchParams.get("connector_names"), "stripe");
      assert.equal(url.searchParams.get("include_secrets"), "true");
      assert.equal((init?.headers as Record<string, string>)["X-Replit-Token"], "repl synthetic-identity");
      return new Response(JSON.stringify({ items: [{ settings: { secret: "sk_test_connector", publishable: "pk_test_connector" } }] }));
    };
    assert.equal(await getStripeSecretKey(), "sk_test_connector");
    for (const data of [{}, { items: [] }, { items: [{ settings: { publishable: "pk_test_connector" } }] }]) {
      globalThis.fetch = async () => new Response(JSON.stringify(data));
      await assert.rejects(getStripeSecretKey(), new RegExp(`Stripe ${environment} connection non trovata`));
    }
  }
});
