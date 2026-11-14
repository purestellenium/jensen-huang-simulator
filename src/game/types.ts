export const STAT_KEYS = ["money", "affairs", "feds", "board"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const MAX_STARS = 5;
export const FEDS_PER_STAR = 20;

export type NumericKey = StatKey | "turn";

export type Condition =
  | { stat: NumericKey; min?: number; max?: number }
  | { flag: string };

export interface Effect {
  stats?: Partial<Stats>;
  setFlags?: string[];
  clearFlags?: string[];
}

export interface Outcome {
  result: string;
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
  app: AppId;
  contact?: string;
  text: string;
  weight?: number;
  once?: boolean;
  requires?: Condition[];
  forbids?: Condition[];
  choices: Choice[];
}

export type LossKind = "feds" | "board" | "scandal";

export interface GameState {
  turn: number;
  stats: Stats;
  flags: Set<string>;
  seen: Map<string, number>;
  pendingNext: string | null;
  loss: LossKind | null;
}
