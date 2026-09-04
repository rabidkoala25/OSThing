/**
 * Namespaced localStorage. Every app gets a storage object that can only
 * read/write keys under its own `webos:<appId>:` prefix — this is the
 * mechanism that enforces the "never write outside your storage namespace"
 * invariant (see APPS.md).
 */
(function () {
  window.WebOS = window.WebOS || {};

  const ROOT_PREFIX = "webos:";

  /**
   * @param {string} appId Namespace segment, e.g. an app id or "shell".
   * @returns {{
   *   get: (key: string, fallback?: any) => any,
   *   set: (key: string, value: any) => void,
   *   remove: (key: string) => void,
   *   keys: () => string[],
   *   clear: () => void
   * }}
   */
  function makeStorage(appId) {
    const prefix = `${ROOT_PREFIX}${appId}:`;

    return {
      /** Read a JSON-decoded value, or `fallback` if unset/undecodable. */
      get(key, fallback = null) {
        const raw = localStorage.getItem(prefix + key);
        if (raw === null) return fallback;
        try {
          return JSON.parse(raw);
        } catch (_e) {
          return raw;
        }
      },
      /** JSON-encode and store `value` under `key`. */
      set(key, value) {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      /** Remove a single key. */
      remove(key) {
        localStorage.removeItem(prefix + key);
      },
      /** List all key names (without the namespace prefix) this app has set. */
      keys() {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) out.push(k.slice(prefix.length));
        }
        return out;
      },
      /** Remove every key belonging to this namespace. */
      clear() {
        this.keys().forEach((k) => this.remove(k));
      },
    };
  }

  window.WebOS.makeAppStorage = makeStorage;
  /** Storage reserved for the shell itself (wallpaper, ui-scale, window positions, theme). */
  window.WebOS.shellStorage = makeStorage("shell");
})();
