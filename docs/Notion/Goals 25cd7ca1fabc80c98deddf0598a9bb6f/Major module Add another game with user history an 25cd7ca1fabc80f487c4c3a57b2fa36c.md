# Major module: Add another game with user history and matchmaking.

ID: 31
Owner: Gabriele Rinella, Eugenio Caruso

# Major module — Add another game with user history and matchmaking

## 📖 Cosa richiede il modulo

- **Aggiungere un nuovo gioco** (diverso da Pong) alla piattaforma.
- **Gestire la cronologia delle partite** degli utenti, con statistiche accessibili.
- **Implementare matchmaking** per accoppiare giocatori in modo equo.
- **Salvare in modo sicuro e aggiornato i dati** di gioco e matchmaking.
- **Mantenere prestazioni ottimali** (gioco fluido, UX gradevole).
- **Aggiornare e mantenere regolarmente** il nuovo gioco con fix/feature.

---

## 🎯 Obiettivi pratici

1. **Diversificare l’offerta ludica**: dare agli utenti un’alternativa a Pong.
    - Esempi adatti al contesto:
        - **Breakout/Arkanoid** (paddle + mattoncini).
        - **Connect Four** (logica strategica).
        - **Snake multiplayer** (veloce, competitivo).
2. **User History**:
    - Registrare partite giocate, vittorie/sconfitte, punteggi.
    - Consentire all’utente di consultare il proprio storico (match history).
3. **Matchmaking system**:
    - Algoritmo base: pairing random.
    - Algoritmo avanzato: ELO rating o punteggio basato sulle statistiche.
4. **Data persistence** (SQLite):
    - Tabelle dedicate (`games`, `matches`, `user_stats`).
    - Query ottimizzate con indici su `user_id` e `created_at`.
5. **User experience**:
    - Interfaccia responsive in Tailwind.
    - Integrazione nella lobby esistente: selezione gioco + ricerca avversari.

---

## ⚙️ Linee guida architetturali

- **Backend (Fastify)**
    - Nuovo microservizio o modulo `newgame-service`.
    - API REST per:
        - creare match (`POST /matches/newgame`)
        - recuperare storico (`GET /users/:id/history`)
        - matchmaking (`POST /matchmaking/find`).
- **Frontend (TS + Tailwind)**
    - Aggiungere una sezione “Games” → selezione Pong o Nuovo Gioco.
    - Pagina `GameHistory` con tabella + grafici (puoi usare librerie semplici, es. Chart.js, se consentito).
    - Lobby con pulsante “Find Match” → innesca matchmaking.
- **Database (SQLite)**
    - `games`: lista giochi disponibili.
    - `matches`: partite giocate con riferimenti a utenti, punteggi, data.
    - `user_stats`: punteggi aggregati (wins, losses, rank).

---

## 📐 Schema dati (estratto)

```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  score_p1 INTEGER,
  score_p2 INTEGER,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id)
);

CREATE TABLE user_stats (
  user_id INTEGER,
  game_id INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  elo INTEGER DEFAULT 1000,
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_id) REFERENCES games(id)
);

```

---

## ✅ Deliverable attesi

1. **Nuovo gioco** implementato e integrato nella piattaforma.
2. **API REST Fastify** per storico, matchmaking e gestione match.
3. **Interfaccia grafica SPA** (Tailwind) con:
    - lobby scelta gioco,
    - match finder,
    - storico partite e statistiche.
4. **Database SQLite** aggiornato con tabelle per giochi, match e stats.
5. **Documentazione**: regole del nuovo gioco + descrizione algoritmo matchmaking.

---

## 🚦 Criteri di accettazione

- Il nuovo gioco è giocabile end-to-end.
- Matchmaking funziona e assegna avversari disponibili.
- Cronologia partite e statistiche sono visibili e aggiornate.
- Dati persistenti in SQLite, sicuri e consistenti.
- Performance fluida su Firefox e SPA navigabile.

---

## 🎨 Snippet API (Fastify, TS)

```tsx
fastify.post("/matchmaking/find", async (req, reply) => {
  const { userId, gameId } = req.body;

  // matchmaking basico: trova un avversario libero
  const opponent = await fastify.db.get(
    `SELECT id FROM users WHERE id != ? ORDER BY RANDOM() LIMIT 1`,
    [userId]
  );

  if (!opponent) return reply.code(404).send({ error: "No opponent found" });

  const match = await fastify.db.run(
    `INSERT INTO matches (game_id, player1_id, player2_id) VALUES (?, ?, ?)`,
    [gameId, userId, opponent.id]
  );

  return { matchId: match.lastID, opponentId: opponent.id };
});

```