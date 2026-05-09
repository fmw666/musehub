# EvoMap Hero — Halftone Logo + Stable Fluids

A zero-build static landing page that renders the EvoMap emblem as an
interactive **halftone dot field**, animated by a real-time **GPU fluid
simulation** that reacts to the cursor. 11 visual variants ship out of the
box, including one (`11 · Video`) that swaps the procedural logo for an
actual `<video>` source — same pipeline, different texture in.

The visual technique is adapted from the
[`antimetal-replica`](../../) reverse-engineer of antimetal.com: a Three.js
`WebGLRenderer` samples a luminance source, breaks it into a grid of dots,
and adds a Stable-Fluids dye field on top. Here we feed that pipeline a
Canvas2D-drawn EvoMap logo (or a video) instead of antimetal's globe.

## Pipeline

```
Canvas2D logo bitmap  ─┐
or HTMLVideoElement   ─┼─►  uShape  ──┐
or procedural logoFrag─┘             │
                                     ├─► displayFrag ─► <canvas>
   pointermove ─► splat ─► fluid RTs ─► uDye ─────────┘
```

- `uShape` is the luminance source. Each grid cell samples it and turns
  brightness into dot size + opacity.
- `uDye` is the fluid simulation's dye buffer. Mouse splats inject dye and
  velocity; vorticity + pressure projection make it swirl.
- The display shader applies a **radial vignette** so dots fade naturally
  toward the corners — the eye stays on the logo.

## File layout

```
design_online/
├── index.html              page shell only — no inline JS
├── README.md               you are here
├── .nojekyll               GitHub Pages: don't ignore _-prefixed files
│
├── styles/
│   ├── index.css           @import entry; all variants load through this
│   ├── base.css            CSS variables (theme tokens) + resets + fonts
│   ├── hero.css            hero stage, gradient backdrop, rings, canvas mount
│   ├── content.css         title, quote, CTA pill, hint, stats, hidden-state
│   ├── toggle.css          top-right "Content" visibility toggle
│   ├── switcher.css        bottom-right variant switcher panel
│   └── responsive.css      mobile/tablet overrides
│
├── src/
│   ├── main.js             app entry: boot, switcher, keyboard, CTA copy
│   │
│   ├── hero/               WebGL pipeline
│   │   ├── createHero.js   createDottedVideo() — assembles renderer, RTs,
│   │   │                   materials, animation loop, observers, cleanup
│   │   ├── defaultConfig.js  defaultShaderConfig + GRID_LAYOUTS map
│   │   ├── logoMask.js     buildLogoMaskTexture() — Canvas2D EvoMap emblem
│   │   │                   on a 1024² bitmap → THREE.CanvasTexture
│   │   └── videoSource.js  createVideoSource()/teardownVideoSource() —
│   │                       <video> → THREE.VideoTexture wiring
│   │
│   ├── shaders/            GLSL strings (split by purpose)
│   │   ├── index.js        re-export hub — every consumer imports from here
│   │   ├── common.js       baseVert + fluidVert
│   │   ├── fluid.js        clear / splat / advect / divergence / curl /
│   │   │                   vorticity / pressure / gradientSubtract
│   │   ├── logo.js         logoFrag — procedural SDF fallback emblem
│   │   └── display.js      displayFrag — halftone + radial vignette
│   │
│   └── variants/
│       ├── index.js        aggregates and exports `variants` array
│       ├── shared.js       baseShape + NODES_REFERENCE (geometry baseline)
│       └── themes/
│           ├── 01-classic.js   ...   11-video.js
│           one file per theme — shaderConfig + theme tokens + copy
│
└── assets/
    ├── logo-mask.png       (~57 KB)  reserved; current build uses Canvas2D
    └── video.mp4           (~11 MB)  source video for theme 11
```

### What lives where, in one sentence each

| Concern                                  | File                              |
| ---------------------------------------- | --------------------------------- |
| DOM skeleton                             | `index.html`                      |
| App boot + switcher + keyboard + CTA     | `src/main.js`                     |
| WebGL pipeline + render loop + cleanup   | `src/hero/createHero.js`          |
| Default config (one source of truth)     | `src/hero/defaultConfig.js`       |
| Drawing the EvoMap emblem (Canvas2D)     | `src/hero/logoMask.js`            |
| Hooking a `<video>` as luminance source  | `src/hero/videoSource.js`         |
| All GLSL strings                         | `src/shaders/*.js`                |
| Visual themes                            | `src/variants/themes/*.js`        |
| Theme tokens, layout, widgets            | `styles/*.css`                    |

## Running

Zero-build static project. Just serve the folder over HTTP (ES module
imports won't work over `file://`):

```bash
# Python
python -m http.server 5173

# or Node
npx serve .
```

Then open <http://localhost:5173>.

## Adding a new variant

1. Drop a new file in `src/variants/themes/`, copying the shape of an
   existing one (`01-classic.js` is the simplest reference).
2. Open `src/variants/index.js`, add an `import`, and append it to the
   `variants` array. Order in the array drives both the UI and the
   keyboard shortcut number.
3. (Optional) update the visible total in `index.html`'s switcher — actually,
   `src/main.js` already sets it dynamically from `variants.length`, so this
   is automatic.

That's the whole change surface. No build step, no bundler, no config.

## Tweakable config

Every field in `src/hero/defaultConfig.js` can be overridden per theme by
setting it in that theme's `shaderConfig`. The most-tuned dials:

| field                | default     | meaning                                      |
| -------------------- | ----------- | -------------------------------------------- |
| `dotSize`/`dotMargin`| `8` / `0`   | grid cell = sum of these                     |
| `minDotSize`         | `1`         | smallest dot when luminance ≈ 0              |
| `dotColor`           | `"#e0f6ff"` | base dot color                               |
| `gridLayout`         | `"straight"`| `"straight"` / `"radial"` / `"alternating-grid"` |
| `gamma`              | `0.9`       | applied to the shape before halftone         |
| `animSpeed`          | `4`         | per-dot pulsing animation                    |
| `disableFluid`       | `false`     | turn off the fluid layer entirely (newspaper, frost) |
| `fluidStrength`      | `0.15`      | dye intensity in display shader              |
| `fluidCurl`          | `100`       | vorticity-confinement strength               |
| `falloffStrength`    | `0.95`      | radial vignette strength (0 = off)           |
| `falloffRadius`      | `0.32`      | protected centre core (no fade inside)       |
| `falloffEnd`         | `1.05`      | distance where the fade reaches max          |
| `shapeScale`         | `1.25`      | >1 shrinks the visible logo                  |
| `videoSource`        | `null`      | path to mp4 — bypasses the Canvas2D mask     |

## Browser requirements

- WebGL2 (Chrome 56+, Firefox 51+, Safari 15+).
- The fluid grid uses `THREE.HalfFloatType` RTs; Three.js auto-detects the
  required `EXT_color_buffer_float` extension.

## Debugging

- `?peek=1` pins the raw 1024² Canvas2D logo bitmap to the top-left of the
  page — useful for verifying the mask before halftone sampling.
- `?nomask` forces the procedural SDF fallback (`shaders/logo.js`) instead
  of the Canvas2D mask.
- `window.__hero` holds the current hero instance after boot — handy for
  poking uniforms from devtools, e.g.
  `window.__hero.displayMaterial.uniforms.falloffStrength.value = 0`.

## Credits

- Stable-Fluids algorithm: Jos Stam, *Real-Time Fluid Dynamics for Games*
  (GDC 2003) and Mark Harris, *Fast Fluid Dynamics Simulation on the GPU*
  (GPU Gems, 2004).
- Halftone display + fluid wiring: adapted from the antimetal.com hero
  reverse-engineer in `../antimetal-replica/`.
