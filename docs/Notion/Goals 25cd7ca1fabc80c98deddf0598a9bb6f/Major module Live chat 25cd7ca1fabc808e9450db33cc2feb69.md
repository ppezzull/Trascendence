# Major module: Live chat.

ID: 33
Owner: Andrea Falconi, Pietro Jairo Pezzullo, Gabriele Rinella

# Major module — Live Chat

## 📖 Requisiti

- **Messaggi diretti (DM)** tra utenti.
- **Block utenti** (il bloccato non può più contattarti/vederti in chat).
- **Inviti a giocare** a Pong dalla chat.
- **Notifiche torneo** (annuncio prossimo match).
- **Accesso a profili** direttamente dalla chat.

---

## 🏗️ Architettura (proposta con il tuo stack: Fastify, TS, Tailwind, SQLite)

- **chat-service (Fastify)**
    - **REST** per CRUD (threads, profili, block/unblock, history).
    - **WebSocket** (o SSE) per eventi real-time: nuovi messaggi, inviti, notifiche torneo, presenza/online.
    - **Auth**: JWT dal tuo `auth-service` (o modulo Security se implementato).
    - **Rate limiting + flood control** per prevenire spam; **content filter** di base.
- **DB (SQLite)**
    - Tabelle: `threads`, `messages`, `blocks`, `invitations`, `presence`, `chat_settings`.
    - Indici su `thread_id`, `created_at`, `sender_id` per ricerche veloci.
- **Integrazioni**
    - **game-service**: crea “pending match” su invito accettato.
    - **tournament-service**: emette eventi “next_match” → chat-service li inoltra ai giocatori.
    - **user-service**: lookup profili (avatar, display name, stats).

---

## 🗄️ Schema dati (estratto)

```sql
CREATE TABLE threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_group INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE thread_members (
  thread_id INTEGER, user_id INTEGER,
  PRIMARY KEY (thread_id, user_id)
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_system INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_messages_thread_time ON messages(thread_id, created_at);

CREATE TABLE blocks (
  blocker_id INTEGER, blocked_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,     -- Pong o altri giochi
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|declined|expired
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

```

---

## 🔌 API & Eventi (esempi)

**REST**

- `POST /chat/threads` → crea DM (o restituisce quello esistente) dati `userIdA,userIdB`.
- `GET /chat/threads/:id/messages?before=&limit=` → history paginata.
- `POST /chat/messages` → invia messaggio `{threadId, content}`.
- `POST /chat/blocks` → blocca `{blockedId}`; `DELETE /chat/blocks/:blockedId` → sblocca.
- `POST /chat/invitations` → invito gioco `{toUserId, gameId}` → crea pending match su `game-service` dopo accettazione.
- `POST /chat/invitations/:id/accept` → crea/aggancia `matchId` e notifica entrambi.
- `GET /users/:id/profile` → mostra profilo (via `user-service`).

**WebSocket (event types)**

```json
{ "type": "message:new", "threadId": 12, "msg": { ... } }
{ "type": "invite:new",  "invite": { "id": 88, "from": 7, "gameId": 1 } }
{ "type": "invite:update", "id": 88, "status": "accepted", "matchId": 501 }
{ "type": "tournament:next_match", "matchId": 999, "players": [7,13], "startsAt": "..." }
{ "type": "presence:update", "userId": 7, "status": "online" }

```

**Regole di block**

- Se `A` blocca `B`:
    - `B → A` non consegna messaggi/inviti, non vede lo stato di `A`.
    - In history, i messaggi pre-block restano, ma non si possono inviare nuovi DM.

---

## 🖼️ UI (Tailwind, SPA)

- **Sidebar Chat**: lista conversazioni con ultimo messaggio + presenza.
- **Chat View**: bubble a sinistra/destra, status “inviato/letto”, azioni: *Invita a giocare*, *Vedi profilo*, *Blocca*.
- **Invite modal**: scegli gioco (Pong), regole/parametri rapidi (se usi modulo Customization), *Invia invito*.
- **Torneo banner**: toast/notifica *“Prossima partita alle 20:15 vs PlayerX”* con CTA *“Apri match”*.
- **Profilo rapido**: drawer con avatar, ELO/win-rate, bottone *Aggiungi amico* / *Blocca*.

---

## 🔐 Sicurezza & Compliance

- **JWT** su WS (token nel query param firmato, validato al connect).
- **Autorizzazioni**: accesso ai thread solo se membro; verifica block prima di consegnare.
- **Rate limit** (per IP/utente), **antiflood** (burst + sliding window).
- **Sanitizzazione** contenuti; opzionalmente **link preview** sicura.
- Log minimi (niente dati sensibili), coerenti col modulo DevOps/ELK se presente.

---

## 📈 Performance & Affidabilità

- **Backpressure**: coda per utente; drop/slow-mode se il client non consuma.
- **Paginazione** history (cursor-based).
- **Indice DB** per ricerche veloci; cleanup/retention messaggi di sistema.
- **Recovery**: alla riconnessione WS invia `since=<lastEventId>` per delta.

---

## ✅ Deliverable

1. **chat-service** con REST + WS, autenticato.
2. **DB schema** e migrazioni per messaggi, blocks, inviti.
3. **UI chat** (SPA Tailwind) con DM, inviti, profili, block/unblock.
4. **Integrazione torneo**: ricezione/mostra notifiche “next match”.
5. **Test**: unit (block rules), integrazione (invito→match), e2e (latency/throughput).

---

## 🧪 Criteri di accettazione

- Invio/ricezione **DM** in tempo reale.
- **Block** impedisce nuovi messaggi/visibilità come da regole.
- Invito a Pong dalla chat → **match** creato e notifiche ad entrambi.
- **Notifiche torneo** recapitate ai giocatori interessati.
- Accesso rapido ai **profili** da chat.