import { defineConfig } from "drizzle-kit";
// Development-only subset: do not offer unrelated app_settings as a rename.
export default defineConfig({
  schema: ["./src/schema/admin-finance.ts", "./src/schema/progetti.ts"], dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ["clienti", "progetti_lavori", "voci_progetto", "admin_finance_*"],
});
