import type { AdminFinanceData, FinanceImportPreview, FinanceWorkspace } from "@workspace/api-zod";

// The document is a reconciliation proposal, NOT a list of bank transactions.
export const financeImportManifest = [
  { key:"am",name:"AM MULTISERVIZI SRLS",aliases:["KEOS MILANO"],project:"Sito web, gestionale e applicazione fedeltà",state:"delivered",total:null,reported:284500,issues:["Valore contrattuale e date degli incassi mancanti; verificare eventuali saldi."] },
  { key:"ottico",name:"CENTRO OTTICO",aliases:["VISION MEDICAL CENTER"],project:"Sito web e gestionale",state:"delivered",total:150000,reported:150000,recurring:{amount:2000,start:"2026-12-01",state:"active"},issues:["Servizio del canone da specificare; date degli incassi mancanti."] },
  { key:"locanda",name:"LA LOCANDA DEI SASSI",aliases:[],project:"Sito web e gestionale",state:"delivered",total:70000,extra:15000,reported:85000,issues:["Extra 150 € versato da Fabrizio Affuso: ordinante, non nuovo cliente. Date da verificare."] },
  { key:"bigpi",name:"BIGPI SRL",aliases:["BOTTEGA DEGLI ARTIGIANI"],project:"Progetto principale",state:"delivered",total:99900,reported:66600,credit:33300,quote:100000,issues:["Tipologia del progetto da verificare. Proposta pubblicitaria 3 mesi separata e non accettata. Date incassi mancanti."] },
  { key:"enzo",name:"ENZO ACCONCIATURA",aliases:[],project:"Sito web e gestionale",state:"delivered",total:40000,reported:40000,issues:["Confrontare il lavoro storico Enzo Acconciature: somiglianza non autorizza un collegamento automatico. Date mancanti."] },
  { key:"divina",name:"DIVINA DI SALA ARIANNA",aliases:[],project:"Sito web",state:"delivered",total:42500,reported:27500,credit:15000,issues:["Negli estratti risultano 225 €; 50 € da riconciliare, nessun movimento inventato."] },
  { key:"esse",name:"ESSE MOBILE – NICOLA",aliases:[],project:"Sito web",state:"delivered",total:50000,reported:20000,credit:30000,recurring:{amount:1000,start:"2026-11-01",state:"active"},issues:["Database; verificare mensilità effettivamente pagate e date dei 200 €."] },
  { key:"angolo",name:"L’ANGOLO DEL BENESSERE",aliases:[],project:"Centro estetico",state:"delivered",total:47500,reported:47400,issues:["Differenza 1 € da verificare: credito e solleciti bloccati fino a conferma."] },
  { key:"vecciari",name:"VECCIARÍ MATERA",aliases:[],project:"Sito ristorante, gestionale, prenotazioni, menù QR e ordini al tavolo",state:"delivered",total:100000,reported:0,credit:100000,issues:["Nessun canone. Non confondere con La Locanda dei Sassi. Data accordo mancante."] },
  { key:"dogs",name:"DOG’S PLANET – FULVIO LUCARELLI",aliases:[],project:"Gestionale toelettatura, prenotazioni, animali e futuro Pet Shop",state:"demo",total:59900,reported:0,domain:500,recurring:{amount:1500,start:null,state:"potential"},issues:["Conferma commessa e credito di 5 € per dominio da verificare; canone non attivo."] },
  { key:"teresa",name:"STUDIO DOTT.SSA TERESA DELLA VOLPE",aliases:[],project:"Sito e gestionale medico",state:"demo",total:49900,reported:0,recurring:{amount:1000,start:null,state:"potential"},issues:["Demo: credito non esigibile senza conferma. Decorrenza canone non definita."] },
  { key:"angelo",name:"ANGELO – CHEF ON BOARD",aliases:[],project:"Landing, corsi cucina e voucher",state:"working",total:49900,reported:0,issues:["Confermare data dell’accordo; canone da verificare. Futuro e-commerce non incluso automaticamente."] },
  { key:"marco",name:"MARCO – ZUCCHERO PERSONALIZZATO",aliases:[],project:"E-commerce zucchero personalizzato",state:"working",total:null,reported:null,issues:["Prezzo, incassi e accordi da definire: nessuna vendita a zero."] },
  { key:"mirage",name:"MIRAGE PARRUCCHIERE",aliases:[],project:"Demo",state:"demo",total:39900,reported:null,issues:["Preventivo in attesa, nessun incasso confermato."] },
  { key:"anas",name:"ANAS BARBER",aliases:[],project:"Demo",state:"demo",total:39900,reported:null,issues:["Preventivo in attesa, nessun incasso confermato."] },
  { key:"gennaro",name:"GENNARO PARRUCCHIERE",aliases:[],project:null,state:"contact",total:null,reported:null,issues:["Solo contatto: nessun preventivo o vendita."] },
  { key:"luigi",name:"LUIGI GULISANO",aliases:[],project:"Landing, agenda e QR",state:"contact",total:null,reported:null,issues:["Trattativa non acquisita; importo sconosciuto."] },
] as const;
const normalize=(s:string)=>s.normalize("NFKC").trim().toLocaleLowerCase("it-IT");
export function buildFinanceImportPreview(data: AdminFinanceData, workspace: FinanceWorkspace): FinanceImportPreview {
  const rows: FinanceImportPreview["rows"]=financeImportManifest.map(row=>{
    const names=[row.name,...row.aliases].map(normalize);
    const matches=data.clients.filter(c=>[c.name,c.companyName??"",...(c.details?.aliases??[])].some(n=>names.includes(normalize(n))));
    const matched=matches.length===1?matches[0]:null;
    const linked=matched?data.projects.filter(p=>p.clientId===matched.id):[];
    const aliasesMatch=!!matched&&row.aliases.every(a=>[matched.name,matched.companyName??"",...(matched.details?.aliases??[])].some(n=>normalize(n)===normalize(a)));
    const recurringMatches=!("recurring" in row)||workspace.recurring.some(r=>r.clientId===matched?.id&&r.amountCents===row.recurring.amount&&r.startDate===row.recurring.start&&r.state===row.recurring.state);
    const quoteMatches=!("quote" in row)||linked.some(p=>p.totalAmountCents===row.quote&&p.details?.commercialState==="quote"&&!p.details.agreementConfirmed);
    const same=aliasesMatch&&recurringMatches&&quoteMatches&&(!row.project||linked.some(p=>normalize(p.name)===normalize(row.project??"") &&
      p.details?.amountKnown===(row.total!==null) && (row.total===null||p.totalAmountCents===row.total) &&
      (p.details?.reportedReceivedCents??null)===row.reported &&
      (p.details?.extraCents??0)===("extra" in row?row.extra:0) &&
      p.details?.operationalState===(row.state==="delivered"?"delivered":row.state==="working"?"working":"not_started") &&
      (row.state!=="demo"||p.details?.commercialState==="demo")));
    const possible=workspace.legacyProjects.filter(p=>normalize(p.name).split(" ").some(word=>word.length>3 && normalize(row.name).includes(word)));
    return {key:row.key,name:row.name,aliases:[...row.aliases],matchedClientId:matched?.id??null,
      action:matches.length>1?"review":matched?(same?"unchanged":"update"):possible.length?"review":"create",
      anomalies:[...row.issues,...(matches.length>1?["Più anagrafiche corrispondenti: scelta manuale obbligatoria."]:[]),
        ...possible.map(p=>`Possibile lavoro storico: ${p.name}; verificare manualmente identità e record di prova.`)],
      proposed:{...row,unit:"centesimi EUR salvo importi USD",financialTransactions:[]},
    };
  });
  rows.push(
    {key:"facebook",name:"Facebook / Instagram Ads",aliases:[],action:data.entries.some(e=>e.category==="facebook")?"review":"create",
      anomalies:["Stima riepilogativa 1.400 €: esclusa dai pagamenti verificati; verificare movimenti dettagliati."],proposed:{estimateCents:140000,financialTransactions:[]}},
    {key:"replit",name:"Replit",aliases:[],action:data.entries.some(e=>e.category==="replit")?"review":"create",
      anomalies:["Totale 2.635,97 USD ≈ 2.391,44 € indicativi; importare solo transazioni reali, non 25 pagamenti fittizi."],proposed:{originalCents:263597,currency:"USD",estimatedEuroCents:239144,financialTransactions:[]}},
    {key:"google",name:"Google Ads",aliases:[],action:"review",anomalies:["Importo da verificare, non convertito a zero."],proposed:{amountCents:null}},
  );
  return {blocked:true,rows,warnings:[
    "Nessuna scrittura eseguita. Importazione finale bloccata fino ad approvazione esplicita del dettaglio e verifica delle protezioni gestite.",
    "Le azioni descrivono proposte, non record già creati. Alias del documento espliciti; nessuna fusione per somiglianza.",
    "Incassi comunicati senza date conservati come segnalazioni da riconciliare, non come transazioni verificate.",
    "La stima arrotondata di 4.000 € non viene aggiunta. Nessuna suddivisione arbitraria dei costi generali.",
  ]};
}
