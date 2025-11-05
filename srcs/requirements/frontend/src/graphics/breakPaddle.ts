import * as BABYLON from '@babylonjs/core'

export class Paddle {
  private mesh: BABYLON.Mesh
  private scene: BABYLON.Scene
  private direction: 'left' | 'right' | null = null
  private speed = 0.3

  private lastX = 0
  private velocityX = 0

  // Dimensioni del paddle (devono corrispondere a quelle usate nella collisione)
  private width = 4.0   // lungo X → larghezza visibile
  private height = 1.5  // lungo Y → quasi nullo
  private depth = 1     // lungo Z → spessore

  constructor(name: string, scene: BABYLON.Scene) {
    this.scene = scene
    this.mesh = BABYLON.MeshBuilder.CreateBox(
      name,
      { width: this.width, height: this.height, depth: this.depth },
      this.scene
    )

    //testing collision
    this.mesh.setPivotPoint(BABYLON.Vector3.Zero())
    this.mesh.showBoundingBox = true

    const material = new BABYLON.StandardMaterial(`${name}Material`, this.scene)
    material.diffuseColor = new BABYLON.Color3(0.1, 0.8, 1.0)
    material.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.8)
    this.mesh.material = material

    // Centra il pivot (evita disallineamenti della hitbox)
    this.mesh.setPivotPoint(BABYLON.Vector3.Zero())
  }

  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z)
  }

  public startMoving(direction: 'left' | 'right'): void {
    this.direction = direction
  }

  public stopMoving(): void {
    this.direction = null
  }

  public update(): void {
    // Calcola velocità X rispetto al frame precedente
    const prevX = this.mesh.position.x

    if (this.direction === 'right') {
      this.mesh.position.x -= this.speed
    } else if (this.direction === 'left') {
      this.mesh.position.x += this.speed
    }

    // Clampa posizione
    const limitX = 8 // regola in base all'arena
    this.mesh.position.x = Math.max(-limitX, Math.min(limitX, this.mesh.position.x))

    // Calcola velocità (semplice differenza per frame)
    this.velocityX = this.mesh.position.x - prevX
  }

  public reset(): void {
    // In basso e centrato
    this.mesh.position.set(0, 0, 0)
  }

  public getCurrentVelocityX(): number {
    return this.velocityX
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