import { Router } from "./router/Router";
import { Navbar } from "./components/Navbar";
import { ApiService } from "./services/ApiService";
import { authService } from "./services/AuthService";
import { createAuthGuard } from "./components/AuthGuard";
import { PongCanvas } from "./components/PongCanvas";
import { ChatBox } from "./components/ChatBox";
import { BreakoutCanvas } from "./components/BreakoutCanvas";
import { GameSettingsComponent } from "./components/GameSettings";
import {
  GameModeSelector,
  GameMode,
  BotDifficulty,
} from "./components/GameModeSelector";
import {
  GameSettingsPanel,
  GameSettings,
} from "./components/GameSettingsPanel";
import { GameControls } from "./components/GameControls";

// Declare global app instance for button onclick handlers
declare global {
  interface Window {
    app: App;
    chatBox: ChatBox;
  }
}

export class App {
  private router: Router;
  private apiService: ApiService;
  private chatBox: ChatBox | null = null;
  private navbar: Navbar | null = null;

  constructor() {
    this.router = new Router();
    this.apiService = new ApiService();
  }

  mount(selector: string) {
    const appElement = document.querySelector(selector);
    if (!appElement) {
      throw new Error(`Element with selector ${selector} not found`);
    }

    // Create main app structure
    appElement.innerHTML = `
      <div class="flex flex-col min-h-screen">
        <!-- Navigation -->
        <header id="navbar" class="bg-cyber-dark/90 backdrop-blur-sm border-b border-cyber-green sticky top-0 z-40">
          <!-- Navbar will be rendered here -->
        </header>
        
        <!-- Main content -->
        <main class="flex-1">
          <div id="content" class="container mx-auto px-4 py-8">
            <!-- Page content will be rendered here -->
          </div>
        </main>
        
        <!-- Footer -->
        <footer class="bg-cyber-dark/90 border-t border-cyber-green p-4 text-center">
          <p class="text-cyber-green text-sm">© 2025 Trascendence - Cyber Gaming Platform</p>
        </footer>
      </div>
    `;

    // Initialize components
    this.initializeComponents();

    // Setup routing
    this.setupRouting();

    // Make app instance globally available for button onclick handlers
    window.app = this;
  }

  private initializeComponents() {
    // Initialize navbar
    const navbarElement = document.getElementById("navbar");
    if (navbarElement) {
      this.navbar = new Navbar();

      // Get current user data if authenticated
      const authState = authService.getState();
      const username = authState.user?.username || null;

      // Render navbar with username if available
      this.navbar.render(navbarElement, username || undefined);
    }

    // Subscribe to auth state changes to update navbar when user logs in/out
    authService.subscribe((authState) => {
      if (this.navbar && authState.isAuthenticated && authState.user) {
        const username = authState.user.username || "CyberPlayer";
        this.navbar.updateUsername(username);
      }
    });
  }

  private setupRouting() {
    // Initialize router with routes
    this.router.addRoute("/", () => this.renderHomePage());
    this.router.addRoute("/login", () => this.renderLoginPage());
    this.router.addRoute("/register", () => this.renderRegisterPage());
    this.router.addRoute("/games", () => this.renderGamesPage());
    this.router.addRoute("/pong", () => this.renderPongPage());
    this.router.addRoute("/breakout", () => this.renderBreakoutPage());
    this.router.addRoute("/tournaments", () => this.renderTournamentsPage());
    this.router.addRoute("/tournament/:id", (params: any) =>
      this.renderTournamentDetailsPage(params.id)
    );
    this.router.addRoute("/chat", () => this.renderChatPage());
    this.router.addRoute("/profile", () => this.renderProfilePage());
    this.router.addRoute("/settings", () => this.renderSettingsPage());

    // Handle 404
    this.router.setNotFoundCallback(() => this.renderNotFoundPage());

    // Start routing
    this.router.start();
  }

  private renderHomePage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center text-4xl mb-8">TRASCENDENCE</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Benvenuto nella Piattaforma Cyber</h2>
            <p class="terminal-text mb-4">
              Entra nel mondo dei giochi retrò-futuristici con grafica cyberpunk e sfida altri giocatori in partite epiche.
            </p>
            <div class="flex flex-col space-y-3">
              <a href="/login" class="cyber-button text-center">Accedi</a>
              <a href="/register" class="cyber-button text-center">Registrati</a>
            </div>
          </div>
          
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Giochi Disponibili</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>Pong 3D</span>
                <a href="/pong" class="cyber-button text-sm">Gioca</a>
              </div>
              <div class="flex items-center justify-between">
                <span>Breakout Cyber</span>
                <a href="/breakout" class="cyber-button text-sm">Gioca</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderLoginPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-md mx-auto">
        <h1 class="cyber-title text-center">ACCESSO</h1>
        <form id="login-form" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-cyber-green mb-1">Email</label>
            <input type="email" id="email" name="email" class="cyber-input" required>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-cyber-green mb-1">Password</label>
            <input type="password" id="password" name="password" class="cyber-input" required>
          </div>
          <button type="submit" class="cyber-button w-full">Accedi</button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-sm">Non hai un account? <a href="/register" class="text-cyber-cyan hover:underline">Registrati</a></p>
        </div>
      </div>
    `;

    // Add form submission handler
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }
  }

  private renderRegisterPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-md mx-auto">
        <h1 class="cyber-title text-center">REGISTRAZIONE</h1>
        <form id="register-form" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-cyber-green mb-1">Username</label>
            <input type="text" id="username" name="username" class="cyber-input" required>
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-cyber-green mb-1">Email</label>
            <input type="email" id="email" name="email" class="cyber-input" required>
          </div>
          <div>
            <label for="display-name" class="block text-sm font-medium text-cyber-green mb-1">Nome Visualizzato</label>
            <input type="text" id="display-name" name="display-name" class="cyber-input" required>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-cyber-green mb-1">Password</label>
            <input type="password" id="password" name="password" class="cyber-input" required>
            <p class="text-xs text-gray-400 mt-1">
              La password deve contenere almeno 8 caratteri, una lettera maiuscola, una lettera minuscola e un numero
            </p>
          </div>
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-cyber-green mb-1">Conferma Password</label>
            <input type="password" id="confirm-password" name="confirm-password" class="cyber-input" required>
          </div>
          <button type="submit" class="cyber-button w-full">Registrati</button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-sm">Hai già un account? <a href="/login" class="text-cyber-cyan hover:underline">Accedi</a></p>
        </div>
      </div>
    `;

    // Add form submission handler
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", this.handleRegister.bind(this));
    }
  }

  private renderGamesPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">SELEZIONA GIOCO</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">PONG 3D</h2>
            <p class="terminal-text mb-4">Il classico gioco Pong con grafica 3D e stile cyberpunk</p>
            <a href="/pong" class="cyber-button inline-block">Gioca Ora</a>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">BREAKOUT CYBER</h2>
            <p class="terminal-text mb-4">Distruggi i mattoni in un'arena futuristica con effetti speciali</p>
            <a href="/breakout" class="cyber-button inline-block">Gioca Ora</a>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEI CYBER</h2>
            <p class="terminal-text mb-4">Partecipa a tornei epici e diventa il campione della piattaforma</p>
            <a href="/tournaments" class="cyber-button inline-block">Scopri Tornei</a>
          </div>
        </div>
      </div>
    `;
  }

  private renderPongPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">PONG 3D</h1>
        
        <!-- Game State Container -->
        <div id="pong-game-container" class="flex flex-col items-center">
          <div class="cyber-card w-full max-w-2xl">
            <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">CARICAMENTO...</h2>
            <div class="text-center text-cyber-green">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
              <p class="mt-2">Inizializzazione gioco in corso...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Pong game with state management after a short delay
    setTimeout(() => {
      this.initializePongGameWithStates();
    }, 100);
  }

  private initializePongGameWithStates() {
    console.log("Initializing Pong game with states...");
    const gameContainer = document.getElementById("pong-game-container");
    if (!gameContainer) {
      console.error("Pong game container not found!");
      return;
    }

    console.log("Pong game container found, rendering selection state...");

    // Define game modes
    const gameModes: GameMode[] = [
      {
        id: "pvp",
        name: "1 VS 1",
        description: "Sfida un altro giocatore sullo stesso dispositivo",
        icon: "fas fa-users",
      },
      {
        id: "pve",
        name: "1 VS BOT",
        description: "Sfida l'IA con diversi livelli di difficoltà",
        icon: "fas fa-robot",
      },
    ];

    // Define bot difficulties
    const botDifficulties: BotDifficulty[] = [
      {
        id: "easy",
        name: "Facile",
        description: "Velocità di risposta ridotta",
      },
      {
        id: "medium",
        name: "Medio",
        description: "Velocità di risposta normale",
      },
      {
        id: "hard",
        name: "Difficile",
        description: "Velocità di risposta elevata",
      },
    ];

    // Start with selection state
    console.log("Calling renderPongSelectionState...");
    this.renderPongSelectionState(gameContainer, gameModes, botDifficulties);
  }

  private renderPongSelectionState(
    container: HTMLElement,
    gameModes: GameMode[],
    botDifficulties: BotDifficulty[]
  ) {
    console.log("Rendering Pong selection state...");

    container.innerHTML = `
      <div class="cyber-card w-full max-w-2xl">
        <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">SELEZIONA MODALITÀ</h2>
        <div class="space-y-4">
          ${gameModes
            .map(
              (mode, index) => `
            <div class="mode-option border border-cyber-green rounded p-4 cursor-pointer hover:bg-cyber-dark/50 transition-colors" data-mode="${
              mode.id
            }">
              <div class="flex items-center">
                ${
                  mode.icon
                    ? `<i class="${mode.icon} text-cyber-green mr-3"></i>`
                    : ""
                }
                <div class="flex-1">
                  <h3 class="text-md font-bold text-cyber-green">${
                    mode.name
                  }</h3>
                  <p class="text-sm text-gray-400">${mode.description}</p>
                </div>
                <div class="mode-radio">
                  <input type="radio" name="game-mode" value="${
                    mode.id
                  }" class="sr-only">
                  <div class="w-5 h-5 border-2 border-cyber-green rounded-full flex items-center justify-center radio-indicator" data-mode-index="${index}">
                    <div class="w-3 h-3 border-2 border-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
              ${
                mode.id === "pve" && botDifficulties
                  ? `
                <div class="difficulty-selector mt-4 hidden" id="difficulty-options">
                  <h4 class="text-sm font-bold text-cyber-green mb-2">Seleziona difficoltà:</h4>
                  <div class="grid grid-cols-3 gap-2">
                    ${botDifficulties
                      .map(
                        (difficulty) => `
                      <div class="difficulty-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-difficulty="${difficulty.id}">
                        <input type="radio" name="bot-difficulty" value="${difficulty.id}" class="sr-only">
                        <div class="text-sm">${difficulty.name}</div>
                        <div class="text-xs text-gray-400">${difficulty.description}</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
        <div class="mt-6 text-center">
          <button id="start-game-btn" class="cyber-button" disabled> Avanti </button>
        </div>
      </div>
    `;

    this.setupPongGameModeEventListeners(container);

    // Add CSS styles for radio buttons
    const style = document.createElement("style");
    style.textContent = `
      .radio-indicator {
        transition: all 0.2s ease;
      }
      .mode-option[data-mode]:hover .radio-indicator {
        border-color: #00ffff;
      }
      .mode-option.selected .radio-indicator > div {
        background-color: #00ff00;
        border-color: #00ff00;
      }
      .difficulty-option:hover {
        border-color: #00ffff;
        background-color: rgba(0, 255, 255, 0.1);
      }
      .difficulty-option.selected {
        border-color: #00ffff;
        background-color: rgba(0, 255, 255, 0.2);
      }
    `;
    document.head.appendChild(style);
  }

  private setupPongGameModeEventListeners(container: HTMLElement) {
    // Mode selection
    const modeOptions = container.querySelectorAll(".mode-option");
    modeOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const modeId = option.getAttribute("data-mode");
        if (modeId) {
          this.selectPongGameMode(modeId, container);
        }
      });
    });

    // Difficulty selection (for PVE mode)
    const difficultyOptions = container.querySelectorAll(".difficulty-option");
    difficultyOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const difficultyId = option.getAttribute("data-difficulty");
        if (difficultyId) {
          this.selectPongBotDifficulty(difficultyId, container);
        }
      });
    });

    // Start button
    const startButton = container.querySelector(
      "#start-game-btn"
    ) as HTMLButtonElement;
    if (startButton) {
      startButton.addEventListener("click", () => {
        if (this.currentPongMode) {
          this.onPongModeSelectedUpdated(
            this.currentPongMode,
            this.currentPongDifficulty || undefined
          );
        }
      });
    }
  }

  private selectPongGameMode(modeId: string, container: HTMLElement) {
    // Update visual selection
    const modeOptions = container.querySelectorAll(".mode-option");
    modeOptions.forEach((option) => {
      const optionModeId = option.getAttribute("data-mode");
      const radio = option.querySelector(
        'input[type="radio"]'
      ) as HTMLInputElement;
      const radioIndicator = option.querySelector(
        ".mode-radio > div"
      ) as HTMLElement;

      if (optionModeId === modeId) {
        radio.checked = true;
        radioIndicator.classList.remove("border-transparent");
        radioIndicator.classList.add("bg-cyber-green");
        option.classList.add(
          "border-cyber-cyan",
          "bg-cyber-dark/30",
          "selected"
        );
      } else {
        radio.checked = false;
        radioIndicator.classList.add("border-transparent");
        radioIndicator.classList.remove("bg-cyber-green");
        option.classList.remove(
          "border-cyber-cyan",
          "bg-cyber-dark/30",
          "selected"
        );
      }
    });

    this.currentPongMode = modeId;

    // Show/hide difficulty options based on mode
    const difficultyOptions = container.querySelector(
      "#difficulty-options"
    ) as HTMLElement;
    if (difficultyOptions) {
      if (modeId === "pve") {
        difficultyOptions.classList.remove("hidden");
      } else {
        difficultyOptions.classList.add("hidden");
        this.currentPongDifficulty = undefined;
      }
    }

    this.updatePongStartButton(container);
  }

  private selectPongBotDifficulty(
    difficultyId: string,
    container: HTMLElement
  ) {
    // Update visual selection
    const difficultyOptions = container.querySelectorAll(".difficulty-option");
    difficultyOptions.forEach((option) => {
      const optionDifficultyId = option.getAttribute("data-difficulty");
      const radio = option.querySelector(
        'input[type="radio"]'
      ) as HTMLInputElement;

      if (optionDifficultyId === difficultyId) {
        radio.checked = true;
        option.classList.add(
          "border-cyber-cyan",
          "bg-cyber-dark/30",
          "selected"
        );
      } else {
        radio.checked = false;
        option.classList.remove(
          "border-cyber-cyan",
          "bg-cyber-dark/30",
          "selected"
        );
      }
    });

    this.currentPongDifficulty = difficultyId;
    this.updatePongStartButton(container);
  }

  private updatePongStartButton(container: HTMLElement) {
    const startButton = container.querySelector(
      "#start-game-btn"
    ) as HTMLButtonElement;
    if (!startButton) return;

    let canStart = this.currentPongMode !== null;

    // For PVE mode, difficulty must also be selected
    if (this.currentPongMode === "pve" && !this.currentPongDifficulty) {
      canStart = false;
    }

    startButton.disabled = !canStart;
  }

  private renderPongPreparationState(
    container: HTMLElement,
    mode: string,
    difficulty?: string
  ) {
    container.innerHTML = `
      <div class="w-full flex flex-col items-center justify-center py-8">
        <!-- Title -->
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-cyber-green">
            ${
              mode === "pvp"
                ? "PARTITA 1 VS 1"
                : `PARTITA 1 VS BOT (${difficulty?.toUpperCase()})`
            }
          </h2>
        </div>
        
        <!-- Game Preview -->
        <div class="cyber-card w-full max-w-6xl mb-6">
          <h3 class="text-lg font-bold text-cyber-green mb-4 text-center">ANTEPRIMA GIOCO</h3>
          <div id="pong-canvas-container" class="w-full h-[500px] bg-cyber-black border border-cyber-green">
            <!-- 3D Canvas will be rendered here -->
          </div>
          </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <button id="start-pong-game" class="cyber-button px-8 py-3 text-lg">Inizia Partita</button>
          <button id="back-to-selection" class="cyber-button-secondary px-8 py-3 text-lg">Indietro</button>
        </div>
      </div>
    `;

    // Initialize canvas
    const canvasContainer = document.getElementById("pong-canvas-container");
    if (canvasContainer) {
      this.currentPongCanvas = new PongCanvas();
      this.currentPongCanvas.render(canvasContainer);
      this.currentPongCanvas.setGameMode(
        mode as "pvp" | "pve",
        difficulty as "easy" | "medium" | "hard"
      );
    }

    // Setup event listeners
    const startButton = document.getElementById("start-pong-game");
    if (startButton) {
      startButton.addEventListener("click", () => {
        this.startPongGame(mode, difficulty);
      });
    }

    const backButton = document.getElementById("back-to-selection");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.initializePongGameWithStates();
      });
    }
  }

  private async renderPongGameState(
    container: HTMLElement,
    mode: string,
    difficulty?: string,
    options?: {
      autoStart?: boolean;
      player1Name?: string;
      player2Name?: string;
    }
  ) {
    // Get player names for PvP
    let player1Name = options?.player1Name || "PLAYER 1";
    let player2Name =
      options?.player2Name ||
      (mode === "pvp" ? "PLAYER 2" : `BOT (${difficulty?.toUpperCase()})`);

    if (mode === "pvp" && this.currentMatchId) {
      try {
        const authState = authService.getState();
        player1Name =
          options?.player1Name || authState.user?.username || "PLAYER 1";

        // Get opponent info if available
        if (this.currentOpponentId) {
          const opponentResponse = await this.apiService.getUserById(
            this.currentOpponentId
          );
          if (opponentResponse.success && opponentResponse.data) {
            player2Name =
              options?.player2Name ||
              opponentResponse.data.username ||
              "PLAYER 2";
          }
        }
      } catch (error) {
        console.error("Error getting player names:", error);
      }
    }

    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center py-8">
        <!-- Game Title -->
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-cyber-green">
            ${
              mode === "pvp"
                ? `${player1Name} VS ${player2Name}`
                : `PARTITA 1 VS BOT (${difficulty?.toUpperCase()})`
            }
          </h2>
        </div>
        
        <!-- Game Canvas -->
        <div class="w-full max-w-6xl">
          <div id="pong-canvas-container" class="w-full h-[600px] bg-cyber-black border-2 border-cyber-green">
            <!-- 3D Canvas will be rendered here -->
          </div>
        </div>
        
        <!-- Game Controls -->
        <div class="flex justify-center space-x-4 mt-4">
          <button id="start-game-btn-in-state" class="cyber-button ${
            options?.autoStart === false ? "" : "hidden"
          }">Inizia Partita</button>
          <button id="pause-game-btn" class="cyber-button">Pausa</button>
          <button id="resume-game-btn" class="cyber-button hidden">Riprendi</button>
          <button id="restart-game-btn" class="cyber-button">Restart</button>
          <button id="exit-game-btn" class="cyber-button">Esci</button>
        </div>
      </div>
    `;

    // Initialize canvas
    const canvasContainer = document.getElementById("pong-canvas-container");
    if (canvasContainer) {
      // Create a new canvas instance for the game state
      const pongCanvas = new PongCanvas();
      pongCanvas.render(canvasContainer);

      // Set the game mode and difficulty
      pongCanvas.setGameMode(
        mode as "pvp" | "pve",
        difficulty as "easy" | "medium" | "hard"
      );

      // Store the canvas instance
      this.currentPongCanvas = pongCanvas;
      // Reset last reported scores at game screen render
      this.lastReportedPongScoreP1 = 0;
      this.lastReportedPongScoreP2 = 0;

      // Set score callback
      pongCanvas.updateScore = (player1Score: number, player2Score: number) => {
        // Handle score updates
        this.handlePongScoreUpdate(player1Score, player2Score);
      };

      // Start only if autoStart is not disabled
      if (options?.autoStart !== false) {
        setTimeout(() => {
          pongCanvas.startGame();
        }, 100);
      }
    }

    // Setup event listeners for controls
    const startBtnInState = document.getElementById("start-game-btn-in-state");
    const pauseBtn = document.getElementById("pause-game-btn");
    const resumeBtn = document.getElementById("resume-game-btn");
    const restartBtn = document.getElementById("restart-game-btn");
    const exitBtn = document.getElementById("exit-game-btn");

    if (startBtnInState) {
      startBtnInState.addEventListener("click", () => {
        if (this.currentPongCanvas) {
          this.currentPongCanvas.startGame();
          startBtnInState.classList.add("hidden");
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        this.pausePongGame();
        pauseBtn.classList.add("hidden");
        resumeBtn?.classList.remove("hidden");
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        this.resumePongGame();
        resumeBtn.classList.add("hidden");
        pauseBtn?.classList.remove("hidden");
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.restartPongGame();
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        this.exitPongGame();
      });
    }
  }

  private onPongModeSelectedUpdated(modeId: string, difficulty?: string) {
    const gameContainer = document.getElementById("pong-game-container");
    if (!gameContainer) return;

    this.currentPongMode = modeId;
    this.currentPongDifficulty = difficulty;

    // Move to preparation state
    this.renderPongPreparationState(gameContainer, modeId, difficulty);
  }

  private onPongSettingsChanged(settings: GameSettings) {
    this.currentPongSettings = settings;
  }

  private async startPongGame(mode: string, difficulty?: string) {
    const gameContainer = document.getElementById("pong-game-container");
    if (!gameContainer) return;

    if (mode === "pvp") {
      // For PvP, start the new matchmaking flow
      this.renderPongMatchmakingState(gameContainer);
    } else {
      // For PvE (vs BOT), it's a local game
      this.renderPongGameState(gameContainer, mode, difficulty);
      this.showNotification(
        `Partita locale avviata: 1 vs BOT (${difficulty})!`,
        "success"
      );
    }
  }

  private async renderPongMatchmakingState(container: HTMLElement) {
    // Imposta l'HTML iniziale per il matchmaking
    container.innerHTML = `
      <div class="w-full flex flex-col items-center justify-center py-8">
        <div class="cyber-card w-full max-w-2xl">
          <h2 class="text-2xl font-bold text-cyber-green mb-6 text-center">RICERCA AVVERSARIO</h2>
          
          <div id="matchmaking-content" class="text-center">
            <!-- Initial state: Checking for existing matches -->
            <div class="mb-8">
              <i class="fas fa-search text-4xl text-cyber-green mb-4 animate-pulse"></i>
              <p class="text-lg text-cyber-green mb-2">Controllo partite in corso...</p>
              <p class="text-sm text-gray-400">Verifica se ci sono partite pending</p>
            </div>
          </div>
          
          <div class="flex justify-center space-x-4 mt-6">
            <button id="cancel-matchmaking" class="cyber-button-secondary">Annulla</button>
            <button id="back-to-modes" class="cyber-button-secondary">Indietro</button>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    const cancelButton = document.getElementById("cancel-matchmaking");
    const backButton = document.getElementById("back-to-modes");

    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        this.cancelPongMatchmaking();
      });
    }

    if (backButton) {
      backButton.addEventListener("click", () => {
        this.cancelPongMatchmaking();
        this.initializePongGameWithStates();
      });
    }

    // Start the new matchmaking process
    await this.startNewMatchmakingProcess();
  }

  private async startNewMatchmakingProcess() {
    const contentElement = document.getElementById("matchmaking-content");
    if (!contentElement) return;

    try {
      // Reset flags
      this.matchmakingCancelled = false;

      // Step 1: Check for existing pending matches
      const pendingMatch = await this.checkForPendingMatches();

      if (pendingMatch) {
        // Found a pending match, get its details
        console.log("Found pending match:", pendingMatch);
        await this.handlePendingMatch(pendingMatch);
        return;
      }

      // Step 2: No pending matches found, join matchmaking queue
      this.updateMatchmakingUI(contentElement, "joining");

      try {
        const joinResponse = await this.apiService.joinMatchmaking("1"); // game_id 1 for Pong
        console.log("Join matchmaking response:", joinResponse);

        if (
          joinResponse.success ||
          joinResponse.message === "Joined matchmaking queue"
        ) {
          // Successfully joined queue, now try to find a match
          this.updateMatchmakingUI(contentElement, "searching");

          try {
            console.log("Trying to find a match...");
            const findResponse = await this.apiService.findMatch("1", 1000); // game_id 1, elo_range 1000
            console.log("Find match response:", findResponse);

            if (findResponse.success && findResponse.data) {
              // Found a match through findMatch
              console.log("Found match through findMatch:", findResponse.data);
              await this.handlePendingMatch(findResponse.data);
            } else {
              // No match found yet, start polling
              console.log(
                "No match found through findMatch, starting polling..."
              );
              await this.pollForMatches(contentElement);
            }
          } catch (error) {
            console.error("Error finding match:", error);
            // Even if findMatch fails, start polling as fallback
            await this.pollForMatches(contentElement);
          }
        } else {
          throw new Error(joinResponse.message || "Failed to join matchmaking");
        }
      } catch (error) {
        console.error("Error joining matchmaking:", error);
        this.showMatchmakingError(
          contentElement,
          "Errore nell'unirsi alla coda di matchmaking"
        );
      }
    } catch (error) {
      console.error("Matchmaking process error:", error);
      this.showMatchmakingError(
        contentElement,
        "Errore durante il matchmaking"
      );
    }
  }

  private updateMatchmakingUI(
    contentElement: HTMLElement,
    state: "joining" | "searching" | "found"
  ) {
    switch (state) {
      case "joining":
        contentElement.innerHTML = `
          <div class="mb-8">
            <i class="fas fa-sign-in-alt text-4xl text-cyber-green mb-4 animate-pulse"></i>
            <p class="text-lg text-cyber-green mb-2">Accesso alla coda...</p>
            <p class="text-sm text-gray-400">Sto entrando nella coda di matchmaking</p>
          </div>
        `;
        break;
      case "searching":
        contentElement.innerHTML = `
          <div class="mb-8">
            <i class="fas fa-search text-4xl text-cyber-green mb-4 animate-pulse"></i>
            <p class="text-lg text-cyber-green mb-2">Ricerca avversario in corso...</p>
            <p class="text-sm text-gray-400">Potrebbero volerci alcuni secondi</p>
          </div>
        `;
        break;
      case "found":
        contentElement.innerHTML = `
          <div class="mb-8">
            <i class="fas fa-check-circle text-4xl text-cyber-green mb-4"></i>
            <p class="text-lg text-cyber-green mb-2">Avversario trovato!</p>
            <p class="text-sm text-gray-400">Caricamento dettagli partita...</p>
          </div>
        `;
        break;
    }
  }

  private async pollForMatches(contentElement: HTMLElement) {
    const pollInterval = 3000; // Poll every 3 seconds

    const poll = async () => {
      if (this.matchmakingCancelled) return;

      try {
        // Check for pending matches
        const pendingMatch = await this.checkForPendingMatches();

        if (pendingMatch) {
          // Found a pending match
          this.updateMatchmakingUI(contentElement, "found");
          await this.handlePendingMatch(pendingMatch);
          return;
        }

        // No match found yet, continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error("Error polling for matches:", error);
        // Continue polling even on error
        setTimeout(poll, pollInterval);
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  private async checkForPendingMatches(): Promise<any> {
    try {
      const authState = authService.getState();
      const userId = authState.user?.id?.toString();
      if (!userId) return null;

      console.log("Checking for pending matches for user:", userId);
      const myMatches = await this.apiService.getUserMatchHistory(userId);
      console.log("Match history response:", myMatches);

      // L'API restituisce direttamente un array di match, non un oggetto con proprietà .data.matches
      const matchesArray = Array.isArray(myMatches.data)
        ? myMatches.data
        : myMatches;

      // Filtra solo le partite pending per il gioco Pong (game_id = 1)
      const pendingMatches = (matchesArray as any).filter(
        (m: any) => m.status === "pending" && Number(m.game_id) === 1
      );

      console.log("Pending matches found:", pendingMatches);

      if (pendingMatches.length === 0) {
        return null;
      }

      // Se ci sono più partite pending, prendi la più recente (con l'ID più grande)
      const recentPending = pendingMatches.reduce((prev: any, current: any) =>
        prev.id > current.id ? prev : current
      );

      console.log("Most recent pending match:", recentPending);
      return recentPending;
    } catch (err) {
      console.error("Error checking for pending match:", err);
      return null;
    }
  }

  private async handlePendingMatch(pendingMatch: any) {
    try {
      console.log("Handling pending match:", pendingMatch);

      // Get detailed match information
      const matchDetails = await this.apiService.getMatch(
        pendingMatch.id.toString()
      );
      console.log("Match details:", matchDetails);

      if (matchDetails.success && matchDetails.data) {
        const matchData = matchDetails.data;
        console.log("Match data retrieved:", matchData);

        // Find opponent information
        const authState = authService.getState();
        const myId = authState.user?.id;
        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        let opponentUsername = "PLAYER 2";
        if (opponentPlayer) {
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found opponent player with ID:", opponentId);

          try {
            console.log("Calling getUserById with opponent ID:", opponentId);
            const opp = await this.apiService.getUserById(opponentId);
            console.log("User API response:", opp);

            if (opp.success && opp.data) {
              opponentUsername = opp.data.username || "PLAYER 2";
              console.log("Opponent username retrieved:", opponentUsername);
            } else {
              console.error("API response for user was not successful:", opp);
            }
          } catch (error) {
            console.error("Error getting opponent info:", error);
          }
        } else {
          console.warn("No opponent player found in match data");
        }

        // Set match data
        this.currentMatchId = matchData.id.toString();
        this.currentOpponentId = opponentPlayer
          ? String(opponentPlayer.user_id)
          : null;
        this.currentOpponentUsername = opponentUsername;

        // Show pending match UI
        this.showPendingMatchUI({
          match: matchData,
          opponentId: this.currentOpponentId,
          opponentUsername: this.currentOpponentUsername,
          myId: myId,
        });
      } else {
        // If we can't get match details, try to continue with basic match info
        console.warn(
          "Could not get detailed match info, using basic match data"
        );
        this.handlePendingMatchWithBasicInfo(pendingMatch);
      }
    } catch (error) {
      console.error("Error handling pending match:", error);

      // Try to continue with basic match info
      try {
        console.warn("Attempting to continue with basic match data");
        this.handlePendingMatchWithBasicInfo(pendingMatch);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        const contentElement = document.getElementById("matchmaking-content");
        if (contentElement) {
          this.showMatchmakingError(
            contentElement,
            "Errore nel caricamento della partita. Riprova più tardi."
          );
        }
      }
    }
  }

  private async handlePendingMatchWithBasicInfo(pendingMatch: any) {
    console.log("Using basic match info for pending match:", pendingMatch);

    // Set basic match data
    this.currentMatchId = pendingMatch.id.toString();
    this.currentOpponentId = null; // We don't know the opponent yet
    this.currentOpponentUsername = "Avversario";

    // Try to get match details to find opponent info
    try {
      const matchDetails = await this.apiService.getMatch(
        pendingMatch.id.toString()
      );
      console.log("Match details for basic info:", matchDetails);

      if (matchDetails) {
        const authState = authService.getState();
        const myId = authState.user?.id;

        // Find opponent in the match data
        const matchData = matchDetails.data || matchDetails; // Handle both response formats
        console.log("Match data:", matchData);

        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        console.log("Opponent player:", opponentPlayer);

        if (opponentPlayer) {
          // We found the opponent, now get their user info
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found opponent with ID:", opponentId);

          try {
            const opponentInfo = await this.apiService.getUserById(opponentId);
            console.log("Opponent info:", opponentInfo);

            if (opponentInfo.success && opponentInfo.data) {
              // Update opponent info with real data
              this.currentOpponentId = opponentId;
              this.currentOpponentUsername =
                opponentInfo.data.username || "PLAYER 2";
              console.log(
                "Updated opponent username:",
                this.currentOpponentUsername
              );
            }
          } catch (error) {
            console.error("Error getting opponent info:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error getting match details for basic info:", error);
    }

    // Create a minimal match object for UI
    const minimalMatchData = {
      id: pendingMatch.id,
      game_id: pendingMatch.game_id,
      status: pendingMatch.status,
      players: [], // We don't have player details yet
    };

    // Show pending match UI with basic info
    this.showPendingMatchUI({
      match: minimalMatchData,
      opponentId: this.currentOpponentId,
      opponentUsername: this.currentOpponentUsername,
      myId: authService.getState().user?.id,
    });
  }

  private showPendingMatchUI(matchData: any) {
    const contentElement = document.getElementById("matchmaking-content");
    if (!contentElement) return;

    console.log("showPendingMatchUI called with data:", matchData);

    // Imposta le variabili necessarie per il funzionamento dei pulsanti
    this.currentMatchId = matchData.match.id.toString();
    this.currentOpponentId = matchData.opponentId;
    this.currentOpponentUsername = matchData.opponentUsername;

    console.log("Set opponent data:", {
      id: this.currentOpponentId,
      username: this.currentOpponentUsername,
    });

    // Mostra l'interfaccia del match trovato
    const authState = authService.getState();
    const meName = authState.user?.username || "PLAYER 1";
    const oppName = matchData.opponentUsername || "Avversario";

    console.log("Display names:", { meName, oppName });

    // Check if we have complete opponent info
    const hasCompleteInfo =
      matchData.opponentId && matchData.opponentUsername !== "Avversario";
    const statusText = hasCompleteInfo
      ? "In attesa che entrambi i giocatori siano pronti..."
      : "Caricamento informazioni avversario...";

    console.log("UI state:", { hasCompleteInfo, statusText });

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-check-circle text-4xl text-cyber-green mb-4"></i>
        <p class="text-xl text-cyber-green mb-2">Avversario trovato!</p>
        <p id="opponent-name" class="text-lg mb-4">${meName} <span class="text-cyber-cyan">VS</span> ${oppName}</p>
        <div id="ready-status" class="space-y-2">
          <p class="text-sm">${statusText}</p>
        </div>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="ready-button" class="cyber-button" ${
          !hasCompleteInfo ? "disabled" : ""
        }>Sono Pronto</button>
        <button id="abandon-match" class="cyber-button-secondary">Abbandona</button>
      </div>
    `;

    // Aggiungi gli event listener per i pulsanti
    document
      .getElementById("ready-button")
      ?.addEventListener("click", () => this.setPlayerReady());
    document
      .getElementById("abandon-match")
      ?.addEventListener("click", () => this.abandonMatch());

    // If we don't have complete info, try to get it
    if (!hasCompleteInfo) {
      this.tryToGetOpponentInfo();
    }

    // Inizia il controllo dello stato di pronto
    this.checkMatchReady();
  }

  private async tryToGetOpponentInfo() {
    try {
      // Try to get detailed match info again
      const matchDetails = await this.apiService.getMatch(this.currentMatchId!);
      console.log(
        "Getting match details for opponent info, match ID:",
        this.currentMatchId
      );

      if (matchDetails.success && matchDetails.data) {
        const matchData = matchDetails.data;
        console.log("Match data retrieved:", matchData);

        // Find opponent information
        const authState = authService.getState();
        const myId = authState.user?.id;
        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        if (opponentPlayer) {
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found opponent player with ID:", opponentId);

          try {
            console.log("Calling getUserById with opponent ID:", opponentId);
            const opp = await this.apiService.getUserById(opponentId);
            console.log("User API response:", opp);

            if (opp.success && opp.data) {
              // Update opponent info
              this.currentOpponentId = opponentId;
              this.currentOpponentUsername = opp.data.username || "PLAYER 2";
              console.log(
                "Opponent username retrieved:",
                this.currentOpponentUsername
              );

              // Update UI with new opponent info
              const contentElement = document.getElementById(
                "matchmaking-content"
              );
              if (contentElement) {
                const meName = authState.user?.username || "PLAYER 1";
                const oppName = this.currentOpponentUsername;

                // Update the opponent name in the UI
                const opponentNameElement =
                  document.getElementById("opponent-name");
                if (opponentNameElement) {
                  opponentNameElement.innerHTML = `${meName} <span class="text-cyber-cyan">VS</span> ${oppName}`;
                  console.log("Updated opponent name in UI to:", oppName);
                }

                // Update status text
                const statusElement =
                  contentElement.querySelector("#ready-status p");
                if (statusElement) {
                  statusElement.textContent =
                    "In attesa che entrambi i giocatori siano pronti...";
                }

                // Enable the ready button
                const readyButton = document.getElementById(
                  "ready-button"
                ) as HTMLButtonElement;
                if (readyButton) {
                  readyButton.disabled = false;
                  console.log("Enabled ready button");
                }
              }
            } else {
              console.error("API response for user was not successful:", opp);
            }
          } catch (error) {
            console.error("Error getting opponent info:", error);
          }
        } else {
          console.warn("No opponent player found in match data");
        }
      } else {
        console.error("Could not retrieve match details:", matchDetails);
      }
    } catch (error) {
      console.error("Error getting match details:", error);
    }
  }

  private async setPlayerReady() {
    if (!this.currentMatchId) return;

    try {
      const authState = authService.getState();
      if (!authState.user?.id) return;

      const response = await this.apiService.readyMatch(
        this.currentMatchId.toString(),
        Number(authState.user.id),
        true
      );

      if (response.success) {
        // Update UI to show player is ready
        const readyButton = document.getElementById("ready-button");
        if (readyButton) {
          readyButton.textContent = "Pronto! ✓";
          readyButton.setAttribute("disabled", "true");
          readyButton.classList.add("opacity-50");
        }

        // Check if both players are ready
        this.checkMatchReady();
      } else {
        this.showNotification("Errore nel segnalarsi pronto", "error");
      }
    } catch (error) {
      console.error("Error setting ready:", error);
      this.showNotification("Errore nel segnalarsi pronto", "error");
    }
  }

  private async checkMatchReady() {
    if (!this.currentMatchId) return;

    try {
      const response = await this.apiService.getMatch(
        this.currentMatchId.toString()
      );

      if (response.success && response.data) {
        const match = response.data;
        const allPlayersReady = match.players?.every((p: any) => p.is_ready);

        if (allPlayersReady && match.status === "in_progress") {
          const authState = authService.getState();
          const myIdNum: number | null = authState.user?.id
            ? Number(authState.user.id)
            : null;
          const oppIdNum: number | null = this.currentOpponentId
            ? Number(this.currentOpponentId)
            : null;
          const meName = authState.user?.username || "PLAYER 1";
          const oppName = this.currentOpponentUsername || "PLAYER 2";

          if (myIdNum && oppIdNum) {
            const hostId = Math.min(myIdNum, oppIdNum);
            const amIHost = myIdNum === hostId;
            const gameContainer = document.getElementById(
              "pong-game-container"
            );

            // Save mapping for score updates
            this.currentPongPlayer1Id = myIdNum;
            this.currentPongPlayer2Id = oppIdNum;

            if (amIHost && gameContainer) {
              this.currentMatchHost = String(hostId);
              // Render game screen but do NOT auto-start; show Start button
              await this.renderPongGameState(gameContainer, "pvp", undefined, {
                autoStart: false,
                player1Name: meName,
                player2Name: oppName,
              });
              this.showNotification(
                "Entrambi pronti. Puoi iniziare la partita.",
                "success"
              );
            } else {
              // Non-host, show info message
              this.showMatchHostedByOther(amIHost ? meName : oppName);
            }
          }
        } else {
          // Not all players ready yet, poll again after a delay
          setTimeout(() => this.checkMatchReady(), 2000);
        }
      }
    } catch (error) {
      console.error("Error checking match ready:", error);
    }
  }

  private showMatchHostedByOther(hostUsername: string) {
    const contentElement = document.getElementById("matchmaking-content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-gamepad text-4xl text-cyber-yellow mb-4"></i>
        <p class="text-xl text-cyber-green mb-2">Partita in corso</p>
        <p class="text-lg mb-4">La partita è in corso da <span class="text-cyber-cyan">${hostUsername}</span></p>
        <p class="text-sm text-gray-400">Gioca sul PC di ${hostUsername} per partecipare alla partita</p>
      </div>
      <div class="flex justify-center">
        <button id="back-to-menu" class="cyber-button">Torna al Menu</button>
      </div>
    `;

    const backButton = document.getElementById("back-to-menu");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.currentMatchId = null;
        this.currentOpponentId = null;
        this.initializePongGameWithStates();
      });
    }
  }

  private async abandonMatch() {
    if (!this.currentMatchId) return;

    try {
      // Finish the match as abandoned
      await this.apiService.finishMatch(this.currentMatchId.toString(), {
        status: "abandoned",
      });

      this.currentMatchId = null;
      this.currentOpponentId = null;

      this.showNotification("Partita abbandonata", "info");
      this.initializePongGameWithStates();
    } catch (error) {
      console.error("Error abandoning match:", error);
      this.showNotification("Errore nell'abbandonare la partita", "error");
    }
  }

  private async handlePongScoreUpdate(
    player1Score: number,
    player2Score: number
  ) {
    const maxScore = this.currentPongSettings?.maxScore || 5;

    // Update score in backend only if we have a match ID (PvP games)
    if (this.currentMatchId && this.currentPongMode === "pvp") {
      try {
        // Send an update only when a player's score increases
        if (
          player1Score > this.lastReportedPongScoreP1 &&
          this.currentPongPlayer1Id
        ) {
          await this.apiService.updateMatchScore(this.currentMatchId, {
            user_id: this.currentPongPlayer1Id,
            score: player1Score,
          });
          this.lastReportedPongScoreP1 = player1Score;
        }
        if (
          player2Score > this.lastReportedPongScoreP2 &&
          this.currentPongPlayer2Id
        ) {
          await this.apiService.updateMatchScore(this.currentMatchId, {
            user_id: this.currentPongPlayer2Id,
            score: player2Score,
          });
          this.lastReportedPongScoreP2 = player2Score;
        }
      } catch (error) {
        console.error("Error updating match score:", error);
      }
    }

    // Check for game over
    if (player1Score >= maxScore || player2Score >= maxScore) {
      const winner = player1Score >= maxScore ? "PLAYER 1" : "PLAYER 2";
      this.showNotification(`Vincitore: ${winner}!`, "success");

      // Handle game over
      setTimeout(() => {
        this.handlePongGameOver(winner, player1Score, player2Score);
      }, 2000);
    }
  }

  private async handlePongGameOver(
    winner: string,
    player1Score: number,
    player2Score: number
  ) {
    // First, stop the game to prevent it from continuing
    if (this.currentPongCanvas) {
      this.currentPongCanvas.pauseGame();
      this.currentPongCanvas.dispose();
      this.currentPongCanvas = null;
    }

    // Finish match in backend only for PvP games
    if (this.currentMatchId && this.currentPongMode === "pvp") {
      try {
        const authState = authService.getState();
        const currentUserId = authState.user?.id;
        const winnerId =
          winner === "PLAYER 1" ? currentUserId : this.currentOpponentId;

        await this.apiService.finishMatch(this.currentMatchId, {
          winner_id: winnerId,
          final_scores: {
            player1: player1Score,
            player2: player2Score,
          },
        });
      } catch (error) {
        console.error("Error finishing match:", error);
      }
    }

    // Show game over dialog
    const gameContainer = document.getElementById("pong-game-container");
    if (!gameContainer) return;

    gameContainer.innerHTML = `
      <div class="cyber-card max-w-md mx-auto text-center">
        <h2 class="text-2xl font-bold text-cyber-green mb-4">PARTITA TERMINATA</h2>
        <p class="text-xl mb-4">Vincitore: ${winner}</p>
        <p class="text-lg mb-6">Punteggio Finale: ${player1Score} - ${player2Score}</p>
        <div class="flex justify-center space-x-4">
          <button id="play-again" class="cyber-button">Gioca Ancora</button>
          <button id="back-to-menu" class="cyber-button-secondary">Menu Principale</button>
        </div>
      </div>
    `;

    // Clear the match ID
    this.currentMatchId = null;

    // Setup event listeners
    const playAgainButton = document.getElementById("play-again");
    if (playAgainButton) {
      playAgainButton.addEventListener("click", () => {
        this.initializePongGameWithStates();
      });
    }

    const backToMenuButton = document.getElementById("back-to-menu");
    if (backToMenuButton) {
      backToMenuButton.addEventListener("click", () => {
        this.router.navigate("/games");
      });
    }
  }

  private pausePongGame() {
    // Pause the game
    if (this.currentPongCanvas) {
      this.currentPongCanvas.pauseGame();
      this.showNotification("Gioco in pausa", "info");
    }
  }

  private resumePongGame() {
    // Resume the game
    if (this.currentPongCanvas) {
      this.currentPongCanvas.resumeGame();
      this.showNotification("Gioco ripreso", "info");
    }
  }

  private restartPongGame() {
    // Restart the game with current settings
    if (this.currentPongCanvas) {
      // Reset the game
      this.currentPongCanvas.resetGame();
      // Start it again
      this.currentPongCanvas.startGame();
      this.showNotification("Partita riavviata!", "info");
    }
  }

  private async exitPongGame() {
    // Pause the game while showing confirmation
    if (this.currentPongCanvas) {
      this.currentPongCanvas.pauseGame();
    }

    // Show confirmation dialog
    const gameContainer = document.getElementById("pong-game-container");
    if (!gameContainer) return;

    gameContainer.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div class="cyber-card max-w-md mx-auto p-6">
          <h2 class="text-xl font-bold text-cyber-green mb-4">CONFERMA USCITA</h2>
          <p class="text-center mb-6">Sei sicuro di voler uscire dalla partita?</p>
          <div class="flex justify-center space-x-4">
            <button id="confirm-exit" class="cyber-button">Esci</button>
            <button id="cancel-exit" class="cyber-button-secondary">Annulla</button>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    const confirmButton = document.getElementById("confirm-exit");
    if (confirmButton) {
      confirmButton.addEventListener("click", async () => {
        // Finish the match only for PvP games
        if (this.currentMatchId && this.currentPongMode === "pvp") {
          try {
            await this.apiService.finishMatch(this.currentMatchId, {
              status: "abandoned",
            });
          } catch (error) {
            console.error("Error finishing match:", error);
          }
        }

        // Dispose of the canvas
        if (this.currentPongCanvas) {
          this.currentPongCanvas.dispose();
          this.currentPongCanvas = null;
        }

        // Clear the match ID
        this.currentMatchId = null;

        // Go back to selection
        this.initializePongGameWithStates();
      });
    }

    const cancelButton = document.getElementById("cancel-exit");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        // Resume the game and go back to game state
        if (this.currentPongCanvas) {
          this.currentPongCanvas.resumeGame();
        }
        this.renderPongGameState(
          gameContainer,
          this.currentPongMode || "",
          this.currentPongDifficulty || undefined
        );
      });
    }
  }

  // Properties to track current game state
  private currentPongMode: string | null = null;
  private currentPongDifficulty: string | undefined = undefined;
  private currentPongSettings: GameSettings | null = null;
  private currentPongCanvas: PongCanvas | null = null;
  private currentMatchId: string | null = null;
  private currentOpponentId: string | null = null;
  private currentMatchHost: string | null = null;
  private currentOpponentUsername: string | null = null;
  private currentPongPlayer1Id: number | null = null;
  private currentPongPlayer2Id: number | null = null;
  private lastReportedPongScoreP1: number = 0;
  private lastReportedPongScoreP2: number = 0;
  private matchmakingCancelled: boolean = false;

  private renderBreakoutPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">BREAKOUT CYBER</h1>
        
        <!-- Game State Container -->
        <div id="breakout-game-container" class="flex flex-col items-center">
          <!-- Content will be dynamically rendered based on game state -->
        </div>
      </div>
    `;

    // Initialize Breakout game with state management
    this.initializeBreakoutGameWithStates();
  }

  private initializeBreakoutGameWithStates() {
    const gameContainer = document.getElementById("breakout-game-container");
    if (!gameContainer) return;

    // Define game modes (only 1vs1 for Breakout)
    const gameModes: GameMode[] = [
      {
        id: "pvp",
        name: "1 VS 1",
        description: "Sfida un altro giocatore sullo stesso dispositivo",
        icon: "fas fa-users",
      },
    ];

    // Start with selection state
    this.renderBreakoutSelectionState(gameContainer, gameModes);
  }

  private renderBreakoutSelectionState(
    container: HTMLElement,
    gameModes: GameMode[]
  ) {
    container.innerHTML = "";

    // Create and render game mode selector
    const gameModeSelector = new GameModeSelector(
      gameModes,
      undefined, // No bot difficulties for Breakout
      (modeId) => {
        this.onBreakoutModeSelected(modeId);
      }
    );
    (gameModeSelector as any).render(container);
  }

  private renderBreakoutPreparationState(container: HTMLElement, mode: string) {
    container.innerHTML = `
      <div class="w-full flex flex-col items-center justify-center py-8">
        <!-- Title -->
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-cyber-green">PARTITA 1 VS 1</h2>
        </div>
        
        <!-- Game Preview -->
        <div class="cyber-card w-full max-w-6xl mb-6">
          <h3 class="text-lg font-bold text-cyber-green mb-4 text-center">ANTEPRIMA GIOCO</h3>
          <div id="breakout-canvas-container" class="w-full h-[500px] bg-cyber-black border border-cyber-green">
            <!-- 3D Canvas will be rendered here -->
          </div>
          </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <button id="start-breakout-game" class="cyber-button px-8 py-3 text-lg">Inizia Partita</button>
          <button id="back-to-selection" class="cyber-button-secondary px-8 py-3 text-lg">Indietro</button>
        </div>
      </div>
    `;

    // Initialize canvas
    const canvasContainer = document.getElementById(
      "breakout-canvas-container"
    );
    if (canvasContainer) {
      this.currentBreakoutCanvas = new BreakoutCanvas();
      this.currentBreakoutCanvas.render(canvasContainer);
      this.currentBreakoutCanvas.setGameMode("pvp");
    }

    // Setup event listeners
    const startButton = document.getElementById("start-breakout-game");
    if (startButton) {
      startButton.addEventListener("click", () => {
        this.startBreakoutGame(mode);
      });
    }

    const backButton = document.getElementById("back-to-selection");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.initializeBreakoutGameWithStates();
      });
    }
  }

  private renderBreakoutGameState(container: HTMLElement, mode: string) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center py-8">
        <!-- Game Title -->
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-cyber-green">PARTITA 1 VS 1</h2>
        </div>
        
        <!-- Game Canvas -->
        <div class="w-full max-w-6xl">
          <div id="breakout-canvas-container" class="w-full h-[600px] bg-cyber-black border-2 border-cyber-green">
            <!-- 3D Canvas will be rendered here -->
          </div>
        </div>
        
        <!-- Game Controls -->
        <div class="flex justify-center space-x-4 mt-4">
          <button id="pause-breakout-btn" class="cyber-button">Pausa</button>
          <button id="resume-breakout-btn" class="cyber-button hidden">Riprendi</button>
          <button id="restart-breakout-btn" class="cyber-button">Restart</button>
          <button id="exit-breakout-btn" class="cyber-button">Esci</button>
        </div>
      </div>
    `;

    // Initialize canvas
    const canvasContainer = document.getElementById(
      "breakout-canvas-container"
    );
    if (canvasContainer) {
      // Create a new canvas instance for the game state
      const breakoutCanvas = new BreakoutCanvas();
      breakoutCanvas.render(canvasContainer);

      // Set the game mode
      breakoutCanvas.setGameMode("pvp");

      // Store the canvas instance
      this.currentBreakoutCanvas = breakoutCanvas;

      // Set score callback
      breakoutCanvas.updateScore = (
        score: number,
        level: number,
        lives: number
      ) => {
        // Handle score updates
        this.handleBreakoutScoreUpdate(score, level, lives);
      };

      // Start the game after a short delay
      setTimeout(() => {
        breakoutCanvas.startGame();
      }, 100);
    }

    // Setup event listeners for controls
    const pauseBtn = document.getElementById("pause-breakout-btn");
    const resumeBtn = document.getElementById("resume-breakout-btn");
    const restartBtn = document.getElementById("restart-breakout-btn");
    const exitBtn = document.getElementById("exit-breakout-btn");

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        this.pauseBreakoutGame();
        pauseBtn.classList.add("hidden");
        resumeBtn?.classList.remove("hidden");
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        this.resumeBreakoutGame();
        resumeBtn.classList.add("hidden");
        pauseBtn?.classList.remove("hidden");
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.restartBreakoutGame();
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        this.exitBreakoutGame();
      });
    }
  }

  private onBreakoutModeSelected(modeId: string) {
    const gameContainer = document.getElementById("breakout-game-container");
    if (!gameContainer) return;

    this.currentBreakoutMode = modeId;

    // Move to preparation state
    this.renderBreakoutPreparationState(gameContainer, modeId);
  }

  private onBreakoutSettingsChanged(settings: GameSettings) {
    this.currentBreakoutSettings = settings;
  }

  private async startBreakoutGame(mode: string) {
    const gameContainer = document.getElementById("breakout-game-container");
    if (!gameContainer) return;

    try {
      // Create a match in the backend
      const matchResponse = await this.apiService.createMatch("breakout");

      if (matchResponse.success && matchResponse.data) {
        // Store the match ID for later use
        this.currentBreakoutMatchId = matchResponse.data.id;

        // Move to game state and start the game
        this.renderBreakoutGameState(gameContainer, mode);
        this.showNotification(`Partita Breakout avviata: 1 vs 1!`, "success");
      } else {
        this.showNotification("Errore nella creazione della partita", "error");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      // Continue with local game if API fails
      this.renderBreakoutGameState(gameContainer, mode);
      this.showNotification(
        `Partita Breakout avviata localmente: 1 vs 1!`,
        "info"
      );
    }
  }

  private async handleBreakoutScoreUpdate(
    score: number,
    level: number,
    lives: number
  ) {
    // Update score in backend if we have a match ID
    if (this.currentBreakoutMatchId) {
      try {
        await this.apiService.updateMatchScore(this.currentBreakoutMatchId, {
          score: score,
          level: level,
          lives: lives,
        });
      } catch (error) {
        console.error("Error updating match score:", error);
      }
    }

    // Check for game over
    if (lives <= 0) {
      this.showNotification(`Game Over! Punteggio finale: ${score}`, "error");

      // Handle game over
      setTimeout(() => {
        this.handleBreakoutGameOver(score);
      }, 2000);
    }
  }

  private async handleBreakoutGameOver(finalScore: number) {
    // First, stop the game to prevent it from continuing
    if (this.currentBreakoutCanvas) {
      this.currentBreakoutCanvas.pauseGame();
      this.currentBreakoutCanvas.dispose();
      this.currentBreakoutCanvas = null;
    }

    // Finish match in backend if we have a match ID
    if (this.currentBreakoutMatchId) {
      try {
        await this.apiService.finishMatch(this.currentBreakoutMatchId, {
          final_score: finalScore,
        });
      } catch (error) {
        console.error("Error finishing match:", error);
      }
    }

    // Show game over dialog
    const gameContainer = document.getElementById("breakout-game-container");
    if (!gameContainer) return;

    gameContainer.innerHTML = `
      <div class="cyber-card max-w-md mx-auto text-center">
        <h2 class="text-2xl font-bold text-cyber-green mb-4">PARTITA TERMINATA</h2>
        <p class="text-xl mb-6">Punteggio finale: ${finalScore}</p>
        <div class="flex justify-center space-x-4">
          <button id="play-again" class="cyber-button">Gioca Ancora</button>
          <button id="back-to-menu" class="cyber-button-secondary">Menu Principale</button>
        </div>
      </div>
    `;

    // Clear the match ID
    this.currentBreakoutMatchId = null;

    // Setup event listeners
    const playAgainButton = document.getElementById("play-again");
    if (playAgainButton) {
      playAgainButton.addEventListener("click", () => {
        this.initializeBreakoutGameWithStates();
      });
    }

    const backToMenuButton = document.getElementById("back-to-menu");
    if (backToMenuButton) {
      backToMenuButton.addEventListener("click", () => {
        this.router.navigate("/games");
      });
    }
  }

  private pauseBreakoutGame() {
    // Pause game
    if (this.currentBreakoutCanvas) {
      this.currentBreakoutCanvas.pauseGame();
      this.showNotification("Gioco in pausa", "info");
    }
  }

  private resumeBreakoutGame() {
    // Resume game
    if (this.currentBreakoutCanvas) {
      this.currentBreakoutCanvas.resumeGame();
      this.showNotification("Gioco ripreso", "info");
    }
  }

  private restartBreakoutGame() {
    // Restart game with current settings
    if (this.currentBreakoutCanvas) {
      // Reset the game
      this.currentBreakoutCanvas.resetGame();
      // Start it again
      this.currentBreakoutCanvas.startGame();
      this.showNotification("Partita riavviata!", "info");
    }
  }

  private async exitBreakoutGame() {
    // Pause the game while showing confirmation
    if (this.currentBreakoutCanvas) {
      this.currentBreakoutCanvas.pauseGame();
    }

    // Show confirmation dialog
    const gameContainer = document.getElementById("breakout-game-container");
    if (!gameContainer) return;

    gameContainer.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div class="cyber-card max-w-md mx-auto p-6">
          <h2 class="text-xl font-bold text-cyber-green mb-4">CONFERMA USCITA</h2>
          <p class="text-center mb-6">Sei sicuro di voler uscire dalla partita?</p>
          <div class="flex justify-center space-x-4">
            <button id="confirm-exit" class="cyber-button">Esci</button>
            <button id="cancel-exit" class="cyber-button-secondary">Annulla</button>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    const confirmButton = document.getElementById("confirm-exit");
    if (confirmButton) {
      confirmButton.addEventListener("click", async () => {
        // Finish the match if we have a match ID
        if (this.currentBreakoutMatchId) {
          try {
            await this.apiService.finishMatch(this.currentBreakoutMatchId, {
              status: "abandoned",
            });
          } catch (error) {
            console.error("Error finishing match:", error);
          }
        }

        // Dispose of the canvas
        if (this.currentBreakoutCanvas) {
          this.currentBreakoutCanvas.dispose();
          this.currentBreakoutCanvas = null;
        }

        // Clear the match ID
        this.currentBreakoutMatchId = null;

        // Go back to selection
        this.initializeBreakoutGameWithStates();
      });
    }

    const cancelButton = document.getElementById("cancel-exit");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        // Resume the game and go back to game state
        if (this.currentBreakoutCanvas) {
          this.currentBreakoutCanvas.resumeGame();
        }
        this.renderBreakoutGameState(
          gameContainer,
          this.currentBreakoutMode || ""
        );
      });
    }
  }

  // Properties to track current game state
  private currentBreakoutMode: string | null = null;
  private currentBreakoutSettings: GameSettings | null = null;
  private currentBreakoutCanvas: BreakoutCanvas | null = null;
  private currentBreakoutMatchId: string | null = null;

  private renderTournamentsPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">TORNEI CYBER</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEO T4</h2>
            <p class="terminal-text mb-4">Torneo a eliminazione diretta con 4 partecipanti</p>
            <button id="create-t4-tournament" class="cyber-button inline-block">Crea Torneo T4</button>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEO T8</h2>
            <p class="terminal-text mb-4">Torneo a eliminazione diretta con 8 partecipanti</p>
            <button id="create-t8-tournament" class="cyber-button inline-block">Crea Torneo T8</button>
          </div>
        </div>
        
        <div class="cyber-card">
          <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEI ATTIVI</h2>
          <div id="active-tournaments" class="space-y-4">
            <div class="text-center text-cyber-green py-8">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
              <p class="mt-2">Caricamento tornei attivi...</p>
            </div>
          </div>
        </div>
        
        <div class="cyber-card mt-6">
          <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEI PASSATI</h2>
          <div id="past-tournaments" class="space-y-4">
            <div class="text-center text-cyber-green py-8">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
              <p class="mt-2">Caricamento tornei passati...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize tournaments page
    this.initializeTournamentsPage();
  }

  private async renderTournamentDetailsPage(tournamentId: string) {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="cyber-title text-2xl">DETTAGLI TORNEO</h1>
          <button id="back-to-tournaments" class="cyber-button-sm">Indietro</button>
        </div>
        
        <div id="tournament-loading" class="text-center text-cyber-green py-8">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Caricamento dettagli torneo...</p>
        </div>

        <div id="tournament-content" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Informazioni Torneo</h2>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Nome:</span>
                  <span id="tournament-name">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Gioco:</span>
                  <span id="tournament-game">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Partecipanti:</span>
                  <span id="tournament-participants">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Stato:</span>
                  <span id="tournament-status">-</span>
                </div>
              </div>
            </div>

            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Azioni</h2>
              <div class="space-y-2">
                <button id="join-tournament-btn" class="cyber-button w-full hidden">Iscriviti</button>
                <button id="start-tournament-btn" class="cyber-button w-full hidden">Avvia Torneo</button>
                <button id="view-bracket-btn" class="cyber-button w-full">Visualizza Bracket</button>
              </div>
            </div>
          </div>

          <div class="cyber-card">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Tabellone</h2>
            <div id="tournament-bracket" class="text-center">
              <!-- Tournament bracket will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize tournament details page
    this.initializeTournamentDetailsPage(tournamentId);
  }

  private async initializeTournamentDetailsPage(tournamentId: string) {
    // Add event listener for back button
    const backButton = document.getElementById("back-to-tournaments");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.router.navigate("/tournaments");
      });
    }

    // Load tournament details
    await this.loadTournamentDetails(tournamentId);
  }

  private async loadTournamentDetails(tournamentId: string) {
    try {
      const response = await this.apiService.getTournament(tournamentId);

      if (response.success && response.data) {
        const tournament = response.data;
        this.updateTournamentDetailsDisplay(tournament);

        // Load tournament bracket
        await this.loadTournamentBracket(tournamentId);
      } else {
        this.showNotification(
          response.message || "Errore nel caricamento del torneo",
          "error"
        );
        this.router.navigate("/tournaments");
      }
    } catch (error) {
      console.error("Load tournament details error:", error);
      this.showNotification(
        "Errore durante il caricamento del torneo",
        "error"
      );
      this.router.navigate("/tournaments");
    }
  }

  private updateTournamentDetailsDisplay(tournament: any) {
    // Hide loading, show content
    const loadingElement = document.getElementById("tournament-loading");
    const contentElement = document.getElementById("tournament-content");

    if (loadingElement) loadingElement.classList.add("hidden");
    if (contentElement) contentElement.classList.remove("hidden");

    // Update tournament info
    const nameElement = document.getElementById("tournament-name");
    const gameElement = document.getElementById("tournament-game");
    const participantsElement = document.getElementById(
      "tournament-participants"
    );
    const statusElement = document.getElementById("tournament-status");

    if (nameElement) nameElement.textContent = tournament.name;
    if (gameElement)
      gameElement.textContent =
        tournament.gameType === "pong" ? "Pong 3D" : "Breakout Cyber";
    if (participantsElement)
      participantsElement.textContent = `${
        tournament.currentParticipants || 0
      }/${tournament.maxParticipants}`;
    if (statusElement)
      statusElement.textContent = this.getTournamentStatusText(
        tournament.status
      );

    // Show/hide action buttons based on tournament status
    const joinButton = document.getElementById("join-tournament-btn");
    const startButton = document.getElementById("start-tournament-btn");

    if (tournament.status === "registration") {
      if (joinButton) joinButton.classList.remove("hidden");
      if (startButton) startButton.classList.add("hidden");
    } else if (tournament.status === "active") {
      if (joinButton) joinButton.classList.add("hidden");
      if (startButton) startButton.classList.add("hidden");
    }

    // Add event listeners
    if (joinButton && !joinButton.hasAttribute("data-listener")) {
      joinButton.setAttribute("data-listener", "true");
      joinButton.addEventListener("click", () => {
        this.joinTournament(tournament.id);
      });
    }

    if (startButton && !startButton.hasAttribute("data-listener")) {
      startButton.setAttribute("data-listener", "true");
      startButton.addEventListener("click", () => {
        this.startTournament(tournament.id);
      });
    }

    const bracketButton = document.getElementById("view-bracket-btn");
    if (bracketButton && !bracketButton.hasAttribute("data-listener")) {
      bracketButton.setAttribute("data-listener", "true");
      bracketButton.addEventListener("click", () => {
        this.loadTournamentBracket(tournament.id);
      });
    }
  }

  private async loadTournamentBracket(tournamentId: string) {
    try {
      const response = await this.apiService.getTournamentBracket(tournamentId);

      if (response.success && response.data) {
        this.renderTournamentBracket(response.data);
      } else {
        this.showNotification(
          response.message || "Errore nel caricamento del tabellone",
          "error"
        );
      }
    } catch (error) {
      console.error("Load tournament bracket error:", error);
      this.showNotification(
        "Errore durante il caricamento del tabellone",
        "error"
      );
    }
  }

  private renderTournamentBracket(bracket: any) {
    const bracketElement = document.getElementById("tournament-bracket");
    if (!bracketElement) return;

    // This is a simplified bracket rendering
    // In a real implementation, you would create a more complex visualization
    bracketElement.innerHTML = `
      <div class="text-center">
        <p class="text-cyber-green mb-4">Tabellone del torneo</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${
            bracket.rounds
              ? bracket.rounds
                  .map(
                    (round: any, index: number) => `
            <div class="cyber-card">
              <h3 class="text-lg font-bold text-cyber-green mb-2">Round ${
                index + 1
              }</h3>
              <div class="space-y-2">
                ${
                  round.matches
                    ? round.matches
                        .map(
                          (match: any) => `
                  <div class="border border-cyber-green rounded p-2">
                    <div class="flex justify-between">
                      <span>${match.player1 || "TBD"}</span>
                      <span>VS</span>
                      <span>${match.player2 || "TBD"}</span>
                    </div>
                    ${
                      match.winner
                        ? `<div class="text-cyber-cyan text-sm">Vincitore: ${match.winner}</div>`
                        : ""
                    }
                  </div>
                `
                        )
                        .join("")
                    : "<p>Nessuna partita</p>"
                }
              </div>
            </div>
          `
                  )
                  .join("")
              : "<p>Nessun round disponibile</p>"
          }
        </div>
      </div>
    `;
  }

  private async startTournament(tournamentId: string) {
    try {
      const response = await this.apiService.startTournament(tournamentId);

      if (response.success) {
        this.showNotification("Torneo avviato con successo!", "success");
        this.loadTournamentDetails(tournamentId); // Reload tournament details
      } else {
        this.showNotification(
          response.message || "Errore nell'avvio del torneo",
          "error"
        );
      }
    } catch (error) {
      console.error("Start tournament error:", error);
      this.showNotification("Errore durante l'avvio del torneo", "error");
    }
  }

  private renderChatPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto h-96">
        <h1 class="cyber-title text-center">CHAT CYBER</h1>
        <div class="flex h-80">
          <div id="chat-sidebar" class="w-1/3 border-r border-cyber-green pr-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Utenti Online</h2>
            <div class="mb-3">
              <input
                type="text"
                id="user-search-input"
                class="cyber-input w-full text-sm"
                placeholder="Cerca utenti..."
                maxlength="50"
              >
            </div>
            <div id="search-results" class="space-y-2 mb-3 hidden">
              <!-- Search results will be rendered here -->
            </div>
            <div id="users-list" class="space-y-2">
              <!-- Users list will be rendered here -->
            </div>
          </div>
          <div id="chat-main" class="flex-1 pl-4 flex flex-col">
            <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 space-y-2">
              <!-- Chat messages will be rendered here -->
            </div>
            <div class="flex space-x-2">
              <input type="text" id="message-input" class="cyber-input flex-1" placeholder="Digita un messaggio...">
              <button id="send-message" class="cyber-button">Invia</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize chat
    this.initializeChat();
  }

  private renderProfilePage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    // Check authentication state before applying auth guard
    const authState = authService.getState();
    console.log("Profile page - Auth state:", authState);

    if (!authState.isAuthenticated) {
      console.log(
        "Profile page - User not authenticated, redirecting to login"
      );
      // Redirect to login if not authenticated
      this.router.navigate("/login");
      return;
    }

    console.log("Profile page - User authenticated, showing profile");
    // Create and apply auth guard to profile page
    const authGuard = createAuthGuard(contentElement);
    authGuard.protect(contentElement);

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="cyber-title text-3xl">PROFILO UTENTE</h1>
          <button id="logout-btn" class="cyber-button-sm">
            <i class="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </div>

        <div id="profile-loading" class="text-center text-cyber-green py-8">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Caricamento profilo...</p>
        </div>

        <div id="profile-content" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Informazioni</h2>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Username:</span>
                  <span id="profile-username">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Email:</span>
                  <span id="profile-email">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Display Name:</span>
                  <span id="profile-display-name">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Stato:</span>
                  <span id="profile-status" class="text-cyber-cyan">Online</span>
                </div>
              </div>
            </div>

            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Statistiche Pong</h2>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Vittorie:</span>
                  <span id="pong-wins">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Sconfitte:</span>
                  <span id="pong-losses">-</span>
                </div>
                <div class="flex justify-between">
                  <span>Ratio:</span>
                  <span id="pong-ratio">-</span>
                </div>
              </div>
            </div>

            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Statistiche Breakout</h2>
              <div class="space-y-2">
              <div class="flex justify-between">
                <span>Livelli Completati:</span>
                <span id="breakout-levels">15</span>
              </div>
              <div class="flex justify-between">
                <span>Punteggio Max:</span>
                <span id="breakout-highscore">12500</span>
              </div>
              <div class="flex justify-between">
                <span>Power-up Raccolti:</span>
                <span id="breakout-powerups">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load real user data and stats
    this.loadProfileData();

    // Add logout event listener
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.handleLogout();
      });
    }
  }

  private async loadProfileData() {
    try {
      const authState = authService.getState();

      if (!authState.isAuthenticated || !authState.user) {
        this.router.navigate("/login");
        return;
      }

      // Show loading
      const loadingElement = document.getElementById("profile-loading");
      const contentElement = document.getElementById("profile-content");

      if (loadingElement) loadingElement.classList.remove("hidden");
      if (contentElement) contentElement.classList.add("hidden");

      // Get user stats from API
      const userStatsResponse = await this.apiService.getUserStats(
        authState.user.id
      );

      if (userStatsResponse.success && userStatsResponse.data) {
        // Update profile with real data
        this.updateProfileDisplay(authState.user, userStatsResponse.data);
      } else {
        // Show error and use basic user info
        this.updateProfileDisplay(authState.user, null);
        this.showNotification("Impossibile caricare le statistiche", "error");
      }

      // Hide loading, show content
      if (loadingElement) loadingElement.classList.add("hidden");
      if (contentElement) contentElement.classList.remove("hidden");
    } catch (error) {
      console.error("Error loading profile data:", error);

      const loadingElement = document.getElementById("profile-loading");
      const contentElement = document.getElementById("profile-content");

      if (loadingElement) loadingElement.classList.add("hidden");
      if (contentElement) contentElement.classList.remove("hidden");

      this.showNotification("Errore nel caricamento del profilo", "error");
    }
  }

  private updateProfileDisplay(user: any, stats: any) {
    // Update user info
    const usernameEl = document.getElementById("profile-username");
    const emailEl = document.getElementById("profile-email");
    const displayNameEl = document.getElementById("profile-display-name");

    if (usernameEl) usernameEl.textContent = user.username || "N/A";
    if (emailEl) emailEl.textContent = user.email || "N/A";
    if (displayNameEl)
      displayNameEl.textContent = user.display_name || user.username || "N/A";

    // Update stats if available - handle the actual API response format
    if (stats) {
      const pongWinsEl = document.getElementById("pong-wins");
      const pongLossesEl = document.getElementById("pong-losses");
      const pongRatioEl = document.getElementById("pong-ratio");
      const tournamentsPlayedEl = document.getElementById("tournaments-played");
      const tournamentsWonEl = document.getElementById("tournaments-won");

      // Handle API response format: { wins: 0, losses: 0, tournaments_played: 0, tournaments_won: 0 }
      const wins = stats.wins || stats.pong?.wins || "0";
      const losses = stats.losses || stats.pong?.losses || "0";
      const tournamentsPlayed =
        stats.tournaments_played || stats.tournaments?.played || "0";
      const tournamentsWon =
        stats.tournaments_won || stats.tournaments?.won || "0";

      if (pongWinsEl) pongWinsEl.textContent = wins.toString();
      if (pongLossesEl) pongLossesEl.textContent = losses.toString();
      if (tournamentsPlayedEl)
        tournamentsPlayedEl.textContent = tournamentsPlayed.toString();
      if (tournamentsWonEl)
        tournamentsWonEl.textContent = tournamentsWon.toString();

      if (pongRatioEl) {
        const winsNum = parseInt(wins.toString());
        const lossesNum = parseInt(losses.toString());
        const ratio =
          lossesNum > 0
            ? (winsNum / lossesNum).toFixed(2)
            : winsNum > 0
            ? "∞"
            : "0";
        pongRatioEl.textContent = ratio;
      }

      // For breakout stats, use placeholder data since API doesn't return them yet
      const breakoutLevelsEl = document.getElementById("breakout-levels");
      const breakoutHighscoreEl = document.getElementById("breakout-highscore");
      const breakoutPowerupsEl = document.getElementById("breakout-powerups");

      if (breakoutLevelsEl)
        breakoutLevelsEl.textContent = stats.breakout?.levels || "0";
      if (breakoutHighscoreEl)
        breakoutHighscoreEl.textContent = stats.breakout?.highscore || "0";
      if (breakoutPowerupsEl)
        breakoutPowerupsEl.textContent = stats.breakout?.powerups || "0";
    }
  }

  private async handleLogout() {
    try {
      await authService.logout();

      // Update navbar to reset username
      if (this.navbar) {
        this.navbar.updateUsername("-");
      }

      this.showNotification("Logout effettuato con successo", "success");
      this.router.navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      this.showNotification("Errore durante il logout", "error");
    }
  }

  private async renderSettingsPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div id="settings-container" class="max-w-4xl mx-auto">
        <!-- GameSettings component will be rendered here -->
      </div>
    `;

    // Create and initialize GameSettings component
    const gameSettings = new GameSettingsComponent();
    gameSettings.render(document.getElementById("settings-container")!);
  }

  private renderNotFoundPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-md mx-auto text-center">
        <h1 class="cyber-title text-3xl mb-4">ERRORE 404</h1>
        <p class="terminal-text mb-6">Pagina non trovata. Il sistema cyber ha rilevato un'anomalia.</p>
        <a href="/" class="cyber-button inline-block">Torna alla Home</a>
      </div>
    `;
  }

  private async handleLogin(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Use AuthService for login (this handles token storage and state management)
      const response = await authService.login(email, password);

      if (response.success) {
        // Show success notification
        this.showNotification("Login effettuato con successo!", "success");

        // Update navbar with user data
        if (this.navbar && response.user) {
          const username = response.user.username || "-";
          this.navbar.updateUsername(username);
          this.navbar["updateUserUI"]();
        }

        // Trigger a custom event to notify other components about the login
        window.dispatchEvent(
          new CustomEvent("userLoggedIn", {
            detail: { user: response.user },
          })
        );

        // Redirect to profile page

        this.router.navigate("/profile");
      } else {
        // Show error message
        this.showNotification(
          response.message || "Credenziali non valide. Riprova.",
          "error"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification(
        "Errore durante il login. Riprova più tardi.",
        "error"
      );
    }
  }

  private validatePassword(password: string): {
    isValid: boolean;
    message: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "La password deve contenere almeno 8 caratteri.",
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "La password deve contenere almeno una lettera minuscola.",
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "La password deve contenere almeno una lettera maiuscola.",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "La password deve contenere almeno un numero.",
      };
    }

    return { isValid: true, message: "" };
  }

  private async handleRegister(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const displayName = formData.get("display-name") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      this.showNotification("Le password non coincidono.", "error");
      return;
    }

    // Validate password requirements
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      this.showNotification(passwordValidation.message, "error");
      return;
    }

    try {
      // Call API service for registration
      const response = await this.apiService.register(
        username,
        email,
        password,
        displayName
      );

      if (response.success) {
        // Show success message
        this.showNotification(
          "Registrazione completata. Ora puoi accedere.",
          "success"
        );

        // Redirect to login page
        this.router.navigate("/login");
      } else {
        // Show error message
        this.showNotification(
          response.message || "Errore durante la registrazione.",
          "error"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.showNotification(
        "Errore durante la registrazione. Riprova più tardi.",
        "error"
      );
    }
  }

  private async handleAccountSettings(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newUsername = formData.get("new-username") as string;
    const newEmail = formData.get("new-email") as string;

    try {
      // Call API service to update account
      const response = await this.apiService.updateAccount(
        newUsername,
        newEmail
      );

      if (response.success) {
        this.showNotification("Account aggiornato con successo.", "success");
      } else {
        this.showNotification(
          response.message || "Errore durante l'aggiornamento.",
          "error"
        );
      }
    } catch (error) {
      console.error("Account update error:", error);
      this.showNotification(
        "Errore durante l'aggiornamento. Riprova più tardi.",
        "error"
      );
    }
  }

  private async handleGameSettings(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const ballSpeed = formData.get("ball-speed") as "slow" | "normal" | "fast";
    const powerUps = formData.get("power-ups") === "on";
    const theme = formData.get("theme") as "classic" | "cyber" | "neon";

    try {
      // Call API service to update game settings
      const response = await this.apiService.updateGameSettings("pong", {
        ballSpeed,
        powerUps,
        theme,
      });

      if (response.success) {
        this.showNotification(
          "Impostazioni di gioco salvate con successo.",
          "success"
        );
      } else {
        this.showNotification(
          response.message || "Errore durante il salvataggio.",
          "error"
        );
      }
    } catch (error) {
      console.error("Game settings update error:", error);
      this.showNotification(
        "Errore durante il salvataggio. Riprova più tardi.",
        "error"
      );
    }
  }

  private initializeBreakoutGame() {
    const canvasContainer = document.getElementById(
      "breakout-canvas-container"
    );
    if (!canvasContainer) return;

    // Create and initialize BreakoutCanvas
    const breakoutCanvas = new BreakoutCanvas();
    breakoutCanvas.render(canvasContainer);

    // Set score callback
    breakoutCanvas.updateScore = (
      score: number,
      level: number,
      lives: number
    ) => {
      const scoreElement = document.getElementById("breakout-score");
      const levelElement = document.getElementById("breakout-level");
      const livesElement = document.getElementById("breakout-lives");

      if (scoreElement) scoreElement.textContent = score.toString();
      if (levelElement) levelElement.textContent = level.toString();
      if (livesElement) livesElement.textContent = lives.toString();

      // Check for game over
      if (lives <= 0) {
        const winner = "PLAYER 1";
        this.showNotification(`Game Over! Vincitore: ${winner}`, "error");
      }
    };

    // Add event listeners for game controls
    const startButton = document.getElementById("start-breakout");
    if (startButton) {
      startButton.addEventListener("click", () => {
        console.log("Starting Breakout game...");
        this.startBreakoutGame("pvp");
      });
    }

    const settingsButton = document.getElementById("breakout-settings");
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        this.router.navigate("/settings");
      });
    }
  }

  private initializeTournamentsPage() {
    // Add event listeners for tournament creation
    const createT4Button = document.getElementById("create-t4-tournament");
    if (createT4Button) {
      createT4Button.addEventListener("click", () => {
        this.createTournament(4);
      });
    }

    const createT8Button = document.getElementById("create-t8-tournament");
    if (createT8Button) {
      createT8Button.addEventListener("click", () => {
        this.createTournament(8);
      });
    }

    // Load tournaments
    this.loadTournaments();
  }

  private async createTournament(maxParticipants: number) {
    try {
      const tournamentType = maxParticipants === 4 ? "T4" : "T8";
      const tournamentData = {
        name: `Torneo ${tournamentType} - ${new Date().toLocaleDateString()}`,
        gameType: "pong", // Default to pong, could be extended
        maxParticipants,
        type: tournamentType.toLowerCase(),
      };

      const response = await this.apiService.createTournament(tournamentData);

      if (response.success) {
        this.showNotification(
          `Torneo ${tournamentType} creato con successo!`,
          "success"
        );
        this.loadTournaments(); // Reload tournaments list
      } else {
        this.showNotification(
          response.message || "Errore nella creazione del torneo",
          "error"
        );
      }
    } catch (error) {
      console.error("Create tournament error:", error);
      this.showNotification("Errore durante la creazione del torneo", "error");
    }
  }

  private async loadTournaments() {
    try {
      const response = await this.apiService.getTournaments();

      if (response.success && response.data) {
        const tournaments = response.data;
        const activeTournaments = tournaments.filter(
          (t: any) => t.status === "active" || t.status === "registration"
        );
        const pastTournaments = tournaments.filter(
          (t: any) => t.status === "completed"
        );

        this.renderTournamentsList(activeTournaments, "active-tournaments");
        this.renderTournamentsList(pastTournaments, "past-tournaments");
      } else {
        this.showTournamentsError("active-tournaments");
        this.showTournamentsError("past-tournaments");
      }
    } catch (error) {
      console.error("Load tournaments error:", error);
      this.showTournamentsError("active-tournaments");
      this.showTournamentsError("past-tournaments");
    }
  }

  private renderTournamentsList(tournaments: any[], containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tournaments.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 py-4">
          <p>Nessun torneo ${
            containerId === "active-tournaments" ? "attivo" : "passato"
          } disponibile</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tournaments
      .map(
        (tournament) => `
      <div class="border border-cyber-green rounded p-4 hover:bg-cyber-dark/50 transition-colors">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold text-cyber-green">${
              tournament.name
            }</h3>
            <p class="text-sm text-gray-400">
              Gioco: ${
                tournament.gameType === "pong" ? "Pong 3D" : "Breakout Cyber"
              } | 
              Partecipanti: ${tournament.currentParticipants || 0}/${
          tournament.maxParticipants
        } |
              Stato: ${this.getTournamentStatusText(tournament.status)}
            </p>
            ${
              tournament.winner
                ? `<p class="text-sm text-cyber-cyan">Vincitore: ${tournament.winner}</p>`
                : ""
            }
          </div>
          <div class="flex space-x-2">
            ${
              tournament.status === "registration"
                ? `<button class="cyber-button-sm" onclick="app.joinTournament('${tournament.id}')">Iscriviti</button>`
                : tournament.status === "active"
                ? `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Visualizza</button>`
                : `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Risultati</button>`
            }
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  private showTournamentsError(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="text-center text-cyber-magenta py-4">
        <p>Errore nel caricamento dei tornei</p>
      </div>
    `;
  }

  private getTournamentStatusText(status: string): string {
    switch (status) {
      case "registration":
        return "Iscrizioni aperte";
      case "active":
        return "In corso";
      case "completed":
        return "Completato";
      default:
        return status;
    }
  }

  async joinTournament(tournamentId: string) {
    try {
      const response = await this.apiService.registerForTournament(
        tournamentId
      );

      if (response.success) {
        this.showNotification(
          "Iscrizione al torneo effettuata con successo!",
          "success"
        );
        this.loadTournaments(); // Reload tournaments list
      } else {
        this.showNotification(
          response.message || "Errore nell'iscrizione al torneo",
          "error"
        );
      }
    } catch (error) {
      console.error("Join tournament error:", error);
      this.showNotification("Errore durante l'iscrizione al torneo", "error");
    }
  }

  viewTournament(tournamentId: string) {
    // Navigate to tournament details page
    this.router.navigate(`/tournament/${tournamentId}`);
  }

  private initializeChat() {
    const chatMain = document.getElementById("chat-main");
    if (!chatMain) return;

    // Cleanup existing chatBox if any
    if (this.chatBox) {
      this.chatBox.cleanup();
    }

    // Create and initialize ChatBox
    this.chatBox = new ChatBox();
    this.chatBox.render(chatMain);

    // Make chatBox globally available for button onclick handlers
    window.chatBox = this.chatBox;

    // Add event listeners for chat controls
    const sendButton = document.getElementById("send-message");
    const messageInput = document.getElementById(
      "message-input"
    ) as HTMLInputElement;

    if (sendButton && messageInput) {
      sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message) {
          console.log("Sending message:", message);
          messageInput.value = "";
          // Message sending logic is handled by ChatBox component
        }
      });

      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendButton.click();
        }
      });
    }
  }

  private showNotification(
    message: string,
    type: "success" | "error" | "info" = "info"
  ) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-20 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === "success"
        ? "bg-cyber-green text-cyber-black"
        : type === "error"
        ? "bg-cyber-magenta text-white"
        : "bg-cyber-cyan text-cyber-black"
    }`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  private async checkForPendingMatch(): Promise<any> {
    try {
      const authState = authService.getState();
      const userId = authState.user?.id?.toString();
      if (!userId) return null;

      console.log("Checking for pending matches for user:", userId);
      const myMatches = await this.apiService.getUserMatchHistory(userId);
      console.log("Match history response:", myMatches);

      // L'API restituisce direttamente un array di match, non un oggetto con proprietà .data.matches
      const matchesArray = Array.isArray(myMatches.data)
        ? myMatches.data
        : myMatches;

      // Trova il match pending più recente (con l'ID più grande)
      const recentPending = (matchesArray as any).find(
        (m: any) => m.status === "pending" && Number(m.game_id) === 1
      );

      if (recentPending) {
        console.log("Found pending match:", recentPending);
        this.currentMatchId = String(recentPending.id);

        // Otteniamo i dettagli completi del match inclusi i giocatori
        try {
          const matchDetails = await this.apiService.getMatch(
            this.currentMatchId
          );
          console.log("Match details:", matchDetails);

          if (
            matchDetails.success &&
            matchDetails.data &&
            matchDetails.data.players
          ) {
            const meId = authState.user?.id;
            const opponentPlayer = matchDetails.data.players.find(
              (p: any) => String(p.user_id) !== String(meId)
            );

            if (opponentPlayer) {
              this.currentOpponentId = String(opponentPlayer.user_id);
              try {
                const opp = await this.apiService.getUserById(
                  this.currentOpponentId
                );
                if (opp.success && opp.data)
                  this.currentOpponentUsername = opp.data.username || null;
              } catch {}
            }

            // Restituisci tutti i dati del match invece di solo true
            return {
              match: matchDetails.data,
              opponentId: this.currentOpponentId,
              opponentUsername: this.currentOpponentUsername,
              myId: meId,
            };
          }
        } catch (error) {
          console.error("Error fetching match details:", error);
        }
      }
      return null;
    } catch (err) {
      console.error("Error checking for pending match:", err);
      return null;
    }
  }

  private showMatchmakingError(contentElement: HTMLElement, message: string) {
    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-times-circle text-4xl text-cyber-magenta mb-4"></i>
        <p class="text-lg text-cyber-magenta mb-2">Errore</p>
        <p class="text-sm text-gray-400">${message}</p>
      </div>
    `;
  }

  private async cancelPongMatchmaking() {
    try {
      this.matchmakingCancelled = true;
      // Leave matchmaking queue
      await this.apiService.leaveMatchmaking();
      this.showNotification("Matchmaking annullato", "info");
    } catch (error) {
      console.error("Error leaving matchmaking:", error);
    }
  }
}
