import rough from "roughjs";
import {
  NVIDIA_GREEN,
  SPRITE_COLOR_LEVELS,
  SPRITE_RESOLUTION_SCALE,
  TITLE_YELLOW,
  crush,
  drawBadPhotoshopText,
  sizeCanvas,
  wrapText,
} from "../pixel";
import { outlineButtonArt } from "../sketch";
import { STRINGS } from "../strings";
import { APPS, APP_ORDER } from "./apps";
import { CONTACTS, type Contact } from "./content";
import { choiceAvailable, choicePreview, type PreviewPart } from "./engine";
import type { AppId, Choice, GameState, Stats, Tone } from "./types";

const TYPE_INTERVAL_MS = 22;
const TITLE_FACE = 'Impact, "Arial Black", sans-serif';
const TEXT_FACE = "Arial, sans-serif";
const YES_COLOR = "#2aff2a";
const NO_COLOR = "#ff2a2a";

const STAT_LABELS: [keyof Stats, string][] = [
  ["money", STRINGS.hud.stats.money],
  ["affairs", STRINGS.hud.stats.affairs],
  ["feds", STRINGS.hud.stats.feds],
  ["wife", STRINGS.hud.stats.wife],
  ["board", STRINGS.hud.stats.board],
];

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
  return key === "money" ? STRINGS.amounts.money(value) : String(value);
}

const images = new Map<string, HTMLImageElement>();

function imageFor(url: string, onLoad: () => void): HTMLImageElement | null {
  let image = images.get(url);
  if (!image) {
    image = new Image();
    image.addEventListener("load", onLoad);
    image.src = url;
    images.set(url, image);
  }
  return image.complete && image.naturalWidth > 0 ? image : null;
}

export class GameView {
  private readonly art: HTMLCanvasElement;
  private readonly sprites: HTMLCanvasElement;
  private readonly hud: HTMLElement;
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
  private turn = 1;
  private activeApp: AppId | null = null;
  private contact: Contact | null = null;
  private line = "";
  private shown = 0;
  private choiceButtons: HTMLButtonElement[] = [];
  private skipTyping: (() => void) | null = null;

  constructor(private readonly root: HTMLElement) {
    root.replaceChildren();
    this.art = el("canvas", "art", root);
    this.art.setAttribute("aria-hidden", "true");
    this.sprites = el("canvas", "art", root);
    this.sprites.setAttribute("aria-hidden", "true");
    this.hud = el("div", "hud", root);
    this.hud.setAttribute("role", "status");

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
    this.hud.textContent = `${STRINGS.hud.summaryTurn(state.turn)} ` + STAT_LABELS.map(([key, label]) => `${label} ${formatStat(key, state.stats[key])}`).join(", ");
    this.paintArt();
  }

  openApp(app: AppId | null, contactId?: string): void {
    this.activeApp = app;
    this.contact = contactId ? (CONTACTS[contactId] ?? null) : null;
    if (contactId && !CONTACTS[contactId]) throw new Error(`Unknown contact "${contactId}"`);
    this.portrait.hidden = this.contact === null;
    this.card.classList.toggle("no-portrait", this.contact === null);
    this.paintArt();
  }

  async say(line: string): Promise<void> {
    this.line = line;
    this.shown = 0;
    this.spoken.textContent = line;
    this.cue.hidden = true;
    this.clearChoices();
    this.paintText();

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
        if (this.shown >= line.length) finish();
      }, TYPE_INTERVAL_MS);
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
        const index = Number(event.key) - 1;
        const choice = options[index];
        if (choice && !this.choiceButtons[index]?.disabled) pick(choice);
      };
      window.addEventListener("keydown", onKey);
      this.paintChoices();
      this.paintArt();
    });
  }

  private clearChoices(): void {
    this.choiceButtons = [];
    this.choices.replaceChildren();
    this.paintPreview([]);
    this.paintArt();
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

    this.paintHud(ctx, at(this.hud));
    this.paintCard(ctx, at(this.card), this.contact ? at(this.portrait) : null);
    this.paintDock(ctx, at(this.dock));
    crush(ctx);
    this.paintPortrait(bounds, this.contact ? at(this.portrait) : null);
  }

  private paintHud(ctx: CanvasRenderingContext2D, rect: Rect): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = NVIDIA_GREEN;
    ctx.fillRect(rect.x, rect.y + rect.height - 3, rect.width, 3);
    if (!this.stats) return;

    const stats = this.stats;
    const margin = 16;
    const baseline = rect.y + rect.height * 0.64;
    const turnLabel = `${STRINGS.hud.turn} ${this.turn}`;

    let size = rect.height * 0.42;
    const measure = (fontSize: number) => {
      const gap = fontSize * 0.9;
      ctx.font = `${fontSize}px ${TITLE_FACE}`;
      const turnWidth = ctx.measureText(turnLabel).width;
      ctx.font = `bold ${fontSize}px ${TEXT_FACE}`;
      const entries = STAT_LABELS.map(([key, label]) => `${label.toUpperCase()} ${formatStat(key, stats[key])}`);
      const widths = entries.map((entry) => ctx.measureText(entry).width);
      return { gap, turnWidth, entries, widths, total: turnWidth + widths.reduce((a, b) => a + b + gap, 0) };
    };
    let layout = measure(size);
    const available = rect.width - margin * 2;
    if (layout.total > available) {
      size *= available / layout.total;
      layout = measure(size);
    }

    drawBadPhotoshopText(ctx, turnLabel, rect.x + margin, baseline, size, `${size}px ${TITLE_FACE}`, TITLE_YELLOW, "#000", null);
    let cursor = rect.x + rect.width - margin;
    for (let index = STAT_LABELS.length - 1; index >= 0; index--) {
      const width = layout.widths[index]!;
      cursor -= width;
      drawBadPhotoshopText(ctx, layout.entries[index]!, cursor, baseline, size, `bold ${size}px ${TEXT_FACE}`, "#fff", "#000", null);
      cursor -= layout.gap;
    }
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
      const apexY = rect.top - bounds.top - 10;
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

    if (portrait) {
      ctx.fillStyle = "#000";
      ctx.fillRect(portrait.x, portrait.y, portrait.width, portrait.height);
      rc.rectangle(portrait.x, portrait.y, portrait.width, portrait.height, {
        seed: seed + 1,
        roughness: 2,
        bowing: 3,
        stroke: "#fff",
        strokeWidth: 3,
      });
    }
  }

  private paintDock(ctx: CanvasRenderingContext2D, dock: Rect): void {
    const rc = rough.canvas(this.art);
    ctx.fillStyle = "#000";
    ctx.fillRect(dock.x, dock.y, dock.width, dock.height);
    rc.rectangle(dock.x, dock.y, dock.width, dock.height, {
      seed: 11,
      roughness: 2,
      bowing: 3,
      stroke: "#fff",
      strokeWidth: 3,
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
        rc.rectangle(x - 7, y - 7, rect.width + 14, rect.height + 14, {
          seed: 30 + index,
          roughness: 1.6,
          stroke: "#fff",
          strokeWidth: 3,
        });
      }
    });
  }

  private paintPortrait(bounds: DOMRect, portrait: Rect | null): void {
    const ctx = sizeCanvas(this.sprites, bounds.width, bounds.height, SPRITE_RESOLUTION_SCALE);
    const contact = this.contact;
    if (!portrait || !contact) return;

    const inset = 5;
    const x = portrait.x + inset;
    const y = portrait.y + inset;
    const width = portrait.width - inset * 2;
    const height = portrait.height - inset * 2;
    const image = contact.image ? imageFor(contact.image, () => this.paintArt()) : null;
    if (image) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.fillStyle = contact.color;
      ctx.fillRect(x, y, width, height);
      ctx.font = `${width * 0.5}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(contact.emoji, x + width / 2, y + height / 2);
    }
    crush(ctx, SPRITE_COLOR_LEVELS);
  }

  private paintText(): void {
    const rect = this.message.getBoundingClientRect();
    const ctx = sizeCanvas(this.textArt, rect.width, rect.height);
    const size = parseFloat(getComputedStyle(this.message).fontSize);
    const font = `bold ${size}px ${TEXT_FACE}`;
    ctx.font = font;
    const lines = wrapText(ctx, this.line, rect.width);
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
      drawBadPhotoshopText(ctx, part.text, cursor, size * 0.35, size, `${size}px ${TITLE_FACE}`, part.gain ? YES_COLOR : NO_COLOR, "#000", null);
      cursor += layout.widths[index]! + size * gap;
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    crush(ctx);
  }

  private colorFor(tone: Tone): string {
    if (tone === "yes") return YES_COLOR;
    if (tone === "no") return NO_COLOR;
    return this.activeApp ? APPS[this.activeApp].color : "#fff";
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
