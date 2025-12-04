import { Router } from "./router/Router";
import { Navbar } from "./components/Navbar";
import {
  ApiService,
  ApiResponse,
  User,
  MatchDetails,
} from "./services/ApiService";
import { authService } from "./services/AuthService";
import { createAuthGuard } from "./components/AuthGuard";
import { PongCanvas } from "./components/PongCanvas";
import { ChatBox } from "./components/ChatBox";
import { BreakoutCanvas } from "./components/BreakoutCanvas";
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

// Interface for match data
interface Match {
  id: number;
  game_id: number;
  status: "pending" | "in_progress" | "finished" | "cancelled";
  winner_id: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  settings: any;
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
    this.router.addRoute("/oauth/callback", () => this.handleOAuthCallback());
    this.router.addRoute("/games", () => this.renderGamesPage());
    this.router.addRoute("/pong", () => this.renderPongPage());
    this.router.addRoute("/breakout", () => this.renderBreakoutPage());
    this.router.addRoute("/tournaments", () => this.renderTournamentsPage());
    this.router.addRoute("/tournament/:id", (params: any) =>
      this.renderTournamentDetailsPage(params.id)
    );
    this.router.addRoute("/chat", () => this.renderChatPage());
    this.router.addRoute("/friends", () => this.renderFriendsPage());
    this.router.addRoute("/profile", () => this.renderProfilePage());

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
    const googleIcon = `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/2560px-Google_Favicon_2025.svg.png" alt="Google" class="w-4 h-4">`;
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
             <p class="text-sm mb-4">Oppure</p>
            <button id="google-login-btn" class="cyber-button w-full flex items-center justify-center gap-2"> ${googleIcon}Accedi con Google</button>
          </div>
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

    // Add Google login button handler
    const googleLoginBtn = document.getElementById("google-login-btn");
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener(
        "click",
        this.handleGoogleLogin.bind(this)
      );
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
            <p class="terminal-text mb-4">Il classico gioco Pong con grafica 3D</p>
            <a href="/pong" class="cyber-button inline-block">Gioca Ora</a>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">BREAKOUT</h2>
            <p class="terminal-text mb-4">Distruggi i mattoni in un'arena futuristica</p>
            <a href="/breakout" class="cyber-button inline-block">Gioca Ora</a>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEI CYBER</h2>
            <p class="terminal-text mb-4">Partecipa a tornei epici e diventa il campione</p>
            <a href="/tournaments" class="cyber-button inline-block">Scopri Tornei</a>
          </div>
        </div>
      </div>
    `;
  }

  private renderPongPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    // Check if there's a matchId parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdParam = urlParams.get("matchId");

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">PONG 3D</h1>
        
        <!-- Game State Container -->
        <div id="pong-game-container" class="flex flex-col items-center">
          <div class="cyber-card w-full max-w-2xl">
            <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">CARICAMENTO...</h2>
            <div class="text-center text-cyber-green">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
              <p class="mt-2">Caricamento partita...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Check for specific match ID in URL before initializing game states
    setTimeout(async () => {
      try {
        if (matchIdParam) {
          // Specific match ID provided, load this match directly
          console.log("Loading specific match with ID:", matchIdParam);

          const matchResponse = await this.apiService.getMatch(matchIdParam);
          if (matchResponse) {
            const match = matchResponse;
            const authState = authService.getState();
            const myId = authState.user?.id;

            // Find opponent player
            const opponentPlayer = match.players?.find(
              (p: any) => String(p.user_id) !== String(myId)
            );

            // Set current match ID
            this.currentMatchId = matchIdParam;
            this.currentOpponentId = opponentPlayer
              ? String(opponentPlayer.user_id)
              : null;
            this.currentOpponentUsername = opponentPlayer
              ? (await this.apiService.getUserById(opponentPlayer.user_id))
                  ?.data?.username || null
              : null;

            console.log("match", match);
            this.startPongGame("pvp", "3");
          } else {
            console.error("Failed to load match details");
            this.showNotification(
              "Errore nel caricamento della partita",
              "error"
            );
            // Fallback to normal game states
            this.initializePongGameWithStates();
          }
        } else {
          // No specific match ID, check for pending matches
          const pendingMatch = await this.checkForPendingMatch();

          if (pendingMatch && pendingMatch.match) {
            // Found a pending match, go directly to match state
            console.log("Found pending match, going directly to game state");
            const gameContainer = document.getElementById(
              "pong-game-container"
            );
            if (gameContainer) {
              // Extract match data
              const match = pendingMatch.match;
              const authState = authService.getState();
              const myId = authState.user?.id;

              // Find opponent player
              const opponentPlayer = match.players?.find(
                (p: any) => String(p.user_id) !== String(myId)
              );

              // Render game state directly
              this.renderPongGameState(
                gameContainer,
                "pvp",
                Number(myId) || 1,
                Number(opponentPlayer?.user_id) || 2,
                undefined,
                {
                  autoStart: false, // Don't auto-start, let user decide
                  player1Name: authState.user?.username || "PLAYER 1",
                  player2Name: opponentPlayer
                    ? `Giocatore ${opponentPlayer.user_id}`
                    : "PLAYER 2",
                }
              );
            }
          } else {
            // No pending match, initialize normal game states
            console.log(
              "No pending match found, initializing normal game states"
            );
            this.initializePongGameWithStates();
          }
        }
      } catch (error) {
        console.error("Error checking for match:", error);
        // Fallback to normal game states
        this.initializePongGameWithStates();
      }
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

    console.log("Rendering Pong Canvas ensomma");
    if (canvasContainer) {
      this.currentPongCanvas = new PongCanvas(
        async (winnerId: number | null) => {}, // finishGame
        async (score: number) => {}, // updateScorep1
        async (score: number) => {} // updateScorep2
      );
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
    player1Id: number,
    player2Id: number,
    difficulty?: string,
    options?: {
      autoStart?: boolean;
      player1Name?: string;
      player2Name?: string;
    }
  ) {
    // Check if a game canvas already exists and dispose it
    if (this.currentPongCanvas) {
      this.currentPongCanvas.dispose();
      this.currentPongCanvas = null;
    }

    // Get player names for PvP
    let player1Name = options?.player1Name || "PLAYER 1";
    let player2Name =
      options?.player2Name ||
      (mode === "pvp" ? "PLAYER 2" : `BOT (${difficulty?.toUpperCase()})`);

    console.log("IN RENDER PONG GAME STATE");
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
      
      </div>
    `;

    // Initialize canvas
    const canvasContainer = document.getElementById("pong-canvas-container");
    if (canvasContainer) {
      // Create a new canvas instance for the game state

      console.log("Rendering Pong Game State ensomma");
      const pongCanvas = new PongCanvas(
        async (winnerId: number | null) => {
          // chiamate api per finire la partita
          await this.apiService.finishMatch(this.currentMatchId || "", {
            winner_id: winnerId,
          });
        }, // finishGame
        async (player1Score: number) => {
          // chiamate api per aggiornare il punteggio del giocatore 1
          await this.apiService.updatePlayerScore(this.currentMatchId || "", {
            user_id: player1Id,
            score: player1Score,
          });
        }, // updateScorep1
        async (player2Score: number) => {
          // chiamate api per aggiornare il punteggio del giocatore 2
          await this.apiService.updatePlayerScore(this.currentMatchId || "", {
            user_id: player2Id,
            score: player2Score,
          });
        } // updateScorep2
      );
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
      this.renderPongGameState(gameContainer, mode, 1, 2, difficulty);
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

        // Check if we're already in queue (this is not an error)
        if (
          joinResponse ||
          joinResponse.message === "Joined matchmaking queue" ||
          joinResponse.error === "Already in queue"
        ) {
          // Successfully joined queue or already in queue, now try to find a match
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

    console.log("matchData", matchData);
    console.log("contentElement", contentElement);

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

      console.log("Ready match response:", response);

      if (response) {
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

      if (response) {
        const match = response;
        const authState = authService.getState();
        const myIdNum: number | null = authState.user?.id
          ? Number(authState.user.id)
          : null;
        const oppIdNum: number | null = this.currentOpponentId
          ? Number(this.currentOpponentId)
          : null;
        const meName = authState.user?.username || "PLAYER 1";
        const oppName = this.currentOpponentUsername || "PLAYER 2";

        // Find current player in the match
        const currentPlayer = match.players?.find(
          (p: any) => String(p.user_id) === String(myIdNum)
        );

        const allPlayersReady = match.players?.every((p: any) => p.is_ready);

        console.log("Checking match ready status:", {
          matchId: this.currentMatchId,
          matchStatus: match.status,
          allPlayersReady,
          currentPlayer,
          players: match.players,
        });

        if (match.status === "cancelled") {
          this.showNotification("Partita annullata", "error");
          this.currentMatchId = null;
          this.currentOpponentId = null;
          this.currentOpponentUsername = null;
          this.initializePongGameWithStates();
          return;
        }

        if (match.status === "pending" && allPlayersReady) {
          // All players are ready but match is still pending, update status to in_progress
          console.log(
            "All players ready, updating match status to in_progress"
          );

          try {
            const updateResponse = await this.apiService.updateMatchStatus(
              this.currentMatchId.toString(),
              "in_progress"
            );

            console.log("Update match status response:", updateResponse);

            if (updateResponse.success) {
              // Status updated successfully, now check again
              setTimeout(() => this.checkMatchReady(), 2000);
            } else {
              console.error(
                "Failed to update match status:",
                updateResponse.message
              );
            }
          } catch (error) {
            console.error("Error updating match status:", error);
          }
        } else if (match.status === "pending" && !allPlayersReady) {
          // Not all players are ready yet
          if (currentPlayer && currentPlayer.is_ready) {
            this.updateWaitingForOpponentUI();
          }
          setTimeout(() => this.checkMatchReady(), 2000);
        } else if (match.status === "in_progress") {
          // Match is in progress, determine who should start the game
          if (allPlayersReady) {
            // All players are ready and match is in progress
            const hostId = Math.min(myIdNum!, oppIdNum!);
            const amIHost = myIdNum === hostId;

            console.log("Match in progress, host determination:", {
              myIdNum,
              oppIdNum,
              hostId,
              amIHost,
            });

            if (amIHost) {
              // I'm the host, start the game on my machine
              const gameContainer = document.getElementById(
                "pong-game-container"
              );
              if (gameContainer) {
                this.currentMatchHost = String(hostId);
                console.log("INIZIO PARTITA PVP");
                this.renderPongGameState(
                  gameContainer,
                  "pvp",
                  myIdNum!,
                  oppIdNum!,
                  undefined,
                  {
                    autoStart: true,
                    player1Name: meName,
                    player2Name: oppName,
                  }
                );
                this.showNotification(
                  "Entrambi pronti. Puoi iniziare la partita.",
                  "success"
                );
              }
            } else {
              // I'm not the host, show info message
              this.showMatchHostedByOther(oppName);
            }
          } else {
            // Match is in progress but not all players are ready yet
            setTimeout(() => this.checkMatchReady(), 2000);
          }
        } else {
          // Other status, poll again after a delay
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
      // Cancel the match using the new cancel API
      const response = await this.apiService.cancelMatch(
        this.currentMatchId.toString()
      );
      console.log("Cancel match response:", response);

      if (response.success) {
        this.showNotification("Partita abbandonata con successo", "info");
      } else {
        this.showNotification(
          response.message || "Errore nell'abbandonare la partita",
          "error"
        );
      }

      // Reset match data
      this.currentMatchId = null;
      this.currentOpponentId = null;
      this.currentOpponentUsername = null;

      // Go back to game selection
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
          await this.apiService.updatePlayerScore(this.currentMatchId, {
            user_id: this.currentPongPlayer1Id,
            score: player1Score,
          });
          this.lastReportedPongScoreP1 = player1Score;
        }
        if (
          player2Score > this.lastReportedPongScoreP2 &&
          this.currentPongPlayer2Id
        ) {
          await this.apiService.updatePlayerScore(this.currentMatchId, {
            user_id: this.currentPongPlayer2Id,
            score: player2Score,
          });
          this.lastReportedPongScoreP2 = player2Score;
        }
      } catch (error) {
        console.error("Error updating match score:", error);
      }
    }

    // Update UI scores
    if (this.currentPongCanvas) {
      // Call the updateScore method with both scores
      this.currentPongCanvas.updateScore(player1Score, player2Score);
    }

    // Check for game over
    if (player1Score >= maxScore || player2Score >= maxScore) {
      const winnerPlayerId =
        player1Score >= maxScore
          ? this.currentPongPlayer1Id
          : this.currentPongPlayer2Id;
      const winner = player1Score >= maxScore ? "PLAYER 1" : "PLAYER 2";
      this.showNotification(`Vincitore: ${winner}!`, "success");

      // Handle game over
      setTimeout(() => {
        this.handlePongGameOver(winnerPlayerId, player1Score, player2Score);
      }, 2000);
    }
  }

  private async handlePongGameOver(
    winnerId: number | null,
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

        await this.apiService.finishMatchWithWinner(this.currentMatchId, {
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
        <p class="text-xl mb-4">Vincitore: ${
          winnerId === this.currentPongPlayer1Id ? "PLAYER 1" : "PLAYER 2"
        }</p>
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
    // Finish match only for PvP games
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
        <h1 class="cyber-title text-center">BREAKOUT</h1>
        
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

    // Define game modes (only solo and pvp for Breakout)
    const gameModes: GameMode[] = [
      {
        id: "pvp",
        name: "1 VS 1",
        description: "Sfida un altro giocatore",
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

    // For PvP mode, use matchmaking
    if (modeId === "pvp") {
      this.renderBreakoutMatchmakingState(gameContainer);
    } else {
      // For solo mode, use preparation state
      this.renderBreakoutPreparationState(gameContainer, modeId);
    }
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
    const authState = authService.getState();
    const currentUserId = authState.user?.id;

    // Update score in backend if we have a match ID
    if (this.currentBreakoutMatchId) {
      console.log("Updating match score:", this.currentBreakoutMatchId, {
        score: score,
        user_id: currentUserId,
      });

      try {
        await this.apiService.updateMatchScore(this.currentBreakoutMatchId, {
          score: score,
          user_id: currentUserId,
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
  private currentBreakoutOpponentId: string | null = null;
  private currentBreakoutMatchHost: string | null = null;
  private currentBreakoutOpponentUsername: string | null = null;
  private currentBreakoutPlayer1Id: number | null = null;
  private currentBreakoutPlayer2Id: number | null = null;
  private lastReportedBreakoutScore: number = 0;
  private breakoutMatchmakingCancelled: boolean = false;

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
            <button id="create-t4-tournament" class="cyber-button inline-block" onclick="app.showCreateTournamentDialog(4)">Crea Torneo T4</button>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEO T8</h2>
            <p class="terminal-text mb-4">Torneo a eliminazione diretta con 8 partecipanti</p>
            <button id="create-t8-tournament" class="cyber-button inline-block" onclick="app.showCreateTournamentDialog(8)">Crea Torneo T8</button>
          </div>
        </div>

        <div class="cyber-card">
          <h2 class="text-xl font-bold text-cyber-green mb-4">TORNEI PARTITI</h2>
          <div id="started-tournaments" class="space-y-4">
            <!-- Tournament list will be rendered here -->
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
                <button id="start-tournament-btn" class="cyber-button w-full">Start</button>
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

      if (response) {
        const tournament = response;
        this.updateTournamentDetailsDisplay(tournament);

        // Load tournament bracket
        await this.loadTournamentBracket(tournamentId);
      } else {
        this.showNotification(
          (response as any).message || "Errore nel caricamento del torneo",
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

    // Show/hide start button based on tournament status
    const startButton = document.getElementById("start-tournament-btn");

    if (tournament.status === "registration") {
      if (startButton) {
        startButton.classList.remove("hidden");
        startButton.textContent = "Start";
      }
    } else {
      if (startButton) startButton.classList.add("hidden");
    }

    // Add event listener for start button
    if (startButton && !startButton.hasAttribute("data-listener")) {
      startButton.setAttribute("data-listener", "true");
      startButton.addEventListener("click", () => {
        this.startTournament(tournament.id);
      });
    }
  }

  private async loadTournamentBracket(tournamentId: string) {
    try {
      const response = await this.apiService.getTournamentBracket(tournamentId);

      if (response) {
        // Create a copy of bracket data to modify
        let bracketData: any = {};

        // Handle different response formats
        if (typeof response === "object") {
          if (response.data) {
            bracketData = response.data;
          } else {
            bracketData = response;
          }
        }

        bracketData.matchesDetails = await Promise.all(
          response.matches.map(async (match: any) => {
            const matchDetails = await this.apiService.getMatch(match.id);
            return matchDetails;
          })
        );

        console.log("ensommamammamamammama", response);

        // Load next matches separately using dedicated API
        try {
          let nextMatchesResponse =
            await this.apiService.getNextTournamentMatches(tournamentId);
          if (nextMatchesResponse) {
            // Handle different response formats for next matches
            let nextMatchesData: any[] = [];
            if (nextMatchesResponse.next_matches) {
              nextMatchesData = nextMatchesResponse.next_matches;
            }

            // Update bracket with next matches data
            bracketData.next_matches = nextMatchesData;

            // Pre-fetch user names for all players in next matches
            const userIds = new Set();
            nextMatchesData.forEach((match: any) => {
              if (match.players) {
                match.players.forEach((player: any) => {
                  if (player.user_id) {
                    userIds.add(player.user_id);
                  }
                });
              }
            });

            // Fetch user data for all unique user IDs
            const userPromises = Array.from(userIds).map((userId: any) =>
              this.apiService.getUserById(userId.toString())
            );

            console.log("userPromises", await Promise.all(userPromises));
          }
        } catch (error) {
          console.error("Error loading next matches:", error);
        }

        this.renderTournamentBracket(bracketData);
      } else {
        this.showNotification("Errore nel caricamento del tabellone", "error");
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

    // Helper function to get player name by seed
    const getPlayerNameBySeed = (seed: number) => {
      const player = bracket.registrations?.find((p: any) => p.seed === seed);

      console.log("bracket", bracket);

      return player ? player.alias : `Seed ${seed}`;
    };

    // Helper function to get match status color
    const getMatchStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "text-cyber-yellow";
        case "in_progress":
          return "text-cyber-green";
        case "completed":
          return "text-cyber-cyan";
        default:
          return "text-gray-400";
      }
    };

    // Helper function to get match status text
    const getMatchStatusText = (status: string) => {
      switch (status) {
        case "pending":
          return "In attesa";
        case "in_progress":
          return "In corso";
        case "completed":
          return "Completata";
        default:
          return status;
      }
    };

    // Render bracket with all available data

    console.log("bracket", bracket);
    bracketElement.innerHTML = `
      <div class="text-center">
        <p class="text-cyber-green mb-4">Tabellone del torneo</p>
        
        <div class="mb-6">
          <h3 class="text-lg font-bold text-cyber-green mb-2">Round Corrente: ${
            bracket.current_round || "N/A"
          }</h3>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Registrations Section -->
          <div class="cyber-card">
            <h3 class="text-lg font-bold text-cyber-green mb-4">Giocatori Registrati</h3>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              ${
                bracket.registrations && bracket.registrations.length > 0
                  ? bracket.registrations
                      .map(
                        (player: any) => `
                    <div class="flex items-center justify-between p-2 border border-cyber-green/20 rounded">
                      <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-cyber-green/20 rounded-full flex items-center justify-center">
                          <i class="fas fa-user text-cyber-green text-xs"></i>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-cyber-green">${
                            player.alias
                          }</p>
                          <p class="text-xs text-gray-400">ID: ${player.id}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-gray-400">Seed: ${
                          player.seed || "N/A"
                        }</p>
                        <p class="text-xs text-gray-400">Pos: ${
                          player.final_position || "N/A"
                        }</p>
                        ${
                          player.eliminated
                            ? '<span class="text-xs text-cyber-magenta">Eliminato</span>'
                            : '<span class="text-xs text-cyber-green">Attivo</span>'
                        }
                      </div>
                    </div>
                  `
                      )
                      .join("")
                  : "<p class='text-gray-400'>Nessun giocatore registrato</p>"
              }
            </div>
          </div>
        </div>
        
        <!-- Next Matches Section -->
        ${
          bracket.matchesDetails && bracket.matchesDetails.length > 0
            ? `
            <div class="cyber-card mt-6">
              <h3 class="text-lg font-bold text-cyber-green mb-4">Prossime Partite</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${bracket.matchesDetails
                  .map((match: any) => {
                    // Get current user ID
                    const authState = authService.getState();
                    const currentUserId = authState.user?.id;

                    console.log("ensommadajeroma", match);
                    // Check if current user is in this match
                    const isUserInMatch =
                      match.players &&
                      match.status === "pending" &&
                      match.players.some(
                        (p: any) => p.user_id === currentUserId
                      );

                    // Get player names from match data or user data
                    const player1 =
                      match.players && match.players.length > 0
                        ? match.players.find((p: any) => p.position === 1)
                        : null;
                    const player2 =
                      match.players && match.players.length > 1
                        ? match.players.find((p: any) => p.position === 2)
                        : null;

                    console.log("player1", player1);
                    console.log("player2", player2);

                    console.log("bracket.registrations", bracket.registrations);

                    const player1Name = player1
                      ? (() => {
                          const registration = bracket.registrations?.find(
                            (p: any) => p.user_id === player1.user_id
                          );
                          return registration
                            ? registration.alias
                            : `Giocatore ${player1.user_id}`;
                        })()
                      : "TBD";
                    const player2Name = player2
                      ? (() => {
                          const registration = bracket.registrations?.find(
                            (p: any) => p.user_id === player2.user_id
                          );
                          return registration
                            ? registration.alias
                            : `Giocatore ${player2.user_id}`;
                        })()
                      : "TBD";

                    console.log("player1Name", player1Name);
                    console.log("player2Name", player2Name);

                    return `
                  <div class="border border-cyber-green/20 rounded p-3 hover:bg-cyber-dark/30 transition-colors">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-xs bg-cyber-green/20 text-cyber-green px-2 py-1 rounded">
                        Match #${match.id}
                      </span>
                      <div class="${getMatchStatusColor(
                        match.status || "pending"
                      )} text-xs font-medium">
                        ${getMatchStatusText(match.status || "pending")}
                      </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium">${player1Name}</span>
                      <span class="text-xs text-cyber-green">VS</span>
                      <span class="text-sm font-medium">${player2Name}</span>
                    </div>
                    
                    <div class="text-xs text-gray-400 mt-2">
                      ${
                        match.players && match.players.length > 0
                          ? `${match.players.length} giocatori`
                          : "In attesa di giocatori"
                      }
                    </div>
                    
                    ${
                      match.players && match.players.length > 0
                        ? `
                        <div class="mt-2 space-y-1">
                          ${match.players
                            .map(
                              (player: any) => `
                            <div class="flex justify-between items-center text-xs">
                              <span>${(() => {
                                const registration =
                                  bracket.registrations?.find(
                                    (p: any) => p.user_id === player.user_id
                                  );
                                return registration
                                  ? registration.alias
                                  : `Giocatore ${player.user_id}`;
                              })()}</span>
                              <div class="flex items-center space-x-2">
                                <span>Punteggio: ${player.score || 0}</span>
                                ${
                                  player.is_ready
                                    ? '<span class="text-xs bg-cyber-green/20 text-cyber-green px-1 py-0.5 rounded">Pronto</span>'
                                    : '<span class="text-xs bg-cyber-yellow/20 text-cyber-yellow px-1 py-0.5 rounded">Non pronto</span>'
                                }
                              </div>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      `
                        : ""
                    }
                    
                    <div class="text-xs text-gray-400 mt-2">
                      ${
                        match.created_at
                          ? `Creata: ${new Date(
                              match.created_at
                            ).toLocaleString()}`
                          : ""
                      }
                    </div>
                    
                    <div class="mt-3 flex justify-end">
                      ${
                        isUserInMatch
                          ? `<button class="cyber-button" onclick="app.playMatch(${match.id})">Gioca</button>`
                          : ""
                      }
                    </div>
                  </div>
                `;
                  })
                  .join("")}
              </div>
            </div>
          `
            : ""
        }
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
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">CHAT CYBER</h1>
        <div class="flex">
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

    // Check if we're viewing another user's profile
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const isViewingOtherUser = userId !== null;

    console.log("Profile page - User authenticated, showing profile");
    // Create and apply auth guard to profile page
    const authGuard = createAuthGuard(contentElement);
    authGuard.protect(contentElement);

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="cyber-title text-3xl">${
            isViewingOtherUser ? "PROFILO UTENTE" : "PROFILO PERSONALE"
          }</h1>
          ${
            !isViewingOtherUser
              ? `<button id="edit-profile-btn" class="cyber-button">
                  <i class="fas fa-edit mr-2"></i>Modifica Profilo
                </button>`
              : ""
          }
        </div>

        <div id="profile-loading" class="text-center text-cyber-green py-8">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <p class="mt-2">Caricamento profilo...</p>
        </div>

        <div id="profile-content" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Informazioni</h2>
              <div id="profile-info" class="space-y-2">
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
              <div id="profile-edit-form" class="space-y-4 hidden">
                <div>
                  <label class="block text-cyber-green mb-1">Username:</label>
                  <input type="text" id="edit-username" class="cyber-input w-full">
                </div>
                <div>
                  <label class="block text-cyber-green mb-1">Email:</label>
                  <input type="email" id="edit-email" class="cyber-input w-full">
                </div>
                <div>
                  <label class="block text-cyber-green mb-1">Display Name:</label>
                  <input type="text" id="edit-display-name" class="cyber-input w-full">
                </div>
                <div class="flex space-x-2">
                  <button id="save-profile-btn" class="cyber-button">
                    <i class="fas fa-save mr-2"></i>Salva
                  </button>
                  <button id="cancel-edit-btn" class="cyber-button bg-cyber-magenta">
                    <i class="fas fa-times mr-2"></i>Annulla
                  </button>
                </div>
              </div>
            </div>
               ${
                 !isViewingOtherUser
                   ? `
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4">Avatar</h2>
              <div class="flex flex-col items-center space-y-4">
                <div id="avatar-preview" class="w-24 h-24 rounded-full bg-cyber-dark/50 flex items-center justify-center overflow-hidden">
                  <i class="fas fa-user text-cyber-green text-2xl"></i>
                </div>

                  <div class="flex space-x-2">
                    <input type="file" id="avatar-input" accept="image/*" class="hidden">
                    <button id="upload-avatar-btn" class="cyber-button-sm">
                      <i class="fas fa-upload mr-2"></i>Carica Avatar -
                    </button>
                    <button id="remove-avatar-btn" class="cyber-button-sm bg-cyber-magenta">
                      <i class="fas fa-trash mr-2"></i>Rimuovi
                    </button>
                  </div>

              </div>
            </div>
                            `
                   : ""
               }
          </div>
          <div class="cyber-card">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Cronologia Match e Statistiche</h2>
            <div id="match-history" class="space-y-2">
              <p class="text-gray-400">Caricamento cronologia...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load user data based on whether we're viewing our own profile or someone else's
    if (isViewingOtherUser) {
      this.loadOtherUserProfileData(userId);
      // Add back to profile button event listener
      const backToProfileBtn = document.getElementById("back-to-profile-btn");
      if (backToProfileBtn) {
        backToProfileBtn.addEventListener("click", () => {
          this.router.navigate("/profile");
        });
      }
    } else {
      this.loadOwnProfileData();
      this.setupAvatarHandlers();
      this.setupProfileEditHandlers();
      // Add logout event listener
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          authService.logout();
        });
      }
    }
  }

  private async loadOwnProfileData() {
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

      // Get user match history from API
      const matchHistoryResponse = await this.apiService.getUserMatchHistory(
        authState.user.id
      );

      if (userStatsResponse) {
        // Update profile with real data
        this.updateProfileDisplay(authState.user, userStatsResponse);
      } else {
        // Show error and use basic user info
        this.updateProfileDisplay(authState.user, null);
        this.showNotification("Impossibile caricare le statistiche", "error");
      }

      // Update match history
      if (matchHistoryResponse) {
        this.updateMatchHistoryDisplay(matchHistoryResponse);
      } else {
        this.showNotification(
          "Impossibile caricare la cronologia dei match",
          "error"
        );
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
    const usernameElement = document.getElementById("profile-username");
    const emailElement = document.getElementById("profile-email");
    const displayNameElement = document.getElementById("profile-display-name");

    if (usernameElement) usernameElement.textContent = user.username || "-";
    if (emailElement) emailElement.textContent = user.email || "-";
    if (displayNameElement)
      displayNameElement.textContent =
        (user as any).display_name || user.username || "-";

    // Update avatar
    this.updateAvatarDisplay(user.avatar);

    // Update stats if available
    if (stats) {
      // Update Pong stats
      const pongWinsElement = document.getElementById("pong-wins");
      const pongLossesElement = document.getElementById("pong-losses");
      const pongRatioElement = document.getElementById("pong-ratio");

      if (pongWinsElement)
        pongWinsElement.textContent = stats.pong?.wins || "0";
      if (pongLossesElement)
        pongLossesElement.textContent = stats.pong?.losses || "0";
      if (pongRatioElement)
        pongRatioElement.textContent = stats.pong?.ratio?.toFixed(2) || "0.00";

      // Update Breakout stats
      const breakoutLevelsElement = document.getElementById("breakout-levels");
      const breakoutHighscoreElement =
        document.getElementById("breakout-highscore");
      const breakoutPowerupsElement =
        document.getElementById("breakout-powerups");

      if (breakoutLevelsElement)
        breakoutLevelsElement.textContent = stats.breakout?.levels || "0";
      if (breakoutHighscoreElement)
        breakoutHighscoreElement.textContent = stats.breakout?.highscore || "0";
      if (breakoutPowerupsElement)
        breakoutPowerupsElement.textContent = stats.breakout?.powerups || "0";
    }
  }

  private updateAvatarDisplay(avatarUrl?: string) {
    const avatarPreview = document.getElementById("avatar-preview");
    if (!avatarPreview) return;

    // Check if user has an avatar
    if (avatarUrl) {
      avatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover">`;
    } else {
      // Check localStorage for saved avatar
      const savedAvatar = this.apiService.getAvatarFromLocalStorage();
      if (savedAvatar) {
        avatarPreview.innerHTML = `<img src="${savedAvatar}" alt="Avatar" class="w-full h-full object-cover">`;
      } else {
        // Show default icon
        avatarPreview.innerHTML =
          '<i class="fas fa-user text-cyber-green text-2xl"></i>';
      }
    }
  }

  private setupAvatarHandlers() {
    const uploadBtn = document.getElementById("upload-avatar-btn");
    const removeBtn = document.getElementById("remove-avatar-btn");
    const avatarInput = document.getElementById(
      "avatar-input"
    ) as HTMLInputElement;

    if (uploadBtn && avatarInput) {
      uploadBtn.addEventListener("click", () => {
        avatarInput.click();
      });

      avatarInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          this.handleAvatarUpload(file);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        this.handleAvatarRemove();
      });
    }
  }

  private handleAvatarUpload(file: File) {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification("L'immagine è troppo grande (max 5MB)", "error");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      this.showNotification("Il file deve essere un'immagine", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Save to localStorage only
        this.apiService.saveAvatarToLocalStorage(result);

        // Update display
        this.updateAvatarDisplay(result);

        // Show success message
        this.showNotification(
          "Avatar salvato localmente con successo",
          "success"
        );
      }
    };
    reader.readAsDataURL(file);
  }

  private handleAvatarRemove() {
    // Remove from localStorage only
    this.apiService.removeAvatarFromLocalStorage();

    // Update display
    this.updateAvatarDisplay();

    // Show success message
    this.showNotification("Avatar rimosso localmente con successo", "success");
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

  // private async renderSettingsPage() {
  //   const contentElement = document.getElementById("content");
  //   if (!contentElement) return;

  //   contentElement.innerHTML = `
  //     <div id="settings-container" class="max-w-4xl mx-auto">
  //       <!-- GameSettings component will be rendered here -->
  //     </div>
  //   `;

  //   // Create and initialize GameSettings component
  //   const gameSettings = new GameSettingsComponent();
  //   gameSettings.render(document.getElementById("settings-container")!);
  // }

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

        // Redirect to home page
        this.router.navigate("/");
      } else {
        // Show error notification
        this.showNotification(response.message || "Login fallito", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Errore durante il login", "error");
    }
  }

  private async handleGoogleLogin() {
    try {
      // Use AuthService for Google OAuth login
      await authService.loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
      this.showNotification("Errore durante il login con Google", "error");
    }
  }

  private async handleOAuthCallback() {
    try {
      // Use AuthService to handle OAuth callback
      await authService.handleOAuthCallback();

      // Check if authentication was successful
      const authState = authService.getState();

      if (authState.isAuthenticated) {
        // Show success notification
        this.showNotification(
          "Login con Google effettuato con successo!",
          "success"
        );

        // Update navbar with user data
        if (this.navbar) {
          const username = authState?.user?.username || "-";
          this.navbar.updateUsername(username);
          this.navbar["updateUserUI"]();
        }

        // Trigger a custom event to notify other components about the login
        window.dispatchEvent(
          new CustomEvent("userLoggedIn", {
            detail: { user: authState.user },
          })
        );

        // Redirect to home
        this.router.navigate("/");
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      this.showNotification("Errore durante il login con Google", "error");
      this.router.navigate("/login");
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
  }

  private initializeTournamentsPage() {
    // Load tournaments
    this.loadTournaments();
  }

  private async loadTournaments() {
    try {
      const response = await this.apiService.getTournaments();

      console.log("responseensommamammamamammama", response);

      if (response) {
        const tournaments = response as any;
        const activeTournaments = tournaments.filter(
          (t: any) => t.status === "active" || t.status === "registration"
        );
        const pastTournaments = tournaments.filter(
          (t: any) => t.status === "completed"
        );
        const startedTournaments = tournaments.filter(
          (t: any) => t.status === "in_progress"
        );

        // Load registrations for tournaments in registration status to check if they're full
        // and to check if current user is already registered
        const authState = authService.getState();
        const currentUserId = authState.user?.id;

        for (const tournament of activeTournaments) {
          if (tournament.status === "registration") {
            try {
              const regResponse =
                await this.apiService.getTournamentRegistrations(tournament.id);

              console.log("regResponse", regResponse);
              if (regResponse) {
                tournament.registrationsCount = regResponse.length;
                tournament.maxPlayers =
                  tournament.max_players || tournament.maxParticipants;

                // Check if current user is already registered
                if (currentUserId) {
                  tournament.isUserRegistered = regResponse.some(
                    (reg: any) => reg.user_id === currentUserId
                  );
                }
              }
            } catch (error) {
              console.error(
                `Error loading registrations for tournament ${tournament.id}:`,
                error
              );
              tournament.registrationsCount = 0;
            }
          }
        }

        this.renderTournamentsList(startedTournaments, "started-tournaments");
        this.renderTournamentsList(activeTournaments, "active-tournaments");
        this.renderTournamentsList(pastTournaments, "past-tournaments");
      } else {
        this.showTournamentsError("started-tournaments");
        this.showTournamentsError("active-tournaments");
        this.showTournamentsError("past-tournaments");
      }
    } catch (error) {
      console.error("Load tournaments error:", error);
      this.showTournamentsError("started-tournaments");
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
            // se non è attivo o passato è partito
            containerId === "active-tournaments"
              ? "attivo"
              : containerId === "past-tournaments"
              ? "passato"
              : "partito"
          } disponibile</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tournaments
      .map((tournament) => {
        // Determine if tournament is full
        const isFull =
          tournament.status === "registration" &&
          tournament.registrationsCount !== undefined &&
          tournament.maxPlayers !== undefined &&
          tournament.registrationsCount >= tournament.maxPlayers;

        console.log("tournamentensommamammamamammama", tournament);

        return `
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
              Partecipanti: ${
                tournament.registrationsCount ||
                tournament.currentParticipants ||
                0
              }/${tournament.maxPlayers || tournament.maxParticipants} |
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
              tournament.status === "registration" && !isFull
                ? tournament.isUserRegistered
                  ? `<button class="cyber-button-sm bg-cyber-green/20 text-cyber-green cursor-not-allowed" disabled>Iscritto</button>`
                  : `<button class="cyber-button-sm" onclick="app.showTournamentRegistrationDialog('${tournament.id}')">Iscriviti</button>`
                : tournament.status === "registration" && isFull
                ? `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Visualizza</button>`
                : tournament.status === "in_progress"
                ? `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Visualizza</button>`
                : `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Risultati</button>`
            }
            <button class="cyber-button-sm" onclick="app.viewTournamentRegistrations('${
              tournament.id
            }')">Giocatori</button>
          </div>
        </div>
        <div id="tournament-registrations-${
          tournament.id
        }" class="hidden mt-4 p-3 border border-cyber-green/30 rounded">
          <div class="text-center text-cyber-green py-2">
            <i class="fas fa-spinner fa-spin"></i>
            <p class="mt-1">Caricamento giocatori...</p>
          </div>
        </div>
      </div>
    `;
      })
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
      // Get current user from auth state
      const authState = authService.getState();

      // Ask user for alias
      const alias = prompt(
        "Inserisci l'alias con cui vuoi partecipare al torneo:",
        authState.user?.username || ""
      );

      // Check if user provided an alias
      if (!alias || alias.trim() === "") {
        this.showNotification(
          "Devi inserire un alias per iscriverti al torneo",
          "error"
        );
        return;
      }

      // Check if alias is already in use for this tournament
      try {
        const registrations = await this.apiService.getTournamentRegistrations(
          tournamentId
        );
        if (registrations && Array.isArray(registrations)) {
          const aliasExists = registrations.some(
            (reg: any) =>
              reg.alias &&
              reg.alias.toLowerCase() === alias.trim().toLowerCase()
          );

          if (aliasExists) {
            this.showNotification("Alias già in uso per questo torneo", "info");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking alias availability:", error);
        // Continue with registration attempt if we can't check aliases
      }

      const response = await this.apiService.registerForTournament(
        tournamentId,
        JSON.stringify({ alias: alias.trim(), user_id: authState.user?.id })
      );

      if (response) {
        this.showNotification(
          "Iscrizione al torneo effettuata con successo!",
          "success"
        );
        this.loadTournaments(); // Reload tournaments list
      } else {
        this.showNotification(
          (response as any).message || "Errore nell'iscrizione al torneo",
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

  async viewTournamentRegistrations(tournamentId: string) {
    const container = document.getElementById(
      `tournament-registrations-${tournamentId}`
    );
    if (!container) return;

    // Toggle visibility
    if (container.classList.contains("hidden")) {
      container.classList.remove("hidden");

      try {
        const response = await this.apiService.getTournamentRegistrations(
          tournamentId
        );

        if (response) {
          const registrations = response as any;

          if (registrations.length === 0) {
            container.innerHTML = `
              <div class="text-center text-gray-400 py-2">
                <p>Nessun giocatore registrato per questo torneo</p>
              </div>
            `;
          } else {
            container.innerHTML = `
              <h4 class="text-md font-bold text-cyber-green mb-2">Giocatori Registrati (${
                registrations.length
              })</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${registrations
                  .map(
                    (player: any) => `
                  <div class="flex items-center space-x-2 p-2 border border-cyber-green/20 rounded">
                    <div class="w-8 h-8 bg-cyber-green/20 rounded-full flex items-center justify-center">
                      <i class="fas fa-user text-cyber-green text-xs"></i>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-cyber-green">${
                        player.alias
                      }</p>
                      <p class="text-xs text-gray-400">Seed: ${player.seed}</p>
                    </div>
                    ${
                      player.eliminated
                        ? '<span class="text-xs text-cyber-magenta">Eliminato</span>'
                        : ""
                    }
                  </div>
                `
                  )
                  .join("")}
              </div>
            `;
          }
        } else {
          container.innerHTML = `
            <div class="text-center text-cyber-magenta py-2">
              <p>Errore nel caricamento dei giocatori registrati</p>
            </div>
          `;
        }
      } catch (error) {
        console.error("Load tournament registrations error:", error);
        container.innerHTML = `
          <div class="text-center text-cyber-magenta py-2">
            <p>Errore nel caricamento dei giocatori registrati</p>
          </div>
        `;
      }
    } else {
      container.classList.add("hidden");
    }
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

  private updateWaitingForOpponentUI() {
    const contentElement = document.getElementById("matchmaking-content");
    if (!contentElement) return;

    const authState = authService.getState();
    const meName = authState.user?.username || "PLAYER 1";
    const oppName = this.currentOpponentUsername || "Avversario";

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-clock text-4xl text-cyber-yellow mb-4 animate-pulse"></i>
        <p class="text-xl text-cyber-green mb-2">In attesa dell'avversario</p>
        <p class="text-lg mb-4">${meName} <span class="text-cyber-cyan">VS</span> ${oppName}</p>
        <div class="space-y-2">
          <p class="text-sm text-cyber-yellow">Sei pronto! In attesa che l'avversario si segni come pronto...</p>
        </div>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="abandon-match" class="cyber-button-secondary">Abbandona</button>
      </div>
    `;

    // Add event listener for abandon button
    document
      .getElementById("abandon-match")
      ?.addEventListener("click", () => this.abandonMatch());
  }

  async viewMatchDetails(matchId: string | number) {
    try {
      const response = await this.apiService.getMatch(matchId.toString());

      if (response && response.success && response.data) {
        const match = response.data;

        // Create modal to show match details
        const modal = document.createElement("div");
        modal.className =
          "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50";
        modal.innerHTML = `
          <div class="cyber-card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-cyber-green">Dettagli Partita</h2>
              <button id="close-modal" class="text-cyber-magenta hover:text-cyber-green">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-400">ID Partita</p>
                  <p class="text-cyber-green">${match.id}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-400">Stato</p>
                  <p class="text-cyber-green">${match.status}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-400">Gioco</p>
                  <p class="text-cyber-green">${
                    match.game_id === 1 ? "Pong 3D" : "Breakout Cyber"
                  }</p>
                </div>
                <div>
                  <p class="text-sm text-gray-400">Vincitore</p>
                  <p class="text-cyber-green">${
                    match.winner_id
                      ? `Giocatore ${match.winner_id}`
                      : "Non determinato"
                  }</p>
                </div>
              </div>
              
              ${
                match.started_at
                  ? `
                <div>
                  <p class="text-sm text-gray-400">Iniziata il</p>
                  <p class="text-cyber-green">${new Date(
                    match.started_at
                  ).toLocaleString()}</p>
                </div>
              `
                  : ""
              }
              
              ${
                match.players && match.players.length > 0
                  ? `
                <div>
                  <p class="text-sm text-gray-400 mb-2">Giocatori</p>
                  <div class="space-y-2">
                    ${match.players
                      .map(
                        (player: any) => `
                      <div class="flex justify-between items-center p-2 border border-cyber-green/20 rounded">
                        <span class="text-cyber-green">Giocatore ${
                          player.user_id
                        }</span>
                        <div class="flex items-center space-x-2">
                          <span class="text-sm text-gray-400">Punteggio: ${
                            player.score || 0
                          }</span>
                          ${
                            player.is_ready
                              ? '<span class="text-xs bg-cyber-green/20 text-cyber-green px-2 py-1 rounded">Pronto</span>'
                              : '<span class="text-xs bg-cyber-yellow/20 text-cyber-yellow px-2 py-1 rounded">Non pronto</span>'
                          }
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              
              <div class="flex justify-end space-x-2 pt-4">
                ${
                  match.status === "pending"
                    ? `
                  <button id="join-match" class="cyber-button">Partecipa</button>
                `
                    : ""
                }
                <button id="close-modal-btn" class="cyber-button-secondary">Chiudi</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const closeModal = () => {
          document.body.removeChild(modal);
        };

        document
          .getElementById("close-modal")
          ?.addEventListener("click", closeModal);
        document
          .getElementById("close-modal-btn")
          ?.addEventListener("click", closeModal);

        // Join match functionality
        const joinButton = document.getElementById("join-match");
        if (joinButton) {
          joinButton.addEventListener("click", () => {
            closeModal();
            // Navigate to game page with match ID
            this.router.navigate(`/pong?matchId=${match.id}`);
          });
        }

        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });
      } else {
        this.showNotification(
          "Impossibile caricare i dettagli della partita",
          "error"
        );
      }
    } catch (error) {
      console.error("Error viewing match details:", error);
      this.showNotification(
        "Errore durante il caricamento dei dettagli della partita",
        "error"
      );
    }
  }

  async playMatch(matchId: string | number) {
    try {
      // Navigate to pong page with match ID
      this.router.navigate(`/pong?matchId=${matchId}`);
    } catch (error) {
      console.error("Error navigating to match:", error);
      this.showNotification("Errore durante l'avvio della partita", "error");
    }
  }

  private renderBreakoutMatchmakingState(container: HTMLElement) {
    // Imposta l'HTML iniziale per il matchmaking
    container.innerHTML = `
      <div class="w-full flex flex-col items-center justify-center py-8">
        <div class="cyber-card w-full max-w-2xl">
          <h2 class="text-2xl font-bold text-cyber-green mb-6 text-center">RICERCA AVVERSARIO - BREAKOUT</h2>
          
          <div id="breakout-matchmaking-content" class="text-center">
            <!-- Initial state: Checking for existing matches -->
            <div class="mb-8">
              <i class="fas fa-search text-4xl text-cyber-green mb-4 animate-pulse"></i>
              <p class="text-lg text-cyber-green mb-2">Controllo partite in corso...</p>
              <p class="text-sm text-gray-400">Verifica se ci sono partite pending</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    const cancelButton = document.getElementById("cancel-breakout-matchmaking");
    const backButton = document.getElementById("back-to-breakout-modes");

    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        this.cancelBreakoutMatchmaking();
      });
    }

    if (backButton) {
      backButton.addEventListener("click", () => {
        this.cancelBreakoutMatchmaking();
        this.initializeBreakoutGameWithStates();
      });
    }

    // Start the new matchmaking process
    this.startNewBreakoutMatchmakingProcess();
  }

  private async startNewBreakoutMatchmakingProcess() {
    const contentElement = document.getElementById(
      "breakout-matchmaking-content"
    );
    if (!contentElement) return;

    try {
      // Reset flags
      this.breakoutMatchmakingCancelled = false;

      // Step 1: Check for existing pending matches
      const pendingMatch = await this.checkForPendingBreakoutMatches();

      if (pendingMatch) {
        // Found a pending match, get its details
        console.log("Found pending Breakout match:", pendingMatch);
        await this.handlePendingBreakoutMatch(pendingMatch);
        return;
      }

      // Step 2: No pending matches found, join matchmaking queue
      this.updateBreakoutMatchmakingUI(contentElement, "joining");

      try {
        const joinResponse = await this.apiService.joinMatchmaking("2"); // game_id 2 for Breakout
        console.log("Join Breakout matchmaking response:", joinResponse);

        // Check if we're already in queue (this is not an error)
        if (
          joinResponse ||
          joinResponse.message === "Joined matchmaking queue" ||
          joinResponse.error === "Already in queue"
        ) {
          // Successfully joined queue or already in queue, now try to find a match
          this.updateBreakoutMatchmakingUI(contentElement, "searching");

          try {
            console.log("Trying to find a Breakout match...");
            const findResponse = await this.apiService.findMatch("2", 1000); // game_id 2, elo_range 1000
            console.log("Find Breakout match response:", findResponse);

            if (findResponse.success && findResponse.data) {
              // Found a match through findMatch
              console.log(
                "Found Breakout match through findMatch:",
                findResponse.data
              );
              await this.handlePendingBreakoutMatch(findResponse.data);
            } else {
              // No match found yet, start polling
              console.log(
                "No Breakout match found through findMatch, starting polling..."
              );
              await this.pollForBreakoutMatches(contentElement);
            }
          } catch (error) {
            console.error("Error finding Breakout match:", error);
            // Even if findMatch fails, start polling as fallback
            await this.pollForBreakoutMatches(contentElement);
          }
        } else {
          throw new Error(
            joinResponse.message || "Failed to join Breakout matchmaking"
          );
        }
      } catch (error) {
        console.error("Error joining Breakout matchmaking:", error);
        this.showBreakoutMatchmakingError(
          contentElement,
          "Errore nell'unirsi alla coda di matchmaking"
        );
      }
    } catch (error) {
      console.error("Breakout matchmaking process error:", error);
      this.showBreakoutMatchmakingError(
        contentElement,
        "Errore durante il matchmaking"
      );
    }
  }

  private updateBreakoutMatchmakingUI(
    contentElement: HTMLElement,
    state: "joining" | "searching" | "found"
  ) {
    switch (state) {
      case "joining":
        contentElement.innerHTML = `
          <div class="mb-8">
            <i class="fas fa-sign-in-alt text-4xl text-cyber-green mb-4 animate-pulse"></i>
            <p class="text-lg text-cyber-green mb-2">Accesso alla coda...</p>
            <p class="text-sm text-gray-400">Sto entrando nella coda di matchmaking Breakout</p>
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

  private async pollForBreakoutMatches(contentElement: HTMLElement) {
    const pollInterval = 3000; // Poll every 3 seconds

    const poll = async () => {
      if (this.breakoutMatchmakingCancelled) return;

      try {
        // Check for pending matches
        const pendingMatch = await this.checkForPendingBreakoutMatches();

        if (pendingMatch) {
          // Found a pending match
          this.updateBreakoutMatchmakingUI(contentElement, "found");
          await this.handlePendingBreakoutMatch(pendingMatch);
          return;
        }

        // No match found yet, continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error("Error polling for Breakout matches:", error);
        // Continue polling even on error
        setTimeout(poll, pollInterval);
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  private async checkForPendingBreakoutMatches(): Promise<any> {
    try {
      const authState = authService.getState();
      const userId = authState.user?.id?.toString();
      if (!userId) return null;

      console.log("Checking for pending Breakout matches for user:", userId);
      const myMatches = await this.apiService.getUserMatchHistory(userId);
      console.log("Breakout match history response:", myMatches);

      // L'API restituisce direttamente un array di match, non un oggetto con proprietà .data.matches
      const matchesArray = Array.isArray(myMatches.data)
        ? myMatches.data
        : myMatches;

      // Filtra solo le partite pending per il gioco Breakout (game_id = 2)
      const pendingMatches = (matchesArray as any).filter(
        (m: any) => m.status === "pending" && Number(m.game_id) === 2
      );

      console.log("Pending Breakout matches found:", pendingMatches);

      if (pendingMatches.length === 0) {
        return null;
      }

      // Se ci sono più partite pending, prendi la più recente (con l'ID più grande)
      const recentPending = pendingMatches.reduce((prev: any, current: any) =>
        prev.id > current.id ? prev : current
      );

      console.log("Most recent pending Breakout match:", recentPending);
      return recentPending;
    } catch (err) {
      console.error("Error checking for pending Breakout match:", err);
      return null;
    }
  }

  private async handlePendingBreakoutMatch(pendingMatch: any) {
    try {
      console.log("Handling pending Breakout match:", pendingMatch);

      // Get detailed match information
      const matchDetails = await this.apiService.getMatch(
        pendingMatch.id.toString()
      );
      console.log("Breakout match details:", matchDetails);

      if (matchDetails.success && matchDetails.data) {
        const matchData = matchDetails.data;
        console.log("Breakout match data retrieved:", matchData);

        // Find opponent information
        const authState = authService.getState();
        const myId = authState.user?.id;
        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        let opponentUsername = "PLAYER 2";
        if (opponentPlayer) {
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found Breakout opponent player with ID:", opponentId);

          try {
            console.log(
              "Calling getUserById with Breakout opponent ID:",
              opponentId
            );
            const opp = await this.apiService.getUserById(opponentId);
            console.log("User API response for Breakout:", opp);

            if (opp.success && opp.data) {
              opponentUsername = opp.data.username || "PLAYER 2";
              console.log(
                "Breakout opponent username retrieved:",
                opponentUsername
              );
            } else {
              console.error(
                "API response for Breakout user was not successful:",
                opp
              );
            }
          } catch (error) {
            console.error("Error getting Breakout opponent info:", error);
          }
        } else {
          console.warn("No Breakout opponent player found in match data");
        }

        // Set match data
        this.currentBreakoutMatchId = matchData.id.toString();
        this.currentBreakoutOpponentId = opponentPlayer
          ? String(opponentPlayer.user_id)
          : null;
        this.currentBreakoutOpponentUsername = opponentUsername;

        // Show pending match UI
        this.showPendingBreakoutMatchUI({
          match: matchData,
          opponentId: this.currentBreakoutOpponentId,
          opponentUsername: this.currentBreakoutOpponentUsername,
          myId: myId,
        });
      } else {
        // If we can't get match details, try to continue with basic match info
        console.warn(
          "Could not get detailed Breakout match info, using basic match data"
        );
        this.handlePendingBreakoutMatchWithBasicInfo(pendingMatch);
      }
    } catch (error) {
      console.error("Error handling pending Breakout match:", error);

      // Try to continue with basic match info
      try {
        console.warn("Attempting to continue with basic Breakout match data");
        this.handlePendingBreakoutMatchWithBasicInfo(pendingMatch);
      } catch (fallbackError) {
        console.error("Breakout fallback also failed:", fallbackError);
        const contentElement = document.getElementById(
          "breakout-matchmaking-content"
        );
        if (contentElement) {
          this.showBreakoutMatchmakingError(
            contentElement,
            "Errore nel caricamento della partita. Riprova più tardi."
          );
        }
      }
    }
  }

  private async handlePendingBreakoutMatchWithBasicInfo(pendingMatch: any) {
    console.log(
      "Using basic match info for pending Breakout match:",
      pendingMatch
    );

    // Set basic match data
    this.currentBreakoutMatchId = pendingMatch.id.toString();
    this.currentBreakoutOpponentId = null; // We don't know the opponent yet
    this.currentBreakoutOpponentUsername = "Avversario";

    // Try to get match details to find opponent info
    try {
      const matchDetails = await this.apiService.getMatch(
        pendingMatch.id.toString()
      );
      console.log("Breakout match details for basic info:", matchDetails);

      if (matchDetails) {
        const authState = authService.getState();
        const myId = authState.user?.id;

        // Find opponent in the match data
        const matchData = matchDetails.data || matchDetails; // Handle both response formats
        console.log("Breakout match data:", matchData);

        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        console.log("Breakout opponent player:", opponentPlayer);

        if (opponentPlayer) {
          // We found the opponent, now get their user info
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found Breakout opponent with ID:", opponentId);

          try {
            const opponentInfo = await this.apiService.getUserById(opponentId);
            console.log("Breakout opponent info:", opponentInfo);

            if (opponentInfo.success && opponentInfo.data) {
              // Update opponent info with real data
              this.currentBreakoutOpponentId = opponentId;
              this.currentBreakoutOpponentUsername =
                opponentInfo.data.username || "PLAYER 2";
              console.log(
                "Updated Breakout opponent username:",
                this.currentBreakoutOpponentUsername
              );
            }
          } catch (error) {
            console.error("Error getting Breakout opponent info:", error);
          }
        }
      }
    } catch (error) {
      console.error(
        "Error getting Breakout match details for basic info:",
        error
      );
    }

    // Create a minimal match object for UI
    const minimalMatchData = {
      id: pendingMatch.id,
      game_id: pendingMatch.game_id,
      status: pendingMatch.status,
      players: [], // We don't have player details yet
    };

    // Show pending match UI with basic info
    this.showPendingBreakoutMatchUI({
      match: minimalMatchData,
      opponentId: this.currentBreakoutOpponentId,
      opponentUsername: this.currentBreakoutOpponentUsername,
      myId: authService.getState().user?.id,
    });
  }

  private showPendingBreakoutMatchUI(matchData: any) {
    const contentElement = document.getElementById(
      "breakout-matchmaking-content"
    );

    console.log("Breakout matchData", matchData);
    console.log("Breakout contentElement", contentElement);

    if (!contentElement) return;

    console.log("showPendingBreakoutMatchUI called with data:", matchData);

    // Imposta le variabili necessarie per il funzionamento dei pulsanti
    this.currentBreakoutMatchId = matchData.match.id.toString();
    this.currentBreakoutOpponentId = matchData.opponentId;
    this.currentBreakoutOpponentUsername = matchData.opponentUsername;

    console.log("Set Breakout opponent data:", {
      id: this.currentBreakoutOpponentId,
      username: this.currentBreakoutOpponentUsername,
    });

    // Mostra l'interfaccia del match trovato
    const authState = authService.getState();
    const meName = authState.user?.username || "PLAYER 1";
    const oppName = matchData.opponentUsername || "Avversario";

    console.log("Breakout display names:", { meName, oppName });

    // Check if we have complete opponent info
    const hasCompleteInfo =
      matchData.opponentId && matchData.opponentUsername !== "Avversario";
    const statusText = hasCompleteInfo
      ? "In attesa che entrambi i giocatori siano pronti..."
      : "Caricamento informazioni avversario...";

    console.log("Breakout UI state:", { hasCompleteInfo, statusText });

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-check-circle text-4xl text-cyber-green mb-4"></i>
        <p class="text-xl text-cyber-green mb-2">Avversario trovato!</p>
        <p id="breakout-opponent-name" class="text-lg mb-4">${meName} <span class="text-cyber-cyan">VS</span> ${oppName}</p>
        <div id="breakout-ready-status" class="space-y-2">
          <p class="text-sm">${statusText}</p>
        </div>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="breakout-ready-button" class="cyber-button" ${
          !hasCompleteInfo ? "disabled" : ""
        }>Sono Pronto</button>
        <button id="breakout-abandon-match" class="cyber-button-secondary">Abbandona</button>
      </div>
    `;

    // Aggiungi gli event listener per i pulsanti
    document
      .getElementById("breakout-ready-button")
      ?.addEventListener("click", () => this.setBreakoutPlayerReady());
    document
      .getElementById("breakout-abandon-match")
      ?.addEventListener("click", () => this.abandonBreakoutMatch());

    // If we don't have complete info, try to get it
    if (!hasCompleteInfo) {
      this.tryToGetBreakoutOpponentInfo();
    }

    // Inizia il controllo dello stato di pronto
    this.checkBreakoutMatchReady();
  }

  private async tryToGetBreakoutOpponentInfo() {
    try {
      // Try to get detailed match info again
      const matchDetails = await this.apiService.getMatch(
        this.currentBreakoutMatchId!
      );
      console.log(
        "Getting Breakout match details for opponent info, match ID:",
        this.currentBreakoutMatchId
      );

      if (matchDetails.success && matchDetails.data) {
        const matchData = matchDetails.data;
        console.log("Breakout match data retrieved:", matchData);

        // Find opponent information
        const authState = authService.getState();
        const myId = authState.user?.id;
        const opponentPlayer = matchData.players?.find(
          (p: any) => String(p.user_id) !== String(myId)
        );

        if (opponentPlayer) {
          const opponentId = String(opponentPlayer.user_id);
          console.log("Found Breakout opponent player with ID:", opponentId);

          try {
            console.log(
              "Calling getUserById with Breakout opponent ID:",
              opponentId
            );
            const opp = await this.apiService.getUserById(opponentId);
            console.log("User API response for Breakout:", opp);

            if (opp.success && opp.data) {
              // Update opponent info
              this.currentBreakoutOpponentId = opponentId;
              this.currentBreakoutOpponentUsername =
                opp.data.username || "PLAYER 2";
              console.log(
                "Breakout opponent username retrieved:",
                this.currentBreakoutOpponentUsername
              );

              // Update UI with new opponent info
              const contentElement = document.getElementById(
                "breakout-matchmaking-content"
              );
              if (contentElement) {
                const meName = authState.user?.username || "PLAYER 1";
                const oppName = this.currentBreakoutOpponentUsername;

                // Update the opponent name in the UI
                const opponentNameElement = document.getElementById(
                  "breakout-opponent-name"
                );
                if (opponentNameElement) {
                  opponentNameElement.innerHTML = `${meName} <span class="text-cyber-cyan">VS</span> ${oppName}`;
                  console.log(
                    "Updated Breakout opponent name in UI to:",
                    oppName
                  );
                }

                // Update status text
                const statusElement = contentElement.querySelector(
                  "#breakout-ready-status p"
                );
                if (statusElement) {
                  statusElement.textContent =
                    "In attesa che entrambi i giocatori siano pronti...";
                }

                // Enable the ready button
                const readyButton = document.getElementById(
                  "breakout-ready-button"
                ) as HTMLButtonElement;
                if (readyButton) {
                  readyButton.disabled = false;
                  console.log("Enabled Breakout ready button");
                }
              }
            } else {
              console.error(
                "API response for Breakout user was not successful:",
                opp
              );
            }
          } catch (error) {
            console.error("Error getting Breakout opponent info:", error);
          }
        } else {
          console.warn("No Breakout opponent player found in match data");
        }
      } else {
        console.error(
          "Could not retrieve Breakout match details:",
          matchDetails
        );
      }
    } catch (error) {
      console.error("Error getting Breakout match details:", error);
    }
  }

  private async setBreakoutPlayerReady() {
    if (!this.currentBreakoutMatchId) return;

    try {
      const authState = authService.getState();
      if (!authState.user?.id) return;

      const response = await this.apiService.readyMatch(
        this.currentBreakoutMatchId.toString(),
        Number(authState.user.id),
        true
      );

      console.log("Breakout ready match response:", response);

      if (response) {
        // Update UI to show player is ready
        const readyButton = document.getElementById("breakout-ready-button");
        if (readyButton) {
          readyButton.textContent = "Pronto! ✓";
          readyButton.setAttribute("disabled", "true");
          readyButton.classList.add("opacity-50");
        }

        // Check if both players are ready
        this.checkBreakoutMatchReady();
      } else {
        this.showNotification("Errore nel segnarsi pronto", "error");
      }
    } catch (error) {
      console.error("Error setting Breakout ready:", error);
      this.showNotification("Errore nel segnarsi pronto", "error");
    }
  }

  private async checkBreakoutMatchReady() {
    if (!this.currentBreakoutMatchId) return;

    try {
      const response = await this.apiService.getMatch(
        this.currentBreakoutMatchId.toString()
      );

      if (response) {
        const match = response;
        const authState = authService.getState();
        const myIdNum: number | null = authState.user?.id
          ? Number(authState.user.id)
          : null;
        const oppIdNum: number | null = this.currentBreakoutOpponentId
          ? Number(this.currentBreakoutOpponentId)
          : null;
        const meName = authState.user?.username || "PLAYER 1";
        const oppName = this.currentBreakoutOpponentUsername || "PLAYER 2";

        // Find current player in the match
        const currentPlayer = match.players?.find(
          (p: any) => String(p.user_id) === String(myIdNum)
        );

        const allPlayersReady = match.players?.every((p: any) => p.is_ready);

        console.log("Checking Breakout match ready status:", {
          matchId: this.currentBreakoutMatchId,
          matchStatus: match.status,
          allPlayersReady,
          currentPlayer,
          players: match.players,
        });

        if (match.status === "cancelled") {
          this.showNotification("Partita Breakout annullata", "error");
          this.currentBreakoutMatchId = null;
          this.currentBreakoutOpponentId = null;
          this.currentBreakoutOpponentUsername = null;
          this.initializeBreakoutGameWithStates();
          return;
        }

        if (match.status === "pending" && allPlayersReady) {
          // All players are ready but match is still pending, update status to in_progress
          console.log(
            "All Breakout players ready, updating match status to in_progress"
          );

          try {
            const updateResponse = await this.apiService.updateMatchStatus(
              this.currentBreakoutMatchId.toString(),
              "in_progress"
            );

            console.log(
              "Update Breakout match status response:",
              updateResponse
            );

            if (updateResponse.success) {
              // Status updated successfully, now check again
              setTimeout(() => this.checkBreakoutMatchReady(), 2000);
            } else {
              console.error(
                "Failed to update Breakout match status:",
                updateResponse.message
              );
            }
          } catch (error) {
            console.error("Error updating Breakout match status:", error);
          }
        } else if (match.status === "pending" && !allPlayersReady) {
          // Not all players are ready yet
          if (currentPlayer && currentPlayer.is_ready) {
            this.updateWaitingForBreakoutOpponentUI();
          }
          setTimeout(() => this.checkBreakoutMatchReady(), 2000);
        } else if (match.status === "in_progress") {
          // Match is in progress, determine who should start the game
          if (allPlayersReady) {
            // All players are ready and match is in progress
            const hostId = Math.min(myIdNum!, oppIdNum!);
            const amIHost = myIdNum === hostId;

            console.log("Breakout match in progress, host determination:", {
              myIdNum,
              oppIdNum,
              hostId,
              amIHost,
            });

            // I'm the host, start the game on my machine
            const gameContainer = document.getElementById(
              "breakout-game-container"
            );
            if (gameContainer) {
              this.currentBreakoutMatchHost = String(hostId);
              this.renderBreakoutGameState(gameContainer, "pvp");
              this.showNotification(
                "Entrambi pronti. Puoi iniziare la partita Breakout.",
                "success"
              );
            }
          } else {
            // Match is in progress but not all players are ready yet
            setTimeout(() => this.checkBreakoutMatchReady(), 2000);
          }
        } else {
          // Other status, poll again after a delay
          setTimeout(() => this.checkBreakoutMatchReady(), 2000);
        }
      }
    } catch (error) {
      console.error("Error checking Breakout match ready:", error);
    }
  }

  private showBreakoutMatchHostedByOther(hostUsername: string) {
    const contentElement = document.getElementById(
      "breakout-matchmaking-content"
    );
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-gamepad text-4xl text-cyber-yellow mb-4"></i>
        <p class="text-xl text-cyber-green mb-2">Partita in corso</p>
        <p class="text-lg mb-4">La partita Breakout è in corso da <span class="text-cyber-cyan">${hostUsername}</span></p>
        <p class="text-sm text-gray-400">Gioca sul PC di ${hostUsername} per partecipare alla partita</p>
      </div>
      <div class="flex justify-center">
        <button id="back-to-breakout-menu" class="cyber-button">Torna al Menu</button>
      </div>
    `;

    const backButton = document.getElementById("back-to-breakout-menu");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.currentBreakoutMatchId = null;
        this.currentBreakoutOpponentId = null;
        this.initializeBreakoutGameWithStates();
      });
    }
  }

  private async abandonBreakoutMatch() {
    if (!this.currentBreakoutMatchId) return;

    try {
      // Cancel the match using the new cancel API
      const response = await this.apiService.cancelMatch(
        this.currentBreakoutMatchId.toString()
      );
      console.log("Cancel Breakout match response:", response);

      if (response.success) {
        this.showNotification(
          "Partita Breakout abbandonata con successo",
          "info"
        );
      } else {
        this.showNotification(
          response.message || "Errore nell'abbandonare la partita Breakout",
          "error"
        );
      }

      // Reset match data
      this.currentBreakoutMatchId = null;
      this.currentBreakoutOpponentId = null;
      this.currentBreakoutOpponentUsername = null;

      // Go back to game selection
      this.initializeBreakoutGameWithStates();
    } catch (error) {
      console.error("Error abandoning Breakout match:", error);
      this.showNotification(
        "Errore nell'abbandonare la partita Breakout",
        "error"
      );
    }
  }

  private updateWaitingForBreakoutOpponentUI() {
    const contentElement = document.getElementById(
      "breakout-matchmaking-content"
    );
    if (!contentElement) return;

    const authState = authService.getState();
    const meName = authState.user?.username || "PLAYER 1";
    const oppName = this.currentBreakoutOpponentUsername || "Avversario";

    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-clock text-4xl text-cyber-yellow mb-4 animate-pulse"></i>
        <p class="text-xl text-cyber-green mb-2">In attesa dell'avversario</p>
        <p class="text-lg mb-4">${meName} <span class="text-cyber-cyan">VS</span> ${oppName}</p>
        <div class="space-y-2">
          <p class="text-sm text-cyber-yellow">Sei pronto! In attesa che l'avversario si segni come pronto...</p>
        </div>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="breakout-abandon-match" class="cyber-button-secondary">Abbandona</button>
      </div>
    `;

    // Add event listener for abandon button
    document
      .getElementById("breakout-abandon-match")
      ?.addEventListener("click", () => this.abandonBreakoutMatch());
  }

  private showBreakoutMatchmakingError(
    contentElement: HTMLElement,
    message: string
  ) {
    contentElement.innerHTML = `
      <div class="mb-8">
        <i class="fas fa-times-circle text-4xl text-cyber-magenta mb-4"></i>
        <p class="text-lg text-cyber-magenta mb-2">Errore</p>
        <p class="text-sm text-gray-400">${message}</p>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="back-to-breakout-modes" class="cyber-button">Torna alle Modalità</button>
      </div>
    `;

    // Add event listener for back button
    const backButton = document.getElementById("back-to-breakout-modes");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.initializeBreakoutGameWithStates();
      });
    }
  }

  private async cancelBreakoutMatchmaking() {
    try {
      this.breakoutMatchmakingCancelled = true;
      // Leave matchmaking queue
      await this.apiService.leaveMatchmaking();
      this.showNotification("Matchmaking Breakout annullato", "info");
    } catch (error) {
      console.error("Error leaving Breakout matchmaking:", error);
    }
  }

  private updateMatchHistoryDisplay(matches: any[]) {
    const matchHistoryElement = document.getElementById("match-history");
    if (!matchHistoryElement) return;

    // Sort matches by creation date (newest first)
    const sortedMatches = matches.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Limit to 10 most recent matches
    const recentMatches = sortedMatches;

    let matchHistoryHTML = '<div class="space-y-2">';

    if (recentMatches.length === 0) {
      matchHistoryHTML += '<p class="text-gray-400">Nessun match giocato</p>';
    } else {
      recentMatches.forEach((match) => {
        const gameName = match.game_id === 1 ? "Pong" : "Breakout";
        const statusClass = this.getStatusClass(match.status);
        const statusText = this.getStatusText(match.status);
        const createdAt = new Date(match.created_at).toLocaleString("it-IT");

        matchHistoryHTML += `
          <div class="cyber-card p-3 cursor-pointer hover:bg-cyber-dark/50 transition-colors" onclick="app.showMatchDetails(${
            match.id
          })">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-bold">${gameName}</span>
                <span class="text-sm text-gray-400 ml-2">#${match.id}</span>
              </div>
              <div class="text-right">
                <span class="${statusClass}">${statusText}</span>
                <div class="text-xs text-gray-400 mt-1">${createdAt}</div>
              </div>
            </div>
            ${
              match.winner_id
                ? `<div class="text-sm mt-2">Vincitore: ID ${match.winner_id}</div>`
                : ""
            }
          </div>
        `;
      });
    }

    matchHistoryHTML += "</div>";
    matchHistoryElement.innerHTML = matchHistoryHTML;
  }

  private getStatusClass(status: string): string {
    switch (status) {
      case "finished":
        return "text-green-400";
      case "in_progress":
        return "text-yellow-400";
      case "pending":
        return "text-blue-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case "finished":
        return "Completato";
      case "in_progress":
        return "In corso";
      case "pending":
        return "In attesa";
      case "cancelled":
        return "Annullato";
      default:
        return status;
    }
  }

  private showMatchDetails(matchId: number) {
    // Fetch match details
    this.apiService.getMatchDetails(matchId.toString()).then((response) => {
      if (response) {
        this.renderMatchDetailsModal(response);
      } else {
        this.showNotification(
          "Impossibile caricare i dettagli del match",
          "error"
        );
      }
    });
  }

  private async renderMatchDetailsModal(matchDetails: MatchDetails) {
    const gameName = matchDetails.game_id === 1 ? "Pong" : "Breakout";
    const statusClass = this.getStatusClass(matchDetails.status);
    const statusText = this.getStatusText(matchDetails.status);
    const createdAt = new Date(matchDetails.created_at).toLocaleString("it-IT");
    const startedAt = matchDetails.started_at
      ? new Date(matchDetails.started_at).toLocaleString("it-IT")
      : "Non iniziato";
    const finishedAt = matchDetails.finished_at
      ? new Date(matchDetails.finished_at).toLocaleString("it-IT")
      : "Non concluso";

    console.log("matchDetails", matchDetails);

    const vinnernameid =
      matchDetails.status === "finished"
        ? matchDetails.players[1].score > matchDetails.players[0].score
          ? matchDetails.players[1].user_id
          : matchDetails.players[0].user_id
        : "N/A";

    const vinnername = await this.apiService.getUserById(
      vinnernameid.toString()
    );

    console.log("vinnername", vinnername);

    // Create modal HTML
    const modalHTML = `
      <div id="match-details-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="cyber-panel max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="cyber-title text-2xl">Dettagli Match #${
              matchDetails.id
            }</h2>
            <button onclick="app.closeMatchDetailsModal()" class="cyber-button-sm">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="cyber-card">
              <h3 class="text-lg font-bold text-cyber-green mb-4">Informazioni Generali</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Gioco:</span>
                  <span>${gameName}</span>
                </div>
                <div class="flex justify-between">
                  <span>Stato:</span>
                  <span class="${statusClass}">${statusText}</span>
                </div>
                <div class="flex justify-between">
                  <span>ID Vincitore:</span>
                  <span>${vinnername.data?.username || "N/A"}</span>
                </div>
                <div class="flex justify-between">
                  <span>Creato il:</span>
                  <span>${createdAt}</span>
                </div>
                <div class="flex justify-between">
                  <span>Iniziato il:</span>
                  <span>${startedAt}</span>
                </div>
                <div class="flex justify-between">
                  <span>Concluso il:</span>
                  <span>${finishedAt}</span>
                </div>
              </div>
            </div>

            <div class="cyber-card">
              <h3 class="text-lg font-bold text-cyber-green mb-4">Giocatori</h3>
              <div class="space-y-2">
                ${matchDetails.players
                  .map(
                    (player) => `
                  <div class="flex justify-between items-center p-2 bg-cyber-dark/30 rounded">
                    <div>
                      <span class="font-bold">Giocatore ${
                        player.position
                      }</span>
                      <span class="text-sm text-gray-400 ml-2">(ID: ${
                        player.user_id
                      })</span>
                    </div>
                    <div class="text-right">
                      <span class="text-cyber-cyan">Punteggio: ${
                        player.score
                      }</span>
                      <div class="text-xs text-gray-400">
                        ${player.is_ready ? "Pronto" : "Non pronto"} • 
                        Entrato: ${new Date(player.joined_at).toLocaleString(
                          "it-IT"
                        )}
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button onclick="app.closeMatchDetailsModal()" class="cyber-button">
              Chiudi
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal to the page
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  private closeMatchDetailsModal() {
    const modal = document.getElementById("match-details-modal");
    if (modal) {
      modal.remove();
    }
  }

  private async loadOtherUserProfileData(userId: string) {
    try {
      // Get user data
      const userResponse = await this.apiService.getUserById(userId);

      if (userResponse && userResponse.success && userResponse.data) {
        const user = userResponse.data;

        // Update profile information
        const usernameElement = document.getElementById("profile-username");
        const emailElement = document.getElementById("profile-email");
        const displayNameElement = document.getElementById(
          "profile-display-name"
        );

        if (usernameElement) usernameElement.textContent = user.username || "-";
        if (emailElement) emailElement.textContent = user.email || "-";
        if (displayNameElement)
          displayNameElement.textContent =
            (user as any).display_name || user.username || "-";

        // Load user's match history
        this.loadUserMatchHistory(userId);

        // Show profile content
        const loadingElement = document.getElementById("profile-loading");
        const contentElement = document.getElementById("profile-content");

        if (loadingElement) loadingElement.classList.add("hidden");
        if (contentElement) contentElement.classList.remove("hidden");
      } else {
        this.showNotification(
          "Impossibile caricare il profilo dell'utente",
          "error"
        );
        this.router.navigate("/profile");
      }
    } catch (error) {
      console.error("Error loading other user profile:", error);
      this.showNotification("Errore nel caricamento del profilo", "error");
      this.router.navigate("/profile");
    }
  }

  private async loadUserMatchHistory(userId: string) {
    try {
      const matchesResponse = await this.apiService.getUserMatches(userId);

      if (matchesResponse && Array.isArray(matchesResponse)) {
        const matchHistoryElement = document.getElementById("match-history");

        if (matchHistoryElement) {
          if (matchesResponse.length === 0) {
            matchHistoryElement.innerHTML =
              '<p class="text-gray-400">Nessuna partita giocata</p>';
          } else {
            matchHistoryElement.innerHTML = matchesResponse
              .filter((match) => match.status !== "pending") // Exclude pending matches
              .slice(0, 10) // Show only last 10 matches
              .map(
                (match) => `
                <div class="flex justify-between items-center p-2 border-b border-cyber-green/20">
                  <div>
                    <div class="text-cyber-green">Partita #${match.id}</div>
                    <div class="text-cyber-green/50 text-xs">
                      ${new Date(match.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div class="text-cyber-cyan text-sm">
                    ${
                      match.status === "finished"
                        ? "Completata"
                        : match.status === "cancelled"
                        ? "Annullata"
                        : match.status
                    }
                  </div>
                </div>
              `
              )
              .join("");
          }
        }
      }
    } catch (error) {
      console.error("Error loading user match history:", error);
      const matchHistoryElement = document.getElementById("match-history");
      if (matchHistoryElement) {
        matchHistoryElement.innerHTML =
          '<p class="text-gray-400">Errore nel caricamento della cronologia</p>';
      }
    }
  }

  private setupProfileEditHandlers() {
    const editProfileBtn = document.getElementById("edit-profile-btn");
    const saveProfileBtn = document.getElementById("save-profile-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const profileInfo = document.getElementById("profile-info");
    const profileEditForm = document.getElementById("profile-edit-form");

    if (
      !editProfileBtn ||
      !saveProfileBtn ||
      !cancelEditBtn ||
      !profileInfo ||
      !profileEditForm
    ) {
      return;
    }

    // Show edit form when edit button is clicked
    editProfileBtn.addEventListener("click", () => {
      // Get current values
      const username =
        document.getElementById("profile-username")?.textContent || "";
      const email = document.getElementById("profile-email")?.textContent || "";
      const displayName =
        document.getElementById("profile-display-name")?.textContent || "";

      // Populate form with current values
      const editUsername = document.getElementById(
        "edit-username"
      ) as HTMLInputElement;
      const editEmail = document.getElementById(
        "edit-email"
      ) as HTMLInputElement;
      const editDisplayName = document.getElementById(
        "edit-display-name"
      ) as HTMLInputElement;

      if (editUsername) editUsername.value = username;
      if (editEmail) editEmail.value = email;
      if (editDisplayName) editDisplayName.value = displayName;

      // Toggle visibility
      profileInfo.classList.add("hidden");
      profileEditForm.classList.remove("hidden");
      editProfileBtn.classList.add("hidden");
    });

    // Save profile when save button is clicked
    saveProfileBtn.addEventListener("click", async () => {
      const editUsername = document.getElementById(
        "edit-username"
      ) as HTMLInputElement;
      const editEmail = document.getElementById(
        "edit-email"
      ) as HTMLInputElement;
      const editDisplayName = document.getElementById(
        "edit-display-name"
      ) as HTMLInputElement;

      if (!editUsername || !editEmail || !editDisplayName) {
        return;
      }

      // Get current user ID
      const authState = authService.getState();
      if (!authState.user || !authState.user.id) {
        console.error("User not authenticated");
        return;
      }

      const userId = authState.user.id.toString();

      try {
        // Show loading state
        saveProfileBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i>Salvataggio...';
        (saveProfileBtn as HTMLButtonElement).disabled = true;

        // Get avatar URL from localStorage
        const avatarUrl = this.apiService.getAvatarFromLocalStorage();

        // Call API to update profile
        const response = await this.apiService.updateProfile(
          userId,
          editUsername.value,
          editEmail.value,
          editDisplayName.value,
          avatarUrl || undefined
        );

        if (response.success) {
          // Update the displayed information
          document.getElementById("profile-username")!.textContent =
            editUsername.value;
          document.getElementById("profile-email")!.textContent =
            editEmail.value;
          document.getElementById("profile-display-name")!.textContent =
            editDisplayName.value;

          // Update user data in auth state
          if (authState.user) {
            authState.user.username = editUsername.value;
            authState.user.email = editEmail.value;
            // Note: display_name might not be in the User interface, but we'll update it if it exists
            if ("display_name" in authState.user) {
              (authState.user as any).display_name = editDisplayName.value;
            }
            localStorage.setItem("user", JSON.stringify(authState.user));
          }

          // Show success message
          this.showNotification("Profilo aggiornato con successo", "success");

          // Toggle visibility back to view mode
          profileInfo.classList.remove("hidden");
          profileEditForm.classList.add("hidden");
          editProfileBtn.classList.remove("hidden");
        } else {
          // Show error message
          this.showNotification(
            response.message || "Errore durante l'aggiornamento del profilo",
            "error"
          );
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        this.showNotification(
          "Errore durante l'aggiornamento del profilo",
          "error"
        );
      } finally {
        // Reset button state
        saveProfileBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salva';
        (saveProfileBtn as HTMLButtonElement).disabled = false;
      }
    });

    // Cancel edit when cancel button is clicked
    cancelEditBtn.addEventListener("click", () => {
      // Toggle visibility back to view mode
      profileInfo.classList.remove("hidden");
      profileEditForm.classList.add("hidden");
      editProfileBtn.classList.remove("hidden");
    });
  }

  private closeTournamentRegistrationModal() {
    const modal = document.getElementById("tournament-registration-modal");
    if (modal) {
      modal.remove();
    }
  }

  cancelTournamentRegistration() {
    this.closeTournamentRegistrationModal();
    this.showNotification("Registrazione annullata", "info");
  }

  async joinTournamentWithAlias(tournamentId: string, alias: string) {
    try {
      // Get current user from auth state
      const authState = authService.getState();

      // Check if alias is provided
      if (!alias || alias.trim() === "") {
        this.showNotification(
          "Devi inserire un alias per iscriverti al torneo",
          "error"
        );
        return;
      }

      // Check if alias is already in use for this tournament
      try {
        const registrations = await this.apiService.getTournamentRegistrations(
          tournamentId
        );
        if (registrations && Array.isArray(registrations)) {
          const aliasExists = registrations.some(
            (reg: any) =>
              reg.alias &&
              reg.alias.toLowerCase() === alias.trim().toLowerCase()
          );

          if (aliasExists) {
            this.showNotification("Alias già in uso per questo torneo", "info");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking alias availability:", error);
        // Continue with registration attempt if we can't check aliases
      }

      const response = await this.apiService.registerForTournament(
        tournamentId,
        JSON.stringify({ alias: alias.trim(), user_id: authState.user?.id })
      );

      if (response) {
        this.closeTournamentRegistrationModal();
        this.showNotification("Registrato con successo", "success");
        this.loadTournaments(); // Reload tournaments list
      } else {
        this.showNotification(
          (response as any).message || "Errore nell'iscrizione al torneo",
          "error"
        );
      }
    } catch (error) {
      console.error("Join tournament error:", error);

      // Check if the error is because user is already registered
      if (
        error instanceof Error &&
        error.message === "User already registered"
      ) {
        this.showNotification("Sei già registrato a questo torneo", "error");
      } else {
        this.showNotification("Errore durante l'iscrizione al torneo", "error");
      }
    }
  }

  showCreateTournamentDialog(maxParticipants: number) {
    // Create modal HTML
    const modalHTML = `
      <div id="create-tournament-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="cyber-panel max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="cyber-title text-2xl">Crea Torneo T${maxParticipants}</h2>
            <button onclick="app.closeCreateTournamentModal()" class="cyber-button-sm">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form id="create-tournament-form">
            <div class="mb-4">
              <label for="tournament-name" class="block text-cyber-green mb-2">Nome del torneo</label>
              <input type="text" id="tournament-name" name="name" class="cyber-input w-full" required maxlength="50" value="Torneo T${maxParticipants} - ${new Date().toLocaleDateString()}">
              <p class="text-xs text-gray-400 mt-1">Inserisci un nome per il torneo</p>
            </div>
            <div class="flex space-x-2">
              <button type="submit" class="cyber-button flex-1">Crea</button>
              <button type="button" onclick="app.cancelCreateTournament()" class="cyber-button bg-cyber-magenta flex-1">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add form submission handler
    const form = document.getElementById(
      "create-tournament-form"
    ) as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        this.createTournamentWithName(maxParticipants, name);
      });
    }
  }

  private closeCreateTournamentModal() {
    const modal = document.getElementById("create-tournament-modal");
    if (modal) {
      modal.remove();
    }
  }

  cancelCreateTournament() {
    this.closeCreateTournamentModal();
    this.showNotification("Creazione torneo annullata", "info");
  }

  private async createTournamentWithName(
    maxParticipants: number,
    name: string
  ) {
    try {
      // Check if name is provided
      if (!name || name.trim() === "") {
        this.showNotification("Devi inserire un nome per il torneo", "error");
        return;
      }

      const tournamentType = maxParticipants === 4 ? "T4" : "T8";
      const tournamentData = {
        name: name.trim(),
        gameType: "pong", // Default to pong, could be extended
        max_players: maxParticipants,
        min_players: maxParticipants - 1,
        game_id: 1,
        type: tournamentType.toLowerCase(),
      };

      const response = await this.apiService.createTournament(tournamentData);

      if (response) {
        this.closeCreateTournamentModal();
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

  private renderFriendsPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center text-4xl mb-8">AMICI</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Search Users -->
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Cerca Utenti</h2>
            <div class="space-y-4">
              <div class="flex space-x-2">
                <input type="text" id="user-search" placeholder="Cerca per username..." class="cyber-input flex-1">
                <button id="search-btn" class="cyber-button">Cerca</button>
              </div>
              <div id="search-results" class="space-y-2 max-h-60 overflow-y-auto">
                <!-- Search results will appear here -->
              </div>
            </div>
          </div>
          
          <!-- Friend Requests -->
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Richieste di Amicizia</h2>
            <div id="friend-requests" class="space-y-2 max-h-60 overflow-y-auto">
              <!-- Friend requests will appear here -->
            </div>
          </div>
          
          <!-- Friends List -->
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">I Tuoi Amici</h2>
            <div id="friends-list" class="space-y-2 max-h-60 overflow-y-auto">
              <!-- Friends list will appear here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupFriendsPageEventListeners();

    // Load initial data
    this.loadFriendsData();

    // Initialize WebSocket for presence updates
    this.initializeFriendsPresence();
  }

  showTournamentRegistrationDialog(tournamentId: string) {
    // Create modal HTML
    const modalHTML = `
      <div id="tournament-registration-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="cyber-panel max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="cyber-title text-2xl">Registrati al Torneo</h2>
            <button onclick="app.closeTournamentRegistrationModal()" class="cyber-button-sm">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form id="tournament-registration-form">
            <div class="mb-4">
              <label for="tournament-alias" class="block text-cyber-green mb-2">Alias</label>
              <input type="text" id="tournament-alias" name="alias" class="cyber-input w-full" required maxlength="50" placeholder="Inserisci un alias">
              <p class="text-xs text-gray-400 mt-1">Inserisci un alias unico per questo torneo</p>
            </div>
            <div class="flex space-x-2">
              <button type="submit" class="cyber-button flex-1">Registrati</button>
              <button type="button" onclick="app.cancelTournamentRegistration()" class="cyber-button bg-cyber-magenta flex-1">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add form submission handler
    const form = document.getElementById(
      "tournament-registration-form"
    ) as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const alias = formData.get("alias") as string;
        this.joinTournamentWithAlias(tournamentId, alias);
      });
    }
  }

  private async loadFriendsData() {
    await this.loadFriends();
    await this.loadPendingFriendRequests();
  }

  private setupFriendsPageEventListeners() {
    const searchBtn = document.getElementById("search-btn");
    const userSearch = document.getElementById(
      "user-search"
    ) as HTMLInputElement;

    if (searchBtn && userSearch) {
      searchBtn.addEventListener("click", () => {
        this.searchUsers(userSearch.value);
      });

      userSearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchUsers(userSearch.value);
        }
      });
    }
  }

  private initializeFriendsPresence() {
    // Import ChatWebSocketService dynamically to avoid circular dependencies
    import("./services/ChatWebSocketService")
      .then(({ chatWebSocketService }) => {
        // Subscribe to presence updates
        chatWebSocketService.onPresence((userId: number, status: string) => {
          this.updateFriendPresenceStatus(userId, status);
        });

        // Connect to WebSocket if not already connected
        if (!chatWebSocketService.isConnected()) {
          const authState = authService.getState();
          if (authState.isAuthenticated && authState.token) {
            chatWebSocketService.connect(authState.token);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load ChatWebSocketService:", error);
      });
  }

  private updateFriendPresenceStatus(userId: number, status: string) {
    // Find all friend elements with this user ID
    const friendElements = document.querySelectorAll(
      `[data-friend-id="${userId}"]`
    );

    friendElements.forEach((element) => {
      const statusElement = element.querySelector(".friend-status");
      if (statusElement) {
        // Remove existing status classes
        statusElement.classList.remove(
          "text-cyber-green",
          "text-cyber-gray",
          "text-cyber-yellow"
        );

        // Add appropriate status class and text
        switch (status) {
          case "online":
            statusElement.classList.add("text-cyber-green");
            statusElement.textContent = "Online";
            break;
          case "away":
            statusElement.classList.add("text-cyber-yellow");
            statusElement.textContent = "Away";
            break;
          case "offline":
          default:
            statusElement.classList.add("text-cyber-gray");
            statusElement.textContent = "Offline";
            break;
        }
      }
    });
  }

  private async loadFriends() {
    try {
      const response = await this.apiService.getFriends();
      const friendsListElement = document.getElementById("friends-list");

      if (!friendsListElement) return;

      if (
        response.success &&
        response.data &&
        Array.isArray(response.data.friends)
      ) {
        const friends = response.data.friends;

        if (friends.length === 0) {
          friendsListElement.innerHTML = `<p class="text-cyber-gray text-sm">Non hai ancora amici</p>`;
          return;
        }

        // Import ChatWebSocketService to get presence info
        const { chatWebSocketService } = await import(
          "./services/ChatWebSocketService"
        );

        friendsListElement.innerHTML = friends
          .map((friend: any) => {
            // Get presence status from WebSocket service
            const presenceStatus = this.getFriendPresenceStatus(
              friend.id,
              chatWebSocketService
            );

            return `
            <div class="flex items-center justify-between p-2 border border-cyber-green/30 rounded" data-friend-id="${
              friend.id
            }">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-cyber-green/20 flex items-center justify-center">
                  ${
                    friend.avatar_url
                      ? `<img src="${friend.avatar_url}" alt="${friend.display_name}" class="w-8 h-8 rounded-full">`
                      : `<span class="text-cyber-green text-xs">${friend.display_name
                          ?.charAt(0)
                          .toUpperCase()}</span>`
                  }
                </div>
                <div class="flex flex-col">
                  <span class="text-cyber-white">${
                    friend.display_name || friend.username
                  }</span>
                  <span class="friend-status text-xs ${presenceStatus.class}">${
              presenceStatus.text
            }</span>
                </div>
              </div>
              <button class="cyber-button-secondary text-xs" onclick="app.removeFriend(${
                friend.id
              })">
                Rimuovi
              </button>
            </div>
          `;
          })
          .join("");
      } else {
        friendsListElement.innerHTML = `<p class="text-cyber-red text-sm">Errore nel caricamento degli amici</p>`;
      }
    } catch (error) {
      console.error("Load friends error:", error);
      document.getElementById(
        "friends-list"
      )!.innerHTML = `<p class="text-cyber-red text-sm">Errore nel caricamento degli amici</p>`;
    }
  }

  private getFriendPresenceStatus(
    friendId: number,
    chatWebSocketService: any
  ): { class: string; text: string } {
    // This is a simplified approach - in a real implementation, you would
    // maintain a presence map in WebSocket service or query the API

    // For now, we'll use a default status and update it via WebSocket events
    return {
      class: "text-cyber-gray",
      text: "Offline",
    };
  }

  private async loadPendingFriendRequests() {
    try {
      const response = await this.apiService.getPendingFriendRequests();
      const friendRequestsElement = document.getElementById("friend-requests");

      if (!friendRequestsElement) return;

      console.log("ensommafra che dici pending friend requests", response);

      if (response.success && response.data && Array.isArray(response.data)) {
        const requests = response.data;

        if (requests.length === 0) {
          friendRequestsElement.innerHTML = `<p class="text-cyber-gray text-sm">Nessuna richiesta in sospeso</p>`;
          return;
        }

        friendRequestsElement.innerHTML = requests
          .map(
            (request) => `
          <div class="p-2 border border-cyber-green/30 rounded">
            <div class="flex items-center justify-between mb-2">
              <span class="text-cyber-white">${
                request.display_name || request.username
              }</span>
              <span class="text-cyber-gray text-xs">${new Date(
                request.created_at
              ).toLocaleDateString()}</span>
            </div>
            <div class="flex space-x-2">
              <button class="cyber-button text-xs" onclick="app.respondToFriendRequest(${
                request.id
              }, 'accept')">
                Accetta
              </button>
              <button class="cyber-button-secondary text-xs" onclick="app.respondToFriendRequest(${
                request.id
              }, 'reject')">
                Rifiuta
              </button>
            </div>
          </div>
        `
          )
          .join("");
      } else {
        friendRequestsElement.innerHTML = `<p class="text-cyber-red text-sm">Errore nel caricamento delle richieste</p>`;
      }
    } catch (error) {
      console.error("Load friend requests error:", error);
      document.getElementById(
        "friend-requests"
      )!.innerHTML = `<p class="text-cyber-red text-sm">Errore nel caricamento delle richieste</p>`;
    }
  }

  private async searchUsers(query: string) {
    if (!query.trim()) {
      document.getElementById(
        "search-results"
      )!.innerHTML = `<p class="text-cyber-gray text-sm">Inserisci un termine di ricerca</p>`;
      return;
    }

    try {
      const response = await this.apiService.searchUsers(query);
      const searchResultsElement = document.getElementById("search-results");

      console.log("ensommafra che dici", response);

      if (!searchResultsElement) return;

      if (response && response.success && response.data) {
        const users = response.data.users;

        console.log("ensommafra che dici", users);

        if (users.length === 0) {
          searchResultsElement.innerHTML = `<p class="text-cyber-gray text-sm">Nessun utente trovato</p>`;
          return;
        }

        searchResultsElement.innerHTML = users
          .map(
            (user: any) => `
            <div class="flex items-center justify-between p-2 border border-cyber-green/30 rounded">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-cyber-green/20 flex items-center justify-center">
                  ${
                    user.avatar_url
                      ? `<img src="${user.avatar_url}" alt="${user.display_name}" class="w-8 h-8 rounded-full">`
                      : `<span class="text-cyber-green text-xs">${user.display_name
                          ?.charAt(0)
                          .toUpperCase()}</span>`
                  }
                </div>
                <span class="text-cyber-white">${
                  user.display_name || user.username
                }</span>
              </div>
              <button class="cyber-button text-xs" onclick="app.sendFriendRequest(${
                user.id
              })">
                Aggiungi
              </button>
            </div>
          `
          )
          .join("");
      } else {
        searchResultsElement.innerHTML = `<p class="text-cyber-red text-sm">Errore nella ricerca</p>`;
      }
    } catch (error) {
      console.error("Search users error:", error);
      document.getElementById(
        "search-results"
      )!.innerHTML = `<p class="text-cyber-red text-sm">Errore nella ricerca</p>`;
    }
  }

  async sendFriendRequest(userId: number) {
    try {
      const response = await this.apiService.sendFriendRequest(userId);

      if (response.success) {
        this.showNotification(
          "Richiesta di amicizia inviata con successo",
          "success"
        );
        // Clear search results
        document.getElementById("search-results")!.innerHTML = "";
        (document.getElementById("user-search") as HTMLInputElement).value = "";
      } else {
        this.showNotification(
          response.message || "Errore nell'invio della richiesta",
          "error"
        );
      }
    } catch (error) {
      console.error("Send friend request error:", error);
      this.showNotification("Errore nell'invio della richiesta", "error");
    }
  }

  async respondToFriendRequest(requestId: number, action: "accept" | "reject") {
    try {
      const response = await this.apiService.respondToFriendRequest(
        requestId,
        action
      );

      if (response.success) {
        this.showNotification(
          `Richiesta di amicizia ${
            action === "accept" ? "accettata" : "rifiutata"
          } con successo`,
          "success"
        );
        // Reload friends and requests
        this.loadFriendsData();
      } else {
        this.showNotification(
          response.message || "Errore nella risposta",
          "error"
        );
      }
    } catch (error) {
      console.error("Respond to friend request error:", error);
      this.showNotification("Errore nella risposta", "error");
    }
  }

  async removeFriend(userId: number) {
    if (!confirm("Sei sicuro di voler rimuovere questo amico?")) return;

    try {
      const response = await this.apiService.removeFriend(userId.toString());

      if (response.success) {
        this.showNotification("Amico rimosso con successo", "success");
        // Reload friends list
        this.loadFriendsData();
      } else {
        this.showNotification(
          response.message || "Errore nella rimozione",
          "error"
        );
      }
    } catch (error) {
      console.error("Remove friend error:", error);
      this.showNotification("Errore nella rimozione", "error");
    }
  }
}
