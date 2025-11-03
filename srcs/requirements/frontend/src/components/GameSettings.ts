import { ApiService } from '../services/ApiService'

export interface GameSettings {
  ballSpeed: 'slow' | 'normal' | 'fast'
  powerUps: boolean
  theme: 'classic' | 'cyber' | 'neon'
  soundEnabled: boolean
  particlesEnabled: boolean
  difficulty: 'easy' | 'normal' | 'hard'
}

export class GameSettingsComponent {
  private apiService: ApiService
  private settings: GameSettings
  private settingsCallback: ((settings: GameSettings) => void) | null = null

  constructor() {
    this.apiService = new ApiService()
    
    // Default settings
    this.settings = {
      ballSpeed: 'normal',
      powerUps: true,
      theme: 'cyber',
      soundEnabled: true,
      particlesEnabled: true,
      difficulty: 'normal'
    }
    
    // Load saved settings
    this.loadSettings()
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="cyber-panel max-w-2xl mx-auto">
        <h1 class="cyber-title text-center mb-6">IMPOSTAZIONI GIOCO</h1>
        
        <div class="space-y-6">
          <!-- Game Selection -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Seleziona Gioco</h2>
            <div class="grid grid-cols-2 gap-4">
              <button id="select-pong" class="cyber-button">Pong 3D</button>
              <button id="select-breakout" class="cyber-button">Breakout Cyber</button>
            </div>
          </div>
          
          <!-- Ball Speed -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Velocità Palla</h2>
            <div class="flex space-x-2">
              <button class="speed-option cyber-button ${this.settings.ballSpeed === 'slow' ? 'bg-cyber-green text-cyber-black' : ''}" data-speed="slow">Lenta</button>
              <button class="speed-option cyber-button ${this.settings.ballSpeed === 'normal' ? 'bg-cyber-green text-cyber-black' : ''}" data-speed="normal">Normale</button>
              <button class="speed-option cyber-button ${this.settings.ballSpeed === 'fast' ? 'bg-cyber-green text-cyber-black' : ''}" data-speed="fast">Veloce</button>
            </div>
          </div>
          
          <!-- Power-ups -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Power-up</h2>
            <div class="flex items-center space-x-2">
              <input type="checkbox" id="power-ups-toggle" class="w-4 h-4" ${this.settings.powerUps ? 'checked' : ''}>
              <label for="power-ups-toggle" class="text-cyber-green">Abilita Power-up</label>
            </div>
          </div>
          
          <!-- Theme -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Tema</h2>
            <div class="flex space-x-2">
              <button class="theme-option cyber-button ${this.settings.theme === 'classic' ? 'bg-cyber-green text-cyber-black' : ''}" data-theme="classic">Classico</button>
              <button class="theme-option cyber-button ${this.settings.theme === 'cyber' ? 'bg-cyber-green text-cyber-black' : ''}" data-theme="cyber">Cyber</button>
              <button class="theme-option cyber-button ${this.settings.theme === 'neon' ? 'bg-cyber-green text-cyber-black' : ''}" data-theme="neon">Neon</button>
            </div>
          </div>
          
          <!-- Difficulty -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Difficoltà</h2>
            <div class="flex space-x-2">
              <button class="difficulty-option cyber-button ${this.settings.difficulty === 'easy' ? 'bg-cyber-green text-cyber-black' : ''}" data-difficulty="easy">Facile</button>
              <button class="difficulty-option cyber-button ${this.settings.difficulty === 'normal' ? 'bg-cyber-green text-cyber-black' : ''}" data-difficulty="normal">Normale</button>
              <button class="difficulty-option cyber-button ${this.settings.difficulty === 'hard' ? 'bg-cyber-green text-cyber-black' : ''}" data-difficulty="hard">Difficile</button>
            </div>
          </div>
          
          <!-- Audio -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Audio</h2>
            <div class="flex items-center space-x-2">
              <input type="checkbox" id="sound-toggle" class="w-4 h-4" ${this.settings.soundEnabled ? 'checked' : ''}>
              <label for="sound-toggle" class="text-cyber-green">Abilita Suoni</label>
            </div>
          </div>
          
          <!-- Visual Effects -->
          <div class="cyber-card p-4">
            <h2 class="text-lg font-bold text-cyber-green mb-4">Effetti Visivi</h2>
            <div class="flex items-center space-x-2">
              <input type="checkbox" id="particles-toggle" class="w-4 h-4" ${this.settings.particlesEnabled ? 'checked' : ''}>
              <label for="particles-toggle" class="text-cyber-green">Abilita Particelle</label>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex justify-center space-x-4">
            <button id="save-settings" class="cyber-button">Salva Impostazioni</button>
            <button id="reset-settings" class="cyber-button">Ripristina Predefinite</button>
          </div>
        </div>
      </div>
    `
    
    // Add event listeners
    this.addEventListeners()
  }

  private addEventListeners() {
    // Ball speed options
    document.querySelectorAll('.speed-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const speed = (e.target as HTMLElement).getAttribute('data-speed') as 'slow' | 'normal' | 'fast'
        if (speed) {
          this.settings.ballSpeed = speed
          this.updateSpeedUI()
        }
      })
    })
    
    // Power-ups toggle
    const powerUpsToggle = document.getElementById('power-ups-toggle') as HTMLInputElement
    if (powerUpsToggle) {
      powerUpsToggle.addEventListener('change', (e) => {
        this.settings.powerUps = (e.target as HTMLInputElement).checked
      })
    }
    
    // Theme options
    document.querySelectorAll('.theme-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const theme = (e.target as HTMLElement).getAttribute('data-theme') as 'classic' | 'cyber' | 'neon'
        if (theme) {
          this.settings.theme = theme
          this.updateThemeUI()
          this.applyTheme(theme)
        }
      })
    })
    
    // Difficulty options
    document.querySelectorAll('.difficulty-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const difficulty = (e.target as HTMLElement).getAttribute('data-difficulty') as 'easy' | 'normal' | 'hard'
        if (difficulty) {
          this.settings.difficulty = difficulty
          this.updateDifficultyUI()
        }
      })
    })
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle') as HTMLInputElement
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.settings.soundEnabled = (e.target as HTMLInputElement).checked
      })
    }
    
    // Particles toggle
    const particlesToggle = document.getElementById('particles-toggle') as HTMLInputElement
    if (particlesToggle) {
      particlesToggle.addEventListener('change', (e) => {
        this.settings.particlesEnabled = (e.target as HTMLInputElement).checked
      })
    }
    
    // Save settings button
    const saveButton = document.getElementById('save-settings')
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveSettings())
    }
    
    // Reset settings button
    const resetButton = document.getElementById('reset-settings')
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetSettings())
    }
  }

  private updateSpeedUI() {
    document.querySelectorAll('.speed-option').forEach(button => {
      const speed = button.getAttribute('data-speed')
      if (speed === this.settings.ballSpeed) {
        button.classList.add('bg-cyber-green', 'text-cyber-black')
      } else {
        button.classList.remove('bg-cyber-green', 'text-cyber-black')
      }
    })
  }

  private updateThemeUI() {
    document.querySelectorAll('.theme-option').forEach(button => {
      const theme = button.getAttribute('data-theme')
      if (theme === this.settings.theme) {
        button.classList.add('bg-cyber-green', 'text-cyber-black')
      } else {
        button.classList.remove('bg-cyber-green', 'text-cyber-black')
      }
    })
  }

  private updateDifficultyUI() {
    document.querySelectorAll('.difficulty-option').forEach(button => {
      const difficulty = button.getAttribute('data-difficulty')
      if (difficulty === this.settings.difficulty) {
        button.classList.add('bg-cyber-green', 'text-cyber-black')
      } else {
        button.classList.remove('bg-cyber-green', 'text-cyber-black')
      }
    })
  }

  private applyTheme(theme: 'classic' | 'cyber' | 'neon') {
    // Apply theme to the entire application
    const body = document.body
    
    // Remove existing theme classes
    body.classList.remove('theme-classic', 'theme-cyber', 'theme-neon')
    
    // Add new theme class
    body.classList.add(`theme-${theme}`)
    
    // Update CSS variables based on theme
    const root = document.documentElement
    
    switch (theme) {
      case 'classic':
        root.style.setProperty('--primary-color', '#ffffff')
        root.style.setProperty('--secondary-color', '#cccccc')
        root.style.setProperty('--accent-color', '#888888')
        break
      case 'cyber':
        root.style.setProperty('--primary-color', '#00ff41')
        root.style.setProperty('--secondary-color', '#00ffff')
        root.style.setProperty('--accent-color', '#ff00ff')
        break
      case 'neon':
        root.style.setProperty('--primary-color', '#ff00ff')
        root.style.setProperty('--secondary-color', '#00ffff')
        root.style.setProperty('--accent-color', '#ffff00')
        break
    }
  }

  private async saveSettings() {
    try {
      // Save to localStorage
      localStorage.setItem('gameSettings', JSON.stringify(this.settings))
      
      // Save to backend
      const response = await this.apiService.updateGameSettings(this.settings)
      
      if (response.success) {
        this.showNotification('Impostazioni salvate con successo!', 'success')
        
        // Notify callback if set
        if (this.settingsCallback) {
          this.settingsCallback(this.settings)
        }
      } else {
        this.showNotification('Errore durante il salvataggio delle impostazioni', 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      this.showNotification('Errore durante il salvataggio delle impostazioni', 'error')
    }
  }

  private resetSettings() {
    // Reset to default values
    this.settings = {
      ballSpeed: 'normal',
      powerUps: true,
      theme: 'cyber',
      soundEnabled: true,
      particlesEnabled: true,
      difficulty: 'normal'
    }
    
    // Update UI
    this.updateSpeedUI()
    this.updateThemeUI()
    this.updateDifficultyUI()
    
    // Update checkboxes
    const powerUpsToggle = document.getElementById('power-ups-toggle') as HTMLInputElement
    if (powerUpsToggle) powerUpsToggle.checked = this.settings.powerUps
    
    const soundToggle = document.getElementById('sound-toggle') as HTMLInputElement
    if (soundToggle) soundToggle.checked = this.settings.soundEnabled
    
    const particlesToggle = document.getElementById('particles-toggle') as HTMLInputElement
    if (particlesToggle) particlesToggle.checked = this.settings.particlesEnabled
    
    // Apply theme
    this.applyTheme(this.settings.theme)
    
    this.showNotification('Impostazioni ripristinate', 'info')
  }

  private loadSettings() {
    try {
      // Load from localStorage
      const savedSettings = localStorage.getItem('gameSettings')
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  public getSettings(): GameSettings {
    return { ...this.settings }
  }

  public setSettingsCallback(callback: (settings: GameSettings) => void): void {
    this.settingsCallback = callback
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

