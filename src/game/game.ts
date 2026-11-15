import "./game.css";
import { STRINGS } from "../strings";
import { ENDINGS, SCENARIOS } from "./content";
import { takeDevEnd, watchDevCodes } from "./dev";
import { FEDS_PER_STAR, type GameState, type LossKind } from "./types";
import { autoAnim, preloadAnimArt } from "./anims";
import { drawScenario, newGame, resolveChoice } from "./engine";
import { imageFor } from "../images";
import { allIdentityImages, currentIdentity, nextIdentity } from "./identity";
import { EARNINGS_FIRED_ID } from "./quarter";
import { runTutorial } from "./tutorial";
import { GameView, type SummaryData } from "./view";

let bestAffairs = 0;

function summaryOf(state: GameState, loss: LossKind): SummaryData {
  const S = STRINGS.summary;
  const stars = Math.ceil(state.stats.feds / FEDS_PER_STAR);
  const reached = state.seen.has(EARNINGS_FIRED_ID) ? state.quarter.number - 1 : state.quarter.number;
  const affairs = state.stats.affairs;
  const newBest = affairs > bestAffairs;
  if (newBest) bestAffairs = affairs;
  return {
    title: S.title,
    affairsLabel: S.affairs,
    affairs,
    badge: newBest ? S.newBest : S.best(bestAffairs),
    badgeHot: newBest,
    cells: [
      { label: S.labels.rounds, value: String(Math.max(1, state.turn - 1)) },
      { label: S.labels.quarter, value: S.quarterValue(reached) },
      { label: S.labels.money, value: STRINGS.amounts.money(state.stats.money) },
      { label: S.labels.wanted, value: STRINGS.amounts.stars(stars) },
      { label: S.labels.board, value: String(state.stats.board) },
    ],
    cause: S.cause(S.causes[loss]),
  };
}

export async function startGame(root: HTMLElement): Promise<void> {
  const view = new GameView(root);
  watchDevCodes();
  for (const url of allIdentityImages()) imageFor(url, () => {});
  preloadAnimArt();

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
      if (outcome.anim) {
        if ((outcome.effects?.stats?.affairs ?? 0) > 0) await view.animate("kiss", true);
        await view.animate(outcome.anim, true);
      } else {
        const auto = autoAnim(choice, outcome);
        if (auto) void view.animate(auto);
      }
      await view.narrate(outcome.hint ? `${outcome.result}\n${outcome.hint}` : outcome.result);
    }

    const ending = ENDINGS[state.loss];
    view.showNewsflash(currentIdentity());
    await view.narrate(ending.headline);
    await view.narrate(ending.story);
    view.clearText();
    await view.showSummary(summaryOf(state, state.loss));
    const successor = nextIdentity();
    view.clearText();
    await view.transform(successor);
    await view.narrate(STRINGS.endings.newCeo(successor.name));
    await view.narrate(STRINGS.endings.newCeoStory);
  }
}
