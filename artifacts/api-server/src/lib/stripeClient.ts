import Stripe from "stripe";

async function fetchConnection(hostname: string, token: string, env: string) {
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", env);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": token },
  });
  const data = await response.json();
  return data.items?.[0];
}

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) throw new Error("X-Replit-Token non trovato");
  if (!hostname) throw new Error("REPLIT_CONNECTORS_HOSTNAME non trovato");

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";

  // Se siamo in produzione, proviamo prima le chiavi live, poi facciamo fallback al sandbox
  let conn = isProduction
    ? await fetchConnection(hostname, xReplitToken, "production")
    : null;

  // Fallback: usa sandbox se la connessione di produzione non è configurata
  if (!conn?.settings?.publishable || !conn?.settings?.secret) {
    conn = await fetchConnection(hostname, xReplitToken, "development");
  }

  if (!conn?.settings?.publishable || !conn?.settings?.secret) {
    throw new Error("Connessione Stripe non trovata. Configura l'integrazione Stripe.");
  }

  return {
    publishableKey: conn.settings.publishable as string,
    secretKey: conn.settings.secret as string,
  };
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}
