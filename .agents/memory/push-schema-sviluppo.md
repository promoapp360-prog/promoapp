---
name: Push schema di sviluppo
description: Aggiornamenti Drizzle al database di sviluppo senza rinominare tabelle esistenti
---

Quando si aggiunge una tabella al database di sviluppo, limitare il push alla tabella prevista se Drizzle segnala una tabella non modellata come possibile origine di un rename. Verificare che la tabella richiesta sia stata creata e che le tabelle preesistenti siano ancora presenti.

**Why:** il database di sviluppo contiene `app_settings`, non inclusa nello schema Drizzle; un push non filtrato l’ha proposta come candidata al rename della nuova tabella.

**How to apply:** usare `drizzle-kit push` con schema e `tablesFilter` limitati alla nuova tabella. Non approvare un rename di `app_settings` per risolvere un’aggiunta di schema.
