import { Router } from './router/Router'
import { Navbar } from './components/Navbar'
import { ApiService } from './services/ApiService'
import { authService } from './services/AuthService'
import { createAuthGuard } from './components/AuthGuard'
import { PongCanvas } from './components/PongCanvas'
import { ChatBox } from './components/ChatBox'
import { BreakoutCanvas } from './components/BreakoutCanvas'
import { GameSettingsComponent } from './components/GameSettings'

// Declare global app instance for button onclick handlers
declare global {
  interface Window {
    app: App
    chatBox: ChatBox
  }
}

export class App {
  private router: Router
  private apiService: ApiService
  private chatBox: ChatBox | null = null
  private navbar: Navbar | null = null

  constructor() {
    this.router = new Router()
    this.apiService = new ApiService()
  }

  mount(selector: string) {
    const appElement = document.querySelector(selector)
    if (!appElement) {
      throw new Error(`Element with selector ${selector} not found`)
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
    `

    // Initialize components
    this.initializeComponents()
    
    // Setup routing
    this.setupRouting()
    
    // Make app instance globally available for button onclick handlers
    window.app = this
  }

  private initializeComponents() {
    // Initialize navbar
    const navbarElement = document.getElementById('navbar')
    if (navbarElement) {
      this.navbar = new Navbar()
      
      // Get current user data if authenticated
      const authState = authService.getState()
      const username = authState.user?.username || null
      
      // Render navbar with username if available
      this.navbar.render(navbarElement, username || undefined)
    }
    
    // Subscribe to auth state changes to update navbar when user logs in/out
    authService.subscribe((authState) => {
      if (this.navbar && authState.isAuthenticated && authState.user) {
        const username = authState.user.username || 'CyberPlayer'
        this.navbar.updateUsername(username)
      }
    })
  }

  private setupRouting() {
    // Initialize router with routes
    this.router.addRoute('/', () => this.renderHomePage())
    this.router.addRoute('/login', () => this.renderLoginPage())
    this.router.addRoute('/register', () => this.renderRegisterPage())
    this.router.addRoute('/games', () => this.renderGamesPage())
    this.router.addRoute('/pong', () => this.renderPongPage())
    this.router.addRoute('/breakout', () => this.renderBreakoutPage())
    this.router.addRoute('/tournaments', () => this.renderTournamentsPage())
    this.router.addRoute('/tournament/:id', (params: any) => this.renderTournamentDetailsPage(params.id))
    this.router.addRoute('/chat', () => this.renderChatPage())
    this.router.addRoute('/profile', () => this.renderProfilePage())
    this.router.addRoute('/settings', () => this.renderSettingsPage())
    
    // Handle 404
    this.router.setNotFoundCallback(() => this.renderNotFoundPage())
    
    // Start routing
    this.router.start()
  }

  private renderHomePage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
  }

  private renderLoginPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
    
    // Add form submission handler
    const loginForm = document.getElementById('login-form')
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this))
    }
  }

  private renderRegisterPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
    
    // Add form submission handler
    const registerForm = document.getElementById('register-form')
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this))
    }
  }

  private renderGamesPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
  }

  private renderPongPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">PONG 3D</h1>
        <div class="flex flex-col items-center">
          <div id="pong-canvas-container" class="w-full max-w-2xl h-96 bg-cyber-black border border-cyber-green mb-4">
            <!-- 3D Canvas will be rendered here -->
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">1 VS 1</h2>
              <p class="terminal-text text-sm mb-4 text-center">Sfida un altro giocatore sullo stesso dispositivo</p>
              <button id="start-pvp" class="cyber-button w-full">Inizia Partita</button>
            </div>
            
            <div class="cyber-card">
              <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">1 VS BOT</h2>
              <p class="terminal-text text-sm mb-4 text-center">Sfida l'IA con diversi livelli di difficoltà</p>
              <div class="space-y-2 mb-4">
                <button id="start-pve-easy" class="cyber-button-sm w-full">Facile</button>
                <button id="start-pve-medium" class="cyber-button-sm w-full">Medio</button>
                <button id="start-pve-hard" class="cyber-button-sm w-full">Difficile</button>
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <button id="game-settings" class="cyber-button">Impostazioni</button>
          </div>
        </div>
      </div>
    `
    
    // Initialize Pong game
    this.initializePongGame()
  }

  private renderBreakoutPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto">
        <h1 class="cyber-title text-center">BREAKOUT CYBER</h1>
        <div class="flex flex-col items-center">
          <div id="breakout-canvas-container" class="w-full max-w-2xl h-96 bg-cyber-black border border-cyber-green mb-4">
            <!-- 3D Canvas will be rendered here -->
          </div>
          
          <div class="cyber-card w-full max-w-2xl">
            <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">1 VS 1</h2>
            <p class="terminal-text text-sm mb-4 text-center">Sfida un altro giocatore sullo stesso dispositivo</p>
            <button id="start-breakout" class="cyber-button w-full">Inizia Partita</button>
          </div>
          
          <div class="mt-4">
            <button id="breakout-settings" class="cyber-button">Impostazioni</button>
          </div>
        </div>
      </div>
    `
    
    // Initialize Breakout game
    this.initializeBreakoutGame()
  }

  private renderTournamentsPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
    
    // Initialize tournaments page
    this.initializeTournamentsPage()
  }

  private async renderTournamentDetailsPage(tournamentId: string) {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

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
    `
    
    // Initialize tournament details page
    this.initializeTournamentDetailsPage(tournamentId)
  }

  private async initializeTournamentDetailsPage(tournamentId: string) {
    // Add event listener for back button
    const backButton = document.getElementById('back-to-tournaments')
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.router.navigate('/tournaments')
      })
    }
    
    // Load tournament details
    await this.loadTournamentDetails(tournamentId)
  }

  private async loadTournamentDetails(tournamentId: string) {
    try {
      const response = await this.apiService.getTournament(tournamentId)
      
      if (response.success && response.data) {
        const tournament = response.data
        this.updateTournamentDetailsDisplay(tournament)
        
        // Load tournament bracket
        await this.loadTournamentBracket(tournamentId)
      } else {
        this.showNotification(response.message || 'Errore nel caricamento del torneo', 'error')
        this.router.navigate('/tournaments')
      }
    } catch (error) {
      console.error('Load tournament details error:', error)
      this.showNotification('Errore durante il caricamento del torneo', 'error')
      this.router.navigate('/tournaments')
    }
  }

  private updateTournamentDetailsDisplay(tournament: any) {
    // Hide loading, show content
    const loadingElement = document.getElementById('tournament-loading')
    const contentElement = document.getElementById('tournament-content')
    
    if (loadingElement) loadingElement.classList.add('hidden')
    if (contentElement) contentElement.classList.remove('hidden')
    
    // Update tournament info
    const nameElement = document.getElementById('tournament-name')
    const gameElement = document.getElementById('tournament-game')
    const participantsElement = document.getElementById('tournament-participants')
    const statusElement = document.getElementById('tournament-status')
    
    if (nameElement) nameElement.textContent = tournament.name
    if (gameElement) gameElement.textContent = tournament.gameType === 'pong' ? 'Pong 3D' : 'Breakout Cyber'
    if (participantsElement) participantsElement.textContent = `${tournament.currentParticipants || 0}/${tournament.maxParticipants}`
    if (statusElement) statusElement.textContent = this.getTournamentStatusText(tournament.status)
    
    // Show/hide action buttons based on tournament status
    const joinButton = document.getElementById('join-tournament-btn')
    const startButton = document.getElementById('start-tournament-btn')
    
    if (tournament.status === 'registration') {
      if (joinButton) joinButton.classList.remove('hidden')
      if (startButton) startButton.classList.add('hidden')
    } else if (tournament.status === 'active') {
      if (joinButton) joinButton.classList.add('hidden')
      if (startButton) startButton.classList.add('hidden')
    }
    
    // Add event listeners
    if (joinButton && !joinButton.hasAttribute('data-listener')) {
      joinButton.setAttribute('data-listener', 'true')
      joinButton.addEventListener('click', () => {
        this.joinTournament(tournament.id)
      })
    }
    
    if (startButton && !startButton.hasAttribute('data-listener')) {
      startButton.setAttribute('data-listener', 'true')
      startButton.addEventListener('click', () => {
        this.startTournament(tournament.id)
      })
    }
    
    const bracketButton = document.getElementById('view-bracket-btn')
    if (bracketButton && !bracketButton.hasAttribute('data-listener')) {
      bracketButton.setAttribute('data-listener', 'true')
      bracketButton.addEventListener('click', () => {
        this.loadTournamentBracket(tournament.id)
      })
    }
  }

  private async loadTournamentBracket(tournamentId: string) {
    try {
      const response = await this.apiService.getTournamentBracket(tournamentId)
      
      if (response.success && response.data) {
        this.renderTournamentBracket(response.data)
      } else {
        this.showNotification(response.message || 'Errore nel caricamento del tabellone', 'error')
      }
    } catch (error) {
      console.error('Load tournament bracket error:', error)
      this.showNotification('Errore durante il caricamento del tabellone', 'error')
    }
  }

  private renderTournamentBracket(bracket: any) {
    const bracketElement = document.getElementById('tournament-bracket')
    if (!bracketElement) return
    
    // This is a simplified bracket rendering
    // In a real implementation, you would create a more complex visualization
    bracketElement.innerHTML = `
      <div class="text-center">
        <p class="text-cyber-green mb-4">Tabellone del torneo</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${bracket.rounds ? bracket.rounds.map((round: any, index: number) => `
            <div class="cyber-card">
              <h3 class="text-lg font-bold text-cyber-green mb-2">Round ${index + 1}</h3>
              <div class="space-y-2">
                ${round.matches ? round.matches.map((match: any) => `
                  <div class="border border-cyber-green rounded p-2">
                    <div class="flex justify-between">
                      <span>${match.player1 || 'TBD'}</span>
                      <span>VS</span>
                      <span>${match.player2 || 'TBD'}</span>
                    </div>
                    ${match.winner ? `<div class="text-cyber-cyan text-sm">Vincitore: ${match.winner}</div>` : ''}
                  </div>
                `).join('') : '<p>Nessuna partita</p>'}
              </div>
            </div>
          `).join('') : '<p>Nessun round disponibile</p>'}
        </div>
      </div>
    `
  }

  private async startTournament(tournamentId: string) {
    try {
      const response = await this.apiService.startTournament(tournamentId)
      
      if (response.success) {
        this.showNotification('Torneo avviato con successo!', 'success')
        this.loadTournamentDetails(tournamentId) // Reload tournament details
      } else {
        this.showNotification(response.message || 'Errore nell\'avvio del torneo', 'error')
      }
    } catch (error) {
      console.error('Start tournament error:', error)
      this.showNotification('Errore durante l\'avvio del torneo', 'error')
    }
  }

  private renderChatPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel w-full h-full mx-auto h-96">
        <h1 class="cyber-title text-center">CHAT CYBER</h1>
        <div class="flex h-80">
          <div id="chat-sidebar" class="w-1/3 border-r border-cyber-green pr-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Utenti Online</h2>
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
    `
    
    // Initialize chat
    this.initializeChat()
  }

  private renderProfilePage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    // Check authentication state before applying auth guard
    const authState = authService.getState()
    console.log('Profile page - Auth state:', authState)

    if (!authState.isAuthenticated) {
      console.log('Profile page - User not authenticated, redirecting to login')
      // Redirect to login if not authenticated
      this.router.navigate('/login')
      return
    }

    console.log('Profile page - User authenticated, showing profile')
    // Create and apply auth guard to profile page
    const authGuard = createAuthGuard(contentElement)
    authGuard.protect(contentElement)

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
    `

    // Load real user data and stats
    this.loadProfileData()

    // Add logout event listener
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout()
      })
    }
  }

  private async loadProfileData() {
    try {
      const authState = authService.getState()

      if (!authState.isAuthenticated || !authState.user) {
        this.router.navigate('/login')
        return
      }

      // Show loading
      const loadingElement = document.getElementById('profile-loading')
      const contentElement = document.getElementById('profile-content')

      if (loadingElement) loadingElement.classList.remove('hidden')
      if (contentElement) contentElement.classList.add('hidden')

      // Get user stats from API
      const userStatsResponse = await this.apiService.getUserStats(authState.user.id)

      if (userStatsResponse.success && userStatsResponse.data) {
        // Update profile with real data
        this.updateProfileDisplay(authState.user, userStatsResponse.data)
      } else {
        // Show error and use basic user info
        this.updateProfileDisplay(authState.user, null)
        this.showNotification('Impossibile caricare le statistiche', 'error')
      }

      // Hide loading, show content
      if (loadingElement) loadingElement.classList.add('hidden')
      if (contentElement) contentElement.classList.remove('hidden')

    } catch (error) {
      console.error('Error loading profile data:', error)

      const loadingElement = document.getElementById('profile-loading')
      const contentElement = document.getElementById('profile-content')

      if (loadingElement) loadingElement.classList.add('hidden')
      if (contentElement) contentElement.classList.remove('hidden')

      this.showNotification('Errore nel caricamento del profilo', 'error')
    }
  }

  private updateProfileDisplay(user: any, stats: any) {
    // Update user info
    const usernameEl = document.getElementById('profile-username')
    const emailEl = document.getElementById('profile-email')
    const displayNameEl = document.getElementById('profile-display-name')

    if (usernameEl) usernameEl.textContent = user.username || 'N/A'
    if (emailEl) emailEl.textContent = user.email || 'N/A'
    if (displayNameEl) displayNameEl.textContent = user.display_name || user.username || 'N/A'

    // Update stats if available - handle the actual API response format
    if (stats) {
      const pongWinsEl = document.getElementById('pong-wins')
      const pongLossesEl = document.getElementById('pong-losses')
      const pongRatioEl = document.getElementById('pong-ratio')
      const tournamentsPlayedEl = document.getElementById('tournaments-played')
      const tournamentsWonEl = document.getElementById('tournaments-won')

      // Handle API response format: { wins: 0, losses: 0, tournaments_played: 0, tournaments_won: 0 }
      const wins = stats.wins || stats.pong?.wins || '0'
      const losses = stats.losses || stats.pong?.losses || '0'
      const tournamentsPlayed = stats.tournaments_played || stats.tournaments?.played || '0'
      const tournamentsWon = stats.tournaments_won || stats.tournaments?.won || '0'

      if (pongWinsEl) pongWinsEl.textContent = wins.toString()
      if (pongLossesEl) pongLossesEl.textContent = losses.toString()
      if (tournamentsPlayedEl) tournamentsPlayedEl.textContent = tournamentsPlayed.toString()
      if (tournamentsWonEl) tournamentsWonEl.textContent = tournamentsWon.toString()

      if (pongRatioEl) {
        const winsNum = parseInt(wins.toString())
        const lossesNum = parseInt(losses.toString())
        const ratio = lossesNum > 0
          ? (winsNum / lossesNum).toFixed(2)
          : winsNum > 0 ? '∞' : '0'
        pongRatioEl.textContent = ratio
      }

      // For breakout stats, use placeholder data since API doesn't return them yet
      const breakoutLevelsEl = document.getElementById('breakout-levels')
      const breakoutHighscoreEl = document.getElementById('breakout-highscore')
      const breakoutPowerupsEl = document.getElementById('breakout-powerups')

      if (breakoutLevelsEl) breakoutLevelsEl.textContent = stats.breakout?.levels || '0'
      if (breakoutHighscoreEl) breakoutHighscoreEl.textContent = stats.breakout?.highscore || '0'
      if (breakoutPowerupsEl) breakoutPowerupsEl.textContent = stats.breakout?.powerups || '0'
    }
  }

  private async handleLogout() {
    try {
      await authService.logout()
      
      // Update navbar to reset username
      if (this.navbar) {
        this.navbar.updateUsername('-')
      }
      
      this.showNotification('Logout effettuato con successo', 'success')
      this.router.navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      this.showNotification('Errore durante il logout', 'error')
    }
  }

  private async renderSettingsPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div id="settings-container" class="max-w-4xl mx-auto">
        <!-- GameSettings component will be rendered here -->
      </div>
    `
    
    // Create and initialize GameSettings component
    const gameSettings = new GameSettingsComponent()
    gameSettings.render(document.getElementById('settings-container')!)
  }

  private renderNotFoundPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-md mx-auto text-center">
        <h1 class="cyber-title text-3xl mb-4">ERRORE 404</h1>
        <p class="terminal-text mb-6">Pagina non trovata. Il sistema cyber ha rilevato un'anomalia.</p>
        <a href="/" class="cyber-button inline-block">Torna alla Home</a>
      </div>
    `
  }

  private async handleLogin(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      // Use AuthService for login (this handles token storage and state management)
      const response = await authService.login(email, password)

      if (response.success) {
        // Show success notification
        this.showNotification('Login effettuato con successo!', 'success')

        // Update navbar with user data
        if (this.navbar && response.user) {
          const username = response.user.username || '-'
          this.navbar.updateUsername(username)
          this.navbar['updateUserUI']()
        }

        // Trigger a custom event to notify other components about the login
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { user: response.user } 
      }))

        // Redirect to profile page
        
        this.router.navigate('/profile')
      } else {
        // Show error message
        this.showNotification(response.message || 'Credenziali non valide. Riprova.', 'error')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showNotification('Errore durante il login. Riprova più tardi.', 'error')
    }
  }

  private validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'La password deve contenere almeno 8 caratteri.' }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'La password deve contenere almeno una lettera minuscola.' }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'La password deve contenere almeno una lettera maiuscola.' }
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'La password deve contenere almeno un numero.' }
    }

    return { isValid: true, message: '' }
  }

  private async handleRegister(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const displayName = formData.get('display-name') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm-password') as string

    if (password !== confirmPassword) {
      this.showNotification('Le password non coincidono.', 'error')
      return
    }

    // Validate password requirements
    const passwordValidation = this.validatePassword(password)
    if (!passwordValidation.isValid) {
      this.showNotification(passwordValidation.message, 'error')
      return
    }
    
    try {
      // Call API service for registration
      const response = await this.apiService.register(username, email, password, displayName)
      
      if (response.success) {
        // Show success message
        this.showNotification('Registrazione completata. Ora puoi accedere.', 'success')
        
        // Redirect to login page
        this.router.navigate('/login')
      } else {
        // Show error message
        this.showNotification(response.message || 'Errore durante la registrazione.', 'error')
      }
    } catch (error) {
      console.error('Registration error:', error)
      this.showNotification('Errore durante la registrazione. Riprova più tardi.', 'error')
    }
  }

  private async handleAccountSettings(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    
    const newUsername = formData.get('new-username') as string
    const newEmail = formData.get('new-email') as string
    
    try {
      // Call API service to update account
      const response = await this.apiService.updateAccount(newUsername, newEmail)
      
      if (response.success) {
        this.showNotification('Account aggiornato con successo.', 'success')
      } else {
        this.showNotification(response.message || 'Errore durante l\'aggiornamento.', 'error')
      }
    } catch (error) {
      console.error('Account update error:', error)
      this.showNotification('Errore durante l\'aggiornamento. Riprova più tardi.', 'error')
    }
  }

  private async handleGameSettings(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    
    const ballSpeed = formData.get('ball-speed') as 'slow' | 'normal' | 'fast'
    const powerUps = formData.get('power-ups') === 'on'
    const theme = formData.get('theme') as 'classic' | 'cyber' | 'neon'
    
    try {
      // Call API service to update game settings
      const response = await this.apiService.updateGameSettings('pong', {
        ballSpeed,
        powerUps,
        theme
      })
      
      if (response.success) {
        this.showNotification('Impostazioni di gioco salvate con successo.', 'success')
      } else {
        this.showNotification(response.message || 'Errore durante il salvataggio.', 'error')
      }
    } catch (error) {
      console.error('Game settings update error:', error)
      this.showNotification('Errore durante il salvataggio. Riprova più tardi.', 'error')
    }
  }

  private initializePongGame() {
    const canvasContainer = document.getElementById('pong-canvas-container')
    if (!canvasContainer) return
    
    // Create and initialize PongCanvas
    const pongCanvas = new PongCanvas()
    pongCanvas.render(canvasContainer)
    
    // Set score callback
    pongCanvas.updateScore = (player1Score: number, player2Score: number) => {
      const player1ScoreElement = document.getElementById('player1-score')
      const player2ScoreElement = document.getElementById('player2-score')
      
      if (player1ScoreElement) player1ScoreElement.textContent = player1Score.toString()
      if (player2ScoreElement) player2ScoreElement.textContent = player2Score.toString()
      
      // Check for game over
      if (player1Score >= 5 || player2Score >= 5) {
        const winner = player1Score >= 5 ? 'PLAYER 1' : 'PLAYER 2'
        this.showNotification(`Vincitore: ${winner}!`, 'success')
      }
    }
    
    // Add event listeners for game controls
    const startPvPButton = document.getElementById('start-pvp')
    if (startPvPButton) {
      startPvPButton.addEventListener('click', () => {
        console.log('Starting Pong PvP game...')
        this.startPongGame('pvp')
      })
    }
    
    const startPvEEasyButton = document.getElementById('start-pve-easy')
    if (startPvEEasyButton) {
      startPvEEasyButton.addEventListener('click', () => {
        console.log('Starting Pong PvE easy game...')
        this.startPongGame('pve', 'easy')
      })
    }
    
    const startPvEMediumButton = document.getElementById('start-pve-medium')
    if (startPvEMediumButton) {
      startPvEMediumButton.addEventListener('click', () => {
        console.log('Starting Pong PvE medium game...')
        this.startPongGame('pve', 'medium')
      })
    }
    
    const startPvEHardButton = document.getElementById('start-pve-hard')
    if (startPvEHardButton) {
      startPvEHardButton.addEventListener('click', () => {
        console.log('Starting Pong PvE hard game...')
        this.startPongGame('pve', 'hard')
      })
    }
    
    const settingsButton = document.getElementById('game-settings')
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.router.navigate('/settings')
      })
    }
  }

  private startPongGame(mode: 'pvp' | 'pve', difficulty?: 'easy' | 'medium' | 'hard') {
    // Start the game with the specified mode and difficulty
    const gameMode = mode === 'pvp' ? '1 vs 1' : `1 vs BOT (${difficulty})`
    this.showNotification(`Partita avviata: ${gameMode}!`, 'success')
    
    // Here you would initialize the actual game with the specified mode and difficulty
    // For now, we'll just show a notification
  }

  private initializeBreakoutGame() {
    const canvasContainer = document.getElementById('breakout-canvas-container')
    if (!canvasContainer) return
    
    // Create and initialize BreakoutCanvas
    const breakoutCanvas = new BreakoutCanvas()
    breakoutCanvas.render(canvasContainer)
    
    // Set score callback
    breakoutCanvas.updateScore = (score: number, level: number, lives: number) => {
      const scoreElement = document.getElementById('breakout-score')
      const levelElement = document.getElementById('breakout-level')
      const livesElement = document.getElementById('breakout-lives')
      
      if (scoreElement) scoreElement.textContent = score.toString()
      if (levelElement) levelElement.textContent = level.toString()
      if (livesElement) livesElement.textContent = lives.toString()
      
      // Check for game over
      if (lives <= 0) {
        const winner = 'PLAYER 1'
        this.showNotification(`Game Over! Vincitore: ${winner}`, 'error')
      }
    }
    
    // Add event listeners for game controls
    const startButton = document.getElementById('start-breakout')
    if (startButton) {
      startButton.addEventListener('click', () => {
        console.log('Starting Breakout game...')
        this.startBreakoutGame()
      })
    }
    
    const settingsButton = document.getElementById('breakout-settings')
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.router.navigate('/settings')
      })
    }
  }

  private startBreakoutGame() {
    // Start the Breakout game
    this.showNotification('Partita Breakout avviata!', 'success')
    
    // Here you would initialize the actual game
    // For now, we'll just show a notification
  }

  private initializeTournamentsPage() {
    // Add event listeners for tournament creation
    const createT4Button = document.getElementById('create-t4-tournament')
    if (createT4Button) {
      createT4Button.addEventListener('click', () => {
        this.createTournament(4)
      })
    }
    
    const createT8Button = document.getElementById('create-t8-tournament')
    if (createT8Button) {
      createT8Button.addEventListener('click', () => {
        this.createTournament(8)
      })
    }
    
    // Load tournaments
    this.loadTournaments()
  }

  private async createTournament(maxParticipants: number) {
    try {
      const tournamentType = maxParticipants === 4 ? 'T4' : 'T8'
      const tournamentData = {
        name: `Torneo ${tournamentType} - ${new Date().toLocaleDateString()}`,
        gameType: 'pong', // Default to pong, could be extended
        maxParticipants,
        type: tournamentType.toLowerCase()
      }
      
      const response = await this.apiService.createTournament(tournamentData)
      
      if (response.success) {
        this.showNotification(`Torneo ${tournamentType} creato con successo!`, 'success')
        this.loadTournaments() // Reload tournaments list
      } else {
        this.showNotification(response.message || 'Errore nella creazione del torneo', 'error')
      }
    } catch (error) {
      console.error('Create tournament error:', error)
      this.showNotification('Errore durante la creazione del torneo', 'error')
    }
  }

  private async loadTournaments() {
    try {
      const response = await this.apiService.getTournaments()
      
      if (response.success && response.data) {
        const tournaments = response.data
        const activeTournaments = tournaments.filter((t: any) => t.status === 'active' || t.status === 'registration')
        const pastTournaments = tournaments.filter((t: any) => t.status === 'completed')
        
        this.renderTournamentsList(activeTournaments, 'active-tournaments')
        this.renderTournamentsList(pastTournaments, 'past-tournaments')
      } else {
        this.showTournamentsError('active-tournaments')
        this.showTournamentsError('past-tournaments')
      }
    } catch (error) {
      console.error('Load tournaments error:', error)
      this.showTournamentsError('active-tournaments')
      this.showTournamentsError('past-tournaments')
    }
  }

  private renderTournamentsList(tournaments: any[], containerId: string) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    if (tournaments.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 py-4">
          <p>Nessun torneo ${containerId === 'active-tournaments' ? 'attivo' : 'passato'} disponibile</p>
        </div>
      `
      return
    }
    
    container.innerHTML = tournaments.map(tournament => `
      <div class="border border-cyber-green rounded p-4 hover:bg-cyber-dark/50 transition-colors">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold text-cyber-green">${tournament.name}</h3>
            <p class="text-sm text-gray-400">
              Gioco: ${tournament.gameType === 'pong' ? 'Pong 3D' : 'Breakout Cyber'} | 
              Partecipanti: ${tournament.currentParticipants || 0}/${tournament.maxParticipants} |
              Stato: ${this.getTournamentStatusText(tournament.status)}
            </p>
            ${tournament.winner ? `<p class="text-sm text-cyber-cyan">Vincitore: ${tournament.winner}</p>` : ''}
          </div>
          <div class="flex space-x-2">
            ${tournament.status === 'registration' ? 
              `<button class="cyber-button-sm" onclick="app.joinTournament('${tournament.id}')">Iscriviti</button>` : 
              tournament.status === 'active' ? 
              `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Visualizza</button>` :
              `<button class="cyber-button-sm" onclick="app.viewTournament('${tournament.id}')">Risultati</button>`
            }
          </div>
        </div>
      </div>
    `).join('')
  }

  private showTournamentsError(containerId: string) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    container.innerHTML = `
      <div class="text-center text-cyber-magenta py-4">
        <p>Errore nel caricamento dei tornei</p>
      </div>
    `
  }

  private getTournamentStatusText(status: string): string {
    switch (status) {
      case 'registration': return 'Iscrizioni aperte'
      case 'active': return 'In corso'
      case 'completed': return 'Completato'
      default: return status
    }
  }

  async joinTournament(tournamentId: string) {
    try {
      const response = await this.apiService.registerForTournament(tournamentId)
      
      if (response.success) {
        this.showNotification('Iscrizione al torneo effettuata con successo!', 'success')
        this.loadTournaments() // Reload tournaments list
      } else {
        this.showNotification(response.message || 'Errore nell\'iscrizione al torneo', 'error')
      }
    } catch (error) {
      console.error('Join tournament error:', error)
      this.showNotification('Errore durante l\'iscrizione al torneo', 'error')
    }
  }

  viewTournament(tournamentId: string) {
    // Navigate to tournament details page
    this.router.navigate(`/tournament/${tournamentId}`)
  }

  private initializeChat() {
    const chatMain = document.getElementById('chat-main')
    if (!chatMain) return

    // Cleanup existing chatBox if any
    if (this.chatBox) {
      this.chatBox.cleanup()
    }

    // Create and initialize ChatBox
    this.chatBox = new ChatBox()
    this.chatBox.render(chatMain)

    // Make chatBox globally available for button onclick handlers
    window.chatBox = this.chatBox
    
    // Add event listeners for chat controls
    const sendButton = document.getElementById('send-message')
    const messageInput = document.getElementById('message-input') as HTMLInputElement
    
    if (sendButton && messageInput) {
      sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim()
        if (message) {
          console.log('Sending message:', message)
          messageInput.value = ''
          // Message sending logic is handled by ChatBox component
        }
      })
      
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendButton.click()
        }
      })
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-20 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'success' ? 'bg-cyber-green text-cyber-black' :
      type === 'error' ? 'bg-cyber-magenta text-white' :
      'bg-cyber-cyan text-cyber-black'
    }`
    notification.textContent = message
    
    // Add to DOM
    document.body.appendChild(notification)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}
