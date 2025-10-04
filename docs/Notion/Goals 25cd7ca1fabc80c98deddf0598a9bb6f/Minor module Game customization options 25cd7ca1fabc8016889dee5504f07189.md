# Minor module: Game customization options.

ID: 32
Owner: Gabriele Rinella, Eugenio Caruso

# Minor module — Game customization options

## 📖 Cosa richiede il modulo

- Offrire **opzioni di personalizzazione** per tutti i giochi disponibili (Pong e quelli aggiuntivi).
- Possibili feature: **power-up, attacchi, mappe diverse, parametri modificabili**.
- Consentire agli utenti di scegliere tra:
    - **versione base** (semplice, “classic Pong”),
    - **versione avanzata** con customizzazioni attive.
- Fornire **interfacce di configurazione user-friendly**.
- Mantenere **consistenza** delle opzioni tra i diversi giochi.

---

## 🎯 Obiettivi pratici

1. **Aumentare la rigiocabilità**: rendere i giochi meno ripetitivi e più divertenti.
2. **Personalizzazione bilanciata**: le opzioni devono arricchire, non rompere, il gameplay.
3. **Interfaccia chiara**: impostazioni accessibili in lobby/pre-game.
4. **Compatibilità multi-gioco**: ogni titolo deve supportare le stesse categorie di personalizzazione.

---

## ⚙️ Linee guida architetturali

- **Backend (Fastify + SQLite)**
    - Tabella `game_settings` per salvare preferenze utente o parametri di match.
    - API REST:
        - `GET /games/:id/options` → ottieni opzioni disponibili.
        - `POST /matches/:id/options` → imposta opzioni per un match.
- **Frontend (TS + Tailwind)**
    - Creare una schermata **Settings Menu** in lobby.
    - Componenti UI: slider (velocità palla), toggle (power-up ON/OFF), dropdown (mappe).
    - Layout coerente tra tutti i giochi (UI unificata).
- **Customizzazioni tipiche per Pong**:
    - **Ball speed**: lenta, media, veloce.
    - **Power-ups**: paddle allungato, “multi-ball”.
    - **Maps**: arena standard, arena con ostacoli centrali.
    - **Scoring rules**: punteggio target (5, 10, 21).

---

## 📐 Schema dati (estratto)

```sql
CREATE TABLE game_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,   -- es. 'toggle', 'slider', 'dropdown'
  default_value TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE match_settings (
  match_id INTEGER,
  setting_id INTEGER,
  value TEXT,
  PRIMARY KEY (match_id, setting_id),
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (setting_id) REFERENCES game_settings(id)
);

```

---

## ✅ Deliverable attesi

1. **Sistema di opzioni configurabili** per Pong e gli altri giochi.
2. **API Fastify** per recuperare e salvare opzioni.
3. **UI in Tailwind** con menu di personalizzazione.
4. **Integrazione nelle lobby di gioco** (prima di iniziare il match).
5. **Consistenza UX**: stesso stile e layout per tutti i giochi.

---

## 🚦 Criteri di accettazione

- Tutti i giochi hanno almeno un set di opzioni personalizzabili.
- È sempre disponibile una **modalità base/classica**.
- I giocatori vedono un **menu uniforme** per le opzioni.
- Le scelte vengono salvate su SQLite e applicate al match.
- Non ci sono conflitti: se un’opzione non è supportata da un gioco, non compare.

---

## 🎨 Snippet API (Fastify, TS)

```tsx
// Ottenere opzioni disponibili per un gioco
fastify.get("/games/:id/options", async (req, reply) => {
  const { id } = req.params as { id: number };
  const options = await fastify.db.all(
    `SELECT * FROM game_settings WHERE game_id = ?`,
    [id]
  );
  return options;
});

// Salvare opzioni scelte per un match
fastify.post("/matches/:id/options", async (req, reply) => {
  const { id } = req.params as { id: number };
  const { settings } = req.body as { settings: { settingId: number, value: string }[] };

  for (const s of settings) {
    await fastify.db.run(
      `INSERT OR REPLACE INTO match_settings (match_id, setting_id, value) VALUES (?, ?, ?)`,
      [id, s.settingId, s.value]
    );
  }

  return { success: true };
});

```

---

## 🎨 UI (Tailwind mockup)

```html
<div class="p-6 bg-gray-800 text-white rounded-lg shadow-lg">
  <h2 class="text-xl font-bold mb-4">Game Settings</h2>

  <!-- Ball speed -->
  <label class="block mb-2">Ball Speed</label>
  <select class="w-full p-2 rounded bg-gray-700">
    <option>Slow</option>
    <option selected>Normal</option>
    <option>Fast</option>
  </select>

  <!-- Power-ups -->
  <div class="flex items-center mt-4">
    <input type="checkbox" id="powerups" class="mr-2">
    <label for="powerups">Enable Power-ups</label>
  </div>

  <!-- Map -->
  <label class="block mt-4 mb-2">Map</label>
  <select class="w-full p-2 rounded bg-gray-700">
    <option>Classic</option>
    <option>Obstacles</option>
    <option>Dark Mode</option>
  </select>
</div>

```