import { pool } from "@workspace/db";
import { ensureLeadSchema } from "./leads";
import { ensureVisitSchema } from "./site-visits";

const contactFields = `id, nome_attivita AS "nomeAttivita", settore, whatsapp, email, messaggio,
  servizio, pagina, stato, created_at AS "createdAt"`;
const reviewFields = `id, nome, attivita, testo, stelle, verificata, created_at AS "createdAt"`;
const period = `created_at >= (((now() AT TIME ZONE 'Europe/Rome')::date - ($1::int - 1))::timestamp AT TIME ZONE 'Europe/Rome')`;

export const adminData = {
  async overview(days: number) {
    await Promise.all([ensureLeadSchema(), ensureVisitSchema()]);
    const [contacts, reviews, views, daily, pages, start, sitiweb] = await Promise.all([
      pool.query(`SELECT count(*)::int AS contacts, count(*) FILTER (WHERE stato='Nuovo')::int AS "newContacts" FROM commercial_leads WHERE privacy=true`),
      pool.query(`SELECT count(*)::int AS reviews, count(*) FILTER (WHERE NOT verificata)::int AS "pendingReviews",
        round(avg(stelle::numeric) FILTER (WHERE verificata AND stelle ~ '^[1-5]$'),1)::float AS "averageRating" FROM recensioni`),
      pool.query(`SELECT count(*)::int AS "pageViews", count(DISTINCT session_id)::int AS visits FROM site_page_views WHERE ${period}`, [days]),
      pool.query(`WITH dates AS (
        SELECT generate_series((now() AT TIME ZONE 'Europe/Rome')::date - ($1::int - 1),
          (now() AT TIME ZONE 'Europe/Rome')::date, '1 day')::date AS day
      ) SELECT dates.day::text AS date, count(v.id)::int AS "pageViews", count(DISTINCT v.session_id)::int AS visits
        FROM dates LEFT JOIN site_page_views v ON (v.created_at AT TIME ZONE 'Europe/Rome')::date=dates.day
        GROUP BY dates.day ORDER BY dates.day DESC`, [days]),
      pool.query(`SELECT path, count(*)::int AS "pageViews" FROM site_page_views WHERE ${period}
        GROUP BY path ORDER BY count(*) DESC, path LIMIT 15`, [days]),
      pool.query(`SELECT min(created_at) AS "trackingStartedAt" FROM site_page_views`),
      pool.query(`SELECT
        count(DISTINCT session_id) FILTER (WHERE ${period})::int AS visits,
        count(*) FILTER (WHERE ${period})::int AS "pageViews",
        count(DISTINCT session_id)::int AS "totalVisits", count(*)::int AS "totalPageViews"
        FROM site_page_views WHERE path IN ('/sitiweb', '/sitiweb/')`, [days]),
    ]);
    return { days, ...contacts.rows[0], ...reviews.rows[0], ...views.rows[0], ...start.rows[0],
      sitiweb: { path: "/sitiweb", ...sitiweb.rows[0] }, daily: daily.rows, pages: pages.rows };
  },
  async contacts() {
    await ensureLeadSchema();
    return (await pool.query(`SELECT ${contactFields} FROM commercial_leads WHERE privacy=true ORDER BY created_at DESC`)).rows;
  },
  async updateContact(id: string, stato: string) {
    await ensureLeadSchema();
    return (await pool.query(`UPDATE commercial_leads SET stato=$2 WHERE id=$1 AND privacy=true RETURNING ${contactFields}`, [id, stato])).rows[0];
  },
  async reviews() {
    return (await pool.query(`SELECT ${reviewFields} FROM recensioni ORDER BY created_at DESC`)).rows;
  },
  async publishReview(id: string, verificata: boolean) {
    return (await pool.query(`UPDATE recensioni SET verificata=$2 WHERE id=$1 RETURNING ${reviewFields}`, [id, verificata])).rows[0];
  },
  async deleteReview(id: string) {
    return (await pool.query("DELETE FROM recensioni WHERE id=$1 RETURNING id", [id])).rows[0];
  },
};
