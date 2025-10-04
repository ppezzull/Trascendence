# Major module: Use advanced 3D techniques.

ID: 27
Owner: Gabriele Rinella, Eugenio Caruso

# Major module — Implementing Advanced 3D Techniques (Graphics)

## 📖 Cosa richiede il modulo

- Sostituire la semplice resa 2D del Pong con una **versione 3D immersiva**.
- **Usare Babylon.js** come motore grafico 3D.
- L’obiettivo è **aumentare la qualità visiva** e rendere l’esperienza di gioco più coinvolgente.
- La grafica non deve solo “abbellire”, ma **migliorare la user experience** mantenendo fedeltà al gameplay del Pong originale.

---

## 🎯 Obiettivi del modulo

1. **Advanced 3D Graphics**
    - Implementare rendering realistico con Babylon.js (illuminazione, ombre, materiali).
    - Aggiungere **animazioni fluide** per paddle, pallina e oggetti extra (ad esempio power-up se attivi il modulo *Game Customization*).
2. **Immersive Gameplay**
    - Creare una scena 3D che dia al giocatore la sensazione di trovarsi “dentro” al campo.
    - Possibile camera dinamica: vista dall’alto o “third-person”.
3. **Technology Integration**
    - Babylon.js si integra bene con TypeScript → avrai typing forte per mesh, materiali e scene.
    - Ottimizzazione delle performance per browser (Firefox è obbligatorio, altri opzionali).

---

## ⚙️ Linee guida architetturali

- **Struttura scena Babylon.js**:
    - **Camera**: `ArcRotateCamera` o `FollowCamera` per dare profondità.
    - **Lights**: `HemisphericLight` + `PointLight` per illuminazione realistica.
    - **Meshes**:
        - Campo → un piano texturizzato (erba, neon, legno).
        - Paddle → cubi allungati con materiali riflettenti.
        - Pallina → sfera con effetto glow o riflessione.
- **Fisica di gioco**:
    - Puoi usare la fisica base di Babylon.js (`moveWithCollisions`) o integrare Cannon.js per un rimbalzo realistico.
- **UI overlay**:
    - Tailwind per scoreboard, timer e menu → sovrapposti alla canvas Babylon.
- **Performance**:
    - Riduci poligoni (low-poly paddles e campo).
    - Usa `SceneOptimizer` di Babylon.js per regolare automaticamente qualità/effetti.

---

## 📐 Esempio architettura frontend con 3D

```
src/
  graphics/
    scene.ts         <-- setup Babylon scene
    paddle.ts        <-- mesh + movimenti
    ball.ts          <-- mesh + fisica
    arena.ts         <-- campo + texture
  game/
    gameManager.ts   <-- logica Pong
  ui/
    scoreboard.ts    <-- UI in Tailwind

```

---

## ✅ Deliverable attesi

1. **Scene 3D Babylon.js** con campo, paddles e pallina.
2. **Gameplay 3D** fluido, con movimenti sincronizzati agli input utente.
3. **Effetti visivi avanzati** (ombre, texture, glow, riflessi).
4. **Integrazione UI**: scoreboard e controlli in overlay HTML/Tailwind.
5. **Compatibilità Firefox** garantita.

---

## 🚦 Criteri di accettazione

- Il gioco è **interamente 3D** (non solo canvas 2D con texture).
- Babylon.js è usato come **motore principale** per la scena.
- La grafica migliora l’esperienza senza rompere il gameplay classico.
- Performance fluida (60fps target).
- Tutto integrato con la SPA frontend in TS + Tailwind.

---

## 🎨 Snippet di esempio (Babylon + TS)

```tsx
import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3 } from "@babylonjs/core";

export function createPongScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  // Camera
  const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // Luce
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Arena
  const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 20 }, scene);

  // Paddle
  const paddle1 = MeshBuilder.CreateBox("paddle1", { width: 1, height: 0.3, depth: 3 }, scene);
  paddle1.position.z = -8;

  const paddle2 = paddle1.clone("paddle2");
  paddle2.position.z = 8;

  // Ball
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);

  engine.runRenderLoop(() => {
    scene.render();
  });
}

```