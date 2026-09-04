/**
 * Settings — wallpaper picker (sourced from the sprite manifest), integer
 * UI scale, and a theme palette. Uses api.system, the narrow SDK surface
 * for OS-wide preferences (see APPS.md — apps normally only touch their
 * own storage namespace; this is the one deliberate exception).
 */
registerApp({
  id: "settings",
  name: "Settings",
  icon: "icon_settings",
  defaultSize: { w: 280, h: 260 },

  mount(container, api) {
    const THEMES = [
      { name: "Violet Night", palette: { bg: "#201e3a", "bg-alt": "#2c2a54", window: "#38355e", "window-title": "#4a4680", accent: "#7c6fd6" } },
      { name: "Terminal Green", palette: { bg: "#0c1a0c", "bg-alt": "#132613", window: "#1c3a1c", "window-title": "#245024", accent: "#4ade4a" } },
      { name: "Sunset", palette: { bg: "#2a1420", "bg-alt": "#3a1c2c", window: "#4a2438", "window-title": "#6a2c48", accent: "#e8845c" } },
      { name: "Slate Blue", palette: { bg: "#141824", "bg-alt": "#1e2436", window: "#28304a", "window-title": "#344066", accent: "#5ca0e8" } },
    ];

    container.innerHTML = `
      <div style="padding:8px;display:flex;flex-direction:column;gap:10px;">
        <div>
          <div style="margin-bottom:4px;">wallpaper</div>
          <div id="wallpaper-list" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
        </div>
        <div>
          <div style="margin-bottom:4px;">ui scale</div>
          <div id="scale-buttons" style="display:flex;gap:4px;"></div>
        </div>
        <div>
          <div style="margin-bottom:4px;">theme</div>
          <div id="theme-list" style="display:flex;flex-direction:column;gap:4px;"></div>
        </div>
      </div>
    `;

    // ---- wallpaper ----
    const wallpaperList = container.querySelector("#wallpaper-list");
    const sprites = api.system.listWallpaperSprites();
    if (sprites.length === 0) {
      wallpaperList.textContent = "no wallpaper sprites in manifest";
    }
    sprites.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "pixel-btn";
      btn.style.cssText = "width:40px;height:40px;padding:0;background-image:url('" + s.path + "');background-size:cover;";
      btn.title = s.name;
      btn.addEventListener("click", () => {
        api.system.setWallpaper(s.name);
        api.notify(`Wallpaper set to ${s.name}`);
      });
      wallpaperList.appendChild(btn);
    });

    // ---- ui scale ----
    const scaleButtons = container.querySelector("#scale-buttons");
    const currentScale = api.system.getUiScale();
    [2, 3, 4].forEach((n) => {
      const btn = document.createElement("button");
      btn.className = "pixel-btn";
      btn.textContent = `${n}x`;
      btn.style.opacity = n === currentScale ? "1" : "0.6";
      btn.addEventListener("click", () => {
        api.system.setUiScale(n);
        api.notify(`UI scale set to ${n}x`);
        Array.from(scaleButtons.children).forEach((b) => (b.style.opacity = "0.6"));
        btn.style.opacity = "1";
      });
      scaleButtons.appendChild(btn);
    });

    // ---- theme ----
    const themeList = container.querySelector("#theme-list");
    THEMES.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "pixel-btn";
      btn.style.cssText = `text-align:left;background:${t.palette["window-title"]};`;
      btn.textContent = t.name;
      btn.addEventListener("click", () => {
        api.system.setTheme(t.palette);
        api.notify(`Theme set to ${t.name}`);
      });
      themeList.appendChild(btn);
    });
  },
});
