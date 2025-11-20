# Guida Completa: Giochi e Tornei

Questa guida spiega in dettaglio come utilizzare il game-service per giocare a Pong e Breakout, gestire tornei e utilizzare il sistema di matchmaking.

## 🎯 Panoramica del Sistema

Il game-service gestisce:

- **Giochi**: Pong (2 giocatori) e Breakout (1 giocatore)
- **Partite**: Creazione, gestione e completamento
- **Tornei**: Single/double elimination con bracket automatico
- **Matchmaking**: Sistema automatico di abbinamento giocatori
- **Statistiche**: ELO rating, wins/losses, leaderboard

## 🎮 Sistema di Giochi

### Pong (game_id: 1)

- **Tipo**: 2 giocatori, competitivo
- **Obiettivo**: Primo a segnare il punteggio vincente
- **Controlli**:
  - Giocatore 1: W (su), S (giù)
  - Giocatore 2: Freccia su, Freccia giù

### Breakout (game_id: 2)

- **Tipo**: 1 giocatore, singolo
- **Obiettivo**: Distruggere tutti i mattoni senza perdere tutte le vite
- **Controlli**: Freccia sinistra/destra per muovere il paddle

## 🎯 Flusso di Gioco Singolo

### 1. Ottenere Token JWT

```bash
# Login per ottenere il token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "player@example.com", "password": "password123"}'

# Salva il token restituito come TOKEN_JWT
```

### 2. Creare una Partita

```bash
curl -X POST http://localhost:3003/api/matches \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "player_ids": [1, 2],
    "settings": {
      "1": "normal",
      "2": "5"
    }
  }'
```

Risposta attesa:

```json
{
  "id": 123,
  "game_id": 1,
  "status": "pending",
  "players": [
    {
      "match_id": 123,
      "user_id": 1,
      "score": 0,
      "position": 1,
      "is_ready": 0
    },
    {
      "match_id": 123,
      "user_id": 2,
      "score": 0,
      "position": 2,
      "is_ready": 0
    }
  ]
}
```

### 3. Segnare Giocatori come Pronti

```bash
# Giocatore 1 pronto
curl -X POST http://localhost:3003/api/matches/123/ready \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "ready": true}'

# Giocatore 2 pronto
curl -X POST http://localhost:3003/api/matches/123/ready \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "ready": true}'
```

Una volta che entrambi i giocatori sono pronti, lo stato della partita cambia automaticamente da "pending" a "in_progress".

### 4. Giocare e Aggiornare il Punteggio

```bash
# Aggiorna punteggio Giocatore 1
curl -X POST http://localhost:3003/api/matches/123/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 3}'

# Aggiorna punteggio Giocatore 2
curl -X POST http://localhost:3003/api/matches/123/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "score": 2}'
```

### 5. Terminare la Partita

```bash
curl -X POST http://localhost:3003/api/matches/123/finish \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"winner_id": 1}'
```

Questo aggiornerà:

- Lo stato della partita a "finished"
- Le statistiche ELO di entrambi i giocatori
- Il record di vittorie/sconfitte

## 🔄 Sistema di Matchmaking

Il sistema di matchmaking permette ai giocatori di trovare automaticamente avversari con un ELO simile.

### 1. Entrare nella Coda di Matchmaking

```bash
# Giocatore 1 entra in coda per Pong
curl -X POST http://localhost:3003/api/matchmaking/join \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'

# Giocatore 2 entra in coda per Pong
curl -X POST http://localhost:3003/api/matchmaking/join \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'
```

### 2. Verificare lo Stato della Coda (Opzionale)

```bash
curl -X GET http://localhost:3003/api/matchmaking/queue/1 \
  -H "Authorization: Bearer TOKEN_JWT"
```

Risposta attesa:

```json
{
  "stats": {
    "total_players": 2,
    "avg_wait_time": 15,
    "avg_elo": 1150
  },
  "players_in_queue": 2
}
```

### 3. Cercare una Partita

```bash
# Giocatore 1 cerca una partita
curl -X POST http://localhost:3003/api/matchmaking/find \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1, "elo_range": 200}'
```

Se c'è un avversario disponibile, la risposta sarà:

```json
{
  "message": "Match found!",
  "match": {
    "id": 124,
    "game_id": 1,
    "status": "pending",
    "players": [...]
  },
  "opponent_id": 2
}
```

Se non ci sono avversari:

```json
{
  "message": "No opponent found yet. Please wait...",
  "in_queue": true
}
```

### 4. Uscire dalla Coda di Matchmaking

```bash
# Esci dalla coda per un gioco specifico
curl -X POST http://localhost:3003/api/matchmaking/leave \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'

# Esci da tutte le code
curl -X POST http://localhost:3003/api/matchmaking/leave \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🏆 Sistema di Tornei

### 1. Creare un Torneo

```bash
curl -X POST http://localhost:3003/api/tournaments \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pong Championship 2024",
    "game_id": 1,
    "max_players": 8,
    "min_players": 2,
    "tournament_type": "single_elimination"
  }'
```

Risposta attesa:

```json
{
  "id": 1,
  "name": "Pong Championship 2024",
  "game_id": 1,
  "status": "registration",
  "tournament_type": "single_elimination",
  "max_players": 8,
  "min_players": 2,
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

### 2. Ottenere la Lista dei Tornei

```bash
curl -X GET http://localhost:3003/api/tournaments \
  -H "Authorization: Bearer TOKEN_JWT"
```

### 3. Registrarsi per un Torneo

```bash
curl -X POST http://localhost:3003/api/tournaments/1/register \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "Player1",
    "user_id": 1
  }'
```

### 4. Visualizzare le Registrazioni

```bash
curl -X GET http://localhost:3003/api/tournaments/1/registrations \
  -H "Authorization: Bearer TOKEN_JWT"
```

### 5. Avviare un Torneo

```bash
curl -X POST http://localhost:3003/api/tournaments/1/start \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### 6. Visualizzare il Bracket

```bash
curl -X GET http://localhost:3003/api/tournaments/1/bracket \
  -H "Authorization: Bearer TOKEN_JWT"
```

Risposta attesa:

```json
{
  "tournament": {
    "id": 1,
    "name": "Pong Championship 2024",
    "status": "in_progress",
    "current_round": 1
  },
  "registrations": [
    {
      "id": 1,
      "tournament_id": 1,
      "alias": "Player1",
      "user_id": 1,
      "seed": 1,
      "eliminated": false
    },
    ...
  ],
  "matches": [
    {
      "id": 1,
      "tournament_id": 1,
      "match_id": 125,
      "round": 1,
      "match_number": 1,
      "bracket_type": "winners"
    },
    ...
  ],
  "current_round": 1,
  "next_matches": [
    {
      "match_id": 125,
      "player1": "Player1",
      "player2": "Player2"
    },
    ...
  ]
}
```

### 7. Ottenere i Prossimi Match da Giocare

```bash
curl -X GET http://localhost:3003/api/tournaments/1/next-matches \
  -H "Authorization: Bearer TOKEN_JWT"
```

### 8. Completare un Match del Torneo

```bash
curl -X POST http://localhost:3003/api/tournaments/1/matches/125/complete \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"winner_id": 1}'
```

### 9. Ottenere le Statistiche del Torneo

```bash
curl -X GET http://localhost:3003/api/tournaments/1/stats \
  -H "Authorization: Bearer TOKEN_JWT"
```

## 📊 Sistema di Statistiche

### 1. Ottenere le Statistiche di un Giocatore

```bash
# Tutte le statistiche di un giocatore
curl -X GET http://localhost:3003/api/users/1/stats \
  -H "Authorization: Bearer TOKEN_JWT"

# Statistiche per un gioco specifico
curl -X GET http://localhost:3003/api/users/1/stats/1 \
  -H "Authorization: Bearer TOKEN_JWT"
```

Risposta attesa:

```json
{
  "user_id": 1,
  "game_id": 1,
  "matches_played": 25,
  "wins": 15,
  "losses": 10,
  "draws": 0,
  "total_score": 125,
  "highest_score": 7,
  "elo_rating": 1185
}
```

### 2. Ottenere la Leaderboard

```bash
curl -X GET http://localhost:3003/api/leaderboard/1?limit=10 \
  -H "Authorization: Bearer TOKEN_JWT"
```

Risposta attesa:

```json
[
  {
    "user_id": 1,
    "elo_rating": 1250,
    "wins": 20,
    "matches_played": 30
  },
  {
    "user_id": 2,
    "elo_rating": 1180,
    "wins": 18,
    "matches_played": 28
  },
  ...
]
```

### 3. Ottenere lo Storico delle Partite

```bash
curl -X GET http://localhost:3003/api/users/1/matches \
  -H "Authorization: Bearer TOKEN_JWT"
```

## 🎯 Flusso Completo di Gioco

### Flusso 1: Partita Singola

1. **Login** → Ottieni token JWT
2. **Crea partita** → `POST /api/matches`
3. **Segnati pronto** → `POST /api/matches/:matchId/ready`
4. **Gioca** → `POST /api/matches/:matchId/score`
5. **Termina** → `POST /api/matches/:matchId/finish`

### Flusso 2: Matchmaking

1. **Login** → Ottieni token JWT
2. **Entra in coda** → `POST /api/matchmaking/join`
3. **Cerca partita** → `POST /api/matchmaking/find`
4. **Segnati pronto** → `POST /api/matches/:matchId/ready`
5. **Gioca** → `POST /api/matches/:matchId/score`
6. **Termina** → `POST /api/matches/:matchId/finish`

### Flusso 3: Torneo

1. **Login** → Ottieni token JWT
2. **Crea torneo** → `POST /api/tournaments`
3. **Registrati** → `POST /api/tournaments/:id/register`
4. **Avvia torneo** → `POST /api/tournaments/:id/start`
5. **Gioca match** → Stesso flusso della partita singola
6. **Completa match** → `POST /api/tournaments/:id/matches/:matchId/complete`

## 🎮 Impostazioni di Gioco

### Pong (game_id: 1)

| Setting ID | Nome Opzione  | Valori Possibili           | Descrizione           |
| ---------- | ------------- | -------------------------- | --------------------- |
| 1          | ball_speed    | "slow", "normal", "fast"   | Velocità della palla  |
| 2          | winning_score | "3", "5", "7", "10"        | Punteggio per vincere |
| 3          | paddle_size   | "small", "normal", "large" | Dimensione racchetta  |
| 4          | power_ups     | "true", "false"            | Abilita power-up      |

### Breakout (game_id: 2)

| Setting ID | Nome Opzione | Valori Possibili         | Descrizione                |
| ---------- | ------------ | ------------------------ | -------------------------- |
| 1          | difficulty   | "easy", "normal", "hard" | Difficoltà del gioco       |
| 2          | lives        | "1", "3", "5"            | Numero di vite             |
| 3          | brick_rows   | "3", "5", "7"            | Numero di righe di mattoni |
| 4          | power_ups    | "true", "false"          | Abilita power-up           |

## 🛠️ Script per Test Rapido

```bash
#!/bin/bash
# gioco_completo.sh

TOKEN1="TOKEN_GIOCATORE_1"
TOKEN2="TOKEN_GIOCATORE_2"

echo "=== TEST PARTITA SINGOLA ==="
# 1. Crea partita
MATCH_RESPONSE=$(curl -s -X POST http://localhost:3003/api/matches \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1, "player_ids": [1, 2]}')

MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.id')
echo "Partita creata con ID: $MATCH_ID"

# 2. Segna giocatori come pronti
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/ready \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "ready": true}'

curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/ready \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "ready": true}'

echo "Entrambi i giocatori sono pronti!"

echo "=== TEST MATCHMAKING ==="
# 3. Entra in coda
curl -s -X POST http://localhost:3003/api/matchmaking/join \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'

curl -s -X POST http://localhost:3003/api/matchmaking/join \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'

# 4. Cerca partita
MATCH_RESPONSE=$(curl -s -X POST http://localhost:3003/api/matchmaking/find \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1, "elo_range": 200}')

MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.match.id')
echo "Matchmaking trovato! Partita ID: $MATCH_ID"

echo "=== TEST TORNEO ==="
# 5. Crea torneo
TOURNAMENT_RESPONSE=$(curl -s -X POST http://localhost:3003/api/tournaments \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tournament",
    "game_id": 1,
    "max_players": 4,
    "min_players": 2,
    "tournament_type": "single_elimination"
  }')

TOURNAMENT_ID=$(echo $TOURNAMENT_RESPONSE | jq -r '.id')
echo "Torneo creato con ID: $TOURNAMENT_ID"

# 6. Registra giocatori
curl -s -X POST http://localhost:3003/api/tournaments/$TOURNAMENT_ID/register \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"alias": "Player1", "user_id": 1}'

curl -s -X POST http://localhost:3003/api/tournaments/$TOURNAMENT_ID/register \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"alias": "Player2", "user_id": 2}'

# 7. Avvia torneo
curl -s -X POST http://localhost:3003/api/tournaments/$TOURNAMENT_ID/start \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json"

echo "Torneo avviato!"
```

## 🚨 Risoluzione Problemi Comuni

### Errore: "Unauthorized"

- Verifica che il token JWT sia valido e non scaduto
- Assicurati di includere "Bearer " prima del token

### Errore: "Game not found"

- Verifica che il game_id sia corretto (1 per Pong, 2 per Breakout)
- Assicurati che le migrazioni siano state eseguite

### Errore: "Player not found in match"

- Verifica che gli user_id siano corretti
- Controlla che i giocatori siano effettivamente nella partita

### Errore: "Cannot finish match"

- Assicurati che la partita sia in stato "in_progress"
- Verifica che entrambi i giocatori siano stati segnati come pronti

### Errore: "Already in queue"

- Un giocatore può essere nella coda di matchmaking per un solo gioco alla volta
- Usa l'endpoint `/matchmaking/leave` per uscire dalla coda

---

Questa guida copre tutti i flussi di gioco disponibili nel game-service, con esempi completi di chiamate API per partite singole, matchmaking e tornei.
