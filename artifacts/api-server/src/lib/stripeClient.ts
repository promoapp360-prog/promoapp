import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

// Module-level webhook secret — set during server startup via setWebhookSecret()
let _webhookSecret: string = "";

export function setWebhookSecret(secret: string): void {
  _webhookSecret = secret;
}

export function getWebhookSecret(): string {
  return _webhookSecret;
}

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  // Priorità 1: variabili d'ambiente esplicite (chiavi live o test inserite manualmente)
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  // Priorità 2: Replit connector (sandbox automatico)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error("Chiavi Stripe non configurate. Imposta STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY nei secrets.");
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
    signal: AbortSignal.timeout(10_000),
  });

  const data = await response.json();
  const settings = data.items?.[0]?.settings;

  if (!settings?.publishable || !settings?.secret) {
    throw new Error(
      `Stripe ${targetEnvironment} connection non trovata. Collega Stripe dalla tab Integrations.`
    );
  }

  return {
    publishableKey: settings.publishable as string,
    secretKey: settings.secret as string,
  };
}

// WARNING: Never cache this client — tokens expire
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

// StripeSync singleton for webhook management and data sync
let stripeSync: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
