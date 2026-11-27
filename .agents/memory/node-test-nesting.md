---
name: Annidamento dei test Node
description: Evitare un sottotest aggiunto dentro un sottotest già in esecuzione nella suite economica
---

Non aggiungere `t.test()` dentro un callback che è già il callback di un altro sottotest della suite Node: in questo progetto il callback interno non è partito e il test è rimasto in attesa. Inserire le verifiche nello stesso callback o come sottotesti fratelli.

**Why:** l’esecuzione di un sottotest annidato nel test di contabilità si è bloccata senza avviare il callback interno.

**How to apply:** quando si estende `finance-economic.test.ts`, mantenere i nuovi casi al livello di annidamento già usato dalla suite e verificare che il callback venga effettivamente avviato.
