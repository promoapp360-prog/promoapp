import existing from "./seo-pages.json" with { type: "json" };
import sectors from "./sector-config.json" with { type: "json" };
export default {
  ...existing,
  ...Object.fromEntries(["/", "/preventivo"].map((path) => [path, {
    title: "Siti web, app e gestionali a 399 € + IVA | PromoApp.it",
    description: "Siti web, web app e gestionali a 399 € + IVA di attivazione definitiva. Costi tecnici di funzionamento da 9,90 € al mese. Anteprima gratuita, senza impegno.",
    h1: "Siti web, app e gestionali per la tua attività.",
  }])),
  ...Object.fromEntries(Object.entries(sectors).map(([slug, sector]) => [`/per/${slug}`, {
    title: sector.metaTitle,
    description: sector.metaDescription,
    h1: sector.headline,
  }])),
  "/siti-web": {
    title: "Sito web professionale a 399 € + IVA | PromoApp.it",
    description: "Sito web a 399 € + IVA di attivazione definitiva. Costi tecnici di funzionamento da 9,90 € al mese, comunicati prima dell’attivazione. Anteprima gratuita.",
    h1: "Il tuo sito web professionale a 399 € + IVA.",
  },
  "/sitiweb": {
    title: "Sito web professionale a 399 € + IVA | PromoApp.it",
    description: "Sito web a 399 € + IVA di attivazione definitiva. Costi tecnici di funzionamento da 9,90 € al mese, comunicati prima dell’attivazione. Anteprima gratuita.",
    h1: "Il tuo sito web professionale a 399 € + IVA.",
    canonical: "/siti-web",
  },
  "/menu-digitali": {
    title: "Menu digitale QR a 99 € + IVA | PromoApp.it",
    description: "Menu QR a 99 € + IVA di attivazione definitiva. Costi tecnici di funzionamento da 9,90 € al mese, comunicati prima dell’attivazione. Guarda la demo.",
    h1: "Il tuo menu digitale QR a soli 99 € + IVA.",
  },
  "/web-app": {
    title: "Web app e gestionali a 399 € + IVA | PromoApp.it",
    description: "Web app e gestionali a 399 € + IVA di attivazione definitiva. Clienti, ordini e appuntamenti; costi tecnici di funzionamento da 9,90 € al mese.",
    h1: "Un’app su misura per organizzare meglio la tua attività.",
  },
  "/grazie": { title: "Richiesta ricevuta | PromoApp.it", description: "La tua richiesta è stata salvata. Ti ricontatteremo al numero indicato.", noindex: true },
  "/whatsapp": {
    title: "Parliamo del tuo progetto | PromoApp.it",
    description: "Raccontaci cosa ti serve su WhatsApp. Ti rispondiamo noi, senza moduli e senza impegno.",
    h1: "Siti, app e gestionali su misura per la tua attività.",
    noindex: true,
  },
  "/gestione-contatti": { title: "Gestione contatti | PromoApp.it", description: "Area amministrativa riservata.", noindex: true },
};
