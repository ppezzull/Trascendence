import * as BABYLON from '@babylonjs/core'
import { Paddle } from './Paddle'
import { Ball } from './Ball'

export class PongGame {
  private scene: BABYLON.Scene | null = null
  private engine: BABYLON.Engine | null = null
  private paddle1: Paddle | null = null
  private paddle2: Paddle | null = null
  private ball: Ball | null = null
  private isRunning = false
  private isPaused = false
  private player1Score = 0
  private player2Score = 0
  private gameLoop: number | null = null
  private scoreCallback: ((player1Score: number, player2Score: number) => void) | null = null

  constructor() {
    // Initialize game objects
  }

  public initialize(scene: BABYLON.Scene, engine: BABYLON.Engine): void {
    this.scene = scene
    this.engine = engine
    
    // Create game objects
    this.createGameObjects()
  }

  private createGameObjects(): void {
    if (!this.scene) return
    
    // Create paddles
    this.paddle1 = new Paddle('paddle1', this.scene)
    this.paddle1.setPosition(-8, 0, 0)
    
    this.paddle2 = new Paddle('paddle2', this.scene)
    this.paddle2.setPosition(8, 0, 0)
    
    // Create ball
    this.ball = new Ball('ball', this.scene)
    this.ball.reset()
  }

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.isPaused = false
    
    // Reset ball position
    this.ball?.reset()
    
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
    this.player1Score = 0
    this.player2Score = 0
    
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop)
      this.gameLoop = null
    }
    
    // Reset game objects
    this.paddle1?.reset()
    this.paddle2?.reset()
    this.ball?.reset()
    
    // Update score display
    if (this.scoreCallback) {
      this.scoreCallback(this.player1Score, this.player2Score)
    }
  }

  public movePlayer1Paddle(direction: 'up' | 'down'): void {
    if (this.paddle1) {
      this.paddle1.startMoving(direction)
    }
  }

  public stopPlayer1Paddle(): void {
    if (this.paddle1) {
      this.paddle1.stopMoving()
    }
  }

  public movePlayer2Paddle(direction: 'up' | 'down'): void {
    if (this.paddle2) {
      this.paddle2.startMoving(direction)
    }
  }

  public stopPlayer2Paddle(): void {
    if (this.paddle2) {
      this.paddle2.stopMoving()
    }
  }

  public setScoreCallback(callback: (player1Score: number, player2Score: number) => void): void {
    this.scoreCallback = callback
  }

  private update(): void {
    if (!this.isRunning || this.isPaused) return
    
    // Update game objects
    this.paddle1?.update()
    this.paddle2?.update()
    this.ball?.update()
    
    // Check collisions
    this.checkCollisions()
    
    // Check for scoring
    this.checkScoring()
    
    // Continue game loop
    this.gameLoop = requestAnimationFrame(() => this.update())
  }

  private checkCollisions(): void {
    if (!this.ball || !this.paddle1 || !this.paddle2) return
    
    // Check paddle collisions
    if (this.ball.checkPaddleCollision(this.paddle1)) {
      this.ball.handlePaddleHit(this.paddle1)
    }
    
    if (this.ball.checkPaddleCollision(this.paddle2)) {
      this.ball.handlePaddleHit(this.paddle2)
    }
    
    // Check wall collisions
    this.ball.checkWallCollision()
  }

  private checkScoring(): void {
    if (!this.ball) return
    
    // Check if ball is out of bounds
    if (this.ball.isOutOfBounds()) {
      // Determine which player scored
      if (this.ball.getPosition().x < 0) {
        // Player 2 scored
        this.player2Score++
      } else {
        // Player 1 scored
        this.player1Score++
      }
      
      // Update score display
      if (this.scoreCallback) {
        this.scoreCallback(this.player1Score, this.player2Score)
      }
      
      // Reset ball
      this.ball.reset()
    }
  }

  public dispose(): void {
    this.reset()
    
    // Dispose game objects
    this.paddle1?.dispose()
    this.paddle2?.dispose()
    this.ball?.dispose()
    
    this.paddle1 = null
    this.paddle2 = null
    this.ball = null
    this.scene = null
    this.engine = null
  }
}

