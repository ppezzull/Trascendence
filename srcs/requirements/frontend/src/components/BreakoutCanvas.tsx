import * as BABYLON from '@babylonjs/core'
import { BreakoutGame } from '../graphics/BreakoutGame'

export class BreakoutCanvas {
  private canvas: HTMLCanvasElement | null = null
  private engine: BABYLON.Engine | null = null
  private scene: BABYLON.Scene | null = null
  private game: BreakoutGame | null = null
  private isRunning = false

  constructor() {
    this.game = new BreakoutGame()
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="relative w-full h-full">
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
            <span class="text-cyber-green font-mono">VITE: <span id="breakout-lives">3</span></span>
          </div>
        </div>
        
        <!-- Game Controls -->
        <div id="breakout-controls" class="absolute bottom-0 left-0 right-0 p-4 flex justify-center space-x-4">
          <button id="start-breakout-btn" class="cyber-button">Inizia Partita</button>
          <button id="pause-breakout-btn" class="cyber-button hidden">Pausa</button>
          <button id="resume-breakout-btn" class="cyber-button hidden">Riprendi</button>
          <button id="reset-breakout-btn" class="cyber-button">Reset</button>
        </div>
        
        <!-- Game Over Screen -->
        <div id="breakout-game-over" class="absolute inset-0 bg-cyber-black/80 flex items-center justify-center hidden">
          <div class="cyber-panel p-8 text-center">
            <h2 class="cyber-title text-2xl mb-4">PARTITA TERMINATA</h2>
            <p class="terminal-text mb-2">Punteggio finale: <span id="breakout-final-score" class="text-cyber-cyan font-bold">0</span></p>
            <p class="terminal-text mb-6">Livello raggiunto: <span id="breakout-final-level" class="text-cyber-cyan font-bold">1</span></p>
            <button id="play-again-breakout-btn" class="cyber-button">Gioca Ancora</button>
          </div>
        </div>
      </div>
    `
    
    // Initialize canvas and game
    this.initializeCanvas()
    this.addEventListeners()
  }

  private initializeCanvas() {
    this.canvas = document.getElementById('breakout-canvas') as HTMLCanvasElement
    if (!this.canvas) return
    
    // Initialize Babylon.js engine
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    })
    
    // Create scene
    this.createScene()
    
    // Initialize game
    if (this.scene && this.game) {
      this.game.initialize(this.scene, this.engine)
      this.game.setScoreCallback((score, level, lives) => {
        this.updateScore(score, level, lives)
      })
    }
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this))
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render()
      }
    })
  }

  private createScene() {
    if (!this.engine) return
    
    // Create a new scene
    this.scene = new BABYLON.Scene(this.engine)
    
    // Set scene background color
    this.scene.clearColor = new BABYLON.Color4(0.04, 0.04, 0.04, 1) // Dark cyber background
    
    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2, // Alpha
      Math.PI / 3, // Beta (higher angle for better view of bricks)
      25, // Radius (further away to see all bricks)
      BABYLON.Vector3.Zero(), // Target
      this.scene
    )
    camera.attachControl(this.canvas, true)
    
    // Create lights
    const light1 = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    )
    light1.intensity = 0.7
    
    const light2 = new BABYLON.PointLight(
      'light2',
      new BABYLON.Vector3(0, 10, 0),
      this.scene
    )
    light2.intensity = 0.5
    light2.diffuse = new BABYLON.Color3(0, 1, 0.25) // Cyber green light
    
    // Create cyber grid ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 20, height: 20 },
      this.scene
    )
    
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene)
    groundMaterial.diffuseColor = new BABYLON.Color3(0.04, 0.04, 0.04)
    groundMaterial.specularColor = new BABYLON.Color3(0, 1, 0.25)
    groundMaterial.emissiveColor = new BABYLON.Color3(0, 0.1, 0.025)
    
    // Create grid texture
    const gridTexture = new BABYLON.DynamicTexture('gridTexture', 512, this.scene)
    const context = gridTexture.getContext()
    
    // Draw grid lines
    context.strokeStyle = '#00ff41'
    context.lineWidth = 1
    context.fillStyle = '#0a0a0a'
    context.fillRect(0, 0, 512, 512)
    
    // Draw horizontal lines
    for (let i = 0; i <= 512; i += 32) {
      context.beginPath()
      context.moveTo(0, i)
      context.lineTo(512, i)
      context.stroke()
    }
    
    // Draw vertical lines
    for (let i = 0; i <= 512; i += 32) {
      context.beginPath()
      context.moveTo(i, 0)
      context.lineTo(i, 512)
      context.stroke()
    }
    
    gridTexture.update()
    
    groundMaterial.diffuseTexture = gridTexture
    ground.material = groundMaterial
    
    // Create cyber walls
    this.createWalls()
  }

  private createWalls() {
    if (!this.scene) return
    
    const wallMaterial = new BABYLON.StandardMaterial('wallMaterial', this.scene)
    wallMaterial.diffuseColor = new BABYLON.Color3(0.04, 0.04, 0.04)
    wallMaterial.specularColor = new BABYLON.Color3(0, 1, 0.25)
    wallMaterial.emissiveColor = new BABYLON.Color3(0, 0.05, 0.0125)
    wallMaterial.alpha = 0.7
    
    // Create walls
    const wallThickness = 0.2
    const wallHeight = 5
    const arenaSize = 20
    
    // Side walls
    const leftWall = BABYLON.MeshBuilder.CreateBox(
      'leftWall',
      { width: wallThickness, height: wallHeight, depth: arenaSize },
      this.scene
    )
    leftWall.position.x = -arenaSize / 2
    leftWall.material = wallMaterial
    
    const rightWall = BABYLON.MeshBuilder.CreateBox(
      'rightWall',
      { width: wallThickness, height: wallHeight, depth: arenaSize },
      this.scene
    )
    rightWall.position.x = arenaSize / 2
    rightWall.material = wallMaterial
    
    // Top wall
    const topWall = BABYLON.MeshBuilder.CreateBox(
      'topWall',
      { width: arenaSize, height: wallHeight, depth: wallThickness },
      this.scene
    )
    topWall.position.z = -arenaSize / 2
    topWall.material = wallMaterial
  }

  private addEventListeners() {
    // Game control buttons
    const startBtn = document.getElementById('start-breakout-btn')
    const pauseBtn = document.getElementById('pause-breakout-btn')
    const resumeBtn = document.getElementById('resume-breakout-btn')
    const resetBtn = document.getElementById('reset-breakout-btn')
    const playAgainBtn = document.getElementById('play-again-breakout-btn')
    
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame())
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseGame())
    }
    
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.resumeGame())
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetGame())
    }
    
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.hideGameOver()
        this.resetGame()
        this.startGame()
      })
    }
    
    // Keyboard controls
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.game || !this.isRunning) return
    
    switch (event.key) {
      case 'ArrowLeft':
        this.game.movePaddleLeft()
        break
      case 'ArrowRight':
        this.game.movePaddleRight()
        break
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (!this.game || !this.isRunning) return
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.game.stopPaddle()
        break
    }
  }

  private startGame() {
    if (!this.game) return
    
    this.isRunning = true
    this.game.start()
    
    // Update UI
    document.getElementById('start-breakout-btn')?.classList.add('hidden')
    document.getElementById('pause-breakout-btn')?.classList.remove('hidden')
  }

  private pauseGame() {
    if (!this.game) return
    
    this.isRunning = false
    this.game.pause()
    
    // Update UI
    document.getElementById('pause-breakout-btn')?.classList.add('hidden')
    document.getElementById('resume-breakout-btn')?.classList.remove('hidden')
  }

  private resumeGame() {
    if (!this.game) return
    
    this.isRunning = true
    this.game.resume()
    
    // Update UI
    document.getElementById('resume-breakout-btn')?.classList.add('hidden')
    document.getElementById('pause-breakout-btn')?.classList.remove('hidden')
  }

  private resetGame() {
    if (!this.game) return
    
    this.isRunning = false
    this.game.reset()
    
    // Update UI
    document.getElementById('start-breakout-btn')?.classList.remove('hidden')
    document.getElementById('pause-breakout-btn')?.classList.add('hidden')
    document.getElementById('resume-breakout-btn')?.classList.add('hidden')
    
    // Reset scores
    const scoreElement = document.getElementById('breakout-score')
    const levelElement = document.getElementById('breakout-level')
    const livesElement = document.getElementById('breakout-lives')
    
    if (scoreElement) scoreElement.textContent = '0'
    if (levelElement) levelElement.textContent = '1'
    if (livesElement) livesElement.textContent = '3'
  }

  private updateScore(score: number, level: number, lives: number) {
    const scoreElement = document.getElementById('breakout-score')
    const levelElement = document.getElementById('breakout-level')
    const livesElement = document.getElementById('breakout-lives')
    
    if (scoreElement) scoreElement.textContent = score.toString()
    if (levelElement) levelElement.textContent = level.toString()
    if (livesElement) livesElement.textContent = lives.toString()
    
    // Check for game over
    if (lives <= 0) {
      this.showGameOver(score, level)
      this.isRunning = false
    }
  }

  private showGameOver(score: number, level: number) {
    const gameOverScreen = document.getElementById('breakout-game-over')
    const finalScoreElement = document.getElementById('breakout-final-score')
    const finalLevelElement = document.getElementById('breakout-final-level')
    
    if (gameOverScreen) gameOverScreen.classList.remove('hidden')
    if (finalScoreElement) finalScoreElement.textContent = score.toString()
    if (finalLevelElement) finalLevelElement.textContent = level.toString()
    
    // Update UI
    document.getElementById('pause-breakout-btn')?.classList.add('hidden')
    document.getElementById('resume-breakout-btn')?.classList.add('hidden')
  }

  private hideGameOver() {
    const gameOverScreen = document.getElementById('breakout-game-over')
    if (gameOverScreen) gameOverScreen.classList.add('hidden')
  }

  private handleResize() {
    if (this.engine) {
      this.engine.resize()
    }
  }

  public dispose() {
    if (this.game) {
      this.game.dispose()
    }
    
    if (this.scene) {
      this.scene.dispose()
    }
    
    if (this.engine) {
      this.engine.dispose()
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this))
  }
}

