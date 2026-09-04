/**
 * REFERENCE APP — Calculator.
 *
 * This app exists to exercise every part of the app SDK end-to-end, so future
 * apps can be built by copying it. See APPS.md for the full contract.
 *
 *   api.storage  -> persists the current expression + a small result history
 *   api.window   -> renames the titlebar to show the last result
 *   api.notify   -> pixel toast on error (divide by zero)
 *   api.audio    -> a key-press blip per button, a different tone for "="
 */
registerApp({
  id: "calculator",
  name: "Calc",
  icon: "icon_calculator",
  defaultSize: { w: 180, h: 240 },

  mount(container, api) {
    const KEYS = [
      "7", "8", "9", "/",
      "4", "5", "6", "*",
      "1", "2", "3", "-",
      "0", ".", "=", "+",
      "C",
    ];

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;padding:6px;gap:6px;">
        <div id="calc-display" class="pixel-panel" style="text-align:right;font-size:12px;overflow:hidden;white-space:nowrap;">0</div>
        <div id="calc-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;flex:1;"></div>
        <div id="calc-history" style="font-size:6px;color:var(--palette-text-dim);max-height:36px;overflow-y:auto;"></div>
      </div>
    `;

    const display = container.querySelector("#calc-display");
    const grid = container.querySelector("#calc-grid");
    const historyEl = container.querySelector("#calc-history");

    // ---- state, restored from this app's own storage namespace ----
    let expression = api.storage.get("expression", "");
    let history = api.storage.get("history", []);

    function render() {
      display.textContent = expression || "0";
      historyEl.innerHTML = history
        .slice(-5)
        .reverse()
        .map((h) => `<div>${h}</div>`)
        .join("");
    }

    function persist() {
      api.storage.set("expression", expression);
      api.storage.set("history", history);
    }

    function safeEvaluate(expr) {
      // Only digits/operators ever reach here (buttons are the only input),
      // so a restricted-character check is enough before Function-eval.
      if (!/^[0-9+\-*/.]+$/.test(expr)) throw new Error("bad expression");
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${expr});`)();
    }

    function pressKey(key) {
      if (key === "C") {
        expression = "";
        api.audio.playTone({ freq: 220, type: "triangle", duration: 0.1 });
      } else if (key === "=") {
        try {
          const result = safeEvaluate(expression);
          if (!Number.isFinite(result)) throw new Error("divide by zero");
          history.push(`${expression} = ${result}`);
          expression = String(result);
          api.window.setTitle(`Calc — ${result}`);
          api.audio.playTone({ freq: 660, type: "square", duration: 0.12 });
        } catch (e) {
          api.notify("Cannot evaluate that expression", { kind: "error" });
          api.audio.playTone({ freq: 120, type: "sawtooth", duration: 0.2 });
          expression = "";
        }
      } else {
        expression += key;
        api.audio.playTone({ freq: 440, type: "square", duration: 0.05, gain: 0.08 });
      }
      persist();
      render();
    }

    for (const key of KEYS) {
      const btn = document.createElement("button");
      btn.className = "pixel-btn";
      btn.textContent = key;
      if (key === "=") btn.style.gridColumn = "span 1";
      btn.addEventListener("click", () => pressKey(key));
      grid.appendChild(btn);
    }

    render();
  },
});
