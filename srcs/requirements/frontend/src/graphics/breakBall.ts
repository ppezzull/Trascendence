import * as BABYLON from '@babylonjs/core'
import { Paddle } from './breakPaddle'
import { Brick } from './BreakoutGame'

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

  // Rimetti la palla alla posizione iniziale
  this.mesh.position = this.initialPosition.clone()

  // Imposta una velocità iniziale verso il basso
  const speed = 9.0
  this.velocity = new BABYLON.Vector3(0, 0, +speed)
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

  const pos = this.mesh.position

  const limitX = 10   // distanza dai lati
  const limitZ = 10  // profondità (davanti/dietro)

  // Rimbalzo sui lati
  if (pos.x > limitX || pos.x < -limitX) {
    this.velocity.x *= -1
  }

  // Rimbalzo sulla parete frontale (vicino ai mattoni)
  if (pos.z < -limitZ) {
    this.velocity.z *= -1
  }
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

  public checkBrickCollision(brick: Brick): boolean {
    if (!this.mesh || brick.isDestroyed) return false
    
    const ballPosition = this.mesh.position
    const brickPosition = brick.mesh.position
    
    // Get brick dimensions (assuming standard brick size)
    const brickWidth = 1.8
    const brickHeight = 0.8
    const brickDepth = 0.5
    const ballRadius = 0.25
    
    // Check if ball is within brick bounds
    const xOverlap = Math.abs(ballPosition.x - brickPosition.x) < (ballRadius + brickWidth / 2)
    const yOverlap = Math.abs(ballPosition.y - brickPosition.y) < (ballRadius + brickHeight / 2)
    const zOverlap = Math.abs(ballPosition.z - brickPosition.z) < (ballRadius + brickDepth / 2)
    
    if (xOverlap && yOverlap && zOverlap) {
      // Calculate bounce direction based on which face of the brick was hit
      const dx = ballPosition.x - brickPosition.x
      const dy = ballPosition.y - brickPosition.y
      const dz = ballPosition.z - brickPosition.z
      
      // Determine which face was hit based on the largest overlap
      const xOverlapAmount = (ballRadius + brickWidth / 2) - Math.abs(dx)
      const yOverlapAmount = (ballRadius + brickHeight / 2) - Math.abs(dy)
      const zOverlapAmount = (ballRadius + brickDepth / 2) - Math.abs(dz)
      
      // Bounce off the face with the smallest overlap
      if (xOverlapAmount < yOverlapAmount && xOverlapAmount < zOverlapAmount) {
        this.velocity.x *= -1
      } else if (yOverlapAmount < xOverlapAmount && yOverlapAmount < zOverlapAmount) {
        this.velocity.y *= -1
      } else {
        this.velocity.z *= -1
      }
      
      return true
    }
    
    return false
  }

public handlePaddleHit(paddle: Paddle): void {
  if (!this.mesh) return

  const paddlePosition = paddle.getPosition()
  const ballPosition = this.mesh.position
  const {width } = paddle.getDimensions() // width: dimensione su X

  // Punto di impatto → ora misuriamo la differenza lungo X (lato sinistra/destra)
  const relativeX = paddlePosition.x - ballPosition.x
  const normalizedImpact = BABYLON.Scalar.Clamp(relativeX / (width / 2), -1, 1)

  // Angolo massimo del rimbalzo (45°)
  const maxBounceAngle = Math.PI / 4
  const bounceAngle = normalizedImpact * maxBounceAngle

  // Recupera velocità X del paddle (usata per boost + spin)
  const paddleVelocityX = paddle.getCurrentVelocityX ? paddle.getCurrentVelocityX() : 0

  // ---- BASE SPEED + BOOST DINAMICO ----
  const baseSpeed = 9
  const edgeSpeedBoost = 1 + Math.abs(normalizedImpact) * 0.2

  // Attenuazione boost in base al verso della velocità del paddle
  const boostSign = Math.sign(paddleVelocityX)
  const absVel = Math.abs(paddleVelocityX)

  const paddleSpeedFactor =
    boostSign > 0
      ? 1 + absVel * 2.5 // se il paddle si muove "contro" l'impatto (verso +X), più spinta
      : 1 + absVel * 0.5 // se si muove "via" (verso -X), effetto più debole

  const finalSpeed = baseSpeed * edgeSpeedBoost * paddleSpeedFactor

  // ---- Effetto SPIN (influenzare la deviazione X) ----
  // Limitiamo l'influenza dello spin
  const spinInfluence = BABYLON.Scalar.Clamp(paddleVelocityX * 0.25, -1.5, 1.5)

  // ---- Calcolo direzioni: principale su -Z, deviazione su X ----
  // Z: componente principale (verso -Z)
  // Usiamo cos(bounceAngle) per la componente principale, in modo che angoli maggiori riducano la componente forward
  this.velocity.z = -finalSpeed * Math.cos(bounceAngle)

  // X: deviazione laterale dovuta al punto d'impatto + spin
  // sin(bounceAngle) dà la parte laterale; sommiamo lo spin per spostare la palla
  this.velocity.x = finalSpeed * Math.sin(bounceAngle) + spinInfluence

  // (Se hai una componente Y verticale, impostala qui; altrimenti lascia invariata)
  // this.velocity.y = ...

  // Feedback visivo
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

	return this.mesh.position.z > +10
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

  public increaseSpeed(): void {
    // Increase ball speed by 10% for each level
    const speedIncrease = 1.1
    this.velocity = this.velocity.scale(speedIncrease)
  }

  public dispose(): void {
	if (this.mesh) {
	  this.mesh.dispose()
	  this.mesh = null
	}
	
	this.scene = null
  }
}
