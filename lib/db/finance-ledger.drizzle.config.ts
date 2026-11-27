import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/admin-finance-ledger.ts",
  out: "./migrations/finance-ledger",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
