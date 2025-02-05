import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, FollowCamera, Ray, Mesh, Observer, Nullable } from '@babylonjs/core';
import '@babylonjs/inspector';
import { Tank } from './tank';
import { Wall } from './wall';
import { Sphere } from './sphere';
import { Ground } from './ground';
import { CannonJSPlugin, PhysicsImpostor } from '@babylonjs/core';
import { TriggerZone } from './triggerZone';


import * as CANNON from 'cannon';


(window as any).CANNON = CANNON;

// on peut OOB avec les murs -> a regler 

class App {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private tank: Tank;
    private wall: Wall; 
    private sphere: Sphere | null = null;
    private ground: Ground; 
    private inputStatesTank: { [key: string]: boolean } = {}; 
    
    private walls: Wall[] = [];
    private triggerZones: TriggerZone[] = [];
    
    private followCamera: FollowCamera | null = null;
    private arcRotateCamera : ArcRotateCamera | null = null;
    private wallObserver: Nullable<Observer<Scene>> = null;
    
 

    constructor() {
        // Create and configure the canvas
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);
        

        // Initialize Babylon engine and scene
        this.engine = new Engine(this.canvas, true);
        this.scene = this.createScene();

        // Initialize the Tank
        this.tank = new Tank(this.scene);

        

        
        


        // Initialize the Ground
        this.ground = new Ground(this.scene);

        // Handle input
        this.handleInput();

        // Start the render loop
        this.engine.runRenderLoop(() => {
            let deltaTime = this.engine.getDeltaTime();
            this.scene.render();
            this.handleFollowCameraCollision();
            
           
            if (this.sphere) {
                this.sphere.move(deltaTime, this.inputStatesTank);
                
            }
            if (this.tank) {
                this.tank.move(deltaTime, this.inputStatesTank);
            }
           
            
            
            
           
            if (this.followCamera) {
                this.followCamera.update();
            }
        });

      
        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        // Show Inspector
        this.showInspector(this.scene);
        this.activeFog(this.scene);
        this.WallBorder(this.scene);
        this.SwitchArcCamera(this.scene);
        this.checkCollisions(this.scene);
    }
    

    private createScene(): Scene {
        const scene = new Scene(this.engine);
        scene.enablePhysics(null, new CannonJSPlugin());

        scene.collisionsEnabled = true;

        // Create and position the ArcRotateCamera
        const arcRotateCamera = this.createArcRotateCamera(scene);
        this.arcRotateCamera = arcRotateCamera;
        arcRotateCamera.attachControl(this.canvas, true);
        arcRotateCamera.checkCollisions = true;
        

        // Add a hemispheric light
        const hemisphericLight = new HemisphericLight("HemisphericLight", new Vector3(0, 1, 0), scene);
        hemisphericLight.intensity = 0.7;

      

        // Set the active camera to ArcRotateCamera initially
        scene.activeCamera = arcRotateCamera;
       

        return scene;
    }

    private createFollowCamera(scene: Scene, target: any): FollowCamera {
        let camera = new FollowCamera("ArcCamera", target.position, scene, target);

        camera.radius = 40; // how far from the object to follow
        camera.heightOffset = 14; // how high above the object to place the camera
        camera.rotationOffset = 180; // the viewing angle
        camera.cameraAcceleration = 0.1; // how fast to move
        camera.maxCameraSpeed = 5; // speed limit
        

        return camera;
    }
    private handleFollowCameraCollision(): void {
        if (!this.followCamera) return;
    
        const camPos = this.followCamera.position;
    
        // Example: clamp camera within a boundary
        const minX = -250, maxX = 240;
        const minZ = -250, maxZ = 240;
    
        if (camPos.x < minX) camPos.x = minX;
        if (camPos.x > maxX) camPos.x = maxX;
        if (camPos.z < minZ) camPos.z = minZ;
        if (camPos.z > maxZ) camPos.z = maxZ;
    
       
    }
    
    // creation of a method that detect collision of the tank, and sphere with obstacles and repulse
    private checkCollisions(scene: Scene): void {
        scene.registerBeforeRender(() => {
            
            scene.meshes.forEach((mesh) => {
                if (mesh === this.tank.mesh || mesh === this.sphere?.mesh) return;
                
                // --- Tank collision resolution ---
                if (this.tank.mesh.intersectsMesh(mesh, true)) {
                    // Refresh bounding info for up-to-date bounds
                    this.tank.mesh.refreshBoundingInfo();
                    mesh.refreshBoundingInfo({});
                    const tankBB = this.tank.mesh.getBoundingInfo().boundingBox;
                    const meshBB = mesh.getBoundingInfo().boundingBox;
        
                    const tankMin = tankBB.minimumWorld;
                    const tankMax = tankBB.maximumWorld;
                    const meshMin = meshBB.minimumWorld;
                    const meshMax = meshBB.maximumWorld;
        
                    // Compute overlaps on X and Z
                    const overlapX = Math.min(tankMax.x, meshMax.x) - Math.max(tankMin.x, meshMin.x);
                    const overlapZ = Math.min(tankMax.z, meshMax.z) - Math.max(tankMin.z, meshMin.z);
        
                    // Resolve collision on the axis with the smallest penetration
                    if (overlapX < overlapZ) {
                        // Push tank along X axis
                        if (this.tank.mesh.position.x > mesh.position.x) {
                            this.tank.mesh.position.x += overlapX;
                        } else {
                            this.tank.mesh.position.x -= overlapX;
                        }
                    } else {
                        // Push tank along Z axis
                        if (this.tank.mesh.position.z > mesh.position.z) {
                            this.tank.mesh.position.z += overlapZ;
                        } else {
                            this.tank.mesh.position.z -= overlapZ;
                        }
                    }
                }
        
                // --- Sphere collision resolution ---
                if (this.sphere?.mesh.intersectsMesh(mesh, true)) {
                    // Refresh bounding info for obstacle
                    mesh.refreshBoundingInfo({});
                    const meshBB = mesh.getBoundingInfo().boundingBox;
                    
                    // Get sphere center
                    const sphereCenter = this.sphere.mesh.position;
                    // Define your sphere's radius (adjust as needed or compute from geometry/scaling)
                    const sphereRadius = 6;
                    
                    // Compute the closest point on the obstacle's bounding box to the sphere center
                    const closestX = Math.max(meshBB.minimumWorld.x, Math.min(sphereCenter.x, meshBB.maximumWorld.x));
                    const closestY = Math.max(meshBB.minimumWorld.y, Math.min(sphereCenter.y, meshBB.maximumWorld.y));
                    const closestZ = Math.max(meshBB.minimumWorld.z, Math.min(sphereCenter.z, meshBB.maximumWorld.z));
                    const closestPoint = new Vector3(closestX, closestY, closestZ);
                    
                    // Compute the vector from the closest point to the sphere center
                    const diff = sphereCenter.subtract(closestPoint);
                    const distance = diff.length();
                    
                    if (distance < sphereRadius) {
                        // Compute penetration depth
                        const penetration = sphereRadius - distance;
                        // Compute push direction (if diff is zero, use an arbitrary direction)
                        let pushDir = diff.normalize();
                        if (pushDir.length() === 0) {
                            pushDir = new Vector3(0, 0, 1);
                        }
                        // Apply a fraction of the push so it's more subtle (adjust factor as needed)
                        this.sphere.mesh.position.addInPlace(pushDir.scale(penetration * 0.5));
                    }
                }
            });
        });
    }
    

    private createArcRotateCamera(scene: Scene): ArcRotateCamera {
        let camera = new ArcRotateCamera("tankFollowCamera", Math.PI / 2, Math.PI / 4, 100, Vector3.Zero(), scene);
        camera.attachControl(this.canvas, true);
        return camera;
    }
  

    // Handle keyboard input
    private handleInput(): void {
        window.addEventListener("keydown", (event) => {
            switch(event.key) {
                case "z":
                    this.inputStatesTank.up = true;
                    break;
                case "s":
                    this.inputStatesTank.down = true;
                    break;
                case "q":
                    this.inputStatesTank.left = true;
                    break;
                case "d":
                    this.inputStatesTank.right = true;
                    break;

                
            }
        });

        window.addEventListener("keyup", (event) => {
            switch(event.key) {            
                case "z":
                    this.inputStatesTank.up = false;
                    break;              
                case "s":
                    this.inputStatesTank.down = false;
                    break;
                case "q":
                    this.inputStatesTank.left = false;
                    break;
                case "d":
                    this.inputStatesTank.right = false;
                    break;
                default:
                    break;
            }
        });
    }


    // Inspector toggle
    private showInspector(scene: Scene): void {
        window.addEventListener("keydown", (e) => {
            if (e.key === "i") { 
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });
    }

    private activeFog(scene: Scene): void {
        window.addEventListener("keydown", (e) => {
            if (e.key === "b") {
                if (scene.fogMode === Scene.FOGMODE_EXP) {
                    scene.fogMode = Scene.FOGMODE_NONE;
                } else {
                    scene.fogMode = Scene.FOGMODE_EXP;
                    scene.fogDensity = 0.01;
                    scene.fogColor = new Color3(0.9, 0.9, 0.85);
                }
            }
        });
    }

    private SwitchArcCamera(scene: Scene): void {
        window.addEventListener("keydown", (e) => {
            if (e.key === "p") {
                if (scene.activeCamera === this.arcRotateCamera) {
                    if (this.followCamera) {
                        scene.activeCamera = this.followCamera;
                        
                    }
                } else {
                    if (this.arcRotateCamera) {
                        scene.activeCamera = this.arcRotateCamera;
                        this.arcRotateCamera.attachControl(this.canvas, true);
                        this.arcRotateCamera.radius=714;
                        this.arcRotateCamera.beta=0.236;
                        this.arcRotateCamera.alpha=1.561;
                    }
                }
            }
        });
    }

    private WallBorder(scene: Scene): void {
        window.addEventListener("keydown", (e) => {
            if (e.key === "o") {
                if (this.walls.length === 0) {
                    // Create walls
                    const groundWidth = this.ground.width;
                    const groundHeight = this.ground.height;
                    const halfWidth = groundWidth / 2;
                    const halfHeight = groundHeight / 2;
                    const wallThickness = 10; 
                    const scaling = new Vector3(100, 50,15);
                    const staticWalls: Wall[] = [];
                    const movingWalls: Wall[] = [];

                    const wallFront = new Wall(scene, new Vector3(0, 0, halfHeight + wallThickness / 2));
                    wallFront.mesh.scaling = new Vector3(groundWidth + wallThickness, 100, wallThickness);
                    const wallBack = new Wall(scene, new Vector3(0, 0, -halfHeight - wallThickness / 2));
                    wallBack.mesh.scaling = new Vector3(groundWidth + wallThickness, 100, wallThickness);
                    const wallLeft = new Wall(scene, new Vector3(-halfWidth - wallThickness / 2, 0, 0));
                    wallLeft.mesh.scaling = new Vector3(wallThickness, 100, groundHeight + wallThickness);
                    const wallRight = new Wall(scene, new Vector3(halfWidth + wallThickness / 2, 0, 0));
                    wallRight.mesh.scaling = new Vector3(wallThickness, 100, groundHeight + wallThickness);
                    const wall5 = new Wall(scene, new Vector3(200, 20, 190));
                    wall5.mesh.scaling = scaling
                    const wall6 = new Wall(scene, new Vector3(100, 20, 190));
                    wall6.mesh.scaling = scaling
                    const wall7 = new Wall(scene, new Vector3(150, 20, 195));
                    wall7.mesh.scaling= new Vector3(100, 50, 1);
                    const wall8 = new Wall(scene, new Vector3(0, 20, 190));
                    wall8.mesh.scaling = scaling
                    const wall9 = new Wall(scene, new Vector3(-100, 20, 190));
                    wall9.mesh.scaling = scaling
                    const wall10 = new Wall(scene, new Vector3(-200, 20, 220));
                    wall10.mesh.scaling = new Vector3(55, 50, 2);
                    wall10.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall11 = new Wall(scene, new Vector3(-180, 20, 190));
                    wall11.mesh.scaling = new Vector3(40, 50, 15);
                    const wall12 = new Wall(scene, new Vector3(150, 20, 140));
                    wall12.mesh.scaling = scaling; 
                    // const wall_rota=new Wall(scene, new Vector3(80, 20, 160));
                    // wall_rota.mesh.scaling = wall10.mesh.scaling;
                    const wall13 = new Wall(scene, new Vector3(100, 20, 160));
                    wall13.mesh.scaling = new Vector3(40, 50, 1);
                    wall13.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall14 = new Wall(scene, new Vector3(50, 20, 140));
                    wall14.mesh.scaling=scaling;
                    const wall15 = new Wall(scene, new Vector3(0, 20, 140));
                    wall15.mesh.scaling= new Vector3(40, 50, 1);
                    wall15.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall16 = new Wall(scene, new Vector3(-70, 20, 140));
                    wall16.mesh.scaling=scaling;
                    const wall17 = new Wall(scene, new Vector3(-205, 20, 140));
                    wall17.mesh.scaling=scaling;
                    const wall18 = new Wall(scene, new Vector3(200, 20, 100))
                    wall18.mesh.scaling =scaling;
                    const wall19 = new Wall(scene, new Vector3(100, 20, 100))
                    wall19.mesh.scaling =scaling;
                    const wall20 = new Wall(scene, new Vector3(-27.5, 20, 90))
                    wall20.mesh.scaling =scaling;
                    wall20.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall21 = new Wall(scene, new Vector3(7.5, 20, 90))
                    wall21.mesh.scaling =scaling;
                    wall21.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall22 = new Wall(scene, new Vector3(-5, 20, 100))
                    wall22.mesh.scaling = new Vector3(30, 50, 1);
                    const wall23 = new Wall(scene, new Vector3(50, 20, 50))
                    wall23.mesh.scaling = scaling;
                    const wall24 = new Wall(scene, new Vector3(100, 20, 70))
                    wall24.mesh.scaling = new Vector3(50, 50, 1);
                    wall24.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall25 = new Wall(scene, new Vector3(-5, 20, 80))
                    wall25.mesh.scaling = new Vector3(30, 50, 1);
                    const wall26 = new Wall(scene, new Vector3(-135, 20, 140))
                    wall26.mesh.scaling = new Vector3(40, 50, 1);
                    const wall27 = new Wall(scene, new Vector3(-112, 20, 90))
                    wall27.mesh.scaling = scaling;
                    wall27.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall28 = new Wall(scene, new Vector3(-112, 20, -10))
                    wall28.mesh.scaling = scaling;
                    wall28.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall29 = new Wall(scene, new Vector3(-112, 20, -100))
                    wall29.mesh.scaling = scaling;
                    wall29.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall30 = new Wall(scene, new Vector3(-112, 20, -200))
                    wall30.mesh.scaling = scaling;
                    wall30.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall31 = new Wall(scene, new Vector3(-162.5, 20, 90))
                    wall31.mesh.scaling = scaling;
                    wall31.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall32 = new Wall(scene, new Vector3(-162.5, 20, -10))
                    wall32.mesh.scaling = scaling;
                    wall32.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall33 = new Wall(scene, new Vector3(-162.5, 20, -110))
                    wall33.mesh.scaling = new Vector3(100, 50,15);
                    wall33.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall34 = new Wall(scene, new Vector3(-162.5, 20, -195))
                    wall34.mesh.scaling = new Vector3(80, 50,15);
                    wall34.mesh.rotation = new Vector3(0, (Math.PI) /2, 0);
                    const wall35 = new Wall(scene, new Vector3(150, 20, 50))
                    wall35.mesh.scaling = scaling;
                    const wall36 = new Wall(scene, new Vector3(250, 20, 50))
                    wall36.mesh.scaling = scaling;
                    const wall_couloir = new Wall(scene, new Vector3(-135, 20, 120))
                    wall_couloir.mesh.scaling = new Vector3(40, 50, 1);
                    const wall_couloir2 = new Wall(scene, new Vector3(-135, 20, 100))
                    wall_couloir2.mesh.scaling = new Vector3(40, 55, 1);
                    const wall_couloir3 = new Wall(scene, new Vector3(-135, 20, 80))
                    wall_couloir3.mesh.scaling = new Vector3(40, 60, 1);
                    const wall_couloir4 = new Wall(scene, new Vector3(-135, 20, 60))
                    wall_couloir4.mesh.scaling = new Vector3(40, 65, 1);
                    const wall_couloir5 = new Wall(scene, new Vector3(-135, 20, 40))
                    wall_couloir5.mesh.scaling = new Vector3(40, 70, 1);
                    const wall_couloir6 = new Wall(scene, new Vector3(-135, 20, 20))
                    wall_couloir6.mesh.scaling = new Vector3(40, 75, 1);
                    const wall_couloir7 = new Wall(scene, new Vector3(-135, 20, 0))
                    wall_couloir7.mesh.scaling = new Vector3(40, 80, 1);
                    const wall_couloir8 = new Wall(scene, new Vector3(-135, 20, -20))
                    wall_couloir8.mesh.scaling = new Vector3(40, 85, 1);
                    const wall_couloir9 = new Wall(scene, new Vector3(-135, 20, -40))
                    wall_couloir9.mesh.scaling = new Vector3(40, 90, 1);
                    const wall_couloir10 = new Wall(scene, new Vector3(-135, 20, -60))
                    wall_couloir10.mesh.scaling = new Vector3(40, 95, 1);
                    const wall_couloir11 = new Wall(scene, new Vector3(-135, 20, -80))
                    wall_couloir11.mesh.scaling = new Vector3(40, 100, 1);
                    const wall_couloir12 = new Wall(scene, new Vector3(-135, 20, -100))
                    wall_couloir12.mesh.scaling = new Vector3(40, 105, 1);
                    const wall_couloir13 = new Wall(scene, new Vector3(-135, 20, -120))
                    wall_couloir13.mesh.scaling = new Vector3(40, 110, 1);
                    const wall_couloir14 = new Wall(scene, new Vector3(-135, 20, -140))
                    wall_couloir14.mesh.scaling = new Vector3(40, 115, 1);

               

                    
                    


                    
                    
            
                    
                    
                      staticWalls.push(wallFront,wallBack,wallLeft,
                        wallRight,wall5,wall6,wall8,wall9,wall11,
                        wall12,wall14,wall16,wall17,wall18,wall19,
                        wall20,wall21,wall22,wall23,wall25,wall26,
                        wall27,wall28,wall29,wall30,wall31,wall32,
                        wall33,wall34,wall35,wall36);
                      
                      movingWalls.push(wall7,wall10,wall13,wall15,wall24,wall_couloir,
                        wall_couloir2,wall_couloir3,wall_couloir4,wall_couloir5,wall_couloir6,
                        wall_couloir7,wall_couloir8,wall_couloir9,wall_couloir10,wall_couloir11,
                        wall_couloir12,wall_couloir13,wall_couloir14
                      );
                   
                    
                    
                    
                    

                   
                    this.wallObserver = scene.onBeforeRenderObservable.add(() => {
                    
                        wall7.moveWall(40, new Vector3(150, 20, 195), new Vector3(150, 20, 247));
                        wall10.moveWall(50, new Vector3(-200, 20, 220), new Vector3(-100, 20, 220));
                        // wall_rota.rotateWall(-1);
                        wall13.moveWall(50, new Vector3(100, 20, 155), new Vector3(100, 20, 175));
                        wall15.moveWall(50, new Vector3(70, 20, 165), new Vector3(0, 20, 140));
                        wall24.moveWall(70, new Vector3(100, 20, 70), new Vector3(100, -30, 70));
                        // wall15.rotateWall(0.02);
                        wall_couloir.moveWall(50, new Vector3(-135, 30, 120), new Vector3(-135, -130, 120));
                        wall_couloir2.moveWall(50, new Vector3(-135, 35, 100), new Vector3(-135, -125, 100));
                        wall_couloir3.moveWall(50, new Vector3(-135, 40, 80), new Vector3(-135, -120, 80));
                        wall_couloir4.moveWall(50, new Vector3(-135, 45, 60), new Vector3(-135, -115, 60));
                        wall_couloir5.moveWall(50, new Vector3(-135, 50, 40), new Vector3(-135, -110, 40));
                        wall_couloir6.moveWall(50, new Vector3(-135, 55, 20), new Vector3(-135, -105, 20));
                        wall_couloir7.moveWall(50, new Vector3(-135, 60, 0), new Vector3(-135, -100, 0));
                        wall_couloir8.moveWall(50, new Vector3(-135, 65, -20), new Vector3(-135, -95, -20));
                        wall_couloir9.moveWall(50, new Vector3(-135, 70, -40), new Vector3(-135, -90, -40));
                        wall_couloir10.moveWall(50, new Vector3(-135, 75, -60), new Vector3(-135, -85, -60));
                        wall_couloir11.moveWall(50, new Vector3(-135, 80, -80), new Vector3(-135, -80, -80));
                        wall_couloir12.moveWall(50, new Vector3(-135, 85, -100), new Vector3(-135, -75, -100));
                        wall_couloir13.moveWall(50, new Vector3(-135, 90, -120), new Vector3(-135, -70, -120));
                        wall_couloir14.moveWall(50, new Vector3(-135, 95, -140), new Vector3(-135, -65, -140));
                        

                        

                        this.triggerZones.forEach(zone => {
                            zone.update(); // This will show the trigger zone
                        });
                        if (this.sphere) {
                            const targetY = 5;
                            this.sphere.mesh.position.y = targetY;
                        }
                        
                        
                    });
                
                    this.walls.push(...staticWalls, ...movingWalls);
                    staticWalls.forEach((wall) => {
                        if (wall.mesh.physicsImpostor) {
                          wall.mesh.physicsImpostor.dispose();
                          wall.mesh.physicsImpostor = null;
                        }
                      });
                    
                    
                   
                    this.tank.mesh.dispose();

                    // Create the Sphere
                    this.sphere = new Sphere(this.scene, new Vector3(235, 5, 235));
                    this.sphere.mesh.scaling = new Vector3(10, 10, 10);
                    if (this.sphere) {
                        
                        const triggerZone = new TriggerZone(
                            this.scene, 
                            new Vector3(225, -4, 70),
                            wall22.mesh,
                            
                            this.sphere.mesh // Pass sphere mesh explicitly
                        );
                        const triggerZone1 = new TriggerZone(
                            this.scene, 
                            new Vector3(225, -4, 70),
                            wall26.mesh,
                            
                            this.sphere.mesh // Pass sphere mesh explicitly
                        );
                        const triggerZone2 = new TriggerZone(
                            this.scene, 
                            new Vector3(-220, -4, 70),
                            wall25.mesh,
                            
                            this.sphere.mesh // Pass sphere mesh explicitly
                        );
                        this.triggerZones.push(triggerZone,triggerZone1,triggerZone2);
                        scene.meshes.push(triggerZone.mesh);
                    }
                    
                    

                    
                    
                    
                    // Switch FollowCamera to follow the Sphere
                    if (this.followCamera) {
                        this.scene.activeCamera = this.followCamera;
                        this.followCamera.lockedTarget = this.sphere.mesh;
                    } else {
                        this.followCamera = this.createFollowCamera(scene, this.sphere.mesh);
                        scene.addCamera(this.followCamera);
                        this.scene.activeCamera = this.followCamera;
                    }

                    console.log("Walls and Sphere created. Camera now follows the Sphere.");
                }
                else {
                    // Dispose walls
                    this.walls.forEach(wall => wall.mesh.dispose());
                    this.walls = [];
                    if (this.wallObserver) {
                        scene.onBeforeRenderObservable.remove(this.wallObserver);
                        this.wallObserver = null;
                    }

                    // Dispose Sphere
                    if (this.sphere) {
                        this.sphere.mesh.dispose();
                        this.sphere = null;
                    }
                    if (this.triggerZones.length > 0) {
                        this.triggerZones.forEach(zone => zone.mesh.dispose());
                        this.triggerZones = [];
                    }

                    // Re-initialize the Tank
                    this.tank = new Tank(this.scene);

                    // Switch FollowCamera back to the Tank
                    if (this.followCamera) {
                        this.followCamera.lockedTarget = this.tank.mesh;
                        this.scene.activeCamera = this.followCamera;
                        
                    } else {
                        const followCamera = this.createFollowCamera(scene, this.tank.mesh);
                        this.followCamera =  followCamera;
                        scene.addCamera(this.followCamera);
                    }
                    

                    console.log("Walls and Sphere disposed. Camera now follows the Tank.");
                }
            }
        });
    }
}

new App();