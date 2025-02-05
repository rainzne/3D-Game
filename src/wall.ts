import { MeshBuilder, StandardMaterial, Texture, Scene, Vector3, PhysicsImpostor, Space, Axis, Quaternion } from '@babylonjs/core';

export class Wall {
    public mesh: any;
    private movingForward: boolean = true;
    public angularSpeed: number = 0.1; 
    private currentRotation: number = 0;
    
    constructor(scene: Scene, position: Vector3 = new Vector3(0, 0, 0)) {
        // Create the wall mesh
        this.mesh = MeshBuilder.CreateBox("wall", { height: 1, width: 1, depth: 1 }, scene);
        this.mesh.position = position;
        this.mesh.checkCollisions = true;

        // Set initial static impostor
        this.mesh.physicsImpostor = new PhysicsImpostor(
            this.mesh,
            PhysicsImpostor.BoxImpostor,
            { mass: 0, friction: 0.5, nativeOptions: { useDeltaForRotation: true } },
            scene
        );

        // Create and apply material
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseTexture = new Texture("public/brick.jpg", scene);
        this.mesh.material = wallMaterial;
    }

    public moveWall(speed: number, start: Vector3, end: Vector3) {
        
        const currentRotation = this.mesh.rotation.clone();
       
        if (this.mesh.physicsImpostor) {
            this.mesh.physicsImpostor.dispose();
        }
        
        this.mesh.physicsImpostor = new PhysicsImpostor(
            this.mesh,
            PhysicsImpostor.BoxImpostor,
            { mass: 1, restitution: 0, friction: 0.5},
            this.mesh.getScene()
        );

        const target = this.movingForward ? end : start;
        const direction = target.subtract(this.mesh.position).normalize();
        this.mesh.physicsImpostor.setLinearVelocity(direction.scale(speed));

       
        this.mesh.rotation = currentRotation;
        const distance = Vector3.Distance(this.mesh.position, target);
        if (distance < 0.5) {
            this.mesh.position = target.clone();
            this.mesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
            this.movingForward = !this.movingForward;
            
          
            this.mesh.rotation = currentRotation;

            this.mesh.physicsImpostor.dispose();
        }
    }

    
    public rotateWall(speed: number) {
        this.currentRotation += speed;
        this.mesh.rotation.y = this.currentRotation;
        
        if (this.mesh.physicsImpostor) {
            this.mesh.physicsImpostor.setAngularVelocity(new Vector3(0, speed, 0));
        }
    }
}