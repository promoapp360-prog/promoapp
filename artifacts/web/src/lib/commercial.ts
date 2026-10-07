import sectors from "./sector-config.json" with { type: "json" };
import config from "./commercial-config.json" with { type: "json" };

export { sectors };
export type Sector = (typeof sectors)[keyof typeof sectors];
export const prices = config.prices;
export const commercialTrust = config.trust;
type Settings = {
  mode: string; demoDeliveryConfirmed: boolean; demoDeliveryHours: number | null;
  whatsappResponseConfirmed: boolean; whatsappResponseHours: number | null;
};
export function commercialIncentive(settings: Settings = config.incentive) {
  const demoActive = settings.mode === "personalized_demo" && settings.demoDeliveryConfirmed &&
    typeof settings.demoDeliveryHours === "number" && settings.demoDeliveryHours > 0 && Number.isFinite(settings.demoDeliveryHours);
  const responseHours = settings.whatsappResponseHours;
  return {
    demoActive,
    cta: demoActive ? "Richiedi la demo gratuita" : "Richiedi un’anteprima gratuita",
    formCta: demoActive ? "Richiedi la demo gratuita" : "Richiedi informazioni",
    promise: demoActive ? `Demo gratuita in ${settings.demoDeliveryHours} ore, con il nome della tua attività.` :
      "Richiedi un’anteprima gratuita: un esempio illustrativo per valutare la soluzione, senza impegno.",
    responseNote: settings.whatsappResponseConfirmed && typeof responseHours === "number" && responseHours > 0 && Number.isFinite(responseHours) ?
      `Nessun vincolo. Ti rispondiamo su WhatsApp entro ${responseHours} ore.` : "Nessun vincolo. Ti contattiamo su WhatsApp.",
    confirmation: demoActive ? `La tua richiesta di demo è ricevuta. Prepariamo un esempio illustrativo con il nome della tua attività entro ${settings.demoDeliveryHours} ore.` :
      "Richiesta ricevuta! Ti contatteremo su WhatsApp.",
  };
}
export function webappStartingPrice(settings: { approved: boolean; amount: number | null } = config.webappStartingPrice) {
  return settings.approved && typeof settings.amount === "number" && Number.isFinite(settings.amount) && settings.amount > 0 ?
    `Progetti a partire da ${new Intl.NumberFormat("it-IT").format(settings.amount)} € + IVA` : null;
}
export function commercialVariant() {
  const variants = config.experiments.variants;
  const requested = config.experiments.enabled ? config.experiments.activeVariant : "control";
  const key = requested in variants ? requested as keyof typeof variants : "control";
  return { key, ...variants[key], ...(commercialIncentive().demoActive ? { cta: commercialIncentive().cta } : {}) };
}
