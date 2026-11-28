import { pool } from "@workspace/db";
import type {
  FinanceClientReport,
  FinanceExpenseBreakdown,
  FinanceIntegrityIssue,
  FinanceIntegrityResponse,
  GetFinanceReportsPeriodType as FinanceReportPeriodType,
  FinanceReportsResponse,
} from "@workspace/api-zod";
import { validCalendarDate } from "./admin-finance-data";
import { confirmedProject, todayRome } from "./finance-calculations";
import { financeHistoricalCandidates, financeLedgerData } from "./finance-ledger-data";

const invalid = (message: string, status = 400): never => {
  throw Object.assign(new Error(message), { status });
};
const categoryNames: Record<string, string> = {
  facebook: "Facebook / Instagram Ads", google: "Google Ads", replit: "Replit",
  canva: "Canva", hosting: "Hosting e database", domains: "Domini internet",
  software: "Software e abbonamenti", administration: "Spese amministrative",
  accountant: "Commercialista", consulting: "Consulenze", equipment: "Attrezzature e tecnologia",
  research: "Ricerca e sviluppo", other: "Altro",
};
const integer = (value: unknown) => {
  const result = Number(value ?? 0);
  if (!Number.isSafeInteger(result)) throw new Error("Un importo del report supera la precisione intera supportata.");
  return result;
};
const asDate = (value: unknown): Date | null => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return validCalendarDate(date) ? new Date(`${date}T00:00:00.000Z`) : null;
};
const detailsRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function getDateRange(periodType: FinanceReportPeriodType, period: string) {
  const today = todayRome();
  let startDate: string;
  let endDate: string;
  if (periodType === "month") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) invalid("Seleziona un mese valido.");
    startDate = `${period}-01`;
    if (!validCalendarDate(startDate) || period > today.slice(0, 7)) invalid("Il mese non può essere nel futuro.");
    const lastDay = new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)).getUTCDate();
    endDate = period === today.slice(0, 7) ? today : `${period}-${String(lastDay).padStart(2, "0")}`;
  } else {
    if (!/^\d{4}$/.test(period)) invalid("Seleziona un anno valido.");
    const year = Number(period);
    if (year < 2000 || year > Number(today.slice(0, 4))) invalid("L’anno deve essere compreso tra 2000 e l’anno corrente.");
    startDate = `${period}-01-01`;
    endDate = period === today.slice(0, 4) ? today : `${period}-12-31`;
  }
  return { startDate, endDate, today };
}

export async function getFinanceReports(
  periodType: FinanceReportPeriodType,
  period: string,
): Promise<FinanceReportsResponse> {
  const range = getDateRange(periodType, period);
  const currentMonth = range.today.slice(0, 7);
  // The ledger's standard read materializes recurring obligations already due.
  // This keeps sold/receivable totals aligned with the rest of the admin UI.
  const ledger = await financeLedgerData(currentMonth);
  const [projectsResult, movementsResult, cashResult, documentsResult, allocatedExpensesResult, unallocatedResult, directCostsResult] = await Promise.all([
    pool.query(`SELECT id,total_amount_cents AS "totalAmountCents",status,details
      FROM admin_finance_projects`),
    pool.query(`SELECT
      COALESCE(sum(amount_cents) FILTER (WHERE direction='income'),0)::bigint AS received,
      COALESCE(sum(amount_cents) FILTER (WHERE direction='expense'),0)::bigint AS spent
      FROM admin_finance_movements
      WHERE (movement_at AT TIME ZONE 'Europe/Rome')::date BETWEEN $1::date AND $2::date`,
    [range.startDate, range.endDate]),
    pool.query(`WITH opening AS (
        SELECT COALESCE(sum(opening_balance_cents),0)::bigint AS amount
        FROM admin_finance_accounts
        WHERE opening_balance_date IS NULL OR opening_balance_date<=$1::date
      ), flow AS (
        SELECT COALESCE(sum(CASE WHEN m.direction='income' THEN m.amount_cents ELSE -m.amount_cents END),0)::bigint AS amount
        FROM admin_finance_movements m
        JOIN admin_finance_accounts a ON a.id=m.account_id
        WHERE (m.movement_at AT TIME ZONE 'Europe/Rome')::date<=$1::date
          AND (a.opening_balance_date IS NULL OR (m.movement_at AT TIME ZONE 'Europe/Rome')::date>=a.opening_balance_date)
      )
      SELECT opening.amount+flow.amount AS balance FROM opening,flow`,
    [range.endDate]),
    pool.query(`SELECT COALESCE(sum(withholding_amount_cents),0)::bigint AS withholding,
        COALESCE(sum(vat_amount_cents),0)::bigint AS vat
      FROM admin_finance_documents
      WHERE status<>'void' AND issued_on BETWEEN $1::date AND $2::date`,
    [range.startDate, range.endDate]),
    pool.query(`SELECT o.category,COALESCE(s.id,'') AS "supplierId",
        COALESCE(s.name,'') AS "supplierName",COALESCE(sum(a.amount_cents),0)::bigint AS amount
      FROM admin_finance_movements m
      JOIN admin_finance_movement_allocations a ON a.movement_id=m.id
      JOIN admin_finance_obligations o ON o.id=a.obligation_id
      LEFT JOIN admin_finance_suppliers s ON s.id=o.supplier_id
      WHERE m.direction='expense'
        AND (m.movement_at AT TIME ZONE 'Europe/Rome')::date BETWEEN $1::date AND $2::date
      GROUP BY o.category,s.id,s.name`,
    [range.startDate, range.endDate]),
    pool.query(`SELECT m.id,m.amount_cents AS "amountCents",
        COALESCE(sum(a.amount_cents),0)::bigint AS allocated
      FROM admin_finance_movements m
      LEFT JOIN admin_finance_movement_allocations a ON a.movement_id=m.id
      WHERE m.direction='expense'
        AND (m.movement_at AT TIME ZONE 'Europe/Rome')::date BETWEEN $1::date AND $2::date
      GROUP BY m.id HAVING m.amount_cents>COALESCE(sum(a.amount_cents),0)`,
    [range.startDate, range.endDate]),
    pool.query(`SELECT COALESCE(o.client_id,p.client_id) AS "clientId",
        COALESCE(sum(a.amount_cents),0)::bigint AS amount
      FROM admin_finance_movements m
      JOIN admin_finance_movement_allocations a ON a.movement_id=m.id
      JOIN admin_finance_obligations o ON o.id=a.obligation_id
      LEFT JOIN admin_finance_projects p ON p.id=o.project_id
      WHERE m.direction='expense' AND COALESCE(o.client_id,p.client_id) IS NOT NULL
      GROUP BY COALESCE(o.client_id,p.client_id)`),
  ]);

  const projectSoldCents = projectsResult.rows.reduce((sum, project) => {
    const details = detailsRecord(project.details);
    const confirmed = confirmedProject({ details } as unknown as Parameters<typeof confirmedProject>[0]);
    const status = String(project.status ?? details.status ?? "");
    const confirmedDate = typeof details.confirmedDate === "string" ? details.confirmedDate : "";
    if (!confirmed || status === "cancelled" || !validCalendarDate(confirmedDate) ||
      confirmedDate < range.startDate || confirmedDate > range.endDate) return sum;
    return sum + Math.max(0, integer(project.totalAmountCents) + integer(details.extraCents));
  }, 0);
  const recurringSold = integer((await pool.query(`SELECT COALESCE(sum(amount_cents),0)::bigint AS amount
    FROM admin_finance_obligations
    WHERE direction='income' AND source_type='recurring' AND due_date BETWEEN $1::date AND $2::date
      AND due_date<=current_date`, [range.startDate, range.endDate])).rows[0]?.amount);
  const receivedCents = integer(movementsResult.rows[0]?.received);
  const spentCents = integer(movementsResult.rows[0]?.spent);
  const soldCents = projectSoldCents + recurringSold;

  const categoryAmounts = new Map<string, number>();
  const supplierAmounts = new Map<string, number>();
  for (const row of allocatedExpensesResult.rows) {
    const category = String(row.category ?? "other");
    const categoryName = categoryNames[category] ?? "Altro";
    const amount = integer(row.amount);
    categoryAmounts.set(categoryName, (categoryAmounts.get(categoryName) ?? 0) + amount);
    const supplierId = String(row.supplierId ?? "");
    const supplierLabel = String(row.supplierName || "Fornitore non collegato");
    const supplierKey = supplierId || "unlinked";
    supplierAmounts.set(`${supplierKey}\u0000${supplierLabel}`, (supplierAmounts.get(`${supplierKey}\u0000${supplierLabel}`) ?? 0) + amount);
  }
  for (const row of unallocatedResult.rows) {
    const amount = Math.max(0, integer(row.amountCents) - integer(row.allocated));
    if (!amount) continue;
    categoryAmounts.set("Non attribuite", (categoryAmounts.get("Non attribuite") ?? 0) + amount);
    supplierAmounts.set("unlinked\u0000Fornitore non collegato",
      (supplierAmounts.get("unlinked\u0000Fornitore non collegato") ?? 0) + amount);
  }
  const expensesByCategory: FinanceExpenseBreakdown[] = [...categoryAmounts]
    .map(([label, amountCents]) => ({ key: label, label, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
  const expensesBySupplier: FinanceExpenseBreakdown[] = [...supplierAmounts]
    .map(([key, amountCents]) => {
      const [supplierId, label] = key.split("\u0000");
      return { key: supplierId || "unlinked", label, amountCents };
    })
    .sort((a, b) => b.amountCents - a.amountCents);

  const directCosts = new Map<string, number>();
  for (const row of directCostsResult.rows) {
    directCosts.set(String(row.clientId), integer(row.amount));
  }
  const clients: FinanceClientReport[] = ledger.clientBalances.map((client) => {
    const directCostsCents = directCosts.get(client.clientId) ?? 0;
    return {
      ...client,
      directCostsCents,
      marginCents: client.soldCents - directCostsCents,
    };
  });
  return {
    periodType, period, startDate: asDate(range.startDate)!, endDate: asDate(range.endDate)!,
    totals: {
      receivedCents, spentCents, periodBalanceCents: receivedCents - spentCents,
      cashBalanceCents: integer(cashResult.rows[0]?.balance), soldCents,
      withholdingCreditCents: integer(documentsResult.rows[0]?.withholding),
      vatCents: integer(documentsResult.rows[0]?.vat),
    },
    clients,
    expensesByCategory,
    expensesBySupplier,
  };
}

export async function getFinanceIntegrity(): Promise<FinanceIntegrityResponse> {
  const today = todayRome();
  const [unallocated, paidLegacy, delivered, overdueRecurring, candidates, missingFiscal, undatedProjects] = await Promise.all([
    pool.query(`SELECT m.id,(m.movement_at AT TIME ZONE 'Europe/Rome')::date::text AS date,m.note,
        m.amount_cents AS "amountCents",COALESCE(sum(a.amount_cents),0)::bigint AS allocated
      FROM admin_finance_movements m
      LEFT JOIN admin_finance_movement_allocations a ON a.movement_id=m.id
      WHERE m.direction='income'
      GROUP BY m.id HAVING m.amount_cents>COALESCE(sum(a.amount_cents),0)
      ORDER BY m.movement_at DESC`),
    pool.query(`SELECT e.id,e.description,e.amount_cents AS "amountCents",e.due_date::text AS date,
        COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",p.name AS "projectName"
      FROM admin_finance_entries e
      LEFT JOIN admin_finance_projects p ON p.id=e.project_id
      LEFT JOIN admin_finance_clients c ON c.id=COALESCE(p.client_id,e.details->>'clientId')
      WHERE e.direction='income' AND e.paid_at IS NOT NULL
        AND e.details->>'cancelled' IS DISTINCT FROM 'true'
        AND NOT EXISTS(SELECT 1 FROM admin_finance_movements m WHERE m.external_reference='history:entry:'||e.id)
      ORDER BY e.paid_at DESC`),
    pool.query(`SELECT p.id,p.name AS "projectName",p.client_id AS "clientId",
        COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",
        p.total_amount_cents AS "totalAmountCents",p.status,p.details,
        COALESCE(sum(ob.amount),0)::bigint AS planned,
        COALESCE(sum(GREATEST(0,ob.amount-ob.allocated)),0)::bigint AS obligationRemaining
      FROM admin_finance_projects p
      LEFT JOIN admin_finance_clients c ON c.id=p.client_id
      LEFT JOIN LATERAL (
        SELECT o.id,o.amount_cents AS amount,COALESCE(sum(a.amount_cents),0)::bigint AS allocated
        FROM admin_finance_obligations o
        LEFT JOIN admin_finance_movement_allocations a ON a.obligation_id=o.id
        WHERE o.project_id=p.id AND o.direction='income' AND o.source_type<>'recurring'
        GROUP BY o.id
      ) ob ON true
      WHERE p.status='delivered' OR p.details->>'operationalState'='delivered'
      GROUP BY p.id,c.company_name,c.name`),
    pool.query(`SELECT o.id,o.direction,o.description,o.due_date::text AS date,
        o.amount_cents AS "amountCents",o.client_id AS "clientId",o.project_id AS "projectId",
        o.supplier_id AS "supplierId",COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",
        p.name AS "projectName",s.name AS "supplierName",COALESCE(a.allocated,0)::bigint AS allocated
      FROM admin_finance_obligations o
      LEFT JOIN admin_finance_clients c ON c.id=o.client_id
      LEFT JOIN admin_finance_projects p ON p.id=o.project_id
      LEFT JOIN admin_finance_suppliers s ON s.id=o.supplier_id
      LEFT JOIN LATERAL (SELECT sum(amount_cents)::bigint AS allocated
        FROM admin_finance_movement_allocations WHERE obligation_id=o.id) a ON true
      WHERE o.source_type='recurring' AND o.due_date<$1::date
        AND o.amount_cents>COALESCE(a.allocated,0)
      ORDER BY o.due_date`, [today]),
    financeHistoricalCandidates(),
    pool.query(`SELECT d.id,d.number,d.issued_on::text AS date,d.net_amount_cents AS "amountCents",
        COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",d.project_id AS "projectId",
        p.name AS "projectName"
      FROM admin_finance_documents d
      JOIN admin_finance_clients c ON c.id=d.client_id
      LEFT JOIN admin_finance_projects p ON p.id=d.project_id
      WHERE d.status<>'void' AND (NULLIF(trim(c.tax_id),'') IS NULL OR NULLIF(trim(c.address),'') IS NULL)
      ORDER BY d.issued_on DESC`),
    pool.query(`SELECT p.id,p.name AS "projectName",p.client_id AS "clientId",
        COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",
        p.total_amount_cents AS "amountCents",p.details
      FROM admin_finance_projects p LEFT JOIN admin_finance_clients c ON c.id=p.client_id
      WHERE p.details->>'agreementConfirmed'='true' AND p.details->>'amountKnown'='true'
        AND p.details->>'commercialState'='confirmed'
        AND COALESCE(p.details->>'status','')<>'cancelled'
        AND COALESCE(p.details->>'confirmedDate','')=''`),
  ]);

  console.log("finance-integrity-delivered", delivered.rows.map((row: Record<string, unknown>) => ({
    id: row.id, projectName: row.projectName, status: row.status, planned: row.planned,
    obligationRemaining: row.obligationRemaining, details: row.details,
  })));
  const items: FinanceIntegrityIssue[] = [];
  const add = (issue: FinanceIntegrityIssue) => items.push(issue);
  for (const row of unallocated.rows) {
    const outstanding = Math.max(0, integer(row.amountCents) - integer(row.allocated));
    add({
      id: `income_without_allocation:${row.id}`, category: "income_without_allocation", severity: "medium",
      title: "Incasso non attribuito", detail: `${row.note || "Movimento senza nota"} · ${outstanding} centesimi non collegati a rate o canoni.`,
      entityType: "movement", entityId: row.id, clientName: null, projectName: null, date: asDate(row.date), amountCents: outstanding,
    });
  }
  const paidLegacyIds = new Set<string>();
  for (const row of paidLegacy.rows) {
    paidLegacyIds.add(row.id);
    add({
      id: `legacy_paid_without_movement:${row.id}`, category: "legacy_paid_without_movement", severity: "high",
      title: "Voce storica segnata incassata senza movimento", detail: `${row.description} è marcata come pagata nel vecchio archivio, ma non esiste un movimento riconciliato: non è conteggiata nel bilancio.`,
      entityType: "legacy_entry", entityId: row.id, clientName: row.clientName ?? null, projectName: row.projectName ?? null,
      date: asDate(row.date), amountCents: integer(row.amountCents),
    });
  }
  for (const row of delivered.rows) {
    const details = detailsRecord(row.details);
    if (!confirmedProject({ details } as unknown as Parameters<typeof confirmedProject>[0])) continue;
    const total = Math.max(0, integer(row.totalAmountCents) + integer(details.extraCents));
    const planned = integer(row.planned);
    const receivable = integer(row.obligationRemaining) + Math.max(0, total - planned);
    if (receivable <= 0) continue;
    add({
      id: `delivered_open_balance:${row.id}`, category: "delivered_open_balance", severity: "high",
      title: "Lavoro consegnato con residuo", detail: `Residuo non coperto da movimenti: ${receivable} centesimi.`,
      entityType: "project", entityId: row.id, clientName: row.clientName ?? null, projectName: row.projectName, date: null, amountCents: receivable,
    });
  }
  for (const row of overdueRecurring.rows) {
    const amount = Math.max(0, integer(row.amountCents) - integer(row.allocated));
    add({
      id: `overdue_recurring:${row.id}`, category: "overdue_recurring", severity: "high",
      title: row.direction === "income" ? "Canone scaduto da incassare" : "Canone scaduto da pagare",
      detail: `${row.description}${row.supplierName ? ` · ${row.supplierName}` : ""} · scadenza ${row.date} · residuo ${amount} centesimi.`,
      entityType: "obligation", entityId: row.id, clientName: row.clientName ?? null, projectName: row.projectName ?? null,
      date: asDate(row.date), amountCents: amount,
    });
  }
  for (const candidate of candidates) {
    if (candidate.sourceType === "legacy_entry" && paidLegacyIds.has(candidate.id)) continue;
    add({
      id: `historical_unreconciled:${candidate.id}`, category: "historical_unreconciled", severity: "medium",
      title: candidate.sourceType === "project_reported" ? "Incasso storico da confermare" : "Voce storica da riconciliare",
      detail: `${candidate.description} non è ancora un movimento confermato; non viene conteggiata nei totali di cassa.`,
      entityType: candidate.sourceType === "project_reported" ? "project" : "legacy_entry",
      entityId: candidate.id, clientName: candidate.clientName ?? null, projectName: candidate.projectName ?? null,
      date: asDate(candidate.suggestedDate), amountCents: integer(candidate.suggestedAmountCents),
    });
  }
  for (const row of missingFiscal.rows) {
    add({
      id: `missing_client_fiscal_data:${row.id}`, category: "missing_client_fiscal_data", severity: "medium",
      title: "Documento attivo con anagrafica fiscale incompleta",
      detail: `Il documento ${row.number} è emesso ma il cliente non ha CF/P. IVA o indirizzo completo nell’anagrafica.`,
      entityType: "fiscal_document", entityId: row.id, clientName: row.clientName ?? null, projectName: row.projectName ?? null,
      date: asDate(row.date), amountCents: integer(row.amountCents),
    });
  }
  for (const row of undatedProjects.rows) {
    add({
      id: `confirmed_project_missing_date:${row.id}`, category: "confirmed_project_missing_date", severity: "low",
      title: "Lavoro confermato senza data di conferma",
      detail: "Il lavoro non può essere assegnato con certezza a un mese o anno nei report finché manca la data.",
      entityType: "project", entityId: row.id, clientName: row.clientName ?? null, projectName: row.projectName, date: null,
      amountCents: integer(row.amountCents),
    });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => rank[a.severity] - rank[b.severity] ||
    (a.date?.toISOString() ?? "").localeCompare(b.date?.toISOString() ?? "") || a.title.localeCompare(b.title));
  return {
    totalIssues: items.length,
    highCount: items.filter((item) => item.severity === "high").length,
    mediumCount: items.filter((item) => item.severity === "medium").length,
    lowCount: items.filter((item) => item.severity === "low").length,
    items,
  };
}

