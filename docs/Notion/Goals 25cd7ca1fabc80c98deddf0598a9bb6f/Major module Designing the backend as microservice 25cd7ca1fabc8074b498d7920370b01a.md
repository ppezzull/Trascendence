# Major module: Designing the backend as microservices.

ID: 22
Owner: Ruggero, Andrea Falconi

# 📌 Designing the Backend as Microservices

## 🎯 Obiettivo

Lo scopo di questo modulo è **architetturare il backend come insieme di microservizi indipendenti**, invece di avere un monolite unico. Ogni microservizio ha una singola responsabilità, con confini chiari e un’interfaccia stabile. Questo approccio porta a:

- **Scalabilità** (ogni servizio può scalare separatamente).
- **Manutenibilità** (il codice è più semplice e localizzato).
- **Flessibilità** (puoi sostituire o aggiornare un servizio senza toccare gli altri).
- **Deploy indipendente** (ogni microservizio ha il suo ciclo di vita e pipeline).

en.subject_trascendence

---

## 🧩 Caratteristiche richieste

Secondo il documento ufficiale del progetto, dovrai:

1. **Dividere il backend in microservizi**
    - Esempi concreti per *Transcendence*:
        - `auth-service` (registrazione, login, JWT/2FA se scegli anche il modulo Cybersecurity).
        - `user-service` (profili, avatar, stats, friend list).
        - `game-service` (gestione delle partite di Pong, tornei, matchmaking).
        - `chat-service` (messaggistica tra utenti, inviti, notifiche).
2. **Definire confini e interfacce**
    - Ogni microservizio espone una **REST API** documentata (puoi usare OpenAPI/Swagger).
    - Oppure, per comunicazioni asincrone (es. notifiche o eventi di gioco), puoi usare un **message broker** (RabbitMQ/Kafka).
3. **Implementare la comunicazione**
    - Sincrona (RESTful API con Fastify).
    - Asincrona (code di messaggi o WebSocket tra servizi, utile per gameplay in tempo reale).
4. **Responsabilità unica per servizio**
    - Niente microservizi "onnicomprensivi": ogni servizio ha un **singolo scopo ben definito**.
    - Questo semplifica debugging, testing e scaling.

en.subject_trascendence

---

## ⚙️ Stack & Tecnologie consigliate

Con lo stack che usi (Fastify + TypeScript):

- **Framework backend**: Fastify (già richiesto dal modulo *Web*en.subject_trascendence).
- **Frontend**: HTML, CSS, Tailwind, TypeScript (SPA).
- **API Gateway (opzionale)**: un servizio che fa da "entry point" e smista le richieste ai microservizi.
- **Database**: se usi SQLite (consigliato dal modulo DB), ogni microservizio può avere il proprio schema separato.
- **Containerizzazione**: Docker Compose per orchestrare i microservizi in locale.

---

## 📐 Esempio di architettura (semplificata)

```
[ API Gateway / Reverse Proxy ]
         |
  -------------------------------
  |      |          |           |
Auth   Users      Game        Chat
MS     MS         MS          MS
(Fastify) ...

```

- **Auth MS**: gestione JWT, login/logout, OAuth/2FA.
- **Users MS**: CRUD utenti, avatar, statistiche.
- **Game MS**: matchmaking, partite, tornei.
- **Chat MS**: websocket per messaggi e inviti.

---

## ✅ Deliverable attesi

Per completare bene questo modulo, dovresti avere:

1. **Microservizi Fastify indipendenti** con API REST.
2. **Specifica API** (OpenAPI/Swagger o doc scritta).
3. **Docker Compose file** per avviarli tutti insieme.
4. **Meccanismi di comunicazione** chiari (REST + WS/Eventi).
5. **Test di integrazione** tra i servizi principali.