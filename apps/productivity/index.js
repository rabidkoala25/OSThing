/**
 * Tasks — to-do list, sticky notes, and a pomodoro timer.
 * Everything persists via api.storage, namespaced to this app automatically.
 */
registerApp({
  id: "productivity",
  name: "Tasks",
  icon: "icon_productivity",
  defaultSize: { w: 260, h: 320 },

  mount(container, api) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div id="tabs" style="display:flex;gap:2px;padding:6px 6px 0;"></div>
        <div id="tab-body" style="flex:1;overflow:auto;padding:6px;"></div>
      </div>
    `;
    const tabsEl = container.querySelector("#tabs");
    const body = container.querySelector("#tab-body");

    const TABS = ["Todo", "Notes", "Timer"];
    let active = api.storage.get("activeTab", "Todo");

    function renderTabs() {
      tabsEl.innerHTML = "";
      for (const tab of TABS) {
        const btn = document.createElement("button");
        btn.className = "pixel-btn";
        btn.textContent = tab;
        btn.style.opacity = tab === active ? "1" : "0.6";
        btn.addEventListener("click", () => {
          active = tab;
          api.storage.set("activeTab", active);
          renderTabs();
          renderBody();
        });
        tabsEl.appendChild(btn);
      }
    }

    // ---------------- Todo ----------------
    function renderTodo() {
      const todos = api.storage.get("todos", []);
      body.innerHTML = `
        <div style="display:flex;gap:4px;margin-bottom:6px;">
          <input id="todo-input" class="pixel-input" style="flex:1;" placeholder="new task..." />
          <button id="todo-add" class="pixel-btn">+</button>
        </div>
        <div id="todo-list"></div>
      `;
      const list = body.querySelector("#todo-list");
      todos.forEach((t, i) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid var(--palette-border);";
        row.innerHTML = `
          <input type="checkbox" ${t.done ? "checked" : ""} />
          <span style="flex:1;${t.done ? "text-decoration:line-through;opacity:0.5;" : ""}"></span>
          <button class="pixel-btn" style="padding:2px 6px;">x</button>
        `;
        row.querySelector("span").textContent = t.text;
        row.querySelector("input").addEventListener("change", () => {
          todos[i].done = !todos[i].done;
          api.storage.set("todos", todos);
          renderTodo();
        });
        row.querySelector("button").addEventListener("click", () => {
          todos.splice(i, 1);
          api.storage.set("todos", todos);
          renderTodo();
        });
        list.appendChild(row);
      });

      function addTodo() {
        const input = body.querySelector("#todo-input");
        const text = input.value.trim();
        if (!text) return;
        todos.push({ text, done: false });
        api.storage.set("todos", todos);
        api.audio.playTone({ freq: 520, type: "square", duration: 0.06, gain: 0.08 });
        renderTodo();
      }
      body.querySelector("#todo-add").addEventListener("click", addTodo);
      body.querySelector("#todo-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") addTodo();
      });
    }

    // ---------------- Notes ----------------
    function renderNotes() {
      const notes = api.storage.get("notes", []);
      body.innerHTML = `
        <button id="note-add" class="pixel-btn" style="margin-bottom:6px;">+ sticky note</button>
        <div id="note-list" style="display:flex;flex-direction:column;gap:6px;"></div>
      `;
      const list = body.querySelector("#note-list");
      notes.forEach((n, i) => {
        const card = document.createElement("div");
        card.className = "pixel-panel";
        card.style.cssText = "background:#e8d97a;color:#3a3200;position:relative;";
        card.innerHTML = `
          <textarea class="pixel-input" style="width:100%;height:60px;background:transparent;border:none;color:inherit;resize:vertical;"></textarea>
          <button class="pixel-btn" style="position:absolute;top:2px;right:2px;padding:1px 5px;">x</button>
        `;
        const textarea = card.querySelector("textarea");
        textarea.value = n.text;
        textarea.addEventListener("input", () => {
          notes[i].text = textarea.value;
          api.storage.set("notes", notes);
        });
        card.querySelector("button").addEventListener("click", () => {
          notes.splice(i, 1);
          api.storage.set("notes", notes);
          renderNotes();
        });
        list.appendChild(card);
      });
      body.querySelector("#note-add").addEventListener("click", () => {
        notes.push({ text: "" });
        api.storage.set("notes", notes);
        renderNotes();
      });
    }

    // ---------------- Pomodoro Timer ----------------
    let timerHandle = null;

    function renderTimer() {
      const state = api.storage.get("timer", { remaining: 25 * 60, running: false, focusMinutes: 25 });
      body.innerHTML = `
        <div style="text-align:center;">
          <div id="timer-display" style="font-size:20px;margin:16px 0;"></div>
          <div style="display:flex;gap:6px;justify-content:center;">
            <button id="timer-toggle" class="pixel-btn"></button>
            <button id="timer-reset" class="pixel-btn">reset</button>
          </div>
        </div>
      `;
      const display = body.querySelector("#timer-display");
      const toggleBtn = body.querySelector("#timer-toggle");

      function format(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
      function paint() {
        display.textContent = format(state.remaining);
        toggleBtn.textContent = state.running ? "pause" : "start";
        api.window.setTitle(state.running ? `Tasks — ${format(state.remaining)}` : "Tasks");
      }
      paint();

      function tick() {
        state.remaining = Math.max(0, state.remaining - 1);
        api.storage.set("timer", state);
        paint();
        if (state.remaining === 0) {
          state.running = false;
          clearInterval(timerHandle);
          api.storage.set("timer", state);
          api.notify("Pomodoro complete — take a break!");
          api.audio.playTone({ freq: 880, type: "square", duration: 0.15 });
          setTimeout(() => api.audio.playTone({ freq: 660, type: "square", duration: 0.15 }), 180);
          paint();
        }
      }

      if (state.running && !timerHandle) {
        timerHandle = setInterval(tick, 1000);
      }

      toggleBtn.addEventListener("click", () => {
        state.running = !state.running;
        api.storage.set("timer", state);
        if (state.running) {
          clearInterval(timerHandle);
          timerHandle = setInterval(tick, 1000);
        } else {
          clearInterval(timerHandle);
          timerHandle = null;
        }
        paint();
      });

      body.querySelector("#timer-reset").addEventListener("click", () => {
        clearInterval(timerHandle);
        timerHandle = null;
        state.running = false;
        state.remaining = state.focusMinutes * 60;
        api.storage.set("timer", state);
        paint();
      });
    }

    function renderBody() {
      clearInterval(timerHandle);
      timerHandle = null;
      if (active === "Todo") renderTodo();
      else if (active === "Notes") renderNotes();
      else renderTimer();
    }

    renderTabs();
    renderBody();
  },
});
