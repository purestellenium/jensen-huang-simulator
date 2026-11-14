import rough from "roughjs";
import { crush, drawBadPhotoshopText, sizeCanvas, wrapText } from "./pixel";

export interface OutlineButtonOptions {
  color: string;
  glyph: "yes" | "no" | null;
  fontSize: number;
  paddingLeft: number;
  paddingRight: number;
  hover: boolean;
  disabled: boolean;
  seed: number;
}

export function outlineButtonArt(label: string, width: number, height: number, options: OutlineButtonOptions): string {
  const canvas = document.createElement("canvas");
  const ctx = sizeCanvas(canvas, width, height);
  const rc = rough.canvas(canvas);
  const { fontSize, paddingLeft, paddingRight, seed } = options;

  const accent = options.disabled ? "#777" : options.color;
  const filled = options.hover && !options.disabled;
  const textColor = filled ? "#000" : accent;
  const inset = 5;

  ctx.fillStyle = filled ? accent : "#000";
  ctx.fillRect(inset, inset, width - inset * 2, height - inset * 2);
  rc.rectangle(inset, inset, width - inset * 2, height - inset * 2, {
    seed,
    roughness: 2,
    bowing: 3,
    stroke: options.disabled ? "#555" : "#fff",
    strokeWidth: 3,
  });

  const centerY = height / 2;
  if (options.glyph) {
    const size = fontSize * 0.55;
    const x = fontSize * 1.2;
    const ink = { seed, roughness: 1.5, stroke: textColor, strokeWidth: 5 };
    if (options.glyph === "no") {
      rc.line(x - size, centerY - size, x + size, centerY + size, ink);
      rc.line(x - size, centerY + size, x + size, centerY - size, ink);
    } else {
      rc.linearPath(
        [
          [x - size, centerY],
          [x - size * 0.2, centerY + size],
          [x + size, centerY - size],
        ],
        ink,
      );
    }
  }

  const font = `bold ${fontSize}px Arial`;
  ctx.font = font;
  const lines = wrapText(ctx, label, width - paddingLeft - paddingRight);
  const lineHeight = fontSize * 1.25;
  const top = (height - lines.length * lineHeight) / 2;
  lines.forEach((line, index) => {
    drawBadPhotoshopText(ctx, line, paddingLeft, top + index * lineHeight + fontSize * 0.95, fontSize, font, textColor, filled ? accent : "#000", null);
  });

  crush(ctx);
  return canvas.toDataURL("image/png");
}
