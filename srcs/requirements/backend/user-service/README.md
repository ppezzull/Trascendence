# User Service

Microservizio per la gestione degli utenti nel progetto Trascendence, sviluppato con Fastify e SQLite.

## Caratteristiche

- Autenticazione con JWT
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
- `POST /api/users/register` - Registra un nuovo utente
- `POST /api/users/login` - Effettua il login

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
├── app.ts                 # File principale dell'applicazione
├── controllers/
│   └── UserController.ts  # Controller per le operazioni CRUD
├── database/
│   ├── connection.ts      # Connessione al database
│   └── migrate.ts         # Sistema di migrazioni
├── models/
│   └── User.ts           # Modello Utente
├── routes/
│   └── userRoutes.ts     # Rotte API
├── schemas/
│   └── userSchemas.ts    # Schemi di validazione
└── utils/                # Utilità varie
```

## Template per Altri Microservizi

Questo progetto è stato progettato per essere utilizzato come template per altri microservizi. Per creare un nuovo microservizio basato su questo:

1. Copia questa directory
2. Modifica il nome del servizio in package.json
3. Adatta il modello, le rotte e i controller alle tue esigenze
4. Modifica le migrazioni del database
5. Aggiorna la documentazione

## Variabili d'Ambiente

- `PORT`: Porta del server (default: 3000)
- `HOST`: Host del server (default: 0.0.0.0)
- `LOG_LEVEL`: Livello di logging (default: info)
- `JWT_SECRET`: Segreto per la firma dei token JWT
- `CORS_ORIGIN`: Configurazione CORS (default: true)
