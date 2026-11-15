import rough from "roughjs";
import { NVIDIA_GREEN, crush, sizeCanvas } from "../pixel";
import { getSettings, onSettingsChange } from "../settings";

const SPRITE_WIDTH = 170;
const SPRITE_HEIGHT = 136;
const BODY_DROP = 24;
const FRAME_ANGLES = [-0.95, -0.4, 0.3, -0.4];
const TICK_MS = 90;
const AREA_PER_GPU = 70000;
const WING_SHAPE: [number, number][] = [
  [0, 0],
  [30, -14],
  [84, -10],
  [74, 8],
  [64, 2],
  [54, 20],
  [42, 12],
  [30, 26],
  [18, 16],
  [6, 22],
];

interface Flyer {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

function wingPath(rootX: number, rootY: number, angle: number): [number, number][] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return WING_SHAPE.map(([x, y]) => [rootX + x * cos - y * sin, rootY + x * sin + y * cos]);
}

type Line = { seed: number; roughness: number; bowing: number; disableMultiStroke: boolean; strokeWidth: number };
type Rough = ReturnType<typeof rough.canvas>;

const BODY: { wingRoot: [number, number]; draw: (rc: Rough, line: Line, index: number) => void } = {
  wingRoot: [78, 62],
  draw(rc, line, index) {
    rc.rectangle(14, 62, 118, 38, { ...line, stroke: "#fff", fill: "#333", fillStyle: "solid" });
    rc.line(18, 66, 128, 66, { ...line, stroke: NVIDIA_GREEN, strokeWidth: 5 });
    rc.rectangle(130, 54, 8, 54, { ...line, stroke: "#ccc", fill: "#999", fillStyle: "solid" });
    rc.rectangle(38, 100, 58, 7, { ...line, stroke: "#b8860b", fill: "#ffd700", fillStyle: "solid" });
    for (const centerX of [50, 98]) {
      const centerY = 82;
      rc.circle(centerX, centerY, 30, { ...line, stroke: "#bbb", fill: "#111", fillStyle: "solid" });
      for (let blade = 0; blade < 3; blade++) {
        const spin = index * 0.7 + (blade * Math.PI * 2) / 3;
        rc.line(centerX, centerY, centerX + Math.cos(spin) * 13, centerY + Math.sin(spin) * 13, { ...line, stroke: "#bbb", strokeWidth: 2 });
      }
    }
  },
};

function drawFrame(index: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = sizeCanvas(canvas, SPRITE_WIDTH, SPRITE_HEIGHT);
  ctx.translate(0, BODY_DROP);
  const rc = rough.canvas(canvas);
  const angle = FRAME_ANGLES[index]!;
  const line = { seed: index + 1, roughness: 1.6, bowing: 2, disableMultiStroke: true, strokeWidth: 3 };
  const [rootX, rootY] = BODY.wingRoot;

  rc.polygon(wingPath(rootX + 10, rootY - 3, angle - 0.25), { ...line, stroke: "#888", fill: "#aaa", fillStyle: "solid" });
  BODY.draw(rc, line, index);
  rc.polygon(wingPath(rootX, rootY, angle), { ...line, stroke: "#ddd", fill: "#fff", fillStyle: "solid" });

  crush(ctx);
  return canvas;
}

function drawFrames(): HTMLCanvasElement[] {
  return FRAME_ANGLES.map((_, index) => drawFrame(index));
}

export class Screensaver {
  private readonly sprites = drawFrames();
  private dirty = true;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private animated = getSettings().movingBackground;
  private flyers: Flyer[] = [];
  private width = 0;
  private height = 0;
  private last = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    onSettingsChange(() => {
      this.animated = getSettings().movingBackground;
      this.dirty = true;
    });
    requestAnimationFrame((time) => this.loop(time));
  }

  private get still(): boolean {
    return this.reducedMotion.matches || !this.animated;
  }

  private resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const count = Math.max(4, Math.round((width * height) / AREA_PER_GPU));
    this.flyers = Array.from({ length: count }, () => ({
      x: Math.random() * (width + SPRITE_WIDTH) - SPRITE_WIDTH,
      y: Math.random() * (height + SPRITE_HEIGHT) - SPRITE_HEIGHT,
      speed: 3 + Math.floor(Math.random() * 3),
      phase: Math.floor(Math.random() * FRAME_ANGLES.length),
    }));
  }

  private respawn(flyer: Flyer): void {
    if (Math.random() < this.width / (this.width + this.height)) {
      flyer.x = Math.random() * this.width + SPRITE_WIDTH;
      flyer.y = -SPRITE_HEIGHT;
    } else {
      flyer.x = this.width;
      flyer.y = Math.random() * this.height - SPRITE_HEIGHT;
    }
  }

  private loop(time: number): void {
    requestAnimationFrame((next) => this.loop(next));
    if (this.canvas.getClientRects().length === 0 || time - this.last < TICK_MS) return;
    this.last = time;

    const { width, height } = this.canvas.getBoundingClientRect();
    const resized = width !== this.width || height !== this.height;
    if (resized) this.resize(width, height);
    if (this.still && !resized && !this.dirty) return;
    this.dirty = false;

    if (!this.still) {
      for (const flyer of this.flyers) {
        flyer.x -= flyer.speed * 2;
        flyer.y += flyer.speed;
        flyer.phase = (flyer.phase + 1) % FRAME_ANGLES.length;
        if (flyer.x < -SPRITE_WIDTH || flyer.y > height) this.respawn(flyer);
      }
    }

    const ctx = sizeCanvas(this.canvas, width, height);
    ctx.imageSmoothingEnabled = false;
    for (const flyer of this.flyers) {
      ctx.drawImage(this.sprites[flyer.phase]!, Math.round(flyer.x), Math.round(flyer.y), SPRITE_WIDTH, SPRITE_HEIGHT);
    }
  }
}
