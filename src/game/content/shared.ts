import { STRINGS } from "../../strings";
import type { GameState, LossKind } from "../types";

export interface Contact {
  emoji: string;
  color: string;
  image?: string;
}

export const CONTACTS: Record<string, Contact> = {
  spy: { emoji: "🕶️", color: "#a633d6" },
  kyle: { emoji: "👨", color: "#a633d6" },
  ling: { emoji: "📦", color: "#338eda" },
  fbi: { emoji: "🕵️", color: "#8492a6" },
  board: { emoji: "👔", color: "#338eda" },
  lawyer: { emoji: "⚖️", color: "#ff8c37" },
  vp: { emoji: "👩‍💼", color: "#ec3750" },
  employee: { emoji: "🗂️", color: "#33d6a6" },
  exec: { emoji: "💼", color: "#ec3750" },
  hr: { emoji: "📋", color: "#8492a6" },
  shareholder: { emoji: "🎤", color: "#f1c40f" },
  market: { emoji: "📈", color: "#76b900" },
  anon: { emoji: "❓", color: "#8492a6" },
  fan: { emoji: "🎟️", color: "#ec3750" },
  host: { emoji: "🎙️", color: "#a633d6" },
  jacket: { emoji: "🧥", color: "#76b900" },
};

export const ENDINGS: Record<LossKind, { headline: string; story: string }> = {
  feds: STRINGS.endings.feds,
  board: STRINGS.endings.board,
  scandal: STRINGS.endings.scandal,
};

const JACKET_STEP = 0.6;
const JACKET_CAP = 4;
const HOSTILE_MULTIPLIER = 2;

export function jacketWeight(base: number): (state: GameState) => number {
  return (state) => base * (1 + JACKET_STEP * Math.min(state.counters.jackets ?? 0, JACKET_CAP));
}

export function hostileWeight(base: number): (state: GameState) => number {
  return (state) => base * (state.flags.has("fbi_hostile") ? HOSTILE_MULTIPLIER : 1);
}
