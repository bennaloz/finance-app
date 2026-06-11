# Stato refactor CasaFinanze (.NET + Angular) — handoff

Branch: **`refactor/dotnet-angular`** (la vecchia app vanilla resta su `main` + GitHub Pages, intatta).
Ultimo commit al momento dell'interruzione: `9e158ab`.

## Dove siamo arrivati

| Fase | Stato |
|------|-------|
| P0 Skeleton (branch, scaffold) | ✅ |
| P1 Backend .NET 10 (EF Core/SQLite, JWT, household, CRUD) | ✅ |
| P2 Client Angular (login + 6 schermate, DataStore, logica portata + test) | ✅ |
| P3 PWA (manifest, service worker, icone, meta iOS) | ✅ |
| P4 Import dati vecchi | ❌ scartato (non serve) |
| P5 Deploy GitHub Actions → Azure | 🟡 quasi: backend OK, frontend in debug |

## Deploy — situazione attuale

**Backend → Azure App Service `bennaloz-home-finances`** ✅ FUNZIONA
- Workflow: `.github/workflows/azure-backend.yml` (OIDC, build di `backend/CasaFinanze.Api`).
- Testato: `POST /api/auth/register` su `https://bennaloz-home-finances.azurewebsites.net` **restituisce il token**.
- App Settings impostate sull'App Service (con `__`, non `:`): `Jwt__Key`, `Cors__AllowedOrigins__0`, runtime .NET 10 Linux.

**Frontend → Azure Static Web App `bennaloz-home-finances` (host `black-tree-08b383303.7.azurestaticapps.net`)** 🟡 IN DEBUG
- Workflow: `.github/workflows/azure-static-web-apps-black-tree-08b383303.yml` (builda Angular in `client/`, inietta `apiBaseUrl`, deploya la dist con `skip_app_build`).
- La build Angular passa; **falliva** il deploy con `BadRequest: "The GitHub action was run in a different branch than the one that the build is requested for"`.
- Verificato via `az`: la SWA ha `branch = refactor/dotnet-angular`, repo giusto, è l'unica SWA, SKU Free. Il secret `AZURE_STATIC_WEB_APPS_API_TOKEN_BLACK_TREE_08B383303` esiste col nome giusto ed è stato riallineato al token corrente → **non era il token**.
- **Ultima mossa (commit `9e158ab`, da verificare):** rimosso lo step OIDC `github_id_token` → deploy con il **solo deployment token** (modalità classica), che non fa la validazione di branch via OIDC.

## DA FARE quando riprendi (in ordine)

1. **Controlla l'ultimo run della workflow SWA** (Actions → "Azure Static Web Apps CI/CD", commit `9e158ab`):
   - ✅ se verde → apri `https://black-tree-08b383303.7.azurestaticapps.net`, **registra un account** dalla login: se funziona, frontend↔backend (CORS incluso) è chiuso e P5 è DONE.
   - ❌ se ancora "different branch" anche senza OIDC → opzioni:
     - `az staticwebapp update -n bennaloz-home-finances -g rg-home-finance --branch refactor/dotnet-angular` (riscrive la proprietà branch),
     - oppure ricreare la SWA pulita selezionando il branch refactor.
2. Se il frontend si apre ma le chiamate API danno **CORS error**: verifica che `Cors__AllowedOrigins__0` sull'App Service sia esattamente `https://black-tree-08b383303.7.azurestaticapps.net` (senza slash finale) e riavvia l'App Service.
3. Se il backend dà 500 al primo `/api/...`: quasi sempre manca/è errata una App Setting (`Jwt__Key`).
4. (Opzionale) bump versioni action per togliere il warning "Node.js 20 deprecated".

## Note utili
- `az` locale: login con `az login --use-device-code` scegliendo la directory personale (NON il tenant Eurogroup, che richiede MFA e non ha la subscription).
- Risorse: Resource Group **`rg-home-finance`**, subscription personale free.
- Dettagli persistenti anche in memoria Claude: vedi `finance-app-deploy`.
- Sviluppo locale: `dotnet run` in `backend/CasaFinanze.Api` + `npx ng serve` in `client/` (proxy `/api` → :5080).
