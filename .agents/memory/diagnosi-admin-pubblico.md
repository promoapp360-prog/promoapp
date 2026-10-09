---
name: Diagnosi admin pubblico
description: Limiti delle prove disponibili quando si risolve un rifiuto della password admin pubblica senza leggere le credenziali.
---

Distinguere il secret del progetto dai Deployment secrets e non considerare un riavvio dell'anteprima una modifica del server pubblico.

**Why:** la documentazione Replit conferma che gli aggiornamenti dei Secrets del progetto non sincronizzano automaticamente la configurazione della pubblicazione.

**How to apply:** per problemi pubblici controllare i log di produzione e chiedere se il secret della pubblicazione è stato aggiornato e l'app ripubblicata; rispettare la risposta dell'utente invece di presumere che questo passaggio manchi.

Un HTTP 401 dimostra soltanto che il server ha rifiutato la credenziale ricevuta. La presenza del secret e un test positivo con credenziali fittizie non dimostrano che la password reale corrisponda al secret pubblico.

**Why:** un caso riprodotto offline, come gli spazi introdotti copiando il secret, identifica un difetto del codice ma non prova che sia la causa del singolo rifiuto pubblico.

**How to apply:** non leggere né stampare le password reali; distinguere chiaramente test sintetici riusciti, pubblicazione ancora necessaria e accesso reale non verificato.

Per le verifiche di accesso, attraversare via HTTP il router reale e tutti i controlli di autorizzazione; verificare anche una richiesta amministrativa successiva al login.

**Why:** i soli test con richieste simulate al middleware non verificano il trasporto browser/server né eventuali controlli aggiuntivi nelle rotte. Le intestazioni HTTP non accettano tutte le stringhe Unicode, mentre il corpo JSON UTF-8 sì.

**How to apply:** usare esclusivamente credenziali fittizie e dati isolati, senza avviare servizi esterni o interrogare il database reale. Non registrare password, credenziali codificate o loro impronte nei log diagnostici.
