import * as BABYLON from "@babylonjs/core";
import { BreakoutGame } from "../graphics/BreakoutGame";

export class BreakoutCanvas {
  private canvas: HTMLCanvasElement | null = null;
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private game: BreakoutGame | null = null;
  private isRunning = false;
  private gameMode: "solo" | "pvp" | "pve" | null = null;
  private botDifficulty: "easy" | "medium" | "hard" = "medium";

  constructor() {
    this.game = new BreakoutGame();
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="relative w-full h-full">
        <!-- Game Mode Selection Screen -->
        <div id="breakout-game-mode-selection" class="absolute inset-0 bg-cyber-black/90 flex items-center justify-center z-10">
        
        <!-- Game Canvas -->
        <canvas id="breakout-canvas" class="w-full h-full rounded border border-cyber-green"></canvas>
        
        <!-- Game HUD -->
        <div id="breakout-hud" class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none">
          <div class="cyber-panel px-3 py-1">
            <span class="text-cyber-green font-mono">PUNTEGGIO: <span id="breakout-score">0</span></span>
          </div>
          <div class="cyber-panel px-3 py-1">
            <span class="text-cyber-green font-mono">LIVELLO: <span id="breakout-level">1</span></span>
          </div>
          <div class="cyber-panel px-3 py-1">
            <span id="breakout-lives-label" class="text-cyber-green font-mono">VITE: </span>
            <span id="breakout-lives" class="text-cyber-green font-mono">3</span>
          </div>
        </div>
        
        <!-- Game Controls -->
        <div id="breakout-controls" class="absolute bottom-0 left-0 right-0 p-4 flex justify-center space-x-4 hidden">
          <button id="start-breakout-btn" class="cyber-button hidden">Inizia Partita</button>
          <button id="pause-breakout-btn" class="cyber-button hidden">Pausa</button>
          <button id="resume-breakout-btn" class="cyber-button hidden">Riprendi</button>
          <button id="reset-breakout-btn" class="cyber-button hidden">Reset</button>
          <button id="breakout-change-mode-btn" class="cyber-button hidden">Cambia Modalità</button>
        </div>
        
        <!-- Game Over Screen -->
        <div id="breakout-game-over" class="absolute inset-0 bg-cyber-black/80 flex items-center justify-center hidden">
          <div class="cyber-panel p-8 text-center">
            <h2 class="cyber-title text-2xl mb-4">PARTITA TERMINATA</h2>
            <p class="terminal-text mb-2">Punteggio finale: <span id="breakout-final-score" class="text-cyber-cyan font-bold">0</span></p>
            <p class="terminal-text mb-2">Livello raggiunto: <span id="breakout-final-level" class="text-cyber-cyan font-bold">1</span></p>
            <p class="terminal-text mb-6">Vincitore: <span id="breakout-winner-text" class="text-cyber-cyan font-bold"></span></p>
            <div class="flex justify-center space-x-4">
              <button id="breakout-play-again-btn" class="cyber-button">Gioca Ancora</button>
              <button id="breakout-change-mode-after-game" class="cyber-button">Cambia Modalità</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize canvas and game
    this.initializeCanvas();
    this.addEventListeners();
  }

  private initializeCanvas() {
    this.canvas = document.getElementById(
      "breakout-canvas"
    ) as HTMLCanvasElement;
    if (!this.canvas) return;

    // Initialize Babylon.js engine
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // Create scene
    this.createScene();

    // Initialize game
    if (this.scene && this.game) {
      this.game.initialize(this.scene, this.engine);
      this.game.setScoreCallback((score, level, lives) => {
        this.updateScore(score, level, lives);
      });
    }

    // Handle window resize
    window.addEventListener("resize", this.handleResize.bind(this));

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render();
      }
    });
  }

  private createScene() {
    if (!this.engine) return;

    // Create a new scene
    this.scene = new BABYLON.Scene(this.engine);

    // Set scene background color
    this.scene.clearColor = new BABYLON.Color4(0.04, 0.04, 0.04, 1); // Dark cyber background

    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2, // Alpha
      Math.PI / 3, // Beta (higher angle for better view of bricks)
      25, // Radius (further away to see all bricks)
      BABYLON.Vector3.Zero(), // Target
      this.scene
    );
    camera.attachControl(this.canvas, true);

    // Create lights
    const light1 = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    light1.intensity = 0.7;

    const light2 = new BABYLON.PointLight(
      "light2",
      new BABYLON.Vector3(0, 10, 0),
      this.scene
    );
    light2.intensity = 0.5;
    light2.diffuse = new BABYLON.Color3(0, 1, 0.25); // Cyber green light

    // Create cyber grid ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 20, height: 20 },
      this.scene
    );

    const groundMaterial = new BABYLON.StandardMaterial(
      "groundMaterial",
      this.scene
    );
    groundMaterial.diffuseColor = new BABYLON.Color3(0.04, 0.04, 0.04);
    groundMaterial.specularColor = new BABYLON.Color3(0, 1, 0.25);
    groundMaterial.emissiveColor = new BABYLON.Color3(0, 0.1, 0.025);

    // Create grid texture
    const gridTexture = new BABYLON.DynamicTexture(
      "gridTexture",
      512,
      this.scene
    );
    const context = gridTexture.getContext();

    // Draw grid lines
    context.strokeStyle = "#00ff41";
    context.lineWidth = 1;
    context.fillStyle = "#0a0a0a";
    context.fillRect(0, 0, 512, 512);

    // Draw horizontal lines
    for (let i = 0; i <= 512; i += 32) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(512, i);
      context.stroke();
    }

    // Draw vertical lines
    for (let i = 0; i <= 512; i += 32) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 512);
      context.stroke();
    }

    gridTexture.update();

    groundMaterial.diffuseTexture = gridTexture;
    ground.material = groundMaterial;

    // Create cyber walls
    this.createWalls();
  }

  private createWalls() {
    if (!this.scene) return;

    const wallMaterial = new BABYLON.StandardMaterial(
      "wallMaterial",
      this.scene
    );
    wallMaterial.diffuseColor = new BABYLON.Color3(0.04, 0.04, 0.04);
    wallMaterial.specularColor = new BABYLON.Color3(0, 1, 0.25);
    wallMaterial.emissiveColor = new BABYLON.Color3(0, 0.05, 0.0125);
    wallMaterial.alpha = 0.7;

    // Create walls
    const wallThickness = 0.2;
    const wallHeight = 5;
    const arenaSize = 20;

    // Side walls
    const leftWall = BABYLON.MeshBuilder.CreateBox(
      "leftWall",
      { width: wallThickness, height: wallHeight, depth: arenaSize },
      this.scene
    );
    leftWall.position.x = -arenaSize / 2;
    leftWall.material = wallMaterial;

    const rightWall = BABYLON.MeshBuilder.CreateBox(
      "rightWall",
      { width: wallThickness, height: wallHeight, depth: arenaSize },
      this.scene
    );
    rightWall.position.x = arenaSize / 2;
    rightWall.material = wallMaterial;

    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox(
      "topWall",
      { width: arenaSize, height: wallHeight, depth: wallThickness },
      this.scene
    );
    topWall.position.z = -arenaSize / 2;
    topWall.material = wallMaterial;
  }

  private addEventListeners() {
    // Game mode selection
    const soloModeBtn = document.getElementById("breakout-solo-mode");
    const pvpModeBtn = document.getElementById("breakout-pvp-mode");
    const startSelectedModeBtn = document.getElementById(
      "breakout-start-selected-mode"
    );

    if (soloModeBtn) {
      soloModeBtn.addEventListener("click", () => {
        this.gameMode = "solo";
        this.showGameModeSelection();
      });
    }

    if (pvpModeBtn) {
      pvpModeBtn.addEventListener("click", () => {
        this.gameMode = "pvp";
        this.showGameModeSelection();
      });
    }

    if (startSelectedModeBtn) {
      startSelectedModeBtn.addEventListener("click", () => {
        this.startSelectedGameMode();
      });
    }

    // Game control buttons
    const startBtn = document.getElementById("start-breakout-btn");
    const pauseBtn = document.getElementById("pause-breakout-btn");
    const resumeBtn = document.getElementById("resume-breakout-btn");
    const resetBtn = document.getElementById("reset-breakout-btn");
    const changeModeBtn = document.getElementById("breakout-change-mode-btn");
    const playAgainBtn = document.getElementById("breakout-play-again-btn");
    const changeModeAfterGameBtn = document.getElementById(
      "breakout-change-mode-after-game"
    );

    if (startBtn) {
      startBtn.addEventListener("click", () => this.startGame());
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => this.pauseGame());
    }

    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => this.resumeGame());
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetGame());
    }

    if (changeModeBtn) {
      changeModeBtn.addEventListener("click", () =>
        this.showGameModeSelection()
      );
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        this.hideGameOver();
        this.resetGame();
        this.startGame();
      });
    }

    if (changeModeAfterGameBtn) {
      changeModeAfterGameBtn.addEventListener("click", () => {
        this.hideGameOver();
        this.showGameModeSelection();
      });
    }

    // Keyboard controls
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private showGameModeSelection() {
    const modeSelection = document.getElementById(
      "breakout-game-mode-selection"
    );
    const startSelectedModeBtn = document.getElementById(
      "breakout-start-selected-mode"
    );

    if (modeSelection) modeSelection.classList.remove("hidden");

    if (this.gameMode && startSelectedModeBtn) {
      startSelectedModeBtn.classList.remove("hidden");
    }
  }

  private updateBotDifficultySelection() {
    const botEasyBtn = document.getElementById("breakout-bot-easy");
    const botMediumBtn = document.getElementById("breakout-bot-medium");
    const botHardBtn = document.getElementById("breakout-bot-hard");

    // Reset all buttons
    if (botEasyBtn)
      botEasyBtn.classList.remove("bg-cyber-green", "text-cyber-black");
    if (botMediumBtn)
      botMediumBtn.classList.remove("bg-cyber-green", "text-cyber-black");
    if (botHardBtn)
      botHardBtn.classList.remove("bg-cyber-green", "text-cyber-black");

    // Highlight selected difficulty
    if (this.botDifficulty === "easy" && botEasyBtn) {
      botEasyBtn.classList.add("bg-cyber-green", "text-cyber-black");
    } else if (this.botDifficulty === "medium" && botMediumBtn) {
      botMediumBtn.classList.add("bg-cyber-green", "text-cyber-black");
    } else if (this.botDifficulty === "hard" && botHardBtn) {
      botHardBtn.classList.add("bg-cyber-green", "text-cyber-black");
    }
  }

  private startSelectedGameMode() {
    const modeSelection = document.getElementById(
      "breakout-game-mode-selection"
    );
    const gameControls = document.getElementById("breakout-controls");
    const livesLabel = document.getElementById("breakout-lives-label");

    if (modeSelection) modeSelection.classList.add("hidden");
    if (gameControls) gameControls.classList.remove("hidden");

    // Update lives label based on game mode
    if (livesLabel) {
      if (this.gameMode === "solo") {
        livesLabel.textContent = "VITE: ";
      } else if (this.gameMode === "pvp") {
        livesLabel.textContent = "VITE G1: ";
      }
    }

    // Configure game based on mode
    if (this.game && this.gameMode) {
      this.game.setGameMode(this.gameMode);
    }

    // Start game
    this.startGame();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.game || !this.isRunning) return;

    // Player 1 controls (Arrow keys)
    switch (event.key) {
      case "ArrowLeft":
        this.game.movePaddleLeft();
        break;
      case "ArrowRight":
        this.game.movePaddleRight();
        break;
    }

    // Player 2 controls (A/D) - only in PvP mode
    if (this.gameMode === "pvp") {
      switch (event.key) {
        case "a":
        case "A":
          this.game.moveSecondPaddleLeft();
          break;
        case "d":
        case "D":
          this.game.moveSecondPaddleRight();
          break;
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (!this.game || !this.isRunning) return;

    // Player 1 controls (Arrow keys)
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        this.game.stopPaddle();
        break;
    }

    // Player 2 controls (A/D) - only in PvP mode
    if (this.gameMode === "pvp") {
      switch (event.key) {
        case "a":
        case "A":
        case "d":
        case "D":
          this.game.stopSecondPaddle();
          break;
      }
    }
  }

  public startGame() {
    if (!this.game) return;

    this.isRunning = true;
    this.game.start();

    // Update UI
    document.getElementById("start-breakout-btn")?.classList.add("hidden");
    document.getElementById("pause-breakout-btn")?.classList.remove("hidden");
    document
      .getElementById("breakout-change-mode-btn")
      ?.classList.add("hidden");

    // Show appropriate controls based on game mode
    if (this.gameMode === "solo") {
      // Solo mode - show standard controls
      document.getElementById("reset-breakout-btn")?.classList.remove("hidden");
    } else if (this.gameMode === "pvp") {
      // PvP mode - show standard controls
      document.getElementById("reset-breakout-btn")?.classList.remove("hidden");
    }
  }

  public setGameMode(
    mode: "solo" | "pvp" | "pve",
    difficulty?: "easy" | "medium" | "hard"
  ) {
    this.gameMode = mode;
    if (difficulty) {
      this.botDifficulty = difficulty;
    }

    // Update game mode in the game instance
    if (this.game) {
      this.game.setGameMode(mode, difficulty);
    }
  }

  public pauseGame() {
    if (!this.game) return;

    this.isRunning = false;
    this.game.pause();

    // Update UI
    document.getElementById("pause-breakout-btn")?.classList.add("hidden");
    document.getElementById("resume-breakout-btn")?.classList.remove("hidden");
  }

  public resumeGame() {
    if (!this.game) return;

    this.isRunning = true;
    this.game.resume();

    // Update UI
    document.getElementById("resume-breakout-btn")?.classList.add("hidden");
    document.getElementById("pause-breakout-btn")?.classList.remove("hidden");
  }

  public resetGame() {
    if (!this.game) return;

    this.isRunning = false;
    this.game.reset();

    // Update UI
    document.getElementById("start-breakout-btn")?.classList.remove("hidden");
    document.getElementById("pause-breakout-btn")?.classList.add("hidden");
    document.getElementById("resume-breakout-btn")?.classList.add("hidden");
    document
      .getElementById("breakout-change-mode-btn")
      ?.classList.remove("hidden");

    // Show appropriate controls based on game mode
    if (this.gameMode === "solo") {
      // Solo mode - show standard controls
      document.getElementById("reset-breakout-btn")?.classList.remove("hidden");
    } else if (this.gameMode === "pvp") {
      // PvP mode - show standard controls
      document.getElementById("reset-breakout-btn")?.classList.remove("hidden");
    }

    // Reset scores
    const scoreElement = document.getElementById("breakout-score");
    const levelElement = document.getElementById("breakout-level");
    const livesElement = document.getElementById("breakout-lives");

    if (scoreElement) scoreElement.textContent = "0";
    if (levelElement) levelElement.textContent = "1";
    if (livesElement) livesElement.textContent = "3";
  }

  public dispose() {
    // Stop the game
    if (this.game) {
      this.game.pause();
    }

    // Dispose of Babylon.js resources
    if (this.scene) {
      this.scene.dispose();
    }

    if (this.engine) {
      this.engine.dispose();
    }

    // Clear references
    this.game = null;
    this.scene = null;
    this.engine = null;
    this.canvas = null;

    // Remove event listeners if any
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  updateScore(score: number, level: number, lives: number) {
    const scoreElement = document.getElementById("breakout-score");
    const levelElement = document.getElementById("breakout-level");
    const livesElement = document.getElementById("breakout-lives");

    if (scoreElement) scoreElement.textContent = score.toString();
    if (levelElement) levelElement.textContent = level.toString();
    if (livesElement) livesElement.textContent = lives.toString();

    // Check for game over
    if (lives <= 0) {
      let winner = "NESSUNO";
      if (this.gameMode === "pvp") {
        // In PvP mode, other player wins
        winner = "PLAYER 2";
      }

      this.showGameOver(score, level, winner);
      this.isRunning = false;
    }

    // Check for game completion (all levels finished)
    if (level > 5) {
      let winner = "COMPLETATO!";
      if (this.gameMode === "solo") {
        winner = "HAI VINTO!";
      } else if (this.gameMode === "pvp") {
        winner = "PAREGGIO COMPLETATO!";
      }

      this.showGameOver(score, level, winner);
      this.isRunning = false;
    }
  }

  private showGameOver(score: number, level: number, winner: string) {
    const gameOverScreen = document.getElementById("breakout-game-over");
    const finalScoreElement = document.getElementById("breakout-final-score");
    const finalLevelElement = document.getElementById("breakout-final-level");
    const winnerTextElement = document.getElementById("breakout-winner-text");

    if (gameOverScreen) gameOverScreen.classList.remove("hidden");
    if (finalScoreElement) finalScoreElement.textContent = score.toString();
    if (finalLevelElement) finalLevelElement.textContent = level.toString();
    if (winnerTextElement) winnerTextElement.textContent = winner;

    // Update UI
    document.getElementById("pause-breakout-btn")?.classList.add("hidden");
    document.getElementById("resume-breakout-btn")?.classList.add("hidden");
    document
      .getElementById("breakout-change-mode-btn")
      ?.classList.add("hidden");

    // Show appropriate message based on winner
    let message = "PARTITA TERMINATA";
    if (winner === "HAI VINTO!" || winner === "PAREGGIO COMPLETATO!") {
      message = "COMPLIMENTI!";
    }

    // Update title
    const titleElement = gameOverScreen?.querySelector("h2");
    if (titleElement) titleElement.textContent = message;
  }

  private hideGameOver() {
    const gameOverScreen = document.getElementById("breakout-game-over");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
  }

  private handleResize() {
    if (this.engine) {
      this.engine.resize();
    }
  }
}
