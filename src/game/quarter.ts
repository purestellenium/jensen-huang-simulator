import type { GameState, QuarterState } from "./types";

export const QUARTER_LENGTH = 6;
export const PASSIVE_INCOME = 2;
export const HIT_BOARD_BONUS = 10;
export const EARNINGS_HIT_ID = "earnings-hit";
export const EARNINGS_MISS_ID = "earnings-miss";

const BASE_TARGETS = [20, 32, 50, 75];
const LATE_GROWTH = 1.5;
const FIRED_MISS_STREAK = 2;

export function baseTarget(number: number): number {
  if (number <= BASE_TARGETS.length) return BASE_TARGETS[number - 1]!;
  let target = BASE_TARGETS[BASE_TARGETS.length - 1]!;
  for (let quarter = BASE_TARGETS.length + 1; quarter <= number; quarter++) target *= LATE_GROWTH;
  return Math.round(target);
}

export function newQuarter(number: number, startTurn: number, missStreak = 0): QuarterState {
  return { number, revenue: 0, target: baseTarget(number), startTurn, boost: 0, missStreak };
}

export function boostTarget(quarter: QuarterState, fraction: number): void {
  quarter.boost = Math.round((quarter.boost + fraction) * 100) / 100;
  quarter.target = Math.round(baseTarget(quarter.number) * (1 + quarter.boost));
}

export function turnsLeft(state: GameState): number {
  return Math.max(0, QUARTER_LENGTH - (state.turn - state.quarter.startTurn));
}

export function closeQuarter(state: GameState): void {
  const { quarter } = state;
  const hit = quarter.revenue >= quarter.target;
  const missStreak = hit ? 0 : quarter.missStreak + 1;
  if (hit) state.stats.board = Math.min(100, state.stats.board + HIT_BOARD_BONUS);
  state.quarterResult = hit ? "hit" : "miss";
  if (missStreak >= FIRED_MISS_STREAK) state.loss = "board";
  state.quarter = newQuarter(quarter.number + 1, state.turn, missStreak);
}
