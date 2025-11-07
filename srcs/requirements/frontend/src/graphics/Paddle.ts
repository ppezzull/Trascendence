import * as BABYLON from '@babylonjs/core'

export class Paddle {
  private mesh: BABYLON.Mesh | null = null
  private scene: BABYLON.Scene | null = null
  private moveDirection: 'up' | 'down' | 'left' | 'right' | null = null
  private speed = 0.2
  private minX = -8
  private maxX = 8
  private minY = -4
  private maxY = 4

  constructor(name: string, scene: BABYLON.Scene) {
    this.scene = scene
    this.createMesh(name)
  }

  private createMesh(name: string): void {
    if (!this.scene) return
    
    // Create paddle mesh
    this.mesh = BABYLON.MeshBuilder.CreateBox(
      name,
      { width: 0.3, height: 2, depth: 1 },
      this.scene
    )
    
    // Create cyber material
    const material = new BABYLON.StandardMaterial(`${name}Material`, this.scene)
    material.diffuseColor = new BABYLON.Color3(0, 1, 0.25) // Cyber green
    material.specularColor = new BABYLON.Color3(0, 1, 0.5)
    material.emissiveColor = new BABYLON.Color3(0, 0.2, 0.05)
    
    // Add glow effect
    material.specularPower = 32
    
    this.mesh.material = material
    
    // Add edges for cyber look
    const edges = BABYLON.MeshBuilder.CreateBox(
      `${name}Edges`,
      { width: 0.35, height: 2.05, depth: 1.05 },
      this.scene
    )
    
    const edgeMaterial = new BABYLON.StandardMaterial(`${name}EdgeMaterial`, this.scene)
    edgeMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 0.2)
    edgeMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0.075)
    edgeMaterial.alpha = 0.7
    
    edges.material = edgeMaterial
    edges.parent = this.mesh
  }

  public setPosition(x: number, y: number, z: number): void {
    if (this.mesh) {
      this.mesh.position = new BABYLON.Vector3(x, y, z)
    }
  }

  public getPosition(): BABYLON.Vector3 {
    if (this.mesh) {
      return this.mesh.position.clone()
    }
    return BABYLON.Vector3.Zero()
  }

  public startMoving(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.moveDirection = direction
  }

  public stopMoving(): void {
    this.moveDirection = null
  }

  public update(): void {
    if (!this.mesh || !this.moveDirection) return
    
    const currentPosition = this.mesh.position.clone()
    
    if (this.moveDirection === 'up') {
      currentPosition.y += this.speed
      // Clamp to max Y
      currentPosition.y = Math.min(currentPosition.y, this.maxY)
    } else if (this.moveDirection === 'down') {
      currentPosition.y -= this.speed
      // Clamp to min Y
      currentPosition.y = Math.max(currentPosition.y, this.minY)
    } else if (this.moveDirection === 'left') {
      currentPosition.x -= this.speed
      // Clamp to min X
      currentPosition.x = Math.max(currentPosition.x, this.minX)
    } else if (this.moveDirection === 'right') {
      currentPosition.x += this.speed
      // Clamp to max X
      currentPosition.x = Math.min(currentPosition.x, this.maxX)
    }
    
    this.mesh.position = currentPosition
  }

  public reset(): void {
    this.moveDirection = null
    this.setPosition(0, 0, 0)
  }

  public getMesh(): BABYLON.Mesh | null {
    return this.mesh
  }

  public dispose(): void {
    if (this.mesh) {
      this.mesh.dispose()
      this.mesh = null
    }
    
    this.scene = null
  }
}
