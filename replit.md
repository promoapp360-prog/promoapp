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

- `artifacts/web` — Landing page pubblica (`/`, `/checkout`, `/admin`, `/registrazione`, `/gestionale360`, `/sito-web`)
- `artifacts/api-server` — Express API (Stripe, sconti, contatti, admin, richieste-gestionale)
- `artifacts/mockup-sandbox` — Sandbox componenti (canvas)

## Pagina Gestionale360 (`/gestionale360`)

Pagina dedicata al prodotto Gestionale360 — target: negozi, ferramenta, ricambi auto, alimentari, elettronica, pet shop, piccoli retail.
Sezioni: Hero → Settori target → Web App vs Desktop (scelta esclusiva) → 8 funzionalità → 3 passi → Prezzo 199€ → FAQ → CTA finale.
CTA apre `RichiestaGestionaleModal` (tipo `gestionale360`).

**Nota importante modale Web App vs Desktop**: le due modalità si escludono a vicenda. Non è possibile usarle entrambe.

## Carrello & Auth (Clerk)

- **Clerk**: autenticazione via `@clerk/react` (web) + `@clerk/express` (API). Secrets: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.
- **Cart flow**: `src/lib/CartContext.tsx` (localStorage, singolo item) → `CartDrawer.tsx` (pannello laterale) → se non loggato `/registrazione?piano=X`, se loggato `/checkout?piano=X`.
- **Registrazione** (`src/pages/Registrazione.tsx`): step machine scelta → accedi|registrati (Clerk SignIn/SignUp con `routing="hash"`) → dati fatturazione. Dati salvati in `sessionStorage("cliente_dati")` prima di navigare al checkout.
- **Checkout**: legge `sessionStorage("cliente_dati")` per pre-compilare nome/email.
- **ClerkProvider**: in `main.tsx` con `@refresh reset` e root persistente (`__reactRoot`) per evitare doppia inizializzazione HMR.

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
6. **Lavori Svolti** (`components/LavoriSvolti.tsx`) — Portfolio con 20 mockup di app finte (cornice telefono CSS) per attività italiane di vari settori. 4 template di contenuto (booking/menu/catalog/services).
7. **Demo Settori** — 12 categorie (medici, estetici, parrucchieri, negozi, ristoranti, palestre, autorimesse, centri servizi, legali, immobiliari, agenti, altro)
8. **Prezzi** — Banner promo "6 mesi paghi, 6 GRATIS" + 3 piani:
   - **Base** 690€ una tantum + 19€/mese (gestionale, magazzino, shop)
   - **Business Pro** 890€ una tantum + 29€/mese (integrazioni, pagamenti, statistiche)
   - **Personalizzata** — Preventivo (link al form)
9. **Form Contatti** — "Richiedi un Preventivo" con 12 settori
10. **Banner test** giallo (rimuovere prima di andare live)
11. **Footer** — Sophia 2005 S.r.l. · P.IVA 08223951008 · social FB/IG

## Convenzioni importanti

- **Sempre rispondere in italiano** quando si lavora su questo progetto.
- **Prezzi piani** sono duplicati in 2 posti: `artifacts/web/src/pages/Checkout.tsx` (PIANI array, in €) e `artifacts/api-server/src/routes/checkout.ts` (PIANI record, in centesimi). Aggiornare entrambi insieme.
- **Immagini sezioni**: tutte usano contenitore fisso `max-w-[260px] md:max-w-xs h-[380px] md:h-[420px]` con `object-contain` per uniformità.
- **WhatsApp button**: numero `+393793602035`, z-index `z-[10001]` (sopra cookie banner).
- **Demo live**: link a `https://promo-app.replit.app/prova-gratis`.
- **Admin**: `/admin` (password `Mamma080245.`) per gestire contatti, sconti, pagamenti.
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
