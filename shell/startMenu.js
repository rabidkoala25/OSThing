/** Start menu: lists every successfully-registered app, generated from the manifest. */
(function () {
  window.WebOS = window.WebOS || {};

  function render() {
    const menu = document.getElementById("start-menu");
    menu.innerHTML = "";
    for (const meta of window.WebOS.Apps.getManifest()) {
      if (!window.WebOS.Apps.registry.has(meta.id)) continue;
      const iconPath = meta.icon ? window.WebOS.Sprites.path(meta.icon) : "";
      const item = document.createElement("div");
      item.className = "start-menu-item";
      item.innerHTML = `${iconPath ? `<img src="${iconPath}" alt="">` : ""}<span></span>`;
      item.querySelector("span").textContent = meta.name || meta.id;
      item.addEventListener("click", () => {
        window.WebOS.Apps.launch(meta.id);
        close();
      });
      menu.appendChild(item);
    }
  }

  function open() {
    render();
    document.getElementById("start-menu").classList.add("is-open");
  }

  function close() {
    document.getElementById("start-menu").classList.remove("is-open");
  }

  window.WebOS.StartMenu = {
    toggle() {
      const menu = document.getElementById("start-menu");
      if (menu.classList.contains("is-open")) close();
      else open();
    },
    close,
  };

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("start-menu");
    if (!menu) return;
    if (!menu.contains(e.target) && e.target.id !== "start-button") close();
  });
})();
