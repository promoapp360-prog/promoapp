import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { adminData } from "../src/lib/admin-data";
import { saveVisit } from "../src/lib/site-visits";

test("real PostgreSQL queries use isolated temporary fixtures and preserve all persistent tables", async () => {
  const client = await pool.connect();
  const original = pool.query;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL search_path = pg_temp, public");
    await client.query(`
      CREATE TEMP TABLE commercial_leads (
        id text PRIMARY KEY, nome_attivita text, settore text, whatsapp text, email text,
        messaggio text, servizio text, pagina text, stato text, privacy boolean,
        created_at timestamptz DEFAULT now()
      ) ON COMMIT DROP;
      CREATE TEMP TABLE recensioni (
        id text PRIMARY KEY, nome text, attivita text, testo text, stelle text,
        verificata boolean, created_at timestamptz DEFAULT now()
      ) ON COMMIT DROP;
      CREATE TEMP TABLE site_page_views (
        id uuid PRIMARY KEY, session_id uuid, path varchar(200), created_at timestamptz DEFAULT now()
      ) ON COMMIT DROP;
      INSERT INTO commercial_leads (id,nome_attivita,settore,whatsapp,email,messaggio,servizio,pagina,stato,privacy)
        VALUES ('fixture-a','Test A','Test','000','test@example.invalid','Messaggio test','generale','/','Nuovo',true),
        ('fixture-b','Test B','Test','000',null,'','generale','/','Contattato',true),
        ('fixture-excluded','Excluded','Test','000',null,'','generale','/','Nuovo',false);
      INSERT INTO recensioni (id,nome,attivita,testo,stelle,verificata)
        VALUES ('fixture-pending','Test','Test','Test', '5',false), ('fixture-public','Test','Test','Test','4',true);
    `);
    // Route all repository queries, including additive schema guards, to this
    // one connection. Temporary names shadow real tables only for this transaction.
    pool.query = client.query.bind(client) as typeof pool.query;
    const sessionId = randomUUID(), oldSession = randomUUID();
    await client.query(`INSERT INTO site_page_views(id,session_id,path,created_at) VALUES
      ($1,$2,'/',now()),($3,$2,'/siti-web',now()),($4,$5,'/',now()-interval '60 days')`,
    [randomUUID(), sessionId, randomUUID(), randomUUID(), oldSession]);
    const week = await adminData.overview(7);
    assert.equal(week.contacts, 2); assert.equal(week.newContacts, 1);
    assert.equal(week.reviews, 2); assert.equal(week.pendingReviews, 1); assert.equal(week.averageRating, 4);
    assert.equal(week.visits, 1); assert.equal(week.pageViews, 2); assert.equal(week.daily.length, 7);
    assert.equal(week.daily.reduce((sum: number, day: { pageViews: number }) => sum + day.pageViews, 0), 2);
    assert.equal(week.pages.length, 2);
    assert.deepEqual(week.sitiweb, { path: "/sitiweb", visits: 0, pageViews: 0, totalVisits: 0, totalPageViews: 0 });
    const quarter = await adminData.overview(90);
    assert.equal(quarter.visits, 2); assert.equal(quarter.pageViews, 3); assert.equal(quarter.daily.length, 90);
    assert.equal((await adminData.contacts()).length, 2);
    assert.equal((await adminData.updateContact("fixture-a", "Contattato")).stato, "Contattato");
    assert.equal(await adminData.updateContact("fixture-excluded", "Contattato"), undefined);
    assert.equal((await adminData.overview(7)).newContacts, 0);
    assert.equal((await adminData.publishReview("fixture-pending", true)).verificata, true);
    assert.equal((await adminData.overview(7)).averageRating, 4.5);
    assert.equal((await adminData.deleteReview("fixture-pending")).id, "fixture-pending");
    assert.equal((await adminData.reviews()).length, 1);
    const event = { id: randomUUID(), sessionId, path: "/menu-digitali" };
    await saveVisit(event); await saveVisit(event);
    assert.equal((await adminData.overview(7)).pageViews, 3);
    await client.query(`INSERT INTO site_page_views(id,session_id,path,created_at) VALUES
      ($1,$2,'/sitiweb',now()),($3,$2,'/sitiweb/',now()),
      ($4,$5,'/sitiweb',now()-interval '60 days'),($6,$5,'/sitiweb-other',now())`,
    [randomUUID(), sessionId, randomUUID(), randomUUID(), oldSession, randomUUID()]);
    const landingWeek = (await adminData.overview(7)).sitiweb;
    assert.deepEqual(landingWeek, { path: "/sitiweb", visits: 1, pageViews: 2, totalVisits: 2, totalPageViews: 3 });
    const landingQuarter = (await adminData.overview(90)).sitiweb;
    assert.deepEqual(landingQuarter, { path: "/sitiweb", visits: 2, pageViews: 3, totalVisits: 2, totalPageViews: 3 });
  } finally {
    pool.query = original;
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
