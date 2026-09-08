# Blue Edge Lab

Small interactive experiments by [Blue Edge](https://blueedge.me).

Site: [lab.blueedge.me](https://lab.blueedge.me/)

[![Colorful procedural fish swimming in a pale green pond](assets/fish-preview.png)](https://lab.blueedge.me/procedurally-fish-animation/)

## Run Locally

Open [index.html](index.html) in a modern browser to view the lab, or open
[the fish experiment](procedurally-fish-animation/index.html) directly.
No installation or build step is required. An internet connection is needed
for the CDN-hosted libraries, icons, and fonts.

## Procedural Fish

An interactive school of fish with articulated spines, species-specific shapes
and markings, collision avoidance, and swimming across wrapping canvas edges.
Built with p5.js, FIK inverse kinematics, and Canvas 2D.

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

### Play Mode

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

## Structure

```text
index.html                         Lab landing page
assets/                            Favicon and fish preview images
procedurally-fish-animation/
  index.html                       Fish experiment page
  index.js                         Simulation, drawing, and recording
  species.js                       Species profiles, fins, and patterns
  separation.js                    Collision avoidance and separation
  menu.js                          Context menu
  game.js                          Apple game, scoring, and cursor collisions
  sequence.js                      Scripted recording sequence
CNAME                              Custom domain for GitHub Pages
_redirects                         Clean-URL redirects for compatible hosts
robots.txt                         Crawler instructions
sitemap.xml                        Public page URLs
```

## Deployment

Publish this directory as a static site, keeping the asset and experiment
folders intact. No build command is needed.

- **GitHub Pages:** Serve the repository root. `CNAME` declares
  `lab.blueedge.me`; configure the domain's DNS and HTTPS separately.
- **Netlify or Cloudflare Pages:** `_redirects` redirects explicit
  `index.html` paths to their directory URLs. GitHub Pages ignores this file.

Both pages include canonical URLs, Open Graph metadata for services such as
WhatsApp, and Twitter/X large-image cards. The landing page also includes
website structured data. Sharing previews use `assets/fish-preview.png`;
the animated GIF is used on the landing page when hovering or focusing the
experiment, unless reduced motion is enabled.

When changing domains or adding experiments, update the page metadata and
`sitemap.xml`. For a domain change, also update `CNAME` and the sitemap URL in
`robots.txt`. Social previews require publicly accessible pages and images;
platforms may cache older previews.

## Follow

More experiments down the line: [@blueedgetechno](https://twitter.com/blueedgetechno).