import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Bundle real handlers and the real credential resolver, replacing every external
// payment/email/database dependency. The child receives no workspace secrets.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = mkdtempSync(join(tmpdir(), "promoapp-payments-"));
try {
  const output = join(directory, "tests.cjs");
  await build({
    entryPoints: [join(root, "tests/payments.test.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: output,
    alias: Object.fromEntries(
      ["@workspace/db", "drizzle-orm", "stripe", "stripe-replit-sync", "resend"]
        .map((name) => [name, join(root, "tests/mocks/payments.ts")]),
    ),
  });
  const result = spawnSync(process.execPath, ["--test", output], {
    stdio: "inherit",
    env: { PATH: process.env.PATH, NODE_ENV: "test" },
  });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
