import { STRINGS } from "../../strings";
import type { Scenario } from "../types";

const S = STRINGS.scenarios;

const stockPops: Scenario[] = S.stockPop.texts.map(
  (text, index): Scenario => ({
    id: `stock-pop-${index + 1}`,
    contact: "market",
    weight: 1.2,
    text,
    choices: [
      {
        label: S.stockPop.hold.label,
        result: S.stockPop.hold.result,
        effects: { stats: { board: 3 } },
      },
      {
        label: S.stockPop.sell.label,
        result: S.stockPop.sell.result,
        effects: { stats: { money: 8, board: -3 } },
      },
    ],
  }),
);

const jackets: Scenario[] = S.jacket.texts.map(
  (text, index): Scenario => ({
    id: `jacket-${index + 1}`,
    contact: "jacket",
    weight: 0.8,
    text,
    choices: [
      {
        label: S.jacket.pass.label,
        tone: "no",
        result: S.jacket.pass.result,
      },
      {
        label: S.jacket.buy.label,
        tone: "yes",
        requires: [{ stat: "money", min: 2 }],
        result: S.jacket.buy.result,
        effects: { stats: { money: -2 }, counters: { jackets: 1 } },
      },
    ],
  }),
);

export const misc: Scenario[] = [...stockPops, ...jackets];
