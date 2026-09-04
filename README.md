# PixelOS

A pixel-art-themed WebOS: boot screen → desktop → draggable/resizable
windows → taskbar with clock and open-app tray → start menu. Pure
client-side, no backend, no build step. Everything persists in
`localStorage`.

Deploy to GitHub Pages from the repo root (a `.nojekyll` file is already
present so `/assets` and `/apps` are served as-is) — just push and enable
Pages for the branch, or copy the whole tree into `/docs` if you'd rather
deploy from there.

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed URL. (Opening `index.html` directly via `file://`
generally won't work — browsers block `fetch()` of local JSON manifests
under the `file:` scheme.)

## How it's organized

```
index.html               entry point — wires up #os-root, boot screen, desktop, taskbar
shell/                    the OS shell — window manager, taskbar, boot, app SDK, loaders
  styles.css              all pixel-UI styling, theme CSS variables
  errors.js               fail-loud error banner (see APPS.md §6)
  storage.js              namespaced localStorage
  sprites.js               loads/resolves assets/sprites/manifest.json
  audio.js                shared Web Audio context + tone/noise helpers
  toast.js                pixel toast notifications
  sdk.js                  builds the `api` object handed to every app
  windowManager.js        draggable/resizable window chrome
  appLoader.js            loads apps/manifest.json, registers/launches apps
  desktop.js              desktop icons, wallpaper/scale/theme application
  taskbar.js              clock + open-window tray
  startMenu.js            start menu (generated from the app manifest)
  boot.js                 boot screen timing
  main.js                 orchestrates the boot sequence
apps/
  manifest.json           the list of installed apps (id, name, icon, entry, defaultSize)
  calculator/             REFERENCE APP — exercises the full SDK, copy this to start a new app
  productivity/           "Tasks" — to-do list, sticky notes, pomodoro timer
  music/                  "Chiptune" — synth sequencer, drag-and-drop playlist, VU meter
  emulation/               "Emulator" — EmulatorJS wrapper, drag-and-drop ROMs
  settings/                wallpaper / UI scale / theme
assets/sprites/
  manifest.json           array of { name, path, width, height } — the ONLY way art is referenced
  *.png                   placeholder pixel art (see below)
sdk.d.ts                  typed SDK surface (JSDoc + this file = autocomplete from source alone)
APPS.md                   the single source of truth for adding a new app — read this first
```

## Adding a new app

**Read [`APPS.md`](APPS.md).** Short version: drop a folder in `/apps/<id>/`,
add one entry to `apps/manifest.json`, add an icon sprite entry, refresh.
Nothing else changes — the window manager, taskbar, and boot code are fully
decoupled from individual apps and never need editing.

## The sprite manifest

`assets/sprites/manifest.json` is an array of
`{ name, path, width, height }`. All UI art — icons, window-chrome buttons,
cursor, wallpaper, boot logo — is resolved through this manifest by name,
via `api.sprite(name)` in app code (or `WebOS.Sprites.path(name)` in shell
code). **Nothing hardcodes a sprite path.** To add or replace art: drop a
PNG in `assets/sprites/` and add/edit its manifest entry — never edit code.

The placeholder PNGs currently in `assets/sprites/` are simple procedurally
generated pixel shapes (see `scripts/generate_placeholder_sprites.py` if you
want to regenerate them). Replace them
with real art drawn in Pixilart and exported as low-resolution, non-scaled
PNGs — keep the same filenames and manifest dimensions, or update the
manifest entry if you change size.

## Pixel-art rendering rules

- All sprite `<img>`/`<canvas>` elements use `image-rendering: pixelated`
  globally (`shell/styles.css`) — never smoothed, never blurred.
- The whole UI scales via `zoom: var(--ui-scale)` on `#os-root`, restricted
  to integer factors (2x/3x/4x) from Settings. `zoom` (rather than
  `transform: scale`) is used deliberately: it keeps mouse-event
  coordinates aligned to the scaled layout, so window dragging/resizing
  doesn't need manual scale correction. Known caveat: `zoom` support in
  older Firefox releases is limited (Firefox added it in v126 / 2024) — if
  you need to support older Firefox, switch to `transform: scale` plus
  dividing pointer deltas by the scale factor in `shell/windowManager.js`.
- The pixel display font ("Press Start 2P") loads from Google Fonts — the
  one CDN host artifact/GH-Pages CSP allowlists by default. Font smoothing
  is disabled globally.

## Built-in apps

- **Tasks** (`productivity`) — to-do list, sticky notes, pomodoro timer.
- **Chiptune** (`music`) — a small built-in square/triangle/saw arpeggio
  sequencer plus a drag-and-drop playlist for the user's own audio files,
  and a canvas-based pixel VU meter. All sources route through one master
  gain → analyser → speakers bus so the meter reacts to whatever is
  playing.
- **Emulator** (`emulation`) — wraps
  [EmulatorJS](https://emulatorjs.org) loaded from its CDN. The user picks
  a core (NES/SNES/GB/GBA/Genesis/PSX) and drags in their own ROM file; no
  ROM is ever bundled or shipped. System-agnostic by design — add more
  cores by extending the `CORES` list in `apps/emulation/index.js`.
- **Settings** — wallpaper picker (sourced from
  `assets/sprites/manifest.json`, any sprite named `wallpaper*`), UI scale
  (2x/3x/4x), theme palette. Uses the narrow `api.system` SDK surface — see
  APPS.md for why that's the one exception to the storage-namespace rule.
- **Calc** (`calculator`) — the fully-worked **reference app**. Exercises
  every part of the SDK (storage, window control, notify, audio). Copy this
  one when starting a new app.

## Extensibility notes (not implemented, deliberately)

- **`.mod`/`.xm` tracker playback**: the prompt allows wiring in a tracker
  JS lib from a CDN if one is available; none is included here to keep the
  dependency surface at zero beyond EmulatorJS + Google Fonts. To add it,
  load a tracker lib (e.g. via a CDN `<script>` tag) inside
  `apps/music/index.js` and feed its output node into the existing
  `masterGain` bus so it shows up on the VU meter for free.
- **Multiple windows per app**: currently one window per app id (clicking
  an already-open icon just focuses it). If you need multiple instances,
  `shell/windowManager.js` and `shell/appLoader.js` key everything by app
  id — you'd need to generate per-instance ids there.
