import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type {
  AdminFinanceData,
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-zod";

let schemaReady: Promise<void> | undefined;

export function ensureFinanceSchema() {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS admin_finance_projects (
        id text PRIMARY KEY,
        client_name text NOT NULL,
        name text NOT NULL,
        total_amount_cents integer NOT NULL CHECK (total_amount_cents >= 0),
        notes text NOT NULL DEFAULT '',
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
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
    `).then(() => {}).catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

type ProjectRow = AdminFinanceProject;
type EntryRow = Omit<AdminFinanceEntry, "dueDate"> & { dueDate: string | Date };

const projectColumns = `
  p.id, p.client_name AS "clientName", p.name,
  p.total_amount_cents AS "totalAmountCents", p.notes, p.active,
  p.created_at AS "createdAt",
  COALESCE(SUM(e.amount_cents) FILTER (WHERE e.direction='income' AND e.paid_at IS NOT NULL), 0)::int AS "receivedCents",
  COALESCE(SUM(e.amount_cents) FILTER (WHERE e.direction='income' AND e.paid_at IS NULL), 0)::int AS "outstandingCents"
`;

const entryColumns = `
  e.id, e.project_id AS "projectId", p.name AS "projectName", p.client_name AS "clientName",
  e.direction, e.category, e.description, e.amount_cents AS "amountCents",
  e.due_date AS "dueDate", e.paid_at AS "paidAt", e.repeat_monthly AS "repeatMonthly",
  e.created_at AS "createdAt"
`;

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
    LEFT JOIN admin_finance_entries e ON e.project_id=p.id
    WHERE p.id=$1
    GROUP BY p.id
  `, [id]);
  return rows[0];
}

async function findEntry(id: string): Promise<AdminFinanceEntry | undefined> {
  await ensureFinanceSchema();
  const { rows } = await pool.query<EntryRow>(`
    SELECT ${entryColumns}
    FROM admin_finance_entries e
    LEFT JOIN admin_finance_projects p ON p.id=e.project_id
    WHERE e.id=$1
  `, [id]);
  const entry = rows[0];
  return entry ? { ...entry, dueDate: new Date(`${calendarDate(entry.dueDate)}T00:00:00.000Z`) } : undefined;
}

export const adminFinanceData = {
  async list(month: string): Promise<AdminFinanceData> {
    await ensureFinanceSchema();
    await ensureRecurringEntries();
    const [projectResult, entryResult] = await Promise.all([
      pool.query<ProjectRow>(`
        SELECT ${projectColumns}
        FROM admin_finance_projects p
        LEFT JOIN admin_finance_entries e ON e.project_id=p.id
        GROUP BY p.id
        ORDER BY p.active DESC, p.created_at DESC
      `),
      pool.query<EntryRow>(`
        SELECT ${entryColumns}
        FROM admin_finance_entries e
        LEFT JOIN admin_finance_projects p ON p.id=e.project_id
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
      projects: projectResult.rows,
      entries,
    };
  },

  async createProject(input: FinanceProjectInput): Promise<AdminFinanceProject> {
    await ensureFinanceSchema();
    const id = randomUUID();
    await pool.query(`
      INSERT INTO admin_finance_projects (id, client_name, name, total_amount_cents, notes)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, input.clientName.trim(), input.name.trim(), input.totalAmountCents, input.notes?.trim() ?? ""]);
    return (await findProject(id))!;
  },

  async updateProject(id: string, input: FinanceProjectUpdate): Promise<AdminFinanceProject | undefined> {
    await ensureFinanceSchema();
    const fields: { key: keyof FinanceProjectUpdate; column: string; value: unknown }[] = [
      { key: "clientName", column: "client_name", value: input.clientName?.trim() },
      { key: "name", column: "name", value: input.name?.trim() },
      { key: "totalAmountCents", column: "total_amount_cents", value: input.totalAmountCents },
      { key: "notes", column: "notes", value: input.notes?.trim() },
      { key: "active", column: "active", value: input.active },
    ];
    const updates = fields.filter((field) => input[field.key] !== undefined);
    if (!updates.length) return findProject(id);
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
