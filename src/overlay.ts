import rough from "roughjs";
import type { RoughCanvas } from "roughjs/bin/canvas";
import {
  NVIDIA_GREEN,
  RESOLUTION_SCALE,
  TITLE_YELLOW,
  buttonArt,
  context2d,
  crush,
  drawBadPhotoshopText,
  type ButtonColors,
} from "./pixel";
import { STRINGS } from "./strings";

const HC_RED = "#ec3750";
const HC_ORANGE = "#ff8c37";
const HC_YELLOW = "#f1c40f";
const HC_PURPLE = "#a633d6";
const DOODLE_RESOLUTION_SCALE = 0.33;
const BOIL_VARIANTS = 3;
const BOIL_INTERVAL_MS = 140;
const SEED = 4;

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jitter(rng: Rng, amount: number): number {
  return (rng() * 2 - 1) * amount;
}

function drawWobblyText(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  shadow: string,
): void {
  ctx.font = `${size}px Impact, "Arial Black", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  let cursor = x;
  for (const char of text) {
    const width = ctx.measureText(char).width;
    ctx.save();
    ctx.translate(cursor + width / 2 + jitter(rng, size * 0.02), y + jitter(rng, size * 0.04));
    ctx.rotate(jitter(rng, 0.09));
    ctx.scale(1 + jitter(rng, 0.06), 1 + jitter(rng, 0.08));
    ctx.fillStyle = shadow;
    ctx.fillText(char, -width / 2 + size * 0.07, size * 0.07);
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = "#000";
    ctx.strokeText(char, -width / 2, 0);
    ctx.fillStyle = fill;
    ctx.fillText(char, -width / 2, 0);
    ctx.restore();
    cursor += width * 0.96;
  }
}

function drawEyeLogo(rc: RoughCanvas, ctx: CanvasRenderingContext2D, rng: Rng, seed: number, x: number, y: number, size: number): void {
  rc.rectangle(x, y, size, size * 0.72, {
    seed,
    fill: NVIDIA_GREEN,
    fillStyle: "hachure",
    hachureGap: size * 0.05,
    fillWeight: size * 0.03,
    stroke: NVIDIA_GREEN,
    strokeWidth: 2,
    roughness: 2.5,
  });

  const cx = x + size * 0.5;
  const cy = y + size * 0.36;
  const eye = `M ${x + size * 0.08} ${cy} Q ${cx} ${cy - size * 0.42} ${x + size * 0.92} ${cy} Q ${cx} ${cy + size * 0.42} ${x + size * 0.08} ${cy}`;
  rc.path(eye, { seed, stroke: "#fff", strokeWidth: size * 0.05, roughness: 2 });

  const spiral: [number, number][] = [];
  for (let theta = 0; theta < Math.PI * 4.2; theta += 0.35) {
    const r = size * 0.025 * theta + jitter(rng, size * 0.01);
    spiral.push([cx + Math.cos(theta) * r * 1.3, cy + Math.sin(theta) * r * 0.8]);
  }
  rc.curve(spiral, { seed, stroke: "#fff", strokeWidth: size * 0.045, roughness: 1.5 });

  drawWobblyText(ctx, rng, STRINGS.title.logo.nvidia, x + size * 0.02, y + size * 1.1, size * 0.34, "#fff", NVIDIA_GREEN);
}

function drawHackClubLogo(rc: RoughCanvas, ctx: CanvasRenderingContext2D, rng: Rng, seed: number, x: number, y: number, size: number): void {
  const r = size * 0.22;
  const s = size * 0.8;
  const box = `M ${x + r} ${y} L ${x + s - r} ${y} Q ${x + s} ${y} ${x + s} ${y + r} L ${x + s} ${y + s - r} Q ${x + s} ${y + s} ${x + s - r} ${y + s} L ${x + r} ${y + s} Q ${x} ${y + s} ${x} ${y + s - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
  rc.path(box, {
    seed,
    fill: HC_RED,
    fillStyle: "hachure",
    hachureGap: size * 0.05,
    fillWeight: size * 0.03,
    stroke: HC_RED,
    strokeWidth: 2,
    roughness: 2.5,
  });

  const stem = x + s * 0.32;
  const top = y + s * 0.18;
  const bottom = y + s * 0.82;
  const arch = `M ${stem} ${y + s * 0.55} Q ${stem + s * 0.1} ${y + s * 0.4} ${x + s * 0.5} ${y + s * 0.4} Q ${x + s * 0.68} ${y + s * 0.4} ${x + s * 0.68} ${y + s * 0.58} L ${x + s * 0.68} ${bottom}`;
  const ink = { seed, stroke: "#fff", strokeWidth: size * 0.1, roughness: 1.8 };
  rc.line(stem, top, stem, bottom, ink);
  rc.path(arch, ink);

  drawWobblyText(ctx, rng, STRINGS.title.logo.hackclub, x - size * 0.05, y + size * 1.1, size * 0.3, "#fff", HC_RED);
}

export type Mode = "jensen" | "hackclub";

interface Theme {
  title: readonly [string, string];
  titleFill: string;
  titleShadow: string;
  underline: string;
  button: ButtonColors;
  drawLogo: typeof drawEyeLogo;
}

const THEMES: Record<Mode, Theme> = {
  jensen: {
    title: STRINGS.title.jensen,
    titleFill: TITLE_YELLOW,
    titleShadow: NVIDIA_GREEN,
    underline: NVIDIA_GREEN,
    button: { fill: NVIDIA_GREEN, ink: "#000", outline: "#fff" },
    drawLogo: drawEyeLogo,
  },
  hackclub: {
    title: STRINGS.title.hackclub,
    titleFill: HC_RED,
    titleShadow: HC_ORANGE,
    underline: HC_YELLOW,
    button: { fill: HC_RED, ink: "#fff", outline: "#000" },
    drawLogo: drawHackClubLogo,
  },
};

const SECRET_BUTTON: ButtonColors = { fill: HC_PURPLE, ink: "#fff", outline: "#000" };

function drawTitle(canvas: HTMLCanvasElement, theme: Theme): void {
  const ctx = context2d(canvas);
  const rc = rough.canvas(canvas);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * RESOLUTION_SCALE);
  canvas.height = Math.round(height * RESOLUTION_SCALE);
  ctx.setTransform(RESOLUTION_SCALE, 0, 0, RESOLUTION_SCALE, 0, 0);

  const left = width * 0.05;
  const titleSize = Math.min(Math.max(width * 0.1, 48), 150);
  const line1Y = height * 0.04 + titleSize;
  const line2Y = line1Y + titleSize * 0.92;
  const titleFace = 'Impact, "Arial Black", sans-serif';
  const [line1, line2] = theme.title;

  ctx.save();
  ctx.translate(left, line1Y);
  ctx.rotate(-0.04);
  drawBadPhotoshopText(ctx, line1, 0, 0, titleSize, `${titleSize}px ${titleFace}`, theme.titleFill, "#000", theme.titleShadow);
  ctx.restore();

  ctx.save();
  ctx.translate(left + titleSize * 0.2, line2Y);
  ctx.rotate(-0.015);
  const line2End = drawBadPhotoshopText(ctx, line2, 0, 0, titleSize * 1.05, `${titleSize * 1.05}px ${titleFace}`, theme.titleFill, "#000", theme.titleShadow);
  rc.curve(
    [
      [-titleSize * 0.1, titleSize * 0.22],
      [line2End * 0.5, titleSize * 0.32],
      [line2End, titleSize * 0.18],
    ],
    { seed: SEED, stroke: theme.underline, strokeWidth: titleSize * 0.07, roughness: 2.5 },
  );
  ctx.restore();

  crush(ctx);
}

function drawDoodles(canvas: HTMLCanvasElement, theme: Theme, variant: number): void {
  const ctx = context2d(canvas);
  const rc = rough.canvas(canvas);
  const seed = variant + 1;
  const rng = mulberry32(seed * 7919);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * DOODLE_RESOLUTION_SCALE);
  canvas.height = Math.round(height * DOODLE_RESOLUTION_SCALE);
  ctx.setTransform(DOODLE_RESOLUTION_SCALE, 0, 0, DOODLE_RESOLUTION_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const logoSize = Math.min(Math.max(width * 0.09, 70), 130);
  theme.drawLogo(rc, ctx, rng, seed, width - logoSize - width * 0.04, height * 0.05, logoSize);
}

function paintButton(button: HTMLButtonElement, colors: ButtonColors): void {
  if (button.hidden) return;
  const { width, height } = button.getBoundingClientRect();
  const label = button.textContent ?? "";
  const hover: ButtonColors = { fill: "#000", ink: colors.fill, outline: "#fff" };
  button.style.setProperty("--art", `url(${buttonArt(label, width, height, colors)})`);
  button.style.setProperty("--art-hover", `url(${buttonArt(label, width, height, hover)})`);
}

export interface Overlay {
  setMode(mode: Mode): void;
  stop(): void;
}

export function startOverlay(
  title: HTMLCanvasElement,
  doodles: HTMLCanvasElement,
  start: HTMLButtonElement,
  secret: HTMLButtonElement,
): Overlay {
  let mode: Mode = "jensen";
  let variant = 0;
  let fontsReady = false;
  let stopped = false;
  let boilTimer: ReturnType<typeof setInterval> | undefined;

  const draw = () => {
    if (!fontsReady || stopped) return;
    const theme = THEMES[mode];
    secret.hidden = mode !== "hackclub";
    drawTitle(title, theme);
    drawDoodles(doodles, theme, variant);
    paintButton(start, theme.button);
    paintButton(secret, SECRET_BUTTON);
  };

  window.addEventListener("resize", draw);
  void document.fonts.ready.then(() => {
    if (stopped) return;
    fontsReady = true;
    draw();
    boilTimer = setInterval(() => {
      variant = (variant + 1) % BOIL_VARIANTS;
      drawDoodles(doodles, THEMES[mode], variant);
    }, BOIL_INTERVAL_MS);
  });

  return {
    setMode(next) {
      if (next === mode) return;
      mode = next;
      draw();
    },
    stop() {
      stopped = true;
      clearInterval(boilTimer);
    },
  };
}
