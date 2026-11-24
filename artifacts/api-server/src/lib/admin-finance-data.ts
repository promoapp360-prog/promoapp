import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type {
  AdminFinanceClient,
  AdminFinanceData,
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceClientInput,
  FinanceClientUpdate,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-zod";

let schemaReady: Promise<void> | undefined;

function clientIdentityKey(name: string, companyName?: string | null): string {
  const normalize = (value: string) => value.trim().normalize("NFKC").toLocaleLowerCase("it-IT");
  return JSON.stringify([normalize(name), normalize(companyName ?? "")]);
}

async function linkLegacyProjectsToClients(): Promise<void> {
  const { rows } = await pool.query<{ clientName: string }>(`
    SELECT DISTINCT trim(client_name) AS "clientName"
    FROM admin_finance_projects
    WHERE client_id IS NULL AND trim(client_name) <> ''
  `);
  for (const { clientName } of rows) {
    const id = randomUUID();
    const identityKey = clientIdentityKey(clientName);
    await pool.query(`
      INSERT INTO admin_finance_clients (id, identity_key, name)
      VALUES ($1,$2,$3)
      ON CONFLICT (identity_key) DO NOTHING
    `, [id, identityKey, clientName]);
    await pool.query(`
      UPDATE admin_finance_projects
      SET client_id=(SELECT id FROM admin_finance_clients WHERE identity_key=$1)
      WHERE client_id IS NULL AND lower(trim(client_name))=lower(trim($2))
    `, [identityKey, clientName]);
  }
}

export function ensureFinanceSchema() {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS admin_finance_clients (
        id text PRIMARY KEY,
        identity_key text NOT NULL UNIQUE,
        name text NOT NULL,
        company_name text,
        email text,
        phone text,
        notes text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS admin_finance_projects (
        id text PRIMARY KEY,
        client_id text REFERENCES admin_finance_clients(id) ON DELETE RESTRICT,
        client_name text NOT NULL,
        name text NOT NULL,
        total_amount_cents integer NOT NULL CHECK (total_amount_cents >= 0),
        payment_type text NOT NULL DEFAULT 'single',
        deposit_amount_cents integer,
        installment_count smallint,
        notes text NOT NULL DEFAULT '',
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE admin_finance_projects
        ADD COLUMN IF NOT EXISTS client_id text REFERENCES admin_finance_clients(id) ON DELETE RESTRICT;
      ALTER TABLE admin_finance_projects
        ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'single';
      ALTER TABLE admin_finance_projects
        ADD COLUMN IF NOT EXISTS deposit_amount_cents integer;
      ALTER TABLE admin_finance_projects
        ADD COLUMN IF NOT EXISTS installment_count smallint;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='admin_finance_projects_payment_type_check' AND conrelid='admin_finance_projects'::regclass) THEN
          ALTER TABLE admin_finance_projects ADD CONSTRAINT admin_finance_projects_payment_type_check
            CHECK (payment_type IN ('single', 'advance', 'installments'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='admin_finance_projects_payment_details_check' AND conrelid='admin_finance_projects'::regclass) THEN
          ALTER TABLE admin_finance_projects ADD CONSTRAINT admin_finance_projects_payment_details_check
            CHECK (
              (payment_type='single' AND deposit_amount_cents IS NULL AND installment_count IS NULL) OR
              (payment_type='advance' AND deposit_amount_cents IS NOT NULL AND deposit_amount_cents > 0 AND deposit_amount_cents <= total_amount_cents AND installment_count IS NULL) OR
              (payment_type='installments' AND deposit_amount_cents IS NULL AND installment_count IS NOT NULL AND installment_count BETWEEN 2 AND 60)
            );
        END IF;
      END $$;
      CREATE TABLE IF NOT EXISTS admin_finance_entries (
        id text PRIMARY KEY,
        project_id text REFERENCES admin_finance_projects(id) ON DELETE SET NULL,
        direction text NOT NULL CHECK (direction IN ('income', 'expense')),
        category text NOT NULL CHECK (category IN ('deposit', 'balance', 'monthly_fee', 'facebook', 'replit', 'other')),
        description text NOT NULL,
        amount_cents integer NOT NULL CHECK (amount_cents > 0),
        due_date date NOT NULL,
        paid_at timestamptz,
        repeat_monthly boolean NOT NULL DEFAULT false,
        series_id text,
        series_day smallint,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (
          (repeat_monthly = false AND series_day IS NULL) OR
          (repeat_monthly = true AND series_id IS NOT NULL AND series_day IS NOT NULL AND series_day BETWEEN 1 AND 31)
        ),
        UNIQUE (series_id, due_date)
      );
      CREATE INDEX IF NOT EXISTS admin_finance_entries_due_idx ON admin_finance_entries(due_date, paid_at);
      CREATE INDEX IF NOT EXISTS admin_finance_entries_project_idx ON admin_finance_entries(project_id);
      `).then(linkLegacyProjectsToClients).catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

type ProjectRow = AdminFinanceProject;
type EntryRow = Omit<AdminFinanceEntry, "dueDate"> & { dueDate: string | Date };

const projectColumns = `
  p.id, p.client_id AS "clientId", COALESCE(c.name, p.client_name) AS "clientName", p.name,
  p.total_amount_cents AS "totalAmountCents", p.notes, p.active,
  p.payment_type AS "paymentType", p.deposit_amount_cents AS "depositAmountCents",
  p.installment_count AS "installmentCount",
  p.created_at AS "createdAt",
  COALESCE(SUM(e.amount_cents) FILTER (WHERE e.direction='income' AND e.paid_at IS NOT NULL), 0)::int AS "receivedCents",
  COALESCE(SUM(e.amount_cents) FILTER (WHERE e.direction='income' AND e.paid_at IS NULL), 0)::int AS "outstandingCents"
`;

const entryColumns = `
  e.id, e.project_id AS "projectId", p.name AS "projectName", COALESCE(c.name, p.client_name) AS "clientName",
  e.direction, e.category, e.description, e.amount_cents AS "amountCents",
  e.due_date AS "dueDate", e.paid_at AS "paidAt", e.repeat_monthly AS "repeatMonthly",
  e.created_at AS "createdAt"
`;

const clientColumns = `
  id, name, company_name AS "companyName", email, phone, notes, created_at AS "createdAt"
`;

function validPaymentTerms(
  paymentType: AdminFinanceProject["paymentType"],
  totalAmountCents: number,
  depositAmountCents: number | null,
  installmentCount: number | null,
): boolean {
  if (paymentType === "single") return depositAmountCents === null && installmentCount === null;
  if (paymentType === "advance") {
    return depositAmountCents !== null && depositAmountCents > 0 &&
      depositAmountCents <= totalAmountCents && installmentCount === null;
  }
  return depositAmountCents === null && installmentCount !== null &&
    installmentCount >= 2 && installmentCount <= 60;
}

function cleanOptional(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
function calendarDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function romeToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function romeMonth(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(value);
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}`;
}

function categoryMatchesDirection(direction: "income" | "expense", category: AdminFinanceEntry["category"]): boolean {
  return direction === "income"
    ? ["deposit", "balance", "monthly_fee", "other"].includes(category)
    : ["facebook", "replit", "other"].includes(category);
}

export function nextMonthlyDate(current: string, anchorDay: number): string {
  const [year, month] = current.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const nextYear = nextMonth.getUTCFullYear();
  const nextMonthIndex = nextMonth.getUTCMonth();
  const lastDay = new Date(Date.UTC(nextYear, nextMonthIndex + 1, 0)).getUTCDate();
  const day = String(Math.min(anchorDay, lastDay)).padStart(2, "0");
  return `${nextYear}-${String(nextMonthIndex + 1).padStart(2, "0")}-${day}`;
}

function nextMonthCutoff(): string {
  const today = romeToday();
  const [year, month] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cutoff = new Date(Date.UTC(year, month, lastDay));
  return cutoff.toISOString().slice(0, 10);
}

async function ensureRecurringEntries(): Promise<void> {
  const { rows } = await pool.query<{
    seriesId: string;
    id: string;
    projectId: string | null;
    direction: "income" | "expense";
    category: AdminFinanceEntry["category"];
    description: string;
    amountCents: number;
    dueDate: string;
    repeatMonthly: boolean;
    seriesDay: number | null;
  }>(`
    SELECT DISTINCT ON (series_id)
      series_id AS "seriesId", id, project_id AS "projectId", direction, category,
      description, amount_cents AS "amountCents", due_date AS "dueDate",
      repeat_monthly AS "repeatMonthly", series_day AS "seriesDay"
    FROM admin_finance_entries
    WHERE series_id IS NOT NULL
    ORDER BY series_id, due_date DESC
  `);
  const cutoff = nextMonthCutoff();

  for (const series of rows) {
    if (!series.repeatMonthly || !series.seriesDay) continue;
    let dueDate = calendarDate(series.dueDate);
    for (let generated = 0; generated < 1200; generated++) {
      const nextDate = nextMonthlyDate(dueDate, series.seriesDay);
      if (nextDate > cutoff) break;
      await pool.query(`
        INSERT INTO admin_finance_entries (
          id, project_id, direction, category, description, amount_cents,
          due_date, repeat_monthly, series_id, series_day
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9)
        ON CONFLICT (series_id, due_date) DO NOTHING
      `, [
        randomUUID(), series.projectId, series.direction, series.category,
        series.description, series.amountCents, nextDate, series.seriesId, series.seriesDay,
      ]);
      dueDate = nextDate;
    }
  }
}

async function findProject(id: string): Promise<ProjectRow | undefined> {
  await ensureFinanceSchema();
  const { rows } = await pool.query<ProjectRow>(`
    SELECT ${projectColumns}
    FROM admin_finance_projects p
    LEFT JOIN admin_finance_clients c ON c.id=p.client_id
    LEFT JOIN admin_finance_entries e ON e.project_id=p.id
    WHERE p.id=$1
    GROUP BY p.id, c.id
  `, [id]);
  return rows[0];
}

async function findClient(id: string): Promise<AdminFinanceClient | undefined> {
  await ensureFinanceSchema();
  const { rows } = await pool.query<AdminFinanceClient>(`
    SELECT ${clientColumns}
    FROM admin_finance_clients
    WHERE id=$1
  `, [id]);
  return rows[0];
}

async function findEntry(id: string): Promise<AdminFinanceEntry | undefined> {
  await ensureFinanceSchema();
  const { rows } = await pool.query<EntryRow>(`
    SELECT ${entryColumns}
    FROM admin_finance_entries e
    LEFT JOIN admin_finance_projects p ON p.id=e.project_id
    LEFT JOIN admin_finance_clients c ON c.id=p.client_id
    WHERE e.id=$1
  `, [id]);
  const entry = rows[0];
  return entry ? { ...entry, dueDate: new Date(`${calendarDate(entry.dueDate)}T00:00:00.000Z`) } : undefined;
}

export const adminFinanceData = {
  async list(month: string): Promise<AdminFinanceData> {
    await ensureFinanceSchema();
    await ensureRecurringEntries();
    const [clientResult, projectResult, entryResult] = await Promise.all([
      pool.query<AdminFinanceClient>(`
        SELECT ${clientColumns}
        FROM admin_finance_clients
        ORDER BY lower(name), lower(COALESCE(company_name, '')), created_at
      `),
      pool.query<ProjectRow>(`
        SELECT ${projectColumns}
        FROM admin_finance_projects p
        LEFT JOIN admin_finance_clients c ON c.id=p.client_id
        LEFT JOIN admin_finance_entries e ON e.project_id=p.id
        GROUP BY p.id, c.id
        ORDER BY p.active DESC, p.created_at DESC
      `),
      pool.query<EntryRow>(`
        SELECT ${entryColumns}
        FROM admin_finance_entries e
        LEFT JOIN admin_finance_projects p ON p.id=e.project_id
        LEFT JOIN admin_finance_clients c ON c.id=p.client_id
        ORDER BY (e.paid_at IS NULL) DESC, e.due_date ASC, e.created_at DESC
      `),
    ]);
    const entries: AdminFinanceEntry[] = entryResult.rows.map((entry) => ({
      ...entry,
      dueDate: new Date(`${calendarDate(entry.dueDate)}T00:00:00.000Z`),
    }));
    const receivedCents = entries
      .filter((entry) => entry.direction === "income" && entry.paidAt && romeMonth(new Date(entry.paidAt)) === month)
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const expensesCents = entries
      .filter((entry) => entry.direction === "expense" && entry.paidAt && romeMonth(new Date(entry.paidAt)) === month)
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const today = romeToday();
    const outstandingCents = entries
      .filter((entry) => entry.direction === "income" && !entry.paidAt)
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const overdueIncomeCents = entries
      .filter((entry) => entry.direction === "income" && !entry.paidAt && calendarDate(entry.dueDate) < today)
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const unpaidExpensesCents = entries
      .filter((entry) => entry.direction === "expense" && !entry.paidAt)
      .reduce((sum, entry) => sum + entry.amountCents, 0);

    return {
      summary: {
        month,
        receivedCents,
        expensesCents,
        balanceCents: receivedCents - expensesCents,
        outstandingCents,
        overdueIncomeCents,
        unpaidExpensesCents,
      },
      clients: clientResult.rows,
      projects: projectResult.rows,
      entries,
    };
  },

  async createClient(input: FinanceClientInput): Promise<AdminFinanceClient | null> {
    await ensureFinanceSchema();
    const name = input.name.trim();
    const companyName = cleanOptional(input.companyName);
    const identityKey = clientIdentityKey(name, companyName);
    const { rows } = await pool.query<{ id: string }>(`
      INSERT INTO admin_finance_clients (id, identity_key, name, company_name, email, phone, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (identity_key) DO NOTHING
      RETURNING id
    `, [
      randomUUID(), identityKey, name, companyName,
      cleanOptional(input.email), cleanOptional(input.phone), input.notes?.trim() ?? "",
    ]);
    return rows[0] ? (await findClient(rows[0].id)) ?? null : null;
  },

  async updateClient(id: string, input: FinanceClientUpdate): Promise<AdminFinanceClient | undefined | null> {
    await ensureFinanceSchema();
    const current = await findClient(id);
    if (!current) return;
    const name = input.name === undefined ? current.name : input.name.trim();
    const companyName = input.companyName === undefined ? current.companyName : cleanOptional(input.companyName);
    const email = input.email === undefined ? current.email : cleanOptional(input.email);
    const phone = input.phone === undefined ? current.phone : cleanOptional(input.phone);
    const notes = input.notes === undefined ? current.notes : input.notes.trim();
    const identityKey = clientIdentityKey(name, companyName);
    try {
      await pool.query(`
        UPDATE admin_finance_clients
        SET identity_key=$1, name=$2, company_name=$3, email=$4, phone=$5, notes=$6
        WHERE id=$7
      `, [identityKey, name, companyName, email, phone, notes, id]);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return null;
      throw error;
    }
    return findClient(id);
  },

  async createProject(input: FinanceProjectInput): Promise<AdminFinanceProject | undefined> {
    await ensureFinanceSchema();
    const { rows: clients } = await pool.query<{ id: string; name: string }>(
      "SELECT id, name FROM admin_finance_clients WHERE id=$1",
      [input.clientId],
    );
    const client = clients[0];
    if (!client) return;
    const id = randomUUID();
    await pool.query(`
      INSERT INTO admin_finance_projects (
        id, client_id, client_name, name, total_amount_cents, payment_type,
        deposit_amount_cents, installment_count, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      id, client.id, client.name, input.name.trim(), input.totalAmountCents,
      input.paymentType, input.depositAmountCents ?? null, input.installmentCount ?? null,
      input.notes?.trim() ?? "",
    ]);
    return findProject(id);
  },

  async updateProject(id: string, input: FinanceProjectUpdate): Promise<AdminFinanceProject | undefined | null> {
    await ensureFinanceSchema();
    const current = await findProject(id);
    if (!current) return;
    const totalAmountCents = input.totalAmountCents ?? current.totalAmountCents;
    const paymentType = input.paymentType ?? current.paymentType;
    const depositAmountCents = input.depositAmountCents === undefined ? current.depositAmountCents : input.depositAmountCents;
    const installmentCount = input.installmentCount === undefined ? current.installmentCount : input.installmentCount;
    if (!validPaymentTerms(paymentType, totalAmountCents, depositAmountCents, installmentCount)) return null;

    const fields: { key: keyof FinanceProjectUpdate; column: string; value: unknown }[] = [
      { key: "name", column: "name", value: input.name?.trim() },
      { key: "totalAmountCents", column: "total_amount_cents", value: input.totalAmountCents },
      { key: "paymentType", column: "payment_type", value: input.paymentType },
      { key: "depositAmountCents", column: "deposit_amount_cents", value: input.depositAmountCents },
      { key: "installmentCount", column: "installment_count", value: input.installmentCount },
      { key: "notes", column: "notes", value: input.notes?.trim() },
      { key: "active", column: "active", value: input.active },
    ];
    const updates = fields.filter((field) => input[field.key] !== undefined);
    if (input.clientId !== undefined) {
      const { rows: clients } = await pool.query<{ id: string; name: string }>(
        "SELECT id, name FROM admin_finance_clients WHERE id=$1",
        [input.clientId],
      );
      if (!clients[0]) return null;
      updates.push(
        { key: "clientId", column: "client_id", value: clients[0].id },
        { key: "clientId", column: "client_name", value: clients[0].name },
      );
    }
    if (!updates.length) return current;
    const values = updates.map((field) => field.value);
    values.push(id);
    await pool.query(
      `UPDATE admin_finance_projects SET ${updates.map((field, index) => `${field.column}=$${index + 1}`).join(", ")} WHERE id=$${values.length}`,
      values,
    );
    return findProject(id);
  },

  async createEntry(input: FinanceEntryInput): Promise<AdminFinanceEntry | undefined> {
    await ensureFinanceSchema();
    const id = randomUUID();
    const dueDate = calendarDate(input.dueDate);
    const repeatMonthly = input.repeatMonthly ?? false;
    if (input.projectId) {
      const project = await pool.query("SELECT id FROM admin_finance_projects WHERE id=$1", [input.projectId]);
      if (!project.rows.length) return;
    }
    await pool.query(`
      INSERT INTO admin_finance_entries (
        id, project_id, direction, category, description, amount_cents,
        due_date, paid_at, repeat_monthly, series_id, series_day
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      id, input.projectId ?? null, input.direction, input.category, input.description.trim(),
      input.amountCents, dueDate, input.paid ? new Date() : null, repeatMonthly,
      repeatMonthly ? id : null, repeatMonthly ? Number(dueDate.slice(-2)) : null,
    ]);
    await ensureRecurringEntries();
    return findEntry(id);
  },

  async updateEntry(id: string, input: FinanceEntryUpdate): Promise<AdminFinanceEntry | undefined | null> {
    await ensureFinanceSchema();
    const entry = await findEntry(id);
    if (!entry) return;
    if (input.category && !categoryMatchesDirection(entry.direction, input.category)) return null;
    const fields: { key: keyof FinanceEntryUpdate; column: string; value: unknown }[] = [
      { key: "category", column: "category", value: input.category },
      { key: "description", column: "description", value: input.description?.trim() },
      { key: "amountCents", column: "amount_cents", value: input.amountCents },
      { key: "dueDate", column: "due_date", value: input.dueDate ? calendarDate(input.dueDate) : undefined },
      { key: "repeatMonthly", column: "repeat_monthly", value: input.repeatMonthly },
    ];
    const updates = fields.filter((field) => field.key !== "repeatMonthly" && input[field.key] !== undefined);
    if (!updates.length && input.repeatMonthly === undefined) return entry;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const values = updates.map((field) => field.value);
      values.push(id);
      const changed = await client.query<{ id: string; seriesId: string | null; dueDate: string }>(updates.length
        ? `
          UPDATE admin_finance_entries
          SET ${updates.map((field, index) => `${field.column}=$${index + 1}`).join(", ")}
          WHERE id=$${values.length}
          RETURNING id, series_id AS "seriesId", due_date AS "dueDate"
        `
        : `SELECT id, series_id AS "seriesId", due_date AS "dueDate" FROM admin_finance_entries WHERE id=$1`,
      updates.length ? values : [id]);
      if (!changed.rows[0]) {
        await client.query("ROLLBACK");
        return;
      }
      const current = changed.rows[0];
      if (input.repeatMonthly === true) {
        await client.query(`
          UPDATE admin_finance_entries
          SET repeat_monthly=true,
              series_id=COALESCE(series_id,id),
              series_day=COALESCE(series_day, EXTRACT(DAY FROM due_date)::smallint)
          WHERE id=$1
        `, [id]);
      } else if (input.repeatMonthly === false) {
        if (current.seriesId) {
          await client.query(`
            UPDATE admin_finance_entries
            SET repeat_monthly=false, series_day=NULL
            WHERE series_id=$1 AND due_date >= $2
          `, [current.seriesId, calendarDate(current.dueDate)]);
        } else {
          await client.query("UPDATE admin_finance_entries SET repeat_monthly=false, series_day=NULL WHERE id=$1", [id]);
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return findEntry(id);
  },

  async markEntryPaid(id: string): Promise<AdminFinanceEntry | undefined> {
    await ensureFinanceSchema();
    await pool.query("UPDATE admin_finance_entries SET paid_at=COALESCE(paid_at,now()) WHERE id=$1", [id]);
    await ensureRecurringEntries();
    return findEntry(id);
  },

  async deleteEntry(id: string): Promise<boolean> {
    await ensureFinanceSchema();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const removed = await client.query<{ seriesId: string | null; dueDate: string }>(`
        DELETE FROM admin_finance_entries
        WHERE id=$1 AND paid_at IS NULL
        RETURNING series_id AS "seriesId", due_date AS "dueDate"
      `, [id]);
      if (!removed.rows[0]) {
        await client.query("ROLLBACK");
        return false;
      }
      const { seriesId, dueDate } = removed.rows[0];
      if (seriesId) {
        await client.query(`
          DELETE FROM admin_finance_entries
          WHERE series_id=$1 AND due_date >= $2 AND paid_at IS NULL
        `, [seriesId, calendarDate(dueDate)]);
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
