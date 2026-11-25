# Controllo Economico PromoApp

## Perimetro

Il modulo amplia `/admin?tab=finance`, usa l’accesso amministratore esistente con sessione e protezione CSRF e conserva Poppins e la navigazione pubblica. Non aggiunge un CRM né un database.

`clienti` rimane l’anagrafica autorevole. La precedente tabella `admin_finance_clients`, verificata vuota in produzione all’inizio del lavoro, è conservata senza alimentarla. Se contiene record, il pannello segnala la necessità di collegamento manuale: nessun accorpamento per somiglianza.

I lavori pubblici sono mostrati subito attraverso i loro identificativi originali. Il salvataggio dei dati economici aggiunge un profilo univoco collegato al lavoro, senza riscrivere password, URL, descrizioni o voci pubbliche. I contatti commerciali e le richieste gestionali si collegano esplicitamente dalla scheda cliente.

## Regole economiche

- Prezzo sconosciuto: `amountKnown=false`, visualizzato “da definire”, escluso da venduto e crediti.
- Venduto: solo accordi confermati con importo noto e data accordo, più extra esplicitamente concordati.
- Incassi e spese verificati: pagamento avvenuto, importo confermato e riconciliazione esplicita. Le segnalazioni riepilogative non sono transazioni.
- Residuo: prezzo base + extra − incassi contrattuali riconciliati, mai inferiore a zero. Le scadenze non aumentano questo credito. Un residuo confermato separatamente può limitarlo, con note obbligatorie.
- “Residuo da verificare” esclude il progetto da crediti esigibili e solleciti.
- I canoni non riducono il residuo del lavoro; scadenze dei canoni e relativi incassi sono separati.
- Pagamenti storici: collegamento univoco all’acconto originale, importo e data effettivi conservati. Le vecchie voci lavoro e `accontoVersato` sono in euro; gli acconti sono in centesimi. Le vecchie somme non sono duplicate come incassi.
- Valute USD/EUR: importo originale, cambio e addebito euro espliciti. Cambiare il cambio non modifica l’importo euro confermato. Le rettifiche manuali restano tracciate.
- L’annullamento conserva il movimento, prima/dopo e autore amministratore; esiste un ripristino esplicito. Non modifica banche, Stripe o PayPal.
- La classificazione R&S è gestionale e non certifica ammissibilità fiscale.

## Ricorrenze e solleciti

Canoni e costi hanno decorrenza, frequenza, prossima scadenza e stato attivo/potenziale/sospeso. La generazione è esplicita, controllata sulla scadenza attesa e idempotente: richieste ripetute per la medesima data non creano doppioni. Ogni movimento generato parte non pagato. Sospensione e variazioni non riscrivono le mensilità precedenti.

I solleciti sono bozze manuali per scadenze superate e crediti confermati, limitate al residuo. Nessun messaggio è inviato automaticamente.

## Analisi e importazioni

La dashboard permette mese, trimestre, anno, intervallo personalizzato, cliente, progetto e categoria movimenti, con confronto tra intervalli. Venduto per data accordo; cassa per data effettiva. Crediti e potenziale sono consistenze attuali. Margini commerciali diretti e dopo costi generali sono separati, senza allocazioni arbitrarie.

L’acquisizione considera soltanto date e provenienze dichiarate. Il costo di acquisizione attribuito utilizza esclusivamente pubblicità collegata ai clienti di origine nota: non è una stima dei costi pubblicitari generali.

Il documento allegato produce un confronto non modificante di 17 soggetti e 3 riepiloghi di spesa, con alias espliciti, possibili corrispondenze e anomalie. Non crea un cliente per l’ordinante dell’extra, non somma la stima di 4.000 € e non inventa transazioni Replit o i 50 € da riconciliare.

Il confronto CSV di transazioni reali accetta fino a 500 righe, segnala riferimenti ripetuti, importi e date mancanti, valuta e possibili movimenti esistenti. Anche questa anteprima non scrive dati. Il comando di importazione finale risponde sempre “bloccato”: l’approvazione dello sviluppo non costituisce autorizzazione all’importazione; servirà una successiva autorizzazione esplicita del dettaglio e verifica delle protezioni gestite.

CSV ed Excel esportano l’intero prospetto e lo storico completo, con protezione dalle formule nei dati testuali. Gli allegati sono privati in AppStorage; il database conserva il solo percorso. Non vengono prodotti dump o tabelle di backup.

## Schema e ambienti

Lo schema è descritto in Drizzle. La configurazione di sviluppo limitata alle tabelle interessate evita proposte di rinomina di tabelle estranee non modellate. Il post-merge applica solo questo percorso di sviluppo. Nessun DDL contabile viene eseguito all’avvio.

La produzione non è stata modificata né pubblicata. La lettura iniziale ha confermato 2 clienti, 6 lavori e le tre precedenti tabelle contabili vuote; ciò non identifica automaticamente i clienti segnalati come mancanti. I dati di sviluppo sono distinti da quelli pubblici e non devono sostituirli.

## Verifiche

```sh
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/web run typecheck
pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/tests/finance-economic.test.ts
pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/tests/admin-finance.test.ts ../artifacts/api-server/tests/admin-panel.test.ts ../artifacts/api-server/tests/admin-data-sql.test.ts ../artifacts/api-server/tests/site-controls.test.ts ../artifacts/api-server/tests/reviews.test.ts
```

Le prove economiche utilizzano dati sintetici nel solo sviluppo e li eliminano alla fine. Coprono salvataggio e rilettura, residui, permessi, riconciliazione, ricorrenze, ripetizione delle anteprime, annullamento/ripristino, export e caricamento/lettura/collegamento degli allegati. La verifica visiva mobile raggiunge l’accesso, non la schermata amministrativa autenticata.

Il controllo TypeScript generale del server presenta errori preesistenti in `stripeClient.ts`, `acconto.ts` e `checkout.ts`: non sono stati aggirati disattivando controlli o modificando i pagamenti fuori perimetro.
