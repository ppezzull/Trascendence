# IMPORTANTE: Fix CORS per il Game Service

Il frontend gira su http://localhost:3000 ma il game-service è configurato per accettare richieste da http://localhost:5173.

Per risolvere il problema CORS, devi aggiornare il file `.env` del game-service:

## File: srcs/requirements/backend/game-service/.env

Cambia questa riga:
```
CORS_ORIGIN=http://localhost:5173
```

In:
```
CORS_ORIGIN=http://localhost:3000
```

Oppure per permettere entrambi:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Dopo la modifica:

1. Riavvia il game-service:
   ```bash
   cd srcs/requirements/backend/game-service
   npm run dev
   ```

2. Il matchmaking dovrebbe ora funzionare correttamente!
