# User Service

Microservizio per la gestione degli utenti nel progetto Trascendence, sviluppato con Fastify e SQLite.

## Caratteristiche

- Autenticazione con JWT
- Autenticazione OAuth2 con Google
- Gestione completa degli utenti (CRUD)
- Sistema di amicizie
- Statistiche degli utenti
- API RESTful completa
- Documentazione Swagger integrata
- Validazione delle richieste con Zod
- Database SQLite con migrazioni

## Tecnologie

- **Framework**: Fastify
- **Database**: SQLite
- **Linguaggio**: TypeScript
- **Autenticazione**: JWT
- **Validazione**: Zod
- **Documentazione**: Swagger

## Setup

1. Installa le dipendenze:

```bash
npm install
```

2. Copia il file delle variabili d'ambiente:

```bash
cp .env.example .env
```

3. Modifica il file `.env` con le tue configurazioni.

4. Costruisci il progetto:

```bash
npm run build
```

5. Esegui le migrazioni del database:

```bash
npm run migrate
```

6. Avvia il servizio:

```bash
npm start
```

Per lo sviluppo, puoi usare:

```bash
npm run dev
```

## API Documentation

Una volta avviato il servizio, puoi accedere alla documentazione API all'indirizzo:
`http://localhost:3000/docs`

## Endpoint Principali

### Autenticazione

#### Autenticazione Classica

- `POST /api/users/register` - Registra un nuovo utente
- `POST /api/users/login` - Effettua il login

#### Autenticazione OAuth2

- `GET /api/auth/google` - Inizia il flusso di autenticazione Google OAuth2
- `GET /api/auth/google/callback` - Callback per l'autenticazione Google OAuth2

### Gestione Utenti

- `GET /api/users/:id` - Ottieni il profilo di un utente
- `PUT /api/users/:id` - Aggiorna i dati di un utente
- `DELETE /api/users/:id` - Elimina un utente

### Statistiche

- `GET /api/users/:id/stats` - Ottieni le statistiche di un utente
- `PUT /api/users/:id/stats` - Aggiorna le statistiche di un utente

### Amicizie

- `POST /api/users/friends/request` - Invia una richiesta di amicizia
- `POST /api/users/friends/:id/respond` - Rispondi a una richiesta di amicizia
- `GET /api/users/:id/friends` - Ottieni gli amici di un utente
- `GET /api/users/friends/pending` - Ottieni le richieste di amicizia in sospeso

### Ricerca

- `GET /api/users/search` - Cerca utenti

## Docker

Per costruire ed eseguire il container Docker:

```bash
docker build -t user-service .
docker run -p 3000:3000 --env-file .env user-service
```

## Struttura del Progetto

```
src/
├── app.ts                    # File principale dell'applicazione
├── controllers/
│   ├── UserController.ts     # Controller per le operazioni CRUD
│   └── OAuthController.ts    # Controller per OAuth2
├── database/
│   ├── connection.ts         # Connessione al database
│   └── migrate.ts            # Sistema di migrazioni
├── models/
│   └── User.ts              # Modello Utente
├── routes/
│   ├── userRoutes.ts        # Rotte API utenti
│   └── authRoutes.ts        # Rotte autenticazione OAuth
├── schemas/
│   └── userSchemas.ts       # Schemi di validazione
├── types/
│   └── fastify.d.ts         # Type definitions per Fastify
└── utils/                   # Utilità varie
```

## Template per Altri Microservizi

Questo progetto è stato progettato per essere utilizzato come template per altri microservizi. Per creare un nuovo microservizio basato su questo:

1. Copia questa directory
2. Modifica il nome del servizio in package.json
3. Adatta il modello, le rotte e i controller alle tue esigenze
4. Modifica le migrazioni del database
5. Aggiorna la documentazione

## Variabili d'Ambiente

### Configurazione Server

- `PORT`: Porta del server (default: 3000)
- `HOST`: Host del server (default: 127.0.0.1)
- `LOG_LEVEL`: Livello di logging (default: info)

### Autenticazione

- `JWT_SECRET`: Segreto per la firma dei token JWT

### CORS

- `CORS_ORIGIN`: Origine consentita per CORS (default: true)

### Google OAuth2

- `GOOGLE_CLIENT_ID`: Client ID di Google OAuth2 (ottieni da [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- `GOOGLE_CLIENT_SECRET`: Client Secret di Google OAuth2
- `BACKEND_URL`: URL del backend per il callback OAuth (default: http://localhost:3000)
- `FRONTEND_URL`: URL del frontend per il redirect dopo OAuth (default: http://localhost:3001)

## Configurazione Google OAuth2

Per utilizzare l'autenticazione Google OAuth2:

1. Vai su [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea un nuovo progetto o seleziona un progetto esistente
3. Vai su "Credenziali" e clicca su "Crea credenziali" > "ID client OAuth 2.0"
4. Configura la schermata del consenso se richiesto
5. Seleziona "Applicazione web" come tipo di applicazione
6. Aggiungi gli URI di reindirizzamento autorizzati:
   - `http://localhost:3000/api/auth/google/callback` (per sviluppo)
   - Il tuo URL di produzione (per produzione)
7. Copia il Client ID e il Client Secret
8. Aggiungi le credenziali nel file `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

## Flusso di Autenticazione OAuth2

### Lato Frontend

1. L'utente clicca su "Accedi con Google"
2. Il frontend reindirizza a: `GET http://localhost:3000/api/auth/google`
3. L'utente viene reindirizzato alla pagina di autorizzazione di Google
4. Dopo l'autorizzazione, Google reindirizza al callback del backend
5. Il backend crea/autentica l'utente e reindirizza al frontend con il token JWT:
   `http://localhost:3001/oauth/callback?token=JWT_TOKEN`
6. Il frontend estrae il token dall'URL e lo salva (localStorage, cookie, ecc.)
7. Il frontend può ora utilizzare il token per le chiamate API autenticate

### Collegamento Account

Se un utente con la stessa email esiste già nel sistema (registrato con email/password), il suo account verrà automaticamente collegato all'account Google. In questo modo l'utente potrà accedere sia con email/password che con Google.

## Esempio di Utilizzo

### Autenticazione Classica

```bash
# Registrazione
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123",
    "display_name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Autenticazione OAuth2

```html
<!-- Nel tuo frontend -->
<a href="http://localhost:3000/api/auth/google">
  <button>Accedi con Google</button>
</a>
```
