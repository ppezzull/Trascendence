# Trascendence Frontend

Frontend cyberpunk per la piattaforma di gaming Trascendence, sviluppato con TypeScript vanilla, Tailwind CSS e Babylon.js.

## Caratteristiche

- **Design Cyberpunk**: Interfaccia utente con estetica futuristica e colori neon
- **Giochi 3D**: Pong 3D con grafica avanzata utilizzando Babylon.js
- **Chat Live**: Sistema di messaggistica in tempo reale
- **Routing SPA**: Navigazione fluida senza ricaricare la pagina
- **Responsive Design**: Compatibile con desktop e dispositivi mobili

## Tecnologie

- **TypeScript**: Per la logica dell'applicazione
- **Tailwind CSS**: Per lo stile e il design
- **Babylon.js**: Per la grafica 3D
- **Vite**: Come bundler per lo sviluppo
- **Yarn**: Gestore pacchetti

## Setup

1. Installa le dipendenze:
```bash
yarn install
```

2. Crea un file `.env` basato su `.env.example`:
```bash
cp .env.example .env
```

3. Avvia il server di sviluppo:
```bash
yarn dev
```

4. Apri il browser all'indirizzo `http://localhost:3000`

## Struttura del Progetto

```
src/
├── components/       # Componenti UI
├── graphics/         # Logica dei giochi 3D
├── router/           # Sistema di routing
├── services/         # Servizi API
├── styles/           # Stili CSS
├── App.tsx           # Componente principale
└── main.ts           # Punto di ingresso
```

## Giochi

### Pong 3D

- **Controlli Giocatore 1**: W (su), S (giù)
- **Controlli Giocatore 2**: Freccia su (su), Freccia giù (giù)
- **Obiettivo**: Primo a segnare 5 punti vince

### Breakout Cyber

- **Controlli**: Freccia sinistra/destra per muovere il paddle
- **Obiettivo**: Distruggi tutti i mattoni e completare i livelli
- **Power-up**: Raccogli power-up per vantaggi speciali

## Comandi

- `yarn dev`: Avvia il server di sviluppo
- `yarn build`: Compila il progetto per produzione
- `yarn preview`: Anteprima del build di produzione

## Personalizzazione

Il tema cyberpunk può essere personalizzato modificando i file:

- `tailwind.config.js`: Per i colori e le animazioni
- `src/styles/index.css`: Per gli stili personalizzati

## Comunicazione con Backend

Il frontend comunica con i microservizi backend tramite API REST:

- `auth-service`: Autenticazione e gestione sessioni
- `user-service`: Profili utenti e statistiche
- `game-service`: Gestione partite e tornei
- `chat-service`: Messaggistica e notifiche
- `blockchain-service`: Punteggi torneo su blockchain

## Note sullo Sviluppo

- **Framework**: TypeScript vanilla (nessun framework UI come React/Vue)
- **Bundler**: Vite per sviluppo veloce e build ottimizzato
- **Stile**: Tailwind CSS per design system cyberpunk
- **Grafica 3D**: Babylon.js per rendering WebGL
- **Package Manager**: Yarn per gestione dipendenze

## Licenza

MIT
