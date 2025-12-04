import * as BABYLON from "@babylonjs/core";
import { Paddle } from "./Paddle";

export class Ball {
  private lastPosition = new BABYLON.Vector3(0, 0, 0);
  private mesh: BABYLON.Mesh | null = null;
  private scene: BABYLON.Scene | null = null;
  private velocity = new BABYLON.Vector3(1, 0, 1);
  private initialPosition = new BABYLON.Vector3(0, 0, 0);
  private bounds = {
    minX: -9,
    maxX: 9,
    minY: -4.5,
    maxY: 4.5,
    minZ: -10,
    maxZ: 10,
  };

  public setVelocity(velocity: BABYLON.Vector3): void {
    this.velocity = velocity.clone();
  }

  public setOptionsVelocity(velocity: string): void {
    if (velocity === "slow") {
      this.setVelocity(new BABYLON.Vector3(5, 0, 2));
    } else if (velocity === "normal") {
      this.setVelocity(new BABYLON.Vector3(9, 0, 4.5));
    } else if (velocity === "fast") {
      this.setVelocity(new BABYLON.Vector3(14, 0, 7));
    }
  }

  constructor(name: string, scene: BABYLON.Scene) {
    this.scene = scene;
    this.createMesh(name);

    const savedSpeed = localStorage.getItem("ballSpeed") as
      | "slow"
      | "normal"
      | "fast"
      | null;
    if (savedSpeed) {
      this.setOptionsVelocity(savedSpeed);
    }
  }

  private createMesh(name: string): void {
    if (!this.scene) return;

    // Create ball mesh
    this.mesh = BABYLON.MeshBuilder.CreateSphere(
      name,
      { diameter: 0.5, segments: 16 },
      this.scene
    );

    // Create cyber material with glow effect
    const material = new BABYLON.StandardMaterial(
      `${name}Material`,
      this.scene
    );
    material.diffuseColor = new BABYLON.Color3(0, 1, 0.25); // Cyber green
    material.specularColor = new BABYLON.Color3(0, 1, 0.5);
    material.emissiveColor = new BABYLON.Color3(0, 0.3, 0.075);

    // Add glow effect
    material.specularPower = 64;

    this.mesh.material = material;

    // Add glow effect with particle system
    this.createGlowEffect();
  }

  private createGlowEffect(): void {
    if (!this.scene || !this.mesh) return;

    // Create a slightly larger, transparent sphere for glow effect
    const glowSphere = BABYLON.MeshBuilder.CreateSphere(
      `${this.mesh.name}Glow`,
      { diameter: 0.7, segments: 16 },
      this.scene
    );

    const glowMaterial = new BABYLON.StandardMaterial(
      `${this.mesh.name}GlowMaterial`,
      this.scene
    );
    glowMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 0.2);
    glowMaterial.specularColor = new BABYLON.Color3(0, 1, 0.5);
    glowMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0.125);
    glowMaterial.alpha = 0.3;

    glowSphere.material = glowMaterial;
    glowSphere.parent = this.mesh;
  }

  public reset(): void {
    if (!this.mesh) return;

    this.mesh.position = this.initialPosition.clone();

    // Velocity in units per second (esempio)
    const randomX = Math.random() > 0.5 ? 1 : -1;
    const randomZ = (Math.random() - 0.5) * 0.5;
    this.velocity = new BABYLON.Vector3(
      9.0 * randomX, // 9.0 units/second along X (tweak as you like)
      0,
      4.5 * randomZ // 4.5 units/second along Z (tweak)
    );
  }

  public update(deltaTimeMs?: number): void {
    if (!this.mesh) return;

    // Salva posizione precedente
    this.lastPosition.copyFrom(this.mesh.position);

    // Ottieni delta time in ms: usa quello passato o prendi da engine
    let deltaMs =
      deltaTimeMs ?? this.scene?.getEngine().getDeltaTime() ?? 16.6667;
    const dt = deltaMs / 1000; // secondi

    // SPOSTAMENTO in base al tempo: velocity è in units/second
    // Se vuoi sub-steps, gestiscili qui (utile per evitare tunneling)
    const maxStep = 0.04; // 40 ms per substep
    const steps = Math.max(1, Math.ceil(dt / maxStep));
    const stepDt = dt / steps;

    for (let i = 0; i < steps; i++) {
      const displacement = this.velocity.scale(stepDt); // units per substep
      this.mesh.position.addInPlace(displacement);
      // qui potresti controllare collisioni parziali se vuoi (opzionale)
    }

    // (opzionale) rotazione visuale solo se usi visual child
    // this.visual?.rotation.x += 0.05
    // this.visual?.rotation.y += 0.05
  }

  public checkWallCollision(): void {
    if (!this.mesh) return;

    const position = this.mesh.position;

    // Check top and bottom walls
    if (position.z <= this.bounds.minZ || position.z >= this.bounds.maxZ) {
      this.velocity.z = -this.velocity.z;
    }

    // Keep within bounds
    position.z = Math.max(
      this.bounds.minZ,
      Math.min(this.bounds.maxZ, position.z)
    );
  }

  public checkPaddleCollision(paddle: Paddle): boolean {
    if (!this.mesh) return false;

    const paddleMesh = paddle.getMesh();
    if (!paddleMesh) return false;

    const ballPosition = this.mesh.position;
    const paddlePosition = paddleMesh.position;

    // Simple AABB collision detection
    const { width, height, depth } = paddle.getDimensions();
    const ballRadius = 0.25;
    const paddleWidth = width;
    const paddleHeight = height;
    const paddleDepth = depth;

    // Check if ball is within paddle bounds
    const xOverlap =
      Math.abs(ballPosition.x - paddlePosition.x) <
      ballRadius + paddleWidth / 2;
    const yOverlap =
      Math.abs(ballPosition.y - paddlePosition.y) <
      ballRadius + paddleHeight / 2;
    const zOverlap =
      Math.abs(ballPosition.z - paddlePosition.z) <
      ballRadius + paddleDepth / 2;

    if (xOverlap && yOverlap && zOverlap) {
      return true;
    }

    return false;
  }

  public handlePaddleHit(paddle: Paddle): void {
    if (!this.mesh) return;

    const paddlePosition = paddle.getPosition();
    const ballPosition = this.mesh.position;
    const { depth } = paddle.getDimensions();

    // Differenza lungo Z → punto di impatto
    const relativeZ = paddlePosition.z - ballPosition.z;
    const normalizedImpact = BABYLON.Scalar.Clamp(
      relativeZ / (depth / 2),
      -1,
      1
    );

    // Angolo massimo del rimbalzo (45°)
    const maxBounceAngle = Math.PI / 4;
    const bounceAngle = -normalizedImpact * maxBounceAngle;

    // Direzione lungo X (sinistra/destra)
    const direction = paddlePosition.x < 0 ? 1 : -1;

    // Recupera velocità Z del paddle
    const paddleVelocityZ = paddle.getCurrentVelocityZ
      ? paddle.getCurrentVelocityZ()
      : 0;

    // ---- BASE SPEED + BOOST DINAMICO ----
    const baseSpeed = 9;
    const edgeSpeedBoost = 1 + Math.abs(normalizedImpact) * 0.2;

    // Qui attenuiamo il boost negativo (quando il paddle si muove "via" dalla palla)
    const boostSign = Math.sign(paddleVelocityZ);
    const absVel = Math.abs(paddleVelocityZ);

    const paddleSpeedFactor =
      boostSign > 0
        ? 1 + absVel * 2.5 // spinta più forte se il paddle si muove contro la palla
        : 1 + absVel * 0.8; // effetto molto più debole se si muove nella stessa direzione

    const finalSpeed = baseSpeed * edgeSpeedBoost * paddleSpeedFactor;

    // ---- Effetto SPIN ----
    const spinInfluence = BABYLON.Scalar.Clamp(
      paddleVelocityZ * 0.25,
      -1.5,
      1.5
    );

    // ---- Calcolo direzioni ----
    this.velocity.x = direction * finalSpeed * Math.cos(bounceAngle);
    this.velocity.z = finalSpeed * Math.sin(bounceAngle) - spinInfluence;

    // Feedback visivo
    this.createHitEffect();
  }

  private createHitEffect(): void {
    if (!this.scene || !this.mesh) return;

    // Create a temporary particle system for hit effect
    const particleSystem = new BABYLON.ParticleSystem(
      "hitEffect",
      50,
      this.scene
    );

    particleSystem.particleTexture = new BABYLON.Texture(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      this.scene
    );

    particleSystem.color1 = new BABYLON.Color4(0, 1, 0.25, 1);
    particleSystem.color2 = new BABYLON.Color4(0, 0.8, 0.2, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0.5, 0.1, 0);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;

    particleSystem.emitRate = 100;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);

    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1.5;

    particleSystem.updateSpeed = 0.01;

    particleSystem.emitter = this.mesh.position;

    particleSystem.start();

    // Stop after a short time
    setTimeout(() => {
      particleSystem.stop();
    }, 100);
  }

  public isOutOfBounds(): boolean {
    if (!this.mesh) return false;

    console.log(
      "Ball is out of bounds",
      this.mesh.position.x,
      this.bounds.minX,
      this.bounds.maxX
    );

    const position = this.mesh.position;
    return position.x < this.bounds.minX || position.x > this.bounds.maxX;
  }

  public getPosition(): BABYLON.Vector3 {
    if (this.mesh) {
      return this.mesh.position.clone();
    }
    return BABYLON.Vector3.Zero();
  }

  public getVelocity(): BABYLON.Vector3 {
    return this.velocity.clone();
  }

  public dispose(): void {
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }

    this.scene = null;
  }
}
