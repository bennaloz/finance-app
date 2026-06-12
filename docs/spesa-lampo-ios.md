# Spesa lampo su iPhone (Scorciatoie) + keep-warm

Due cose indipendenti che insieme danno **"registra una spesa in 2 secondi dalla home dell'iPhone"**
senza aspettare i 30 secondi del cold start:

1. **Keep-warm** — tiene sveglio il backend così non parte da freddo.
2. **Scorciatoia iOS** — un widget/icona che invia la spesa direttamente all'API, scavalcando app e login.

---

## 1. Keep-warm (tieni sveglio il backend)

Il backend gira su **Azure App Service Free (F1)**: dopo ~20 minuti di inattività scarica l'app, e
al primo accesso impiega ~30s a ripartire. Il piano Free non ha "Always On", ma basta chiamarlo
periodicamente per non farlo addormentare. Per questo esiste l'endpoint **`/health`** (leggero, niente
auth, niente DB):

```
https://bennaloz-home-finances.azurewebsites.net/health   →   200 "ok"
```

### Configurare un pinger gratuito (cron-job.org)

1. Registrati su <https://cron-job.org> (gratis).
2. **Create cronjob**:
   - **URL**: `https://bennaloz-home-finances.azurewebsites.net/health`
   - **Schedule**: ogni **5 minuti**
   - **Orario** (consigliato): limita alle ore di veglia, es. **07:00–23:30**, per non consumare
     inutilmente la quota CPU giornaliera del piano Free di notte.
3. Salva. Da lì in poi il backend resta caldo nelle ore in cui lo usi: ingresso nell'app e POST della
   scorciatoia diventano quasi istantanei.

> In alternativa va bene anche UptimeRobot (intervallo minimo 5 min nel piano free). Evita intervalli
> più corti di 5 min: non servono (la soglia di idle è ~20 min) e sprecano quota.

---

## 2. Scorciatoia "Aggiungi spesa"

Una Scorciatoia iOS può: chiederti **importo** (e categoria), autenticarsi da sola e fare il POST della
spesa. Poi la piazzi **sulla home come icona**, nel **widget Scorciatoie**, sulla **schermata di blocco**,
o la lanci con **Siri** ("Aggiungi spesa") o col **Back Tap** (tocchi sul retro dell'iPhone).

Parla diretta con l'API: **non apre l'app e non passa dal login**.

### Autenticazione

La scorciatoia fa **prima il login** (per ottenere un token fresco) e **poi il POST**. Così sopravvive
alla scadenza del token (30 giorni) senza doverla mai più toccare. Email e password restano salvate
dentro la tua scorciatoia (in iCloud) — accettabile per un'app personale.

### Costruzione passo-passo (app Scorciatoie → +)

**A. Chiedi l'importo**
1. Azione **"Chiedi input"** → Tipo: **Numero** → Prompt: `Quanto?`
   *(rinomina la variabile risultato in `Importo`)*

**B. (opzionale) Scegli la categoria**
2. Azione **"Scegli dal menu"** con voci: `Variabili`, `Comuni`, `Risparmio`, `Extra`.
   In ogni ramo aggiungi **"Imposta variabile"** `Cat` ai valori corrispondenti:
   `variabile` · `common` · `risparmio` · `extra`.
   *(Se vuoi tenerla semplicissima, salta questo passo e usa direttamente `variabile` nel body sotto.)*

**C. Data di oggi**
3. Azione **"Data corrente"** → poi **"Formatta data"** → Formato personalizzato: `yyyy-MM-dd`.
   *(rinomina il risultato in `Oggi`)*

**D. Login → ottieni il token**
4. Azione **"Ottieni contenuti da URL"**:
   - **URL**: `https://bennaloz-home-finances.azurewebsites.net/api/auth/login`
   - **Metodo**: `POST`
   - **Intestazioni**: `Content-Type` = `application/json`
   - **Corpo richiesta**: `JSON`
     ```json
     {
       "email": "TUA_EMAIL",
       "password": "TUA_PASSWORD"
     }
     ```
5. Azione **"Ottieni valore dizionario"** → Chiave: `token` *(rinomina in `Token`)*

**E. Invia la spesa**
6. Azione **"Ottieni contenuti da URL"**:
   - **URL**: `https://bennaloz-home-finances.azurewebsites.net/api/expenses`
   - **Metodo**: `POST`
   - **Intestazioni**:
     - `Content-Type` = `application/json`
     - `Authorization` = `Bearer [Token]`  *(inserisci la variabile `Token` dopo `Bearer `)*
   - **Corpo richiesta**: `JSON`
     ```json
     {
       "desc": "Spesa",
       "amount": [Importo],
       "cat": "variabile",
       "payer": "comune",
       "date": "[Oggi]",
       "tipo": "singola"
     }
     ```
     *(`[Importo]`, `[Oggi]` e — se hai fatto il passo B — `[Cat]` al posto di `"variabile"` sono le
     variabili magiche della scorciatoia. `payer: "comune"` = conto comune; per attribuirla a un membro
     usa `u{id}` del membro.)*

**F. Conferma**
7. Azione **"Mostra notifica"** → `Spesa di [Importo]€ salvata ✓`

### Impostazioni utili della scorciatoia
- Nei dettagli (ⓘ): **"Aggiungi a schermata Home"** per averla come icona-widget.
- Attiva **"Esegui senza chiedere"** così non chiede conferme a ogni lancio.
- Aggiungila al **widget Scorciatoie** (home/schermata Oggi) o assegnala al **Back Tap**
  (Impostazioni → Accessibilità → Tocco → Tocco posteriore).
- Puoi lanciarla a voce: *"Ehi Siri, Aggiungi spesa"*.

### Note
- **Cold start**: se il backend era addormentato, il POST può metterci fino a ~30s la prima volta. Col
  keep-warm del punto 1 questo non succede quasi mai. La scorciatoia gira comunque in background e ti
  avvisa a fine corsa: puoi lanciarla e proseguire.
- **Descrizione fissa**: qui la spesa nasce con descrizione `"Spesa"`. Se la vuoi digitare, aggiungi un
  altro **"Chiedi input"** (Testo) e mettilo in `desc`.
- La spesa appare nell'app come una normale spesa singola del mese corrente.
