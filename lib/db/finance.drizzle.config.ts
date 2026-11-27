import { defineConfig } from "drizzle-kit";
import base from "./drizzle.config";
import path from "node:path";

// The internal ledger must not propose changes to unrelated or unmodelled tables.
export default defineConfig({
  ...base,
  schema: [
    path.join(__dirname, "./src/schema/admin-finance.ts"),
    path.join(__dirname, "./src/schema/admin-finance-ledger.ts"),
  ],
  tablesFilter: ["admin_finance_*"],
});
