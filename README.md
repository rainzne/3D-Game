# 3D-game

Why did we implements our project like this ? 
This is the prototype of a level for the GOW 2025.
The only things i think need to be write why the use of it, is the fact that we use CANNON instead of havok for our physic motor
Simply was the first one that pop in the babylonjs documentation ( i kinda forgot about havok till the 05/02 so.. )
Will probably update to include havok instead of CANNON because for a method that i realy wish was avaible was the rotateWall didnt know how to work with the CANNON physic so I did it on my own ( take inspiration from a past project for it ) 

future work : I think we will need something to make editing level easier and faster


## Technical Implementation

### Core Technologies
- BabylonJS for 3D rendering
- TypeScript for type-safe programming
- CannonJS for physics engine integration

### Key Components

#### Player Controls
- Sphere-based player character
- ZQSD movement controls
- Collision detection system
- Physics-based movement

#### Environment
- Moving walls with physics
- Ground with texture
- Border walls for game boundaries

#### Special Features
1. **Moving Walls**
   - Automated wall movement patterns
   - Physics-based rotation
   - Collision detection

2. **Trigger Zones**
   - Interactive areas
   - Wall removal mechanics
   - Visual feedback system

3. **Camera Systems**
   - Follow camera
   - Arc Rotate camera
   - Camera switching (P key)

4. **Environmental Effects**
   - Fog system (B key)
   - Debug inspector (I key)

## Game Mechanics

### Player Movement
- Forward/Backward (Z/S)
- Left/Right rotation (Q/D)
- Physics-based collision response

### Level Design
- Complex maze layout
- Moving obstacles
- Strategic trigger zones
- Height-varying corridors

## Setup Instructions

1. **Prerequisites**
```bash
npm install
npm run dev


Controls
ZQSD: Movement
P: Switch camera
B: Toggle fog
I: Toggle debug inspector
O: Initialize game.
