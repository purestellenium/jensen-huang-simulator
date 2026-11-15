import { STRINGS } from "../strings";
import { currentIdentity } from "./identity";
import { HUD_CHIPS } from "./hud";
import type { GameView } from "./view";

interface Step {
  text: string;
  chip: number | null;
  portrait?: boolean;
}

const T = STRINGS.tutorial;

const STEPS: Step[] = [
  { text: T.intro, chip: null, portrait: true },
  { text: T.goal, chip: null },
  { text: T.money, chip: HUD_CHIPS.money },
  { text: T.affairs, chip: HUD_CHIPS.affairs },
  { text: T.feds, chip: HUD_CHIPS.feds },
  { text: T.earnings, chip: HUD_CHIPS.earnings },
  { text: T.board, chip: HUD_CHIPS.board },
];

export async function runTutorial(view: GameView): Promise<void> {
  for (const step of STEPS) {
    if (step.portrait) view.showNewsflash(currentIdentity(), false);
    else view.openApp(null);
    view.highlightChip(step.chip);
    await view.narrate(step.text);
  }
  view.highlightChip(null);
}
