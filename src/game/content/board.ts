import { STRINGS } from "../../strings";
import { EARNINGS_FIRED_ID, EARNINGS_HIT_ID, EARNINGS_MISS_ID } from "../quarter";
import type { Scenario } from "../types";

const S = STRINGS.scenarios;

const earningsHit: Scenario = {
  id: EARNINGS_HIT_ID,
  contact: "board",
  scheduledOnly: true,
  text: S.earningsHit.text,
  choices: [
    {
      label: S.earningsHit.bow.label,
      result: S.earningsHit.bow.result,
      anim: "rise",
    },
  ],
};

const charm: Scenario = {
  id: "board-charm",
  contact: "board",
  weight: (state) => (state.stats.board <= 60 ? 2.5 : 0.8),
  text: S.charm.text,
  choices: [
    {
      label: S.charm.skip.label,
      tone: "no",
      result: S.charm.skip.result,
    },
    {
      label: S.charm.pay.label,
      requires: [{ stat: "money", min: 10 }],
      result: S.charm.pay.result,
      effects: { stats: { money: -10, board: 15 } },
    },
  ],
};

const earningsFired: Scenario = {
  id: EARNINGS_FIRED_ID,
  contact: "board",
  scheduledOnly: true,
  text: S.earningsFired.text,
  choices: [
    {
      label: S.earningsFired.face.label,
      result: S.earningsFired.face.result,
      loss: "board",
    },
  ],
};

const earningsMiss: Scenario = {
  id: EARNINGS_MISS_ID,
  contact: "board",
  scheduledOnly: true,
  text: S.earningsMiss.text,
  choices: [
    {
      label: S.earningsMiss.honest.label,
      result: S.earningsMiss.honest.result,
      effects: { stats: { board: -15 } },
    },
    {
      label: S.earningsMiss.promise.label,
      result: S.earningsMiss.promise.result,
      effects: { stats: { board: -5 }, targetBoost: 0.25 },
    },
    {
      label: S.earningsMiss.cook.label,
      outcomes: [
        { weight: 3, result: S.earningsMiss.cook.slides, effects: { counters: { evidence: 2 } } },
        {
          weight: 2,
          result: S.earningsMiss.cook.caught,
          effects: { stats: { feds: 20, board: -10 }, counters: { evidence: 2 } },
        },
      ],
    },
  ],
};

const callMild: Scenario = {
  id: "board-call-mild",
  app: "signal",
  contact: "board",
  weight: 1.5,
  requires: [{ stat: "board", min: 50 }],
  text: S.callMild.text,
  choices: [
    {
      label: S.callMild.letRing.label,
      result: S.callMild.letRing.result,
      effects: { stats: { board: -5 } },
    },
    {
      label: S.callMild.callBack.label,
      outcomes: [
        { weight: 3, result: S.callMild.callBack.fine, effects: { stats: { board: 5 } } },
        { result: S.callMild.callBack.bad, effects: { stats: { board: -12 } } },
      ],
    },
  ],
};

const callUrgent: Scenario = {
  id: "board-call-urgent",
  app: "signal",
  contact: "board",
  weight: 4,
  requires: [{ stat: "board", max: 39 }],
  text: S.callUrgent.text,
  choices: [
    {
      label: S.callUrgent.takeCall.label,
      outcomes: [
        { weight: 2, result: S.callUrgent.takeCall.calm, effects: { stats: { board: 5 } } },
        { weight: 3, result: S.callUrgent.takeCall.blowup, effects: { stats: { board: -15 } } },
      ],
    },
    {
      label: S.callUrgent.pr.label,
      requires: [{ stat: "money", min: 10 }],
      result: S.callUrgent.pr.result,
      effects: { stats: { money: -10, board: 15 } },
    },
  ],
};

const blackwell: Scenario = {
  id: "board-blackwell",
  app: "signal",
  contact: "board",
  once: true,
  weight: 3,
  requires: [{ flag: "sold_to_china" }],
  text: S.blackwell.text,
  choices: [
    {
      label: S.blackwell.rogue.label,
      outcomes: [
        { result: S.blackwell.rogue.believed, effects: { stats: { board: -3 } } },
        { result: S.blackwell.rogue.caught, effects: { stats: { board: -15, feds: 10 } } },
      ],
    },
    {
      label: S.blackwell.paperwork.label,
      result: S.blackwell.paperwork.result,
      effects: { counters: { evidence: 1 } },
    },
    {
      label: S.blackwell.scapegoat.label,
      requires: [{ stat: "money", min: 5 }],
      result: S.blackwell.scapegoat.result,
      effects: { stats: { money: -5 } },
    },
  ],
};

const vpGossip: Scenario = {
  id: "board-vp-gossip",
  app: "signal",
  contact: "board",
  scheduledOnly: true,
  text: S.vpGossip.text,
  choices: [
    {
      label: S.vpGossip.deny.label,
      outcomes: [
        { weight: 3, result: S.vpGossip.deny.believed, effects: { stats: { board: -5 } } },
        { result: S.vpGossip.deny.scandal, loss: "scandal" },
      ],
    },
    {
      label: S.vpGossip.reassign.label,
      requires: [{ stat: "money", min: 8 }],
      result: S.vpGossip.reassign.result,
      effects: { stats: { money: -8 }, setFlags: ["vp_reassigned"] },
    },
    {
      label: S.vpGossip.hush.label,
      requires: [{ stat: "money", min: 12 }],
      result: S.vpGossip.hush.result,
      effects: { stats: { money: -12 } },
    },
  ],
};

const megaspeed: Scenario = {
  id: "board-megaspeed",
  app: "signal",
  contact: "board",
  scheduledOnly: true,
  text: S.megaspeed.text,
  choices: [
    {
      label: S.megaspeed.silent.label,
      result: S.megaspeed.silent.result,
      hint: STRINGS.hints.megaspeed,
      effects: { stats: { board: -10 }, schedule: [{ id: "fbi-megaspeed", after: 1 }] },
    },
    {
      label: S.megaspeed.blame.label,
      result: S.megaspeed.blame.result,
      hint: STRINGS.hints.megaspeed,
      effects: { stats: { feds: 10 }, schedule: [{ id: "fbi-megaspeed", after: 1 }] },
    },
    {
      label: S.megaspeed.investigate.label,
      requires: [{ stat: "money", min: 10 }],
      result: S.megaspeed.investigate.result,
      hint: STRINGS.hints.megaspeed,
      effects: { stats: { money: -10, board: 5 }, schedule: [{ id: "fbi-megaspeed", after: 1 }] },
    },
  ],
};

const qa: Scenario = {
  id: "shareholder-qa",
  contact: "shareholder",
  once: true,
  weight: 3,
  requires: [{ flag: "sold_to_china" }],
  text: S.qa.text,
  choices: [
    {
      label: S.qa.honest.label,
      result: S.qa.honest.result,
      effects: { stats: { board: 5 }, counters: { evidence: 1 } },
    },
    {
      label: S.qa.deflect.label,
      outcomes: [
        { result: S.qa.deflect.ok, effects: { stats: { board: 3 } } },
        { result: S.qa.deflect.backfire, effects: { stats: { board: -10, feds: 10 } } },
      ],
    },
    {
      label: S.qa.joke.label,
      result: S.qa.joke.result,
      effects: { stats: { board: 3 } },
    },
  ],
};

export const board: Scenario[] = [
  earningsHit,
  earningsMiss,
  earningsFired,
  charm,
  callMild,
  callUrgent,
  blackwell,
  vpGossip,
  megaspeed,
  qa,
];
