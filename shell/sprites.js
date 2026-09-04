/**
 * Loads /assets/sprites/manifest.json and resolves sprite names to paths.
 * ALL art (icons, chrome, cursor, wallpaper, boot logo) must be resolved
 * through this — never hardcode a sprite path in shell or app code.
 */
(function () {
  window.WebOS = window.WebOS || {};

  /** @typedef {{ name: string, path: string, width: number, height: number }} SpriteMeta */

  const map = new Map();

  window.WebOS.Sprites = {
    /** Raw name -> SpriteMeta map, populated after load(). */
    map,

    /** Fetches and parses assets/sprites/manifest.json. Reports (does not throw) on failure. */
    async load() {
      let res;
      try {
        res = await fetch("assets/sprites/manifest.json");
      } catch (e) {
        window.WebOS.Errors.report(`Could not fetch assets/sprites/manifest.json: ${e.message}`);
        return;
      }
      if (!res.ok) {
        window.WebOS.Errors.report(`assets/sprites/manifest.json returned HTTP ${res.status}`);
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch (e) {
        window.WebOS.Errors.report(`assets/sprites/manifest.json is not valid JSON: ${e.message}`);
        return;
      }
      const sprites = Array.isArray(data.sprites) ? data.sprites : [];
      for (const s of sprites) {
        if (!s || !s.name || !s.path) {
          window.WebOS.Errors.report(`Sprite manifest entry missing name/path: ${JSON.stringify(s)}`);
          continue;
        }
        map.set(s.name, s);
      }
    },

    /**
     * @param {string} name Sprite name as declared in the manifest.
     * @returns {SpriteMeta|null} The sprite metadata, or null (and a loud error) if missing.
     */
    resolve(name) {
      const s = map.get(name);
      if (!s) {
        window.WebOS.Errors.report(`Missing sprite "${name}" — add it to assets/sprites/manifest.json`);
        return null;
      }
      return s;
    },

    /**
     * @param {string} name Sprite name as declared in the manifest.
     * @returns {string} The sprite's path, or an empty string if missing.
     */
    path(name) {
      const s = this.resolve(name);
      return s ? s.path : "";
    },
  };
})();
