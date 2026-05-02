# PromoApp.it Workspace

pnpm workspace monorepo per il sito **PromoApp.it** — landing page italiana di **Sophia 2005 S.r.l.** (P.IVA 08223951008) per la vendita di App e gestionali personalizzati a qualunque attività italiana.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24 · **TypeScript**: 5.9 · **Package manager**: pnpm
- **Frontend**: React + Vite, Tailwind via CDN, FontAwesome 6.5.2, wouter (routing)
- **API**: Express 5 su porta 8080 (path `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (da OpenAPI spec)
- **Build**: esbuild
- **Pagamenti**: Stripe (sandbox connesso via integrazione Replit)
- **Email**: Resend (`RESEND_API_KEY` in secrets)

## Artifacts

- `artifacts/web` — Landing page pubblica (`/`, `/checkout`, `/admin`)
- `artifacts/api-server` — Express API (Stripe, sconti, contatti, admin)
- `artifacts/mockup-sandbox` — Sandbox componenti (canvas)

## Struttura della landing page

Ordine sezioni in `artifacts/web/src/App.tsx`:

1. **Nav** + **Hero** — "Realizziamo l'App che la tua attività merita"; CTA principale "Raccontaci la tua idea — la realizziamo" + link demo live
2. **Sezione Flyer** (`promo-app-flyer.png`) — "Una sola App. Tutte le funzioni che ti servono"
3. **Sezione Mockup medici** (`promo-app-mockup.png`) — "Clienti, appuntamenti e messaggi"
4. **Come funziona in 3 passi**:
   1. Raccontaci la tua idea (form / WhatsApp)
   2. Ti prepariamo il progetto in PDF + dashboard di anteprima (gratis)
   3. 7 giorni per accettare, paghi e parti
5. **Sezione Gestionale** (`promo-app-gestionale.png`) — gestionale multi-device, immagine a destra
6. **Demo Settori** — 12 categorie (medici, estetici, parrucchieri, negozi, ristoranti, palestre, autorimesse, centri servizi, legali, immobiliari, agenti, altro)
7. **Prezzi** — Banner promo "6 mesi paghi, 6 GRATIS" + 3 piani:
   - **Base** 690€ una tantum + 19€/mese (gestionale, magazzino, shop)
   - **Business Pro** 890€ una tantum + 29€/mese (integrazioni, pagamenti, statistiche)
   - **Personalizzata** — Preventivo (link al form)
8. **Form Contatti** — "Richiedi un Preventivo" con 12 settori
9. **Banner test** giallo (rimuovere prima di andare live)
10. **Footer** — Sophia 2005 S.r.l. · P.IVA 08223951008 · social FB/IG

## Convenzioni importanti

- **Sempre rispondere in italiano** quando si lavora su questo progetto.
- **Prezzi piani** sono duplicati in 2 posti: `artifacts/web/src/pages/Checkout.tsx` (PIANI array, in €) e `artifacts/api-server/src/routes/checkout.ts` (PIANI record, in centesimi). Aggiornare entrambi insieme.
- **Immagini sezioni**: tutte usano contenitore fisso `max-w-[260px] md:max-w-xs h-[380px] md:h-[420px]` con `object-contain` per uniformità.
- **WhatsApp button**: numero `+393793602035`, z-index `z-[10001]` (sopra cookie banner).
- **Demo live**: link a `https://promo-app.replit.app/prova-gratis`.
- **Admin**: `/admin` (password `promoapp2025`) per gestire contatti, sconti, pagamenti.
- **Pagine legali**: `public/privacy.html` e `public/cookie.html` con dati Sophia 2005 S.r.l.
- **Social**: Facebook `profile.php?id=61568000249468`, Instagram `promoapp.it`.

## TODO prima di andare live

- Sostituire IBAN placeholder in `artifacts/api-server/src/routes/checkout.ts` (riga ~144)
- Rimuovere il banner giallo "pagina di test" in `App.tsx`
- Configurare dominio definitivo `promoapp.it`

## Comandi utili

- `pnpm run typecheck` — typecheck completo
- `pnpm --filter @workspace/api-spec run codegen` — rigenera hook React Query e schemi Zod
- `pnpm --filter @workspace/db run push` — push schema DB (solo dev)

Vedi la skill `pnpm-workspace` per dettagli su struttura, TypeScript e package management.
