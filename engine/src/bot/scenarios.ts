/**
 * Hand-built positions with a known right answer, run against a weight vector.
 *
 * ## Why these exist, and why they're parameterised by weights
 *
 * Every other measurement of the bot is *relative to an opponent* — a win rate
 * against v1, against a champion, against a mixed pod. That makes all of them
 * blind in the same way: a vector can climb by learning to exploit whatever the
 * opponents are bad at while playing worse Magic, and the numbers will applaud.
 * These scenarios encode correct play directly, so they can't be gamed by
 * anything except playing correctly.
 *
 * That matters far more now that weights are *fitted* rather than hand-picked
 * (`scripts/fit-weights.mjs`). A regression over self-play positions will
 * happily discover a coefficient that predicts winning for a reason that has
 * nothing to do with causing it — `library` is the obvious trap, since the
 * player with more cards left is often the one who hasn't been forced to dig.
 * A vector that fails a scenario is rejected however good its bench looks.
 *
 * Each returns a plain pass/fail with a reason, so the same suite can run as
 * vitest (`test/eval-bot-scenarios.test.ts`, against the shipped defaults) and
 * as a gate on a candidate vector (`scripts/check-scenarios.mjs --weights`).
 *
 * They grow every time a live game shows a bad play. See
 * `docs/plans/smarter-bots.md`, "Not just beating v1".
 */

import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { createDefaultRegistry } from "../cards.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { EvalBotController } from "./eval-bot.js";
import { DEFAULT_WEIGHTS } from "./evaluate.js";
import type { EvalWeights } from "./evaluate.js";

export interface ScenarioResult {
  readonly passed: boolean;
  /** What actually happened, for a failure message. */
  readonly detail: string;
}

/**
 * Builds the bot under test. Defaults to v2's `EvalBotController`; v3's
 * `PlanBotController` is passed in by `bot:scenarios --bot v3`.
 *
 * The scenarios are deliberately architecture-agnostic — they assert what the
 * bot *does*, never how it decided — so the same suite gates every version, and
 * a new search has to earn the same correctness bar as the one it replaces.
 */
export type BotFactory = (
  player: PlayerId,
  registry: CardRegistry,
  weights: EvalWeights,
) => PlayerController;

export interface BotScenario {
  readonly name: string;
  /** The rule being asserted, in one line. */
  readonly rule: string;
  run(weights: EvalWeights, registry: CardRegistry, makeBot: BotFactory): ScenarioResult;
}

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const forestDeck = (player: PlayerId) => ({ player, cards: Array<string>(40).fill("Forest") });

const viewOf = (game: Game, player: PlayerId): ControllerView => ({
  state: game.state,
  player,
  legalActions: () => game.legalActions(player),
});

/**
 * A two-player game paused at Alice's precombat main with `setup`'s board in
 * place.
 *
 * Both seats run plain forests, so nothing the deck happens to contain can
 * make a scenario pass or fail; every relevant card is spawned explicitly.
 */
function mainPhase(setup: (game: Game) => void, registry: CardRegistry): Game {
  const game = Game.create({ seed: 3, registry, decks: [forestDeck(A), forestDeck(B)] });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  setup(game);
  return game;
}

const evalBotFactory: BotFactory = (player, registry, weights) =>
  new EvalBotController(player, registry, { weights });

const describeAction = (action: Action): string => JSON.stringify(action);

const SCENARIOS: readonly BotScenario[] = [
  {
    name: "plays a land",
    rule: "A land drop costs a card and must still be worth making, or the bot never develops.",
    run(weights, registry, makeBot) {
      // The founding regression: under the naive feature set a land drop is one
      // fewer card in hand and nothing else, so it scores negative and the bot
      // passes every turn for the whole game. Measured, before any of this
      // existed: 0 wins, 20 losses, 215 consecutive passes, dead on an empty
      // board at turn 20 holding seven cards.
      const game = mainPhase((g) => {
        g.debugSpawn("Forest", A, "hand");
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type === "play-land",
        detail: `played ${describeAction(action)}`,
      };
    },
  },
  {
    name: "plays a land past the land cap",
    rule: "Lands beyond `landCap` are worth less, never negative — a flooded board still develops.",
    run(weights, registry, makeBot) {
      // The trap a *fitted* vector walks into. Sitting on twelve lands is
      // strongly associated with losing, because it's usually a game that went
      // long for someone who was behind — so an unconstrained regression reads
      // `extraLands` as negative and the bot stops making land drops in exactly
      // the long games that need them. That's the same catatonic failure the
      // whole feature set was built to avoid, arriving by a new route, and the
      // "plays a land" scenario above can't see it because there the bot is
      // nowhere near the cap.
      const game = mainPhase((g) => {
        for (let i = 0; i < 12; i += 1) g.debugSpawn("Forest", A, "battlefield");
        g.debugSpawn("Forest", A, "hand");
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type === "play-land",
        detail: `on 12 lands, chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "removal takes the biggest threat",
    rule: "Given one removal spell and two targets, the bigger creature is the one that dies.",
    run(weights, registry, makeBot) {
      let big: ObjectId | null = null;
      let small: ObjectId | null = null;
      const game = mainPhase((g) => {
        for (let i = 0; i < 3; i += 1) g.debugSpawn("Swamp", A, "battlefield");
        // Removal is the *only* thing in hand. Left with a land as well, the
        // bot plays the land first — correct sequencing rather than a refusal
        // to cast, and indistinguishable from one if the test only looks at a
        // single action. Same trap as the commander scenario below.
        g.state.zones.perPlayer[A].hand = [];
        g.debugSpawn("Murder", A, "hand");
        small = g.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
        big = g.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
      }, registry);

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      if (action.type !== "cast-spell") {
        return { passed: false, detail: `did not cast removal: ${describeAction(action)}` };
      }
      const target = action.targets?.[0];
      const hit = target != null && target.kind === "object" ? target.object : null;
      return {
        passed: hit === big,
        detail: hit === small ? "killed the 2/2 and left the 6/4" : `targeted ${String(hit)}`,
      };
    },
  },
  {
    name: "does not tap mana for nothing",
    rule: "With nothing to cast, floating mana gains nothing and strands the source.",
    run(weights, registry, makeBot) {
      // v1 learned this the hard way and `candidates.ts` filters mana abilities
      // out of the search for it: casting auto-pays, so activating one on its
      // own can only lose you the source — and in a live room it reads as a
      // land flipping sideways for no reason between a spell being cast and
      // that spell resolving.
      const game = mainPhase((g) => {
        for (let i = 0; i < 4; i += 1) g.debugSpawn("Forest", A, "battlefield");
        g.debugSpawn("Sol Ring", A, "battlefield");
        // An empty hand, so passing is genuinely the only thing left to do.
        // With a land still in hand the bot plays it and the assertion passes
        // without ever testing what it claims to.
        g.state.zones.perPlayer[A].hand = [];
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type !== "activate-ability",
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "recasts a taxed commander",
    rule: "Commander tax makes the next cast dearer; it doesn't make casting wrong.",
    run(weights, registry, makeBot) {
      // The other trap a fitted vector walks into. A commander that has been
      // cast four times is a commander that has *died* four times, so a high
      // tax is strongly associated with losing — and `commanderTax` is a
      // subtracted term, so the regression drives it up until the bot would
      // rather leave its commander in the command zone forever.
      const game = Game.create({
        seed: 3,
        registry,
        decks: [
          { player: A, cards: Array<string>(40).fill("Forest"), commander: "Azusa, Lost but Seeking" },
          forestDeck(B),
        ],
      });
      game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
      // {2}{G} plus {4} of tax, with a land to spare.
      for (let i = 0; i < 8; i += 1) game.debugSpawn("Forest", A, "battlefield");
      game.state.players[A].commanderCastCounts = { "Azusa, Lost but Seeking": 2 } as never;
      // Empty the hand, or the scenario has a false positive: with a land
      // still holdable this turn, playing it *first* and casting the commander
      // after is correct sequencing rather than a refusal to cast, and a
      // land-hungry vector picks it for the right reason. Asserting on a
      // single action can't tell those apart, so the alternative is removed.
      game.state.zones.perPlayer[A].hand = [];

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type === "cast-spell",
        detail: `at {4} of tax with 8 lands, chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "takes lethal on board",
    rule: "A swing that wins the game outranks every positional term.",
    run(weights, registry, makeBot) {
      const game = mainPhase((g) => {
        for (let i = 0; i < 3; i += 1) {
          g.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
        }
        g.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
        g.state.players[B].life = 12;
      }, registry);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      // Three 6/4s into one blocker: 12 damage gets through however Bob blocks,
      // which is exactly lethal.
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 3,
        detail: `attacked with ${attackers.length} of 3`,
      };
    },
  },
  {
    name: "does not swing into a lethal crackback",
    rule: "Two free damage isn't worth dying to the swing back.",
    run(weights, registry, makeBot) {
      const game = mainPhase((g) => {
        g.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
        // Tapped, so it can't block the bear — but it untaps for Bob's turn.
        // A 4/4 without trample, so a blocking bear stops all of it.
        g.debugSpawn("Rumbling Baloth", B, "battlefield", { summoningSick: false, tapped: true });
        g.state.players[A].life = 5;
      }, registry);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 0,
        detail: `attacked with ${attackers.length} at 5 life into a 4/4`,
      };
    },
  },
  {
    name: "attacks when it is safe to",
    rule: "The crackback check must not make the bot passive — the mirror of the test above.",
    run(weights, registry, makeBot) {
      const game = mainPhase((g) => {
        g.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
        g.debugSpawn("Rumbling Baloth", B, "battlefield", { summoningSick: false, tapped: true });
        g.state.players[A].life = 40;
      }, registry);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 1,
        detail: `attacked with ${attackers.length} at 40 life`,
      };
    },
  },
  {
    name: "chump-blocks only against lethal",
    rule: "Throwing a creature under an attacker is right facing death and wrong otherwise.",
    run(weights, registry, makeBot) {
      const blockers = (life: number): number => {
        const game = Game.create({
          seed: 3,
          registry,
          // v1 in the other seat swings with everything, which is what we need
          // to be facing.
          controllers: { [B]: evalBotFactory(B, registry, DEFAULT_WEIGHTS) },
          decks: [forestDeck(A), forestDeck(B)],
        });
        game.advanceUntil((s) => s.priority.holder !== null);
        game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
        game.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
        game.state.players[A].life = life;
        game.advanceUntil((s) => s.awaiting?.kind === "blockers" && s.awaiting.player === A);
        return makeBot(A, registry, weights).declareBlockers(viewOf(game, A)).length;
      };
      const healthy = blockers(40);
      const dying = blockers(5);
      return {
        passed: healthy === 0 && dying === 1,
        detail: `blocked ${healthy} at 40 life, ${dying} at 5`,
      };
    },
  },
];

export const BOT_SCENARIOS = SCENARIOS;

export interface ScenarioReport {
  readonly name: string;
  readonly rule: string;
  readonly passed: boolean;
  readonly detail: string;
}

/** Every scenario against one weight vector. A vector that fails any of them
 * doesn't ship, whatever it benched. */
export function runScenarios(
  weights: EvalWeights = DEFAULT_WEIGHTS,
  registry: CardRegistry = createDefaultRegistry(),
  makeBot: BotFactory = evalBotFactory,
): ScenarioReport[] {
  return SCENARIOS.map((scenario) => {
    try {
      const { passed, detail } = scenario.run(weights, registry, makeBot);
      return { name: scenario.name, rule: scenario.rule, passed, detail };
    } catch (error) {
      return {
        name: scenario.name,
        rule: scenario.rule,
        passed: false,
        detail: `threw: ${String((error as Error)?.message ?? error)}`,
      };
    }
  });
}
