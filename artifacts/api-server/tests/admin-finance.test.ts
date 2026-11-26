import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import type {
  AdminFinanceClient,
  AdminFinanceData,
  AdminFinanceEntry,
  AdminFinanceProject,
  AdminFinanceSupplier, FinanceSupplierInput, FinanceSupplierUpdate,
  FinanceClientInput,
  FinanceClientUpdate,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-zod";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { createAdminFinanceRouter } from "../src/routes/admin-finance";
import { nextMonthlyDate } from "../src/lib/admin-finance-data";

const PASSWORD = "Synthetic-finance-admin";
const KEY = "Synthetic-finance-session-key";

function makeRepository() {
  const clients: AdminFinanceClient[] = [];
  const projects: AdminFinanceProject[] = [];
  const entries: AdminFinanceEntry[] = [];
  const suppliers: AdminFinanceSupplier[] = [];
  const data = {
    async listSuppliers() { return [...suppliers]; },
    async createSupplier(input: FinanceSupplierInput): Promise<AdminFinanceSupplier | null> {
      if(suppliers.some(s=>s.name.toLowerCase()===input.name.toLowerCase()))return null;
      const supplier: AdminFinanceSupplier={...input,id:randomUUID(),email:input.email??null,website:input.website??null,notes:input.notes??"",active:true,createdAt:new Date()};
      suppliers.push(supplier);return supplier;
    },
    async updateSupplier(id:string,input:FinanceSupplierUpdate):Promise<AdminFinanceSupplier|null|undefined>{
      const supplier=suppliers.find(s=>s.id===id);if(!supplier)return undefined;
      Object.assign(supplier,input);return supplier;
    },
    async list(month: string): Promise<AdminFinanceData> {
      const monthPaid = (entry: AdminFinanceEntry) => entry.paidAt &&
        new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit" })
          .format(new Date(entry.paidAt)) === month;
      const receivedCents = entries.filter((entry) => entry.direction === "income" && monthPaid(entry))
        .reduce((sum, entry) => sum + entry.amountCents, 0);
      const expensesCents = entries.filter((entry) => entry.direction === "expense" && monthPaid(entry))
        .reduce((sum, entry) => sum + entry.amountCents, 0);
      const projectRows = projects.map((project) => {
        const relatedIncome = entries.filter((entry) => entry.projectId === project.id && entry.direction === "income");
        return {
          ...project,
          receivedCents: relatedIncome.filter((entry) => entry.paidAt)
            .reduce((sum, entry) => sum + entry.amountCents, 0),
          outstandingCents: relatedIncome.filter((entry) => !entry.paidAt)
            .reduce((sum, entry) => sum + entry.amountCents, 0),
        };
      });
      return {
        summary: {
          month,
          receivedCents,
          expensesCents,
          balanceCents: receivedCents - expensesCents,
          outstandingCents: entries.filter((entry) => entry.direction === "income" && !entry.paidAt).reduce((sum, entry) => sum + entry.amountCents, 0),
          overdueIncomeCents: 0,
          unpaidExpensesCents: entries.filter((entry) => entry.direction === "expense" && !entry.paidAt).reduce((sum, entry) => sum + entry.amountCents, 0),
        },
        clients: [...clients],
        projects: projectRows,
        entries: [...entries],
      };
    },
    async createClient(input: FinanceClientInput): Promise<AdminFinanceClient | null> {
      const key = JSON.stringify([input.name.trim().toLocaleLowerCase("it-IT"), (input.companyName ?? "").trim().toLocaleLowerCase("it-IT")]);
      if (clients.some((client) => JSON.stringify([client.name.toLocaleLowerCase("it-IT"), (client.companyName ?? "").toLocaleLowerCase("it-IT")]) === key)) return null;
      const client: AdminFinanceClient = {
        id: randomUUID(),
        name: input.name.trim(),
        companyName: input.companyName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? "",
        createdAt: new Date(),
      };
      clients.push(client);
      return client;
    },
    async updateClient(id: string, input: FinanceClientUpdate): Promise<AdminFinanceClient | undefined | null> {
      const client = clients.find((item) => item.id === id);
      if (!client) return;
      const nextName = input.name ?? client.name;
      const nextCompany = input.companyName === undefined ? client.companyName : input.companyName;
      if (clients.some((item) => item.id !== id &&
        item.name.toLocaleLowerCase("it-IT") === nextName.toLocaleLowerCase("it-IT") &&
        (item.companyName ?? "").toLocaleLowerCase("it-IT") === (nextCompany ?? "").toLocaleLowerCase("it-IT"))) return null;
      Object.assign(client, input);
      return client;
    },
    async createProject(input: FinanceProjectInput): Promise<AdminFinanceProject | undefined> {
      const client = clients.find((item) => item.id === input.clientId);
      if (!client) return;
      const project = {
        id: randomUUID(),
        clientId: client.id,
        clientName: client.name,
        name: input.name,
        totalAmountCents: input.totalAmountCents,
        paymentType: input.paymentType,
        depositAmountCents: input.depositAmountCents ?? null,
        installmentCount: input.installmentCount ?? null,
        notes: input.notes ?? "",
        active: true,
        createdAt: new Date(),
        receivedCents: 0,
        outstandingCents: 0,
      };
      projects.push(project);
      return project;
    },
    async updateProject(id: string, input: FinanceProjectUpdate): Promise<AdminFinanceProject | undefined | null> {
      const project = projects.find((item) => item.id === id);
      if (!project) return;
      const paymentType = input.paymentType ?? project.paymentType;
      const deposit = input.depositAmountCents === undefined ? project.depositAmountCents : input.depositAmountCents;
      const count = input.installmentCount === undefined ? project.installmentCount : input.installmentCount;
      const total = input.totalAmountCents ?? project.totalAmountCents;
      if ((paymentType === "single" && (deposit !== null || count !== null)) ||
        (paymentType === "advance" && (deposit === null || deposit <= 0 || deposit > total || count !== null)) ||
        (paymentType === "installments" && (deposit !== null || (count !== null && (count < 2 || count > 60))))) return null;
      const client = input.clientId ? clients.find((item) => item.id === input.clientId) : undefined;
      if (input.clientId && !client) return null;
      Object.assign(project, input, client ? { clientId: client.id, clientName: client.name } : {});
      return project;
    },
    async createEntry(input: FinanceEntryInput): Promise<AdminFinanceEntry | undefined> {
      if (input.projectId && !projects.some((project) => project.id === input.projectId)) return;
      const project = projects.find((item) => item.id === input.projectId);
      const entry: AdminFinanceEntry = {
        id: randomUUID(),
        projectId: input.projectId ?? null,
        projectName: project?.name ?? null,
        clientName: project?.clientName ?? null,
        direction: input.direction,
        category: input.category,
        description: input.description,
        amountCents: input.amountCents,
        dueDate: input.dueDate,
        paidAt: input.paid ? new Date() : null,
        repeatMonthly: input.repeatMonthly ?? false,
        createdAt: new Date(),
      };
      entries.push(entry);
      return entry;
    },
    async updateEntry(id: string, input: FinanceEntryUpdate): Promise<AdminFinanceEntry | undefined | null> {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return;
      if (
        input.category &&
        ((entry.direction === "income" && ["facebook", "replit"].includes(input.category)) ||
          (entry.direction === "expense" && ["deposit", "balance", "monthly_fee"].includes(input.category)))
      ) return null;
      Object.assign(entry, input, input.dueDate ? { dueDate: input.dueDate } : {});
      return entry;
    },
    async markEntryPaid(id: string): Promise<AdminFinanceEntry | undefined> {
      const entry = entries.find((item) => item.id === id);
      if (entry) entry.paidAt ??= new Date();
      return entry;
    },
    async deleteEntry(id: string): Promise<boolean> {
      const entry = entries.find((item) => item.id === id);
      if (!entry || entry.paidAt) return false;
      entries.splice(entries.indexOf(entry), 1);
      return true;
    },
  };
  return { data: data as unknown as Parameters<typeof createAdminFinanceRouter>[0], projects, entries };
}

async function withApp(run: (base: string, state: ReturnType<typeof makeRepository>) => Promise<void>) {
  const state = makeRepository();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { warn: () => {}, error: () => {} } });
    next();
  });
  app.use("/api", createAdminAuthorization(() => PASSWORD, () => KEY), createAdminFinanceRouter(state.data));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`, state);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const post = (value: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

async function login(base: string) {
  const response = await fetch(`${base}/admin/login`, post({ password: PASSWORD }));
  assert.equal(response.status, 200);
  const result = await response.json() as { csrfToken: string };
  return {
    Cookie: response.headers.get("set-cookie")!.split(";")[0],
    "x-admin-csrf": result.csrfToken,
    "Content-Type": "application/json",
  };
}

test("finance data remains protected and validates requested month", async () => {
  await withApp(async (base) => {
    assert.equal((await fetch(`${base}/admin/finance?month=2026-11`)).status, 401);
    const auth = await login(base);
    assert.equal((await fetch(`${base}/admin/finance?month=2026-13`, { headers: auth })).status, 400);
    const response = await fetch(`${base}/admin/finance?month=2026-11`, { headers: auth });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).summary.month, "2026-11");
  });
});

test("monthly due dates preserve their original billing day", () => {
  assert.equal(nextMonthlyDate("2026-01-31", 31), "2026-02-28");
  assert.equal(nextMonthlyDate("2028-01-31", 31), "2028-02-29");
  assert.equal(nextMonthlyDate("2026-12-31", 31), "2027-01-31");
});

test("jobs, due income, expenses and payment reminders can be managed", async () => {
  await withApp(async (base, state) => {
    const auth = await login(base);
    const clientsPath = `${base}/admin/finance/clients`;
    assert.equal((await fetch(clientsPath, { ...post({ name: " " }), headers: auth })).status, 400);
    const clientResponse = await fetch(clientsPath, {
      ...post({ name: "Cliente di prova", companyName: "Promo Demo", email: "cliente@example.test", phone: "+39 000 000 0000" }),
      headers: auth,
    });
    assert.equal(clientResponse.status, 201);
    const client = await clientResponse.json() as AdminFinanceClient;
    assert.equal(client.companyName, "Promo Demo");
    assert.equal((await fetch(clientsPath, {
      ...post({ name: "Cliente di prova", companyName: "Promo Demo" }),
      headers: auth,
    })).status, 409);
    const updatedClient = await fetch(`${clientsPath}/${client.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ phone: "+39 111 111 1111" }),
    });
    assert.equal(updatedClient.status, 200);

    const projectsPath = `${base}/admin/finance/projects`;
    assert.equal((await fetch(projectsPath, { ...post({ clientName: " ", name: "Sito", totalAmountCents: 250000 }), headers: auth })).status, 400);
    assert.equal((await fetch(projectsPath, {
      ...post({ clientId: client.id, name: "Sito", totalAmountCents: 250000, paymentType: "advance" }),
      headers: auth,
    })).status, 400);
    const projectResponse = await fetch(projectsPath, {
      ...post({
        clientId: client.id,
        name: "Sito web",
        totalAmountCents: 250000,
        paymentType: "advance",
        depositAmountCents: 100000,
      }),
      headers: auth,
    });
    assert.equal(projectResponse.status, 201);
    const project = await projectResponse.json() as AdminFinanceProject;
    assert.equal(project.totalAmountCents, 250000);
    assert.equal(project.clientId, client.id);
    assert.equal(project.paymentType, "advance");
    assert.equal(project.depositAmountCents, 100000);
    const rateModeWithoutCount = await fetch(`${projectsPath}/${project.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ paymentType: "installments", depositAmountCents: null }),
    });
    assert.equal(rateModeWithoutCount.status, 200);
    assert.equal((await rateModeWithoutCount.json() as AdminFinanceProject).installmentCount, null);
    assert.equal((await fetch(`${projectsPath}/${project.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ installmentCount: 1 }),
    })).status, 400);
    const savedInstallmentCount = await fetch(`${projectsPath}/${project.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ installmentCount: 5 }),
    });
    assert.equal(savedInstallmentCount.status, 200);
    assert.equal((await savedInstallmentCount.json() as AdminFinanceProject).installmentCount, 5);
    const archived = await fetch(`${projectsPath}/${project.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ active: false }),
    });
    assert.equal(archived.status, 200);
    assert.equal((await archived.json() as AdminFinanceProject).active, false);

    const entriesPath = `${base}/admin/finance/entries`;
    const mismatchedExpense = await fetch(entriesPath, {
      ...post({
        projectId: project.id,
        direction: "income",
        category: "facebook",
        description: "Categoria non compatibile",
        amountCents: 5000,
        dueDate: "2026-11-30",
      }),
      headers: auth,
    });
    assert.equal(mismatchedExpense.status, 400);

    const created = await fetch(entriesPath, {
      ...post({
        projectId: project.id,
        direction: "income",
        category: "deposit",
        description: "Acconto iniziale",
        amountCents: 100000,
        dueDate: "2026-11-30",
        repeatMonthly: false,
      }),
      headers: auth,
    });
    assert.equal(created.status, 201);
    const entry = await created.json() as AdminFinanceEntry;
    assert.equal(entry.projectName, project.name);
    assert.equal(state.entries.length, 1);
    const dueBalance = await (await fetch(`${base}/admin/finance?month=2026-11`, { headers: auth })).json();
    assert.equal(dueBalance.summary.outstandingCents, 100000);
    assert.equal(dueBalance.projects.find((item: AdminFinanceProject) => item.id === project.id).outstandingCents, 100000);

    const marked = await fetch(`${base}/admin/finance/entries/${entry.id}/paid`, {
      method: "POST",
      headers: auth,
    });
    assert.equal(marked.status, 200);
    assert.ok((await marked.json() as AdminFinanceEntry).paidAt);
    const paidBalance = await (await fetch(`${base}/admin/finance?month=2026-11`, { headers: auth })).json();
    assert.equal(paidBalance.summary.outstandingCents, 0);
    assert.equal(paidBalance.projects.find((item: AdminFinanceProject) => item.id === project.id).outstandingCents, 0);

    const replitExpense = await fetch(entriesPath, {
      ...post({
        direction: "expense",
        category: "replit",
        description: "Canone Replit",
        amountCents: 2500,
        dueDate: "2026-11-24",
        repeatMonthly: true,
      }),
      headers: auth,
    });
    assert.equal(replitExpense.status, 201);
    const expense = await replitExpense.json() as AdminFinanceEntry;
    assert.equal(expense.category, "replit");
    assert.equal((await fetch(`${base}/admin/finance/entries/${expense.id}/paid`, { method: "POST", headers: auth })).status, 200);

    const facebookExpense = await fetch(entriesPath, {
      ...post({
        direction: "expense",
        category: "facebook",
        description: "Campagna Facebook",
        amountCents: 5000,
        dueDate: "2026-11-24",
      }),
      headers: auth,
    });
    assert.equal(facebookExpense.status, 201);
    const facebookEntry = await facebookExpense.json() as AdminFinanceEntry;
    assert.equal((await fetch(`${base}/admin/finance/entries/${facebookEntry.id}`, {
      method: "DELETE",
      headers: auth,
    })).status, 204);

    const cannotDeletePaid = await fetch(`${base}/admin/finance/entries/${entry.id}`, {
      method: "DELETE",
      headers: auth,
    });
    assert.equal(cannotDeletePaid.status, 404);

    const summary = await (await fetch(`${base}/admin/finance?month=2026-11`, { headers: auth })).json();
    assert.equal(summary.summary.receivedCents, 100000);
    assert.equal(summary.summary.expensesCents, 2500);
    assert.equal(summary.projects[0].id, project.id);
  });
});
