import * as BABYLON from '@babylonjs/core'
import { Paddle } from './Paddle'
import { Ball } from './Ball'

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
  private ball: Ball | null = null
  private bricks: Brick[] = []
  private powerUps: PowerUp[] = []
  private isRunning = false
  private isPaused = false
  private score = 0
  private level = 1
  private lives = 3
  private gameLoop: number | null = null
  private scoreCallback: ((score: number, level: number, lives: number) => void) | null = null

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

  private createGameObjects(): void {
    if (!this.scene) return
    
    // Create paddle
    this.paddle = new Paddle('breakoutPaddle', this.scene)
    this.paddle.setPosition(0, 0, 0)
    
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
        const y = (row - rows / 2) * (brickHeight + padding) + brickHeight / 2
        const z = 0
        
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
    
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop)
      this.gameLoop = null
    }
    
    // Reset game objects
    this.resetBricks()
    this.resetBall()
    this.resetPaddle()
    this.resetPowerUps()
    
    // Update score display
    if (this.scoreCallback) {
      this.scoreCallback(this.score, this.level, this.lives)
    }
  }

  private resetBricks(): void {
    // Reset all bricks to not destroyed
    this.bricks.forEach(brick => {
      brick.isDestroyed = false
      brick.hits = 0
      
      // Make brick visible again
      if (brick.mesh) {
        brick.mesh.setEnabled(true)
      }
    })
  }

  private resetBall(): void {
    if (this.ball) {
      this.ball.reset()
    }
  }

  private resetPaddle(): void {
    if (this.paddle) {
      this.paddle.setPosition(0, 0, 0)
    }
  }

  private resetPowerUps(): void {
    // Clear all power-ups
    this.powerUps.forEach(powerUp => {
      powerUp.isActive = false
      
      if (powerUp.mesh) {
        powerUp.mesh.setEnabled(false)
      }
    })
  }

  public movePaddleLeft(): void {
    if (this.paddle) {
      this.paddle.startMoving('left')
    }
  }

  public movePaddleRight(): void {
    if (this.paddle) {
      this.paddle.startMoving('right')
    }
  }

  public stopPaddle(): void {
    if (this.paddle) {
      this.paddle.stopMoving()
    }
  }

  public setScoreCallback(callback: (score: number, level: number, lives: number) => void): void {
    this.scoreCallback = callback
  }

  private update(): void {
    if (!this.isRunning || this.isPaused) return
    
    // Update game objects
    this.paddle?.update()
    this.ball?.update()
    
    // Check collisions
    this.checkCollisions()
    
    // Check for game over
    this.checkGameOver()
    
    // Continue game loop
    this.gameLoop = requestAnimationFrame(() => this.update())
  }

  private checkCollisions(): void {
    if (!this.ball || !this.paddle) return
    
    // Check paddle collision
    if (this.ball.checkPaddleCollision(this.paddle)) {
      this.ball.handlePaddleHit(this.paddle)
    }
    
    // Check wall collisions
    this.ball.checkWallCollision()
    
    // Check brick collisions
    this.checkBrickCollisions()
    
    // Check power-up collisions
    this.checkPowerUpCollisions()
  }

  private checkBrickCollisions(): void {
    if (!this.ball) return
    
    const ballPosition = this.ball.getPosition()
    
    // Check collision with each brick
    this.bricks.forEach(brick => {
      if (brick.isDestroyed) return
      
      const brickPosition = brick.position
      const brickSize = 1.8 // Approximate brick size
      
      // Simple AABB collision detection
      if (
        ballPosition.x > brickPosition.x - brickSize / 2 &&
        ballPosition.x < brickPosition.x + brickSize / 2 &&
        ballPosition.y > brickPosition.y - brickSize / 2 &&
        ballPosition.y < brickPosition.y + brickSize / 2
      ) {
        // Brick hit!
        brick.hits++
        
        // Destroy brick after 3 hits
        if (brick.hits >= 3) {
          brick.isDestroyed = true
          brick.mesh.setEnabled(false)
          
          // Add score
          this.score += 10
          
          // Create explosion effect
          this.createBrickExplosion(brickPosition, brick.color)
          
          // Chance to spawn power-up
          if (Math.random() < 0.2) {
            this.spawnPowerUp(brickPosition)
          }
        }
      }
    })
  }

  private createBrickExplosion(position: BABYLON.Vector3, color: string): void {
    if (!this.scene) return
    
    // Create particle system for explosion
    const particleSystem = new BABYLON.ParticleSystem('explosion', 20, this.scene)
    
    particleSystem.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', this.scene)
    
    // Set particle colors based on brick color
    const colorMap: { [key: string]: BABYLON.Color4 } = {
      'color_0': new BABYLON.Color4(1, 0, 0, 1),
      'color_1': new BABYLON.Color4(0, 1, 0, 1),
      'color_2': new BABYLON.Color4(0, 0, 1, 1),
      'color_3': new BABYLON.Color4(0.5, 0.5, 1, 1),
      'color_4': new BABYLON.Color4(0.8, 0.2, 1, 1),
      'color_5': new BABYLON.Color4(0.5, 0, 0.5, 1),
    }
    
    particleSystem.color1 = colorMap[color] || new BABYLON.Color4(1, 1, 1, 1)
    particleSystem.color2 = colorMap[color] || new BABYLON.Color4(1, 1, 1, 1)
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0)
    
    particleSystem.minSize = 0.1
    particleSystem.maxSize = 0.5
    
    particleSystem.minLifeTime = 0.2
    particleSystem.maxLifeTime = 0.8
    
    particleSystem.emitRate = 50
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD
    
    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0)
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1)
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, -1)
    
    particleSystem.minEmitPower = 0.5
    particleSystem.maxEmitPower = 1.5
    
    particleSystem.updateSpeed = 0.05
    
    particleSystem.emitter = position
    
    particleSystem.start()
    
    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop()
    }, 500)
  }

  private spawnPowerUp(position: BABYLON.Vector3): void {
    if (!this.scene) return
    
    // Random power-up type
    const types: Array<'expand-paddle' | 'multi-ball' | 'slow-ball'> = ['expand-paddle', 'multi-ball', 'slow-ball']
    const type = types[Math.floor(Math.random() * types.length)]
    
    // Create power-up mesh
    const powerUp = BABYLON.MeshBuilder.CreateBox(
      `powerUp_${Date.now()}`,
      { width: 0.5, height: 0.5, depth: 0.5 },
      this.scene
    )
    
    // Set position
    powerUp.position = position.clone()
    powerUp.position.y += 0.5 // Float above bricks
    
    // Create material based on type
    let material: BABYLON.StandardMaterial
    
    switch (type) {
      case 'expand-paddle':
        material = new BABYLON.StandardMaterial('expandPaddleMaterial', this.scene)
        material.diffuseColor = new BABYLON.Color3(0, 0.8, 0.2)
        material.emissiveColor = new BABYLON.Color3(0, 0.8, 0.2)
        break
      case 'multi-ball':
        material = new BABYLON.StandardMaterial('multiBallMaterial', this.scene)
        material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.8)
        material.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.8)
        break
      case 'slow-ball':
        material = new BABYLON.StandardMaterial('slowBallMaterial', this.scene)
        material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8)
        material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.8)
        break
    }
    
    // Add glow effect
    material.specularPower = 32
    
    powerUp.material = material
    
    // Add rotation animation
    powerUp.rotation.y = 0
    powerUp.rotation.x = 0
    
    // Store power-up
    this.powerUps.push({
      mesh: powerUp,
      position: position.clone(),
      type,
      isActive: false
    })
  }

  private checkPowerUpCollisions(): void {
    if (!this.ball) return
    
    const ballPosition = this.ball.getPosition()
    
    // Check collision with each power-up
    this.powerUps.forEach(powerUp => {
      if (powerUp.isActive) return
      
      const powerUpPosition = powerUp.position
      const powerUpSize = 0.5
      
      // Simple AABB collision detection
      if (
        ballPosition.x > powerUpPosition.x - powerUpSize / 2 &&
        ballPosition.x < powerUpPosition.x + powerUpSize / 2 &&
        ballPosition.y > powerUpPosition.y - powerUpSize / 2 &&
        ballPosition.y < powerUpPosition.y + powerUpSize / 2
      ) {
        // Power-up collected!
        powerUp.isActive = true
        if (powerUp.mesh) {
          powerUp.mesh.setEnabled(false)
        }
        
        // Apply power-up effect
        this.applyPowerUp(powerUp.type)
        
        // Add score
        this.score += 50
        
        // Create collection effect
        this.createPowerUpCollectionEffect(powerUpPosition)
      }
    })
  }

  private applyPowerUp(type: 'expand-paddle' | 'multi-ball' | 'slow-ball'): void {
    switch (type) {
      case 'expand-paddle':
        if (this.paddle) {
          // Expand paddle width
          // This would modify the paddle mesh
          console.log('Expanding paddle!')
        }
        break
      case 'multi-ball':
        // This would add additional balls
        console.log('Multi-ball power-up!')
        break
      case 'slow-ball':
        if (this.ball) {
          // Slow down ball
          const currentVelocity = this.ball.getVelocity()
          this.ball.setVelocity(currentVelocity.scale(0.7))
          console.log('Slowing ball!')
        }
        break
    }
  }

  private createPowerUpCollectionEffect(position: BABYLON.Vector3): void {
    if (!this.scene) return
    
    // Create particle system for collection effect
    const particleSystem = new BABYLON.ParticleSystem('powerUpCollection', 10, this.scene)
    
    particleSystem.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', this.scene)
    
    particleSystem.color1 = new BABYLON.Color4(0, 1, 0, 1)
    particleSystem.color2 = new BABYLON.Color4(1, 1, 0, 1)
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0)
    
    particleSystem.minSize = 0.1
    particleSystem.maxSize = 0.3
    
    particleSystem.minLifeTime = 0.2
    particleSystem.maxLifeTime = 0.5
    
    particleSystem.emitRate = 30
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD
    
    particleSystem.gravity = new BABYLON.Vector3(0, -0.2, 0)
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1)
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, -1)
    
    particleSystem.minEmitPower = 0.5
    particleSystem.maxEmitPower = 1
    
    particleSystem.updateSpeed = 0.05
    
    particleSystem.emitter = position
    
    particleSystem.start()
    
    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop()
    }, 300)
  }

  private checkGameOver(): void {
    // Check if all bricks are destroyed
    const allBricksDestroyed = this.bricks.every(brick => brick.isDestroyed)
    
    if (allBricksDestroyed) {
      // Level complete
      this.level++
      this.resetBricks()
      this.ball.reset()
      
      // Add bonus score for completing level
      this.score += 100 * this.level
      
      // Show level complete message
      this.showNotification(`Livello ${this.level} completato!`, 'success')
    } else if (this.ball && this.ball.isOutOfBounds()) {
      // Lost a life
      this.lives--
      
      if (this.lives <= 0) {
        // Game over
        this.isRunning = false
        
        if (this.scoreCallback) {
          this.scoreCallback(this.score, this.level, this.lives)
        }
        
        this.showNotification(`Game Over! Punteggio finale: ${this.score}`, 'error')
      } else {
        // Reset ball position
        this.ball.reset()
        this.paddle?.setPosition(0, 0, 0)
        
        // Update score display
        if (this.scoreCallback) {
          this.scoreCallback(this.score, this.level, this.lives)
        }
      }
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
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

  public dispose(): void {
    this.reset()
    
    // Dispose game objects
    this.paddle?.dispose()
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
    this.ball = null
    this.bricks = []
    this.powerUps = []
    this.scene = null
    this.engine = null
  }
}
