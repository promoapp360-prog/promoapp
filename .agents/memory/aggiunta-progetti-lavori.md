---
name: Aggiunta progetti lavori
description: Procedura per creare un progetto cliente nel sistema proxy /lavori/:id (es. Facciamo, nixmilano)
---

# Aggiunta di un progetto "Lavori in corso"

**Regola**: il progetto va creato in DUE database separati — dev e produzione — altrimenti non appare sul sito live.

**Why:** dev e prod hanno DB separati. Una creazione solo in dev non è visibile su www.promoapp.it.

**How to apply:** ogni volta che l'utente chiede di aggiungere un nuovo progetto cliente, eseguire entrambi i passi sotto nello stesso turno.

---

## Passo 1 — Dev (via API locale)

```bash
curl -s -X POST http://localhost:80/api/admin/progetti \
  -H "Content-Type: application/json" \
  -H "x-admin-password: Mamma080245." \
  -d '{
    "nome": "SLUG",
    "url": "https://PROGETTO.replit.app",
    "password": "PASSWORD",
    "scheda": { "url": "https://PROGETTO.replit.app" }
  }'
```

## Passo 2 — Produzione (via API pubblica)

```bash
curl -s -X POST https://www.promoapp.it/api/admin/progetti \
  -H "Content-Type: application/json" \
  -H "x-admin-password: Mamma080245." \
  -d '{
    "nome": "SLUG",
    "url": "https://PROGETTO.replit.app",
    "password": "PASSWORD",
    "scheda": { "url": "https://PROGETTO.replit.app" }
  }'
```

## Note critiche

- `x-admin-password` header obbligatorio — senza dà 401 "Non autorizzato"
- `scheda.url` deve essere uguale a `url` — serve al proxy per il redirect
- `url` senza slash finale
- Il DB di produzione non è modificabile direttamente con executeSql (read-only) — usare sempre l'API https://www.promoapp.it
- La risposta include l'`id` UUID che diventa il path proxy: `/api/proxy/{id}/`
- Per dati applicativi da trasferire in produzione, non usare l'opzione Publish "sovrascrivi dati" se il DB live contiene altri dati: usare un endpoint API admin idempotente o una procedura equivalente.

## Progetti esistenti (riferimento)

| nome | url | password | id dev | id prod |
|---|---|---|---|---|
| Facciamo | https://web-app-facciamo.replit.app | Sergio | c5938a69-37d7-4d27-a1f9-877df3411de4 | a2a9f973-eeb3-4c92-a332-400e96559c93 |
| nixmilano | https://nyx-milano-club.replit.app | angelo | 1bb87c5f-4c75-451a-b10e-36ac3dabf0fb | 2b277a9d-f2ba-44bc-8912-60398b4cf6f3 |
| NYX MILANO | https://nyx-milano-club.replit.app | angeloi | 8e6117bd-2f13-42db-80a8-50c7bdbaf648 | f9de2b94-b3ff-47e4-ba4d-9c42b948dc94 |
| NYX MILANO Staff | https://nyx-milano-club.replit.app/admin | angelostaff | 45fa9db1-ae48-450a-bd3d-c6e037480f24 | c9e43956-1858-4343-9e33-e2ca01520c72 |

## Sub-path nei target URL

Il proxy supporta URL con sotto-path (es. `/admin`). La logica:
- Il target viene separato in `origin` + `subPath`
- `pathRewrite` usa `subPath` solo per la richiesta root (es. `/api/proxy/{id}/` → `/admin`)
- Le risorse (JS/CSS/immagini) vengono servite dall'origin senza prefisso (`/assets/x.js`)
- Lo shim iniettato fa `replaceState` al `subPath` così React Router vede `/admin` non `/`
