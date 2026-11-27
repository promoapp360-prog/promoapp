---
name: PDFKit nei bundle
description: Regola per mantenere i file di runtime di PDFKit risolvibili nei bundle e nelle suite API.
---

Esternalizzare `pdfkit` sia dal bundle del server API sia dal bundle temporaneo dei test; includere la directory `node_modules` dell’API nel percorso di risoluzione dei moduli dei test.

**Why:** il bundle CommonJS di test incorpora moduli PDF che usano percorsi relativi a file di runtime, causando errori di URL non validi prima dell’avvio dei test.

**How to apply:** se PDFKit viene usato in endpoint o test che passano da esbuild, lasciare che Node risolva il pacchetto installato invece di incorporarlo.
