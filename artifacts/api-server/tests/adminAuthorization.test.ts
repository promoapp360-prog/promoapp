import assert from "node:assert/strict";
import test from "node:test";
import { createAdminAuthorization, matchesAdminPassword } from "../src/middlewares/adminAuthorization";

// Synthetic credentials only: do not import app startup, databases or live secrets.
const PASSWORD = "Synthetic-Admin-123!";

function harness(secret: string | undefined) {
  const authorize = createAdminAuthorization(() => secret);
  return (candidate?: string, path = "/admin/verify", method = "GET") => {
    let allowed = false;
    let status = 200;
    const headers: Record<string, string> = {};
    const req = { path, method, ip: "test-client", get: () => candidate };
    const res = {
      setHeader(name: string, value: string) { headers[name] = value; },
      status(code: number) { status = code; return this; },
      json() { return this; },
    };
    authorize(req as never, res as never, (() => { allowed = true; }) as never);
    return { allowed, status, headers };
  };
}

test("correct credential succeeds, wrong and absent credentials fail", () => {
  const run = harness(PASSWORD);
  assert.equal(run(PASSWORD).allowed, true);
  assert.equal(run("Wrong-Synthetic!").status, 401);
  assert.equal(run().status, 401);
});

test("copied whitespace in the secret and input does not reject a correct password", () => {
  const run = harness(` \t${PASSWORD}\r\n`);
  assert.equal(run(PASSWORD).allowed, true);
  assert.equal(run(` ${PASSWORD} `).allowed, true);
});

test("missing or whitespace-only secret fails closed", () => {
  for (const secret of [undefined, "", " \t\r\n"]) {
    assert.equal(harness(secret)(PASSWORD).status, 503);
    assert.equal(matchesAdminPassword(PASSWORD, secret ?? ""), false);
  }
});

test("case and internal spaces remain significant", () => {
  assert.equal(matchesAdminPassword(PASSWORD.toLowerCase(), PASSWORD), false);
  assert.equal(matchesAdminPassword("Test Word", "TestWord"), false);
  assert.equal(matchesAdminPassword("Test Word", "Test Word"), true);
});

test("all admin paths and review moderation remain protected", () => {
  for (const [path, method] of [
    ["/admin/verify", "GET"], ["/admin/progetti", "POST"],
    ["/admin/clienti/123", "DELETE"], ["/admin/richieste-gestionale", "GET"],
    ["/recensioni/pending", "GET"], ["/recensioni/123/verifica", "PATCH"],
    ["/recensioni/123", "DELETE"],
  ]) {
    assert.equal(harness(PASSWORD)(undefined, path, method).status, 401);
    assert.equal(harness(PASSWORD)(PASSWORD, path, method).allowed, true);
  }
});

test("public requests do not require admin configuration", () => {
  for (const [path, method] of [
    ["/recensioni", "GET"], ["/recensioni", "POST"], ["/healthz", "GET"],
  ]) assert.equal(harness(undefined)(undefined, path, method).allowed, true);
});

test("rate limit returns retry information after ten failed attempts", () => {
  const run = harness(PASSWORD);
  for (let i = 0; i < 10; i++) assert.equal(run("Wrong-Synthetic!").status, 401);
  const blocked = run(PASSWORD);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers["Retry-After"]) > 0);
  assert.equal(blocked.headers["Cache-Control"], "no-store");
});

test("successful authentication resets earlier failures", () => {
  const run = harness(PASSWORD);
  for (let i = 0; i < 9; i++) run("Wrong-Synthetic!");
  assert.equal(run(PASSWORD).allowed, true);
  for (let i = 0; i < 9; i++) assert.equal(run("Wrong-Synthetic!").status, 401);
  assert.equal(run(PASSWORD).allowed, true);
});

test("credential changes are picked up without stale module constants", () => {
  let configured = PASSWORD;
  const authorize = createAdminAuthorization(() => configured);
  const attempt = (candidate: string) => {
    let allowed = false;
    const req = { path: "/admin/verify", method: "GET", ip: "test", get: () => candidate };
    const res = { setHeader() {}, status() { return this; }, json() {} };
    authorize(req as never, res as never, (() => { allowed = true; }) as never);
    return allowed;
  };
  assert.equal(attempt(PASSWORD), true);
  configured = "New-Synthetic-Admin!";
  assert.equal(attempt(PASSWORD), false);
  assert.equal(attempt(configured), true);
});
