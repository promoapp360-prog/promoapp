import { Router, type NextFunction, type Response } from "express";
import {
  CreateFinanceAccountBody,
  CreateFinanceObligationBody,
  CreateFinanceMovementBody,
  GetFinanceLedgerResponse,
  ReconcileFinanceHistoryBody,
  GetFinanceLedgerQueryParams,
} from "@workspace/api-zod";
import {
  createFinanceAccount,
  createFinanceMovement,
  createFinanceObligation,
  financeLedgerData,
  reconcileFinanceHistory,
} from "../lib/finance-ledger-data";

const FinanceLedgerAccountResponse=GetFinanceLedgerResponse.shape.accounts.element;
const FinanceLedgerObligationResponse=GetFinanceLedgerResponse.shape.obligations.element;
const FinanceLedgerMovementResponse=GetFinanceLedgerResponse.shape.movements.element;

function errorResponse(error: unknown, res: Response, next: NextFunction) {
  const status=Number((error as {status?:number;code?:string})?.status)||
    ((error as {code?:string})?.code==="23505"?409:500);
  if(status>=500){next(error);return;}
  const message=(error as {code?:string})?.code==="23505"
    ?"Esiste già un conto con questo nome."
    :error instanceof Error?error.message:"Errore durante l’operazione contabile.";
  res.status(status).json({message});
}

export function createAdminFinanceLedgerRouter() {
  const router=Router();
  router.get("/admin/finance/ledger",async(req,res,next):Promise<void>=>{
    try{
      const params=GetFinanceLedgerQueryParams.safeParse(req.query);
      if(!params.success){res.status(400).json({message:"Seleziona un mese valido."});return;}
      res.json(GetFinanceLedgerResponse.parse(await financeLedgerData(params.data.month)));
    }catch(error){errorResponse(error,res,next);}
  });
  router.post("/admin/finance/ledger/accounts",async(req,res,next):Promise<void>=>{
    try{
      const body=CreateFinanceAccountBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla nome, tipo e saldo iniziale del conto."});return;}
      const account=await createFinanceAccount(body.data);
      res.status(201).json(FinanceLedgerAccountResponse.parse(account));
    }catch(error){errorResponse(error,res,next);}
  });
  router.post("/admin/finance/ledger/obligations",async(req,res,next):Promise<void>=>{
    try{
      const body=CreateFinanceObligationBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla cliente, lavoro, importo e scadenza."});return;}
      const obligation=await createFinanceObligation(body.data);
      if(!obligation){res.status(500).json({message:"La scadenza non è stata restituita dopo il salvataggio."});return;}
      res.status(201).json(FinanceLedgerObligationResponse.parse(obligation));
    }catch(error){errorResponse(error,res,next);}
  });
  router.post("/admin/finance/ledger/movements",async(req,res,next):Promise<void>=>{
    try{
      const body=CreateFinanceMovementBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla data, importo, conto e ripartizione."});return;}
      const movement=await createFinanceMovement(body.data);
      if(!movement){res.status(500).json({message:"Il movimento non è stato restituito dopo il salvataggio."});return;}
      res.status(201).json(FinanceLedgerMovementResponse.parse(movement));
    }catch(error){errorResponse(error,res,next);}
  });
  router.post("/admin/finance/ledger/reconcile",async(req,res,next):Promise<void>=>{
    try{
      const body=ReconcileFinanceHistoryBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla dato storico, importo, data e conto."});return;}
      const movement=await reconcileFinanceHistory(body.data);
      if(!movement){res.status(500).json({message:"La riconciliazione non ha generato un movimento."});return;}
      res.status(201).json(FinanceLedgerMovementResponse.parse(movement));
    }catch(error){errorResponse(error,res,next);}
  });
  return router;
}
