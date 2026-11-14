import rough from "roughjs";
import type { RoughCanvas } from "roughjs/bin/canvas";
import { NVIDIA_GREEN, TITLE_YELLOW, drawBadPhotoshopText } from "../pixel";
import { STRINGS } from "../strings";
import type { Stats } from "./types";

const TITLE_FACE = 'Impact, "Arial Black", sans-serif';
const MONEY_GREEN = "#85bb65";
const LIPSTICK = "#ff2a6a";
const SIREN_RED = "#ff2a2a";
const SIREN_BLUE = "#2a5bff";
const MAX_TALLIES = 15;
const FEDS_PANIC = 70;
const WIFE_STEAM = 85;

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
  // Meter length in icon widths.
  meterWidth: number;
}

// Each chip draws an icon in an s-by-s box at (0, 0) and returns the width it used.
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

function meter(pen: Pen, x: number, s: number, value: number, name: string, fill: (width: number, height: number) => void): void {
  const { rc, ctx, seed } = pen;
  const width = s * pen.meterWidth;
  const height = s * 0.62;
  const top = (s - height) / 2;
  const filled = (width * Math.min(100, Math.max(0, value))) / 100;
  if (filled > 0) {
    ctx.save();
    ctx.translate(x, top);
    fill(filled, height);
    ctx.restore();
  }
  rc.rectangle(x, top, width, height, { seed, roughness: 2, bowing: 2, stroke: "#fff", strokeWidth: 2.5 });
  const size = height * 0.7;
  label(ctx, `${name} ${value}`, x + s * 0.18, top + height * 0.78, size, "#fff", false);
}

const money: Chip = ({ rc, ctx, seed }, s, stats, measureOnly) => {
  const text = STRINGS.amounts.money(stats.money);
  const size = s * 0.62;
  const textWidth = label(ctx, text, 0, 0, size, MONEY_GREEN, true);
  if (measureOnly) return s * (1 + GAP) + textWidth;

  rc.ellipse(s * 0.5, s * 0.62, s * 0.86, s * 0.72, { seed, fill: "#b8893a", fillStyle: "solid", stroke: "#fff", strokeWidth: 2, roughness: 1.6 });
  rc.polygon(
    [
      [s * 0.32, s * 0.08],
      [s * 0.68, s * 0.08],
      [s * 0.58, s * 0.3],
      [s * 0.42, s * 0.3],
    ],
    { seed, fill: "#b8893a", fillStyle: "solid", stroke: "#fff", strokeWidth: 2, roughness: 1.6 },
  );
  rc.line(s * 0.36, s * 0.3, s * 0.64, s * 0.3, { seed, stroke: "#5a3a10", strokeWidth: 3 });
  label(ctx, "$", s * 0.36, s * 0.84, s * 0.48, MONEY_GREEN, false);
  label(ctx, text, s * (1 + GAP), s * 0.78, size, MONEY_GREEN, false);
  return s * (1 + GAP) + textWidth;
};

const affairs: Chip = ({ rc, ctx, seed }, s, stats, measureOnly) => {
  const count = stats.affairs;
  const tallyGap = s * 0.16;
  const tallies = Math.min(count, MAX_TALLIES);
  const tallyWidth = tallies === 0 ? 0 : tallies * tallyGap + Math.floor((tallies - 1) / 5) * tallyGap;
  const extra = count > MAX_TALLIES ? `+${count - MAX_TALLIES}` : count === 0 ? "0" : "";
  const extraWidth = extra ? label(ctx, extra, 0, 0, s * 0.62, LIPSTICK, true) + tallyGap : 0;
  const width = s * (1 + GAP) + tallyWidth + extraWidth;
  if (measureOnly) return width;

  const lips = { seed, fill: LIPSTICK, fillStyle: "solid", stroke: LIPSTICK, strokeWidth: 1.5, roughness: 1.4 };
  rc.path(`M ${s * 0.08} ${s * 0.5} Q ${s * 0.3} ${s * 0.18} ${s * 0.5} ${s * 0.4} Q ${s * 0.7} ${s * 0.18} ${s * 0.92} ${s * 0.5} Z`, lips);
  rc.path(`M ${s * 0.08} ${s * 0.54} Q ${s * 0.5} ${s * 0.98} ${s * 0.92} ${s * 0.54} Z`, lips);
  rc.line(s * 0.14, s * 0.52, s * 0.86, s * 0.52, { seed, stroke: "#000", strokeWidth: 1.5, roughness: 2 });

  let x = s * (1 + GAP);
  const ink = { seed, stroke: "#fff", strokeWidth: 2.5, roughness: 1.8 };
  for (let index = 0; index < tallies; index++) {
    if (index % 5 === 4) {
      rc.line(x - tallyGap * 4.3, s * 0.72, x + tallyGap * 0.1, s * 0.28, { ...ink, stroke: LIPSTICK });
      x += tallyGap * 2;
      continue;
    }
    rc.line(x, s * 0.2, x, s * 0.8, ink);
    x += tallyGap;
  }
  if (extra) label(ctx, extra, x, s * 0.78, s * 0.62, LIPSTICK, false);
  return width;
};

const feds: Chip = (pen, s, stats, measureOnly) => {
  const panic = stats.feds >= FEDS_PANIC;
  const panicWidth = panic ? s * 0.5 : 0;
  const width = s * (1 + GAP) + s * pen.meterWidth + panicWidth;
  if (measureOnly) return width;
  const { rc, ctx, seed } = pen;

  const lens = { seed, fill: "#111", fillStyle: "solid", stroke: "#fff", strokeWidth: 2, roughness: 1.5 };
  rc.polygon(
    [
      [s * 0.04, s * 0.18],
      [s * 0.46, s * 0.18],
      [s * 0.4, s * 0.48],
      [s * 0.1, s * 0.48],
    ],
    lens,
  );
  rc.polygon(
    [
      [s * 0.54, s * 0.18],
      [s * 0.96, s * 0.18],
      [s * 0.9, s * 0.48],
      [s * 0.6, s * 0.48],
    ],
    lens,
  );
  rc.line(s * 0.46, s * 0.22, s * 0.54, s * 0.22, { seed, stroke: "#fff", strokeWidth: 2 });
  label(ctx, "FBI", s * 0.12, s * 0.94, s * 0.42, TITLE_YELLOW, false);

  meter(pen, s * (1 + GAP), s, stats.feds, STRINGS.hud.stats.feds.toUpperCase(), (width, height) => {
    const stripe = height * 0.8;
    for (let x = 0, index = 0; x < width; x += stripe, index++) {
      ctx.fillStyle = index % 2 === 0 ? SIREN_RED : SIREN_BLUE;
      ctx.fillRect(x, 0, Math.min(stripe, width - x), height);
    }
  });
  if (panic) label(ctx, "!!", s * (1 + GAP + pen.meterWidth + 0.1), s * 0.86, s * 0.8, SIREN_RED, false);
  return width;
};

const wife: Chip = (pen, s, stats, measureOnly) => {
  const steam = stats.wife >= WIFE_STEAM;
  const width = s * (1 + GAP) + s * pen.meterWidth;
  if (measureOnly) return width;
  const { rc, seed } = pen;
  const mood = stats.wife;

  const skin = mood >= WIFE_STEAM ? "#ff5a3a" : "#f2c29a";
  rc.arc(s * 0.5, s * 0.5, s * 0.92, s * 0.92, Math.PI, Math.PI * 2, false, { seed, fill: "#5a2a10", fillStyle: "solid", stroke: "#5a2a10", roughness: 1.6 });
  rc.circle(s * 0.5, s * 0.56, s * 0.74, { seed, fill: skin, fillStyle: "solid", stroke: "#fff", strokeWidth: 2, roughness: 1.4 });
  const ink = { seed, stroke: "#000", strokeWidth: 2.5, roughness: 1.2 };
  rc.circle(s * 0.38, s * 0.5, s * 0.08, { ...ink, fill: "#000", fillStyle: "solid" });
  rc.circle(s * 0.62, s * 0.5, s * 0.08, { ...ink, fill: "#000", fillStyle: "solid" });
  if (mood >= 60) {
    rc.line(s * 0.28, s * 0.36, s * 0.44, s * 0.43, ink);
    rc.line(s * 0.72, s * 0.36, s * 0.56, s * 0.43, ink);
  }
  if (mood < 30) {
    rc.path(`M ${s * 0.34} ${s * 0.68} Q ${s * 0.5} ${s * 0.82} ${s * 0.66} ${s * 0.68}`, ink);
  } else if (mood < 60) {
    rc.line(s * 0.36, s * 0.73, s * 0.64, s * 0.73, ink);
  } else {
    rc.path(`M ${s * 0.34} ${s * 0.78} Q ${s * 0.5} ${s * 0.64} ${s * 0.66} ${s * 0.78}`, ink);
  }
  if (steam) {
    const puff = { seed, stroke: "#fff", strokeWidth: 2, roughness: 2.2 };
    rc.path(`M ${s * 0.08} ${s * 0.2} Q ${s * 0} ${s * 0.1} ${s * 0.08} ${s * 0}`, puff);
    rc.path(`M ${s * 0.92} ${s * 0.2} Q ${s * 1} ${s * 0.1} ${s * 0.92} ${s * 0}`, puff);
  }

  meter(pen, s * (1 + GAP), s, stats.wife, STRINGS.hud.stats.wife.toUpperCase(), (width, height) => {
    rc.rectangle(0, 0, width, height, {
      seed,
      fill: LIPSTICK,
      fillStyle: "cross-hatch",
      hachureGap: 4,
      fillWeight: 2.5,
      stroke: "none",
    });
  });
  return width;
};

const board: Chip = (pen, s, stats, measureOnly) => {
  const width = s * (1 + GAP) + s * pen.meterWidth;
  if (measureOnly) return width;
  const { rc, ctx, seed } = pen;
  const confidence = stats.board;
  const color = confidence > 50 ? NVIDIA_GREEN : confidence > 25 ? "#f1c40f" : SIREN_RED;

  ctx.save();
  ctx.translate(s * 0.5, s * 0.1);
  ctx.rotate(((100 - confidence) / 100) * 0.9);
  const tie = { seed, fill: "#338eda", fillStyle: "solid", stroke: "#fff", strokeWidth: 2, roughness: 1.5 };
  rc.polygon(
    [
      [-s * 0.14, 0],
      [s * 0.14, 0],
      [s * 0.08, s * 0.16],
      [-s * 0.08, s * 0.16],
    ],
    tie,
  );
  rc.polygon(
    [
      [-s * 0.08, s * 0.16],
      [s * 0.08, s * 0.16],
      [s * 0.2, s * 0.7],
      [0, s * 0.86],
      [-s * 0.2, s * 0.7],
    ],
    { ...tie, fill: "#338eda", fillStyle: "zigzag", hachureGap: 3 },
  );
  ctx.restore();

  meter(pen, s * (1 + GAP), s, confidence, STRINGS.hud.stats.board.toUpperCase(), (width, height) => {
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

const CHIPS: Chip[] = [money, affairs, feds, wife, board];
const CHIP_GAP = 0.55;
// Below this fit scale on one row, the meters move to a second row.
const MIN_ROW_SCALE = 0.6;
const MARGIN = 16;

interface Row {
  chips: number[];
  y: number;
  height: number;
  // Space taken on the left of the row by the turn label.
  reserved: number;
}

function rowFit(ctx: CanvasRenderingContext2D, pens: Pen[], stats: Stats, rect: Rect, row: Row): { s: number; total: number; scale: number } {
  const s = row.height * 0.8;
  const widths = row.chips.map((index) => CHIPS[index]!(pens[index]!, s, stats, true));
  const total = widths.reduce((sum, width) => sum + width, 0) + s * CHIP_GAP * (row.chips.length - 1);
  const available = rect.width - MARGIN * 2 - row.reserved;
  return { s, total, scale: Math.min(1, available / total) };
}

function drawRow(ctx: CanvasRenderingContext2D, pens: Pen[], stats: Stats, rect: Rect, row: Row): void {
  const { s, total, scale } = rowFit(ctx, pens, stats, rect, row);
  ctx.save();
  ctx.translate(rect.x + rect.width - MARGIN - total * scale, row.y + (row.height - s * scale) / 2);
  ctx.scale(scale, scale);
  for (const index of row.chips) {
    const used = CHIPS[index]!(pens[index]!, s, stats, false);
    ctx.translate(used + s * CHIP_GAP, 0);
  }
  ctx.restore();
}

export function paintHud(ctx: CanvasRenderingContext2D, rect: Rect, stats: Stats | null, turn: number): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = NVIDIA_GREEN;
  ctx.fillRect(rect.x, rect.y + rect.height - 3, rect.width, 3);
  if (!stats) return;

  const rc = rough.canvas(ctx.canvas);
  const pens = CHIPS.map((_, index): Pen => ({ rc, ctx, seed: turn * 5 + index + 1, meterWidth: METER_WIDTH }));
  const turnLabel = `${STRINGS.hud.turn} ${turn}`;

  const paintTurn = (rowY: number, rowHeight: number): number => {
    const size = rowHeight * 0.42;
    const font = `${size}px ${TITLE_FACE}`;
    return drawBadPhotoshopText(ctx, turnLabel, rect.x + MARGIN, rowY + rowHeight * 0.64, size, font, TITLE_YELLOW, "#000", null) - rect.x;
  };

  const measureTurn = (rowHeight: number): number => {
    ctx.font = `${rowHeight * 0.42}px ${TITLE_FACE}`;
    return ctx.measureText(turnLabel).width + MARGIN;
  };

  const single: Row = { chips: [0, 1, 2, 3, 4], y: rect.y, height: rect.height, reserved: measureTurn(rect.height) };
  if (rowFit(ctx, pens, stats, rect, single).scale >= MIN_ROW_SCALE) {
    paintTurn(single.y, single.height);
    drawRow(ctx, pens, stats, rect, single);
    return;
  }

  for (const pen of pens) pen.meterWidth = NARROW_METER_WIDTH;
  // The meter row is wider, so it gets more of the height.
  const topHeight = (rect.height - 3) * 0.4;
  const top: Row = { chips: [0, 1], y: rect.y, height: topHeight, reserved: measureTurn(topHeight) };
  const bottom: Row = { chips: [2, 3, 4], y: rect.y + topHeight, height: rect.height - 3 - topHeight, reserved: 0 };
  paintTurn(top.y, top.height);
  drawRow(ctx, pens, stats, rect, top);
  drawRow(ctx, pens, stats, rect, bottom);
}
