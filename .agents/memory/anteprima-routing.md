---
name: Anteprima e routing pubblico
description: Limiti delle riscritture statiche e separazione degli effetti esterni fra anteprima e produzione
---

Non eseguire automaticamente riconfigurazioni di webhook Stripe live o backfill durante i riavvii dell'anteprima.

**Why:** l'inizializzazione precedente riconciliava i webhook verso il dominio di sviluppo anche con operazioni live. Una correzione alle landing non deve modificare risorse di pagamento pubbliche.

**How to apply:** mantenere l'inizializzazione prevista in produzione, ma verificare gli effetti esterni prima di reintrodurla nei riavvii di sviluppo. I test locali di routing non devono importare l'avvio completo del server.

Le riscritture dei file nell'hosting statico non equivalgono a risposte HTTP 301 o 302.

**Why:** la documentazione Replit consultata per l'alias del menu indica che le riscritture mappano percorsi a file, senza un campo dedicato ai redirect HTTP.

**How to apply:** per un redirect HTTP effettivo usare il servizio server esistente e verificare anche il passaggio attraverso il router degli artifact. Per nuove landing settoriali mantenere il contenuto HTML specifico, non il fallback della homepage.
