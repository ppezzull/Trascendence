import * as BABYLON from '@babylonjs/core'
import { Paddle } from './paddle'

export class Ball {
  
  private lastPosition = new BABYLON.Vector3(0, 0, 0)
  private mesh: BABYLON.Mesh | null = null
  private scene: BABYLON.Scene | null = null
  private velocity = new BABYLON.Vector3(1, 0, 1)
  private initialPosition = new BABYLON.Vector3(0, 0, 0)
  private bounds = {
    minX: -9,
    maxX: 9,
    minY: -4.5,
    maxY: 4.5,
    minZ: -14,
    maxZ: 14
  }

  constructor(name: string, scene: BABYLON.Scene) {
    this.scene = scene
    this.createMesh(name)
  }

  private createMesh(name: string): void {
    if (!this.scene) return
    
    // Create ball mesh
    this.mesh = BABYLON.MeshBuilder.CreateSphere(
      name,
      { diameter: 0.5, segments: 16 },
      this.scene
    )

    //testing collision
    this.mesh.setPivotPoint(BABYLON.Vector3.Zero())
    this.mesh.showBoundingBox = true
    
    // Create cyber material with glow effect
    const material = new BABYLON.StandardMaterial(`${name}Material`, this.scene)
    material.diffuseColor = new BABYLON.Color3(0, 1, 0.25) // Cyber green
    material.specularColor = new BABYLON.Color3(0, 1, 0.5)
    material.emissiveColor = new BABYLON.Color3(0, 0.3, 0.075)
    
    // Add glow effect
    material.specularPower = 64
    
    this.mesh.material = material
    
    // Add glow effect with particle system
    this.createGlowEffect()
  }

  private createGlowEffect(): void {
    if (!this.scene || !this.mesh) return
    
    // Create a slightly larger, transparent sphere for glow effect
    const glowSphere = BABYLON.MeshBuilder.CreateSphere(
      `${this.mesh.name}Glow`,
      { diameter: 0.7, segments: 16 },
      this.scene
    )
    
    const glowMaterial = new BABYLON.StandardMaterial(`${this.mesh.name}GlowMaterial`, this.scene)
    glowMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 0.2)
    glowMaterial.specularColor = new BABYLON.Color3(0, 1, 0.5)
    glowMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0.125)
    glowMaterial.alpha = 0.3
    
    glowSphere.material = glowMaterial
    glowSphere.parent = this.mesh
  }

  public reset(): void {
  if (!this.mesh) return

  this.mesh.position = this.initialPosition.clone()

  // Velocity in units per second (esempio)
  const randomX = Math.random() > 0.5 ? 1 : -1
  const randomZ = (Math.random() - 0.5) * 0.5
  this.velocity = new BABYLON.Vector3(
    9.0 * randomX,    // 9.0 units/second along X (tweak as you like)
    0,
    4.5 * randomZ     // 4.5 units/second along Z (tweak)
  )
}

  public update(deltaTimeMs?: number): void {
  if (!this.mesh) return

  // Salva posizione precedente
  this.lastPosition.copyFrom(this.mesh.position)

  // Ottieni delta time in ms: usa quello passato o prendi da engine
  let deltaMs = deltaTimeMs ?? (this.scene?.getEngine().getDeltaTime() ?? 16.6667)
  const dt = deltaMs / 1000 // secondi

  // SPOSTAMENTO in base al tempo: velocity è in units/second
  // Se vuoi sub-steps, gestiscili qui (utile per evitare tunneling)
  const maxStep = 0.04 // 40 ms per substep
  const steps = Math.max(1, Math.ceil(dt / maxStep))
  const stepDt = dt / steps

  for (let i = 0; i < steps; i++) {
    const displacement = this.velocity.scale(stepDt) // units per substep
    this.mesh.position.addInPlace(displacement)
    // qui potresti controllare collisioni parziali se vuoi (opzionale)
  }

  // (opzionale) rotazione visuale solo se usi visual child
  // this.visual?.rotation.x += 0.05
  // this.visual?.rotation.y += 0.05
}


  public checkWallCollision(): void {
    if (!this.mesh) return
    
    const position = this.mesh.position
    
    // Check top and bottom walls
    if (position.z <= this.bounds.minZ || position.z >= this.bounds.maxZ) {
      this.velocity.z = -this.velocity.z
    }
    
    // Keep within bounds
    position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, position.z))
  }

  public checkPaddleCollision(paddle: Paddle): boolean {
    if (!this.mesh) return false
    
    const paddleMesh = paddle.getMesh()
    if (!paddleMesh) return false
    
    const ballPosition = this.mesh.position
    const paddlePosition = paddleMesh.position
    
    // Simple AABB collision detection
    const { width, height, depth } = paddle.getDimensions()
    const ballRadius = 0.25
    const paddleWidth = width
    const paddleHeight = height
    const paddleDepth = depth
    
    // Check if ball is within paddle bounds
    const xOverlap = Math.abs(ballPosition.x - paddlePosition.x) < (ballRadius + paddleWidth / 2)
    const yOverlap = Math.abs(ballPosition.y - paddlePosition.y) < (ballRadius + paddleHeight / 2)
    const zOverlap = Math.abs(ballPosition.z - paddlePosition.z) < (ballRadius + paddleDepth / 2)
    
    if (xOverlap && yOverlap && zOverlap) {
      return true
    }
    
    return false
  }

  public handlePaddleHit(paddle: Paddle): void {
    if (!this.mesh) return
    
    const paddlePosition = paddle.getPosition()
    const ballPosition = this.mesh.position
    
    // Calculate new velocity based on where the ball hit the paddle
    const relativeIntersectZ = (paddlePosition.z - ballPosition.z) / 1 // Paddle height is 2
    const bounceAngle = relativeIntersectZ * Math.PI / 4 // Max 45 degree angle
    
    // Determine direction based on which paddle was hit
    const paddleMesh = paddle.getMesh()
  const ballRadius = 0.25
  const direction = paddlePosition.x < 0 ? 1 : -1
  this.mesh.position.x = paddleMesh.position.x + direction * (paddle.getDimensions().width / 2 + ballRadius + 0.01)
    
    // Set new velocity
    const speed = 9
    this.velocity.x = direction * speed * Math.cos(bounceAngle)
    this.velocity.z = speed * Math.sin(bounceAngle)
    
    // Add some visual feedback
    this.createHitEffect()
  }

  private createHitEffect(): void {
    if (!this.scene || !this.mesh) return
    
    // Create a temporary particle system for hit effect
    const particleSystem = new BABYLON.ParticleSystem('hitEffect', 50, this.scene)
    
    particleSystem.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', this.scene)
    
    particleSystem.color1 = new BABYLON.Color4(0, 1, 0.25, 1)
    particleSystem.color2 = new BABYLON.Color4(0, 0.8, 0.2, 1)
    particleSystem.colorDead = new BABYLON.Color4(0, 0.5, 0.1, 0)
    
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
    
    particleSystem.emitter = this.mesh.position
    
    particleSystem.start()
    
    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop()
    }, 100)
  }

  public isOutOfBounds(): boolean {
    if (!this.mesh) return false
    
    const position = this.mesh.position
    return position.x < this.bounds.minX || position.x > this.bounds.maxX
  }

  public getPosition(): BABYLON.Vector3 {
    if (this.mesh) {
      return this.mesh.position.clone()
    }
    return BABYLON.Vector3.Zero()
  }

  public getVelocity(): BABYLON.Vector3 {
    return this.velocity.clone()
  }

  public setVelocity(velocity: BABYLON.Vector3): void {
    this.velocity = velocity.clone()
  }

  public dispose(): void {
    if (this.mesh) {
      this.mesh.dispose()
      this.mesh = null
    }
    
    this.scene = null
  }
}
