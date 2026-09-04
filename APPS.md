# Adding an app to PixelOS

This is the single source of truth for adding a new app. It assumes you
(a future Claude Code session, most likely) have zero prior context on this
repo. Read this file top to bottom before touching anything.

PixelOS is a pixel-art desktop shell. Apps are self-contained modules that
register themselves with the shell at load time. The shell (window manager,
taskbar, boot sequence, desktop icons, start menu) never imports or knows
about any individual app — it only reads `apps/manifest.json` and calls
`registerApp()`. **You will never need to touch shell code to add an app.**

---

## 1. The `registerApp` contract

Every app's entry script calls this exactly once, synchronously, at the top
level (it's a plain global function — no imports, no build step):

```js
registerApp({
  id: "my-app",              // must exactly match the "id" in apps/manifest.json
  name: "My App",            // display name (taskbar, start menu, titlebar)
  icon: "icon_my_app",       // a sprite NAME from assets/sprites/manifest.json
  defaultSize: { w: 240, h: 200 }, // initial window size in CSS px
  mount(container, api) {
    // container: an empty <div> that IS the window body. Build your UI here.
    // api: the SDK — see section 2.
  },
});
```

`mount()` is called once, when the user opens the app (double-clicks the
desktop icon or picks it from the start menu). There is no `unmount` — use
`api.window.onClose()` (below) to clean up timers/intervals/object URLs.

Only one window per app id is supported. If the app is already open,
clicking its icon again just focuses the existing window.

---

## 2. The SDK (`api`)

Full typed signatures live in [`sdk.d.ts`](sdk.d.ts) — every method is also
JSDoc'd at its source in `shell/sdk.js`. Summary:

### `api.storage`
Namespaced localStorage. Your app can only read/write its own keys — they're
stored under `webos:<your-app-id>:*` automatically, so you never need to
prefix anything yourself.

```js
api.storage.set("todos", [{ text: "hi", done: false }]);
api.storage.get("todos", []);   // second arg is the fallback if unset
api.storage.remove("todos");
api.storage.keys();             // -> ["todos", ...]
api.storage.clear();            // wipes every key this app owns
```

### `api.window`
Controls for the window your app is running in.

```js
api.window.setTitle("My App — 3 items");
api.window.resize(300, 240);
api.window.getSize();           // -> { w, h }
api.window.focus();
api.window.close();
api.window.onClose(() => { /* clear intervals, revoke object URLs, etc */ });
```

### `api.notify(message, opts?)`
Pixel toast notification, top-right of the desktop.

```js
api.notify("Saved!");
api.notify("Something broke", { kind: "error", duration: 4000 });
```

### `api.audio`
Shared Web Audio context — **never create your own `AudioContext`**, reuse
this one.

```js
api.audio.getContext();                                  // -> AudioContext
api.audio.playTone({ freq: 440, type: "square", duration: 0.15, gain: 0.15 });
api.audio.playNoise({ duration: 0.1, gain: 0.1 });
api.audio.createAnalyser();                               // -> AnalyserNode (fftSize 64)
```

### `api.sprite(name)`
Resolves a sprite name to its path. **Always** go through this — never
hardcode a path like `"assets/sprites/foo.png"` in app code, so art can be
swapped by editing the manifest alone.

```js
img.src = api.sprite("icon_my_app");
```

### `api.system`
Narrow, controlled access to OS-wide preferences (wallpaper, UI scale,
theme). This is the **one deliberate exception** to "apps only touch their
own storage" — most apps will never need it. It exists for apps like
Settings that legitimately need to change shell-wide appearance.

```js
api.system.listWallpaperSprites();  // -> sprites whose name starts with "wallpaper"
api.system.getWallpaper();          // -> sprite name
api.system.setWallpaper("wallpaper_tile");
api.system.getUiScale();            // -> 2 | 3 | 4
api.system.setUiScale(3);           // non-integer/out-of-range silently clamps to 2
api.system.getTheme();              // -> palette object | null
api.system.setTheme({ accent: "#ff8800", ... });
```

---

## 3. Minimal app template

Copy this into `apps/<your-id>/index.js`:

```js
registerApp({
  id: "your-id",
  name: "Your App",
  icon: "icon_your_app",
  defaultSize: { w: 240, h: 200 },

  mount(container, api) {
    container.innerHTML = `
      <div style="padding:8px;">
        <button id="btn" class="pixel-btn">click me</button>
        <div id="count">0</div>
      </div>
    `;

    let count = api.storage.get("count", 0);
    const countEl = container.querySelector("#count");
    countEl.textContent = count;

    container.querySelector("#btn").addEventListener("click", () => {
      count += 1;
      api.storage.set("count", count);
      countEl.textContent = count;
      api.audio.playTone({ freq: 520, type: "square", duration: 0.05 });
    });
  },
});
```

`.pixel-btn`, `.pixel-input`, `.pixel-select`, and `.pixel-panel` are shared
CSS classes (defined in `shell/styles.css`) — reuse them so your app matches
the rest of the OS without writing your own chrome styles.

---

## 4. Steps to add an app

1. Create `apps/<id>/index.js` using the template above (or copy
   `apps/calculator/index.js`, the fully-worked reference app — it exercises
   every part of the SDK: storage, window control, notify, and audio).
2. Add one entry to `apps/manifest.json`:
   ```json
   { "id": "<id>", "name": "Display Name", "icon": "icon_<id>", "entry": "apps/<id>/index.js", "defaultSize": { "w": 240, "h": 200 } }
   ```
3. Drop your icon PNG in `assets/sprites/` and add a matching entry to
   `assets/sprites/manifest.json`:
   ```json
   { "name": "icon_<id>", "path": "assets/sprites/icon_<id>.png", "width": 16, "height": 16 }
   ```
   (Any additional sprites your app needs — buttons, custom art — go through
   the same manifest, resolved via `api.sprite(name)`.)
4. Refresh the page. No build step, no restart. If something's wrong, the
   shell will show a loud red error banner across the top of the desktop
   telling you exactly what's missing (see section 6).

---

## 5. Invariants — things a new app must NEVER do

- **Never write outside your storage namespace.** `api.storage` already
  enforces this by construction — don't try to reach `localStorage`
  directly or guess another app's keys.
- **Never block the main thread.** No synchronous loops over large data, no
  `while(true)`. Use `setInterval`/`requestAnimationFrame` and yield.
- **Never assume a fixed window size.** The user can resize your window;
  build layouts with flex/grid, not hardcoded pixel positions.
- **Never hardcode sprite paths.** Always resolve through `api.sprite(name)`
  or, for the wallpaper list, `api.system.listWallpaperSprites()`.
- **Never import from another app, or from shell internals
  (`shell/*.js`, `window.WebOS.*`).** Everything you need is on `api`. If
  you find yourself reaching for `window.WebOS`, you're doing something the
  SDK doesn't support yet — extend the SDK (`shell/sdk.js` + `sdk.d.ts`)
  instead of bypassing it.

---

## 6. Fail loudly — what happens when something's wrong

If `apps/manifest.json` references a sprite that isn't in
`assets/sprites/manifest.json`, or an `entry` script that 404s, or a script
that loads but never calls `registerApp()` with a matching `id`, the shell
does **not** fail silently to the console. It renders a persistent red
banner across the top of the desktop naming exactly what's broken and
where — so you see it immediately, without opening devtools. This is by
design (see `shell/errors.js`); don't remove or suppress it.

---

## 7. The reference app

`apps/calculator/index.js` is a complete, working app that touches every
part of the SDK (storage, window, notify, audio). When in doubt about how a
particular SDK method behaves in practice, read it there first.
