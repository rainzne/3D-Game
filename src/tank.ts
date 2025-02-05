import { Mesh, MeshBuilder, StandardMaterial, Vector3, Scene, Color3 } from '@babylonjs/core';

export class Tank {
    public mesh: Mesh;
    public frontVector: Vector3 = new Vector3(0, 0, 1);
    public speed: number = 0.1;

    constructor(scene: Scene, position: Vector3 = new Vector3(0, 1, 0)) {
        // Create the tank body
        this.mesh = MeshBuilder.CreateBox("tank", { height: 1, width: 2, depth: 4 }, scene);
        this.mesh.position = position;
        this.mesh.checkCollisions = true;

        // Create and apply material
        const tankMaterial = new StandardMaterial("tankMaterial", scene);
        tankMaterial.diffuseColor = new Color3(0, 1, 0); // Green color
        this.mesh.material = tankMaterial;
    }

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