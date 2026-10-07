import app from "./app";
import { logger } from "./lib/logger";
import { setWebhookSecret } from "./lib/stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL non impostato — Stripe init saltato");
    return;
  }

  try {
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({
      databaseUrl,
      logger: {
        info: (msg: string) => logger.info(msg),
        error: (msg: string, err?: unknown) => logger.error({ err }, msg),
        warn: (msg: string) => logger.warn(msg),
      },
    });
    logger.info("Stripe schema pronto");

    const { getStripeSync } = await import("./lib/stripeClient");
    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : null;

    if (domain) {
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `${domain}/api/stripe/webhook`
      );
      // stripe-replit-sync returns the webhook signing secret
      const webhookSecret =
        (webhookResult as any)?.webhookSecret ??
        (webhookResult as any)?.secret ??
        (webhookResult as any)?.signing_secret ??
        "";
      if (webhookSecret) {
        setWebhookSecret(webhookSecret);
        logger.info("Stripe webhook secret configurato");
      } else {
        logger.warn({ webhookResult }, "Stripe webhook secret non trovato nel risultato");
      }
    } else {
      logger.warn("REPLIT_DOMAINS non impostato — webhook Stripe non configurato");
    }

    stripeSync.syncBackfill().catch((err) =>
      logger.error({ err }, "Stripe syncBackfill fallito (non critico)")
    );

    logger.info("Stripe inizializzato con successo");
  } catch (err) {
    logger.error({ err }, "Stripe init fallito (non critico — il server parte comunque)");
  }
}

// Preview restarts must not reconfigure LIVE Stripe webhooks or run backfills.
// Payment endpoints stay available; production keeps its existing initialization.
if (process.env.NODE_ENV === "production") await initStripe();
else logger.info("Anteprima: inizializzazione automatica Stripe non eseguita");

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
