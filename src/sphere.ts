
import { MeshBuilder, StandardMaterial, Scene, Vector3, Color3 } from '@babylonjs/core';

export class Sphere {
    public mesh: any;
    public speed: number = 0.1;
    public frontVector: Vector3 = new Vector3(0, 0, 1); // Updated to use Vector3 directly

    constructor(scene: Scene, position: Vector3 = new Vector3(0, 1, 0)) {
        // Create the sphere
        this.mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        this.mesh.position = position;
        this.mesh.checkCollisions = true;
        this.mesh.position.y = 5;

        // Create and apply material
        const sphereMaterial = new StandardMaterial("sphereMaterial", scene);
        sphereMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
        this.mesh.material = sphereMaterial;
        
        
        
    }

    // Update move method to accept inputStates
    public move(deltaTime: number, inputStates: { [key: string]: boolean }) {
        
        if (inputStates.up) {
            this.mesh.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed * deltaTime, this.speed * deltaTime, this.speed * deltaTime));
        }
        if (inputStates.down) {
            this.mesh.moveWithCollisions(this.frontVector.multiplyByFloats(-this.speed * deltaTime, -this.speed * deltaTime, -this.speed * deltaTime));
        }
        if (inputStates.left) {
            this.mesh.rotation.y -= 0.02;
            this.frontVector = new Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)); // Updated to use Vector3 directly
        }
        if (inputStates.right) {
            this.mesh.rotation.y += 0.02;
            this.frontVector = new Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)); // Updated to use Vector3 directly
        }
    }
   
    

   
}