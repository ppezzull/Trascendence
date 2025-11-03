import * as BABYLON from '@babylonjs/core'

export class Paddle {
  private mesh: BABYLON.Mesh
  private scene: BABYLON.Scene
  private direction: 'up' | 'down' | null = null
  private speed = 0.3

  // Dimensioni del paddle (devono corrispondere a quelle usate nella collisione)
  private width = 1   // lungo X → spessore
  private height = 1.5  // lungo Y → quasi nullo
  private depth = 4.0   // lungo Z → lunghezza visibile

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

  public startMoving(direction: 'up' | 'down'): void {
    this.direction = direction
  }

  public stopMoving(): void {
    this.direction = null
  }

  public update(): void {
    if (!this.direction) return

    // Movimento lungo Z (non Y!)
    if (this.direction === 'up') {
      this.mesh.position.z -= this.speed
    } else if (this.direction === 'down') {
      this.mesh.position.z += this.speed
    }

    // Limiti verticali per non uscire dal campo
    const limitZ = 13.5 // leggermente dentro i bounds della ball (maxZ = 14)
    this.mesh.position.z = Math.max(-limitZ, Math.min(limitZ, this.mesh.position.z))
  }

  public reset(): void {
    this.mesh.position.set(this.mesh.position.x, 0, 0)
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
