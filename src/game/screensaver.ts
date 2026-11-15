import { crush, sizeCanvas } from "../pixel";
import { getSettings, onSettingsChange } from "../settings";

const SPRITE_WIDTH = 170;
const SPRITE_HEIGHT = 145;
const FRAME_URLS = [1, 2, 3, 4].map((frame) => `/images/gpu/frame${frame}.png`);
const TICK_MS = 90;
const AREA_PER_GPU = 70000;
interface Flyer {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

function loadFrame(url: string, done: (canvas: HTMLCanvasElement) => void): void {
  const image = new Image();
  image.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    const ctx = sizeCanvas(canvas, SPRITE_WIDTH, SPRITE_HEIGHT);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
    crush(ctx);
    done(canvas);
  });
  image.src = url;
}

export class Screensaver {
  private readonly sprites: (HTMLCanvasElement | undefined)[] = [];
  private dirty = true;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private animated = getSettings().movingBackground;
  private flyers: Flyer[] = [];
  private width = 0;
  private height = 0;
  private last = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    FRAME_URLS.forEach((url, index) =>
      loadFrame(url, (frame) => {
        this.sprites[index] = frame;
        this.dirty = true;
      }),
    );
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
      phase: Math.floor(Math.random() * FRAME_URLS.length),
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
        flyer.phase = (flyer.phase + 1) % FRAME_URLS.length;
        if (flyer.x < -SPRITE_WIDTH || flyer.y > height) this.respawn(flyer);
      }
    }

    const ctx = sizeCanvas(this.canvas, width, height);
    ctx.imageSmoothingEnabled = false;
    for (const flyer of this.flyers) {
      const sprite = this.sprites[flyer.phase];
      if (sprite) ctx.drawImage(sprite, Math.round(flyer.x), Math.round(flyer.y), SPRITE_WIDTH, SPRITE_HEIGHT);
    }
  }
}
