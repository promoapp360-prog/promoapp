import { Router } from "express";
import {
  GetFinanceIntegrityResponse,
  GetFinanceReportsQueryParams,
  GetFinanceReportsResponse,
} from "@workspace/api-zod";
import { getFinanceIntegrity, getFinanceReports } from "../lib/finance-reports-data";

export function createAdminFinanceReportsRouter() {
  const router = Router();
  router.get("/admin/finance/reports", async (req, res): Promise<void> => {
    const params = GetFinanceReportsQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ message: "Seleziona un mese o un anno valido." });
      return;
    }
    const report = await getFinanceReports(params.data.periodType, params.data.period);
    res.json(GetFinanceReportsResponse.parse(report));
  });
  router.get("/admin/finance/verification", async (_req, res): Promise<void> => {
    res.json(GetFinanceIntegrityResponse.parse(await getFinanceIntegrity()));
  });
  return router;
}
