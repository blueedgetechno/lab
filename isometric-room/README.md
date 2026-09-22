# Cozy Room

[Back to the lab](../README.md) | [Live experiment](https://lab.blueedge.me/isometric-room/)

[![An interactive isometric bedroom with miniature furniture](../assets/cozy-room-preview.png)](https://lab.blueedge.me/isometric-room/)

A small, interactive isometric bedroom built with Three.js and GLB assets.
Explore the room, interact with its objects, switch the lighting, and enable
synthesized sound effects.

## Run Locally

Follow the [shared setup](../README.md#run-locally), then open
http://127.0.0.1:3000/isometric-room/.
Use HTTP rather than opening the page directly: the scene loads binary models.
An internet connection is needed for CDN-hosted dependencies.

## Controls

| Control | Action |
| --- | --- |
| Drag | Pan the room |
| Scroll or pinch | Zoom |
| Arrow keys with the scene focused | Pan |
| `+` / `-` with the scene focused | Zoom |
| Home or Reset view | Restore the camera |
| Click an interactive object | Activate its action |
| Room objects toolbar button | Open a keyboard-accessible list of actions |
| Escape | Close the objects panel |
| Sound effects toolbar button | Toggle audio, initially off |

The objects panel includes the bedside lamp and evening lighting, alongside
the room's other interactions. Reduced-motion preferences shorten or skip
interaction animations.

## Implementation Notes

- Pointer picking and the objects panel trigger the same registered actions.
  The panel makes scene interactions available without precise 3D clicks.
- Animation frames are scheduled while interactions are changing, rather
  than continuously animating a still room.
- Audio is optional; room controls remain usable if sound is unavailable.

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Scene setup, model loading, camera, and view controls |
| [interactions.js](interactions.js) | Object actions, picking, animation, and toolbar |
| [furniture.js](furniture.js) | Furniture preparation for interactions |
| [sounds.js](sounds.js) | Synthesized room audio |
| [interactions.css](interactions.css) | Objects panel and interaction styles |
| [bedroom.glb](bedroom.glb) / [toy-car.glb](toy-car.glb) | Scene assets |