# Minor module: Use a framework or a toolkit to build the frontend.

ID: 26
Owner: Gabriele Rinella

# Minor module — Frontend con Tailwind CSS + TypeScript

## 📖 Cosa richiede il modulo

- Il **frontend deve essere sviluppato in TypeScript**.
- In aggiunta, devi **usare Tailwind CSS come framework di styling** e *nulla oltre a questo*.
- Puoi anche sviluppare il frontend con le regole di base del mandatory part, ma il modulo viene considerato valido **solo se rispetti pienamente queste direttive**.

---

## 🎯 Obiettivi

1. **Garantire consistenza visiva** e velocità di sviluppo con **utility classes** di Tailwind CSS.
2. **Tipizzare l’intera logica frontend** con TypeScript, evitando JavaScript “vanilla” non tipizzato.
3. **Produrre una Single-Page Application (SPA)** che rispetti i requisiti del mandatory part (navigazione avanti/indietro, no errori/warning nel browser, compatibilità con Firefox).
4. **Separare le responsabilità**: HTML minimale, logica in TS, stile in classi Tailwind.

---

## ⚙️ Linee guida architetturali

- **Setup Tailwind**:
    - Inizializza con `npx tailwindcss init`.
    - Configura `tailwind.config.js` per colori, font e breakpoint personalizzati.
    - Usa `@tailwind base; @tailwind components; @tailwind utilities;` in un file `index.css`.
- **Struttura del progetto frontend** (esempio):
    
    ```
    src/
      components/
        Navbar.ts
        PongCanvas.ts
        ChatBox.ts
      pages/
        Home.ts
        Login.ts
        Tournament.ts
      styles/
        index.css   <-- contiene import Tailwind
    t
    
    ```
    
- **Routing SPA**:
    - Implementa un router in TypeScript (es. con History API).
    - Assicurati che i pulsanti *Back* e *Forward* del browser funzionino.
- **Stile con Tailwind**:
    - Classi utility (`flex`, `grid`, `rounded-xl`, `p-4`, ecc.).
    - Niente CSS esterni se non per override minimi (non violare la regola “solo Tailwind”).

---

## 📐 Esempi di UI richieste (legate al progetto)

- **Pagina Login/Register**: form con validazione TS, stili Tailwind (`shadow-lg`, `rounded-2xl`, `bg-gray-100`).
- **Lobby/Tournament view**: griglia responsive (`grid grid-cols-2 md:grid-cols-4 gap-6`) con card giocatori.
- **Pong Game view**: canvas centrale + pulsanti overlay in Tailwind.
- **Chat**: box laterale con scroll (`overflow-y-auto h-full`), messaggi allineati (`flex flex-col gap-2`).

---

## ✅ Deliverable attesi

1. **Frontend SPA** scritto in TypeScript + Tailwind.
2. **Configurazione Tailwind** (`tailwind.config.js`, `postcss.config.js`).
3. **Componenti UI** modulari (es. bottoni, navbar, card torneo).
4. **Router TS** per navigazione SPA.
5. **Compatibilità testata** su Firefox (obbligatorio) e altri browser moderni.

---

## 🚦 Criteri di accettazione

- Tutto il frontend è in **TypeScript + Tailwind** (nessun altro framework UI).
- Il sito è una **SPA** con routing funzionante.
- Non ci sono **errori o warning** in console.
- Layout responsive e coerente.
- Stili gestiti **solo tramite Tailwind classes**.