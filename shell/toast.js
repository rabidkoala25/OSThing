/** Pixel toast notifications, surfaced to apps as `api.notify(message, opts)`. */
(function () {
  window.WebOS = window.WebOS || {};

  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement("div");
    container.id = "toast-container";
    document.getElementById("os-root").appendChild(container);
    return container;
  }

  window.WebOS.Toast = {
    /**
     * @param {string} message Text to show.
     * @param {{ kind?: 'info'|'error', duration?: number }} [opts]
     */
    show(message, opts = {}) {
      const { kind = "info", duration = 3000 } = opts;
      const el = document.createElement("div");
      el.className = "webos-toast" + (kind === "error" ? " toast-error" : "");
      el.textContent = message;
      ensureContainer().appendChild(el);
      setTimeout(() => el.remove(), duration);
    },
  };
})();
