/**
 * Chiptune — a tiny built-in square/triangle/noise sequencer, plus a
 * drag-and-drop playlist for the user's own audio files, plus a pixel VU
 * meter. Everything routes through one master gain -> analyser -> speakers
 * bus so the VU meter reacts to whichever source is playing.
 *
 * .mod/.xm playback via a tracker lib is intentionally NOT wired up here —
 * see README.md "Extensibility notes" for where to plug one in from a CDN.
 */
registerApp({
  id: "music",
  name: "Chiptune",
  icon: "icon_music",
  defaultSize: { w: 300, h: 220 },

  mount(container, api) {
    const ctx = api.audio.getContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.25;
    const analyser = api.audio.createAnalyser();
    analyser.fftSize = 64;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;padding:6px;gap:6px;">
        <canvas id="vu" width="64" height="20" style="width:100%;height:60px;image-rendering:pixelated;background:#000;border:2px solid var(--palette-border);"></canvas>
        <div style="display:flex;gap:4px;">
          <button id="seq-toggle" class="pixel-btn">play sequence</button>
          <select id="wave-type" class="pixel-select">
            <option value="square">square</option>
            <option value="triangle">triangle</option>
            <option value="sawtooth">saw</option>
          </select>
        </div>
        <div id="drop-zone" class="pixel-panel" style="text-align:center;padding:10px;font-size:7px;">
          drag audio files here to add to playlist
        </div>
        <div id="playlist" style="flex:1;overflow:auto;font-size:7px;"></div>
      </div>
    `;

    // ---------------- VU meter ----------------
    const canvas = container.querySelector("#vu");
    const gfx = canvas.getContext("2d");
    gfx.imageSmoothingEnabled = false;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    let vuAlive = true;
    function drawVU() {
      if (!vuAlive) return;
      analyser.getByteFrequencyData(freqData);
      gfx.fillStyle = "#000";
      gfx.fillRect(0, 0, canvas.width, canvas.height);
      const barCount = 16;
      const barWidth = Math.floor(canvas.width / barCount);
      for (let i = 0; i < barCount; i++) {
        const v = freqData[i] || 0;
        const barHeight = Math.round((v / 255) * canvas.height);
        const hue = 260 - (v / 255) * 140;
        gfx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        gfx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
      requestAnimationFrame(drawVU);
    }
    drawVU();

    // ---------------- built-in sequencer ----------------
    // A tiny arpeggio in MIDI-ish note frequencies (C major-ish, retro feel).
    const SEQUENCE = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 261.6, 196.0];
    let seqTimer = null;
    let seqStep = 0;
    let playing = false;

    function getWaveType() {
      return container.querySelector("#wave-type").value;
    }

    function playStep() {
      const freq = SEQUENCE[seqStep % SEQUENCE.length];
      seqStep += 1;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = getWaveType();
      osc.frequency.value = freq;
      g.gain.value = 0.2;
      osc.connect(g).connect(masterGain);
      osc.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.stop(ctx.currentTime + 0.2);
    }

    const toggleBtn = container.querySelector("#seq-toggle");
    toggleBtn.addEventListener("click", () => {
      playing = !playing;
      toggleBtn.textContent = playing ? "stop sequence" : "play sequence";
      api.window.setTitle(playing ? "Chiptune — playing" : "Chiptune");
      if (playing) {
        seqTimer = setInterval(playStep, 180);
      } else {
        clearInterval(seqTimer);
        seqTimer = null;
      }
    });

    // ---------------- drag-and-drop playlist ----------------
    const playlist = []; // { name, url, el }
    const dropZone = container.querySelector("#drop-zone");
    const playlistEl = container.querySelector("#playlist");

    function renderPlaylist() {
      playlistEl.innerHTML = "";
      playlist.forEach((item, i) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:4px;padding:3px 0;border-top:1px solid var(--palette-border);";
        row.innerHTML = `<span style="flex:1;"></span><button class="pixel-btn" style="padding:1px 4px;">▶</button>`;
        row.querySelector("span").textContent = item.name;
        row.querySelector("button").addEventListener("click", () => {
          item.el.currentTime = 0;
          item.el.play();
          api.notify(`Playing: ${item.name}`);
        });
        playlistEl.appendChild(row);
      });
    }

    function addFile(file) {
      if (!file.type.startsWith("audio/")) {
        api.notify(`Skipped "${file.name}" — not an audio file`, { kind: "error" });
        return;
      }
      const url = URL.createObjectURL(file);
      const audioEl = new Audio(url);
      audioEl.crossOrigin = "anonymous";
      const source = ctx.createMediaElementSource(audioEl);
      source.connect(masterGain);
      playlist.push({ name: file.name, url, el: audioEl });
      renderPlaylist();
      api.audio.playNoise({ duration: 0.05, gain: 0.05 });
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
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(addFile);
    });

    api.window.onClose(() => {
      vuAlive = false;
      clearInterval(seqTimer);
      playlist.forEach((item) => URL.revokeObjectURL(item.url));
    });
  },
});
