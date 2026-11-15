import { STRINGS } from "../../strings";
import type { Scenario } from "../types";
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
      effects: {
        stats: { affairs: 1 },
        counters: { evidence: 1 },
        setFlags: ["spy_contact"],
      },
    },
  ],
};

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
        { result: S.hrComplaint.deny.believed, effects: { stats: { board: -5 } } },
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

export const affairs: Scenario[] = [spy, trip, employee, exec, hrComplaint];
