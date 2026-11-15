export const STAT_KEYS = ["money", "affairs", "feds", "board"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const MAX_STARS = 5;
export const FEDS_PER_STAR = 20;

export type NumericKey = StatKey | "turn" | "stars" | "quarterTurn";

export type Condition =
  | { stat: NumericKey; min?: number; max?: number }
  | { counter: string; min?: number; max?: number }
  | { flag: string };

export interface ScheduledScenario {
  id: string;
  after: number | [number, number];
}

export interface ExpiringFlag {
  flag: string;
  turns: number;
}

export interface Effect {
  stats?: Partial<Stats>;
  counters?: Record<string, number>;
  setFlags?: string[];
  clearFlags?: string[];
  expiringFlags?: ExpiringFlag[];
  schedule?: ScheduledScenario[];
  targetBoost?: number;
}

export type Anim =
  | "pride"
  | "china"
  | "money"
  | "kiss"
  | "coins"
  | "cashAway"
  | "siren"
  | "cleared"
  | "nope"
  | "shred"
  | "kick"
  | "jacket";

export interface Outcome {
  result: string;
  anim?: Anim;
  hint?: string;
  effects?: Effect;
  next?: string;
  loss?: LossKind;
  weight?: number;
}

export type AppId = "dating" | "wechat" | "signal";

export type Tone = "yes" | "no" | "neutral";

export type Choice = {
  label: string;
  tone?: Tone;
  hidden?: boolean;
  requires?: Condition[];
} & ({ outcomes: Outcome[] } | Outcome);

export interface Scenario {
  id: string;
  app?: AppId;
  contact?: string;
  text: string;
  weight?: number | ((state: GameState) => number);
  once?: boolean;
  scheduledOnly?: boolean;
  requires?: Condition[];
  forbids?: Condition[];
  forced?: Condition[];
  choices: Choice[];
}

export type LossKind = "feds" | "board" | "scandal";

export interface QuarterState {
  number: number;
  revenue: number;
  target: number;
  startTurn: number;
  boost: number;
  missStreak: number;
}

export type QuarterResult = "hit" | "miss" | "fired";

export interface ScheduledEntry {
  id: string;
  due: number;
}

export interface GameState {
  turn: number;
  stats: Stats;
  flags: Set<string>;
  flagExpiry: Map<string, number>;
  counters: Record<string, number>;
  seen: Map<string, number>;
  scheduled: ScheduledEntry[];
  quarter: QuarterState;
  quarterResult: QuarterResult | null;
  closedQuarter: QuarterState | null;
  loss: LossKind | null;
}
