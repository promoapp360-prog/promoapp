import { pool } from "@workspace/db";

let ready: Promise<void> | undefined;
export function ensureVisitSchema() {
  // Additive only: existing contacts, reviews, customer work and payments stay intact.
  return ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS site_page_views (
      id uuid PRIMARY KEY, session_id uuid NOT NULL, path varchar(200) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS site_page_views_created_idx ON site_page_views(created_at);
  `).then(() => {}).catch(error => { ready = undefined; throw error; });
}
export async function saveVisit(input: { id: string; sessionId: string; path: string }) {
  await ensureVisitSchema();
  await pool.query("INSERT INTO site_page_views (id, session_id, path) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
    [input.id, input.sessionId, input.path]);
}
