import { STRINGS } from "../strings";
import type {
  Choice,
  Condition,
  Effect,
  GameState,
  LossKind,
  NumericKey,
  Outcome,
  Scenario,
  StatKey,
  Stats,
} from "./types";
import { FEDS_PER_STAR, MAX_STARS, STAT_KEYS } from "./types";

export type Rng = () => number;

const START_STATS: Stats = { money: 10, affairs: 0, feds: 0, board: 70 };
const METER_KEYS: StatKey[] = ["feds", "board"];

export function newGame(): GameState {
  return {
    turn: 1,
    stats: { ...START_STATS },
    flags: new Set(),
    seen: new Map(),
    pendingNext: null,
    loss: null,
  };
}

function numeric(state: GameState, key: NumericKey): number {
  return key === "turn" ? state.turn : state.stats[key];
}

export function conditionMet(state: GameState, condition: Condition): boolean {
  if ("flag" in condition) return state.flags.has(condition.flag);
  const value = numeric(state, condition.stat);
  if (condition.min !== undefined && value < condition.min) return false;
  if (condition.max !== undefined && value > condition.max) return false;
  return true;
}

export function allMet(state: GameState, conditions: Condition[] = []): boolean {
  return conditions.every((condition) => conditionMet(state, condition));
}

function qualifies(state: GameState, scenario: Scenario, ignoreOnce: boolean): boolean {
  if (!ignoreOnce && scenario.once && state.seen.has(scenario.id)) return false;
  if (!allMet(state, scenario.requires)) return false;
  return !(scenario.forbids ?? []).some((condition) => conditionMet(state, condition));
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number, rng: Rng): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1]!;
}

export function drawScenario(state: GameState, scenarios: Scenario[], rng: Rng = Math.random): Scenario {
  let scenario: Scenario | undefined;

  if (state.pendingNext) {
    scenario = scenarios.find((candidate) => candidate.id === state.pendingNext);
    if (!scenario) throw new Error(`Scenario "${state.pendingNext}" (from next) does not exist`);
    state.pendingNext = null;
  } else {
    let pool = scenarios.filter((candidate) => qualifies(state, candidate, false));
    if (pool.length === 0) pool = scenarios.filter((candidate) => qualifies(state, candidate, true));
    if (pool.length === 0) throw new Error(`No scenario qualifies on turn ${state.turn}`);
    scenario = weightedPick(pool, (candidate) => candidate.weight ?? 1, rng);
  }

  state.seen.set(scenario.id, (state.seen.get(scenario.id) ?? 0) + 1);
  return scenario;
}

export function choiceAvailable(state: GameState, choice: Choice): boolean {
  return allMet(state, choice.requires);
}

function applyEffect(state: GameState, effect: Effect = {}): void {
  for (const key of STAT_KEYS) {
    const delta = effect.stats?.[key];
    if (delta === undefined) continue;
    const next = Math.round((state.stats[key] + delta) * 10) / 10;
    state.stats[key] = METER_KEYS.includes(key) ? Math.min(100, Math.max(0, next)) : Math.max(0, next);
  }
  for (const flag of effect.setFlags ?? []) state.flags.add(flag);
  for (const flag of effect.clearFlags ?? []) state.flags.delete(flag);
}

function outcomeOf(choice: Choice, rng: Rng): Outcome {
  if ("outcomes" in choice) {
    if (choice.outcomes.length === 0) throw new Error(`Choice "${choice.label}" has no outcomes`);
    return weightedPick(choice.outcomes, (outcome) => outcome.weight ?? 1, rng);
  }
  return choice;
}

export interface PreviewPart {
  text: string;
  gain: boolean;
}

function signed(delta: number, text: string): string {
  return delta > 0 ? STRINGS.amounts.gain(text) : STRINGS.amounts.loss(text);
}

export function choicePreview(choice: Choice): PreviewPart[] {
  if ("outcomes" in choice || choice.hidden) return [];
  const stats = choice.effects?.stats ?? {};
  const parts: PreviewPart[] = [];
  const money = stats.money ?? 0;
  if (money !== 0) {
    parts.push({ text: signed(money, STRINGS.amounts.money(Math.abs(money))), gain: money > 0 });
  }
  const affairs = stats.affairs ?? 0;
  if (affairs !== 0) {
    parts.push({ text: signed(affairs, STRINGS.amounts.affairs(Math.abs(affairs))), gain: affairs > 0 });
  }
  return parts;
}

export function checkLoss(state: GameState): LossKind | null {
  if (state.stats.feds >= MAX_STARS * FEDS_PER_STAR) return "feds";
  if (state.stats.board <= 0) return "board";
  return null;
}

export function resolveChoice(state: GameState, choice: Choice, rng: Rng = Math.random): Outcome {
  if (!choiceAvailable(state, choice)) throw new Error(`Choice "${choice.label}" is not available`);
  const outcome = outcomeOf(choice, rng);
  applyEffect(state, outcome.effects);
  state.pendingNext = outcome.next ?? null;
  state.loss = outcome.loss ?? checkLoss(state);
  state.turn += 1;
  return outcome;
}
