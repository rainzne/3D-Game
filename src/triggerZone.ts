import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, ActionManager, ExecuteCodeAction, AbstractMesh } from '@babylonjs/core';

export class TriggerZone {
    public mesh: AbstractMesh;
    private wallToDelete: AbstractMesh;
    private material: StandardMaterial;

    constructor(scene: Scene, position: Vector3, wallToDelete: AbstractMesh, sphereMesh: AbstractMesh) {
        this.mesh = MeshBuilder.CreateBox("triggerZone", { width: 40, height: 10, depth: 40 }, scene);
        this.mesh.position = position;
        
        // Create semi-transparent material
        this.material = new StandardMaterial("triggerMaterial", scene);
        this.material.diffuseColor = new Color3(1, 0, 0);
        this.material.alpha = 0.3;
        this.material.emissiveColor = new Color3(0, 0.3, 0);
        this.mesh.material = this.material;
        scene.addMesh(this.mesh);
        
        this.wallToDelete = wallToDelete;
        
        if (sphereMesh) {
            this.mesh.actionManager = new ActionManager(scene);
            this.mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    { trigger: ActionManager.OnIntersectionEnterTrigger, parameter: sphereMesh },
                    () => {
                        this.wallToDelete.dispose();
                        this.mesh.dispose();
                    }
                )
            );
        }
    }

    public update(): void {
        // Optional: Add visual effects or animations here
        this.material.alpha = 0.3 + Math.sin(Date.now() * 0.001) * 0.2; // Pulsing effect
    }
}