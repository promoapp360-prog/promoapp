import type { sectors } from "./commercial";

// Examples of possible scope, not automatically included packages or live products.
export const sectorOfferCopy: Record<keyof typeof sectors, { website: string; webapp: string }> = {
  ristoranti: {
    website: "Presenta cucina, locale, orari e contatti per chi cerca dove mangiare.",
    webapp: "Richieste tavoli, clienti e preferenze del locale; promozioni e fidelity da definire insieme.",
  },
  "bb-hotel": {
    website: "Mostra camere, servizi, posizione e indicazioni di arrivo per i tuoi ospiti.",
    webapp: "Calendario disponibilità, richieste con date e archivio contatti degli ospiti, con conferma della struttura.",
  },
  "centri-estetici": {
    website: "Presenta trattamenti, centro e contatti per aiutare le clienti a scegliere.",
    webapp: "Agenda per operatrice e cabina, durata dei trattamenti e prenotazioni secondo le regole del centro.",
  },
  parrucchieri: {
    website: "Valorizza servizi, stile del salone e collaboratori, con contatti facili da trovare.",
    webapp: "Agenda del salone per collaboratore e servizio, rispettando durate e tempi di posa concordati.",
  },
  "studi-medici": {
    website: "Presenta professionisti, prestazioni e contatti dello studio, senza raccogliere dati clinici nel modulo pubblico.",
    webapp: "Agenda organizzativa per professionista e richieste da confermare in segreteria. Cartelle cliniche non incluse.",
  },
  palestre: {
    website: "Presenta corsi, orari, spazi e contatti della palestra per chi cerca un'attività fitness.",
    webapp: "Calendario corsi, limite posti e gestione iscritti; pacchetti lezioni e scadenze secondo le tue regole.",
  },
  negozi: {
    website: "Mostra il negozio, i prodotti e i contatti per chiedere informazioni e disponibilità.",
    webapp: "Clienti, richieste disponibilità, catalogo e magazzino: definiamo insieme le funzioni utili al tuo negozio.",
  },
  officine: {
    website: "Presenta interventi, servizi, sede e contatti dell'officina per i clienti della tua zona.",
    webapp: "Agenda dell'officina e richieste di appuntamento; schede clienti e veicoli e promemoria da concordare.",
  },
  "agenzie-immobiliari": {
    website: "Una vetrina degli immobili con schede, informazioni e contatti dell'agenzia.",
    webapp: "Richieste di visita, agenda del team e archivio contatti; filtri e flussi definiti sul tuo lavoro.",
  },
  "studi-legali": {
    website: "Presenta lo studio, i professionisti e gli ambiti di attività con informazioni e contatti chiari.",
    webapp: "Richieste di appuntamento e agenda organizzativa, con accessi e funzioni concordati per il tuo studio.",
  },
  "agenti-commercio": {
    website: "Presenta l'attività, i settori rappresentati e i contatti per nuove relazioni commerciali.",
    webapp: "Rubrica clienti, agenda visite, cataloghi e raccolta ordini su misura; integrazioni e report da valutare.",
  },
};
