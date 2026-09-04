/** Taskbar: start button, open-app tray, and clock. */
(function () {
  window.WebOS = window.WebOS || {};

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function renderClock() {
    const el = document.getElementById("taskbar-clock");
    const now = new Date();
    el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function renderTray() {
    const tray = document.getElementById("taskbar-tray");
    tray.innerHTML = "";
    for (const win of window.WebOS.WindowManager.list()) {
      const item = document.createElement("div");
      item.className = "taskbar-item" + (win.minimized ? "" : " is-active");
      item.innerHTML = `${win.icon ? `<img src="${win.icon}" alt="">` : ""}<span></span>`;
      item.querySelector("span").textContent = win.title;
      item.addEventListener("click", () => window.WebOS.WindowManager.toggleMinimize(win.id));
      tray.appendChild(item);
    }
  }

  window.WebOS.Taskbar = {
    init() {
      renderClock();
      renderTray();
      setInterval(renderClock, 15000);
      document.addEventListener("webos:windows-changed", renderTray);

      const startBtn = document.getElementById("start-button");
      startBtn.style.backgroundImage = `url('${window.WebOS.Sprites.path("btn_start")}')`;
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.WebOS.StartMenu.toggle();
      });
    },
  };
})();
