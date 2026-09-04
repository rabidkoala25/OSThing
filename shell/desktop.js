/** Builds desktop icons from apps/manifest.json and applies wallpaper/scale. */
(function () {
  window.WebOS = window.WebOS || {};

  function buildIcons() {
    const container = document.getElementById("desktop-icons");
    container.innerHTML = "";
    for (const meta of window.WebOS.Apps.getManifest()) {
      if (!window.WebOS.Apps.registry.has(meta.id)) continue; // failed to load; error already shown

      const iconPath = meta.icon ? window.WebOS.Sprites.path(meta.icon) : "";
      const el = document.createElement("div");
      el.className = "desktop-icon";
      el.tabIndex = 0;
      el.innerHTML = `
        ${iconPath ? `<img src="${iconPath}" alt="">` : ""}
        <span></span>
      `;
      el.querySelector("span").textContent = meta.name || meta.id;
      const open = () => window.WebOS.Apps.launch(meta.id);
      el.addEventListener("dblclick", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") open();
      });
      container.appendChild(el);
    }
  }

  /** Applies wallpaper sprite, integer UI scale, and theme palette from shell storage. */
  function applySettings() {
    const store = window.WebOS.shellStorage;
    const wallpaperName = store.get("wallpaper", "wallpaper_tile");
    const scale = store.get("uiScale", 2);
    const theme = store.get("theme", null);

    const wallpaperPath = window.WebOS.Sprites.path(wallpaperName);
    // Resolve to an absolute URL: a relative url() assigned to a CSS custom
    // property is resolved relative to the STYLESHEET that consumes it
    // (shell/styles.css), not the document, so a bare relative path 404s.
    const wallpaperAbsUrl = wallpaperPath ? new URL(wallpaperPath, document.baseURI).href : "";
    document.getElementById("desktop").style.setProperty(
      "--wallpaper-url",
      wallpaperAbsUrl ? `url('${wallpaperAbsUrl}')` : "none"
    );

    const validScale = [2, 3, 4].includes(scale) ? scale : 2;
    document.getElementById("os-root").style.setProperty("--ui-scale", String(validScale));

    if (theme) {
      const root = document.getElementById("os-root").style;
      for (const [key, value] of Object.entries(theme)) {
        root.setProperty(`--palette-${key}`, value);
      }
    }
  }

  window.WebOS.Desktop = {
    init() {
      applySettings();
      buildIcons();
    },
    refresh() {
      applySettings();
      buildIcons();
    },
  };
})();
