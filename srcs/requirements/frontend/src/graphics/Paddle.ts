import * as BABYLON from '@babylonjs/core'

export class Paddle {
  private mesh: BABYLON.Mesh
  private scene: BABYLON.Scene
  private direction: 'up' | 'down' | null = null
  private speed = 0.1

  private lastZ = 0
  private velocityZ = 0

  // Dimensioni del paddle (devono corrispondere a quelle usate nella collisione)
  private width = 1   // lungo X → spessore
  private height = 1.5  // lungo Y → quasi nullo
  private depth = 4.0   // lungo Z → lunghezza visibile

  private controlMode: 'manual' | 'ai' = 'manual'
  private aiTargetZ: number = 0

  constructor(name: string, scene: BABYLON.Scene) {
    this.scene = scene
    this.mesh = BABYLON.MeshBuilder.CreateBox(
      name,
      { width: this.width, height: this.height, depth: this.depth },
      this.scene
    )
    
    const material = new BABYLON.StandardMaterial(`${name}Material`, this.scene)
    material.diffuseColor = new BABYLON.Color3(0.0, 0.8, 0.0)
    material.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.0)
    this.mesh.material = material

    const luce = new BABYLON.PointLight("luce", this.mesh.position, this.scene);
    luce.diffuse = new BABYLON.Color3(0.1, 0.4, 0.8); // Stesso colore
    luce.intensity = 1.5;

    // Centra il pivot (evita disallineamenti della hitbox)
    this.mesh.setPivotPoint(BABYLON.Vector3.Zero())
  }

  public setSpeed(speed: number): void {
    this.speed = speed
  }

  public setControlMode(mode: 'manual' | 'ai'): void {
    this.controlMode = mode
  }

  public setAITarget(z: number): void {
    this.aiTargetZ = z
  }

  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z)
  }

  public startMoving(direction: 'up' | 'down'): void {
    this.direction = direction
  }

  public stopMoving(): void {
    this.direction = null
  }

  public update(): void {
    // Calcola velocità Z rispetto al frame precedente
    const prevZ = this.mesh.position.z

    if (this.controlMode === 'manual') {
      if (this.direction === 'up') {
        this.mesh.position.z -= this.speed
      } else if (this.direction === 'down') {
        this.mesh.position.z += this.speed
      }
    } else if (this.controlMode === 'ai') {
      // Semplice IA: muovi verso aiTargetZ
      if (this.mesh.position.z < this.aiTargetZ - 0.1) {
        this.mesh.position.z += this.speed
      } else if (this.mesh.position.z > this.aiTargetZ + 0.1) {
        this.mesh.position.z -= this.speed
      }
    }

    // Clampa posizione
    const limitZ = 7.8
    this.mesh.position.z = Math.max(-limitZ, Math.min(limitZ, this.mesh.position.z))

    // Calcola velocità (semplice differenza per frame)
    this.velocityZ = this.mesh.position.z - prevZ
  }

  public reset(): void {
    this.mesh.position.set(this.mesh.position.x, 0, 0)
  }

  public getCurrentVelocityZ(): number {
    return this.velocityZ
  }

  public getMesh(): BABYLON.Mesh {
    return this.mesh
  }

  public getPosition(): BABYLON.Vector3 {
    return this.mesh.position.clone()
  }

  public getDimensions(): { width: number; height: number; depth: number } {
    return { width: this.width, height: this.height, depth: this.depth }
  }

  public dispose(): void {
    this.mesh.dispose()
  }
}
