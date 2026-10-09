import existing from "./seo-pages.json" with { type: "json" };
import sectors from "./sector-config.json" with { type: "json" };
export default {
  ...existing,
  ...Object.fromEntries(["/", "/preventivo"].map((path) => [path, {
    title: "Siti web, app e gestionali su misura | PromoApp.it",
    description: "Soluzioni digitali personalizzate per imprese e attività: siti web professionali, web app, prenotazioni e gestionali. Raccontaci il tuo progetto.",
    h1: "Siti web, app e gestionali su misura per la tua attività.",
  }])),
  ...Object.fromEntries(Object.entries(sectors).map(([slug, sector]) => [`/per/${slug}`, {
    title: sector.metaTitle,
    description: sector.metaDescription,
    h1: sector.headline,
  }])),
  "/siti-web": {
    title: "Sito web professionale da 399 € + IVA | PromoApp.it",
    description: "Fai trovare la tua attività online con un sito professionale da 399 € + IVA. Inclusioni, hosting, dominio ed extra chiariti nel preventivo.",
    h1: "Il tuo sito web professionale da 399 € + IVA.",
  },
  "/sitiweb": {
    title: "Sito web professionale da 399 € + IVA | PromoApp.it",
    description: "Fai trovare la tua attività online con un sito professionale da 399 € + IVA. Inclusioni, hosting, dominio ed extra chiariti nel preventivo.",
    h1: "Il tuo sito web professionale da 399 € + IVA.",
    canonical: "/siti-web",
  },
  "/menu-digitali": {
    title: "Menu digitale QR a 99 € + IVA una tantum | PromoApp.it",
    description: "Il menu del tuo locale sullo smartphone: realizzazione base a 99 € + IVA una tantum. Hosting, aggiornamenti e assistenza da concordare a parte.",
    h1: "Il tuo menu digitale QR a soli 99 € + IVA.",
  },
  "/web-app": {
    title: "Web app e gestionali personalizzati su preventivo | PromoApp.it",
    description: "Strumenti su misura per organizzare appuntamenti, prenotazioni, clienti, ordini e lavoro quotidiano. Funzionalità e costi definiti nel preventivo.",
    h1: "Un’app su misura per organizzare meglio la tua attività.",
  },
  "/grazie": { title: "Richiesta ricevuta | PromoApp.it", description: "La tua richiesta è stata salvata. Ti ricontatteremo al numero indicato.", noindex: true },
  "/gestione-contatti": { title: "Gestione contatti | PromoApp.it", description: "Area amministrativa riservata.", noindex: true },
};
