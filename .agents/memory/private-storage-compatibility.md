---
name: Compatibilità dell’archiviazione privata
description: Precauzioni negli aggiornamenti del client AppStorage con autenticazione Replit
---

Prima di aggiornare la libreria di archiviazione privata, verificare sia caricamento diretto sia lettura autenticata: la riuscita del caricamento firmato non dimostra che la lettura funzioni.

**Why:** il caricamento firmato e la lettura autenticata usano percorsi diversi; il primo può riuscire anche se il secondo non è compatibile con l’ambiente.

**How to apply:** mantenere un test completo caricamento → lettura riservata → collegamento al movimento, senza modificare arbitrariamente le credenziali del template per superare un’incompatibilità di versione.
