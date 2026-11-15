import type { Scenario } from "../types";
import { affairs } from "./affairs";
import { board } from "./board";
import { chinese } from "./chinese";
import { fbi } from "./fbi";
import { misc } from "./misc";

export { CONTACTS, ENDINGS, type Contact } from "./shared";

export const SCENARIOS: Scenario[] = [...chinese, ...fbi, ...affairs, ...board, ...misc];
