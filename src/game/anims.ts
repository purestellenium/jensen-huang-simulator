import { playSound } from "../audio";
import { onAction } from "../input";
import { STRINGS } from "../strings";
import type { Anim, Choice, Outcome } from "./types";

const ART = {
  flag: "/images/anim/flag.svg",
  chinaFlag: "/images/anim/flag-china.svg",
  bill: "/images/anim/bill.svg",
  door: "/images/anim/door.svg",
  frame: "/images/anim/frame.svg",
  printer: "/images/anim/printer.svg",
  lips: "/images/hud/affairs.png",
  coin: "/images/anim/coin.svg",
  x1: "/images/anim/x1.svg",
  x2: "/images/anim/x2.svg",
  sirenRed: "/images/anim/siren-red.svg",
  sirenBlue: "/images/anim/siren-blue.svg",
  stamp: "/images/anim/stamp.svg",
  jacket: "/images/anim/jacket.png",
  shredder: "/images/anim/shredder.svg",
  sheet: "/images/anim/sheet.svg",
} as const;

const BILL_COUNT = 36;
const COIN_COUNT = 9;
const FLYING_BILLS = 7;
const STRIP_COUNT = 10;
const BIG_MONEY = 10;
const FEED_BURSTS: [number, number][] = [
  [300, 850],
  [1000, 1550],
  [1700, 2200],
];
const TEAR_MS = 2300;

function art(src: string, className: string, parent: HTMLElement): HTMLImageElement {
  const image = new Image();
  image.src = src;
  image.alt = "";
  image.className = className;
  parent.append(image);
  return image;
}

function div(className: string, parent: HTMLElement): HTMLDivElement {
  const node = document.createElement("div");
  node.className = className;
  parent.append(node);
  return node;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

async function wave(layer: HTMLElement, src: string): Promise<void> {
  playSound("flag");
  const flag = art(src, "anim-flag", layer);
  await flag.animate(
    [
      { transform: "rotate(-75deg)" },
      { transform: "rotate(-12deg)", offset: 0.4 },
      { transform: "rotate(6deg)", offset: 0.6 },
      { transform: "rotate(75deg)" },
    ],
    { duration: 1300, easing: "ease-in-out" },
  ).finished;
}

async function money(layer: HTMLElement): Promise<void> {
  playSound("money");
  const falls = Array.from({ length: BILL_COUNT }, () => {
    const bill = art(ART.bill, "anim-bill", layer);
    bill.style.left = `${between(-5, 95)}%`;
    const spin = between(-540, 540);
    const sway = between(4, 12);
    return bill.animate(
      [
        { transform: `translate(0, 0) rotate(0deg)` },
        { transform: `translate(${sway}vw, 40vh) rotate(${spin * 0.4}deg)` },
        { transform: `translate(${-sway}vw, 80vh) rotate(${spin * 0.75}deg)` },
        { transform: `translate(0, 135vh) rotate(${spin}deg)` },
      ],
      { duration: between(1500, 2600), delay: between(0, 700), easing: "ease-in", fill: "backwards" },
    ).finished;
  });
  await Promise.all(falls);
}

async function receipt(layer: HTMLElement): Promise<void> {
  playSound("receipt");
  const S = STRINGS.anims.receipt;
  const feed = div("anim-feed", layer);
  const paper = div("anim-paper", feed);
  const lines = [S.header, ...S.items.map(([item, cost]) => `${item}\n${cost}`), `${S.total[0]}\n${S.total[1]}`];
  for (const line of lines) div("anim-paper-line", paper).textContent = line;
  const printer = art(ART.printer, "anim-printer", layer);

  printer.animate([{ transform: "translate(-50%, -110%)" }, { transform: "translate(-50%, 0)" }], {
    duration: 220,
    easing: "ease-out",
  });
  const stops: Keyframe[] = [{ transform: "translateY(-100%)", offset: 0 }];
  FEED_BURSTS.forEach(([start, end], index) => {
    const from = -100 + (100 / FEED_BURSTS.length) * index;
    const to = -100 + (100 / FEED_BURSTS.length) * (index + 1);
    stops.push({ transform: `translateY(${from}%)`, offset: start / TEAR_MS });
    stops.push({ transform: `translateY(${to}%)`, offset: end / TEAR_MS });
  });
  stops.push({ transform: "translateY(0%)", offset: 1 });
  await paper.animate(stops, { duration: TEAR_MS }).finished;
  printer.animate([{ transform: "translate(-50%, 0)" }, { transform: "translate(-50%, -110%)" }], {
    duration: 300,
    delay: 400,
    easing: "ease-in",
    fill: "forwards",
  });
  await paper.animate([{ transform: "translateY(0) rotate(0deg)" }, { transform: "translateY(110vh) rotate(9deg)" }], {
    duration: 700,
    easing: "ease-in",
    fill: "forwards",
  }).finished;
}

async function kiss(layer: HTMLElement): Promise<void> {
  playSound("kiss");
  const lips = art(ART.lips, "anim-lips", layer);
  lips.style.left = `${between(25, 55)}%`;
  lips.style.top = `${between(20, 50)}%`;
  const tilt = between(-25, 25);
  await lips.animate(
    [
      { transform: `rotate(${tilt}deg) scale(2.4)`, opacity: 0 },
      { transform: `rotate(${tilt}deg) scale(0.9)`, opacity: 1, offset: 0.12 },
      { transform: `rotate(${tilt}deg) scale(1)`, opacity: 1, offset: 0.2 },
      { transform: `rotate(${tilt}deg) scale(1)`, opacity: 1, offset: 0.7 },
      { transform: `rotate(${tilt}deg) scale(1)`, opacity: 0 },
    ],
    { duration: 1200 },
  ).finished;
}

async function coins(layer: HTMLElement): Promise<void> {
  playSound("coins");
  const arcs = Array.from({ length: COIN_COUNT }, () => {
    const coin = art(ART.coin, "anim-coin", layer);
    const dx = between(-35, 35);
    const peak = between(35, 65);
    const spin = between(-720, 720);
    return coin.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)", easing: "ease-out" },
        { transform: `translate(${dx / 2}vw, -${peak}vh) rotate(${spin / 2}deg)`, easing: "ease-in" },
        { transform: `translate(${dx}vw, 20vh) rotate(${spin}deg)` },
      ],
      { duration: between(900, 1200), delay: between(0, 200), fill: "backwards" },
    ).finished;
  });
  await Promise.all(arcs);
}

async function cashAway(layer: HTMLElement): Promise<void> {
  playSound("cashaway");
  const flights = Array.from({ length: FLYING_BILLS }, () => {
    const bill = art(ART.bill, "anim-bill anim-bill-away", layer);
    bill.style.left = `${between(30, 60)}%`;
    const dx = between(-30, 30);
    const flap = between(10, 25);
    return bill.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scaleY(1)", opacity: 0 },
        { transform: `translate(${dx * 0.3}vw, -20vh) rotate(${flap}deg) scaleY(0.4)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx * 0.6}vw, -45vh) rotate(${-flap}deg) scaleY(1)`, offset: 0.6 },
        { transform: `translate(${dx}vw, -80vh) rotate(${flap}deg) scaleY(0.4)`, opacity: 1 },
      ],
      { duration: between(1000, 1300), delay: between(0, 250), easing: "ease-in", fill: "backwards" },
    ).finished;
  });
  await Promise.all(flights);
}

async function siren(layer: HTMLElement): Promise<void> {
  playSound("siren");
  const red = art(ART.sirenRed, "anim-siren anim-siren-left", layer);
  const blue = art(ART.sirenBlue, "anim-siren anim-siren-right", layer);
  const pulse = (start: number): Keyframe[] => Array.from({ length: 7 }, (_, i) => ({ opacity: (i + start) % 2 === 0 ? 0.85 : 0 }));
  await Promise.all([
    red.animate(pulse(0), { duration: 1200 }).finished,
    blue.animate(pulse(1), { duration: 1200 }).finished,
  ]);
}

async function cleared(layer: HTMLElement): Promise<void> {
  playSound("stamp");
  const stamp = div("anim-stamp", layer);
  art(ART.stamp, "anim-stamp-art", stamp);
  div("anim-stamp-text", stamp).textContent = STRINGS.anims.cleared;
  await stamp.animate(
    [
      { transform: "translate(-50%, -50%) rotate(-12deg) scale(3)", opacity: 0 },
      { transform: "translate(-50%, -50%) rotate(-12deg) scale(1)", opacity: 1, offset: 0.14 },
      { transform: "translate(-50%, -50%) rotate(-12deg) scale(1)", opacity: 1, offset: 0.75 },
      { transform: "translate(-50%, -50%) rotate(-12deg) scale(1)", opacity: 0 },
    ],
    { duration: 1100 },
  ).finished;
}

async function nope(layer: HTMLElement): Promise<void> {
  playSound("nope");
  const first = art(ART.x1, "anim-x", layer);
  const second = art(ART.x2, "anim-x", layer);
  await Promise.all([
    first.animate([{ clipPath: "inset(0 100% 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 120, fill: "both" }).finished,
    second.animate([{ clipPath: "inset(0 0 100% 100%)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 120, delay: 120, fill: "both" }).finished,
  ]);
  await layer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 600 }).finished;
}

async function shred(layer: HTMLElement): Promise<void> {
  playSound("shred");
  const feedMs = 1000;
  const intake = div("anim-intake", layer);
  const sheet = art(ART.sheet, "anim-sheet", intake);
  const output = div("anim-output", layer);
  const strips = Array.from({ length: STRIP_COUNT }, () => div("anim-strip", output));
  art(ART.shredder, "anim-shredder", layer);
  const timing = { duration: feedMs, delay: 200, fill: "both" } as const;
  await Promise.all([
    sheet.animate([{ transform: "translateY(-42vh)" }, { transform: "translateY(23vh)" }], timing).finished,
    ...strips.map((strip) => strip.animate([{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], timing).finished),
  ]);
  await Promise.all(
    strips.map(
      (strip) =>
        strip.animate([{ transform: "translateY(0) rotate(0deg)" }, { transform: `translateY(110vh) rotate(${between(-20, 20)}deg)` }], {
          duration: between(400, 700),
          easing: "ease-in",
          fill: "forwards",
        }).finished,
    ),
  );
}

async function kick(layer: HTMLElement): Promise<void> {
  playSound("kick");
  layer.classList.add("anim-hallway");
  for (const side of ["left", "right", "top"]) art(ART.frame, `anim-trim anim-trim-${side}`, layer);
  const panel = div("anim-door anim-door-kicked", layer);
  art(ART.door, "anim-door-art", panel);
  layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
  await panel.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: "translate(0, 0)", offset: 0.8 },
      { transform: "translate(-1.5vw, 0.5vh)", offset: 0.85 },
      { transform: "translate(1.5vw, -0.5vh)", offset: 0.92 },
      { transform: "translate(0, 0)" },
    ],
    { duration: 400 },
  ).finished;
  await panel.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(-88deg)" }], { duration: 350, easing: "ease-in", fill: "forwards" })
    .finished;
  await layer.animate(
    [
      { transform: "translate(0, 0)", opacity: 1 },
      { transform: "translate(1vw, 1vh)", opacity: 1, offset: 0.1 },
      { transform: "translate(-1vw, -0.5vh)", opacity: 1, offset: 0.2 },
      { transform: "translate(0, 0)", opacity: 1, offset: 0.4 },
      { transform: "translate(0, 0)", opacity: 0 },
    ],
    { duration: 600 },
  ).finished;
}

async function jacket(layer: HTMLElement): Promise<void> {
  playSound("jacket");
  const piece = art(ART.jacket, "anim-jacket", layer);
  await piece.animate(
    [
      { transform: "translate(-50%, -160%) rotate(-8deg)", easing: "ease-in" },
      { transform: "translate(-50%, -50%) rotate(0deg) scale(1.1, 0.85)", offset: 0.3 },
      { transform: "translate(-50%, -50%) rotate(0deg) scale(1)", offset: 0.4 },
      { transform: "translate(-50%, -50%) rotate(0deg) scale(1)", opacity: 1, offset: 0.8 },
      { transform: "translate(-50%, -50%) rotate(0deg) scale(1)", opacity: 0 },
    ],
    { duration: 1400 },
  ).finished;
}

const ANIMS: Record<Anim, (layer: HTMLElement) => Promise<void>> = {
  pride: (layer) => wave(layer, ART.flag),
  china: (layer) => wave(layer, ART.chinaFlag),
  money,
  receipt,
  kiss,
  coins,
  cashAway,
  siren,
  cleared,
  nope,
  shred,
  kick,
  jacket,
};

export function autoAnim(choice: Choice, outcome: Outcome): Anim | null {
  const stats = outcome.effects?.stats ?? {};
  const money = stats.money ?? 0;
  const feds = stats.feds ?? 0;
  if ((stats.affairs ?? 0) > 0) return "kiss";
  if (money >= BIG_MONEY) return "money";
  if (feds > 0) return "siren";
  if (money < 0) return "cashAway";
  if (money > 0) return "coins";
  if (feds < 0) return "cleared";
  if (choice.tone === "no") return "nope";
  return null;
}

export function preloadAnimArt(): void {
  for (const src of Object.values(ART)) new Image().src = src;
}

export async function playAnim(root: HTMLElement, kind: Anim, skippable: boolean): Promise<void> {
  const layer = div(`anim anim-${kind}`, root);
  layer.setAttribute("aria-hidden", "true");
  let release = () => {};
  const skipped = new Promise<void>((resolve) => {
    if (!skippable) return;
    release = onAction((action) => {
      if (action.kind !== "back") return false;
      resolve();
      return true;
    });
  });
  try {
    await Promise.race([ANIMS[kind](layer), skipped]);
  } finally {
    release();
    layer.remove();
  }
}
