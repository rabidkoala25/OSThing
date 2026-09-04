/**
 * Shared Web Audio context + a couple of chiptune-flavored helpers, handed
 * to every app as `api.audio`. Apps should NOT create their own
 * AudioContext — reuse this one so the OS doesn't accumulate contexts.
 */
(function () {
  window.WebOS = window.WebOS || {};

  let ctx = null;

  /** Lazily creates (on first user gesture) and returns the shared AudioContext. */
  function getContext() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /**
   * Plays a single synthesized tone.
   * @param {{ freq?: number, type?: OscillatorType, duration?: number, gain?: number }} [opts]
   */
  function playTone(opts = {}) {
    const { freq = 440, type = "square", duration = 0.15, gain = 0.15 } = opts;
    const c = getContext();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(c.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.stop(c.currentTime + duration + 0.02);
  }

  /**
   * Creates a short noise burst (useful for percussion / UI blips).
   * @param {{ duration?: number, gain?: number }} [opts]
   */
  function playNoise(opts = {}) {
    const { duration = 0.12, gain = 0.12 } = opts;
    const c = getContext();
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(g).connect(c.destination);
    src.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  }

  /** @returns {AnalyserNode} A small analyser (fftSize 64) connected to nothing — connect a source to it yourself. */
  function createAnalyser() {
    const c = getContext();
    const a = c.createAnalyser();
    a.fftSize = 64;
    return a;
  }

  window.WebOS.SharedAudio = {
    getContext,
    playTone,
    playNoise,
    createAnalyser,
  };
})();
