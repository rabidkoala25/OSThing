/**
 * Builds the `api` object passed to every app's mount(container, api).
 * See APPS.md and sdk.d.ts for the full documented contract.
 */
(function () {
  window.WebOS = window.WebOS || {};

  /**
   * @param {string} appId
   * @param {object} windowController From WindowManager.createWindow(...).controller
   * @returns {object} The app SDK ("api" argument to mount()).
   */
  function createSDK(appId, windowController) {
    return {
      storage: window.WebOS.makeAppStorage(appId),
      window: {
        setTitle: (title) => windowController.setTitle(title),
        resize: (w, h) => windowController.resize(w, h),
        close: () => windowController.close(),
        getSize: () => windowController.getSize(),
        focus: () => windowController.focus(),
        onClose: (cb) => windowController.onClose(cb),
      },
      notify: (message, opts) => window.WebOS.Toast.show(message, opts),
      audio: window.WebOS.SharedAudio,
      /**
       * Resolves a sprite name from assets/sprites/manifest.json to its path.
       * Apps must NEVER hardcode sprite paths — always go through this.
       */
      sprite: (name) => window.WebOS.Sprites.path(name),
      /**
       * Narrow, controlled access to OS-wide preferences (wallpaper, UI
       * scale, theme palette). This is the one deliberate exception to the
       * "apps only touch their own storage" rule — it exists so the
       * built-in Settings app (or any future one) can change shell
       * appearance without being handed raw access to shell storage.
       */
      system: {
        listWallpaperSprites: () =>
          Array.from(window.WebOS.Sprites.map.values()).filter((s) => s.name.startsWith("wallpaper")),
        getWallpaper: () => window.WebOS.shellStorage.get("wallpaper", "wallpaper_tile"),
        setWallpaper: (name) => {
          window.WebOS.shellStorage.set("wallpaper", name);
          window.WebOS.Desktop.refresh();
        },
        getUiScale: () => window.WebOS.shellStorage.get("uiScale", 2),
        setUiScale: (n) => {
          const scale = [2, 3, 4].includes(n) ? n : 2;
          window.WebOS.shellStorage.set("uiScale", scale);
          window.WebOS.Desktop.refresh();
        },
        getTheme: () => window.WebOS.shellStorage.get("theme", null),
        setTheme: (theme) => {
          window.WebOS.shellStorage.set("theme", theme);
          window.WebOS.Desktop.refresh();
        },
      },
    };
  }

  window.WebOS.createSDK = createSDK;
})();
