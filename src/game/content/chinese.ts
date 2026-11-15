import { STRINGS } from "../../strings";
import type { Condition, Scenario } from "../types";

const S = STRINGS.scenarios;

interface Tier {
  requires: Condition[];
  money: number;
  result: string;
}

const buyerTiers = [
  { requires: [{ counter: "sales", max: 0 }], money: 6.7, result: S.buyer.accept.results[0] },
  { requires: [{ counter: "sales", min: 1, max: 2 }], money: 10, result: S.buyer.accept.results[1] },
  { requires: [{ counter: "sales", min: 3 }], money: 15, result: S.buyer.accept.results[2] },
] satisfies Tier[];

const buyerUnits = S.buyer.units;

const buyers: Scenario[] = buyerTiers.flatMap((tier, index) =>
  S.buyer.names.map(
    (name): Scenario => ({
      id: `buyer-${name.toLowerCase()}-${index + 1}`,
      app: "wechat",
      contact: "ling",
      text: S.buyer.text(name, buyerUnits[index as 0 | 1 | 2]),
      weight: 3,
      requires: tier.requires,
      choices: [
        {
          label: S.buyer.refuse.label,
          tone: "no",
          result: S.buyer.refuse.result,
        },
        {
          label: S.buyer.accept.label,
          tone: "yes",
          result: tier.result,
          hint: STRINGS.hints.pallet,
          effects: {
            stats: { money: tier.money, feds: 20 },
            counters: { sales: 1, evidence: 1 },
            setFlags: ["sold_to_china"],
            schedule: [{ id: "fbi-pallet", after: [2, 4] }],
          },
        },
      ],
    }),
  ),
);

const envelopeTiers = [
  { requires: [{ counter: "envelopes", max: 0 }], money: 3, result: S.envelope.accept.results[0], text: S.envelope.texts[0] },
  { requires: [{ counter: "envelopes", min: 1, max: 2 }], money: 5, result: S.envelope.accept.results[1], text: S.envelope.texts[1] },
  { requires: [{ counter: "envelopes", min: 3 }], money: 8, result: S.envelope.accept.results[2], text: S.envelope.texts[2] },
] satisfies (Tier & { text: string })[];

const envelopes: Scenario[] = envelopeTiers.map(
  (tier, index): Scenario => ({
    id: `envelope-${index + 1}`,
    app: "wechat",
    contact: "ling",
    text: tier.text,
    weight: 5,
    requires: tier.requires,
    choices: [
      {
        label: S.envelope.refuse.label,
        tone: "no",
        outcomes: S.envelope.refuse.jokes.map((joke) => ({ result: joke })),
      },
      {
        label: S.envelope.accept.label,
        tone: "yes",
        result: tier.result,
        hint: STRINGS.hints.envelope,
        effects: {
          stats: { money: tier.money },
          counters: { envelopes: 1, evidence: 1 },
          schedule: [{ id: "fbi-money", after: [2, 3] }],
        },
      },
    ],
  }),
);

const model: Scenario = {
  id: "chinese-model",
  app: "wechat",
  contact: "ling",
  text: S.model.text,
  once: true,
  weight: 4,
  requires: [{ counter: "envelopes", min: 1 }],
  choices: [
    {
      label: S.model.sendBack.label,
      tone: "no",
      result: S.model.sendBack.result,
    },
    {
      label: S.model.load.label,
      hidden: true,
      result: S.model.load.result,
      effects: { stats: { board: -10 }, targetBoost: 0.15 },
    },
    {
      label: S.model.invite.label,
      tone: "yes",
      result: S.model.invite.result,
      effects: { stats: { affairs: 1 }, counters: { evidence: 1 } },
    },
  ],
};

const architecture: Scenario = {
  id: "architecture",
  app: "wechat",
  contact: "ling",
  text: S.architecture.text,
  once: true,
  weight: 3,
  requires: [{ counter: "sales", min: 1 }],
  choices: [
    {
      label: S.architecture.refuse.label,
      tone: "no",
      result: S.architecture.refuse.result,
    },
    {
      label: S.architecture.fake.label,
      outcomes: [
        {
          result: S.architecture.fake.fooled,
          effects: { stats: { money: 25 }, counters: { evidence: 1 } },
        },
        {
          result: S.architecture.fake.caught,
          effects: { stats: { board: -15 } },
        },
      ],
    },
    {
      label: S.architecture.tell.label,
      tone: "yes",
      result: S.architecture.tell.result,
      hint: STRINGS.hints.secrets,
      effects: {
        stats: { money: 25, feds: 20 },
        counters: { evidence: 2 },
        schedule: [{ id: "fbi-money", after: [2, 3] }],
      },
    },
  ],
};

const dinner: Scenario = {
  id: "dinner",
  app: "wechat",
  contact: "ling",
  text: S.dinner.text,
  once: true,
  weight: 12,
  requires: [{ counter: "envelopes", min: 2 }],
  choices: [
    {
      label: S.dinner.decline.label,
      tone: "no",
      result: S.dinner.decline.result,
    },
    {
      label: S.dinner.attend.label,
      tone: "yes",
      result: S.dinner.attend.result,
      effects: {
        setFlags: ["dinner_attended"],
        schedule: [{ id: "chinese-exec", after: [1, 2] }],
      },
    },
  ],
};

export const chinese: Scenario[] = [...buyers, ...envelopes, model, architecture, dinner];
