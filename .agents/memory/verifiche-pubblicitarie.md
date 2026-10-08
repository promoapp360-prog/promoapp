---
name: Verifiche pubblicitarie
description: Limiti delle prove di preparazione delle landing al traffico Google e Meta
---

Non dichiarare pronto il tracciamento pubblicitario sulla sola base degli eventi nel browser o della risposta dell'API di configurazione.

**Why:** durante la verifica commerciale una risposta runtime vuota aveva fatto indicare Meta come mancante, mentre il Pixel era già presente nella configurazione statica. I test browser bloccano appositamente i provider per non creare conversioni pubblicitarie false.

**How to apply:** controllare la configurazione effettivamente utilizzata dal browser; distinguere evento generato una volta, invio al provider e ricezione nel relativo account. Separare anche accettazione della notifica da parte del servizio email e consegna nella casella. Una risposta duplicata con stato notifica “sent” descrive lo stato esistente, non dimostra un secondo invio.

Le verifiche commerciali possono creare richieste chiaramente TEST soltanto nel database di sviluppo e notificare il destinatario interno esistente; non devono inviare messaggi WhatsApp a clienti o pubblicare automaticamente.

**Why:** l'utente richiede il percorso reale dall'annuncio al salvataggio e alla notifica, senza comunicazioni a clienti o pubblicazione non autorizzata.

**How to apply:** identificare separatamente dati di prova, risultati simulati e verifiche reali; conservare gli altri dati e non usare transazioni di pagamento per verificare le landing.

Quando una prova browser deve simulare gli invii, bloccare tutte le richieste di scrittura prima di navigare e autorizzare soltanto le risposte simulate; non affidarsi a un singolo nome di endpoint.

**Why:** un'intercettazione con un percorso errato ha lasciato passare un invio TEST al database di sviluppo e una notifica interna reale. La rimozione del record non annulla la notifica già inviata.

**How to apply:** usare un blocco preventivo di tutte le POST e degli altri metodi di scrittura, verificando che il percorso effettivo del client sia coperto prima di compilare e inviare il modulo.

L'utente ha dichiarato che la conversione Google Ads è già configurata sulla visita alla pagina `/grazie`; mantenere quella conversione, senza crearne un'altra o inventare un'etichetta di conversione.

**Why:** l'utente richiede l'installazione del tag e il riconoscimento della pagina di ringraziamento, non una nuova azione di conversione. Un secondo evento manuale potrebbe duplicare i risultati.

**How to apply:** distinguere le visualizzazioni delle pagine dalle conversioni; verificare separatamente l'invio dal browser e il riconoscimento effettivo nell'account Google Ads.
