# Soluzione Errore Creazione Torneo

## 🐛 Problema Identificato

Quando tenti di creare un torneo con questo comando:

```bash
curl -X POST http://localhost:3003/api/tournaments \
  -H "accept: application/json" \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dajeromadajeturnament",
    "game_id": 1,
    "max_players": 8,
    "min_players": 2,
    "tournament_type": "single_elimination",
    "settings": {}
  }'
```

Ricevi l'errore:

```json
{ "error": "GameModel.getById is not a function" }
```

## 🔍 Causa del Problema

Nel file `src/controllers/TournamentController.ts`, c'erano due problemi:

1. **Importazione errata**: Il file usava `require` invece di `import` per il GameModel
2. **Nome del metodo errato**: Il codice chiamava `GameModel.getById(game_id)` invece del metodo corretto `GameModel.getGameById(game_id)`

## ✅ Soluzione Applicata

Ho corretto entrambi i problemi nel TournamentController:

### 1. Importazione Corretta

```typescript
// Da:
const GameModel = require("../models/GameModel").GameModel;

// A:
import { GameModel } from "../models/GameModel";
```

### 2. Nome del Metodo Corretto

```typescript
// Da:
const game = GameModel.getById(game_id);

// A:
const game = GameModel.getGameById(game_id);
```

## 🧪 Test della Soluzione

Dopo aver applicato le correzioni, riavvia il game-service:

```bash
# Se stai eseguendo in sviluppo
# Interrompi il processo (Ctrl+C)
# Riavvia
npm run dev

# Se stai usando Docker
docker compose restart game-service
```

Poi prova nuovamente a creare il torneo:

```bash
curl -X POST http://localhost:3003/api/tournaments \
  -H "accept: application/json" \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dajeromadajeturnament",
    "game_id": 1,
    "max_players": 8,
    "min_players": 2,
    "tournament_type": "single_elimination",
    "settings": {}
  }'
```

Dovresti ricevere una risposta simile a:

```json
{
  "id": 1,
  "name": "dajeromadajeturnament",
  "game_id": 1,
  "status": "registration",
  "tournament_type": "single_elimination",
  "max_players": 8,
  "min_players": 2,
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

## 📋 Prossimi Passi

Dopo aver creato con successo il torneo:

1. **Registra giocatori**:

   ```bash
   curl -X POST http://localhost:3003/api/tournaments/1/register \
     -H "Authorization: Bearer TOKEN_JWT" \
     -H "Content-Type: application/json" \
     -d '{"alias": "Player1", "user_id": 1}'
   ```

2. **Avvia il torneo** (quando hai abbastanza giocatori):

   ```bash
   curl -X POST http://localhost:3003/api/tournaments/1/start \
     -H "Authorization: Bearer TOKEN_JWT" \
     -H "Content-Type: application/json"
   ```

3. **Visualizza il bracket**:
   ```bash
   curl -X GET http://localhost:3003/api/tournaments/1/bracket \
     -H "Authorization: Bearer TOKEN_JWT"
   ```

## 🚨 Note Aggiuntive

1. **Consistenza degli import**: Assicurati di usare sempre `import` invece di `require` in TypeScript
2. **Nomi dei metodi**: Verifica sempre i nomi esatti dei metodi chiamati
3. **Testing**: Testa sempre gli endpoint dopo aver modificato il codice

---

Con queste correzioni, la creazione dei tornei dovrebbe funzionare correttamente senza generare l'errore "GameModel.getById is not a function".
