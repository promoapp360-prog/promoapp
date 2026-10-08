---
name: Validazione interi nullable generati
description: Limite del generatore OpenAPI/Zod per numeri interi nullable e controlli monetari
---

Non assumere che un campo OpenAPI con `type: ["integer", "null"]` produca un validatore Zod che rifiuta numeri frazionari. Dichiarare anche `multipleOf: 1` e verificarne la traduzione nel validatore.

**Why:** il generatore utilizzato ha prodotto un semplice numero con min/max per importi nullable, accettando 1,5 centesimi pur con contratto dichiarato intero. La verifica HTTP isolata ha individuato il problema.

**How to apply:** per importi memorizzati in centesimi e altri interi nullable, mantenere la regola nel contratto, rigenerare e testare direttamente il rifiuto di decimali, stringhe numeriche, negativi e valori fuori limite.
