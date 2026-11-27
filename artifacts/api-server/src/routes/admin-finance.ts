import { Router } from "express";
import {
  CreateAdminFinanceClientBody,
  CreateAdminFinanceEntryBody,
  CreateAdminFinanceProjectBody,
  CreateAdminFinanceSupplierBody,
  DeleteAdminFinanceEntryParams,
  GetAdminFinanceQueryParams,
  GetAdminFinanceResponse,
  MarkAdminFinanceEntryPaidParams,
  UpdateAdminFinanceClientBody,
  UpdateAdminFinanceClientParams,
  UpdateAdminFinanceEntryBody,
  UpdateAdminFinanceEntryParams,
  UpdateAdminFinanceProjectBody,
  UpdateAdminFinanceProjectParams,
  UpdateAdminFinanceSupplierBody,
  UpdateAdminFinanceSupplierParams,
  ListAdminFinanceSuppliersResponse,
  UpdateAdminFinanceSupplierResponse,
} from "@workspace/api-zod";
import type { FinanceEntryInput, FinanceSupplierInput } from "@workspace/api-zod";
import { adminFinanceData } from "../lib/admin-finance-data";
import { createAdminFinanceLedgerRouter } from "./admin-finance-ledger";
import { createAdminFinanceFiscalRouter } from "./admin-finance-fiscal";
import { createAdminFinanceQuotesRouter } from "./admin-finance-quotes";
import { createFinanceToolsRouter } from "./admin-finance-tools";

type FinanceData = typeof adminFinanceData;
const FinanceProjectResponse = GetAdminFinanceResponse.shape.projects.element;
const FinanceEntryResponse = GetAdminFinanceResponse.shape.entries.element;
const FinanceClientResponse = GetAdminFinanceResponse.shape.clients.element;
const FinanceSupplierResponse = UpdateAdminFinanceSupplierResponse;

function categoryMatchesDirection(direction: FinanceEntryInput["direction"], category: FinanceEntryInput["category"]) {
  return direction === "income"
    ? ["deposit", "balance", "installment", "monthly_fee", "other"].includes(category)
    : ["facebook", "google", "replit", "canva", "hosting", "domains", "software", "administration", "accountant", "consulting", "equipment", "research", "other"].includes(category);
}

function paymentTermsMatch(
  paymentType: "single" | "advance" | "installments",
  totalAmountCents: number,
  depositAmountCents: number | null | undefined,
  installmentCount: number | null | undefined,
) {
  if (paymentType === "single") return depositAmountCents == null && installmentCount == null;
  if (paymentType === "advance") {
    return depositAmountCents != null && depositAmountCents > 0 &&
      depositAmountCents <= totalAmountCents && installmentCount == null;
  }
  return depositAmountCents == null &&
    (installmentCount == null || (installmentCount >= 2 && installmentCount <= 60));
}

export function createAdminFinanceRouter(data: FinanceData = adminFinanceData) {
  const router = Router();
  router.use(createFinanceToolsRouter());
  router.use(createAdminFinanceLedgerRouter());
  router.use(createAdminFinanceFiscalRouter());
  router.use(createAdminFinanceQuotesRouter());

  router.get("/admin/finance", async (req, res): Promise<void> => {
    const parsed = GetAdminFinanceQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Seleziona un mese valido." });
      return;
    }
    res.json(GetAdminFinanceResponse.parse(await data.list(parsed.data.month)));
  });

  router.post("/admin/finance/clients", async (req, res): Promise<void> => {
    const parsed = CreateAdminFinanceClientBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.name.trim()) {
      res.status(400).json({ message: "Inserisci il nome del cliente." });
      return;
    }
    const client = await data.createClient({
      ...parsed.data,
      name: parsed.data.name.trim(),
      companyName: parsed.data.companyName?.trim() || null,
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      notes: parsed.data.notes?.trim() ?? "",
    });
    if (!client) {
      res.status(409).json({ message: "Esiste già un cliente con lo stesso nome e la stessa azienda." });
      return;
    }
    res.status(201).json(FinanceClientResponse.parse(client));
  });

  router.patch("/admin/finance/clients/:id", async (req, res): Promise<void> => {
    const params = UpdateAdminFinanceClientParams.safeParse(req.params);
    const body = UpdateAdminFinanceClientBody.safeParse(req.body);
    if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0 ||
      (body.data.name !== undefined && !body.data.name.trim())) {
      res.status(400).json({ message: "Controlla i dati del cliente." });
      return;
    }
    const update = {
      ...(body.data.name === undefined ? {} : { name: body.data.name.trim() }),
      ...(body.data.companyName === undefined ? {} : { companyName: body.data.companyName?.trim() || null }),
      ...(body.data.email === undefined ? {} : { email: body.data.email?.trim() || null }),
      ...(body.data.phone === undefined ? {} : { phone: body.data.phone?.trim() || null }),
      ...(body.data.taxId === undefined ? {} : { taxId: body.data.taxId?.trim() || null }),
      ...(body.data.address === undefined ? {} : { address: body.data.address?.trim() || null }),
      ...(body.data.sector === undefined ? {} : { sector: body.data.sector?.trim() || null }),
      ...(body.data.acquisitionSource === undefined ? {} : { acquisitionSource: body.data.acquisitionSource?.trim() || null }),
      ...(body.data.status === undefined ? {} : { status: body.data.status }),
      ...(body.data.notes === undefined ? {} : { notes: body.data.notes.trim() }),
      ...(body.data.details === undefined ? {} : { details: body.data.details }),
    };
    const client = await data.updateClient(params.data.id, update);
    if (client === null) {
      res.status(409).json({ message: "Esiste già un cliente con lo stesso nome e la stessa azienda." });
      return;
    }
    if (!client) {
      res.status(404).json({ message: "Cliente non trovato." });
      return;
    }
    res.json(FinanceClientResponse.parse(client));
  });

  router.get("/admin/finance/suppliers", async (_req,res):Promise<void> => {
    res.json(ListAdminFinanceSuppliersResponse.parse(await data.listSuppliers()));
  });

  router.post("/admin/finance/suppliers", async (req,res):Promise<void> => {
    const parsed=CreateAdminFinanceSupplierBody.safeParse(req.body);
    if(!parsed.success||!parsed.data.name.trim()){
      res.status(400).json({message:"Inserisci il nome del fornitore."});return;
    }
    const supplier=await data.createSupplier({...parsed.data,name:parsed.data.name.trim()} as FinanceSupplierInput);
    if(!supplier){res.status(409).json({message:"Esiste già un fornitore con questo nome."});return;}
    res.status(201).json(FinanceSupplierResponse.parse(supplier));
  });

  router.patch("/admin/finance/suppliers/:id", async (req,res):Promise<void> => {
    const params=UpdateAdminFinanceSupplierParams.safeParse(req.params);
    const body=UpdateAdminFinanceSupplierBody.safeParse(req.body);
    if(!params.success||!body.success||!Object.keys(body.data??{}).length||
      (body.data.name!==undefined&&!body.data.name.trim())){
      res.status(400).json({message:"Controlla i dati del fornitore."});return;
    }
    const supplier=await data.updateSupplier(params.data.id,body.data);
    if(supplier===null){res.status(409).json({message:"Esiste già un fornitore con questo nome."});return;}
    if(!supplier){res.status(404).json({message:"Fornitore non trovato."});return;}
    res.json(UpdateAdminFinanceSupplierResponse.parse(supplier));
  });

  router.post("/admin/finance/projects", async (req, res): Promise<void> => {
    const parsed = CreateAdminFinanceProjectBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.name.trim() ||
      !paymentTermsMatch(parsed.data.paymentType, parsed.data.totalAmountCents, parsed.data.depositAmountCents, parsed.data.installmentCount)) {
      res.status(400).json({ message: "Controlla il cliente, il lavoro, l’importo e la modalità di pagamento." });
      return;
    }
    const project = await data.createProject({
      ...parsed.data,
      name: parsed.data.name.trim(),
    });
    if (!project) {
      res.status(404).json({ message: "Il cliente selezionato non esiste." });
      return;
    }
    res.status(201).json(FinanceProjectResponse.parse(project));
  });

  router.patch("/admin/finance/projects/:id", async (req, res): Promise<void> => {
    const params = UpdateAdminFinanceProjectParams.safeParse(req.params);
    const body = UpdateAdminFinanceProjectBody.safeParse(req.body);
    if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0 ||
      (body.data.name !== undefined && !body.data.name.trim())) {
      res.status(400).json({ message: "Dati del lavoro non validi." });
      return;
    }
    const updated = await data.updateProject(params.data.id, body.data);
    if (updated === null) {
      res.status(400).json({ message: "Controlla la modalità di pagamento e i relativi importi." });
      return;
    }
    if (!updated) {
      res.status(404).json({ message: "Lavoro non trovato." });
      return;
    }
    res.json(FinanceProjectResponse.parse(updated));
  });

  router.post("/admin/finance/entries", async (req, res): Promise<void> => {
    const parsed = CreateAdminFinanceEntryBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.description.trim() || !categoryMatchesDirection(parsed.data.direction, parsed.data.category)) {
      res.status(400).json({ message: "Controlla tipo, voce, importo e scadenza." });
      return;
    }
    const entry = await data.createEntry(parsed.data);
    if (!entry) {
      res.status(404).json({ message: "Il lavoro selezionato non esiste più." });
      return;
    }
    res.status(201).json(FinanceEntryResponse.parse(entry));
  });

  router.patch("/admin/finance/entries/:id", async (req, res): Promise<void> => {
    const params = UpdateAdminFinanceEntryParams.safeParse(req.params);
    const body = UpdateAdminFinanceEntryBody.safeParse(req.body);
    if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0 ||
      (body.data.description !== undefined && !body.data.description.trim())) {
      res.status(400).json({ message: "Dati del movimento non validi." });
      return;
    }
    const updated = await data.updateEntry(params.data.id, body.data);
    if (updated === null) {
      res.status(400).json({ message: "La voce scelta non è compatibile con entrate o spese." });
      return;
    }
    if (!updated) {
      res.status(404).json({ message: "Movimento non trovato." });
      return;
    }
    res.json(FinanceEntryResponse.parse(updated));
  });

  router.post("/admin/finance/entries/:id/paid", async (req, res): Promise<void> => {
    const params = MarkAdminFinanceEntryPaidParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Movimento non valido." });
      return;
    }
    const updated = await data.markEntryPaid(params.data.id);
    if (!updated) {
      res.status(404).json({ message: "Movimento non trovato." });
      return;
    }
    res.json(FinanceEntryResponse.parse(updated));
  });

  router.delete("/admin/finance/entries/:id", async (req, res): Promise<void> => {
    const params = DeleteAdminFinanceEntryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Movimento non valido." });
      return;
    }
    if (!await data.deleteEntry(params.data.id)) {
      res.status(404).json({ message: "Movimento non trovato o già annullato." });
      return;
    }
    res.status(204).end();
  });

  router.use("/admin/finance", (err: unknown, req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
    req.log?.error({ err }, "Errore contabilità admin");
    if (err instanceof Error && "status" in err && err.status === 400) {
      res.status(400).json({ message: err.message }); return;
    }
    if(typeof err==="object"&&err!==null&&"code" in err&&err.code==="23505") {
      res.status(409).json({message:"Questo cliente, lavoro o pagamento risulta già collegato. Modifica il record esistente senza duplicarlo."});return;
    }
    if(err instanceof Error&&err.name==="ObjectNotFoundError") {
      res.status(404).json({message:"Documento non trovato. Ricaricalo prima di salvare."});return;
    }
    res.status(500).json({ message: "Dati contabili non disponibili. Riprova tra poco." });
  });
  return router;
}

export default createAdminFinanceRouter();
