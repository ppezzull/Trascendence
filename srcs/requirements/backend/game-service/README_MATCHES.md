# Sistema di Partite (Matches) - Game Service

## 📋 Indice

1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Struttura del Database](#struttura-del-database)
3. [Stati di una Partita](#stati-di-una-partita)
4. [Flusso di una Partita](#flusso-di-una-partita)
5. [API Endpoints](#api-endpoints)
6. [Esempi Pratici](#esempi-pratici)
7. [Gestione degli Errori](#gestione-degli-errori)
8. [Best Practices](#best-practices)

## 🎯 Panoramica del Sistema

Il sistema delle partite (Matches) del game-service gestisce tutte le interazioni di gioco tra i giocatori. Il sistema supporta:

- **Giochi Multipli**: Pong (2 giocatori) e Breakout (1 giocatore)
- **Gestione dello Stato**: Tracciamento completo dello stato della partita
- **Sistema di Punteggio**: Aggiornamento in tempo reale dei punteggi
- **Gestione dei Giocatori**: Supporto per più giocatori per partita
- **Integrazione con Tornei**: Le partite possono essere parte di un torneo
- **Statistiche**: Tracciamento delle performance dei giocatori

## 🗄️ Struttura del Database

Il sistema delle partite utilizza principalmente due tabelle:

### 1. `matches`
Contiene le informazioni generali della partita:
- `id`: Identificatore unico della partita
- `game_id`: ID del gioco (1=Pong, 2=Breakout)
- `status`: Stato della partita (pending, in_progress, finished, cancelled)
- `winner_id`: ID del vincitore (null se non concluso)
- `settings`: Impostazioni personalizzate in formato JSON
- `created_at`: Timestamp di creazione
- `started_at`: Timestamp di inizio
- `completed_at`: Timestamp di completamento

### 2. `match_players`
Gestisce i giocatori nella partita:
- `match_id`: Riferimento alla partita
- `user_id`: ID dell'utente
- `score`: Punteggio del giocatore
- `position`: Posizione del giocatore (1, 2, etc.)
- `is_ready`: Flag indicante se il giocatore è pronto

## 🔄 Stati di una Partita

1. **pending**: La partita è stata creata ma non ancora iniziata
2. **in_progress**: La partita è in corso
3. **finished**: La partita è stata completata
4. **cancelled**: La partita è stata annullata

## 🎮 Flusso di una Partita

1. **Creazione**: Un utente crea una partita specificando il gioco e i giocatori
2. **Preparazione**: I giocatori segnalano di essere pronti
3. **Inizio**: Quando tutti i giocatori sono pronti, la partita passa a "in_progress"
4. **Svolgimento**: I giocatori aggiornano i loro punteggi durante il gioco
5. **Completamento**: Quando le condizioni di vittoria sono soddisfatte, la partita viene terminata
6. **Aggiornamento Statistiche**: Le statistiche dei giocatori vengono aggiornate

## 🚀 API Endpoints

### 1. Creare una Partita

**Endpoint**: `POST /api/matches`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

**Body**:
```json
{
  "game_id": 1,
  "player_ids": [1, 2],
  "settings": {
    "1": "normal",
    "2": "5"
  }
}
```

**Risposta (201)**:
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

### 2. Dettagli di una Partita

**Endpoint**: `GET /api/matches/:matchId`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
```

**Risposta (200)**:
```json
{
  "id": 123,
  "game_id": 1,
  "status": "in_progress",
  "winner_id": null,
  "settings": "{\"1\":\"normal\",\"2\":\"5\"}",
  "created_at": "2024-01-01T12:00:00.000Z",
  "started_at": "2024-01-01T12:05:00.000Z",
  "completed_at": null,
  "players": [
    {
      "match_id": 123,
      "user_id": 1,
      "score": 3,
      "position": 1,
      "is_ready": 1
    },
    {
      "match_id": 123,
      "user_id": 2,
      "score": 2,
      "position": 2,
      "is_ready": 1
    }
  ]
}
```

### 3. Segnare un Giocatore come Pronto

**Endpoint**: `POST /api/matches/:matchId/ready`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

**Body**:
```json
{
  "user_id": 1,
  "ready": true
}
```

**Risposta (200)**:
```json
{
  "success": true,
  "message": "Player readiness updated",
  "match_status": "in_progress"
}
```

### 4. Aggiornare il Punteggio

**Endpoint**: `POST /api/matches/:matchId/score`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

**Body**:
```json
{
  "user_id": 1,
  "score": 5
}
```

**Risposta (200)**:
```json
{
  "success": true,
  "message": "Score updated",
  "player_score": 5
}
```

### 5. Terminare una Partita

**Endpoint**: `POST /api/matches/:matchId/finish`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

**Body**:
```json
{
  "winner_id": 1
}
```

**Risposta (200)**:
```json
{
  "success": true,
  "message": "Match finished",
  "winner_id": 1,
  "final_scores": [
    {
      "user_id": 1,
      "score": 5
    },
    {
      "user_id": 2,
      "score": 3
    }
  ]
}
```

### 6. Annullare una Partita

**Endpoint**: `POST /api/matches/:matchId/cancel`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

**Risposta (200)**:
```json
{
  "id": 123,
  "status": "cancelled",
  "message": "Match cancelled successfully"
}
```

### 7. Storico Partite di un Utente

**Endpoint**: `GET /api/users/:userId/matches`

**Headers**:
```
Authorization: Bearer TOKEN_JWT
```

**Query Parameters (opzionali)**:
- `game_id`: Filtra per gioco
- `limit`: Numero massimo di risultati

**Risposta (200)**:
```json
[
  {
    "id": 123,
    "game_id": 1,
    "status": "finished",
    "winner_id": 1,
    "created_at": "2024-01-01T12:00:00.000Z",
    "completed_at": "2024-01-01T12:15:00.000Z",
    "player_score": 5,
    "opponent_score": 3,
    "result": "win"
  },
  {
    "id": 122,
    "game_id": 1,
    "status": "finished",
    "winner_id": 2,
    "created_at": "2024-01-01T11:30:00.000Z",
    "completed_at": "2024-01-01T11:45:00.000Z",
    "player_score": 2,
    "opponent_score": 5,
    "result": "loss"
  }
]
```

## 📝 Esempi Pratici

### Esempio Completo: Partita di Pong

```bash
# 1. Crea una nuova partita di Pong
MATCH_RESPONSE=$(curl -s -X POST http://localhost:3003/api/matches \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "player_ids": [1, 2],
    "settings": {
      "1": "normal",
      "2": "5"
    }
  }')

MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.id')
echo "Partita creata con ID: $MATCH_ID"

# 2. Segnala i giocatori come pronti
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/ready \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "ready": true}'

curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/ready \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "ready": true}'

# 3. Verifica lo stato della partita
curl -s -X GET http://localhost:3003/api/matches/$MATCH_ID \
  -H "Authorization: Bearer TOKEN_JWT"

# 4. Aggiorna i punteggi durante il gioco
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 1}'

curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "score": 0}'

# Continua ad aggiornare i punteggi...
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_1" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 5}'

curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/score \
  -H "Authorization: Bearer TOKEN_JWT_GIOCATORE_2" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "score": 3}'

# 5. Termina la partita
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/finish \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"winner_id": 1}'

# 6. Verifica lo stato finale della partita
curl -s -X GET http://localhost:3003/api/matches/$MATCH_ID \
  -H "Authorization: Bearer TOKEN_JWT"
```

### Esempio: Partita di Breakout (1 giocatore)

```bash
# 1. Crea una nuova partita di Breakout
MATCH_RESPONSE=$(curl -s -X POST http://localhost:3003/api/matches \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 2,
    "player_ids": [1],
    "settings": {
      "1": "normal",
      "2": "3",
      "3": "5"
    }
  }')

MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.id')
echo "Partita Breakout creata con ID: $MATCH_ID"

# 2. Segnala il giocatore come pronto
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/ready \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "ready": true}'

# 3. Aggiorna il punteggio durante il gioco
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/score \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 1500}'

# 4. Termina la partita (il giocatore è anche il vincitore)
curl -s -X POST http://localhost:3003/api/matches/$MATCH_ID/finish \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"winner_id": 1}'
```

## ⚠️ Gestione degli Errori

### Errori Comuni e Soluzioni

1. **"Game not found"**
   - Causa: game_id non valido
   - Soluzione: Verifica che il game_id sia 1 (Pong) o 2 (Breakout)

2. **"Match not found"**
   - Causa: ID della partita non valido
   - Soluzione: Verifica l'ID della partita

3. **"Player not found in match"**
   - Causa: L'utente non è un giocatore della partita
   - Soluzione: Verifica che l'user_id sia corretto e che il giocatore sia nella partita

4. **"Cannot update score"**
   - Causa: Tentativo di aggiornare il punteggio in una partita non in corso
   - Soluzione: Assicurati che la partita sia in stato "in_progress"

5. **"Cannot finish match"**
   - Causa: Tentativo di terminare una partita già terminata o annullata
   - Soluzione: Verifica lo stato della partita

6. **"Cannot cancel match"**
   - Causa: Tentativo di annullare una partita già in corso o terminata
   - Soluzione: Le partite possono essere annullate solo nello stato "pending"

## 💡 Best Practices

1. **Validazione dei Dati**
   - Sempre validare i parametri prima di effettuare le chiamate
   - Verifica che i game_id siano validi
   - Controlla che i player_ids siano validi

2. **Gestione degli Stati**
   - Controlla sempre lo stato della partita prima di operazioni sensibili
   - Non tentare di aggiornare punteggi in partite non in corso
   - Non tentare di terminare partite già terminate

3. **Sincronizzazione dei Giocatori**
   - Assicurati che tutti i giocatori siano pronti prima di iniziare
   - Usa l'endpoint `/ready` per gestire la sincronizzazione
   - Notifica i giocatori quando la partita passa a "in_progress"

4. **Aggiornamento dei Punteggi**
   - Aggiorna i punteggi regolarmente durante il gioco
   - Valida i punteggi prima di inviarli al server
   - Implementa un sistema di controllo anti-cheat se necessario

5. **Gestione delle Disconnessioni**
   - Implementa un sistema per gestire le disconnessioni dei giocatori
   - Considera di annullare automaticamente le partite con giocatori disconnessi
   - Fornisci un meccanismo per riconnettersi a una partita in corso

6. **Sicurezza**
   - Proteggi sempre gli endpoint con token JWT validi
   - Verifica che gli utenti abbiano i permessi per operare sulla partita
   - Non esporre dati sensibili nelle risposte API

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

---

Questa documentazione copre tutti gli aspetti del sistema delle partite nel game-service, fornendo esempi pratici e best practices per l'utilizzo corretto delle API.

