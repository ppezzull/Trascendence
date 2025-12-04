export interface GameControlsProps {
  onPause?: () => void
  onResume?: () => void
  onRestart?: () => void
  onExit?: () => void
  showPause?: boolean
  showRestart?: boolean
  showExit?: boolean
  isPaused?: boolean
}

export class GameControls {
  private container: HTMLElement
  private props: GameControlsProps

  constructor(props: GameControlsProps = {}) {
    this.props = {
      showPause: true,
      showRestart: true,
      showExit: true,
      isPaused: false,
      ...props
    }
    
    this.container = document.createElement('div')
    this.container.className = 'game-controls'
    
    this.renderContent()
  }

  private renderContent() {
    this.container.innerHTML = `
      <div class="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        ${this.props.showPause ? `
          <button id="pause-btn" class="cyber-button-sm w-12 h-12 flex items-center justify-center">
            <i class="fas ${this.props.isPaused ? 'fa-play' : 'fa-pause'}"></i>
          </button>
        ` : ''}
        
        ${this.props.showRestart ? `
          <button id="restart-btn" class="cyber-button-sm w-12 h-12 flex items-center justify-center">
            <i class="fas fa-redo"></i>
          </button>
        ` : ''}
        
        ${this.props.showExit ? `
          <button id="exit-btn" class="cyber-button-sm w-12 h-12 flex items-center justify-center">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Pause/Resume button
    const pauseButton = this.container.querySelector('#pause-btn')
    if (pauseButton) {
      pauseButton.addEventListener('click', () => {
        if (this.props.isPaused && this.props.onResume) {
          this.props.onResume()
        } else if (!this.props.isPaused && this.props.onPause) {
          this.props.onPause()
        }
      })
    }

    // Restart button
    const restartButton = this.container.querySelector('#restart-btn')
    if (restartButton && this.props.onRestart) {
      restartButton.addEventListener('click', this.props.onRestart)
    }

    // Exit button
    const exitButton = this.container.querySelector('#exit-btn')
    if (exitButton && this.props.onExit) {
      exitButton.addEventListener('click', this.props.onExit)
    }
  }

  updateProps(newProps: Partial<GameControlsProps>) {
    this.props = { ...this.props, ...newProps }
    this.renderContent()
  }

  setPaused(isPaused: boolean) {
    this.props.isPaused = isPaused
    const pauseButton = this.container.querySelector('#pause-btn i')
    if (pauseButton) {
      pauseButton.className = `fas ${isPaused ? 'fa-play' : 'fa-pause'}`
    }
  }

  public render(parentElement?: HTMLElement) {
    if (parentElement) {
      parentElement.appendChild(this.container)
    }
  }

  destroy() {
    this.container.remove()
  }
}
