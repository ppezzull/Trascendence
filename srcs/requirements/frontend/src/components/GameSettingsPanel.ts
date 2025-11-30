export interface GameSettings {
  ballSpeed?: 'slow' | 'normal' | 'fast'
  powerUps?: boolean
  theme?: 'classic' | 'cyber' | 'neon'
  maxScore?: number
  botDifficulty?: 'easy' | 'medium' | 'hard'
}

export class GameSettingsPanel {
  private container: HTMLElement
  private onSettingsChanged: (settings: GameSettings) => void
  private settings: GameSettings

  constructor(
    initialSettings: GameSettings = {},
    onSettingsChanged?: (settings: GameSettings) => void
  ) {
    this.settings = { ...initialSettings }
    this.onSettingsChanged = onSettingsChanged || (() => {})
    this.container = document.createElement('div')
    this.container.className = 'game-settings-panel'
    
    this.render()
  }

  private render() {
    this.container.innerHTML = `
      <div class="cyber-card">
        <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">IMPOSTAZIONI PARTITA</h2>
        <div class="space-y-4">
          <div class="setting-group">
            <label class="block text-sm font-medium text-cyber-green mb-2">Velocità Palla</label>
            <div class="grid grid-cols-3 gap-2">
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="slow">
                <input type="radio" name="ball-speed" value="slow" class="sr-only">
                <div class="text-sm">Lenta</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="normal">
                <input type="radio" name="ball-speed" value="normal" class="sr-only">
                <div class="text-sm">Normale</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="fast">
                <input type="radio" name="ball-speed" value="fast" class="sr-only">
                <div class="text-sm">Veloce</div>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label class="block text-sm font-medium text-cyber-green mb-2">Punteggio Massimo</label>
            <div class="grid grid-cols-3 gap-2">
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="3">
                <input type="radio" name="max-score" value="3" class="sr-only">
                <div class="text-sm">3</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="5">
                <input type="radio" name="max-score" value="5" class="sr-only">
                <div class="text-sm">5</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="7">
                <input type="radio" name="max-score" value="7" class="sr-only">
                <div class="text-sm">7</div>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" name="power-ups" class="sr-only">
              <div class="w-5 h-5 border-2 border-cyber-green rounded flex items-center justify-center mr-2">
                <div class="w-3 h-3 bg-cyber-green rounded-full hidden"></div>
              </div>
              <span class="text-sm font-medium text-cyber-green">Power-ups</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="block text-sm font-medium text-cyber-green mb-2">Tema</label>
            <div class="grid grid-cols-3 gap-2">
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="classic">
                <input type="radio" name="theme" value="classic" class="sr-only">
                <div class="text-sm">Classico</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="cyber">
                <input type="radio" name="theme" value="cyber" class="sr-only">
                <div class="text-sm">Cyber</div>
              </div>
              <div class="setting-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-value="neon">
                <input type="radio" name="theme" value="neon" class="sr-only">
                <div class="text-sm">Neon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    this.setupEventListeners()
    this.updateUI()
  }

  private setupEventListeners() {
    // Ball speed settings
    const ballSpeedOptions = this.container.querySelectorAll('[data-value][name="ball-speed"]')
    ballSpeedOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value') as 'slow' | 'normal' | 'fast'
        if (value) {
          this.settings.ballSpeed = value
          this.updateUI()
          this.onSettingsChanged(this.settings)
        }
      })
    })

    // Max score settings
    const maxScoreOptions = this.container.querySelectorAll('[data-value][name="max-score"]')
    maxScoreOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = parseInt(option.getAttribute('data-value') || '5')
        this.settings.maxScore = value
        this.updateUI()
        this.onSettingsChanged(this.settings)
      })
    })

    // Power-ups setting
    const powerUpsCheckbox = this.container.querySelector('input[name="power-ups"]') as HTMLInputElement
    if (powerUpsCheckbox) {
      powerUpsCheckbox.addEventListener('change', () => {
        this.settings.powerUps = powerUpsCheckbox.checked
        this.updateUI()
        this.onSettingsChanged(this.settings)
      })
    }

    // Theme settings
    const themeOptions = this.container.querySelectorAll('[data-value][name="theme"]')
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value') as 'classic' | 'cyber' | 'neon'
        if (value) {
          this.settings.theme = value
          this.updateUI()
          this.onSettingsChanged(this.settings)
        }
      })
    })
  }

  private updateUI() {
    // Update ball speed
    const ballSpeedOptions = this.container.querySelectorAll('[data-value][name="ball-speed"]')
    ballSpeedOptions.forEach(option => {
      const value = option.getAttribute('data-value')
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement
      
      if (value === this.settings.ballSpeed) {
        radio.checked = true
        option.classList.add('border-cyber-cyan', 'bg-cyber-dark/30')
      } else {
        radio.checked = false
        option.classList.remove('border-cyber-cyan', 'bg-cyber-dark/30')
      }
    })

    // Update max score
    const maxScoreOptions = this.container.querySelectorAll('[data-value][name="max-score"]')
    maxScoreOptions.forEach(option => {
      const value = parseInt(option.getAttribute('data-value') || '5')
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement
      
      if (value === this.settings.maxScore) {
        radio.checked = true
        option.classList.add('border-cyber-cyan', 'bg-cyber-dark/30')
      } else {
        radio.checked = false
        option.classList.remove('border-cyber-cyan', 'bg-cyber-dark/30')
      }
    })

    // Update power-ups
    const powerUpsCheckbox = this.container.querySelector('input[name="power-ups"]') as HTMLInputElement
    const powerUpsIndicator = this.container.querySelector('[name="power-ups"] + div > div') as HTMLElement
    if (powerUpsCheckbox && powerUpsIndicator) {
      powerUpsCheckbox.checked = this.settings.powerUps || false
      if (powerUpsCheckbox.checked) {
        powerUpsIndicator.classList.remove('hidden')
      } else {
        powerUpsIndicator.classList.add('hidden')
      }
    }

    // Update theme
    const themeOptions = this.container.querySelectorAll('[data-value][name="theme"]')
    themeOptions.forEach(option => {
      const value = option.getAttribute('data-value')
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement
      
      if (value === this.settings.theme) {
        radio.checked = true
        option.classList.add('border-cyber-cyan', 'bg-cyber-dark/30')
      } else {
        radio.checked = false
        option.classList.remove('border-cyber-cyan', 'bg-cyber-dark/30')
      }
    })
  }

  getSettings(): GameSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.updateUI()
  }

  public render(parentElement: HTMLElement) {
    parentElement.appendChild(this.container)
  }

  destroy() {
    this.container.remove()
  }
}
