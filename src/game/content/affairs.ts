import { STRINGS } from "../../strings";
import type { Anim, Scenario } from "../types";
import { jacketWeight } from "./shared";

const S = STRINGS.scenarios;

const spy: Scenario = {
  id: "spy",
  app: "dating",
  contact: "spy",
  weight: jacketWeight(2),
  text: S.spy.text,
  choices: [
    {
      label: S.spy.no.label,
      tone: "no",
      result: S.spy.no.result,
    },
    {
      label: S.spy.yes.label,
      tone: "yes",
      result: S.spy.yes.result,
      anim: "china",
      effects: {
        stats: { affairs: 1 },
        counters: { evidence: 1 },
        setFlags: ["spy_contact"],
      },
    },
  ],
};

const matchProfiles: { text: string; contact: string; anim?: Anim }[] = [
  ...S.matches.texts.map((text) => ({ text, contact: "spy" })),
  { text: S.matches.kyle, contact: "kyle", anim: "pride" },
];

const matches: Scenario[] = matchProfiles.map(
  ({ text, contact, anim }, index): Scenario => ({
    id: `dating-match-${index + 1}`,
    app: "dating",
    contact,
    weight: jacketWeight(0.2625),
    text,
    choices: [
      {
        label: S.matches.no.label,
        tone: "no",
        result: S.matches.no.result,
      },
      {
        label: S.matches.yes.label,
        tone: "yes",
        result: S.matches.yes.result,
        anim,
        effects: { stats: { affairs: 1 }, counters: { evidence: 1 } },
      },
    ],
  }),
);

const afterparty: Scenario = {
  id: "keynote-afterparty",
  contact: "fan",
  once: true,
  weight: jacketWeight(0.4),
  text: S.afterparty.text,
  choices: [
    {
      label: S.afterparty.no.label,
      tone: "no",
      result: S.afterparty.no.result,
    },
    {
      label: S.afterparty.yes.label,
      tone: "yes",
      result: S.afterparty.yes.result,
      effects: { stats: { affairs: 1 } },
    },
  ],
};

const podcast: Scenario = {
  id: "podcast-host",
  contact: "host",
  once: true,
  weight: jacketWeight(0.4),
  text: S.podcast.text,
  choices: [
    {
      label: S.podcast.no.label,
      tone: "no",
      result: S.podcast.no.result,
    },
    {
      label: S.podcast.yes.label,
      tone: "yes",
      result: S.podcast.yes.result,
      effects: { stats: { affairs: 1 }, counters: { evidence: 1 } },
    },
  ],
};

interface CloseCallTier {
  requires: { counter: string; min?: number; max?: number }[];
  cost: number;
  relief: number;
  odds: [number, number, number];
}

const closeCallTiers: CloseCallTier[] = [
  { requires: [{ counter: "exposure", min: 1, max: 2 }], cost: 8, relief: 2, odds: [8, 3, 1] },
  { requires: [{ counter: "exposure", min: 3 }], cost: 12, relief: 3, odds: [5, 3, 2] },
];

const closeCalls: Scenario[] = closeCallTiers.flatMap((tier, tierIndex) =>
  S.closeCall.texts.map(
    (text, index): Scenario => ({
      id: `close-call-${tierIndex + 1}-${index + 1}`,
      app: "signal",
      contact: "anon",
      weight: (state) => 0.5 * Math.min(state.counters.exposure ?? 0, 4),
      requires: tier.requires,
      text,
      choices: [
        {
          label: S.closeCall.pay.label,
          requires: [{ stat: "money", min: tier.cost }],
          result: S.closeCall.pay.result,
          effects: { stats: { money: -tier.cost }, counters: { exposure: -tier.relief } },
        },
        {
          label: S.closeCall.ignore.label,
          tone: "no",
          outcomes: [
            { weight: tier.odds[0], result: S.closeCall.ignore.blows },
            { weight: tier.odds[1], result: S.closeCall.ignore.board, effects: { stats: { board: -8 } } },
            { weight: tier.odds[2], result: S.closeCall.ignore.scandal, loss: "scandal" },
          ],
        },
      ],
    }),
  ),
);

const trip: Scenario = {
  id: "business-trip",
  contact: "vp",
  once: true,
  weight: jacketWeight(1.5),
  text: S.trip.text,
  choices: [
    {
      label: S.trip.hr.label,
      tone: "no",
      result: S.trip.hr.result,
    },
    {
      label: S.trip.game.label,
      tone: "yes",
      result: S.trip.game.result,
      hint: STRINGS.hints.gossip,
      effects: {
        stats: { affairs: 1 },
        schedule: [{ id: "board-vp-gossip", after: [2, 3] }],
      },
    },
  ],
};

const employee: Scenario = {
  id: "hq-employee",
  contact: "employee",
  once: true,
  weight: jacketWeight(1.5),
  text: S.employee.text,
  choices: [
    {
      label: S.employee.walkPast.label,
      tone: "no",
      result: S.employee.walkPast.result,
    },
    {
      label: S.employee.help.label,
      tone: "yes",
      result: S.employee.help.result,
      hint: STRINGS.hints.hr,
      effects: {
        stats: { affairs: 1 },
        counters: { hr_risk: 1 },
      },
    },
  ],
};

const exec: Scenario = {
  id: "chinese-exec",
  contact: "exec",
  scheduledOnly: true,
  once: true,
  text: S.exec.text,
  choices: [
    {
      label: S.exec.decline.label,
      tone: "no",
      result: S.exec.decline.result,
    },
    {
      label: S.exec.pursue.label,
      tone: "yes",
      result: S.exec.pursue.result,
      hint: STRINGS.hints.exec,
      effects: {
        stats: { affairs: 1 },
        counters: { evidence: 1 },
        setFlags: ["exec_affair"],
        schedule: [{ id: "board-megaspeed", after: [2, 3] }],
      },
    },
  ],
};

const hrComplaint: Scenario = {
  id: "hr-complaint",
  contact: "hr",
  once: true,
  weight: 4,
  requires: [{ counter: "hr_risk", min: 1 }],
  text: S.hrComplaint.text,
  choices: [
    {
      label: S.hrComplaint.deny.label,
      outcomes: [
        { weight: 3, result: S.hrComplaint.deny.believed, effects: { stats: { board: -5 } } },
        { result: S.hrComplaint.deny.scandal, loss: "scandal" },
      ],
    },
    {
      label: S.hrComplaint.settle.label,
      requires: [{ stat: "money", min: 10 }],
      result: S.hrComplaint.settle.result,
      effects: { stats: { money: -10 } },
    },
  ],
};

export const affairs: Scenario[] = [spy, ...matches, afterparty, podcast, trip, employee, exec, hrComplaint, ...closeCalls];
