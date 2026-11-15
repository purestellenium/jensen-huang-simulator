export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export interface Settings {
  musicVolume: number;
  muted: boolean;
  textSpeed: TextSpeed;
  movingBackground: boolean;
}

export const TEXT_SPEEDS: readonly TextSpeed[] = ["slow", "normal", "fast", "instant"];
export const VOLUME_STEP = 5;

const STORAGE_KEY = "jensen-huang-simulator.settings";
const DEFAULTS: Settings = { musicVolume: 60, muted: false, textSpeed: "normal", movingBackground: true };
const SFX_GAIN = 0.7;
const TEXT_INTERVAL_MS: Record<TextSpeed, number> = { slow: 40, normal: 22, fast: 8, instant: 0 };

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

function volume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed: Partial<Record<keyof Settings, unknown>> = JSON.parse(raw);
    return {
      musicVolume: volume(parsed.musicVolume, DEFAULTS.musicVolume),
      muted: typeof parsed.muted === "boolean" ? parsed.muted : DEFAULTS.muted,
      textSpeed: pick(parsed.textSpeed, TEXT_SPEEDS, DEFAULTS.textSpeed),
      movingBackground: typeof parsed.movingBackground === "boolean" ? parsed.movingBackground : DEFAULTS.movingBackground,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let current = load();
const listeners = new Set<() => void>();

export function getSettings(): Readonly<Settings> {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    current = { ...current };
  }
  for (const listener of listeners) listener();
}

export function onSettingsChange(listener: () => void): void {
  listeners.add(listener);
}

export function musicGain(level: number, muted: boolean): number {
  return muted ? 0 : (level / 100) ** 1.5;
}

export function sfxGain(muted: boolean): number {
  return muted ? 0 : SFX_GAIN;
}

export function textIntervalMs(speed: TextSpeed): number {
  return TEXT_INTERVAL_MS[speed];
}

export function nextValue<T>(values: readonly T[], value: T): T {
  const index = values.indexOf(value);
  return values[(index + 1) % values.length] ?? value;
}
