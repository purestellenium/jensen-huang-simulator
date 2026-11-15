import { STRINGS } from "../../strings";
import type { Scenario } from "../types";
import { hostileWeight } from "./shared";

const S = STRINGS.scenarios;

const pallet: Scenario = {
  id: "fbi-pallet",
  app: "signal",
  contact: "fbi",
  scheduledOnly: true,
  text: S.fbiPallet.text,
  choices: [
    {
      label: S.fbiPallet.burgers.label,
      outcomes: [
        { result: S.fbiPallet.burgers.believed, effects: { stats: { feds: -10 } } },
        { weight: 2, result: S.fbiPallet.burgers.caught, effects: { stats: { feds: 20 }, counters: { evidence: 1 } } },
      ],
    },
    {
      label: S.fbiPallet.amd.label,
      outcomes: [
        { result: S.fbiPallet.amd.believed, effects: { stats: { feds: -10, board: -5 } } },
        { result: S.fbiPallet.amd.caught, effects: { stats: { feds: 20 }, counters: { evidence: 1 } } },
      ],
    },
    {
      label: S.fbiPallet.lawyer.label,
      requires: [{ stat: "money", min: 8 }],
      result: S.fbiPallet.lawyer.result,
      effects: { stats: { money: -8, feds: -20 } },
    },
  ],
};

const money: Scenario = {
  id: "fbi-money",
  app: "signal",
  contact: "fbi",
  scheduledOnly: true,
  text: S.fbiMoney.text,
  choices: [
    {
      label: S.fbiMoney.consulting.label,
      outcomes: [
        { weight: 2, result: S.fbiMoney.consulting.believed },
        { result: S.fbiMoney.consulting.caught, effects: { stats: { feds: 20 }, counters: { evidence: 1 } } },
      ],
    },
    {
      label: S.fbiMoney.aunt.label,
      outcomes: [
        { result: S.fbiMoney.aunt.believed },
        { result: S.fbiMoney.aunt.caught, effects: { stats: { feds: 20 }, counters: { evidence: 1 } } },
      ],
    },
    {
      label: S.fbiMoney.lawyer.label,
      requires: [{ stat: "money", min: 6 }],
      result: S.fbiMoney.lawyer.result,
      effects: { stats: { money: -6, feds: -20 } },
    },
  ],
};

const datingSubpoena: Scenario = {
  id: "fbi-dating-subpoena",
  app: "signal",
  contact: "fbi",
  once: true,
  weight: 4,
  requires: [{ stat: "affairs", min: 3 }],
  text: S.fbiDatingSubpoena.text,
  choices: [
    {
      label: S.fbiDatingSubpoena.comply.label,
      outcomes: [
        { weight: 3, result: S.fbiDatingSubpoena.comply.quiet, effects: { stats: { board: -10 } } },
        { result: S.fbiDatingSubpoena.comply.leaked, loss: "scandal" },
      ],
    },
    {
      label: S.fbiDatingSubpoena.fight.label,
      requires: [{ stat: "money", min: 15 }],
      result: S.fbiDatingSubpoena.fight.result,
      effects: { stats: { money: -15 } },
    },
  ],
};

const shippingSubpoena: Scenario = {
  id: "fbi-shipping-subpoena",
  app: "signal",
  contact: "fbi",
  once: true,
  weight: 3,
  requires: [
    { stat: "stars", min: 2 },
    { counter: "sales", min: 1 },
  ],
  text: S.fbiShippingSubpoena.text,
  choices: [
    {
      label: S.fbiShippingSubpoena.comply.label,
      result: S.fbiShippingSubpoena.comply.result,
      effects: { stats: { feds: 20 }, counters: { evidence: 2 } },
    },
    {
      label: S.fbiShippingSubpoena.shred.label,
      outcomes: [
        { result: S.fbiShippingSubpoena.shred.clean },
        { result: S.fbiShippingSubpoena.shred.caught, effects: { stats: { feds: 40 }, counters: { evidence: 1 } } },
      ],
    },
    {
      label: S.fbiShippingSubpoena.fight.label,
      requires: [{ stat: "money", min: 12 }],
      outcomes: [
        { weight: 2, result: S.fbiShippingSubpoena.fight.won, effects: { stats: { money: -12 } } },
        { result: S.fbiShippingSubpoena.fight.lost, effects: { stats: { money: -12, feds: 20 } } },
      ],
    },
  ],
};

const questions: Scenario = {
  id: "fbi-questions",
  app: "signal",
  contact: "fbi",
  weight: hostileWeight(2),
  requires: [{ stat: "stars", min: 3 }],
  text: S.fbiQuestions.text,
  choices: [
    {
      label: S.fbiQuestions.kash.label,
      outcomes: [
        { weight: 3, result: S.fbiQuestions.kash.works, effects: { stats: { feds: -40 } } },
        { weight: 2, result: S.fbiQuestions.kash.backfires, effects: { stats: { feds: 20 } } },
      ],
    },
    {
      label: S.fbiQuestions.altman.label,
      outcomes: [
        { result: S.fbiQuestions.altman.works, effects: { stats: { feds: -40 } } },
        { result: S.fbiQuestions.altman.backfires, effects: { stats: { feds: 20, board: -5 } } },
      ],
    },
  ],
};

const witness: Scenario = {
  id: "fbi-witness",
  app: "signal",
  contact: "fbi",
  scheduledOnly: true,
  once: true,
  forced: [{ stat: "stars", min: 5 }],
  text: S.fbiWitness.text,
  choices: [
    {
      label: S.fbiWitness.face.label,
      result: S.fbiWitness.face.result,
      loss: "feds",
    },
    {
      label: S.fbiWitness.pay.label,
      requires: [{ stat: "money", min: 40 }],
      result: S.fbiWitness.pay.result,
      effects: { stats: { money: -40, feds: -45 } },
    },
  ],
};

const openUp: Scenario = {
  id: "fbi-open-up",
  contact: "fbi",
  weight: hostileWeight(1.5),
  requires: [{ stat: "stars", min: 2 }],
  text: S.fbiOpenUp.text,
  choices: [
    {
      label: S.fbiOpenUp.stay.label,
      tone: "no",
      result: S.fbiOpenUp.stay.result,
      effects: {
        stats: { money: -3, feds: 20 },
        expiringFlags: [{ flag: "fbi_hostile", turns: 12 }],
      },
    },
    {
      label: S.fbiOpenUp.open.label,
      tone: "yes",
      result: S.fbiOpenUp.open.result,
      effects: { stats: { feds: -20 } },
    },
  ],
};

const megaspeed: Scenario = {
  id: "fbi-megaspeed",
  app: "signal",
  contact: "fbi",
  scheduledOnly: true,
  text: S.fbiMegaspeed.text,
  choices: [
    {
      label: S.fbiMegaspeed.stonewall.label,
      result: S.fbiMegaspeed.stonewall.result,
      effects: { stats: { feds: 20 }, counters: { evidence: 1 } },
    },
    {
      label: S.fbiMegaspeed.cooperate.label,
      result: S.fbiMegaspeed.cooperate.result,
      effects: { stats: { feds: -20, board: -10 } },
    },
    {
      label: S.fbiMegaspeed.lawyer.label,
      requires: [{ stat: "money", min: 15 }],
      result: S.fbiMegaspeed.lawyer.result,
      effects: { stats: { money: -15, feds: -20 } },
    },
  ],
};

const lawyer: Scenario = {
  id: "lawyer",
  app: "signal",
  contact: "lawyer",
  weight: 2,
  requires: [{ stat: "stars", min: 2 }],
  text: S.lawyer.text,
  choices: [
    {
      label: S.lawyer.wingIt.label,
      tone: "no",
      result: S.lawyer.wingIt.result,
    },
    {
      label: S.lawyer.retain.label,
      tone: "yes",
      requires: [{ stat: "money", min: 10 }],
      result: S.lawyer.retain.result,
      effects: { stats: { money: -10, feds: -20 } },
    },
  ],
};

export const fbi: Scenario[] = [pallet, money, datingSubpoena, shippingSubpoena, questions, witness, openUp, megaspeed, lawyer];
