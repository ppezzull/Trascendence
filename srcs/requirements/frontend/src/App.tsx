import { Router } from './router/Router'
import { Navbar } from './components/Navbar'
import { ApiService } from './services/ApiService'
import { PongCanvas } from './components/PongCanvas'
import { ChatBox } from './components/ChatBox'
import { BreakoutCanvas } from './components/BreakoutCanvas'
import { GameSettingsComponent } from './components/GameSettings'

export class App {
  private router: Router
  private apiService: ApiService

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
          <p class="text-cyber-green text-sm">© 2024 Trascendence - Cyber Gaming Platform</p>
        </footer>
      </div>
    `

    // Initialize components
    this.initializeComponents()
    
    // Setup routing
    this.setupRouting()
  }

  private initializeComponents() {
    // Initialize navbar
    const navbarElement = document.getElementById('navbar')
    if (navbarElement) {
      const navbar = new Navbar()
      navbar.render(navbarElement)
    }
  }

  private setupRouting() {
    // Initialize router with routes
    this.router.addRoute('/', () => this.renderHomePage())
    this.router.addRoute('/login', () => this.renderLoginPage())
    this.router.addRoute('/register', () => this.renderRegisterPage())
    this.router.addRoute('/games', () => this.renderGamesPage())
    this.router.addRoute('/pong', () => this.renderPongPage())
    this.router.addRoute('/breakout', () => this.renderBreakoutPage())
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
      <div class="cyber-panel max-w-4xl mx-auto">
        <h1 class="cyber-title text-center text-4xl mb-8">TRAScENDENCE</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Benvenuto nella Piattaforma Cyber</h2>
            <p class="terminal-text mb-4">
              Entra nel mondo dei giochi retrò-futuristici con grafica cyberpunk e sfida altri giocatori in partite epiche.
            </p>
            <div class="flex flex-col space-y-3">
              <button class="cyber-button" onclick="window.location.hash='#/login'">Accedi</button>
              <button class="cyber-button" onclick="window.location.hash='#/register'">Registrati</button>
            </div>
          </div>
          
          <div class="cyber-card">
            <h2 class="text-xl font-bold text-cyber-green mb-4">Giochi Disponibili</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span>Pong 3D</span>
                <button class="cyber-button text-sm" onclick="window.location.hash='#/pong'">Gioca</button>
              </div>
              <div class="flex items-center justify-between">
                <span>Breakout Cyber</span>
                <button class="cyber-button text-sm" onclick="window.location.hash='#/breakout'">Gioca</button>
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
            <label for="username" class="block text-sm font-medium text-cyber-green mb-1">Username</label>
            <input type="text" id="username" name="username" class="cyber-input" required>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-cyber-green mb-1">Password</label>
            <input type="password" id="password" name="password" class="cyber-input" required>
          </div>
          <button type="submit" class="cyber-button w-full">Accedi</button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-sm">Non hai un account? <a href="#/register" class="text-cyber-cyan hover:underline">Registrati</a></p>
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
            <label for="password" class="block text-sm font-medium text-cyber-green mb-1">Password</label>
            <input type="password" id="password" name="password" class="cyber-input" required>
          </div>
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-cyber-green mb-1">Conferma Password</label>
            <input type="password" id="confirm-password" name="confirm-password" class="cyber-input" required>
          </div>
          <button type="submit" class="cyber-button w-full">Registrati</button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-sm">Hai già un account? <a href="#/login" class="text-cyber-cyan hover:underline">Accedi</a></p>
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
      <div class="cyber-panel max-w-4xl mx-auto">
        <h1 class="cyber-title text-center">SELEZIONA GIOCO</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">PONG 3D</h2>
            <p class="terminal-text mb-4">Il classico gioco Pong con grafica 3D e stile cyberpunk</p>
            <button class="cyber-button" onclick="window.location.hash='#/pong'">Gioca Ora</button>
          </div>
          
          <div class="cyber-card text-center">
            <h2 class="text-xl font-bold text-cyber-green mb-4">BREAKOUT CYBER</h2>
            <p class="terminal-text mb-4">Distruggi i mattoni in un'arena futuristica con effetti speciali</p>
            <button class="cyber-button" onclick="window.location.hash='#/breakout'">Gioca Ora</button>
          </div>
        </div>
      </div>
    `
  }

  private renderPongPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-4xl mx-auto">
        <h1 class="cyber-title text-center">PONG 3D</h1>
        <div class="flex flex-col items-center">
          <div id="pong-canvas-container" class="w-full max-w-2xl h-96 bg-cyber-black border border-cyber-green mb-4">
            <!-- 3D Canvas will be rendered here -->
          </div>
          <div class="flex space-x-4">
            <button id="start-game" class="cyber-button">Inizia Partita</button>
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
      <div class="cyber-panel max-w-4xl mx-auto">
        <h1 class="cyber-title text-center">BREAKOUT CYBER</h1>
        <div class="flex flex-col items-center">
          <div id="breakout-canvas-container" class="w-full max-w-2xl h-96 bg-cyber-black border border-cyber-green mb-4">
            <!-- 3D Canvas will be rendered here -->
          </div>
          <div class="flex space-x-4">
            <button id="start-breakout" class="cyber-button">Inizia Partita</button>
            <button id="breakout-settings" class="cyber-button">Impostazioni</button>
          </div>
        </div>
      </div>
    `
    
    // Initialize Breakout game
    this.initializeBreakoutGame()
  }

  private renderChatPage() {
    const contentElement = document.getElementById('content')
    if (!contentElement) return

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-4xl mx-auto h-96">
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

    contentElement.innerHTML = `
      <div class="cyber-panel max-w-4xl mx-auto">
        <h1 class="cyber-title text-center">PROFILO UTENTE</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="cyber-card">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Informazioni</h2>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Username:</span>
                <span id="profile-username">CyberPlayer</span>
              </div>
              <div class="flex justify-between">
                <span>Email:</span>
                <span id="profile-email">player@cyber.com</span>
              </div>
              <div class="flex justify-between">
                <span>Stato:</span>
                <span class="text-cyber-cyan">Online</span>
              </div>
            </div>
          </div>
          
          <div class="cyber-card">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Statistiche Pong</h2>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Vittorie:</span>
                <span id="pong-wins">42</span>
              </div>
              <div class="flex justify-between">
                <span>Sconfitte:</span>
                <span id="pong-losses">18</span>
              </div>
              <div class="flex justify-between">
                <span>Ratio:</span>
                <span id="pong-ratio">2.33</span>
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
                <span id="breakout-powerups">87</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
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
        <button class="cyber-button" onclick="window.location.hash='#/'">Torna alla Home</button>
      </div>
    `
  }

  private async handleLogin(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    
    try {
      // Call API service for login
      const response = await this.apiService.login(username, password)
      
      if (response.success) {
        // Store auth token
        localStorage.setItem('authToken', response.token || '')
        
        // Redirect to home page
        window.location.hash = '#/'
      } else {
        // Show error message
        this.showNotification('Credenziali non valide. Riprova.', 'error')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showNotification('Errore durante il login. Riprova più tardi.', 'error')
    }
  }

  private async handleRegister(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm-password') as string
    
    if (password !== confirmPassword) {
      this.showNotification('Le password non coincidono.', 'error')
      return
    }
    
    try {
      // Call API service for registration
      const response = await this.apiService.register(username, email, password)
      
      if (response.success) {
        // Show success message
        this.showNotification('Registrazione completata. Ora puoi accedere.', 'success')
        
        // Redirect to login page
        window.location.hash = '#/login'
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
      const response = await this.apiService.updateGameSettings({
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
    const startButton = document.getElementById('start-game')
    if (startButton) {
      startButton.addEventListener('click', () => {
        console.log('Starting Pong game...')
        this.showNotification('Partita avviata!', 'success')
      })
    }
    
    const settingsButton = document.getElementById('game-settings')
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        window.location.hash = '#/settings'
      })
    }
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
        this.showNotification('Partita avviata!', 'success')
      })
    }
    
    const settingsButton = document.getElementById('breakout-settings')
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        window.location.hash = '#/settings'
      })
    }
  }

  private initializeChat() {
    const chatMain = document.getElementById('chat-main')
    if (!chatMain) return
    
    // Create and initialize ChatBox
    const chatBox = new ChatBox()
    chatBox.render(chatMain)
    
    // Make chatBox globally available for button onclick handlers
    window.chatBox = chatBox
    
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
