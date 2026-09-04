/**
 * Draggable/resizable window chrome. Window position/size use CSS pixels
 * inside #os-root, which is scaled as a whole via `zoom` — so no manual
 * scale math is needed here for drag/resize deltas.
 */
(function () {
  window.WebOS = window.WebOS || {};

  let zTop = 10;
  let cascadeOffset = 0;
  /** @type {Map<string, { el: HTMLElement, appId: string, title: string, icon: string, minimized: boolean }>} */
  const windows = new Map();

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent("webos:windows-changed"));
  }

  function bringToFront(win) {
    zTop += 1;
    win.el.style.zIndex = String(zTop);
    for (const w of windows.values()) w.el.classList.toggle("is-focused", w === win);
    dispatchChange();
  }

  function wireDrag(win) {
    const titlebar = win.el.querySelector(".webos-titlebar");
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = win.el.offsetLeft;
      startTop = win.el.offsetTop;
      bringToFront(win);
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.el.style.left = `${Math.max(0, startLeft + dx)}px`;
      win.el.style.top = `${Math.max(0, startTop + dy)}px`;
    });

    window.addEventListener("mouseup", () => {
      dragging = false;
    });

    win.el.addEventListener("mousedown", () => bringToFront(win));
  }

  function wireResize(win) {
    const handle = win.el.querySelector(".webos-resize-handle");
    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    handle.addEventListener("mousedown", (e) => {
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = win.el.offsetWidth;
      startH = win.el.offsetHeight;
      bringToFront(win);
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("mousemove", (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.el.style.width = `${Math.max(120, startW + dx)}px`;
      win.el.style.height = `${Math.max(90, startH + dy)}px`;
    });

    window.addEventListener("mouseup", () => {
      resizing = false;
    });
  }

  /**
   * @param {{ id: string, title: string, iconPath: string, width: number, height: number }} opts
   * @returns {{ el: HTMLElement, controller: object }}
   */
  function createWindow(opts) {
    const { id, title, iconPath, width, height } = opts;

    const el = document.createElement("div");
    el.className = "webos-window";
    el.dataset.appId = id;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    cascadeOffset = (cascadeOffset + 24) % 160;
    el.style.left = `${60 + cascadeOffset}px`;
    el.style.top = `${40 + cascadeOffset * 0.6}px`;

    const closeSprite = window.WebOS.Sprites.path("btn_close");
    const minSprite = window.WebOS.Sprites.path("btn_minimize");

    el.innerHTML = `
      <div class="webos-titlebar">
        ${iconPath ? `<img class="webos-titleicon" src="${iconPath}" alt="">` : ""}
        <span class="webos-titletext"></span>
        <button class="webos-btn-min" style="background-image:url('${minSprite}')" title="Minimize"></button>
        <button class="webos-btn-close" style="background-image:url('${closeSprite}')" title="Close"></button>
      </div>
      <div class="webos-windowbody"></div>
      <div class="webos-resize-handle"></div>
    `;
    el.querySelector(".webos-titletext").textContent = title;

    document.getElementById("desktop").appendChild(el);

    const win = { el, appId: id, title, icon: iconPath, minimized: false };
    windows.set(id, win);

    wireDrag(win);
    wireResize(win);
    bringToFront(win);

    el.querySelector(".webos-btn-close").addEventListener("click", () => closeWindow(id));
    el.querySelector(".webos-btn-min").addEventListener("click", () => minimizeWindow(id));

    const controller = {
      setTitle(newTitle) {
        win.title = String(newTitle);
        el.querySelector(".webos-titletext").textContent = win.title;
        dispatchChange();
      },
      resize(w, h) {
        el.style.width = `${Math.max(120, w)}px`;
        el.style.height = `${Math.max(90, h)}px`;
      },
      getSize() {
        return { w: el.offsetWidth, h: el.offsetHeight };
      },
      close() {
        closeWindow(id);
      },
      focus() {
        restoreWindow(id);
        bringToFront(win);
      },
      onClose(cb) {
        closeCallbacks.set(id, cb);
      },
    };

    dispatchChange();
    return { el, controller };
  }

  function minimizeWindow(id) {
    const win = windows.get(id);
    if (!win) return;
    win.minimized = true;
    win.el.classList.add("is-minimized");
    dispatchChange();
  }

  function restoreWindow(id) {
    const win = windows.get(id);
    if (!win) return;
    win.minimized = false;
    win.el.classList.remove("is-minimized");
    bringToFront(win);
  }

  function toggleMinimize(id) {
    const win = windows.get(id);
    if (!win) return;
    if (win.minimized) restoreWindow(id);
    else minimizeWindow(id);
  }

  function closeWindow(id) {
    const win = windows.get(id);
    if (!win) return;
    win.el.remove();
    windows.delete(id);
    const onClose = closeCallbacks.get(id);
    if (onClose) onClose();
    closeCallbacks.delete(id);
    dispatchChange();
  }

  const closeCallbacks = new Map();

  window.WebOS.WindowManager = {
    createWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMinimize,
    focusWindow(id) {
      restoreWindow(id);
    },
    /** @returns {{ id: string, title: string, icon: string, minimized: boolean }[]} */
    list() {
      return Array.from(windows.entries()).map(([id, w]) => ({
        id,
        title: w.title,
        icon: w.icon,
        minimized: w.minimized,
      }));
    },
    isOpen(id) {
      return windows.has(id);
    },
    /** Registers a callback fired once when the given window id closes. */
    onClose(id, cb) {
      closeCallbacks.set(id, cb);
    },
  };
})();
