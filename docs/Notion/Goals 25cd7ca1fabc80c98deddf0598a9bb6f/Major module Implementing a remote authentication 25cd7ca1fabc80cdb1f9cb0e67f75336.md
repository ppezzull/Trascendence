# Major module: Implementing a remote authentication.

ID: 30
Owner: Andrea Falconi

# Major module — Remote Authentication (Google Sign-In)

## 📖 Requisiti dal subject

- Integrare **Google Sign-In** per consentire il login sicuro.
- Ottenere **credenziali** e permessi dall’autorità (Google) per l’accesso.
- Implementare **flow di login/autorizzazione** usabili e conformi alle best practice.
- Garantire **scambio sicuro** di token e dati utente tra app e provider.
- La gestione di **duplicati username/email** è a tua discrezione: serve una soluzione sensata.

---

## 🎯 Obiettivo

Offrire un’autenticazione **remota, sicura e comoda** per gli utenti, integrata con il resto della piattaforma (profili, chat, matchmaking, tornei).

---

## 🏗️ Architettura (Fastify + TS + SQLite)

- **auth-service (Fastify)**: gestisce OAuth 2.0 / OpenID Connect con Google.
- **user-service**: profili e relazione tra account locali e provider esterni.
- **frontend (TS + Tailwind)**: pulsante *“Sign in with Google”*, schermate di consenso/collegamento account.
- **DB (SQLite)**:
    - `users(id, email, display_name, avatar_url, created_at, ...)`
    - `federated_identities(user_id, provider, provider_user_id, email_verified, created_at)`
    - Indici su `(provider, provider_user_id)` e su `email`.

---

## 🔐 Flussi consigliati (OIDC “Authorization Code + PKCE”)

1. **/auth/google** → reindirizza a Google con `state` anti-CSRF e **PKCE**.
2. **/auth/google/callback** → scambia `code` ↔ `tokens`, verifica `id_token` (firma e `aud`), estrae `sub`, `email`, `email_verified`, `picture`, `name`.
3. **Account linking**:
    - Se esiste `federated_identities(provider='google', sub)`: login immediato.
    - Altrimenti, se esiste un utente con stessa email: chiedi **collegamento** (consenso esplicito) → crea record in `federated_identities`.
    - Se email nuova: crea **nuovo utente** con `display_name` unico (vedi strategia duplicati).
4. **Sessione**: emetti **session cookie** HttpOnly/SameSite=Strict (consigliato) oppure **JWT** firmato (edge/cross-service).
5. **Logout**: invalida cookie/session store, opzionale *Google logout* lato client.

> Nota: tutta la comunicazione deve essere HTTPS/wss secondo i requisiti di sicurezza del subject. (È un requisito generale del progetto per backend/feature).
> 

---

## 👥 Duplicati username/email — policy proposta

- **Email**: unica a livello sistema (case-insensitive).
    - Se un nuovo Google Sign-In arriva con un’email già usata da un account locale → prompt “Collega il tuo account a Google?” (opt-in).
- **Display name**: genera automaticamente variante se occupato (es. `andrea`, `andrea_1`, `andrea_2`) e offri modifica post-login.
- **Provider lock**: `(provider, provider_user_id)` deve essere **univoco**.

---

## 🧩 Endpoints (esempio)

- `GET /auth/google` → redirect a Google (nonce/state/PKCE memorizzati server-side).
- `GET /auth/google/callback?code&state` → scambio token + login/collegamento.
- `POST /auth/link` → collega provider a utente già loggato (flow esplicito).
- `POST /auth/logout` → invalida sessione.
- `GET /me` → profilo autenticato.
- `GET /sessions/refresh` (opzionale) → rinnova sessione/JWT con rotazione.

---

## 🗄️ Schema dati (estratto)

```sql
CREATE TABLE federated_identities (
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,                 -- 'google'
  provider_user_id TEXT NOT NULL,         -- 'sub' OIDC
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_users_email_unique ON users(lower(email));

```

---

## 🔒 Sicurezza (best practice)

- **PKCE + state + nonce** su tutti i flow; verifica firma `id_token` e `exp`.
- **Cookie**: `HttpOnly`, `Secure`, `SameSite=Strict`; TTL breve + **rotazione**.
- **Scopes minimi**: `openid email profile`.
- **CSRF**: protezione su endpoint di scrittura, *double submit cookie* o token nel body.
- **Rate limiting** su auth endpoints; **lockout** progressivo su tentativi sospetti.
- **Secrets** in `.env` (mai in repo); usali via variabili d’ambiente del container. (Il subject impone di non committare credenziali/chiavi).

---

## 🖼️ UX (SPA Tailwind)

- **Schermata Login**: pulsante *“Continue with Google”* + fallback “Email & Password” (se previsto).
- **Dialog di collegamento account** quando email coincide con account esistente.
- **Toasts** per errori comuni (consenso negato, state/nonce invalidi).
- **Profilo**: badge “Verified email”, avatar da Google con opt-in.

---

## 🔌 Integrazioni piattaforma

- **chat-service**: mostra nome/avatar subito dopo login.
- **tournament-service**: usa `user_id` univoco; nessun coupling con provider.
- **game-service**: abilita inviti e partite solo se autenticato.
- **user-service**: endpoint per aggiornare `display_name` e preferenze.

---

## ✅ Deliverable

1. **Flow OIDC Google** completo (redirect, callback, verifica token, session).
2. **Tabelle e migrazioni** per identità federate.
3. **UI**: pulsante Google + dialog “collega account”.
4. **Policy duplicati** documentata e testata.
5. **Test**: unit (verifica `id_token`), integrazione (callback), e2e (login → chat/tournament).

---

## 🚦 Criteri di accettazione

- Login con **Google Sign-In** funziona end-to-end.
- **Token e dati** scambiati e validati in modo sicuro.
- **Gestione duplicati** (email/display_name) coerente e documentata.
- Sessione persistente, logout efficace, HTTPS enforced.
- UX fluida e aderente alle best practice.