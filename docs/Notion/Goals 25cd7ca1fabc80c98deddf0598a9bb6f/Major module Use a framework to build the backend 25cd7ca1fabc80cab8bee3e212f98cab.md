# Major module: Use a framework to build the backend.

ID: 25
Owner: Andrea Falconi, Pietro Jairo Pezzullo

# Modulo Maggiore — Backend Framework (Fastify + Node.js)

## Scopo

Costruire il backend con **Fastify** (Node.js), in **TypeScript**, convalidando input e servendo API/WS sotto **HTTPS/WSS**.

## Vincoli dal subject

- Framework obbligatorio: **Fastify** con **Node.js**.
- Frontend SPA in TypeScript; il modulo frontend è separato.
- Deve girare in **Docker** con un solo comando.
- Sicurezza: HTTPS, validazione input, prevenzione SQLi/XSS.

## Architettura

```
backend/
  src/
    app.ts            # creazione fastify, TLS, plugins
    plugins/
      security.ts     # helmet-like headers, CORS, rate limit
      cookie.ts       # cookie parsing/firming
      websocket.ts    # ws server
    modules/
      auth/...
      users/...
      tournaments/...
      chat/...
    shared/
      db.ts           # connessione SQLite (singleton)
      logger.ts       # pino
  migrations/*.sql
  Dockerfile

```

### Linee guida

- **Schema validation** con i tipi JSON Schema integrati in Fastify (AJV).
- **Error handling** centralizzato (mappa errori in codici HTTP standard).
- **Logging** con `pino`; correlation-id su ogni richiesta.
- **CORS** ristretto a domini attesi.
- **Rate limiting** su rotte sensibili (auth, chat).
- **TLS**: generare certificati per sviluppo (self‑signed) e montare via volume in produzione.

## Endpoints (base)

- `/healthz` (GET)
- `/auth/register` (POST), `/auth/login` (POST), `/auth/logout` (POST)
- `/oauth/:provider/start` (GET), `/oauth/:provider/callback` (GET)
- `/me` (GET/PATCH), `/users/:id` (GET)
- `/friends` (GET/POST/DELETE)
- `/tournaments` (CRUD minimale), `/matches` (list, history)
- `/chat/ws` (WS handshake), `/chat/history/:conversationId` (GET paginata)

## Sicurezza

- Cookie **HttpOnly** + `SameSite=Lax` per sessione, o JWT firmati lato server (a scelta del progetto).
- Input validation per ogni route e sanitizzazione parametri.
- **HTTPS obbligatorio** e `wss://` per la chat.
- Segreti solo via **variabili d’ambiente** (file `.env` ignorato dal VCS).

## Docker

- Multi-stage (build TS → runtime node:18-alpine).
- Entry-point: migrazioni + `node dist/src/app.js`.
- Comando unico: `docker compose up -d`.

## Criteri di accettazione

- Avvio con **un solo comando**.
- API documentate (OpenAPI generata da schemi o README).
- Validazione, logging e sicurezza attivi per default.
- Supporto **WSS** funzionante per Live Chat.