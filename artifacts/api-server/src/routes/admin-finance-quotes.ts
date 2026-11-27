import { Router, type NextFunction, type Response } from "express";
import {
  CreateFinanceManualReminderBody,
  CreateFinanceQuoteBody,
  ConvertFinanceQuoteToProjectBody,
  ConvertFinanceQuoteToProjectParams,
  GetFinanceScheduleQueryParams,
  GetFinanceScheduleResponse,
  ListFinanceQuotesResponse,
  UpdateFinanceManualReminderBody,
  UpdateFinanceManualReminderParams,
  UpdateFinanceManualReminderResponse,
  UpdateFinanceQuoteBody,
  UpdateFinanceQuoteParams,
  UpdateFinanceQuoteStatusBody,
  UpdateFinanceQuoteStatusParams,
} from "@workspace/api-zod";
import type { FinanceQuoteConversionResponse } from "@workspace/api-zod";
import {
  convertFinanceQuoteToProject,
  createFinanceManualReminder,
  createFinanceQuote,
  financeQuotes,
  financeSchedule,
  updateFinanceManualReminder,
  updateFinanceQuote,
  updateFinanceQuoteStatus,
} from "../lib/finance-quotes-data";

const FinanceQuoteResponse=ListFinanceQuotesResponse.shape.quotes.element;
const FinanceManualReminderResponse=UpdateFinanceManualReminderResponse;
function parseFinanceQuoteConversionResponse(value:unknown):FinanceQuoteConversionResponse{
  const row=value as Partial<FinanceQuoteConversionResponse>|null;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!row||typeof row.projectId!=="string"||!uuid.test(row.projectId)||
    typeof row.quoteId!=="string"||!uuid.test(row.quoteId)||
    !Number.isInteger(row.createdInstallments)||Number(row.createdInstallments)<1||Number(row.createdInstallments)>60||
    !(row.recurringId===null||typeof row.recurringId==="string"&&uuid.test(row.recurringId))){
    throw new Error("Il risultato della conversione del preventivo non è valido.");
  }
  return row as FinanceQuoteConversionResponse;
}

function handleError(error:unknown,res:Response,next:NextFunction){
  const status=Number((error as {status?:number})?.status)||500;
  if(status>=500){next(error);return;}
  res.status(status).json({message:error instanceof Error?error.message:"Operazione non riuscita."});
}

export function createAdminFinanceQuotesRouter(){
  const router=Router();
  router.get("/admin/finance/quotes",async(_req,res,next):Promise<void>=>{
    try{res.json(ListFinanceQuotesResponse.parse(await financeQuotes()));}
    catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/quotes",async(req,res,next):Promise<void>=>{
    try{
      const body=CreateFinanceQuoteBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla cliente, date e voci del preventivo."});return;}
      res.status(201).json(FinanceQuoteResponse.parse(await createFinanceQuote(body.data)));
    }catch(error){handleError(error,res,next);}
  });
  router.patch("/admin/finance/quotes/:id",async(req,res,next):Promise<void>=>{
    try{
      const params=UpdateFinanceQuoteParams.safeParse(req.params);
      const body=UpdateFinanceQuoteBody.safeParse(req.body);
      if(!params.success||!body.success||Object.keys(body.data??{}).length===0){
        res.status(400).json({message:"Controlla i dati del preventivo."});return;
      }
      const quote=await updateFinanceQuote(params.data.id,body.data);
      if(!quote){res.status(404).json({message:"Preventivo non trovato."});return;}
      res.json(FinanceQuoteResponse.parse(quote));
    }catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/quotes/:id/status",async(req,res,next):Promise<void>=>{
    try{
      const params=UpdateFinanceQuoteStatusParams.safeParse(req.params);
      const body=UpdateFinanceQuoteStatusBody.safeParse(req.body);
      if(!params.success||!body.success){res.status(400).json({message:"Stato preventivo non valido."});return;}
      const quote=await updateFinanceQuoteStatus(params.data.id,body.data);
      if(!quote){res.status(404).json({message:"Preventivo non trovato."});return;}
      res.json(FinanceQuoteResponse.parse(quote));
    }catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/quotes/:id/convert",async(req,res,next):Promise<void>=>{
    try{
      const params=ConvertFinanceQuoteToProjectParams.safeParse(req.params);
      const body=ConvertFinanceQuoteToProjectBody.safeParse(req.body);
      if(!params.success||!body.success){res.status(400).json({message:"Controlla cliente, lavoro e piano pagamenti."});return;}
      res.status(201).json(parseFinanceQuoteConversionResponse(await convertFinanceQuoteToProject(params.data.id,body.data)));
    }catch(error){handleError(error,res,next);}
  });
  router.get("/admin/finance/schedule",async(req,res,next):Promise<void>=>{
    try{
      const params=GetFinanceScheduleQueryParams.safeParse(req.query);
      if(!params.success){res.status(400).json({message:"Seleziona un mese valido."});return;}
      res.json(GetFinanceScheduleResponse.parse(await financeSchedule(params.data.month)));
    }catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/manual-reminders",async(req,res,next):Promise<void>=>{
    try{
      const body=CreateFinanceManualReminderBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla titolo, data e collegamento del promemoria."});return;}
      const reminder=await createFinanceManualReminder(body.data);
      if(!reminder){res.status(500).json({message:"Il promemoria non è stato ricaricato dopo il salvataggio."});return;}
      res.status(201).json(FinanceManualReminderResponse.parse(reminder));
    }catch(error){handleError(error,res,next);}
  });
  router.patch("/admin/finance/manual-reminders/:id",async(req,res,next):Promise<void>=>{
    try{
      const params=UpdateFinanceManualReminderParams.safeParse(req.params);
      const body=UpdateFinanceManualReminderBody.safeParse(req.body);
      if(!params.success||!body.success||Object.keys(body.data??{}).length===0){
        res.status(400).json({message:"Aggiornamento promemoria non valido."});return;
      }
      const reminder=await updateFinanceManualReminder(params.data.id,body.data);
      if(!reminder){res.status(404).json({message:"Promemoria manuale non trovato."});return;}
      res.json(UpdateFinanceManualReminderResponse.parse(reminder));
    }catch(error){handleError(error,res,next);}
  });
  return router;
}

export default createAdminFinanceQuotesRouter();
