# Dig a Meteorite

## Current State
- Full 3D meteorite digging game built with React Three Fiber
- Player character with WASD movement and dig animation (arm swing)
- 3D map with trees, museum building, earth layers, daytime sky
- Tabs: Home, Dig, Items, Shop, Fuse, Coins, Rebirth, Code Panel
- DiggingScene has quick-access panel buttons (Fuse, Coins, Shop, Rebirth, Items) as left-side vertical strip that open slide-up overlays
- No background music system
- No mouse-look / camera orbit controls
- No walking animation on player legs
- Fuse Machine, Shop, and Rebirth only accessible via left-side icon strip or top nav tabs — not as 3D buildings on the map

## Requested Changes (Diff)

### Add
- **Mouse look**: click-and-drag to orbit camera around the player character. While dragging, the camera rotates around the player. When not dragging, camera continues to follow behind player as before.
- **Background music**: synthesized/procedural epic-adventure looping background music using the Web Audio API (no external audio files). On/off toggle button shown as a floating button in the HUD (e.g., top-right corner of the 3D scene). Music starts muted; user can toggle it on.
- **Walking animation**: player's legs animate (swing back and forth) when W/S keys are held down for movement.
- **Fuse Machine building on map**: a visible 3D structure on the map (glowing purple/violet cauldron/machine). Walking close to it opens the Fuse Machine panel (same slide-up UI). Also clickable.
- **Shop building on map**: a visible 3D shop stall/building on the map. Walking close to it opens the Sell Shop panel.
- **Rebirth building on map**: a visible 3D altar/obelisk on the map. Walking close to it opens the Rebirth panel.

### Modify
- **PlayerCharacter**: add leg swing animation driven by `isWalking` prop. Left and right leg mesh rotation animates when walking.
- **SceneContent**: track mouse drag state and compute camera orbit angle offset around player. Combine orbit offset with the behind-player follow direction.
- **DiggingScene**: add music toggle state and Web Audio oscillator-based music loop. Render music toggle button in HUD.

### Remove
- Nothing removed — all existing features remain.

## Implementation Plan
1. Add `isWalking` prop to `PlayerCharacter` and animate leg groups with useFrame when walking.
2. In `SceneContent`, add mouse-drag orbit: track `pointerdown`/`pointermove`/`pointerup` on the canvas container (in DiggingScene), pass camera yaw offset into SceneContent, combine with player facing angle for the behind-player camera position.
3. Add three 3D buildings to `SceneContent`: FuseMachineBuilding (purple glowing cauldron at position ~[-20, 0, -10]), ShopBuilding (wooden stall at ~[-10, 0, -15]), RebirthBuilding (stone obelisk at ~[10, 0, -15]). Each has a proximity trigger (like museum) and a click handler.
4. Add proximity detection for the three buildings in the useFrame loop, calling new callbacks `onNearFuse`, `onNearShop`, `onNearRebirth` and `onEnterFuse`, `onEnterShop`, `onEnterRebirth`.
5. In DiggingScene main component, add state for proximity HUD hints for each building, and open the respective panel when player walks into the building trigger zone.
6. Implement Web Audio music system: create an AudioContext with oscillators forming a simple looping melody. Start/stop based on `musicOn` state. Render a music toggle button (🎵/🔇) in the HUD top-right area.
7. Validate and deploy.
