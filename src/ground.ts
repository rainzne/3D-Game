import { MeshBuilder, StandardMaterial, Scene,Texture, Color3 } from '@babylonjs/core';

export class Ground {
    public mesh: any;
    public width: number;
    public height: number;

    constructor(scene: Scene) {
        this.width = 500;
        this.height = 500;
        // Create the ground mesh
        this.mesh = MeshBuilder.CreateGround("ground", { width: this.width, height: this.height, subdivisions: 20 }, scene);
        this.mesh.checkCollisions = true;

        // Create and apply material
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new Texture("public/grass.jpg", scene);
        this.mesh.material = groundMaterial;
        
    }
}