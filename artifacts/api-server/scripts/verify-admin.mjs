import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Real HTTP router tests with isolated fixtures. No app startup, DB or notifications.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(mkdtempSync(join(tmpdir(), "promoapp-admin-")), "tests.cjs");
await build({
  entryPoints: [join(root, "tests/admin-panel.test.ts")], bundle: true, platform: "node", format: "cjs", outfile: output,
  plugins: [{
    name: "no-real-database",
    setup(builder) {
      builder.onResolve({ filter: /^\.\/leads$/ }, () => ({ path: "leads", namespace: "isolated-leads" }));
      builder.onLoad({ filter: /.*/, namespace: "isolated-leads" }, () => ({
        contents: "export async function ensureLeadSchema() {}", loader: "js",
      }));
      builder.onResolve({ filter: /^@workspace\/db$/ }, () => ({ path: "stub", namespace: "isolated" }));
      builder.onLoad({ filter: /.*/, namespace: "isolated" }, () => ({
        contents: "export const pool={query(){throw Error('Real DB is forbidden in these tests')}}; export const db={},leadsTable={};", loader: "js",
      }));
    },
  }],
});
const result = spawnSync(process.execPath, ["--test", output], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
