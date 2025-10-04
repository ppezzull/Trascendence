# Minor module: Use a database for the backend.

ID: 24
Owner: Andrea Falconi

# Minor module — Database backend con SQLite

## Cosa richiede il modulo

- **Usare SQLite come database designato per *tutte* le istanze DB del progetto** (coerenza e compatibilità, e può essere prerequisito per altri moduli come il Framework backend).

> Nota di contesto progetto:
> 
> - Tutto gira in **Docker** e si lancia con un solo comando (container autonomo).
> - Mantieni credenziali/chiavi in `.env` non committato.

---

## Obiettivi pratici

1. **Progettare lo schema dati** per le feature core (utenti, profili, tornei, partite, chat, stats).
2. **Integrazione con Fastify**: layer di accesso dati tipizzato (TypeScript), transazioni e migrazioni.
3. **Packaging in Docker** con persistenza affidabile del file `.sqlite` (o directory dati) e backup.
4. **Sicurezza**: hashing password forte, input validation, HTTPS end-to-end come da requisiti security del progetto.

---

## Linee guida architetturali (consigliate)

- **“DB-per-servizio”** (se fai microservizi): ogni MS ha il suo file `.sqlite` e il suo schema, per ridurre il coupling. (Coerente con il modulo microservizi che separa responsabilità e interfacce. )
- **Migrazioni**: versiona SQL in `db/migrations/xxxx.sql` (up/down) e applicale all’avvio.
- **Transazioni & integrità**: abilita `PRAGMA foreign_keys = ON;` e usa transazioni per operazioni multi-tabella.
- **Prestazioni**: modalità WAL (`PRAGMA journal_mode = WAL;`) per concorrenza lettori/scrittori.
- **Indexing**: indicizza chiavi esterne e colonne di ricerca (es. `user_id`, `created_at`).
- **Validazione**: valida lato server ogni input (coerente con i requisiti security del subject).
- **Docker/persistenza**: monta un volume per i file `.sqlite`. Attenzione ai limiti di bind-mount in rootless; in tal caso usa volumi interni o ricostruisci l’immagine dopo le modifiche.