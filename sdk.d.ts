/**
 * Type declarations for the PixelOS app SDK. See APPS.md for the full
 * narrative contract; this file exists so a future session's editor gives
 * autocomplete-quality signatures straight from the source.
 */

/** Namespaced localStorage handed to every app — keys never leave `webos:<appId>:*`. */
interface AppStorage {
  /** Read a JSON-decoded value, or `fallback` if the key is unset. */
  get<T = any>(key: string, fallback?: T): T;
  /** JSON-encode and persist `value` under `key`. */
  set(key: string, value: any): void;
  /** Remove a single key. */
  remove(key: string): void;
  /** List every key (without the namespace prefix) this app has set. */
  keys(): string[];
  /** Remove every key belonging to this app. */
  clear(): void;
}

/** Per-window controls, scoped to the window this app was launched into. */
interface AppWindow {
  /** Change the titlebar text. */
  setTitle(title: string): void;
  /** Resize the window (clamped to a sane minimum). */
  resize(width: number, height: number): void;
  /** Close the window (unmounts the app). */
  close(): void;
  /** Current window size in CSS pixels. */
  getSize(): { w: number; h: number };
  /** Restore-if-minimized and bring to front. */
  focus(): void;
  /** Register a callback fired once, when the window closes. Use this to clean up timers/intervals/object URLs. */
  onClose(callback: () => void): void;
}

type OscillatorWaveType = "sine" | "square" | "sawtooth" | "triangle";

/** Shared Web Audio helpers — do not create your own AudioContext. */
interface SharedAudio {
  /** Returns the one shared AudioContext, resuming it if suspended. */
  getContext(): AudioContext;
  /** Plays a single synthesized tone. */
  playTone(opts?: { freq?: number; type?: OscillatorWaveType; duration?: number; gain?: number }): void;
  /** Plays a short noise burst. */
  playNoise(opts?: { duration?: number; gain?: number }): void;
  /** Returns a small (fftSize 64) AnalyserNode you can wire into your own graph. */
  createAnalyser(): AnalyserNode;
}

interface WallpaperSprite {
  name: string;
  path: string;
  width: number;
  height: number;
}

/**
 * Narrow, controlled access to OS-wide preferences. This is the one
 * deliberate exception to "apps only touch their own storage" — it exists
 * so Settings (or any future app) can change shell appearance safely.
 */
interface SystemPrefs {
  listWallpaperSprites(): WallpaperSprite[];
  getWallpaper(): string;
  setWallpaper(spriteName: string): void;
  getUiScale(): 2 | 3 | 4;
  /** Non-integer or out-of-range values fall back to 2. */
  setUiScale(scale: 2 | 3 | 4): void;
  getTheme(): Record<string, string> | null;
  setTheme(palette: Record<string, string>): void;
}

/** The full SDK object passed as the second argument to mount(). */
interface AppApi {
  storage: AppStorage;
  window: AppWindow;
  /** Shows a pixel toast notification. */
  notify(message: string, opts?: { kind?: "info" | "error"; duration?: number }): void;
  audio: SharedAudio;
  /** Resolves a sprite name from assets/sprites/manifest.json to its path. Never hardcode sprite paths. */
  sprite(name: string): string;
  system: SystemPrefs;
}

/** Config object passed to the global registerApp() by every app's entry script. */
interface AppConfig {
  /** Must match the "id" in apps/manifest.json. */
  id: string;
  name: string;
  /** A sprite name from assets/sprites/manifest.json. */
  icon: string;
  defaultSize?: { w: number; h: number };
  /** Called once when the app's window is created. Build your UI into `container`. */
  mount(container: HTMLElement, api: AppApi): void;
}

declare global {
  /** Registers an app with the shell. Call this once, synchronously, from your entry script. */
  function registerApp(config: AppConfig): void;
}

export {};
