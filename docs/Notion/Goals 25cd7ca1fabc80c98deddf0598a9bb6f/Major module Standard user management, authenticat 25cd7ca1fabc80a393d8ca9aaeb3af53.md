# Major module: Standard user management, authentication, users across tournaments.

ID: 29
Owner: Andrea Falconi

# Major module — Standard User Management

## 📖 Requisiti (dal subject)

- **Iscrizione sicura** e **login sicuro** degli utenti.
- **Display name univoco** per partecipare ai tornei.
- **Profilo utente modificabile** (dati + avatar con default).
- **Friendship & presence** (aggiungi amici, vedi stato online).
- **Statistiche profilo** (wins/losses).
- **Match History** per utente (1v1, date, dettagli) accessibile agli utenti autenticati.
- **Gestione duplicati username/email a tua discrezione** con soluzione logica/documentata.

---

## 🏗️ Architettura proposta (Fastify + TS + SQLite + Tailwind)

- **auth-service**: registrazione, login, sessioni/JWT, reset password (se previsto), regole su duplicati.
- **user-service**: profili, avatar storage, friends/presence, statistiche aggregate, match history.
- **tournament-service** (già presente): assegna/legge display name e iscrizioni.
- **frontend SPA**: pagine Login/Signup, Profile, Friends, Match History; componenti Tailwind coerenti.

> Nota: tutte le rotte HTTPS/wss e input validati secondo i requisiti di sicurezza del progetto.
>