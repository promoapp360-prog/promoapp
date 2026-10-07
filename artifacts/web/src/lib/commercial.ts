import sectors from "./sector-config.json" with { type: "json" };
import config from "./commercial-config.json" with { type: "json" };

export { sectors };
export type Sector = (typeof sectors)[keyof typeof sectors];
export const prices = config.prices;
export function commercialVariant() {
  const variants = config.experiments.variants;
  const requested = config.experiments.enabled ? config.experiments.activeVariant : "control";
  const key = requested in variants ? requested as keyof typeof variants : "control";
  return { key, ...variants[key] };
}
