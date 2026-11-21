import existing from "./seo-pages.json" with { type: "json" };
import sectors from "./sector-config.json" with { type: "json" };
import pageContent from "./seo-page-content.json" with { type: "json" };
export default {
  ...existing,
  ...Object.fromEntries(["/", "/preventivo"].map((path) => [path, {
    title: "Siti web e gestionali per attività | PromoApp.it",
    description: "Siti, web app e gestionali per la tua attività. Attivazione definitiva a 399 € + IVA; costi tecnici da 9,90 € al mese, comunicati prima.",
    h1: "Siti web, app e gestionali per la tua attività.",
  }])),
  "/preventivo": {
    title: "Richiedi un preventivo | PromoApp.it",
    description: "Raccontaci di cosa ha bisogno la tua attività. Ricevi una proposta gratuita e senza impegno per sito, app o gestionale.",
    h1: "Siti web, app e gestionali per la tua attività.",
    canonical: "/",
    noindex: true,
  },
  ...Object.fromEntries(Object.entries(sectors).map(([slug, sector]) => [`/per/${slug}`, {
    title: sector.metaTitle,
    description: sector.metaDescription,
    h1: sector.headline,
    faq: sector.faq,
  }])),
  "/siti-web": {
    title: "Siti web per attività locali | PromoApp.it",
    description: "Siti web per ristoranti, bar e attività locali. Design responsive e contatti chiari; costi comunicati prima dell’attivazione.",
    h1: "Il tuo sito web professionale a 399 € + IVA.",
    faq: pageContent["/siti-web"].faq,
  },
  "/sitiweb": {
    title: "Alias siti web PromoApp | PromoApp.it",
    description: "Consulta la pagina ufficiale PromoApp dedicata alla realizzazione di siti web per attività locali.",
    h1: "Il tuo sito web professionale a 399 € + IVA.",
    canonical: "/siti-web",
    noindex: true,
  },
  "/menu-digitali": {
    title: "Menu digitale QR per locali | PromoApp.it",
    description: "Menu digitale QR per ristoranti e bar, consultabile da smartphone. Attivazione a 99 € + IVA; costi tecnici comunicati prima.",
    h1: "Il tuo menu digitale QR a soli 99 € + IVA.",
    faq: pageContent["/menu-digitali"].faq,
  },
  "/menu-digitale": {
    title: "Alias menu digitale PromoApp | PromoApp.it",
    description: "Consulta la pagina ufficiale PromoApp dedicata al menu digitale QR per ristoranti e bar.",
    h1: "Il tuo menu digitale QR a soli 99 € + IVA.",
    canonical: "/menu-digitali",
    noindex: true,
  },
  "/web-app": {
    title: "Web app e piattaforme su misura | PromoApp.it",
    description: "Web app personalizzate per gestire clienti, ordini e appuntamenti. Funzioni definite nel progetto; costi tecnici comunicati prima.",
    h1: "Un’app su misura per organizzare meglio la tua attività.",
    faq: pageContent["/web-app"].faq,
    canonical: "/gestionali",
    noindex: true,
  },
  ...Object.fromEntries(["/gestionali", "/app-prenotazioni", "/siti-web-milano"].map((path) => [path, pageContent[path]])),
  "/lavori": {
    title: "Portfolio PromoApp: lavori e progetti | PromoApp.it",
    description: "Scopri siti, web app e soluzioni digitali realizzati da PromoApp per attività a Milano, Barletta e Reggio Calabria.",
    h1: "Progetti digitali realizzati da PromoApp",
    kind: "portfolio",
  },
  "/grazie": { title: "Richiesta ricevuta | PromoApp.it", description: "La tua richiesta è stata salvata. Ti ricontatteremo al numero indicato.", noindex: true },
  "/controllo-sito": {
    title: "Controllo gratuito sito web | PromoApp.it",
    description: "Richiedi una revisione manuale del sito con report chiaro entro 48 ore. Gratuito, autorizzato e senza obbligo di acquisto.",
    h1: "Controllo gratuito del sito web",
    faq: pageContent["/controllo-sito"].faq,
  },
  "/admin/controlli": { title: "Controlli siti — Admin | PromoApp", description: "Area riservata per gestire le richieste di controllo dei siti.", noindex: true },
  "/admin": { title: "Area riservata | PromoApp.it", description: "Pannello amministrativo PromoApp.", noindex: true },
  "/whatsapp": {
    title: "Parliamo del tuo progetto | PromoApp.it",
    description: "Raccontaci cosa ti serve su WhatsApp. Ti rispondiamo noi, senza moduli e senza impegno.",
    h1: "Siti, app e gestionali su misura per la tua attività.",
    noindex: true,
  },
  "/gestione-contatti": { title: "Gestione contatti | PromoApp.it", description: "Area amministrativa riservata.", noindex: true },
};
