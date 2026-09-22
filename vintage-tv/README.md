# Analog TV

[Back to the lab](../README.md) | [Live experiment](https://lab.blueedge.me/vintage-tv/)

[![A wooden vintage television with a channel dial and playback controls](../assets/vintage-tv-preview.png)](https://lab.blueedge.me/vintage-tv/)

A vintage wooden television you can rotate, tune, and watch. A Three.js shell
surrounds an embedded YouTube player, with channel-switching static, animated
physical controls, and synthesized mechanical sounds.

## Run Locally

Follow the [shared setup](../README.md#run-locally), then open
http://127.0.0.1:3000/vintage-tv/.
HTTP is required for the GLB model, channel list, and YouTube player.
Internet access is needed for YouTube and CDN-hosted dependencies.

## Controls

| Control | Action |
| --- | --- |
| Drag | Rotate the television |
| Right-drag or Pan scene | Pan |
| Scroll | Zoom |
| Channel dial | Tune to a random channel |
| Previous / Next | Switch channels |
| Power | Turn the television on or off |
| Volume / Mute | Adjust playback audio |
| Resume playback | Start playback when a browser blocks autoplay |
| Reset view | Restore the camera |
| Mechanical sound effects | Toggle the physical controls' synthesized sounds |

The television's physical buttons and the toolbar share the same controls.

## Implementation Notes

- The video remains a DOM element, positioned with Three.js `CSS3DRenderer`
  inside the WebGL television. It is not copied into a video texture.
- Autoplay and audio depend on browser permissions and user interaction.
  Playback can also fail when a video is unavailable or embedding is restricted.
- Reduced-motion preferences disable the channel-switching static effect.

Edit [channels.json](channels.json) to change the lineup. Each entry has a
YouTube `id`, `title`, `creator`, `category`, and `year`. Videos are embedded
from YouTube, not bundled with the repository.

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Player, channel controls, and playback state |
| [tv3d.js](tv3d.js) | 3D scene, DOM screen placement, and physical interactions |
| [tv3d.css](tv3d.css) | Scene and toolbar styling |
| [channels.json](channels.json) | Channel lineup |
| [wooden-tv.glb](wooden-tv.glb) | Browser-ready television model |
| [build-tv.py](build-tv.py) | Blender model-building script |