# Spese veloci (quick-add) — handoff per riprendere

> Nota di lavoro temporanea. Si può eliminare quando la feature è implementata.

## Contesto / obiettivo
L'app serve a **dividere comodamente le spese di fine mese tra Riccardo e Valentina** e a tenere
**registrate e pianificate le spese comuni** da dividere. Si cerca un **modo veloce e semplice per
registrare le spese singole** (idea iniziale: un "widget").

Stato: **decisione del modello in corso**, prima di scrivere codice. Questo file è il punto di ripresa.

## Decisioni già prese
- **Approccio**: quick-add **dentro l'app, solo online**. Offline accantonato.
  - Motivo: su **iOS la Background Sync API non esiste** → se registri offline e chiudi l'app, NON
    si sincronizza in background; al più si invierebbe alla riapertura. Il push "da app chiusa" su
    iPhone lo dà solo un'app nativa (BGTaskScheduler), scartata.
- **Widget nativo iOS**: scartato. Serve Mac + Apple Developer 99 $/anno, e con MAUI/Capacitor il
  widget va comunque scritto in Swift (WidgetKit). Le **Scorciatoie iOS** erano un'alternativa
  "native-like" ma rimandate.
- **Keep-warm / PR #22** (endpoint `/health` + guida Scorciatoia): **chiusa e branch cancellato**
  (`feat/spesa-lampo-ios-keepwarm`). Niente keep-warm: a freddo l'ingresso può ancora prendersi ~30s.
- **Come si raggiunge il quick-add**: un **pulsante "+" flottante (FAB)** nel layout, perché oggi la
  bottom-nav NON ha un "Aggiungi" (a `/aggiungi` ci si arriva solo da Uscite).
- **Chi registra = chi ha pagato** ("chi registra una spesa veloce è anche chi l'ha sostenuta").

## ✅ NODO RISOLTO (2026-06-12)
Il quick-add tocca il cuore dell'app: la coppia **categoria + chi paga** determina come la spesa
viene divisa (`finance-calc.ts` → `computeContrib`; il *saldo* per membro = pagato − dovuto).

Decisioni prese con l'utente:
- **Le spese comuni escono SEMPRE dal conto comune.** Quindi il quick-add di una comune può
  assumere `payer='comune'` senza chiedere chi ha pagato.
- **Le spese personali NON si tracciano**: i soldi girati sui conti personali sono solo
  un'uscita residuale del conto comune; poi ognuno spende come vuole.
- L'**eccezione** vera è l'inverso: una **spesa personale pagata col conto comune**, da
  attribuire a quel membro. Rimandata: per ora basta registrarla nel **form completo**; niente
  trattamento speciale nel quick-add.

Bozza scelta quick-add (da implementare quando si riprende): un'unica scelta **"Comune / Personale (mia)"**:

| Scelta | Categoria | Chi paga |
|---|---|---|
| Comune | Variabili comuni (`variabile`) | Conto comune (`comune`) |
| Personale (mia) | Personali mie (`p{ioId}`) | Mio conto (`u{ioId}`) |

## Buco tecnico da colmare
Il client **non sa "quale membro sono io"**: né `AuthResponse` né l'utente salvato hanno l'id del
membro (solo `displayName`/`email`). Serve per attribuire le spese personali (`u{ioId}`/`p{ioId}`).
- **Decodificare il JWT** lato client (claim `userId`) — nessuna modifica backend. [preferita]
- oppure aggiungere l'id alla `AuthResponse` del login — piccola modifica backend, più pulita.

## Mappa del codice (per riprendere in fretta)
- Form attuale (5 campi; tipo singola/ricorrente/programmata):
  `client/src/app/features/aggiungi/aggiungi.ts` + `aggiungi.html`
- Salvataggio: `DataStore.addExpense` → `client/src/app/core/data-store.ts:70`
  → `ApiService.createExpense` (`api.service.ts:13`) → `POST /api/expenses`, poi `loadMonth()`.
- Backend: `backend/CasaFinanze.Api/Controllers/ExpensesController.cs:27`
  (`ExpenseInput`: Desc, Amount, Cat, Payer, Date, Tipo, RecurringId, ScheduledId; HouseholdId dai claim).
- Routing (figli di `Layout`, `authGuard`): `client/src/app/app.routes.ts`
- Shell senza pulsante "+": `client/src/app/layout/layout.html` / `layout.ts`
  (per la visibilità del FAB derivare dal path della route corrente, come `title`).
- Riferimenti membro/categoria: `client/src/app/util/finance-calc.ts`
  `memberPayerRef(id)='u'+id`, `memberCatRef(id)='p'+id`, `allCatIds`, `catFormLabel`.
  Categorie fisse: `common`, `variabile`, `risparmio`, `extra` (+ personali `p{id}`, custom).
- Membri: `ds.members()` → `{id, displayName, monthlyIncome}`. Saldo: `finance-calc.ts:129`
  (pagato = spese con `payer=u{id}` E categoria comune).
- Stili globali: `client/src/styles.css` (variabili `--color-*`, `.form-card`, `.form-row`,
  `.btn-primary/.btn-secondary`, `.tipo-btn`; **da creare `.fab`**). App `max-width:420px`,
  `--nav-h:56px`, attenta alle safe-area iPhone.

## Implementazione proposta (bozza, dipende dal nodo aperto)
1. Nuovo componente routed `SpesaVeloce` a `/spesa-veloce` (lazy, figlio di `Layout`).
2. **FAB "+"** nel layout → `/spesa-veloce`; visibile sulle schermate del mese, nascosto su
   `aggiungi`/`spesa-veloce`/`impostazioni`.
3. Campi minimi: **Importo** (autofocus, `inputmode="decimal"`), scelta **Comune/Personale**
   (o ciò che si decide), **Descrizione** opzionale. Data = oggi; categoria+pagatore derivati.
4. Ricavare l'id del membro corrente (decodifica JWT).
5. Salva con `ds.addExpense`; "Salvato ✓" inline e reset per inserirne un'altra al volo.
6. (Opz.) `shortcuts` nel `manifest.webmanifest` → `/spesa-veloce` (aiuta Android).
7. (Opz.) ricorda l'ultima scelta in `localStorage`.

## Prossimi passi quando si riprende
1. **Completare la frase di Riccardo** → decidere il modello (Comune/Personale e se per le comuni
   serve "chi ha pagato").
2. Scegliere come ottenere l'id del membro corrente (JWT vs backend).
3. Implementare.
