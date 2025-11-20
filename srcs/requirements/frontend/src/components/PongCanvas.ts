import * as BABYLON from '@babylonjs/core'
import { PongGame } from '../graphics/PongGame.js'

export class PongCanvas {
  private canvas: HTMLCanvasElement | null = null
  private engine: BABYLON.Engine | null = null
  private scene: BABYLON.Scene | null = null
  private game: PongGame | null = null
  private isRunning = false

  constructor() {
    this.game = new PongGame()
  }

  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="relative w-full h-full">
        <canvas id="pong-canvas" class="w-full h-full rounded border border-cyber-green"></canvas>
        
        <!-- Game HUD -->
        <div id="game-hud" class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none">
          <div class="cyber-panel px-3 py-1">
            <span class="text-cyber-green font-mono">PLAYER 1: <span id="player1-score">0</span></span>
          </div>
          <div class="cyber-panel px-3 py-1">
            <span class="text-cyber-green font-mono">PLAYER 2: <span id="player2-score">0</span></span>
          </div>
        </div>
        
        <!-- Game Controls -->
        <div id="game-controls" class="absolute bottom-0 left-0 right-0 p-4 flex justify-center space-x-4">
          <button id="start-game-btn" class="cyber-button">Inizia Partita</button>
          <button id="pause-game-btn" class="cyber-button hidden">Pausa</button>
          <button id="resume-game-btn" class="cyber-button hidden">Riprendi</button>
          <button id="reset-game-btn" class="cyber-button">Reset</button>
        </div>
        
        <!-- Game Over Screen -->
        <div id="game-over" class="absolute inset-0 bg-cyber-black/80 flex items-center justify-center hidden">
          <div class="cyber-panel p-8 text-center">
            <h2 class="cyber-title text-2xl mb-4">PARTITA TERMINATA</h2>
            <p class="terminal-text mb-6">Vincitore: <span id="winner-text" class="text-cyber-cyan font-bold"></span></p>
            <button id="play-again-btn" class="cyber-button">Gioca Ancora</button>
          </div>
        </div>
      </div>
    `
    
    // Initialize canvas and game
    this.initializeCanvas()
    this.addEventListeners()
  }

  private initializeCanvas() {
    this.canvas = document.getElementById('pong-canvas') as HTMLCanvasElement
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
      this.game.setScoreCallback(this.updateScore.bind(this))
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
      Math.PI / 4, // Beta
      25, // Radius
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
      new BABYLON.Vector3(0, 5, 0),
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
    const arenaWidth = 20
    const arenaLength = 20
    
    // Side walls
    const leftWall = BABYLON.MeshBuilder.CreateBox(
      'leftWall',
      { width: wallThickness, height: wallHeight, depth: arenaLength },
      this.scene
    )
    leftWall.position.x = -arenaWidth / 2
    leftWall.material = wallMaterial
    
    const rightWall = BABYLON.MeshBuilder.CreateBox(
      'rightWall',
      { width: wallThickness, height: wallHeight, depth: arenaLength },
      this.scene
    )
    rightWall.position.x = arenaWidth / 2
    rightWall.material = wallMaterial
    
    // Top and bottom walls
    const topWall = BABYLON.MeshBuilder.CreateBox(
      'topWall',
      { width: arenaWidth, height: wallHeight, depth: wallThickness },
      this.scene
    )
    topWall.position.z = -arenaLength / 2
    topWall.material = wallMaterial
    
    const bottomWall = BABYLON.MeshBuilder.CreateBox(
      'bottomWall',
      { width: arenaWidth, height: wallHeight, depth: wallThickness },
      this.scene
    )
    bottomWall.position.z = arenaLength / 2
    bottomWall.material = wallMaterial
  }

  private addEventListeners() {
    // Game control buttons
    const startBtn = document.getElementById('start-game-btn')
    const pauseBtn = document.getElementById('pause-game-btn')
    const resumeBtn = document.getElementById('resume-game-btn')
    const resetBtn = document.getElementById('reset-game-btn')
    const playAgainBtn = document.getElementById('play-again-btn')
    
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
      case 'w':
      case 'W':
        this.game.movePlayer2Paddle('up')
        break
      case 's':
      case 'S':
        this.game.movePlayer2Paddle('down')
        break
      case 'ArrowUp':
        this.game.movePlayer1Paddle('up')
        break
      case 'ArrowDown':
        this.game.movePlayer1Paddle('down')
        break
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (!this.game || !this.isRunning) return
    
    switch (event.key) {
      case 'w':
      case 'W':
      case 's':
      case 'S':
        this.game.stopPlayer2Paddle()
        break
      case 'ArrowUp':
      case 'ArrowDown':
        this.game.stopPlayer1Paddle()
        break
    }
  }

  private startGame() {
    if (!this.game) return
    
    this.isRunning = true
    this.game.start()
    
    // Update UI
    document.getElementById('start-game-btn')?.classList.add('hidden')
    document.getElementById('pause-game-btn')?.classList.remove('hidden')
  }

  private pauseGame() {
    if (!this.game) return
    
    this.isRunning = false
    this.game.pause()
    
    // Update UI
    document.getElementById('pause-game-btn')?.classList.add('hidden')
    document.getElementById('resume-game-btn')?.classList.remove('hidden')
  }

  private resumeGame() {
    if (!this.game) return
    
    this.isRunning = true
    this.game.resume()
    
    // Update UI
    document.getElementById('resume-game-btn')?.classList.add('hidden')
    document.getElementById('pause-game-btn')?.classList.remove('hidden')
  }

  private resetGame() {
    if (!this.game) return
    
    this.isRunning = false
    this.game.reset()
    
    // Update UI
    document.getElementById('start-game-btn')?.classList.remove('hidden')
    document.getElementById('pause-game-btn')?.classList.add('hidden')
    document.getElementById('resume-game-btn')?.classList.add('hidden')
    
    // Reset scores
    const player1Score = document.getElementById('player1-score')
    const player2Score = document.getElementById('player2-score')
    
    if (player1Score) player1Score.textContent = '0'
    if (player2Score) player2Score.textContent = '0'
  }

  private showGameOver(winner: string) {
    const gameOverScreen = document.getElementById('game-over')
    const winnerText = document.getElementById('winner-text')
    
    if (gameOverScreen) gameOverScreen.classList.remove('hidden')
    if (winnerText) winnerText.textContent = winner
    
    // Update UI
    document.getElementById('pause-game-btn')?.classList.add('hidden')
    document.getElementById('resume-game-btn')?.classList.add('hidden')
  }

  private hideGameOver() {
    const gameOverScreen = document.getElementById('game-over')
    if (gameOverScreen) gameOverScreen.classList.add('hidden')
  }

  private handleResize() {
    if (this.engine) {
      this.engine.resize()
    }
  }

  public updateScore(player1Score: number, player2Score: number) {
    const player1ScoreElement = document.getElementById('player1-score')
    const player2ScoreElement = document.getElementById('player2-score')
    
    if (player1ScoreElement) player1ScoreElement.textContent = player1Score.toString()
    if (player2ScoreElement) player2ScoreElement.textContent = player2Score.toString()
    
    // Check for game over
    if (player1Score >= 5 || player2Score >= 5) {
      const winner = player1Score >= 5 ? 'PLAYER 1' : 'PLAYER 2'
      this.showGameOver(winner)
      this.isRunning = false
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
