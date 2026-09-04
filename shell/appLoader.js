/**
 * Loads apps/manifest.json, loads each app's entry script (a plain classic
 * <script> — apps call the global registerApp() when they're ready), and
 * launches app windows on request. This is the ONLY place that knows how to
 * turn a manifest entry into a running window — apps never see each other.
 */
(function () {
  window.WebOS = window.WebOS || {};

  /** @type {Map<string, object>} appId -> config passed to registerApp() */
  const registry = new Map();
  /** @type {object[]} raw entries from apps/manifest.json */
  let manifestApps = [];

  window.WebOS.Apps = {
    registry,

    /** @returns {object[]} The raw list of app entries from apps/manifest.json. */
    getManifest() {
      return manifestApps;
    },

    async loadManifest() {
      let res;
      try {
        res = await fetch("apps/manifest.json");
      } catch (e) {
        window.WebOS.Errors.report(`Could not fetch apps/manifest.json: ${e.message}`);
        return;
      }
      if (!res.ok) {
        window.WebOS.Errors.report(`apps/manifest.json returned HTTP ${res.status}`);
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch (e) {
        window.WebOS.Errors.report(`apps/manifest.json is not valid JSON: ${e.message}`);
        return;
      }
      manifestApps = Array.isArray(data.apps) ? data.apps : [];
    },

    async loadAll() {
      for (const appMeta of manifestApps) {
        await this.loadOne(appMeta);
      }
    },

    async loadOne(appMeta) {
      if (!appMeta || !appMeta.id) {
        window.WebOS.Errors.report(`apps/manifest.json has an entry with no "id": ${JSON.stringify(appMeta)}`);
        return;
      }
      if (appMeta.icon && !window.WebOS.Sprites.map.has(appMeta.icon)) {
        window.WebOS.Errors.report(
          `App "${appMeta.id}" references missing sprite icon "${appMeta.icon}" — add it to assets/sprites/manifest.json`
        );
      }
      if (!appMeta.entry) {
        window.WebOS.Errors.report(`App "${appMeta.id}" has no "entry" script path in apps/manifest.json`);
        return;
      }

      let scriptFailed = false;
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = appMeta.entry;
        script.onload = resolve;
        script.onerror = () => {
          scriptFailed = true;
          window.WebOS.Errors.report(`App "${appMeta.id}" failed to load script "${appMeta.entry}" (404 or syntax error)`);
          resolve();
        };
        document.head.appendChild(script);
      });

      if (!scriptFailed && !registry.has(appMeta.id)) {
        window.WebOS.Errors.report(
          `App "${appMeta.id}" script loaded but never called registerApp({ id: "${appMeta.id}", ... })`
        );
      }
    },

    /**
     * Opens (or focuses, if already open) the window for the given app id.
     * @param {string} id
     */
    launch(id) {
      const config = registry.get(id);
      const meta = manifestApps.find((a) => a.id === id);

      if (!config) {
        window.WebOS.Errors.report(`Cannot launch "${id}" — no app registered with that id`);
        return;
      }

      if (window.WebOS.WindowManager.isOpen(id)) {
        window.WebOS.WindowManager.focusWindow(id);
        return;
      }

      const size = config.defaultSize || (meta && meta.defaultSize) || { w: 300, h: 220 };
      const iconPath = config.icon ? window.WebOS.Sprites.path(config.icon) : "";

      const { el, controller } = window.WebOS.WindowManager.createWindow({
        id,
        title: config.name || id,
        iconPath,
        width: size.w,
        height: size.h,
      });

      const sdk = window.WebOS.createSDK(id, controller);
      const body = el.querySelector(".webos-windowbody");

      try {
        config.mount(body, sdk);
      } catch (e) {
        window.WebOS.Errors.report(`App "${id}" threw during mount(): ${e.message}`);
      }
    },
  };

  /**
   * Called by app entry scripts to register themselves with the shell.
   * @param {{
   *   id: string,
   *   name: string,
   *   icon: string,
   *   defaultSize?: { w: number, h: number },
   *   mount: (container: HTMLElement, api: object) => void
   * }} config
   */
  window.registerApp = function registerApp(config) {
    if (!config || !config.id) {
      window.WebOS.Errors.report("registerApp() was called without an id");
      return;
    }
    if (typeof config.mount !== "function") {
      window.WebOS.Errors.report(`App "${config.id}" registered without a mount(container, api) function`);
      return;
    }
    registry.set(config.id, config);
  };
})();
