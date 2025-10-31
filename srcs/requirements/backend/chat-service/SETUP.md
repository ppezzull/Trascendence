# Setup Rapido - Chat Service

## 📦 Installazione

```bash
cd srcs/requirements/backend/chat-service

# Installa le dipendenze
npm install

# Crea il file .env (IMPORTANTE!)
cat > .env << 'EOF'
PORT=3002
HOST=127.0.0.1
LOG_LEVEL=info

# DEVE essere lo stesso dello user-service!
JWT_SECRET=supersecret

CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/chat.db
USER_SERVICE_URL=http://localhost:3001
EOF
```

## 🚀 Avvio Rapido

```bash
# Sviluppo (con hot-reload)
npm run dev

# Produzione
npm run build
npm start
```

Il servizio sarà disponibile su:

- **API**: http://localhost:3002
- **Swagger UI**: http://localhost:3002/docs
- **WebSocket**: ws://localhost:3002/api/chat/ws?token=YOUR_JWT

## 🧪 Test con Swagger

1. Avvia il servizio: `npm run dev`
2. Vai su: http://localhost:3002/docs
3. Clicca su "Authorize" in alto a destra
4. Inserisci il JWT token ottenuto dallo user-service nel formato: `Bearer YOUR_TOKEN`
5. Testa gli endpoints!

## 🔑 Ottenere un JWT Token

Se hai lo user-service in esecuzione su `localhost:3001`:

```bash
# Registra un utente (se non esiste)
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Fai login e ottieni il token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# La risposta conterrà il token JWT
```

## 🔌 Test WebSocket

Crea un file HTML di test:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Chat WS Test</title>
  </head>
  <body>
    <h1>Chat WebSocket Test</h1>
    <div>
      <input
        type="text"
        id="token"
        placeholder="JWT Token"
        style="width: 500px"
      />
      <button onclick="connect()">Connect</button>
      <button onclick="disconnect()">Disconnect</button>
    </div>
    <div>
      <button onclick="ping()">Ping</button>
      <button onclick="setOnline()">Set Online</button>
      <button onclick="setAway()">Set Away</button>
    </div>
    <div>
      <h3>Messages:</h3>
      <pre
        id="messages"
        style="border: 1px solid #ccc; padding: 10px; height: 400px; overflow-y: auto;"
      ></pre>
    </div>

    <script>
      let ws = null;

      function log(msg) {
        const messages = document.getElementById("messages");
        messages.textContent += new Date().toISOString() + " - " + msg + "\n";
        messages.scrollTop = messages.scrollHeight;
      }

      function connect() {
        const token = document.getElementById("token").value;
        if (!token) {
          alert("Inserisci un token JWT!");
          return;
        }

        ws = new WebSocket(`ws://localhost:3002/api/chat/ws?token=${token}`);

        ws.onopen = () => {
          log("✅ Connected!");
        };

        ws.onmessage = (event) => {
          log("📨 Message: " + event.data);
        };

        ws.onerror = (error) => {
          log("❌ Error: " + error);
        };

        ws.onclose = () => {
          log("❌ Disconnected");
        };
      }

      function disconnect() {
        if (ws) {
          ws.close();
          ws = null;
        }
      }

      function ping() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping", payload: {} }));
          log("⬆️ Sent: ping");
        }
      }

      function setOnline() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "presence:update",
              payload: { status: "online" },
            })
          );
          log("⬆️ Sent: presence update (online)");
        }
      }

      function setAway() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "presence:update",
              payload: { status: "away" },
            })
          );
          log("⬆️ Sent: presence update (away)");
        }
      }
    </script>
  </body>
</html>
```

Salva come `ws-test.html` e aprilo nel browser!

## 📝 Test API con cURL

### Creare un thread DM

```bash
curl -X POST http://localhost:3002/api/chat/threads/dm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId": 2}'
```

### Inviare un messaggio

```bash
curl -X POST http://localhost:3002/api/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": 1,
    "content": "Ciao! Vuoi giocare a Pong?"
  }'
```

### Ottenere messaggi

```bash
curl "http://localhost:3002/api/chat/messages?threadId=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Bloccare un utente

```bash
curl -X POST http://localhost:3002/api/chat/blocks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId": 2}'
```

### Creare un invito

```bash
curl -X POST http://localhost:3002/api/chat/invitations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": 2,
    "gameType": "pong"
  }'
```

### Accettare un invito

```bash
curl -X POST http://localhost:3002/api/chat/invitations/1/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

### Errore: "Unauthorized"

- Verifica che il JWT sia valido e non scaduto
- Controlla che JWT_SECRET sia uguale tra user-service e chat-service
- Assicurati di includere "Bearer " prima del token nell'header Authorization

### Errore: "Cannot connect to WebSocket"

- Verifica che il servizio sia in esecuzione
- Controlla che il token sia passato come query param: `?token=YOUR_JWT`
- Verifica che non ci siano firewall che bloccano la connessione

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
curl http://localhost:3002/health

# Risposta attesa:
# {"status":"ok","service":"chat-service","timestamp":"2024-..."}
```

---

🎉 **Il chat service è pronto!**

Consulta il [README.md](./README.md) per la documentazione completa.
