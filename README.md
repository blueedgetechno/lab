# Blue Edge Lab

Small interactive experiments by [Blue Edge](https://blueedge.me).

Site: [lab.blueedge.me](https://lab.blueedge.me/)

[![Colorful procedural fish swimming in a pale green pond](assets/fish-preview.png)](https://lab.blueedge.me/procedurally-fish-animation/)

## Run Locally

Open [index.html](index.html) in a modern browser to view the lab, or open
[the fish experiment](procedurally-fish-animation/index.html) directly.
No installation or build step is required for these static pages. An internet connection is needed
for the CDN-hosted libraries, icons, and fonts.

The shared server lives in [common/serve.cjs](common/serve.cjs). Run `npm start`
and open http://127.0.0.1:3000/ to load the lab index.

### Jev Country

[Jev Country](jev-country/index.html) uses TypeSafe AI's Jev evaluation model
through Vercel AI Gateway or OpenJev. Live search requires Node.js 22 or newer:

```sh
npm install
npm start
```

Set `VERCEL_AI_KEY` (or `AI_GATEWAY_API_KEY`) in the server environment or in
an ignored `.env.local` file at the repository root; see [.env.example](.env.example).
The VS Code **Launch local server** configuration also reads that file.
Never commit credentials or put them in browser code. Rotate any key shared in chat
or previously committed. Gateway may require a valid credit card on file to
activate credits, even when using its free allowance.

Open http://127.0.0.1:3000/jev-country/. The local server uses port 3000 on every
launch; set `PORT` in the server environment to override it. The browser sends
only the query and provider selection to `POST /api/jev-country`; by default the server authenticates to
`typesafe-ai/jev` using the official AI SDK's experimental evaluation API.
All 195 countries are evaluated independently in one batch. Up to six results
with estimated match probability at least 65% are shown, highest first.
The displayed percentages are model estimates, not verified facts or a measured
accuracy guarantee. The 65% cutoff is an initial heuristic, not a calibrated
threshold. Curated descriptions and the World Bank snapshot remain separate
from the model output. Queries and country metadata are sent to the selected
provider (Vercel/TypeSafe or OpenJev/TypeSafe).

Enable **Settings > Use OpenJev** to use [OpenJev](https://openjev.sh/docs)
instead of Vercel AI Gateway. Set `OPENJEV_API_KEY` in the server environment
or `.env.local`, then restart the server or debugger. The server calls
`https://api.openjev.sh/v1/systemone` with model `openjev`, converting its
`noul` yes/no probabilities to the same match scores. Only the selected
provider's key is required; neither key is sent to the browser. Turning the
toggle off returns to Gateway. Provider caches are separate; timeouts and
request limits are shared. There is no automatic provider fallback.

Enable **Settings > Mock search** to use the original curated topics and
country-name matches locally, without an API key or backend. Mock percentages
are illustrative relevance scores, not Jev probabilities. Mock mode disables
the OpenJev toggle and overrides both live providers. Gateway remains the
default on page load. Switching modes or providers cancels pending searches
and reruns the current query using the selected source.

Requests have a 20-second provider timeout, no automatic retries, a 240-character
query limit, and a 4 KiB body limit. The local process allows two concurrent
evaluations and 30 uncached requests per minute, caching up to 100 queries for
five minutes in memory. Superseded browser requests are cancelled. Errors are
shown without substituting mock answers. Run `npm test` for offline API tests.

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

## Just Chill

[Just Chill](windy-grass/index.html) is a full-screen Three.js meadow with a
green title, wind-animated grass, clouds, and optional synthesized wind audio.
Drag to orbit, scroll or pinch to zoom, and use the toolbar to pause, adjust
the breeze, reset the camera, or enter fullscreen. Wind starts automatically;
reduced-motion preferences slow it down, and the pause button stops it.
Audio is off until enabled.

This experiment loads binary assets and must be served over HTTP. From the
repository root, run `node common/serve.cjs`, then open `/windy-grass/` on
the local port printed by the server. The server serves the whole repository.
No build or install is required.

The hill and cube in [meadow.glb](windy-grass/meadow.glb), and the blade roots in
[grass-roots.bin](windy-grass/grass-roots.bin), were exported from
[the tutorial revision](windy-grass/anime-grass-tutorial-revision.blend).
[meadow.json](windy-grass/meadow.json) records the source, coordinate format,
camera, and blade count. The browser draws all 96,049 exported roots with
broader tapered blades, instanced grass, and GPU wind; Blender's Geometry Nodes
and EEVEE shaders are adapted in JavaScript, not baked into the GLB. The sky
and audio are procedural. The scene is tutorial-inspired, not an exact replica.

The grass animation follows the tutorial transcript's segment reconstruction:
rotate six equal-length segments using identity-to-wind quaternion interpolation,
weight rotation by the spline parameter, then accumulate the segments from each
fixed root. Root-sampled noise uses scale 0.5, no detail octaves, and X travel
of `-5 * time`. The processed wind factor also drives the highlight mix through
the clamped 0.45-to-1 range; stable per-blade random values vary the colors.
Zero breeze restores upright, stationary blades without changing their lengths.
The transcript omits the multiply/multiply-add and rotation-noise strength
values, so this version uses `breeze * (noise * 0.8 + 0.2)` and a 0.35 wobble mix.
The shader uses browser value noise and subtle hue/chroma/value variation,
not bit-identical Blender Noise Texture or Hue Saturation Value nodes.
Grass bypasses cinematic tone mapping to preserve its painted greens. Root
occlusion, broad shade patches, wind-dependent shading, and the cube's cast
shadow provide depth without grass self-shadowing.

Reference: Tawan Sunflower's
[Simple Grass in Blender](https://www.youtube.com/watch?v=F7_btP0Vhzo).
Three.js 0.180.0 and Lucide 0.468.0 are vendored with their licenses in
`windy-grass/vendor/`; only the optional Google Fonts request needs internet.

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

**Jev Country is the exception:** live matching needs a server-side
`POST /api/jev-country` endpoint and a secret Gateway key. GitHub Pages and
static-only hosting cannot execute it. The included Node server is loopback-only
for local development; public deployment needs a backend adapted to the target
host, authentication or abuse protection, and shared rate limits. Do not publish
local environment files. No production backend has been deployed by this change.

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