/**
 * FAIL LOUDLY: renders a visible pixel error banner on the desktop whenever
 * manifest.json references something missing (a sprite, an app entry, a
 * script that never calls registerApp, etc). This is intentional — a future
 * Claude Code session must SEE what it got wrong, never just a console.error.
 */
(function () {
  window.WebOS = window.WebOS || {};

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  const messages = [];

  function render() {
    let el = document.getElementById("webos-error-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "webos-error-banner";
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="webos-error-title">⚠ WEBOS CONFIG ERROR — fix and refresh</div>' +
      messages.map((m) => `<div class="webos-error-line">${escapeHtml(m)}</div>`).join("");
  }

  window.WebOS.Errors = {
    /** @param {string} message Human-readable description of what is broken and where. */
    report(message) {
      console.error("[WebOS]", message);
      messages.push(message);
      render();
    },
    /** @returns {string[]} All error messages reported so far, in order. */
    list() {
      return messages.slice();
    },
  };
})();
