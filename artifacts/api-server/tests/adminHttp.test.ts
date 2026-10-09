import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import adminRouter from "../src/routes/admin";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { adminHeaders } from "../../web/src/lib/admin-auth";

// Run with esbuild's synthetic ADMIN_PASSWORD define and a stubbed @workspace/db.
// Never import server startup or read/replace the real environment's credentials.
const PASSWORD = "Synthetic-Admin-caffè-中文!";

async function withServer(check: (base: string, records: unknown[]) => Promise<void>) {
  const app = express();
  const records: unknown[] = [];
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { warn: (...args: unknown[]) => records.push(args) } });
    next();
  });
  app.use("/api", createAdminAuthorization(), adminRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  try {
    await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`, records);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

const json = (password: unknown) => ({
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
});

test("actual admin router accepts UTF-8 JSON login and subsequent encoded data requests", async () => {
  await withServer(async base => {
    const login = await fetch(`${base}/admin/verify`, json(` ${PASSWORD}\n`));
    assert.equal(login.status, 200);
    assert.deepEqual(await login.json(), { ok: true });
    assert.equal(login.headers.get("Cache-Control"), "no-store");
    const verified = await fetch(`${base}/admin/verify`, { headers: adminHeaders(PASSWORD) });
    assert.equal(verified.status, 200);
    const data = await fetch(`${base}/admin/codes`, { headers: adminHeaders(PASSWORD) });
    assert.equal(data.status, 200);
    assert.deepEqual(await data.json(), []);
  });
});

test("wrong and absent credentials have distinct diagnostics without logging secrets", async () => {
  await withServer(async (base, records) => {
    const wrong = await fetch(`${base}/admin/verify`, json("Wrong-Synthetic!"));
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).code, "ADMIN_PASSWORD_INVALID");
    for (const password of [undefined, "", 123, { nested: PASSWORD }]) {
      const absent = await fetch(`${base}/admin/verify`, json(password));
      assert.equal(absent.status, 401);
      assert.equal((await absent.json()).code, "ADMIN_CREDENTIAL_MISSING");
    }
    const logged = JSON.stringify(records);
    assert.ok(logged.includes("ADMIN_PASSWORD_INVALID"));
    assert.ok(logged.includes("ADMIN_CREDENTIAL_MISSING"));
    assert.ok(!logged.includes(PASSWORD));
    assert.ok(!logged.includes("Wrong-Synthetic!"));
    assert.ok(!logged.includes(adminHeaders(PASSWORD)["x-admin-credential"]));
  });
});

test("project password fields cannot authorize administrative writes", async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/admin/progetti`, json(PASSWORD));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "ADMIN_CREDENTIAL_MISSING");
  });
});

test("malformed encoded credentials are rejected, not treated as valid authorization", async () => {
  await withServer(async base => {
    for (const encoded of ["not base64", "!!!!", "AA==", "wyg="]) {
      const response = await fetch(`${base}/admin/verify`, { headers: { "x-admin-credential": encoded } });
      assert.equal(response.status, 401);
    }
  });
});
