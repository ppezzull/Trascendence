# Changelog - Aggiunta Autenticazione Google OAuth2

## Modifiche Effettuate

### 1. File di Configurazione

- ✅ Creato `env.example` con tutte le variabili d'ambiente necessarie per OAuth2
- ✅ Aggiornato `README.md` con documentazione completa sull'OAuth2
- ✅ Creato `OAUTH_INTEGRATION.md` con guida per l'integrazione frontend

### 2. Database

- ✅ Creata migrazione `migrations/0002_add_oauth.sql` che:
  - Aggiunge colonna `google_id` per memorizzare l'ID Google dell'utente
  - Aggiunge colonna `oauth_provider` per identificare il provider OAuth
  - Rende `password_hash` opzionale (NULL) per utenti OAuth
  - Crea indici per ottimizzare le query

### 3. Modelli (src/models/User.ts)

- ✅ Aggiornata interfaccia `User` con campi OAuth:
  - `google_id?: string`
  - `oauth_provider?: string`
  - `password_hash` ora opzionale
- ✅ Creata interfaccia `CreateOAuthUserRequest`
- ✅ Aggiunto metodo `findByGoogleId()` per cercare utenti per Google ID
- ✅ Aggiunto metodo `createOAuthUser()` per creare utenti OAuth
- ✅ Aggiunto metodo `linkGoogleAccount()` per collegare account Google a utenti esistenti
- ✅ Aggiornato `verifyCredentials()` per gestire utenti OAuth

### 4. Controller (src/controllers/OAuthController.ts)

- ✅ Creato nuovo controller `OAuthController` con:
  - `googleLogin()`: Inizia il flusso OAuth2
  - `googleCallback()`: Gestisce il callback da Google
  - Logica per creare nuovi utenti o collegare account esistenti
  - Generazione JWT token
  - Redirect al frontend con token

### 5. Routes (src/routes/authRoutes.ts)

- ✅ Create nuove routes OAuth:
  - `GET /api/auth/google`: Inizia autenticazione Google
  - `GET /api/auth/google/callback`: Callback Google OAuth2
  - Documentazione Swagger per entrambe le routes

### 6. Applicazione Principale (src/app.ts)

- ✅ Registrato plugin `@fastify/oauth2` con configurazione Google
- ✅ Registrate routes di autenticazione con prefisso `/api/auth`
- ✅ Aggiunto tag Swagger "Auth" per documentazione

### 7. Type Definitions (src/types/fastify.d.ts)

- ✅ Creato file di type definitions per TypeScript
- ✅ Aggiunta dichiarazione del modulo per `googleOAuth2`

## Funzionalità Implementate

### Autenticazione Doppia

- ✅ Mantiene l'autenticazione classica email/password
- ✅ Aggiunge autenticazione Google OAuth2
- ✅ Entrambi i metodi generano lo stesso tipo di JWT token

### Collegamento Account

- ✅ Se un utente con la stessa email esiste già, l'account Google viene collegato
- ✅ L'utente può accedere sia con email/password che con Google

### Creazione Automatica Utenti

- ✅ Nuovi utenti Google vengono creati automaticamente
- ✅ Username generato automaticamente dall'email
- ✅ Avatar importato da Google (se disponibile)
- ✅ Email verificata automaticamente se verificata da Google

### Sicurezza

- ✅ Utenti OAuth non possono fare login con password se non ne hanno una
- ✅ JWT token con scadenza di 7 giorni
- ✅ Validazione delle credenziali Google
- ✅ Gestione errori completa

## Configurazione Necessaria

### 1. Google Cloud Console

1. Vai su https://console.cloud.google.com/apis/credentials
2. Crea credenziali OAuth 2.0
3. Configura URI di redirect: `http://localhost:3000/api/auth/google/callback`
4. Copia Client ID e Client Secret

### 2. File .env

Crea un file `.env` basato su `env.example` e configura:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### 3. Esegui Migrazioni

```bash
npm run migrate
```

### 4. Riavvia il Server

```bash
npm run dev
```

## Testing

### Test Manuale

1. Avvia il server: `npm run dev`
2. Vai su `http://localhost:3000/api/auth/google`
3. Completa il flusso di autenticazione Google
4. Verifica di essere reindirizzato al frontend con il token

### Endpoint da Testare

- `GET /api/auth/google` - Inizia OAuth
- `GET /api/auth/google/callback` - Callback OAuth
- `POST /api/users/register` - Registrazione classica (deve continuare a funzionare)
- `POST /api/users/login` - Login classico (deve continuare a funzionare)

## Note Importanti

1. **Compatibilità**: Tutte le funzionalità esistenti continuano a funzionare
2. **Database**: La migrazione è retrocompatibile, gli utenti esistenti non vengono modificati
3. **JWT**: Il formato del token JWT è identico per entrambi i metodi di autenticazione
4. **Frontend**: Richiede implementazione di una pagina di callback OAuth (vedi OAUTH_INTEGRATION.md)

## Dipendenze

Tutte le dipendenze necessarie erano già presenti in `package.json`:

- `@fastify/oauth2` v8.1.2 (già installato)
- `@fastify/jwt` v7.2.0 (già installato)

Non sono state aggiunte nuove dipendenze.

## Prossimi Passi

Per completare l'integrazione:

1. ✅ Backend completato
2. ⏳ Implementare pagina di callback nel frontend (vedi OAUTH_INTEGRATION.md)
3. ⏳ Testare il flusso completo end-to-end
4. ⏳ Configurare URL di produzione in Google Cloud Console
5. ⏳ Testare in produzione con HTTPS

## Supporto

Per problemi o domande:

- Consulta `README.md` per la documentazione completa
- Consulta `OAUTH_INTEGRATION.md` per l'integrazione frontend
- Controlla i log del server per errori dettagliati
- Verifica la configurazione delle variabili d'ambiente
