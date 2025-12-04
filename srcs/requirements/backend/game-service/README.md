# Game Service - Trascendence

Microservizio game per il progetto Trascendence (42 School). Gestisce **Pong**, **Breakout**, partite, matchmaking, tornei e statistiche.

## 🎯 Funzionalità

- ✅ **Gestione Giochi**: Pong e Breakout con impostazioni personalizzabili
- ✅ **Sistema Match**: Creazione, gestione e storico partite
- ✅ **Sistema Tornei**: Tornei single/double elimination con bracket automatico
- ✅ **Statistiche**: ELO rating, wins/losses, leaderboard
- ✅ **Matchmaking**: Coda con pairing basato su ELO
- ✅ **Game Settings**: Personalizzazione partite (velocità, power-ups, etc.)
- ✅ **User History**: Storico completo partite per utente
- ✅ **API REST**: CRUD completo per tutte le entità
- ✅ **Autenticazione JWT**: Condivisa con user-service
- ✅ **Swagger UI**: Documentazione API interattiva
- ✅ **Blockchain Tournament System**: Scores immutabili su Avalanche (TournamentScores.sol)

## 🛠️ Tech Stack

- **Framework**: Fastify 4.x
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3) - Solo metadati tornei
- **Blockchain**: Avalanche + Solidity (Smart contract per punteggi)
- **Web3 Library**: Viem per interazioni blockchain
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisiti

- Node.js >= 18
- npm o yarn

## 🚀 Installazione

```bash
# Installa le dipendenze
npm install

# Copia il file env.example come .env
cp env.example .env

# Modifica le variabili d'ambiente
# IMPORTANTE: JWT_SECRET deve essere uguale a quello dello user-service!
```

## ⚙️ Configurazione

Configura il file `.env`:

```env
PORT=3003
HOST=127.0.0.1
LOG_LEVEL=info

# DEVE essere lo stesso dello user-service!
JWT_SECRET=supersecret

CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/games.db

USER_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
```

## 🗄️ Database

Il servizio usa SQLite con le seguenti tabelle:

### Core Tables

- `games`: Giochi disponibili (Pong, Breakout)
- `matches`: Partite create
- `match_players`: Giocatori in ogni partita
- `user_game_stats`: Statistiche per utente/gioco

### Tournament Tables

- `tournaments`: Tornei (single/double elimination)
- `tournament_registrations`: Iscrizioni giocatori ai tornei
- `tournament_matches`: Collegamenti tra match e tornei (bracket)

### Settings Tables

- `game_settings`: Impostazioni disponibili per gioco
- `match_settings`: Impostazioni applicate a una partita

### Matchmaking

- `matchmaking_queue`: Coda per matchmaking

### Migrazioni

Le migrazioni vengono eseguite automaticamente all'avvio. Per eseguirle manualmente:

```bash
npm run migrate
```

## 💻 Sviluppo

```bash
# Modalità sviluppo con hot-reload
npm run dev

# Build TypeScript
npm run build

# Avvio produzione
npm start
```

Il servizio sarà disponibile su:

- **API**: http://localhost:3003
- **Swagger UI**: http://localhost:3003/docs

## 📚 API Endpoints

### Games

- `GET /api/games` - Lista giochi disponibili
- `GET /api/games/:gameId` - Dettagli gioco
- `GET /api/games/:gameId/settings` - Impostazioni gioco

### Matches

- `POST /api/matches` - Crea partita
- `GET /api/matches/:matchId` - Dettagli partita
- `POST /api/matches/:matchId/ready` - Segna giocatore pronto
- `POST /api/matches/:matchId/score` - Aggiorna punteggio
- `POST /api/matches/:matchId/finish` - Termina partita
- `GET /api/users/:userId/matches` - Storico partite utente

### Stats

- `GET /api/users/:userId/stats` - Tutte le statistiche utente
- `GET /api/users/:userId/stats/:gameId` - Stats per gioco specifico
- `GET /api/leaderboard/:gameId` - Leaderboard gioco
- `GET /api/users/:userId/rank/:gameId` - Ranking utente

### Matchmaking

- `POST /api/matchmaking/join` - Entra in coda
- `POST /api/matchmaking/leave` - Esci da coda
- `POST /api/matchmaking/find` - Cerca partita
- `GET /api/matchmaking/queue/:gameId` - Stato coda

### Tournaments

- `POST /api/tournaments` - Crea torneo
- `GET /api/tournaments` - Lista tornei
- `GET /api/tournaments/:id` - Dettagli torneo
- `POST /api/tournaments/:id/register` - Registra giocatore
- `DELETE /api/tournaments/:id/register/:registrationId` - Rimuovi registrazione
- `GET /api/tournaments/:id/registrations` - Lista iscritti
- `POST /api/tournaments/:id/start` - Avvia torneo
- `GET /api/tournaments/:id/bracket` - Visualizza bracket
- `GET /api/tournaments/:id/next-matches` - Prossimi match
- `GET /api/tournaments/:id/stats` - Statistiche torneo
- `POST /api/tournaments/:id/cancel` - Cancella torneo

## 🎮 Flusso di Gioco

### 1. Creare una Partita Manuale

```bash
curl -X POST http://localhost:3003/api/matches \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "player_ids": [1, 2],
    "settings": {
      "1": "fast",
      "2": "10"
    }
  }'
```

### 2. Matchmaking

```bash
# Entra in coda
curl -X POST http://localhost:3003/api/matchmaking/join \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'

# Cerca partita
curl -X POST http://localhost:3003/api/matchmaking/find \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1, "elo_range": 200}'
```

### 3. Giocare una Partita

```bash
# Segna come pronto
curl -X POST http://localhost:3003/api/matches/1/ready \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "ready": true}'

# Aggiorna punteggio durante il gioco
curl -X POST http://localhost:3003/api/matches/1/score \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 5}'

# Termina partita
curl -X POST http://localhost:3003/api/matches/1/finish \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"winner_id": 1}'
```

### 4. Visualizzare Statistiche

```bash
# Stats utente
curl http://localhost:3003/api/users/1/stats/1 \
  -H "Authorization: Bearer YOUR_JWT"

# Leaderboard
curl http://localhost:3003/api/leaderboard/1?limit=10
```

### 5. Creare e Giocare un Torneo

```bash
# 1. Crea un torneo
curl -X POST http://localhost:3003/api/tournaments \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pong Championship 2024",
    "game_id": 1,
    "max_players": 8,
    "min_players": 4,
    "tournament_type": "single_elimination"
  }'

# 2. Registra giocatori
curl -X POST http://localhost:3003/api/tournaments/1/register \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"alias": "Player1", "user_id": 1}'

curl -X POST http://localhost:3003/api/tournaments/1/register \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"alias": "Player2", "user_id": 2}'

# ... registra altri giocatori ...

# 3. Visualizza iscritti
curl http://localhost:3003/api/tournaments/1/registrations \
  -H "Authorization: Bearer YOUR_JWT"

# 4. Avvia il torneo (genera bracket automaticamente)
curl -X POST http://localhost:3003/api/tournaments/1/start \
  -H "Authorization: Bearer YOUR_JWT"

# 5. Visualizza bracket
curl http://localhost:3003/api/tournaments/1/bracket \
  -H "Authorization: Bearer YOUR_JWT"

# 6. Ottieni prossimi match da giocare
curl http://localhost:3003/api/tournaments/1/next-matches \
  -H "Authorization: Bearer YOUR_JWT"

# 7. Gioca i match (usa gli endpoint /api/matches/:matchId)
# ...

# 8. Monitora statistiche torneo
curl http://localhost:3003/api/tournaments/1/stats \
  -H "Authorization: Bearer YOUR_JWT"
```

## 🎲 Giochi Disponibili

### Pong (ID: 1)

- 2 giocatori
- Impostazioni:
  - `ball_speed`: slow/normal/fast
  - `winning_score`: 3/5/7/10
  - `paddle_size`: small/normal/large
  - `power_ups`: true/false

### Breakout (ID: 2)

- 1 giocatore
- Impostazioni:
  - `difficulty`: easy/normal/hard
  - `lives`: 1/3/5
  - `brick_rows`: 3/5/7
  - `power_ups`: true/false

## 🔒 Autenticazione

Tutte le route API (eccetto `/health` e `/api/games`) richiedono un JWT valido:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3003/api/matches
```

Il JWT deve essere emesso dallo **user-service** e contenere:

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

## 📊 Sistema ELO

Il servizio usa un sistema ELO rating per matchmaking e leaderboard:

- **Rating iniziale**: 1000
- **K-factor**: 32
- **Formula**: Standard ELO chess rating

Il rating viene aggiornato automaticamente dopo ogni partita.

## 🧪 Testing con Swagger

1. Avvia il servizio: `npm run dev`
2. Apri browser: http://localhost:3003/docs
3. Clicca "Authorize" e inserisci il token JWT
4. Testa gli endpoints direttamente dall'interfaccia

## 📦 Struttura del Progetto

```
game-service/
├── src/
│   ├── app.ts                  # App Fastify principale
│   ├── index.ts                # Entry point
│   ├── controllers/            # Business logic
│   │   ├── GameController.ts
│   │   ├── MatchController.ts
│   │   ├── StatsController.ts
│   │   ├── MatchmakingController.ts
│   │   └── TournamentController.ts
│   ├── models/                 # Data access layer
│   │   ├── GameModel.ts
│   │   ├── MatchModel.ts
│   │   ├── StatsModel.ts
│   │   ├── MatchmakingModel.ts
│   │   └── TournamentModel.ts
│   ├── providers/              # Blockchain providers
│   │   └── TournamentProvider.ts # Viem blockchain integration
│   ├── routes/                 # Route definitions
│   │   ├── gameRoutes.ts
│   │   └── tournamentRoutes.ts
│   ├── database/               # Database connection & migrations
│   │   ├── connection.ts
│   │   └── migrate.ts
│   ├── abi/                    # Smart contract ABIs
│   │   └── TournamentScores.json
│   └── types/                  # TypeScript type definitions
│       └── fastify.d.ts
├── migrations/                 # SQL migrations
│   ├── 0001_init.sql
│   └── 0002_tournaments.sql
├── data/                       # SQLite database files
│   └── games.db
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 Integrazione con Altri Servizi

### User Service

- Condivide JWT_SECRET per validazione token
- In futuro: sincronizzazione dati utenti

### Chat Service

- In futuro: notifiche inviti partita dalla chat

### ⛓️ Blockchain Tournament System

Il sistema implementa un'architettura **Blockchain-First** per i tornei:

#### 🎯 Come Funziona
- **Punteggi su Blockchain**: Tutti i punteggi dei tornei sono salvati in modo immutabile su Avalanche
- **Database per Metadati**: Il database locale contiene solo metadati (registrazioni, bracket, impostazioni)
- **Trasparenza Totale**: Chiunque può verificare i punteggi sulla blockchain
- **Anti-truffa**: I punteggi non possono essere modificati una volta inviati

#### 🔗 Smart Contract
- **Contract**: `TournamentScores.sol`
- **Network**: Avalanche Fuji Testnet
- **Address**: [0x202Fa7479d6fcBa37148009D256Ac2936729e577](https://testnet.snowscan.xyz/address/0x202Fa7479d6fcBa37148009D256Ac2936729e577)
- **Code Source**: `../blockchain-service/src/TournamentScores.sol`

#### 🚀 Setup Rapido
Vedi **[BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md)** per istruzioni complete:
- Setup locale (5 minuti) con Anvil
- Setup Avalanche Fuji testnet (10 minuti)
- Guide per non sviluppatori Web3

#### 🎮 Nuovi Endpoints Blockchain
- `POST /api/tournaments/:id/submit-score` - Invia punteggio alla blockchain
- `GET /api/tournaments/:id/leaderboard` - Classifica dalla blockchain
- `GET /api/tournaments/:id/verify` - Verifica integrità torneo
- `GET /api/tournaments/:id/blockchain-stats` - Statistiche dalla blockchain
- `GET /api/blockchain/health` - Stato connessione blockchain

### Blockchain Service

- Smart contract development e deployment
- Script di deployment per diverse reti (local, Fuji, Mainnet)

## 🏆 Sistema Tornei

Il servizio implementa un sistema completo di tornei:

### Tipi di Torneo

- **Single Elimination**: Un giocatore eliminato è fuori dal torneo
- **Double Elimination**: Un giocatore può perdere una volta e rimanere nel bracket losers (in sviluppo)

### Flusso Torneo

1. **Creazione**: Un organizzatore crea il torneo specificando gioco, tipo e numero giocatori
2. **Registrazione**: I giocatori si iscrivono con un alias (può essere collegato a user_id)
3. **Avvio**: Quando ci sono abbastanza giocatori, il torneo viene avviato
4. **Bracket Generation**: Il sistema genera automaticamente il bracket in base al numero di giocatori
5. **Progressione**: I giocatori giocano i match del bracket nell'ordine stabilito
6. **Completamento**: Il torneo termina quando tutti i match sono completati

### Caratteristiche

- ✅ Supporto alias temporanei (senza account) o utenti registrati
- ✅ Generazione automatica bracket single elimination
- ✅ Gestione round e progressione automatica
- ✅ Calcolo posizioni finali
- ✅ Statistiche in tempo reale del torneo
- ✅ Bye automatici se numero giocatori non è potenza di 2
- ✅ API per monitorare prossimi match da giocare

### Esempio Bracket (8 giocatori)

```
Round 1 (Quarti)      Round 2 (Semi)      Round 3 (Finale)
Player1 ─┐
         ├─ Winner1 ─┐
Player2 ─┘           │
                     ├─ Winner A ─┐
Player3 ─┐           │            │
         ├─ Winner2 ─┘            │
Player4 ─┘                        ├─ CHAMPION
                                  │
Player5 ─┐                        │
         ├─ Winner3 ─┐            │
Player6 ─┘           │            │
                     ├─ Winner B ─┘
Player7 ─┐           │
         ├─ Winner4 ─┘
Player8 ─┘
```

## 🚧 TODO / Miglioramenti Futuri

- [ ] WebSocket per aggiornamenti real-time durante partite
- [ ] Completare implementazione double elimination
- [ ] Integrazione eventi tornei con chat-service
- [x] ✅ Salvataggio punteggi su blockchain (implementato!)
- [ ] Tournament live streaming su blockchain
- [ ] NFT rewards per vincitori tornei
- [ ] Replay partite
- [ ] Achievement system
- [ ] Seasonal rankings
- [ ] Spectator mode
- [ ] AI opponent
- [ ] Test unitari e integration
- [ ] Docker setup

## 📝 Note

- Il database SQLite è in modalità WAL per migliori performance concorrenti
- Il matchmaking pulisce automaticamente entry vecchie oltre 30 minuti
- Le statistiche vengono aggiornate automaticamente al termine di ogni partita
- Il sistema ELO è bilanciato per partite 1v1

## 🐛 Troubleshooting

### Errore: "Unauthorized"

- Verifica che il JWT sia valido e non scaduto
- Controlla che JWT_SECRET sia uguale tra user-service e game-service
- Assicurati di includere "Bearer " prima del token nell'header Authorization

### Errore: "Game not found"

- Verifica che le migrazioni siano state eseguite
- Controlla che il database contenga i giochi di default

### Database non inizializzato

Le migrazioni vengono eseguite automaticamente all'avvio. Se ci sono problemi:

```bash
# Esegui manualmente le migrazioni
npm run migrate

# O elimina il database e riavvia
rm -rf data/
npm run dev
```

## ✅ Verifica Funzionamento

```bash
# Health check
curl http://localhost:3003/health

# Risposta attesa:
# {"status":"ok","service":"game-service","timestamp":"2024-..."}
```

---

🎮 **Il game service è pronto!**

Consulta la **Swagger UI** su http://localhost:3003/docs per la documentazione completa e interattiva!
