# Dig a Meteorite

## Current State
- 3D DiggingScene with earth layers, particle effects, meteorite glow, and a DIG button
- OrbitControls let the user look around
- Map width scales with baseSize: `w = 2 + baseSize * 0.8`
- No player character visible in the scene
- IndexPage shows stats, rarity tiers, and feature shortcuts

## Requested Changes (Diff)

### Add
- Third-person player character in the 3D scene: a simple humanoid made from Three.js primitives (box body, sphere head, cylinder arms/legs) standing on the surface, holding a pickaxe prop
- The character animates a digging swing when the DIG button is pressed
- Camera follows slightly behind/above the character (third-person perspective)

### Modify
- Map base width increased: change formula from `2 + baseSize * 0.8` to `4 + baseSize * 1.5` so the terrain is significantly wider
- OrbitControls maxDistance raised to accommodate wider map
- Camera default position pushed back to show the wider terrain

### Remove
- Nothing removed

## Implementation Plan
1. In DiggingScene.tsx, update `w` formula to `4 + baseSize * 1.5`
2. Update camera default position and maxDistance in OrbitControls
3. Add `PlayerCharacter` Three.js component: head (sphere), body (box), arms (2x box), legs (2x box), pickaxe (thin box)
4. Add `digSwing` animation state — when digging, rotate the right arm/pickaxe group downward and back
5. Position the character on top of the surface layer (y ≈ 0.65), slightly offset from center so the dig spot is still clickable
6. Pass `isDigging` prop into SceneContent and down to PlayerCharacter
