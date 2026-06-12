# CasaFinanze

App di contabilità domestica per un **nucleo di N membri**: ogni membro ha il proprio
reddito mensile e le spese comuni vengono divise secondo un modello scelto (parti uguali,
proporzionale al reddito, pot unico). PWA mobile-first in italiano.

## Architettura

- **Client** (`client/`) — Angular 21 (standalone, signals), PWA con service worker.
  Dark mode (Sistema/Chiaro/Scuro), swipe per cambiare mese.
- **Backend** (`backend/CasaFinanze.Api/`) — .NET 10 Web API, EF Core + SQLite, auth JWT.
  Multi-tenant per `HouseholdId`; i membri di un nucleo sono gli utenti che vi accedono
  (registrazione o unione tramite **codice casa**), ciascuno con il proprio `MonthlyIncome`.

Schermate: Panoramica, Movimenti, Uscite (ricorrenti/programmate), Previsione, Grafici, Impostazioni.

## Sviluppo locale

Backend (richiede una chiave JWT per lo sviluppo):

```bash
cd backend/CasaFinanze.Api
# imposta Jwt__Key (min 32 caratteri) via env o appsettings.Development.json
dotnet run --urls "http://localhost:5080"
```

Client (il proxy inoltra `/api` al backend locale):

```bash
cd client
npm ci
npx ng serve --proxy-config proxy.conf.json   # http://localhost:4200
```

Test: `cd client && npx ng test --watch=false`.

## Deploy (Azure, via GitHub Actions)

Due ambienti, pubblicati automaticamente al push:

| Branch    | Frontend (Static Web Apps) | Backend (App Service)            |
|-----------|----------------------------|----------------------------------|
| `develop` | ambiente **TEST**          | `bennaloz-home-finances-test`    |
| `main`    | **PRODUZIONE**             | `bennaloz-home-finances`         |

Le migration EF vengono applicate allo startup del backend. Workflow in `.github/workflows/`.

## Versionamento

SemVer automatico via **release-please** + **Conventional Commits** (versione condivisa
tra client e backend). Flusso: feature branch → PR **squash** su `develop` (titolo conventional)
→ PR `develop` → `main` (**merge commit**) → release-please apre la Release PR (bump + CHANGELOG)
→ al merge crea il tag `vX.Y.Z` e la GitHub Release.
