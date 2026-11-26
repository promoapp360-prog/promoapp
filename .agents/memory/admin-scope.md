---
name: Perimetro del pannello admin
description: Ambito approvato del nuovo admin e dati da conservare durante le sostituzioni.
---

Il lato gestionale interno e il lato sito pubblico sono due cose completamente separate.

**Why:** l’utente ha ribadito esplicitamente questa separazione dopo una proposta di consolidamento degli archivi.

**How to apply:** mantenere anagrafiche, lavori, pagamenti, contatti e dati contabili del gestionale separati dalle tabelle del sito pubblico. Non mostrare nel gestionale i record del sito e non collegarli o importarli; qualsiasi trasferimento tra i due ambiti richiede una richiesta esplicita.

L’utente ha richiesto un unico pannello admin per le statistiche, le recensioni, i contatti ricevuti e le visite del sito. La contabilità PromoApp deve restare funzionalmente separata dal sito e dal suo archivio.

**Why:** l’utente riteneva che ci fossero «troppe back end» e ha chiesto di eliminare il vecchio admin, non il sito pubblico né il database.

**How to apply:** non reintrodurre le vecchie sezioni amministrative separate senza una nuova richiesta. La sezione Controllo Economico può stare nello stesso pannello admin, ma deve usare solo anagrafiche e movimenti del gestionale; preservare dati e accessi pubblici senza riutilizzarli come dati contabili. Non presentare i vecchi contatori specifici di Gestionale360 come visite dell’intero sito né inventare dati storici.

L’utente ha chiesto di contare specificamente gli accessi a `https://promoapp.it/sitiweb`, senza trattino, separatamente dalle visite dell’intero sito.

**Why:** l’utente ha indicato esplicitamente questo URL come destinazione da misurare.

**How to apply:** preservare la distinzione fra `/sitiweb` e `/siti-web` quando si cambiano routing o indirizzi canonici; un redirect che fa registrare soltanto la destinazione cancellerebbe la distinzione richiesta. Non sommare altri percorsi al contatore dedicato senza una nuova richiesta.

Nel bilancio lavori, la modalità “a rate” è selezionabile anche senza conoscere il numero delle rate. Il successivo piano approvato di controllo economico richiede che il credito contrattuale non dipenda dall’inserimento delle scadenze.

**Why:** l’utente vuole monitorare il residuo effettivo anche senza un piano rate completo, distinguendolo da canoni, proposte commerciali e importi da verificare.

**How to apply:** non rendere obbligatorio il numero di rate; riepiloga il residuo dell’accordo confermato per cliente senza sommare nuovamente le scadenze. Gli incassi comunicati ma non documentati restano distinti dalle transazioni riconciliate. L’approvazione del piano non autorizza l’importazione definitiva dei riepiloghi.

Nelle schede dei lavori, mostrare prima il nome della persona o della società cliente e poi il nome del lavoro.

**Why:** l’utente ha richiesto quest’ordine per riconoscere subito a chi appartiene ogni lavoro.

**How to apply:** mettere in evidenza il cliente prima del lavoro; se sono presenti società e referente, mostrare la società come cliente e il referente come informazione secondaria.

La contabilità deve essere raggruppata per cliente: lavori e movimenti associati vanno mostrati insieme sotto quel cliente; solo le voci senza lavoro associato restano generali.

**Why:** l’utente ha chiesto esplicitamente che la contabilità sia divisa per cliente.

**How to apply:** mantenere i riepiloghi per cliente e il totale complessivo; non spostare movimenti collegati ai lavori nella lista generale.

Il bilancio complessivo deve mostrare venduto, speso, incassato e da incassare. Una nuova entrata parte già come incassata; il dettaglio testuale è facoltativo perché la voce del menu ne indica già il tipo.

**Why:** l’utente ha chiesto un riepilogo economico completo e ha segnalato la duplicazione fra voce e descrizione.

**How to apply:** lasciare distinti i totali complessivi da quelli mensili; preselezionare “già incassato” per nuove entrate e usare la categoria come descrizione predefinita senza duplicarla nell’elenco.
