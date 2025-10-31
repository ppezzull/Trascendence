# Chat Service - Trascendence

Microservizio chat per il progetto Trascendence (42 School). Implementa il modulo **Major: Live Chat**.

## 🎯 Funzionalità

- ✅ **Messaggistica Diretta (DM)**: Comunicazione 1-a-1 tra utenti
- ✅ **WebSocket Real-time**: Eventi in tempo reale per messaggi e presenza
- ✅ **Sistema di Blocco**: Blocco/sblocco utenti
- ✅ **Inviti a Giocare**: Inviti a partite di Pong dalla chat
- ✅ **Presenza Utente**: Tracciamento dello stato online/offline/away
- ✅ **API REST**: CRUD completo per tutte le entità
- ✅ **Autenticazione JWT**: Condivisa con user-service
- ✅ **Swagger UI**: Documentazione API interattiva

## 🛠️ Tech Stack

- **Framework**: Fastify 4.x
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **WebSocket**: @fastify/websocket
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisiti

- Node.js >= 18
- npm o yarn

## 🚀 Installazione

```bash
# Installa le dipendenze
npm install

# Copia il file .env.example
cp .env.example .env

# Modifica le variabili d'ambiente
# IMPORTANTE: JWT_SECRET deve essere uguale a quello dello user-service!
```

## ⚙️ Configurazione

Configura il file `.env`:

```env
PORT=3002
HOST=127.0.0.1
LOG_LEVEL=info

# DEVE essere lo stesso dello user-service!
JWT_SECRET=supersecret

CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/chat.db
USER_SERVICE_URL=http://localhost:3001
```

## 🗄️ Database

Il servizio usa SQLite con le seguenti tabelle:

- `threads`: Conversazioni (DM o gruppi)
- `thread_members`: Membri di ogni conversazione
- `messages`: Messaggi inviati
- `blocks`: Utenti bloccati
- `invitations`: Inviti a giocare
- `presence`: Stato presenza utenti

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

- API: `http://localhost:3002`
- Swagger UI: `http://localhost:3002/docs`
- WebSocket: `ws://localhost:3002/api/chat/ws?token=YOUR_JWT`

## 📚 API Endpoints

### Chat

- `POST /api/chat/threads/dm` - Crea/ottieni thread DM
- `GET /api/chat/threads` - Lista thread dell'utente
- `GET /api/chat/messages?threadId=X` - Messaggi di un thread
- `POST /api/chat/messages` - Invia messaggio
- `DELETE /api/chat/messages/:id` - Elimina messaggio

### Blocchi

- `POST /api/chat/blocks` - Blocca utente
- `DELETE /api/chat/blocks` - Sblocca utente
- `GET /api/chat/blocks` - Lista utenti bloccati
- `GET /api/chat/blocks/:userId` - Verifica blocco

### Inviti

- `POST /api/chat/invitations` - Crea invito
- `POST /api/chat/invitations/:id/accept` - Accetta invito
- `POST /api/chat/invitations/:id/decline` - Rifiuta invito
- `DELETE /api/chat/invitations/:id` - Cancella invito
- `GET /api/chat/invitations/received` - Inviti ricevuti
- `GET /api/chat/invitations/sent` - Inviti inviati

### WebSocket

- `GET /api/chat/ws?token=JWT` - Connessione WebSocket

## 🔌 WebSocket Protocol

### Autenticazione

Connetti con JWT nel query param:

```javascript
const ws = new WebSocket(
  "ws://localhost:3002/api/chat/ws?token=YOUR_JWT_TOKEN"
);
```

### Eventi Client → Server

```javascript
// Ping
{ type: "ping", payload: {} }

// Aggiorna presenza
{ type: "presence:update", payload: { status: "online|away|offline" } }

// Typing indicator
{ type: "message:typing", payload: { threadId: 123 } }
```

### Eventi Server → Client

```javascript
// Connessione stabilita
{ type: "connected", payload: { message: "...", userId: 1 } }

// Nuovo messaggio
{ type: "message:new", payload: { threadId: 1, message: {...} } }

// Aggiornamento presenza
{ type: "presence:update", payload: { userId: 1, status: "online" } }

// Nuovo invito
{ type: "invite:new", payload: { invitation: {...} } }

// Invito aggiornato
{ type: "invite:update", payload: { id: 1, status: "accepted" } }

// Pong
{ type: "pong", payload: {} }
```

## 🔒 Autenticazione

Tutte le route API (eccetto `/health`) richiedono un JWT valido:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3002/api/chat/threads
```

Il JWT deve essere emesso dallo **user-service** e contenere:

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

## 🧪 Testing con Swagger

1. Avvia il servizio: `npm run dev`
2. Apri browser: `http://localhost:3002/docs`
3. Clicca "Authorize" e inserisci il token JWT
4. Testa gli endpoints direttamente dall'interfaccia

## 📦 Struttura del Progetto

```
chat-service/
├── src/
│   ├── app.ts                  # App Fastify principale
│   ├── index.ts                # Entry point
│   ├── controllers/            # Business logic
│   │   ├── ChatController.ts
│   │   ├── BlockController.ts
│   │   ├── InvitationController.ts
│   │   └── WebSocketController.ts
│   ├── models/                 # Data access layer
│   │   ├── ChatModel.ts
│   │   ├── BlockModel.ts
│   │   ├── InvitationModel.ts
│   │   └── PresenceModel.ts
│   ├── routes/                 # Route definitions
│   │   ├── chatRoutes.ts
│   │   └── wsRoutes.ts
│   ├── schemas/                # Validation schemas (Zod)
│   │   └── chatSchemas.ts
│   ├── database/               # Database connection & migrations
│   │   ├── connection.ts
│   │   └── migrate.ts
│   └── types/                  # TypeScript type definitions
│       └── fastify.d.ts
├── migrations/                 # SQL migrations
│   └── 0001_init.sql
├── data/                       # SQLite database files
│   └── chat.db
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 Integrazione con Altri Servizi

### User Service

- Condivide JWT_SECRET per validazione token
- In futuro: chiamate per ottenere info utenti

### Game Service

- In futuro: creazione partite quando invito accettato

### Tournament Service

- In futuro: notifiche torneo ai giocatori

## 🚧 TODO / Miglioramenti Futuri

- [ ] Integrazione con user-service per profili utenti
- [ ] Integrazione con game-service per creazione partite
- [ ] Rate limiting per prevenire spam
- [ ] Notifiche push
- [ ] Messaggi letti/non letti
- [ ] Ricerca messaggi
- [ ] Upload file/immagini
- [ ] Emoji reactions
- [ ] Chat di gruppo
- [ ] Retention policy messaggi
- [ ] Test unitari e integration
- [ ] Docker setup

## 📝 Note

- Il database SQLite è in modalità WAL per migliori performance concorrenti
- I messaggi di sistema (is_system=1) sono per notifiche automatiche
- Gli inviti scadono automaticamente dopo 10 minuti (configurabile)
- La presenza viene aggiornata automaticamente su connessione/disconnessione WS

## 🐛 Debug

### Log Level

Modifica `LOG_LEVEL` in `.env` per controllare il livello di logging:

- `debug`: Tutto
- `info`: Informazioni generali (default)
- `warn`: Solo warning ed errori
- `error`: Solo errori

### WebSocket Debug

```javascript
const ws = new WebSocket("ws://localhost:3002/api/chat/ws?token=YOUR_TOKEN");

ws.onopen = () => console.log("Connected");
ws.onmessage = (event) => console.log("Message:", event.data);
ws.onerror = (error) => console.error("Error:", error);
ws.onclose = () => console.log("Disconnected");

// Invia ping
ws.send(JSON.stringify({ type: "ping", payload: {} }));
```

## 📄 Licenza

ISC

---

Sviluppato per il progetto **ft_transcendence** @ 42 School
