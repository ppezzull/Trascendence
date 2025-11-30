export interface GameMode {
  id: string
  name: string
  description: string
  icon?: string
}

export interface BotDifficulty {
  id: string
  name: string
  description: string
}

export class GameModeSelector {
  private container: HTMLElement
  private onModeSelected: (modeId: string, difficulty?: string) => void
  private selectedMode: string | null = null
  private selectedDifficulty: string | null = null

  constructor(
    gameModes: GameMode[],
    botDifficulties?: BotDifficulty[],
    onModeSelected?: (modeId: string, difficulty?: string) => void
  ) {
    this.onModeSelected = onModeSelected || (() => {})
    this.container = document.createElement('div')
    this.container.className = 'game-mode-selector'
    
    this.initializeUI(gameModes, botDifficulties)
  }

  private initializeUI(gameModes: GameMode[], botDifficulties?: BotDifficulty[]) {
    this.container.innerHTML = `
      <div class="cyber-card">
        <h2 class="text-lg font-bold text-cyber-green mb-4 text-center">SELEZIONA MODALITÀ</h2>
        <div class="space-y-4">
          ${gameModes.map(mode => `
            <div class="mode-option border border-cyber-green rounded p-4 cursor-pointer hover:bg-cyber-dark/50 transition-colors" data-mode="${mode.id}">
              <div class="flex items-center">
                ${mode.icon ? `<i class="${mode.icon} text-cyber-green mr-3"></i>` : ''}
                <div class="flex-1">
                  <h3 class="text-md font-bold text-cyber-green">${mode.name}</h3>
                  <p class="text-sm text-gray-400">${mode.description}</p>
                </div>
                <div class="mode-radio">
                  <input type="radio" name="game-mode" value="${mode.id}" class="sr-only">
                  <div class="w-5 h-5 border-2 border-cyber-green rounded-full flex items-center justify-center">
                    <div class="w-3 h-3 bg-cyber-green rounded-full hidden"></div>
                  </div>
                </div>
              </div>
              ${mode.id === 'pve' && botDifficulties ? `
                <div class="difficulty-selector mt-4 hidden" id="difficulty-options">
                  <h4 class="text-sm font-bold text-cyber-green mb-2">Seleziona difficoltà:</h4>
                  <div class="grid grid-cols-3 gap-2">
                    ${botDifficulties.map(difficulty => `
                      <div class="difficulty-option border border-cyber-green rounded p-2 cursor-pointer hover:bg-cyber-dark/50 transition-colors text-center" data-difficulty="${difficulty.id}">
                        <input type="radio" name="bot-difficulty" value="${difficulty.id}" class="sr-only">
                        <div class="text-sm">${difficulty.name}</div>
                        <div class="text-xs text-gray-400">${difficulty.description}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="mt-6 text-center">
          <button id="start-game-btn" class="cyber-button" disabled>Avvia Partita</button>
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Mode selection
    const modeOptions = this.container.querySelectorAll('.mode-option')
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const modeId = option.getAttribute('data-mode')
        if (modeId) {
          this.selectMode(modeId)
        }
      })
    })

    // Difficulty selection (for PVE mode)
    const difficultyOptions = this.container.querySelectorAll('.difficulty-option')
    difficultyOptions.forEach(option => {
      option.addEventListener('click', () => {
        const difficultyId = option.getAttribute('data-difficulty')
        if (difficultyId) {
          this.selectDifficulty(difficultyId)
        }
      })
    })

    // Start button
    const startButton = this.container.querySelector('#start-game-btn') as HTMLButtonElement
    if (startButton) {
      startButton.addEventListener('click', () => {
        if (this.selectedMode) {
          this.onModeSelected(this.selectedMode, this.selectedDifficulty || undefined)
        }
      })
    }
  }

  private selectMode(modeId: string) {
    // Update visual selection
    const modeOptions = this.container.querySelectorAll('.mode-option')
    modeOptions.forEach(option => {
      const optionModeId = option.getAttribute('data-mode')
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement
      const radioIndicator = option.querySelector('.mode-radio > div') as HTMLElement
      
      if (optionModeId === modeId) {
        radio.checked = true
        radioIndicator.classList.remove('hidden')
        option.classList.add('border-cyber-cyan', 'bg-cyber-dark/30')
      } else {
        radio.checked = false
        radioIndicator.classList.add('hidden')
        option.classList.remove('border-cyber-cyan', 'bg-cyber-dark/30')
      }
    })

    this.selectedMode = modeId

    // Show/hide difficulty options based on mode
    const difficultyOptions = this.container.querySelector('#difficulty-options') as HTMLElement
    if (difficultyOptions) {
      if (modeId === 'pve') {
        difficultyOptions.classList.remove('hidden')
      } else {
        difficultyOptions.classList.add('hidden')
        this.selectedDifficulty = null
      }
    }

    this.updateStartButton()
  }

  private selectDifficulty(difficultyId: string) {
    // Update visual selection
    const difficultyOptions = this.container.querySelectorAll('.difficulty-option')
    difficultyOptions.forEach(option => {
      const optionDifficultyId = option.getAttribute('data-difficulty')
      const radio = option.querySelector('input[type="radio"]') as HTMLInputElement
      
      if (optionDifficultyId === difficultyId) {
        radio.checked = true
        option.classList.add('border-cyber-cyan', 'bg-cyber-dark/30')
      } else {
        radio.checked = false
        option.classList.remove('border-cyber-cyan', 'bg-cyber-dark/30')
      }
    })

    this.selectedDifficulty = difficultyId
    this.updateStartButton()
  }

  private updateStartButton() {
    const startButton = this.container.querySelector('#start-game-btn') as HTMLButtonElement
    if (!startButton) return

    let canStart = this.selectedMode !== null
    
    // For PVE mode, difficulty must also be selected
    if (this.selectedMode === 'pve' && !this.selectedDifficulty) {
      canStart = false
    }

    startButton.disabled = !canStart
  }

  public render(parentElement: HTMLElement) {
    parentElement.appendChild(this.container)
  }

  destroy() {
    this.container.remove()
  }
}
