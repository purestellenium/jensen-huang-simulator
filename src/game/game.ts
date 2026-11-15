import "./game.css";
import { STRINGS } from "../strings";
import { ENDINGS, SCENARIOS } from "./content";
import { drawScenario, newGame, resolveChoice } from "./engine";
import { GameView } from "./view";

export async function startGame(root: HTMLElement): Promise<void> {
  const view = new GameView(root);

  for (;;) {
    const state = newGame();
    view.updateStats(state);

    while (!state.loss) {
      const scenario = drawScenario(state, SCENARIOS);
      view.openApp(scenario.app ?? null, scenario.contact, scenario.choices.length);
      await view.say(scenario.text);

      const choice = await view.choose(state, scenario.choices);
      const outcome = resolveChoice(state, choice);
      view.updateStats(state);
      await view.narrate(outcome.result);
    }

    const ending = ENDINGS[state.loss];
    view.openApp(null);
    await view.narrate(ending.headline);
    await view.narrate(ending.story);
    await view.narrate(STRINGS.endings.bounceBack);
  }
}
