export const NVIDIA_GREEN = "#76b900";
export const TITLE_YELLOW = "#ffe600";
export const RESOLUTION_SCALE = 0.5;
const COLOR_LEVELS = 4;
const ALPHA_THRESHOLD = 110;
export const SPRITE_RESOLUTION_SCALE = 0.3;
export const SPRITE_COLOR_LEVELS = 7;

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  return ctx;
}

export function sizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scale = RESOLUTION_SCALE,
): CanvasRenderingContext2D {
  const ctx = context2d(canvas);
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return ctx;
}

export function crush(ctx: CanvasRenderingContext2D, levels = COLOR_LEVELS): void {
  const { width, height } = ctx.canvas;
  if (width === 0 || height === 0) return;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < ALPHA_THRESHOLD) {
      data[i + 3] = 0;
      continue;
    }
    for (let channel = i; channel < i + 3; channel++) {
      data[channel] = Math.round(data[channel]! / step) * step;
    }
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

export function drawBadPhotoshopText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  font: string,
  fill: string,
  stroke: string,
  shadow: string | null,
): number {
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  const strokeRadius = size * 0.06;
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(text, x + size * 0.09, y + size * 0.07);
  }
  ctx.fillStyle = stroke;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.fillText(text, x + Math.cos(angle) * strokeRadius, y + Math.sin(angle) * strokeRadius);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  return x + ctx.measureText(text).width;
}

export interface ButtonColors {
  fill: string;
  ink: string;
  outline: string;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  lines.push(line);
  return lines;
}

export function buttonArt(label: string, width: number, height: number, colors: ButtonColors): string {
  const canvas = document.createElement("canvas");
  const ctx = sizeCanvas(canvas, width, height);

  const shadow = height * 0.1;
  ctx.fillStyle = "#000";
  ctx.fillRect(shadow, shadow, width - shadow, height - shadow);
  ctx.fillStyle = colors.fill;
  ctx.fillRect(0, 0, width - shadow, height - shadow);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = height * 0.06;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - shadow - ctx.lineWidth, height - shadow - ctx.lineWidth);

  const size = height * 0.5;
  const font = `bold ${size}px Arial`;
  ctx.font = font;
  const textWidth = ctx.measureText(label).width;
  drawBadPhotoshopText(ctx, label, (width - shadow - textWidth) / 2, height * 0.6, size, font, colors.ink, colors.outline, null);

  crush(ctx);
  return canvas.toDataURL("image/png");
}
