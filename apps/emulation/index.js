/**
 * Emulator — embeds EmulatorJS (loaded from its public CDN) and plays ROMs
 * the user drags in from their own machine. No ROMs are bundled or shipped.
 * System-agnostic: the user picks the core that matches the ROM they drop.
 */
registerApp({
  id: "emulation",
  name: "Emulator",
  icon: "icon_emulation",
  defaultSize: { w: 360, h: 320 },

  mount(container, api) {
    const CORES = [
      { value: "nes", label: "NES" },
      { value: "snes", label: "SNES" },
      { value: "gb", label: "Game Boy" },
      { value: "gba", label: "GBA" },
      { value: "segaMD", label: "Sega Genesis" },
      { value: "psx", label: "PlayStation" },
    ];

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;gap:4px;padding:6px;align-items:center;">
          <select id="core-select" class="pixel-select"></select>
          <span id="rom-status" style="font-size:7px;flex:1;">drop a ROM below</span>
        </div>
        <div id="drop-zone" class="pixel-panel" style="margin:0 6px 6px;flex:1;display:flex;align-items:center;justify-content:center;text-align:center;font-size:7px;overflow:hidden;position:relative;">
          <span id="drop-hint">drag a ROM file here<br>(matches the core selected above)</span>
          <div id="emu-mount" style="position:absolute;inset:0;"></div>
        </div>
      </div>
    `;

    const coreSelect = container.querySelector("#core-select");
    CORES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.value;
      opt.textContent = c.label;
      coreSelect.appendChild(opt);
    });
    coreSelect.value = api.storage.get("lastCore", "nes");
    coreSelect.addEventListener("change", () => api.storage.set("lastCore", coreSelect.value));

    const dropZone = container.querySelector("#drop-zone");
    const dropHint = container.querySelector("#drop-hint");
    const emuMount = container.querySelector("#emu-mount");
    const status = container.querySelector("#rom-status");

    let romUrl = null;
    let loaderScript = null;

    function loadRom(file) {
      if (romUrl) URL.revokeObjectURL(romUrl);
      romUrl = URL.createObjectURL(file);
      status.textContent = `loaded: ${file.name}`;
      api.window.setTitle(`Emulator — ${file.name}`);
      dropHint.style.display = "none";
      emuMount.innerHTML = '<div id="game"></div>';

      // EmulatorJS reads these globals when its loader script runs.
      window.EJS_player = "#game";
      window.EJS_core = coreSelect.value;
      window.EJS_gameUrl = romUrl;
      window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
      window.EJS_startOnLoaded = true;

      if (loaderScript) loaderScript.remove();
      loaderScript = document.createElement("script");
      loaderScript.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
      loaderScript.onerror = () => {
        api.notify("Could not reach the EmulatorJS CDN — check your connection", { kind: "error" });
        status.textContent = "emulator core failed to load";
      };
      document.body.appendChild(loaderScript);
    }

    ["dragover", "dragenter"].forEach((evt) =>
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--palette-accent)";
      })
    );
    ["dragleave", "dragend"].forEach((evt) =>
      dropZone.addEventListener(evt, () => {
        dropZone.style.borderColor = "";
      })
    );
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "";
      const file = (e.dataTransfer.files || [])[0];
      if (!file) return;
      loadRom(file);
    });

    api.window.onClose(() => {
      if (romUrl) URL.revokeObjectURL(romUrl);
      if (loaderScript) loaderScript.remove();
    });
  },
});
