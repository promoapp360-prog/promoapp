import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, delimiter } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production") throw new Error("Finance fixtures are development-only.");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = mkdtempSync(join(tmpdir(), "promoapp-finance-"));
try {
  for (const suite of ["admin-finance", "finance-economic"]) {
    const output = join(directory, `${suite}.cjs`);
    await build({
      entryPoints: [join(root, `tests/${suite}.test.ts`)],
      bundle: true, platform: "node", format: "cjs", outfile: output,
      external: ["pg-native", "pdfkit"],
      plugins: [{
        name: "test-logger",
        setup(builder) {
          builder.onResolve({ filter: /\/logger$/ }, () => ({ path: "logger", namespace: "test-logger" }));
          builder.onLoad({ filter: /.*/, namespace: "test-logger" }, () => ({
            contents: "export const logger={info(){},warn(){},error(){},debug(){},child(){return this}};", loader: "js",
          }));
        },
      }],
    });
    const nodePath=[join(root,"node_modules"),process.env.NODE_PATH].filter(Boolean).join(delimiter);
    const result = spawnSync(process.execPath, ["--test", output], { stdio: "inherit", env: { ...process.env, NODE_ENV: "test", NODE_PATH:nodePath } });
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
