# Stato refactor CasaFinanze (.NET + Angular) — handoff

> **Documento storico.** Il refactor è **concluso e in produzione**: `main` è l'app
> .NET + Angular su Azure (la vecchia app vanilla e GitHub Pages non sono più attivi).
> Per lo stato attuale (architettura, sviluppo locale, deploy, versionamento) vedi il
> [README](README.md). Evoluzioni successive: versionamento release-please (v1.0.0+),
> dark mode (v1.1.0), nucleo multi-membro al posto del cablaggio Riccardo/Valentina (v1.2.0),
> swipe cambio mese. Quanto segue è la cronistoria del refactor iniziale.

## Dove siamo arrivati

| Fase | Stato |
|------|-------|
| P0 Skeleton (branch, scaffold) | ✅ |
| P1 Backend .NET 10 (EF Core/SQLite, JWT, household, CRUD) | ✅ |
| P2 Client Angular (login + 6 schermate, DataStore, logica portata + test) | ✅ |
| P3 PWA (manifest, service worker, icone, meta iOS) | ✅ |
| P4 Import dati vecchi | ❌ scartato (non serve) |
| P5 Deploy GitHub Actions → Azure | ✅ DONE (2026-06-11) |

## Deploy — stato finale

**Backend → Azure App Service `bennaloz-home-finances`** ✅
- `https://bennaloz-home-finances.azurewebsites.net`, workflow `.github/workflows/azure-backend.yml` (OIDC).
- App Settings: `Jwt__Key`, `Cors__AllowedOrigins__0 = https://red-ocean-0d5d13003.7.azurestaticapps.net` (senza slash finale!).

**Frontend → Azure Static Web App `bennaloz-home-finances`** ✅
- **Hostname: `https://red-ocean-0d5d13003.7.azurestaticapps.net`** (ricreata il 2026-06-11, il vecchio host black-tree non esiste più).
- Provider **None**: NON collegata a GitHub. Deploy solo via deployment token, sia da CI sia in locale con `npx @azure/static-web-apps-cli deploy <dist> --env production --deployment-token <token>`.
- Workflow: `.github/workflows/azure-swa.yml`, secret **`AZURE_STATIC_WEB_APPS_API_TOKEN`** (token: `az staticwebapp secrets list -n bennaloz-home-finances -g rg-home-finance --query properties.apiKey -o tsv`).
- Verificato end-to-end: sito servito, preflight CORS ok, `POST /api/auth/register` dal nuovo dominio restituisce il token.

### Storia del bug (per memoria)
La prima SWA (`black-tree-08b383303`) era **corrotta lato servizio**: il deployment token — anche appena rigenerato — veniva rifiutato con *"No matching Static Web App was found or the api key was invalid"*, e `reset-api-key` via CLI dava Bad Request. L'errore "different branch" in CI era un sintomo della stessa risorsa rotta, non un vero problema di branch/OIDC/secret. Fix: delete + create di una SWA pulita **senza** collegamento GitHub.

## Note utili
- `az` su questo PC: `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd` (non in PATH delle shell già aperte). Login già fatto (subscription personale `bennaloz_subscription`).
- `gh` NON è installato su questo PC (i log delle Actions non sono leggibili via API senza auth).
- Risorse: Resource Group **`rg-home-finance`**, subscription personale free, West Europe, SKU Free.
- Sviluppo locale: `dotnet run` in `backend/CasaFinanze.Api` + `npx ng serve` in `client/` (proxy `/api` → :5080).
- Account di test creato in produzione: `smoke-test-deploy@example.com` (da eliminare se dà fastidio).
