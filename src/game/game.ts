import "./game.css";
import { STRINGS } from "../strings";
import { ENDINGS, SCENARIOS } from "./content";
import { takeDevEnd, watchDevCodes } from "./dev";
import { FEDS_PER_STAR, type GameState } from "./types";
import { drawScenario, newGame, resolveChoice } from "./engine";
import { imageFor } from "../images";
import { allIdentityImages, currentIdentity, nextIdentity } from "./identity";
import { runTutorial } from "./tutorial";
import { GameView } from "./view";

function summaryOf(state: GameState): string {
  const S = STRINGS.summary;
  const stars = Math.ceil(state.stats.feds / FEDS_PER_STAR);
  return [
    S.title,
    S.affairs(state.stats.affairs),
    S.turns(Math.max(1, state.turn - 1)),
    S.quarter(state.quarter.number),
    S.moneyBoard(STRINGS.amounts.money(state.stats.money), state.stats.board),
    S.wanted(STRINGS.amounts.stars(stars)),
  ].join("\n");
}

export async function startGame(root: HTMLElement): Promise<void> {
  const view = new GameView(root);
  watchDevCodes();
  for (const url of allIdentityImages()) imageFor(url, () => {});

  let first = true;
  for (;;) {
    const state = newGame();
    view.updateStats(state);
    if (first) {
      first = false;
      await runTutorial(view);
    }

    while (!state.loss) {
      const scenario = drawScenario(state, SCENARIOS);
      view.openApp(scenario.app ?? null, scenario.contact, scenario.choices.length);
      await view.say(scenario.text);

      const choice = await view.choose(state, scenario.choices);
      const outcome = resolveChoice(state, choice);
      if (takeDevEnd()) state.loss = state.loss ?? "board";
      view.updateStats(state);
      await view.narrate(outcome.result);
    }

    const ending = ENDINGS[state.loss];
    view.showNewsflash(currentIdentity());
    await view.narrate(ending.headline);
    await view.narrate(ending.story);
    await view.narrate(summaryOf(state));
    const successor = nextIdentity();
    view.clearText();
    await view.transform(successor);
    await view.narrate(STRINGS.endings.newCeo(successor.name));
    await view.narrate(STRINGS.endings.newCeoStory);
  }
}
