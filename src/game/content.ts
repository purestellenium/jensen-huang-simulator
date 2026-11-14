import { STRINGS } from "../strings";
import type { LossKind, Scenario } from "./types";

export interface Contact {
  emoji: string;
  color: string;
  image?: string;
}

export const CONTACTS: Record<string, Contact> = {
  spy: { emoji: "🕶️", color: "#a633d6" },
  barista: { emoji: "☕", color: "#a633d6" },
  lori: { emoji: "👩", color: "#ec3750" },
  tabloid: { emoji: "📰", color: "#f1c40f" },
  ling: { emoji: "📦", color: "#338eda" },
  wei: { emoji: "🎮", color: "#33d6a6" },
  fbi: { emoji: "🕵️", color: "#8492a6" },
  board: { emoji: "👔", color: "#338eda" },
  lawyer: { emoji: "⚖️", color: "#ff8c37" },
};

export const ENDINGS: Record<LossKind, { headline: string; story: string }> = {
  feds: STRINGS.endings.feds,
  board: STRINGS.endings.board,
  scandal: STRINGS.endings.scandal,
};

const S = STRINGS.scenarios;

export const SCENARIOS: Scenario[] = [
  {
    id: "dating-spy",
    app: "dating",
    contact: "spy",
    text: S.datingSpy.text,
    weight: 2,
    choices: [
      {
        label: S.datingSpy.decline.label,
        tone: "no",
        result: S.datingSpy.decline.result,
      },
      {
        label: S.datingSpy.accept.label,
        tone: "yes",
        result: S.datingSpy.accept.result,
        effects: { stats: { affairs: 1, feds: 8 } },
      },
    ],
  },
  {
    id: "dating-barista",
    app: "dating",
    contact: "barista",
    text: S.datingBarista.text,
    requires: [{ stat: "turn", min: 2 }],
    forbids: [{ flag: "met_barista" }],
    once: true,
    choices: [
      {
        label: S.datingBarista.left.label,
        tone: "no",
        result: S.datingBarista.left.result,
      },
      {
        label: S.datingBarista.right.label,
        tone: "yes",
        result: S.datingBarista.right.result,
        effects: { stats: { affairs: 1 }, setFlags: ["met_barista"] },
      },
    ],
  },
  {
    id: "dating-barista-again",
    app: "dating",
    contact: "barista",
    text: S.datingBaristaAgain.text,
    requires: [{ flag: "met_barista" }],
    once: true,
    weight: 3,
    choices: [
      {
        label: S.datingBaristaAgain.replyAll.label,
        tone: "yes",
        result: S.datingBaristaAgain.replyAll.result,
        effects: { stats: { affairs: 2, feds: 3 } },
      },
      {
        label: S.datingBaristaAgain.justLattes.label,
        result: S.datingBaristaAgain.justLattes.result,
        effects: { stats: { affairs: 1 } },
      },
      {
        label: S.datingBaristaAgain.block.label,
        tone: "no",
        result: S.datingBaristaAgain.block.result,
      },
    ],
  },
  {
    id: "dating-lori",
    app: "dating",
    contact: "lori",
    text: S.datingLori.text,
    requires: [{ stat: "affairs", min: 1 }],
    once: true,
    weight: 3,
    choices: [
      {
        label: S.datingLori.unmatch.label,
        tone: "no",
        outcomes: [
          { weight: 2, result: S.datingLori.unmatch.safe },
          { result: S.datingLori.unmatch.caught, loss: "scandal" },
        ],
      },
      {
        label: S.datingLori.matchWife.label,
        tone: "yes",
        result: S.datingLori.matchWife.result,
        effects: { stats: { money: -5 } },
      },
    ],
  },
  {
    id: "wechat-ling",
    app: "wechat",
    contact: "ling",
    text: S.wechatLing.text,
    weight: 3,
    choices: [
      {
        label: S.wechatLing.refuse.label,
        tone: "no",
        result: S.wechatLing.refuse.result,
        effects: { stats: { board: 2 } },
      },
      {
        label: S.wechatLing.accept.label,
        tone: "yes",
        result: S.wechatLing.accept.result,
        effects: { stats: { money: 6.7, feds: 15 }, setFlags: ["sold_to_china"] },
      },
    ],
  },
  {
    id: "wechat-wei",
    app: "wechat",
    contact: "wei",
    text: S.wechatWei.text,
    requires: [{ stat: "money", min: 20 }],
    choices: [
      {
        label: S.wechatWei.refuse.label,
        tone: "no",
        result: S.wechatWei.refuse.result,
        effects: { stats: { board: 3 } },
      },
      {
        label: S.wechatWei.ship.label,
        tone: "yes",
        result: S.wechatWei.ship.result,
        effects: { stats: { money: 60, feds: 20 }, setFlags: ["sold_to_china"] },
      },
    ],
  },
  {
    id: "wechat-envelope",
    app: "wechat",
    contact: "ling",
    text: S.wechatEnvelope.text,
    choices: [
      {
        label: S.wechatEnvelope.giveBack.label,
        tone: "no",
        result: S.wechatEnvelope.giveBack.result,
        effects: { stats: { board: 2 } },
      },
      {
        label: S.wechatEnvelope.accept.label,
        tone: "yes",
        result: S.wechatEnvelope.accept.result,
        effects: { stats: { money: 2, feds: 6 } },
      },
    ],
  },
  {
    id: "wechat-second-pallet",
    app: "wechat",
    contact: "ling",
    text: S.wechatSecondPallet.text,
    requires: [{ flag: "sold_to_china" }],
    once: true,
    weight: 2,
    choices: [
      {
        label: S.wechatSecondPallet.outOfStock.label,
        tone: "no",
        result: S.wechatSecondPallet.outOfStock.result,
        effects: { stats: { board: 2 } },
      },
      {
        label: S.wechatSecondPallet.ship.label,
        tone: "yes",
        result: S.wechatSecondPallet.ship.result,
        effects: { stats: { money: 8, feds: 15 } },
      },
    ],
  },
  {
    id: "signal-fbi",
    app: "signal",
    contact: "fbi",
    text: S.signalFbi.text,
    requires: [{ flag: "sold_to_china" }],
    once: true,
    weight: 5,
    choices: [
      {
        label: S.signalFbi.burgers.label,
        outcomes: [
          { result: S.signalFbi.burgers.believed, effects: { stats: { feds: -10 } } },
          { weight: 2, result: S.signalFbi.burgers.caught, effects: { stats: { feds: 35 } } },
        ],
      },
      {
        label: S.signalFbi.amd.label,
        outcomes: [
          { result: S.signalFbi.amd.believed, effects: { stats: { feds: -15, board: -6 } } },
          { result: S.signalFbi.amd.caught, effects: { stats: { feds: 30 } } },
        ],
      },
    ],
  },
  {
    id: "signal-board",
    app: "signal",
    contact: "board",
    text: S.signalBoard.text,
    weight: 2,
    choices: [
      {
        label: S.signalBoard.callBack.label,
        outcomes: [
          { result: S.signalBoard.callBack.fine, effects: { stats: { board: 5 } } },
          { result: S.signalBoard.callBack.bad, effects: { stats: { board: -12 } } },
        ],
      },
      {
        label: S.signalBoard.mute.label,
        result: S.signalBoard.mute.result,
        effects: { stats: { board: -8 } },
      },
    ],
  },
  {
    id: "signal-lori",
    app: "signal",
    contact: "lori",
    text: S.signalLori.text,
    requires: [{ stat: "affairs", min: 2 }],
    weight: 3,
    choices: [
      {
        label: S.signalLori.supplier.label,
        outcomes: [
          { weight: 2, result: S.signalLori.supplier.believed },
          { result: S.signalLori.supplier.calls, loss: "scandal" },
        ],
      },
      {
        label: S.signalLori.gift.label,
        requires: [{ stat: "money", min: 30 }],
        result: S.signalLori.gift.result,
        effects: { stats: { money: -30 } },
      },
      {
        label: S.signalLori.heart.label,
        outcomes: [
          { weight: 3, result: S.signalLori.heart.safe },
          { result: S.signalLori.heart.caught, loss: "scandal" },
        ],
      },
    ],
  },
  {
    id: "signal-tabloid",
    app: "signal",
    contact: "tabloid",
    text: S.signalTabloid.text,
    requires: [{ stat: "affairs", min: 4 }],
    weight: 4,
    choices: [
      {
        label: S.signalTabloid.noComment.label,
        outcomes: [
          { weight: 2, result: S.signalTabloid.noComment.quiet },
          { result: S.signalTabloid.noComment.published, loss: "scandal" },
        ],
      },
      {
        label: S.signalTabloid.payUp.label,
        requires: [{ stat: "money", min: 15 }],
        result: S.signalTabloid.payUp.result,
        effects: { stats: { money: -15 } },
      },
      {
        label: S.signalTabloid.deny.label,
        outcomes: [
          { result: S.signalTabloid.deny.believed },
          { result: S.signalTabloid.deny.caught, loss: "scandal" },
        ],
      },
    ],
  },
  {
    id: "signal-lawyer",
    app: "signal",
    contact: "lawyer",
    text: S.signalLawyer.text,
    requires: [{ stat: "feds", min: 30 }],
    weight: 3,
    choices: [
      {
        label: S.signalLawyer.hire.label,
        result: S.signalLawyer.hire.result,
        effects: { stats: { money: -40, feds: -20 } },
      },
      {
        label: S.signalLawyer.disappearing.label,
        result: S.signalLawyer.disappearing.result,
        effects: { stats: { feds: 20 }, setFlags: ["disappearing_on"] },
        next: "signal-disappeared",
      },
    ],
  },
  {
    id: "signal-disappeared",
    app: "signal",
    contact: "fbi",
    text: S.signalDisappeared.text,
    requires: [{ flag: "disappearing_on" }],
    once: true,
    choices: [
      {
        label: S.signalDisappeared.blame.label,
        result: S.signalDisappeared.blame.result,
        effects: { stats: { feds: 10, board: -8 } },
      },
      {
        label: S.signalDisappeared.gift.label,
        outcomes: [
          { result: S.signalDisappeared.gift.accepted, effects: { stats: { feds: -30 } } },
          { result: S.signalDisappeared.gift.bribe, effects: { stats: { feds: 35 } } },
        ],
      },
    ],
  },
];
