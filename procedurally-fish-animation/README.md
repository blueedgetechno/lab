# Just Keep Swimming

[Back to the lab](../README.md) | [Live experiment](https://lab.blueedge.me/procedurally-fish-animation/)

[![Colorful procedural fish swimming in a pale green pond](../assets/fish-preview.png)](https://lab.blueedge.me/procedurally-fish-animation/)

An interactive school of procedural fish with articulated spines,
species-specific shapes and markings, collision avoidance, and swimming across
wrapping canvas edges. Built with p5.js, FIK inverse kinematics, and Canvas 2D.

## Run Locally

Open [index.html](index.html) directly, or follow the [shared setup](../README.md#run-locally)
and visit http://127.0.0.1:3000/procedurally-fish-animation/.
An internet connection is needed for the CDN-hosted libraries, icons, and fonts.

## Controls

| Control | Action |
| --- | --- |
| Right-click | Open the menu to restart, choose rendering stages, follow the mouse, adjust speed or zoom, and add fish |
| Double-click a fish | Remove it |
| Space | Pause or resume |
| `0` / `1` / `2` / `3` | Show the spine, body circles, outline, or finished fish |
| `.` | Pause and advance one simulation step |
| Numpad `8` | Start recording the canvas |
| Numpad `9` | Stop recording and download the video |
| Shift + F10 | Open the context menu with the keyboard |

Recording requires browser support for canvas capture and MediaRecorder.

## Play Mode

Choose **Play game** from the right-click menu. Move the cursor onto the apple
without touching a fish. Fish pursue the cursor continuously while avoiding
each other, and the game stays at 25% zoom.

Each apple adds one random fish and increases speed by 0.1x. The score and
speed appear in the top-right corner. Touching a fish ends the run; choose
**Play again** or **Restart game** to retry.

The game pauses while the cursor is outside the canvas, the menu is open,
or the window has lost focus. Sandbox editing controls are disabled during
a run. Choose **Stop game** from the same menu to restore the previous school
and settings.

## Implementation Notes

The rendering stages expose the path from a moving spine to a finished fish.
Species shapes and markings are separate from movement and separation, so the
same simulation supports different appearances.

| File | Purpose |
| --- | --- |
| [index.js](index.js) | Simulation, drawing, and recording |
| [species.js](species.js) | Species profiles, fins, and patterns |
| [separation.js](separation.js) | Collision avoidance and separation |
| [menu.js](menu.js) | Context menu |
| [game.js](game.js) | Apple game, scoring, and cursor collisions |
| [sequence.js](sequence.js) | Scripted recording sequence |