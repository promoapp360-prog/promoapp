---
name: Validazione interi nullable generati
description: Limite del generatore OpenAPI/Zod per numeri interi nullable e controlli monetari
---

Non assumere che un campo OpenAPI con `type: ["integer", "null"]` produca un validatore Zod che rifiuta numeri frazionari. Dichiarare anche `multipleOf: 1` e verificarne la traduzione nel validatore. Evitare `multipleOf` per quantità decimali o valori enum se Orval lo traduce in `.multipleOf()` non supportato dal tipo Zod generato.

**Why:** il generatore utilizzato ha prodotto un semplice numero con min/max per importi nullable, accettando 1,5 centesimi pur con contratto dichiarato intero. In altri schemi ha emesso `.multipleOf()` non compatibile con i tipi Zod v3.

**How to apply:** per importi memorizzati in centesimi e altri interi nullable, mantenere la regola nel contratto, rigenerare e testare direttamente il rifiuto di decimali, stringhe numeriche, negativi e valori fuori limite. Per precisioni decimali, validare la precisione nel server invece di aggiungere `multipleOf` senza controllare codegen e typecheck.
