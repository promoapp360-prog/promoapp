import { Readable } from "node:stream";
import { Router, type NextFunction, type Response } from "express";
import {
  DownloadFinanceFiscalDocumentPdfParams,
  GetFinanceSettingsResponse,
  IssueFinanceFiscalDocumentBody,
  ListFinanceFiscalDocumentsResponse,
  UpdateFinanceSettingsBody,
  UpdateFinanceSettingsResponse,
  VoidFinanceFiscalDocumentBody,
  VoidFinanceFiscalDocumentParams,
} from "@workspace/api-zod";
import {
  financeFiscalDocumentFile,
  getFinanceSettings,
  issueFinanceFiscalDocument,
  listFinanceFiscalDocuments,
  updateFinanceSettings,
  voidFinanceFiscalDocument,
} from "../lib/finance-fiscal-data";
import { ObjectStorageService } from "../lib/objectStorage";

const FiscalDocumentResponse=ListFinanceFiscalDocumentsResponse.shape.documents.element;
function handleError(error:unknown,res:Response,next:NextFunction){
  const status=Number((error as {status?:number})?.status)||500;
  if(status>=500){next(error);return;}
  res.status(status).json({message:error instanceof Error?error.message:"Operazione non riuscita."});
}

export function createAdminFinanceFiscalRouter(){
  const router=Router();
  router.get("/admin/finance/settings",async(_req,res,next):Promise<void>=>{
    try{res.json(GetFinanceSettingsResponse.parse(await getFinanceSettings()));}
    catch(error){handleError(error,res,next);}
  });
  router.put("/admin/finance/settings",async(req,res,next):Promise<void>=>{
    try{
      const body=UpdateFinanceSettingsBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla intestazione, numerazioni e periodi fiscali."});return;}
      res.json(UpdateFinanceSettingsResponse.parse(await updateFinanceSettings(body.data)));
    }catch(error){handleError(error,res,next);}
  });
  router.get("/admin/finance/fiscal-documents",async(_req,res,next):Promise<void>=>{
    try{res.json(ListFinanceFiscalDocumentsResponse.parse(await listFinanceFiscalDocuments()));}
    catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/fiscal-documents",async(req,res,next):Promise<void>=>{
    try{
      const body=IssueFinanceFiscalDocumentBody.safeParse(req.body);
      if(!body.success){res.status(400).json({message:"Controlla cliente, data, descrizione e importo del documento."});return;}
      const document=await issueFinanceFiscalDocument(body.data);
      if(!document){res.status(500).json({message:"Il documento non è stato ricaricato dopo la generazione."});return;}
      res.status(201).json(FiscalDocumentResponse.parse(document));
    }catch(error){handleError(error,res,next);}
  });
  router.get("/admin/finance/fiscal-documents/:id/pdf",async(req,res,next):Promise<void>=>{
    try{
      const params=DownloadFinanceFiscalDocumentPdfParams.safeParse(req.params);
      if(!params.success){res.status(400).json({message:"Documento fiscale non valido."});return;}
      const {file,filename}=await financeFiscalDocumentFile(params.data.id);
      const [metadata]=await file.getMetadata();
      res.setHeader("Content-Disposition",`attachment; filename="${filename}"`);
      res.setHeader("Content-Type",metadata.contentType??"application/pdf");
      res.setHeader("X-Content-Type-Options","nosniff");
      res.setHeader("Cache-Control","private, no-store");
      const response=await new ObjectStorageService().downloadObject(file,0);
      if(response.body)Readable.fromWeb(response.body as import("node:stream/web").ReadableStream)
        .on("error",err=>res.destroy(err)).pipe(res);
      else res.end();
    }catch(error){handleError(error,res,next);}
  });
  router.post("/admin/finance/fiscal-documents/:id/void",async(req,res,next):Promise<void>=>{
    try{
      const params=VoidFinanceFiscalDocumentParams.safeParse(req.params);
      const body=VoidFinanceFiscalDocumentBody.safeParse(req.body);
      if(!params.success||!body.success){res.status(400).json({message:"Indica un motivo valido per l’annullamento."});return;}
      const document=await voidFinanceFiscalDocument(params.data.id,body.data);
      if(!document){res.status(404).json({message:"Documento fiscale non trovato."});return;}
      res.json(FiscalDocumentResponse.parse(document));
    }catch(error){handleError(error,res,next);}
  });
  return router;
}

export default createAdminFinanceFiscalRouter();
