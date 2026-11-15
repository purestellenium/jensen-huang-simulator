import { STRINGS } from "../strings";
import {
  EARNINGS_HIT_ID,
  EARNINGS_MISS_ID,
  PASSIVE_INCOME,
  QUARTER_LENGTH,
  boostTarget,
  closeQuarter,
  newQuarter,
} from "./quarter";
import type {
  Choice,
  Condition,
  Effect,
  GameState,
  LossKind,
  NumericKey,
  Outcome,
  Scenario,
  ScheduledScenario,
  StatKey,
  Stats,
} from "./types";
import { FEDS_PER_STAR, MAX_STARS, STAT_KEYS } from "./types";

export type Rng = () => number;

const START_STATS: Stats = { money: 10, affairs: 0, feds: 0, board: 70 };
const METER_KEYS: StatKey[] = ["feds", "board"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function newGame(): GameState {
  return {
    turn: 1,
    stats: { ...START_STATS },
    flags: new Set(),
    flagExpiry: new Map(),
    counters: {},
    seen: new Map(),
    scheduled: [],
    quarter: newQuarter(1, 1),
    quarterResult: null,
    loss: null,
  };
}

function numeric(state: GameState, key: NumericKey): number {
  if (key === "turn") return state.turn;
  if (key === "stars") return Math.ceil(state.stats.feds / FEDS_PER_STAR);
  if (key === "quarterTurn") return state.turn - state.quarter.startTurn;
  return state.stats[key];
}

export function conditionMet(state: GameState, condition: Condition): boolean {
  if ("flag" in condition) return state.flags.has(condition.flag);
  const value = "counter" in condition ? (state.counters[condition.counter] ?? 0) : numeric(state, condition.stat);
  if (condition.min !== undefined && value < condition.min) return false;
  if (condition.max !== undefined && value > condition.max) return false;
  return true;
}

export function allMet(state: GameState, conditions: Condition[] = []): boolean {
  return conditions.every((condition) => conditionMet(state, condition));
}

function qualifies(state: GameState, scenario: Scenario, ignoreOnce: boolean): boolean {
  if (scenario.scheduledOnly) return false;
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

function scenarioWeight(state: GameState, scenario: Scenario): number {
  return typeof scenario.weight === "function" ? scenario.weight(state) : (scenario.weight ?? 1);
}

function takeDue(state: GameState, scenarios: Scenario[]): Scenario | undefined {
  const due = state.scheduled
    .filter((entry) => entry.due <= state.turn)
    .sort((a, b) => a.due - b.due)[0];
  if (!due) return undefined;
  state.scheduled = state.scheduled.filter((entry) => entry !== due);
  const scenario = scenarios.find((candidate) => candidate.id === due.id);
  if (!scenario) throw new Error(`Scheduled scenario "${due.id}" does not exist`);
  return scenario;
}

function forcedScenario(state: GameState, scenarios: Scenario[]): Scenario | undefined {
  return scenarios.find((candidate) => candidate.forced && !state.seen.has(candidate.id) && allMet(state, candidate.forced));
}

export function drawScenario(state: GameState, scenarios: Scenario[], rng: Rng = Math.random): Scenario {
  let scenario: Scenario | undefined;

  if (state.quarterResult) {
    const id = state.quarterResult === "hit" ? EARNINGS_HIT_ID : EARNINGS_MISS_ID;
    state.quarterResult = null;
    scenario = scenarios.find((candidate) => candidate.id === id);
  }
  if (!scenario) scenario = takeDue(state, scenarios);
  if (!scenario) scenario = forcedScenario(state, scenarios);
  if (!scenario) {
    let pool = scenarios.filter((candidate) => qualifies(state, candidate, false));
    if (pool.length === 0) pool = scenarios.filter((candidate) => qualifies(state, candidate, true));
    if (pool.length === 0) throw new Error(`No scenario qualifies on turn ${state.turn}`);
    scenario = weightedPick(pool, (candidate) => scenarioWeight(state, candidate), rng);
  }

  state.seen.set(scenario.id, (state.seen.get(scenario.id) ?? 0) + 1);
  return scenario;
}

export function choiceAvailable(state: GameState, choice: Choice): boolean {
  return allMet(state, choice.requires);
}

function scheduleScenario(state: GameState, item: ScheduledScenario, rng: Rng): void {
  const [min, max] = Array.isArray(item.after) ? item.after : [item.after, item.after];
  const delay = min + Math.floor(rng() * (max - min + 1));
  state.scheduled.push({ id: item.id, due: state.turn + delay });
}

function applyEffect(state: GameState, effect: Effect = {}, rng: Rng): void {
  for (const key of STAT_KEYS) {
    const delta = effect.stats?.[key];
    if (delta === undefined) continue;
    const next = round1(state.stats[key] + delta);
    state.stats[key] = METER_KEYS.includes(key) ? Math.min(100, Math.max(0, next)) : Math.max(0, next);
    if (key === "money" && delta > 0) state.quarter.revenue = round1(state.quarter.revenue + delta);
  }
  for (const [name, delta] of Object.entries(effect.counters ?? {})) {
    state.counters[name] = (state.counters[name] ?? 0) + delta;
  }
  for (const flag of effect.setFlags ?? []) {
    state.flags.add(flag);
    state.flagExpiry.delete(flag);
  }
  for (const flag of effect.clearFlags ?? []) {
    state.flags.delete(flag);
    state.flagExpiry.delete(flag);
  }
  for (const { flag, turns } of effect.expiringFlags ?? []) {
    state.flags.add(flag);
    state.flagExpiry.set(flag, state.turn + turns);
  }
  for (const item of effect.schedule ?? []) scheduleScenario(state, item, rng);
  if (effect.targetBoost) boostTarget(state.quarter, effect.targetBoost);
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
}

export function choicePreview(choice: Choice): PreviewPart[] {
  if ("outcomes" in choice || choice.hidden) return [];
  const stats = choice.effects?.stats ?? {};
  const parts: PreviewPart[] = [];
  const money = stats.money ?? 0;
  if (money > 0) parts.push({ text: STRINGS.amounts.gain(STRINGS.amounts.money(money)) });
  const affairs = stats.affairs ?? 0;
  if (affairs > 0) parts.push({ text: STRINGS.amounts.gain(STRINGS.amounts.affairs(affairs)) });
  return parts;
}

export function checkLoss(state: GameState): LossKind | null {
  if (state.stats.feds >= MAX_STARS * FEDS_PER_STAR) return "feds";
  if (state.stats.board <= 0) return "board";
  return null;
}

function expireFlags(state: GameState): void {
  for (const [flag, expiry] of Array.from(state.flagExpiry)) {
    if (expiry > state.turn) continue;
    state.flags.delete(flag);
    state.flagExpiry.delete(flag);
  }
}

function endTurn(state: GameState): void {
  state.stats.money = round1(state.stats.money + PASSIVE_INCOME);
  state.quarter.revenue = round1(state.quarter.revenue + PASSIVE_INCOME);
  state.turn += 1;
  expireFlags(state);
  if (state.turn - state.quarter.startTurn >= QUARTER_LENGTH) closeQuarter(state);
}

export function resolveChoice(state: GameState, choice: Choice, rng: Rng = Math.random): Outcome {
  if (!choiceAvailable(state, choice)) throw new Error(`Choice "${choice.label}" is not available`);
  const outcome = outcomeOf(choice, rng);
  applyEffect(state, outcome.effects, rng);
  if (outcome.next) scheduleScenario(state, { id: outcome.next, after: 1 }, rng);
  endTurn(state);
  state.loss = outcome.loss ?? state.loss ?? checkLoss(state);
  return outcome;
}
