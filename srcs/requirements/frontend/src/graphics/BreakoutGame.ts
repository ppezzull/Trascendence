import * as BABYLON from '@babylonjs/core'
import { Paddle } from './breakPaddle'
import { Ball } from './breakBall'

export interface Brick {
  mesh: BABYLON.Mesh
  position: BABYLON.Vector3
  isDestroyed: boolean
  hits: number
  color: string
}

export interface PowerUp {
  mesh: BABYLON.Mesh
  position: BABYLON.Vector3
  type: 'expand-paddle' | 'multi-ball' | 'slow-ball'
  isActive: boolean
}

export class BreakoutGame {
  private scene: BABYLON.Scene | null = null
  private engine: BABYLON.Engine | null = null
  private paddle: Paddle | null = null
  private secondPaddle: Paddle | null = null
  private ball: Ball | null = null
  private bricks: Brick[] = []
  private powerUps: PowerUp[] = []
  private isRunning = false
  private isPaused = false
  private score = 0
  private level = 1
  private lives = 3
  private secondPlayerLives = 3
  private gameLoop: number | null = null
  private scoreCallback: ((score: number, level: number, lives: number) => void) | null = null
  private gameMode: 'solo' | 'pvp' | 'pve' = 'solo'
  private botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
  private botUpdateCounter = 0
  private botReactionTime = 10 // Frames between bot decisions (lower = faster reaction)
  private currentPlayer = 1 // For PvP mode, tracks which player is active

  constructor() {
    // Initialize game objects
  }

  public initialize(scene: BABYLON.Scene, engine: BABYLON.Engine): void {
    this.scene = scene
    this.engine = engine
    
    // Create game objects
    this.createGameObjects()
    
    // Reset game state
    this.reset()
  }

  public setGameMode(mode: 'solo' | 'pvp' | 'pve', difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    this.gameMode = mode
    this.botDifficulty = difficulty
    
    // Set bot reaction time based on difficulty
    switch (difficulty) {
      case 'easy':
        this.botReactionTime = 20 // Slower reaction
        break
      case 'medium':
        this.botReactionTime = 10 // Medium reaction
        break
      case 'hard':
        this.botReactionTime = 5 // Fast reaction
        break
    }
    
    // Show/hide second paddle based on game mode
    if (this.secondPaddle) {
      this.secondPaddle.getMesh().setEnabled(mode === 'pvp')
    }
  }

  private createGameObjects(): void {
    if (!this.scene) return
    
    // Create paddle
    this.paddle = new Paddle('breakoutPaddle', this.scene)
    this.paddle.setPosition(0, 0, +9)
    
    // Create second paddle for PvP mode
    this.secondPaddle = new Paddle('breakoutSecondPaddle', this.scene)
    this.secondPaddle.setPosition(0, 0, +9)
    this.secondPaddle.getMesh().setEnabled(false) // Hidden by default
    
    // Create ball
    this.ball = new Ball('breakoutBall', this.scene)
    this.ball.reset()
    
    // Create bricks
    this.createBricks()
    
    // Create power-ups
    this.createPowerUps()
  }

  private createBricks(): void {
    if (!this.scene) return
    
    // Clear existing bricks
    this.bricks.forEach(brick => {
      if (brick.mesh) {
        brick.mesh.dispose()
      }
    })
    this.bricks = []
    
    // Brick configuration
    const rows = 5
    const cols = 10
    const brickWidth = 1.8
    const brickHeight = 0.8
    const brickDepth = 0.5
    const padding = 0.1
    const zOffset = -5
    
    // Create materials for different brick colors
    const colors = [
      new BABYLON.Color3(1, 0, 0),    // Red
      new BABYLON.Color3(0, 1, 0),    // Green
      new BABYLON.Color3(0, 0, 1),    // Blue
      new BABYLON.Color3(1, 0.5, 0),  // Yellow
      new BABYLON.Color3(0.8, 0.2, 0),  // Purple
      new BABYLON.Color3(0.5, 0, 0.5),  // Cyan
    ]
    
    // Create bricks
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col - cols / 2) * (brickWidth + padding) + brickWidth / 2
        const z = (row - rows / 2) * (brickHeight + padding) + brickHeight / 2 + zOffset
        const y = 0
        
        // Create brick mesh
        const brick = BABYLON.MeshBuilder.CreateBox(
          `brick_${row}_${col}`,
          { width: brickWidth, height: brickHeight, depth: brickDepth },
          this.scene
        )
        
        // Set position
        brick.position = new BABYLON.Vector3(x, y, z)
        
        // Create material
        const colorIndex = Math.floor(Math.random() * colors.length)
        const material = new BABYLON.StandardMaterial(`brickMaterial_${colorIndex}`, this.scene)
        material.diffuseColor = colors[colorIndex]
        material.specularColor = new BABYLON.Color3(0, 0.5, 0)
        material.emissiveColor = colors[colorIndex].scale(0.5)
        
        brick.material = material
        
        // Add glow effect
        const glowSphere = BABYLON.MeshBuilder.CreateSphere(
          `brickGlow_${row}_${col}`,
          { diameter: brickWidth * 1.2, segments: 8 },
          this.scene
        )
        
        const glowMaterial = new BABYLON.StandardMaterial(`brickGlowMaterial_${colorIndex}`, this.scene)
        glowMaterial.diffuseColor = colors[colorIndex]
        glowMaterial.emissiveColor = colors[colorIndex].scale(0.3)
        glowMaterial.alpha = 0.3
        
        glowSphere.material = glowMaterial
        glowSphere.parent = brick
        
        // Store brick data
        this.bricks.push({
          mesh: brick,
          position: new BABYLON.Vector3(x, y, z),
          isDestroyed: false,
          hits: 0,
          color: `color_${colorIndex}`
        })
      }
    }
  }

  private createPowerUps(): void {
    if (!this.scene) return
    
    // Clear existing power-ups
    this.powerUps.forEach(powerUp => {
      if (powerUp.mesh) {
        powerUp.mesh.dispose()
      }
    })
    this.powerUps = []
  }

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.isPaused = false
    this.botUpdateCounter = 0
    
    // Start game loop
    this.gameLoop = requestAnimationFrame(() => this.update())
  }

  public pause(): void {
    this.isPaused = true
    
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop)
      this.gameLoop = null
    }
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return
    
    this.isPaused = false
    
    // Resume game loop
    this.gameLoop = requestAnimationFrame(() => this.update())
  }

  public reset(): void {
    this.isRunning = false
    this.isPaused = false
    this.score = 0
    this.level = 1
    this.lives = 3
    this.secondPlayerLives = 3
    this.currentPlayer = 1
    this.botUpdateCounter = 0
    
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop)
      this.gameLoop = null
    }
    
    // Reset game objects
    this.paddle?.reset()
    this.secondPaddle?.reset()
    this.ball?.reset()
    
    // Recreate bricks
    this.createBricks()
    
    // Clear power-ups
    this.createPowerUps()
    
    // Update score display
    if (this.scoreCallback) {
      this.scoreCallback(this.score, this.level, this.lives)
    }
  }

  public movePaddleLeft(): void {
    if (this.paddle && (this.gameMode === 'solo' || this.gameMode === 'pve' || (this.gameMode === 'pvp' && this.currentPlayer === 1))) {
      this.paddle.startMoving('left')
    }
  }

  public movePaddleRight(): void {
    if (this.paddle && (this.gameMode === 'solo' || this.gameMode === 'pve' || (this.gameMode === 'pvp' && this.currentPlayer === 1))) {
      this.paddle.startMoving('right')
    }
  }

  public moveSecondPaddleLeft(): void {
    if (this.secondPaddle && this.gameMode === 'pvp' && this.currentPlayer === 2) {
      this.secondPaddle.startMoving('left')
    }
  }

  public moveSecondPaddleRight(): void {
    if (this.secondPaddle && this.gameMode === 'pvp' && this.currentPlayer === 2) {
      this.secondPaddle.startMoving('right')
    }
  }

  public stopPaddle(): void {
    if (this.paddle && (this.gameMode === 'solo' || this.gameMode === 'pve' || (this.gameMode === 'pvp' && this.currentPlayer === 1))) {
      this.paddle.stopMoving()
    }
  }

  public stopSecondPaddle(): void {
    if (this.secondPaddle && this.gameMode === 'pvp' && this.currentPlayer === 2) {
      this.secondPaddle.stopMoving()
    }
  }

  public setScoreCallback(callback: (score: number, level: number, lives: number) => void): void {
    this.scoreCallback = callback
  }

  private update(): void {
    if (!this.isRunning || this.isPaused) return
    
    // Update game objects
    this.paddle?.update()
    this.secondPaddle?.update()
    this.ball?.update()
    
    // Update bot if in PvE mode
    if (this.gameMode === 'pve') {
      this.updateBot()
    }
    
    // Check collisions
    this.checkCollisions()
    
    // Check for scoring
    this.checkScoring()
    
    // Continue game loop
    this.gameLoop = requestAnimationFrame(() => this.update())
  }

  private updateBot(): void {
    if (!this.paddle || !this.ball) return
    
    // Only update bot at certain intervals based on difficulty
    this.botUpdateCounter++
    if (this.botUpdateCounter < this.botReactionTime) return
    this.botUpdateCounter = 0
    
    // Get ball position
    const ballPosition = this.ball.getPosition()
    const paddlePosition = this.paddle.getPosition()
    
    // Calculate where ball will be when it reaches the paddle's z position
    let targetX = ballPosition.x
    
    // Add some randomness based on difficulty (less randomness = harder)
    let errorMargin = 0.5
    switch (this.botDifficulty) {
      case 'easy':
        errorMargin = 1.0 // More error
        break
      case 'medium':
        errorMargin = 0.5 // Medium error
        break
      case 'hard':
        errorMargin = 0.2 // Less error
        break
    }
    
    // Add random error to make the bot beatable
    targetX += (Math.random() - 0.5) * errorMargin * 2
    
    // Move paddle towards target position
    if (Math.abs(paddlePosition.x - targetX) > 0.5) {
      if (paddlePosition.x < targetX) {
        this.paddle.startMoving('right')
      } else {
        this.paddle.startMoving('left')
      }
    } else {
      this.paddle.stopMoving()
    }
    
    // Only react when ball is moving towards the paddle
    const ballVelocity = this.ball.getVelocity()
    if (ballVelocity.z < 0) {
      // Ball is moving away from paddle, stop moving
      this.paddle.stopMoving()
    }
  }

  private checkCollisions(): void {
    if (!this.ball || !this.paddle) return
    
    // Get active paddle based on game mode
    const activePaddle = this.gameMode === 'pvp' && this.currentPlayer === 2 ? this.secondPaddle : this.paddle
    
    if (!activePaddle) return
    
    // Check paddle collision
    if (this.ball.checkPaddleCollision(activePaddle)) {
      this.ball.handlePaddleHit(activePaddle)
    }
    
    // Check brick collisions
    this.checkBrickCollisions()
    
    // Check wall collisions
    this.ball.checkWallCollision()
  }

  private checkBrickCollisions(): void {
    if (!this.ball) return
    
    for (const brick of this.bricks) {
      if (brick.isDestroyed) continue
      
      if (this.ball.checkBrickCollision(brick)) {
        // Mark brick as destroyed
        brick.isDestroyed = true
        
        // Hide brick mesh
        if (brick.mesh) {
          brick.mesh.setEnabled(false)
        }
        
        // Increase score
        this.score += 10
        
        // Handle brick hit effects
        this.handleBrickHit(brick)
        
        // Check if all bricks are destroyed
        if (this.bricks.every(b => b.isDestroyed)) {
          this.nextLevel()
        }
        
        break // Only handle one collision per frame
      }
    }
  }

  private handleBrickHit(brick: Brick): void {
    // Create particle effect
    this.createBrickHitEffect(brick.position, brick.color)
    
    // Randomly spawn power-up
    if (Math.random() < 0.1) { // 10% chance
      this.spawnPowerUp(brick.position)
    }
  }

  private createBrickHitEffect(position: BABYLON.Vector3, color: string): void {
    if (!this.scene) return
    
    // Create a temporary particle system for hit effect
    const particleSystem = new BABYLON.ParticleSystem('brickHitEffect', 30, this.scene)
    
    particleSystem.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', this.scene)
    
    // Set color based on brick color
    let particleColor = new BABYLON.Color3(0, 1, 0.25) // Default cyber green
    switch (color) {
      case 'color_0': // Red
        particleColor = new BABYLON.Color3(1, 0, 0)
        break
      case 'color_1': // Green
        particleColor = new BABYLON.Color3(0, 1, 0)
        break
      case 'color_2': // Blue
        particleColor = new BABYLON.Color3(0, 0, 1)
        break
      case 'color_3': // Yellow
        particleColor = new BABYLON.Color3(1, 0.5, 0)
        break
      case 'color_4': // Purple
        particleColor = new BABYLON.Color3(0.8, 0.2, 0)
        break
      case 'color_5': // Cyan
        particleColor = new BABYLON.Color3(0.5, 0, 0.5)
        break
    }
    
    particleSystem.color1 = particleColor
    particleSystem.color2 = particleColor.scale(0.8)
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0)
    
    particleSystem.minSize = 0.05
    particleSystem.maxSize = 0.15
    
    particleSystem.minLifeTime = 0.2
    particleSystem.maxLifeTime = 0.5
    
    particleSystem.emitRate = 100
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD
    
    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0)
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1)
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1)
    
    particleSystem.minEmitPower = 0.5
    particleSystem.maxEmitPower = 1.5
    
    particleSystem.updateSpeed = 0.01
    
    particleSystem.emitter = position
    
    particleSystem.start()
    
    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop()
    }, 100)
  }

  private spawnPowerUp(position: BABYLON.Vector3): void {
    if (!this.scene) return
    
    // Randomly select power-up type
    const types: ('expand-paddle' | 'multi-ball' | 'slow-ball')[] = ['expand-paddle', 'multi-ball', 'slow-ball']
    const type = types[Math.floor(Math.random() * types.length)]
    
    // Create power-up mesh
    const powerUpMesh = BABYLON.MeshBuilder.CreateBox(
      `powerUp_${Date.now()}`,
      { width: 0.5, height: 0.5, depth: 0.5 },
      this.scene
    )
    
    powerUpMesh.position = position.clone()
    
    // Create material based on type
    const material = new BABYLON.StandardMaterial(`powerUpMaterial_${type}`, this.scene)
    
    switch (type) {
      case 'expand-paddle':
        material.diffuseColor = new BABYLON.Color3(0, 0.5, 1) // Blue
        break
      case 'multi-ball':
        material.diffuseColor = new BABYLON.Color3(1, 0.5, 0) // Orange
        break
      case 'slow-ball':
        material.diffuseColor = new BABYLON.Color3(0.5, 0, 1) // Purple
        break
    }
    
    material.emissiveColor = material.diffuseColor.scale(0.5)
    powerUpMesh.material = material
    
    // Add to power-ups array
    this.powerUps.push({
      mesh: powerUpMesh,
      position: position.clone(),
      type: type,
      isActive: true
    })
  }

  private checkScoring(): void {
    if (!this.ball) return
    
    // Check if ball is out of bounds (below paddle)
    if (this.ball.isOutOfBounds()) {
      // Lose a life
      if (this.gameMode === 'pvp') {
        if (this.currentPlayer === 1) {
          this.lives--
        } else {
          this.secondPlayerLives--
        }
      } else {
        this.lives--
      }
      
      // Update score display
      if (this.scoreCallback) {
        this.scoreCallback(this.score, this.level, this.lives)
      }
      
      // Check for game over
      if ((this.gameMode === 'pvp' && (this.lives <= 0 || this.secondPlayerLives <= 0)) ||
          (this.gameMode !== 'pvp' && this.lives <= 0)) {
        // Game over
        return
      }
      
      // In PvP mode, switch players
      if (this.gameMode === 'pvp') {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1
        
        // Show/hide paddles based on current player
        if (this.paddle && this.secondPaddle) {
          this.paddle.getMesh().setEnabled(this.currentPlayer === 1)
          this.secondPaddle.getMesh().setEnabled(this.currentPlayer === 2)
        }
      }
      
      // Reset ball
      this.ball.reset()
    }
  }

  private nextLevel(): void {
    this.level++
    
    // Increase ball speed
    this.ball?.increaseSpeed()
    
    // Recreate bricks
    this.createBricks()
    
    // Reset ball
    this.ball?.reset()
    
    // Update score display
    if (this.scoreCallback) {
      this.scoreCallback(this.score, this.level, this.lives)
    }
  }

  public dispose(): void {
    this.reset()
    
    // Dispose game objects
    this.paddle?.dispose()
    this.secondPaddle?.dispose()
    this.ball?.dispose()
    
    // Dispose bricks
    this.bricks.forEach(brick => {
      if (brick.mesh) {
        brick.mesh.dispose()
      }
    })
    
    // Dispose power-ups
    this.powerUps.forEach(powerUp => {
      if (powerUp.mesh) {
        powerUp.mesh.dispose()
      }
    })
    
    this.paddle = null
    this.secondPaddle = null
    this.ball = null
    this.bricks = []
    this.powerUps = []
    this.scene = null
    this.engine = null
  }
}
