import type { GameState, QuarterState } from "./types";

export const QUARTER_LENGTH = 6;
export const PASSIVE_INCOME = 5;
export const HIT_BOARD_BONUS = 10;
export const EARNINGS_HIT_ID = "earnings-hit";
export const EARNINGS_MISS_ID = "earnings-miss";
export const EARNINGS_FIRED_ID = "earnings-fired";

const BASE_TARGETS = [28, 34, 40, 45];
const LATE_STEP = 5;
const FIRE_CHANCE_BY_STREAK = [0, 0.18, 0.6, 1];

export function baseTarget(number: number): number {
  if (number <= BASE_TARGETS.length) return BASE_TARGETS[number - 1]!;
  return BASE_TARGETS[BASE_TARGETS.length - 1]! + (number - BASE_TARGETS.length) * LATE_STEP;
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

export function fireChance(missStreak: number): number {
  return FIRE_CHANCE_BY_STREAK[Math.min(missStreak, FIRE_CHANCE_BY_STREAK.length - 1)]!;
}

export function closeQuarter(state: GameState, rng: () => number = Math.random): void {
  const { quarter } = state;
  const hit = quarter.revenue >= quarter.target;
  const missStreak = hit ? 0 : quarter.missStreak + 1;
  if (hit) state.stats.board = Math.min(100, state.stats.board + HIT_BOARD_BONUS);
  state.quarterResult = hit ? "hit" : rng() < fireChance(missStreak) ? "fired" : "miss";
  state.closedQuarter = { ...quarter };
  state.quarter = newQuarter(quarter.number + 1, state.turn, missStreak);
}
