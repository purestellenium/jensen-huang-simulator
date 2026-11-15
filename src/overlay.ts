import rough from "roughjs";
import type { RoughCanvas } from "roughjs/bin/canvas";
import {
  NVIDIA_GREEN,
  RESOLUTION_SCALE,
  TITLE_YELLOW,
  buttonArt,
  context2d,
  sizeCanvas,
  crush,
  drawBadPhotoshopText,
  type ButtonColors,
} from "./pixel";
import { STRINGS } from "./strings";

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

interface Theme {
  title: readonly [string, string];
  titleFill: string;
  titleShadow: string;
  underline: string;
  button: ButtonColors;
}

const THEME: Theme = {
  title: STRINGS.title.jensen,
  titleFill: TITLE_YELLOW,
  titleShadow: NVIDIA_GREEN,
  underline: NVIDIA_GREEN,
  button: { fill: NVIDIA_GREEN, ink: "#000", outline: "#fff" },
};

const SETTINGS_BUTTON: ButtonColors = { fill: "#9a9a9a", ink: "#000", outline: "#fff" };

const NOTICE_SCALE = 0.75;

function drawNotice(width: number, height: number, size: number): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#notice");
  if (!canvas) return;
  const lines = STRINGS.title.disclaimer;
  const lineHeight = size * 1.3;
  const cssHeight = Math.ceil(lines.length * lineHeight + size * 0.5);
  const cssWidth = Math.ceil(Math.min(width * 0.9, size * 0.62 * Math.max(...lines.map((line) => line.length)) + size));
  const ctx = sizeCanvas(canvas, cssWidth, cssHeight, NOTICE_SCALE);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.setAttribute("aria-label", lines.join(" "));
  ctx.font = `bold ${size}px Arial, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.28;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#fff";
  lines.forEach((line, index) => {
    const y = size + index * lineHeight;
    ctx.strokeText(line, size * 0.2, y);
    ctx.fillText(line, size * 0.2, y);
  });
}

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

  const bylineSize = Math.min(Math.max(width * 0.03, 20), 42);
  ctx.font = `${bylineSize}px ${titleFace}`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = bylineSize * 0.14;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = NVIDIA_GREEN;
  const noticeSize = Math.min(Math.max(width * 0.0115, 11), 16);
  drawNotice(width, height, noticeSize);
  const noticeLines = STRINGS.title.disclaimer;
  const lastNoticeY = height - height * 0.012;
  const bylineY = lastNoticeY - noticeLines.length * noticeSize * 1.25 - bylineSize * 0.2 - noticeSize * 1.2;
  const credits = document.querySelector<HTMLElement>("#credits");
  credits?.replaceChildren();
  let cursor = left;
  for (const part of STRINGS.title.byline) {
    ctx.strokeText(part.text, cursor, bylineY);
    ctx.fillText(part.text, cursor, bylineY);
    const advance = ctx.measureText(part.text).width;
    if (part.href && credits) {
      const link = document.createElement("a");
      link.href = part.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", part.text);
      link.style.left = `${cursor}px`;
      link.style.top = `${bylineY - bylineSize * 0.85}px`;
      link.style.width = `${advance}px`;
      link.style.height = `${bylineSize * 0.92}px`;
      credits.append(link);
    }
    cursor += advance;
  }
}

function drawDoodles(canvas: HTMLCanvasElement, variant: number): void {
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
  drawEyeLogo(rc, ctx, rng, seed, width - logoSize - width * 0.04, height * 0.05, logoSize);
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
  stop(): void;
}

export function startOverlay(
  title: HTMLCanvasElement,
  doodles: HTMLCanvasElement,
  start: HTMLButtonElement,
  settings: HTMLButtonElement,
): Overlay {
  let variant = 0;
  let fontsReady = false;
  let stopped = false;
  let boilTimer: ReturnType<typeof setInterval> | undefined;

  const draw = () => {
    if (!fontsReady || stopped) return;
    drawTitle(title, THEME);
    drawDoodles(doodles, variant);
    paintButton(start, THEME.button);
    paintButton(settings, SETTINGS_BUTTON);
  };

  window.addEventListener("resize", draw);
  void document.fonts.ready.then(() => {
    if (stopped) return;
    fontsReady = true;
    draw();
    boilTimer = setInterval(() => {
      variant = (variant + 1) % BOIL_VARIANTS;
      drawDoodles(doodles, variant);
    }, BOIL_INTERVAL_MS);
  });

  return {
    stop() {
      stopped = true;
      clearInterval(boilTimer);
    },
  };
}
