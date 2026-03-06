# Dig a Meteorite

## Current State
The DiggingScene uses pointer lock (requestPointerLock) for mouse camera control. When pointer lock is active, clicking the quick-access sidebar panel buttons (Fuse, Credits, Shop, Rebirth, Items) does not work because pointer events go to the locked element. The top/side nav buttons in the main App.tsx nav bar are also blocked while the canvas has focus. Panel buttons exist on the left side of the dig scene as overlays.

## Requested Changes (Diff)

### Add
- Auto-release pointer lock when any panel button is clicked (or when a panel is open)
- Panel buttons should be pointer-events-enabled and always intercept clicks even if canvas has focus

### Modify
- Panel button overlay: ensure pointer-events-auto is explicitly set so clicks register even when canvas has pointer lock. Release pointer lock before opening panel.
- The canvas pointer-down handler: do NOT request pointer lock if the click target is a UI button (check if event target is within the panel button container)
- Release pointer lock when any activePanel is set (panel open = free mouse)
- Keep pointer lock only while canvas itself is interacted with and no panel is open

### Remove
- Nothing

## Implementation Plan
1. In DiggingScene, add a ref `panelButtonsRef` on the panel buttons container div
2. In `handlePointerDown`, check if `e.target` is inside `panelButtonsRef.current` -- if so, skip requestPointerLock
3. When `togglePanel` opens a panel, call `document.exitPointerLock()` first
4. Set `pointer-events-auto` explicitly on all overlay UI (panel buttons, DIG button, HUD)
5. Add `z-index` hierarchy check: panel buttons z-20, canvas z-0
