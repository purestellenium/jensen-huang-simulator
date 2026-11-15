import rough from "roughjs";
import { NVIDIA_GREEN, TITLE_YELLOW, crush, drawBadPhotoshopText, sizeCanvas } from "./pixel";
import { playSound } from "./audio";
import { TEXT_SPEEDS, VOLUME_STEP, getSettings, nextValue, onSettingsChange, updateSettings } from "./settings";
import { outlineButtonArt } from "./sketch";
import { STRINGS } from "./strings";
import "./settings.css";

const S = STRINGS.settings;
const TITLE_FACE = 'Impact, "Arial Black", sans-serif';
const TEXT_FACE = "Arial, sans-serif";
const MUTED_COLOR = "#ff2a2a";
const SLIDER_INSET = 5;
const HANDLE_WIDTH = 12;

interface Row {
  label: () => string;
  press: () => void;
}

const ROWS: Row[] = [
  {
    label: () => `${S.textSpeed}: ${S.speeds[getSettings().textSpeed]}`,
    press: () => updateSettings({ textSpeed: nextValue(TEXT_SPEEDS, getSettings().textSpeed) }),
  },
  {
    label: () => `${S.background}: ${getSettings().movingBackground ? S.on : S.off}`,
    press: () => updateSettings({ movingBackground: !getSettings().movingBackground }),
  },
];

type VolumeKey = "musicVolume" | "sfxVolume";

interface SliderSpec {
  key: VolumeKey;
  name: string;
  label: (volume: number) => string;
  seed: number;
  preview?: () => void;
}

interface SliderUi {
  spec: SliderSpec;
  slider: HTMLElement;
  art: HTMLCanvasElement;
}

const SLIDERS: SliderSpec[] = [
  { key: "musicVolume", name: S.musicName, label: S.music, seed: 9 },
  { key: "sfxVolume", name: S.sfxName, label: S.sfx, seed: 12, preview: () => playSound("pop") },
];

interface Built {
  panel: HTMLElement;
  card: HTMLElement;
  art: HTMLCanvasElement;
  sliders: SliderUi[];
  mute: HTMLButtonElement;
  rows: { button: HTMLButtonElement; row: Row }[];
  back: HTMLButtonElement;
}

let built: Built | null = null;
let opener: HTMLElement | null = null;

function option(parent: HTMLElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-option";
  parent.append(button);
  return button;
}

function volumeAt(slider: HTMLElement, clientX: number): number {
  const rect = slider.getBoundingClientRect();
  const ratio = (clientX - rect.left - SLIDER_INSET) / (rect.width - SLIDER_INSET * 2);
  return Math.round((Math.min(1, Math.max(0, ratio)) * 100) / VOLUME_STEP) * VOLUME_STEP;
}

function setVolume(spec: SliderSpec, volume: number): void {
  const level = Math.min(100, Math.max(0, volume));
  const current = getSettings();
  if (level === current[spec.key] && !current.muted) return;
  updateSettings({ [spec.key]: level, muted: false });
  spec.preview?.();
}

function wireSlider(spec: SliderSpec, slider: HTMLElement): void {
  let dragging = false;
  slider.addEventListener("pointerdown", (event) => {
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    setVolume(spec, volumeAt(slider, event.clientX));
  });
  slider.addEventListener("pointermove", (event) => {
    if (dragging) setVolume(spec, volumeAt(slider, event.clientX));
  });
  const release = () => {
    dragging = false;
  };
  slider.addEventListener("pointerup", release);
  slider.addEventListener("pointercancel", release);
  slider.addEventListener("keydown", (event) => {
    const current = getSettings()[spec.key];
    const targets: Record<string, number> = {
      ArrowLeft: current - VOLUME_STEP,
      ArrowDown: current - VOLUME_STEP,
      ArrowRight: current + VOLUME_STEP,
      ArrowUp: current + VOLUME_STEP,
      Home: 0,
      End: 100,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setVolume(spec, next);
  });
}

function build(): Built {
  const panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", S.title);

  const card = document.createElement("div");
  card.className = "settings-card";
  const art = document.createElement("canvas");
  art.className = "settings-art";
  art.setAttribute("aria-hidden", "true");
  card.append(art);

  const sliders = SLIDERS.map((spec): SliderUi => {
    const slider = document.createElement("div");
    slider.className = "settings-slider";
    slider.tabIndex = 0;
    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-label", spec.name);
    slider.setAttribute("aria-valuemin", "0");
    slider.setAttribute("aria-valuemax", "100");
    const art = document.createElement("canvas");
    art.className = "settings-art";
    art.setAttribute("aria-hidden", "true");
    slider.append(art);
    return { spec, slider, art };
  });

  const music = document.createElement("div");
  music.className = "settings-music";
  music.append(sliders[0]!.slider);
  const mute = option(music);
  mute.classList.add("settings-mute");
  card.append(music);
  card.append(sliders[1]!.slider);

  const rows = ROWS.map((row) => ({ button: option(card), row }));
  const back = option(card);
  back.textContent = S.back;

  panel.append(card);
  document.body.append(panel);

  for (const { spec, slider } of sliders) wireSlider(spec, slider);
  mute.addEventListener("click", () => updateSettings({ muted: !getSettings().muted }));
  for (const { button, row } of rows) {
    button.addEventListener("click", () => row.press());
  }
  back.addEventListener("click", closeSettings);
  panel.addEventListener("click", (event) => {
    if (event.target === panel) closeSettings();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closeSettings();
  });
  window.addEventListener("resize", () => {
    if (!panel.hidden) paint();
  });
  onSettingsChange(() => {
    if (!panel.hidden) paintControls();
  });

  return { panel, card, art, sliders, mute, rows, back };
}

function paintCard(): void {
  if (!built) return;
  const { card, art } = built;
  const rect = card.getBoundingClientRect();
  const ctx = sizeCanvas(art, rect.width, rect.height);
  const rc = rough.canvas(art);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, rect.width, rect.height);
  rc.rectangle(3, 3, rect.width - 6, rect.height - 6, {
    seed: 5,
    roughness: 2.2,
    bowing: 3,
    stroke: "#fff",
    strokeWidth: 4,
  });

  const size = Math.min(56, rect.width * 0.12);
  const font = `${size}px ${TITLE_FACE}`;
  ctx.font = font;
  const width = ctx.measureText(S.title).width;
  drawBadPhotoshopText(ctx, S.title, (rect.width - width) / 2, size + 30, size, font, TITLE_YELLOW, "#000", null);
  crush(ctx);
}

function paintSlider({ spec, slider, art }: SliderUi): void {
  const volume = getSettings()[spec.key];
  const { muted } = getSettings();
  const rect = slider.getBoundingClientRect();
  const ctx = sizeCanvas(art, rect.width, rect.height);
  const rc = rough.canvas(art);
  const width = rect.width - SLIDER_INSET * 2;
  const height = rect.height - SLIDER_INSET * 2;
  const filled = (width * volume) / 100;

  ctx.fillStyle = "#000";
  ctx.fillRect(SLIDER_INSET, SLIDER_INSET, width, height);
  ctx.fillStyle = muted ? "#555" : NVIDIA_GREEN;
  ctx.fillRect(SLIDER_INSET, SLIDER_INSET, filled, height);
  rc.rectangle(SLIDER_INSET, SLIDER_INSET, width, height, {
    seed: spec.seed,
    roughness: 1.8,
    bowing: 2.5,
    disableMultiStroke: true,
    preserveVertices: true,
    stroke: "#fff",
    strokeWidth: 4,
  });

  const handleX = Math.min(Math.max(SLIDER_INSET + filled - HANDLE_WIDTH / 2, SLIDER_INSET), rect.width - SLIDER_INSET - HANDLE_WIDTH);
  ctx.fillStyle = "#000";
  ctx.fillRect(handleX - 3, SLIDER_INSET - 7, HANDLE_WIDTH + 6, height + 14);
  ctx.fillStyle = "#fff";
  ctx.fillRect(handleX, SLIDER_INSET - 4, HANDLE_WIDTH, height + 8);

  const style = getComputedStyle(slider);
  const size = parseFloat(style.fontSize);
  const font = `bold ${size}px ${TEXT_FACE}`;
  drawBadPhotoshopText(ctx, spec.label(volume), SLIDER_INSET + 16, rect.height / 2 + size * 0.35, size, font, "#fff", "#000", null);
  crush(ctx);

  slider.setAttribute("aria-valuenow", String(volume));
  slider.setAttribute("aria-valuetext", muted ? `${spec.label(volume)}, ${S.unmute}` : spec.label(volume));
}

function paintButton(button: HTMLButtonElement, seed: number, color = "#ffffff"): void {
  const { width, height } = button.getBoundingClientRect();
  const style = getComputedStyle(button);
  const options = {
    color,
    glyph: null,
    fontSize: parseFloat(style.fontSize),
    paddingLeft: parseFloat(style.paddingLeft),
    paddingRight: parseFloat(style.paddingRight),
    disabled: false,
    seed,
  };
  const label = button.textContent ?? "";
  button.style.setProperty("--art", `url(${outlineButtonArt(label, width, height, { ...options, hover: false })})`);
  button.style.setProperty("--art-hover", `url(${outlineButtonArt(label, width, height, { ...options, hover: true })})`);
}

function paintControls(): void {
  if (!built) return;
  const { muted } = getSettings();
  built.mute.textContent = muted ? S.unmute : S.mute;
  paintButton(built.mute, 20, muted ? MUTED_COLOR : "#ffffff");
  built.sliders.forEach(paintSlider);
  built.rows.forEach(({ button, row }, index) => {
    button.textContent = row.label();
    paintButton(button, index + 1);
  });
  paintButton(built.back, built.rows.length + 1);
}

function paint(): void {
  paintCard();
  paintControls();
}

export function isSettingsOpen(): boolean {
  return built !== null && !built.panel.hidden;
}

export function openSettings(from: HTMLElement): void {
  built ??= build();
  opener = from;
  built.panel.hidden = false;
  paint();
  built.sliders[0]!.slider.focus();
}

export function closeSettings(): void {
  if (!built) return;
  built.panel.hidden = true;
  opener?.focus();
}
