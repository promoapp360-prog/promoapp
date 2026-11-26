---
name: Scritture batch nel database gestito
description: Forme di INSERT parametrizzate verificate con executeSql
---

In un'importazione sul database Replit di sviluppo, `WITH ... INSERT` con `jsonb_to_recordset` e `INSERT ... SELECT FROM jsonb_to_recordset` hanno restituito entrambi `EXECUTE_SQL_COMMAND_ERROR` senza un dettaglio SQL. INSERT parametrizzati con `VALUES` hanno funzionato.

**Why:** il percorso di esecuzione può rifiutare alcune forme di scrittura batch senza esporre la causa, mentre le scritture semplici sono state accettate.

**How to apply:** per importazioni future, verificare i conteggi prima di ogni tentativo e preferire `INSERT ... VALUES` parametrizzati con `ON CONFLICT` quando le forme JSON/CTE non funzionano; dopo una scrittura, controllare che non siano rimasti inserimenti parziali.
