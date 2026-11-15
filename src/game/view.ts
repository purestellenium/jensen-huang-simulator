import rough from "roughjs";
import {
  NVIDIA_GREEN,
  RESOLUTION_SCALE,
  SPRITE_COLOR_LEVELS,
  SPRITE_RESOLUTION_SCALE,
  crush,
  drawBadPhotoshopText,
  sizeCanvas,
  wrapText,
} from "../pixel";
import { imageFor } from "../images";
import { playSound } from "../audio";
import { getSettings, textIntervalMs } from "../settings";
import { isSettingsOpen, openSettings } from "../settingsPanel";
import { outlineButtonArt } from "../sketch";
import { paintGear, paintHud, type HudIcon } from "./hud";
import { Screensaver } from "./screensaver";
import { STRINGS } from "../strings";
import { APPS, APP_ORDER } from "./apps";
import { CONTACTS, type Contact } from "./content";
import { choiceAvailable, choicePreview, type PreviewPart } from "./engine";
import type { Identity } from "./identity";
import { QUARTER_LENGTH } from "./quarter";
import { FEDS_PER_STAR, type AppId, type Choice, type GameState, type QuarterState, type Stats, type Tone } from "./types";

const TYPE_SOUND_GAP_MS = 45;
const TYPE_SOUND_VARIATION = 0.06;
const TITLE_FACE = 'Impact, "Arial Black", sans-serif';
const TEXT_FACE = "Arial, sans-serif";
const BANNER_COLOR = "#ff2a2a";
const NEWSFLASH_SPRITE_SCALE = 0.85;
const NEWSFLASH_SPRITE_LEVELS = 16;
const SCRIBBLE_INK = "#000000";
const SCRIBBLE_PAPER = "#ffffff";
const SCRIBBLE_LOOPS = 46;
const SCRIBBLE_STEPS_PER_LOOP = 22;
const SCRIBBLE_SCALE = 0.25;
const SCRIBBLE_WIDTH = 0.026;
const SCRIBBLE_MS = 2600;
const YES_COLOR = "#2aff2a";
const NO_COLOR = "#ff2a2a";

const STAT_LABELS: [keyof Stats, string][] = [
  ["money", STRINGS.hud.stats.money],
  ["affairs", STRINGS.hud.stats.affairs],
  ["feds", STRINGS.hud.stats.feds],
  ["board", STRINGS.hud.stats.board],
];

interface Scribble {
  points: [number, number][];
  added: number;
  hidden: number;
}

function makeScribble(): Scribble {
  const points: [number, number][] = [];
  let cx = 0.5;
  let cy = 0.5;
  let phase = Math.random() * Math.PI * 2;
  for (let loop = 0; loop < SCRIBBLE_LOOPS; loop++) {
    const rx = 0.22 + Math.random() * 0.3;
    const ry = 0.22 + Math.random() * 0.3;
    const tilt = (Math.random() - 0.5) * 1.2;
    const driftX = 0.08 + Math.random() * 0.84;
    const driftY = 0.08 + Math.random() * 0.84;
    const startX = cx;
    const startY = cy;
    for (let step = 0; step < SCRIBBLE_STEPS_PER_LOOP; step++) {
      const t = step / SCRIBBLE_STEPS_PER_LOOP;
      const angle = phase + t * Math.PI * 2;
      const ex = Math.cos(angle) * rx;
      const ey = Math.sin(angle) * ry;
      const blend = t;
      const centerX = startX + (driftX - startX) * blend;
      const centerY = startY + (driftY - startY) * blend;
      points.push([centerX + ex * Math.cos(tilt) - ey * Math.sin(tilt), centerY + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
    cx = driftX;
    cy = driftY;
    phase += 0.9 + Math.random() * 1.4;
  }
  return { points, added: 0, hidden: 0 };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  parent?.append(node);
  return node;
}

function formatStat(key: keyof Stats, value: number): string {
  if (key === "money") return STRINGS.amounts.money(value);
  if (key === "feds") return STRINGS.amounts.stars(Math.ceil(value / FEDS_PER_STAR));
  return String(value);
}

export class GameView {
  private readonly art: HTMLCanvasElement;
  private readonly sprites: HTMLCanvasElement;
  private readonly ink: HTMLCanvasElement;
  private readonly hud: HTMLElement;
  private readonly hudIcons: HTMLCanvasElement;
  private readonly hudText: HTMLElement;
  private readonly gearButton: HTMLButtonElement;
  private readonly card: HTMLElement;
  private readonly portrait: HTMLElement;
  private readonly message: HTMLElement;
  private readonly textArt: HTMLCanvasElement;
  private readonly spoken: HTMLElement;
  private readonly choices: HTMLElement;
  private readonly cue: HTMLCanvasElement;
  private readonly preview: HTMLCanvasElement;
  private readonly dock: HTMLElement;
  private readonly slots = new Map<AppId, HTMLElement>();

  private stats: Stats | null = null;
  private quarter: QuarterState | null = null;
  private elapsed = 0;
  private turn = 1;
  private activeApp: AppId | null = null;
  private contact: Contact | null = null;
  private line = "";
  private shown = 0;
  private lastPop = 0;
  private newsflashing = false;
  private bannered = true;
  private highlighted: number | null = null;
  private caption = "";
  private scribble: Scribble | null = null;
  private choiceButtons: HTMLButtonElement[] = [];
  private skipTyping: (() => void) | null = null;

  constructor(private readonly root: HTMLElement) {
    root.replaceChildren();
    const backdrop = el("canvas", "art", root);
    backdrop.setAttribute("aria-hidden", "true");
    new Screensaver(backdrop);
    this.art = el("canvas", "art", root);
    this.art.setAttribute("aria-hidden", "true");
    this.sprites = el("canvas", "art", root);
    this.sprites.setAttribute("aria-hidden", "true");
    this.ink = el("canvas", "art", root);
    this.ink.setAttribute("aria-hidden", "true");
    this.hud = el("div", "hud", root);
    this.hud.setAttribute("role", "status");
    this.hudIcons = el("canvas", "art", this.hud);
    this.hudIcons.setAttribute("aria-hidden", "true");
    this.hudText = el("span", "sr", this.hud);
    this.gearButton = el("button", "hud-settings", this.hud);
    this.gearButton.type = "button";
    this.gearButton.setAttribute("aria-label", STRINGS.title.settings);
    this.gearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openSettings(this.gearButton);
    });

    const table = el("div", "table", root);
    this.card = el("div", "card", table);
    this.portrait = el("div", "portrait", this.card);
    this.message = el("div", "message", this.card);
    this.textArt = el("canvas", "text-art", this.message);
    this.textArt.setAttribute("aria-hidden", "true");
    this.spoken = el("p", "sr", this.message);
    this.spoken.setAttribute("aria-live", "polite");
    this.choices = el("div", "choices", this.card);
    this.cue = el("canvas", "cue", this.card);
    this.cue.setAttribute("aria-hidden", "true");
    this.cue.hidden = true;
    this.preview = el("canvas", "preview", this.card);
    this.preview.setAttribute("aria-hidden", "true");

    this.dock = el("div", "dock", root);
    for (const id of APP_ORDER) {
      const slot = el("div", "app", this.dock);
      slot.setAttribute("role", "img");
      slot.setAttribute("aria-label", APPS[id].name);
      this.slots.set(id, slot);
    }

    this.card.addEventListener("click", (event) => {
      if (!this.skipTyping) return;
      event.stopPropagation();
      this.skipTyping();
    });
    window.addEventListener("keydown", (event) => {
      if (isSettingsOpen()) return;
      if (this.skipTyping && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        this.skipTyping();
      }
    });
    window.addEventListener("resize", () => this.paintAll());
    this.openApp(null);
  }

  updateStats(state: GameState): void {
    this.turn = state.turn;
    this.stats = { ...state.stats };
    this.quarter = { ...state.quarter };
    this.elapsed = state.turn - state.quarter.startTurn;
    const summary = STAT_LABELS.map(([key, label]) => `${label} ${formatStat(key, state.stats[key])}`).join(", ");
    const quarterSummary = STRINGS.hud.summaryQuarter(
      state.quarter.number,
      state.quarter.revenue,
      state.quarter.target,
      Math.max(0, QUARTER_LENGTH - this.elapsed),
    );
    this.hudText.textContent = `${STRINGS.hud.summaryTurn(state.turn)} ${summary}. ${quarterSummary}`;
    this.paintArt();
  }

  openApp(app: AppId | null, contactId?: string, choiceCount = 0): void {
    this.card.style.setProperty("--choice-count", String(choiceCount));
    this.activeApp = app;
    this.contact = contactId ? (CONTACTS[contactId] ?? null) : null;
    this.newsflashing = false;
    this.caption = "";
    this.card.classList.remove("newsflash", "plain-portrait");
    if (contactId && !CONTACTS[contactId]) throw new Error(`Unknown contact "${contactId}"`);
    this.portrait.hidden = this.contact === null;
    this.card.classList.toggle("no-portrait", this.contact === null);
    this.paintArt();
  }

  highlightChip(chip: number | null): void {
    this.highlighted = chip;
    this.paintArt();
  }

  showNewsflash(identity: Identity, bannered = true): void {
    this.bannered = bannered;
    this.card.style.setProperty("--choice-count", "0");
    this.activeApp = null;
    this.newsflashing = true;
    this.caption = identity.name;
    this.contact = { emoji: "", color: "#000", image: identity.image };
    this.portrait.hidden = false;
    this.card.classList.remove("no-portrait");
    this.card.classList.add("newsflash");
    this.card.classList.toggle("plain-portrait", !bannered);
    this.paintArt();
  }

  clearText(): void {
    this.line = "";
    this.shown = 0;
    this.spoken.textContent = "";
    this.paintText();
  }

  async transform(next: Identity): Promise<void> {
    const scribble = makeScribble();
    this.scribble = scribble;
    const total = scribble.points.length;
    let swapped = false;
    await new Promise<void>((resolve) => {
      const begin = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - begin) / SCRIBBLE_MS);
        if (progress < 0.5) {
          scribble.added = Math.floor(total * progress * 2);
        } else {
          if (!swapped) {
            swapped = true;
            scribble.added = total;
            this.caption = next.name;
            this.contact = { emoji: "", color: "#000", image: next.image };
            this.paintArt();
          }
          scribble.hidden = Math.floor(total * (progress - 0.5) * 2);
        }
        this.paintPortraitNow();
        if (progress < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    this.scribble = null;
    this.paintPortraitNow();
  }

  private paintPortraitNow(): void {
    const bounds = this.root.getBoundingClientRect();
    const rect = this.portrait.getBoundingClientRect();
    const area = this.contact ? { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height } : null;
    this.paintPortrait(bounds, area);
    this.paintInk(bounds, area);
  }

  private paintInk(bounds: DOMRect, portrait: Rect | null): void {
    const ctx = sizeCanvas(this.ink, bounds.width, bounds.height, SCRIBBLE_SCALE);
    if (!portrait || !this.scribble) return;
    const inset = 5;
    this.paintScribble(ctx, this.scribble, {
      x: portrait.x + inset,
      y: portrait.y + inset,
      width: portrait.width - inset * 2,
      height: portrait.height - inset * 2,
    });
    crush(ctx, 2);
  }

  async say(line: string): Promise<void> {
    this.line = line;
    this.shown = 0;
    this.spoken.textContent = line;
    this.cue.hidden = true;
    this.clearChoices();
    this.paintText();

    const interval = textIntervalMs(getSettings().textSpeed);
    if (interval === 0) {
      this.shown = line.length;
      this.paintText();
      return;
    }

    await new Promise<void>((resolve) => {
      const finish = () => {
        clearInterval(timer);
        this.skipTyping = null;
        this.shown = line.length;
        this.paintText();
        resolve();
      };
      const timer = setInterval(() => {
        this.shown += 1;
        this.paintText();
        const character = line[this.shown - 1];
        const now = performance.now();
        if (character && character.trim() !== "" && now - this.lastPop >= TYPE_SOUND_GAP_MS) {
          this.lastPop = now;
          playSound("pop", TYPE_SOUND_VARIATION);
        }
        if (this.shown >= line.length) finish();
      }, interval);
      this.skipTyping = finish;
    });
  }

  async waitForContinue(): Promise<void> {
    this.cue.hidden = false;
    this.paintCue();
    await new Promise<void>((resolve) => {
      const done = () => {
        this.root.removeEventListener("click", onClick);
        window.removeEventListener("keydown", onKey);
        this.cue.hidden = true;
        resolve();
      };
      const onClick = () => done();
      const onKey = (event: KeyboardEvent) => {
        if (isSettingsOpen()) return;
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          done();
        }
      };
      this.root.addEventListener("click", onClick);
      window.addEventListener("keydown", onKey);
    });
  }

  async narrate(line: string): Promise<void> {
    await this.say(line);
    await this.waitForContinue();
  }

  async choose(state: GameState, options: Choice[]): Promise<Choice> {
    this.clearChoices();
    return new Promise<Choice>((resolve) => {
      const pick = (choice: Choice) => {
        window.removeEventListener("keydown", onKey);
        this.clearChoices();
        resolve(choice);
      };
      this.choiceButtons = options.map((choice) => {
        const button = el("button", "choice", this.choices);
        button.type = "button";
        button.dataset.tone = choice.tone ?? "neutral";
        button.textContent = choice.label;
        const available = choiceAvailable(state, choice);
        button.disabled = !available;
        if (available) {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            pick(choice);
          });
          const show = () => this.paintPreview(choicePreview(choice));
          const hide = () => this.paintPreview([]);
          button.addEventListener("mouseenter", show);
          button.addEventListener("focus", show);
          button.addEventListener("mouseleave", hide);
          button.addEventListener("blur", hide);
        }
        return button;
      });
      const onKey = (event: KeyboardEvent) => {
        if (isSettingsOpen()) return;
        const index = Number(event.key) - 1;
        const choice = options[index];
        if (choice && !this.choiceButtons[index]?.disabled) pick(choice);
      };
      window.addEventListener("keydown", onKey);
      this.paintChoices();
      this.paintArt();
      this.paintText();
    });
  }

  private clearChoices(): void {
    this.choiceButtons = [];
    this.choices.replaceChildren();
    this.paintPreview([]);
    this.paintArt();
    this.paintText();
  }

  private paintAll(): void {
    this.paintArt();
    this.paintText();
    this.paintChoices();
    if (!this.cue.hidden) this.paintCue();
  }

  private paintArt(): void {
    const bounds = this.root.getBoundingClientRect();
    const ctx = sizeCanvas(this.art, bounds.width, bounds.height);
    const at = (node: HTMLElement): Rect => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
    };

    const hudState = this.stats && this.quarter ? { stats: this.stats, turn: this.turn, quarter: this.quarter, elapsed: this.elapsed } : null;
    const hud = at(this.hud);
    const gear = at(this.gearButton);
    const reserved = hud.x + hud.width - gear.x + 8;
    const { icons, chips } = paintHud(ctx, hud, hudState, () => this.paintArt(), reserved);
    const marked = this.highlighted === null ? undefined : chips[this.highlighted];
    if (marked) this.paintMarker(marked);
    this.paintHudIcons(hud, icons, { ...gear, x: gear.x - hud.x, y: gear.y - hud.y });
    this.paintCard(ctx, at(this.card), this.contact ? at(this.portrait) : null);
    this.paintDock(ctx, at(this.dock));
    crush(ctx);
    this.paintPortrait(bounds, this.contact ? at(this.portrait) : null);
  }

  private paintMarker(chip: Rect): void {
    const rc = rough.canvas(this.art);
    const pad = 8;
    rc.rectangle(chip.x - pad, chip.y - pad, chip.width + pad * 2, chip.height + pad * 2, {
      seed: 77,
      roughness: 1.8,
      bowing: 2,
      disableMultiStroke: true,
      stroke: NVIDIA_GREEN,
      strokeWidth: 5,
    });
  }

  private paintHudIcons(rect: Rect, icons: HudIcon[], gear: Rect): void {
    const ctx = sizeCanvas(this.hudIcons, rect.width, rect.height, 1);
    const toCss = 1 / RESOLUTION_SCALE;
    ctx.imageSmoothingQuality = "high";
    for (const { image, matrix, size } of icons) {
      ctx.setTransform(
        matrix.a * toCss,
        matrix.b * toCss,
        matrix.c * toCss,
        matrix.d * toCss,
        matrix.e * toCss - rect.x,
        matrix.f * toCss - rect.y,
      );
      ctx.drawImage(image, 0, 0, size, size);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    paintGear(this.hudIcons, gear);
    crush(ctx);
  }

  private paintCard(ctx: CanvasRenderingContext2D, card: Rect, portrait: Rect | null): void {
    const rc = rough.canvas(this.art);
    const seed = this.turn * 7 + 3;
    const right = card.x + card.width;
    const bottom = card.y + card.height;

    let tail = "";
    const slot = this.activeApp ? this.slots.get(this.activeApp) : undefined;
    if (slot) {
      const bounds = this.root.getBoundingClientRect();
      const rect = slot.getBoundingClientRect();
      const apexX = rect.left - bounds.left + rect.width / 2;
      const apexY = this.dock.getBoundingClientRect().top - bounds.top - 4;
      if (apexY - bottom >= 10) {
        const baseHalf = 22;
        const baseX = Math.min(Math.max(apexX, card.x + 70), right - 70);
        tail = `L ${baseX + baseHalf} ${bottom} L ${apexX} ${apexY} L ${baseX - baseHalf} ${bottom} `;
      }
    }

    const path = `M ${card.x} ${card.y} L ${right} ${card.y} L ${right} ${bottom} ${tail}L ${card.x} ${bottom} Z`;
    ctx.fillStyle = "#000";
    ctx.fill(new Path2D(path));
    rc.path(path, { seed, roughness: 2.2, bowing: 3, stroke: "#fff", strokeWidth: 4 });

    if (this.newsflashing) this.paintBanner(ctx, rc, card, portrait);

    if (portrait) {
      ctx.fillStyle = this.newsflashing ? SCRIBBLE_PAPER : "#000";
      ctx.fillRect(portrait.x, portrait.y, portrait.width, portrait.height);
      rc.rectangle(portrait.x, portrait.y, portrait.width, portrait.height, {
        seed: seed + 1,
        roughness: 2,
        bowing: 3,
        stroke: this.newsflashing ? "#000" : "#fff",
        strokeWidth: 3,
      });
    }
  }

  private paintBanner(ctx: CanvasRenderingContext2D, rc: ReturnType<typeof rough.canvas>, card: Rect, portrait: Rect | null): void {
    if (this.bannered) {
      const height = 40;
      const size = 28;
      ctx.font = `${size}px ${TITLE_FACE}`;
      const width = ctx.measureText(STRINGS.endings.newsflash).width + 36;
      const x = card.x + 24;
      const y = card.y - height * 0.6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.03);
      ctx.fillStyle = BANNER_COLOR;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      rc.rectangle(x, y, width, height, { seed: 41, roughness: 1.6, bowing: 2, disableMultiStroke: true, stroke: "#fff", strokeWidth: 3 });
      drawBadPhotoshopText(ctx, STRINGS.endings.newsflash, x + 18, y + height * 0.76, size, `${size}px ${TITLE_FACE}`, "#fff", "#000", null);
    }
    if (this.bannered && portrait && this.caption) {
      const captionSize = Math.min(24, portrait.width * 0.13);
      ctx.font = `bold ${captionSize}px ${TEXT_FACE}`;
      const captionWidth = ctx.measureText(this.caption).width;
      drawBadPhotoshopText(
        ctx,
        this.caption,
        portrait.x + (portrait.width - captionWidth) / 2,
        portrait.y + portrait.height + captionSize * 1.4,
        captionSize,
        `bold ${captionSize}px ${TEXT_FACE}`,
        "#fff",
        "#000",
        null,
      );
    }
  }

  private paintDock(ctx: CanvasRenderingContext2D, dock: Rect): void {
    const rc = rough.canvas(this.art);
    ctx.fillStyle = "#000";
    ctx.fillRect(dock.x, dock.y, dock.width, dock.height);
    rc.rectangle(dock.x, dock.y, dock.width, dock.height, {
      seed: 11,
      roughness: 1.8,
      bowing: 2.5,
      disableMultiStroke: true,
      preserveVertices: true,
      stroke: "#fff",
      strokeWidth: 4,
    });

    const bounds = this.root.getBoundingClientRect();
    APP_ORDER.forEach((id, index) => {
      const slot = this.slots.get(id);
      if (!slot) return;
      const rect = slot.getBoundingClientRect();
      const x = rect.left - bounds.left;
      const y = rect.top - bounds.top;
      const icon = imageFor(APPS[id].icon, () => this.paintArt());
      if (icon) {
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(icon, x, y, rect.width, rect.height);
      } else {
        rc.rectangle(x, y, rect.width, rect.height, {
          seed: 20 + index,
          roughness: 1.6,
          bowing: 2,
          fill: APPS[id].color,
          fillStyle: "solid",
          stroke: APPS[id].color,
          strokeWidth: 3,
        });
      }
      if (id === this.activeApp) {
        const barWidth = rect.width * 0.5;
        const barY = y + rect.height + 7;
        const barX = x + (rect.width - barWidth) / 2;
        rc.line(barX, barY, barX + barWidth, barY, {
          seed: 30 + index,
          roughness: 1.5,
          disableMultiStroke: true,
          preserveVertices: true,
          stroke: "#fff",
          strokeWidth: 4,
        });
      }
    });
  }

  private paintPortrait(bounds: DOMRect, portrait: Rect | null): void {
    const ctx = sizeCanvas(this.sprites, bounds.width, bounds.height, this.newsflashing ? NEWSFLASH_SPRITE_SCALE : SPRITE_RESOLUTION_SCALE);
    const contact = this.contact;
    if (!portrait || !contact) return;

    const inset = 5;
    const x = portrait.x + inset;
    const y = portrait.y + inset;
    const width = portrait.width - inset * 2;
    const height = portrait.height - inset * 2;
    const image = contact.image ? imageFor(contact.image, () => this.paintArt()) : null;
    if (this.newsflashing) {
      ctx.fillStyle = SCRIBBLE_PAPER;
      ctx.fillRect(x, y, width, height);
    }
    if (image) {
      ctx.imageSmoothingQuality = "high";
      const fit = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * fit;
      const drawHeight = image.naturalHeight * fit;
      ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = contact.color;
      ctx.fillRect(x, y, width, height);
      ctx.font = `${width * 0.5}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(contact.emoji, x + width / 2, y + height / 2);
    }
    crush(ctx, this.newsflashing ? NEWSFLASH_SPRITE_LEVELS : SPRITE_COLOR_LEVELS);
  }

  private paintScribble(ctx: CanvasRenderingContext2D, scribble: Scribble, area: Rect): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.width, area.height);
    ctx.clip();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = SCRIBBLE_INK;
    ctx.lineWidth = area.height * SCRIBBLE_WIDTH;
    ctx.beginPath();
    for (let index = scribble.hidden; index < scribble.added; index++) {
      const [px, py] = scribble.points[index]!;
      const x = area.x + px * area.width;
      const y = area.y + py * area.height;
      if (index === scribble.hidden) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private paintText(): void {
    const rect = this.message.getBoundingClientRect();
    const ctx = sizeCanvas(this.textArt, rect.width, rect.height);
    const size = parseFloat(getComputedStyle(this.message).fontSize);
    const font = `bold ${size}px ${TEXT_FACE}`;
    ctx.font = font;
    const lines = this.line.split("\n").flatMap((paragraph) => wrapText(ctx, paragraph, rect.width));
    let remaining = this.shown;
    let y = 0;
    for (const line of lines) {
      if (remaining <= 0) break;
      drawBadPhotoshopText(ctx, line.slice(0, remaining), 0, y + size, size, font, "#fff", "#000", null);
      remaining -= line.length + 1;
      y += size * 1.35;
    }
    crush(ctx);
  }

  private paintCue(): void {
    const size = parseFloat(getComputedStyle(this.cue).width);
    const ctx = sizeCanvas(this.cue, size, size);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(size * 0.1 + 3, size * 0.1 + 3);
    ctx.lineTo(size * 0.95 + 3, size * 0.5 + 3);
    ctx.lineTo(size * 0.1 + 3, size * 0.9 + 3);
    ctx.fill();
    ctx.fillStyle = NVIDIA_GREEN;
    ctx.beginPath();
    ctx.moveTo(size * 0.05, size * 0.1);
    ctx.lineTo(size * 0.85, size * 0.5);
    ctx.lineTo(size * 0.05, size * 0.9);
    ctx.fill();
    crush(ctx);
  }

  private paintPreview(parts: PreviewPart[]): void {
    const rect = this.preview.getBoundingClientRect();
    const ctx = sizeCanvas(this.preview, rect.width, rect.height);
    if (parts.length === 0) return;

    let size = rect.height * 0.72;
    const gap = 0.5;
    const measure = (fontSize: number) => {
      ctx.font = `${fontSize}px ${TITLE_FACE}`;
      const widths = parts.map((part) => ctx.measureText(part.text).width);
      return { widths, total: widths.reduce((sum, width) => sum + width, 0) + fontSize * gap * (parts.length - 1) };
    };
    let layout = measure(size);
    if (layout.total > rect.width * 0.9) {
      size *= (rect.width * 0.9) / layout.total;
      layout = measure(size);
    }

    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(-0.04);
    let cursor = -layout.total / 2;
    parts.forEach((part, index) => {
      drawBadPhotoshopText(ctx, part.text, cursor, size * 0.35, size, `${size}px ${TITLE_FACE}`, YES_COLOR, "#000", null);
      cursor += layout.widths[index]! + size * gap;
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    crush(ctx);
  }

  private colorFor(tone: Tone): string {
    if (tone === "yes") return YES_COLOR;
    if (tone === "no") return NO_COLOR;
    return this.activeApp ? APPS[this.activeApp].neutral : "#fff";
  }

  private paintChoices(): void {
    this.choiceButtons.forEach((button, index) => {
      const { width, height } = button.getBoundingClientRect();
      const style = getComputedStyle(button);
      const tone = (button.dataset.tone ?? "neutral") as Tone;
      const options = {
        color: this.colorFor(tone),
        glyph: tone === "neutral" ? null : tone,
        fontSize: parseFloat(style.fontSize),
        paddingLeft: parseFloat(style.paddingLeft),
        paddingRight: parseFloat(style.paddingRight),
        disabled: button.disabled,
        seed: this.turn * 13 + index,
      };
      const label = button.textContent ?? "";
      button.style.setProperty("--art", `url(${outlineButtonArt(label, width, height, { ...options, hover: false })})`);
      button.style.setProperty("--art-hover", `url(${outlineButtonArt(label, width, height, { ...options, hover: true })})`);
    });
  }
}
