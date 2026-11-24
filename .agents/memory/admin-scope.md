---
name: Perimetro del pannello admin
description: Ambito approvato del nuovo admin e dati da conservare durante le sostituzioni.
---

L’utente ha richiesto un unico pannello admin con statistiche, recensioni, contatti ricevuti e numero di visite. Ha confermato di sostituire il vecchio admin conservando i dati e i servizi del sito pubblico.

**Why:** l’utente riteneva che ci fossero «troppe back end» e ha chiesto di eliminare il vecchio admin, non il sito pubblico né il database.

**How to apply:** non reintrodurre le vecchie sezioni amministrative di progetti, clienti, acconti, sconti e gestionali senza una nuova richiesta. Conservare i relativi dati e i percorsi pubblici dei clienti. Non presentare i vecchi contatori specifici di Gestionale360 come visite dell’intero sito né inventare dati storici.

L’utente ha chiesto di contare specificamente gli accessi a `https://promoapp.it/sitiweb`, senza trattino, separatamente dalle visite dell’intero sito.

**Why:** l’utente ha indicato esplicitamente questo URL come destinazione da misurare.

**How to apply:** preservare la distinzione fra `/sitiweb` e `/siti-web` quando si cambiano routing o indirizzi canonici; un redirect che fa registrare soltanto la destinazione cancellerebbe la distinzione richiesta. Non sommare altri percorsi al contatore dedicato senza una nuova richiesta.

Nel bilancio lavori, la modalità “a rate” è selezionabile anche senza conoscere il numero delle rate. I movimenti d’incasso aperti vanno riepilogati per cliente e nel totale generale.

**Why:** l’utente ha chiarito che il conteggio delle rate è facoltativo e che gli interessa monitorare il residuo da incassare.

**How to apply:** non rendere obbligatorio il numero di rate; usa i movimenti ancora non incassati per il residuo per cliente e mantieni il totale complessivo.

Nelle schede dei lavori, mostrare prima il nome della persona o della società cliente e poi il nome del lavoro.

**Why:** l’utente ha richiesto quest’ordine per riconoscere subito a chi appartiene ogni lavoro.

**How to apply:** mettere in evidenza il cliente prima del lavoro; se sono presenti società e referente, mostrare la società come cliente e il referente come informazione secondaria.

La contabilità deve essere raggruppata per cliente: lavori e movimenti associati vanno mostrati insieme sotto quel cliente; solo le voci senza lavoro associato restano generali.

**Why:** l’utente ha chiesto esplicitamente che la contabilità sia divisa per cliente.

**How to apply:** mantenere i riepiloghi per cliente e il totale complessivo; non spostare movimenti collegati ai lavori nella lista generale.

Il bilancio complessivo deve mostrare venduto, speso, incassato e da incassare. Una nuova entrata parte già come incassata; il dettaglio testuale è facoltativo perché la voce del menu ne indica già il tipo.

**Why:** l’utente ha chiesto un riepilogo economico completo e ha segnalato la duplicazione fra voce e descrizione.

**How to apply:** lasciare distinti i totali complessivi da quelli mensili; preselezionare “già incassato” per nuove entrate e usare la categoria come descrizione predefinita senza duplicarla nell’elenco.
