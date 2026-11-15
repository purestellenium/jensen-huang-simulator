import rough from "roughjs";
import type { RoughCanvas } from "roughjs/bin/canvas";
import { imageFor } from "../images";
import { NVIDIA_GREEN, drawBadPhotoshopText } from "../pixel";
import { STRINGS } from "../strings";
import { QUARTER_LENGTH } from "./quarter";
import { FEDS_PER_STAR, MAX_STARS, type QuarterState, type Stats } from "./types";

const TITLE_FACE = 'Impact, "Arial Black", sans-serif';
const MONEY_GREEN = "#85bb65";
const LIPSTICK = "#ff2a6a";
const SIREN_RED = "#ff2a2a";
const SIREN_BLUE = "#2a5bff";
const PANIC_STARS = 4;
const STAR_GAP = 0.15;
const TIE_PIVOT = { x: 0.78, y: 0.16 };
const GEAR_URL = "images/hud/settings.png";
const GEAR_SCALE = 1.2;
const ICONS = {
  money: "images/hud/money.png",
  affairs: "images/hud/affairs.png",
  feds: "images/hud/feds.png",
  board: "images/hud/board.png",
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Pen {
  rc: RoughCanvas;
  ctx: CanvasRenderingContext2D;
  seed: number;
  meterWidth: number;
  icon: (url: string) => HTMLImageElement | null;
  quarter: QuarterState;
  elapsed: number;
  placed: HudIcon[];
}

export interface HudIcon {
  image: HTMLImageElement;
  matrix: DOMMatrix;
  size: number;
}

export interface HudState {
  stats: Stats;
  turn: number;
  quarter: QuarterState;
  elapsed: number;
}

type Chip = (pen: Pen, s: number, stats: Stats, measureOnly: boolean) => number;

const GAP = 0.2;
const METER_WIDTH = 3.4;
const NARROW_METER_WIDTH = 2.1;

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, measureOnly: boolean): number {
  const font = `${size}px ${TITLE_FACE}`;
  if (measureOnly) {
    ctx.font = font;
    return ctx.measureText(text).width;
  }
  return drawBadPhotoshopText(ctx, text, x, y, size, font, fill, "#000", null) - x;
}

function meter(
  pen: Pen,
  x: number,
  s: number,
  value: number,
  text: string,
  fill: (width: number, height: number) => void,
  rightText?: string,
  lift = 0,
  noLoops = false,
): void {
  const { rc, ctx, seed } = pen;
  const width = s * pen.meterWidth;
  const height = s * 0.62;
  const top = (s - height) / 2 - s * lift;
  const filled = (width * Math.min(100, Math.max(0, value))) / 100;
  if (filled > 0) {
    ctx.save();
    ctx.translate(x, top);
    fill(filled, height);
    ctx.restore();
  }
  rc.rectangle(
    x,
    top,
    width,
    height,
    noLoops
      ? { seed, roughness: 1.8, bowing: 2, disableMultiStroke: true, preserveVertices: true, stroke: "#fff", strokeWidth: 2.5 }
      : { seed, roughness: 2, bowing: 2, stroke: "#fff", strokeWidth: 2.5 },
  );
  const edge = s * 0.18;
  const room = width - edge * 2;
  const split = rightText ? s * 0.25 : 0;
  let size = height * 0.7;
  const natural = label(ctx, text, 0, 0, size, "#fff", true) + (rightText ? label(ctx, rightText, 0, 0, size, "#fff", true) + split : 0);
  if (natural > room) size *= room / natural;
  const baseline = top + height * 0.78;
  label(ctx, text, x + edge, baseline, size, "#fff", false);
  if (rightText) {
    const rightWidth = label(ctx, rightText, 0, 0, size, "#fff", true);
    label(ctx, rightText, x + width - edge - rightWidth, baseline, size, "#fff", false);
  }
}

function drawIcon(pen: Pen, url: string, s: number): void {
  const image = pen.icon(url);
  if (!image) return;
  pen.placed.push({ image, matrix: pen.ctx.getTransform(), size: s });
}

const money: Chip = (pen, s, stats, measureOnly) => {
  const { ctx } = pen;
  const text = STRINGS.amounts.money(stats.money);
  const size = s * 0.62;
  const textWidth = label(ctx, text, 0, 0, size, MONEY_GREEN, true);
  if (measureOnly) return s * (1 + GAP) + textWidth;

  drawIcon(pen, ICONS.money, s);
  label(ctx, text, s * (1 + GAP), s * 0.78, size, MONEY_GREEN, false);
  return s * (1 + GAP) + textWidth;
};

const affairs: Chip = (pen, s, stats, measureOnly) => {
  const { ctx } = pen;
  const text = String(stats.affairs);
  const size = s * 0.62;
  const width = s * (1 + GAP) + label(ctx, text, 0, 0, size, LIPSTICK, true);
  if (measureOnly) return width;

  drawIcon(pen, ICONS.affairs, s);
  label(ctx, text, s * (1 + GAP), s * 0.78, size, LIPSTICK, false);
  return width;
};

function starPoints(cx: number, cy: number, outer: number): [number, number][] {
  const inner = outer * 0.42;
  const points: [number, number][] = [];
  for (let index = 0; index < 10; index++) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

const feds: Chip = (pen, s, stats, measureOnly) => {
  const panic = Math.ceil(stats.feds / FEDS_PER_STAR) >= PANIC_STARS;
  const panicWidth = panic ? s * 0.5 : 0;
  const width = s * (1 + GAP) + s * pen.meterWidth + panicWidth;
  if (measureOnly) return width;
  const { rc, ctx, seed } = pen;

  drawIcon(pen, ICONS.feds, s);

  const size = (s * pen.meterWidth) / (MAX_STARS + (MAX_STARS - 1) * STAR_GAP);
  const left = s * (1 + GAP);
  for (let index = 0; index < MAX_STARS; index++) {
    const cx = left + index * size * (1 + STAR_GAP) + size / 2;
    const cy = s / 2;
    const points = starPoints(cx, cy, size / 2);
    const fraction = Math.min(1, Math.max(0, stats.feds / FEDS_PER_STAR - index));
    if (fraction > 0) {
      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], corner) => (corner === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = panic ? (index % 2 === 0 ? SIREN_RED : SIREN_BLUE) : "#fff";
      ctx.fillRect(cx - size / 2, cy - size / 2, size * fraction, size);
      ctx.restore();
    }
    rc.polygon(points, { seed, roughness: 1.2, stroke: fraction > 0 ? "#fff" : "#777", strokeWidth: 2 });
  }
  if (panic) label(ctx, "!!", s * (1 + GAP + pen.meterWidth + 0.1), s * 0.86, s * 0.8, SIREN_RED, false);
  return width;
};

const board: Chip = (pen, s, stats, measureOnly) => {
  const width = s * (1 + GAP) + s * pen.meterWidth;
  if (measureOnly) return width;
  const { rc, ctx, seed } = pen;
  const confidence = stats.board;
  const color = confidence > 50 ? NVIDIA_GREEN : confidence > 25 ? "#f1c40f" : SIREN_RED;

  ctx.save();
  ctx.translate(s * TIE_PIVOT.x, s * TIE_PIVOT.y);
  ctx.rotate(((100 - confidence) / 100) * 0.6);
  ctx.translate(-s * TIE_PIVOT.x, -s * TIE_PIVOT.y);
  drawIcon(pen, ICONS.board, s);
  ctx.restore();

  meter(pen, s * (1 + GAP), s, confidence, `${STRINGS.hud.stats.board.toUpperCase()} ${confidence}`, (width, height) => {
    rc.rectangle(0, 0, width, height, {
      seed,
      fill: color,
      fillStyle: "zigzag",
      hachureGap: 4,
      fillWeight: 3,
      stroke: "none",
    });
  });
  return width;
};

function drawChartIcon(pen: Pen, s: number): void {
  const { rc, seed } = pen;
  const bar = { seed, roughness: 1.4, stroke: "#fff", strokeWidth: 2, fill: NVIDIA_GREEN, fillStyle: "solid" };
  rc.rectangle(s * 0.12, s * 0.55, s * 0.2, s * 0.35, bar);
  rc.rectangle(s * 0.4, s * 0.4, s * 0.2, s * 0.5, bar);
  rc.rectangle(s * 0.68, s * 0.18, s * 0.2, s * 0.72, bar);
}

const earnings: Chip = (pen, s, _stats, measureOnly) => {
  const { quarter, elapsed, ctx, seed, rc } = pen;
  const tag = quarter.boost > 0 ? STRINGS.hud.debt(quarter.boost) : "";
  const tagSize = s * 0.5;
  const tagWidth = tag ? label(ctx, tag, 0, 0, tagSize, SIREN_RED, true) + s * 0.2 : 0;
  const width = s * (1 + GAP) + s * pen.meterWidth + tagWidth;
  if (measureOnly) return width;

  drawChartIcon(pen, s);

  const progress = Math.min(1, quarter.revenue / quarter.target);
  const pace = elapsed / QUARTER_LENGTH;
  const color = progress >= pace ? NVIDIA_GREEN : progress >= pace * 0.6 ? "#f1c40f" : SIREN_RED;
  const left = s * (1 + GAP);
  meter(
    pen,
    left,
    s,
    progress * 100,
    STRINGS.hud.quarterLabel(quarter.number),
    (fillWidth, height) => {
      rc.rectangle(0, 0, fillWidth, height, {
        seed,
        fill: color,
        fillStyle: "zigzag",
        hachureGap: 4,
        fillWeight: 3,
        stroke: "none",
      });
    },
    STRINGS.hud.progressLabel(quarter.revenue, quarter.target),
    EARNINGS_METER_LIFT,
    true,
  );

  const meterWidth = s * pen.meterWidth;
  const gap = s * 0.08;
  const notch = (meterWidth - gap * (QUARTER_LENGTH - 1)) / QUARTER_LENGTH;
  const notchTop = s * 0.84;
  const notchHeight = s * 0.1;
  for (let index = 0; index < QUARTER_LENGTH; index++) {
    ctx.fillStyle = index < elapsed ? "#fff" : "#555";
    ctx.fillRect(Math.round(left + index * (notch + gap)), Math.round(notchTop), Math.round(notch), Math.round(notchHeight));
  }

  if (tag) label(ctx, tag, left + meterWidth + s * 0.1, s * 0.74, tagSize, SIREN_RED, false);
  return width;
};

const EARNINGS_METER_LIFT = 0.08;

const CHIPS: Chip[] = [money, affairs, feds, earnings, board];
const CHIP_GAP = 0.55;
const MIN_ROW_SCALE = 0.6;
const MARGIN = 16;

interface Row {
  chips: number[];
  y: number;
  height: number;
  reserved: number;
}

function rowFit(ctx: CanvasRenderingContext2D, pens: Pen[], stats: Stats, rect: Rect, row: Row): { s: number; total: number; scale: number } {
  const s = row.height * 0.8;
  const widths = row.chips.map((index) => CHIPS[index]!(pens[index]!, s, stats, true));
  const total = widths.reduce((sum, width) => sum + width, 0) + s * CHIP_GAP * (row.chips.length - 1);
  const available = rect.width - MARGIN * 2 - row.reserved;
  return { s, total, scale: Math.min(1, available / total) };
}

function drawRow(ctx: CanvasRenderingContext2D, pens: Pen[], stats: Stats, rect: Rect, row: Row, bounds: Record<number, Rect>): void {
  const { s, scale } = rowFit(ctx, pens, stats, rect, row);
  const originX = rect.x + MARGIN;
  const originY = row.y + (row.height - s * scale) / 2;
  let cursor = 0;
  ctx.save();
  ctx.translate(originX, originY);
  ctx.scale(scale, scale);
  for (const index of row.chips) {
    const used = CHIPS[index]!(pens[index]!, s, stats, false);
    bounds[index] = { x: originX + cursor * scale, y: originY, width: used * scale, height: s * scale };
    cursor += used + s * CHIP_GAP;
    ctx.translate(used + s * CHIP_GAP, 0);
  }
  ctx.restore();
}

export function paintGear(canvas: HTMLCanvasElement, rect: Rect, repaint: () => void): void {
  const image = imageFor(GEAR_URL, repaint);
  if (!image) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = Math.max(rect.width, rect.height) * GEAR_SCALE;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, rect.x + (rect.width - size) / 2, rect.y + (rect.height - size) / 2, size, size);
}

export const HUD_CHIPS = { money: 0, affairs: 1, feds: 2, earnings: 3, board: 4 } as const;

export interface HudLayout {
  icons: HudIcon[];
  chips: Record<number, Rect>;
}

export function paintHud(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  state: HudState | null,
  repaint: () => void,
  reserved: number,
): HudLayout {
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = NVIDIA_GREEN;
  ctx.fillRect(rect.x, rect.y + rect.height - 3, rect.width, 3);
  const placed: HudIcon[] = [];
  const chips: Record<number, Rect> = {};
  if (!state) return { icons: placed, chips };

  const { stats, turn, quarter, elapsed } = state;
  const rc = rough.canvas(ctx.canvas);
  const icon = (url: string) => imageFor(url, repaint);
  const pens = CHIPS.map(
    (_, index): Pen => ({ rc, ctx, seed: turn * 5 + index + 1, meterWidth: METER_WIDTH, icon, quarter, elapsed, placed }),
  );

  const single: Row = { chips: [0, 1, 2, 3, 4], y: rect.y, height: rect.height, reserved };
  if (rowFit(ctx, pens, stats, rect, single).scale >= MIN_ROW_SCALE) {
    drawRow(ctx, pens, stats, rect, single, chips);
    return { icons: placed, chips };
  }

  for (const pen of pens) pen.meterWidth = NARROW_METER_WIDTH;
  const topHeight = (rect.height - 3) * 0.4;
  const top: Row = { chips: [0, 1], y: rect.y, height: topHeight, reserved };
  const bottom: Row = { chips: [2, 3, 4], y: rect.y + topHeight, height: rect.height - 3 - topHeight, reserved: 0 };
  drawRow(ctx, pens, stats, rect, top, chips);
  drawRow(ctx, pens, stats, rect, bottom, chips);
  return { icons: placed, chips };
}
