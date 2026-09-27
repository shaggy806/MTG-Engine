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
import type { TargetRef } from "../target.js";
import { EvalBotController } from "./eval-bot.js";
import { DEFAULT_WEIGHTS } from "./evaluate.js";
import type { EvalWeights } from "./evaluate.js";

export interface ScenarioResult {
  readonly passed: boolean;
  /** What actually happened, for a failure message. */
  readonly detail: string;
}

/**
 * Builds the bot under test. Defaults to v2's `EvalBotController`.
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
const C = asPlayerId("carol");
const D = asPlayerId("dave");

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

/** A four-player game paused at Alice's precombat main, her hand empty. */
function fourPlayerMain(registry: CardRegistry): Game {
  const game = Game.create({ seed: 3, registry, decks: [A, B, C, D].map(forestDeck) });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  game.state.zones.perPlayer[A].hand = [];
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
        // A trampler: a chump block saves only 2 of its 6, so at 40 life
        // the bear is worth more than the life.
        game.debugSpawn("Colossal Dreadmaw", B, "battlefield", { summoningSick: false });
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
  {
    name: "does not pacify its own creature",
    rule: "An Aura that stops a creature attacking is worth nothing on your own creature.",
    run(weights, registry, makeBot) {
      // The Aura report behind `docs/plans/bot-effect-knowledge.md`: with no
      // opponent's creature to enchant, Pacifism's only legal target is our
      // own Craw Wurm, and an evaluation that counts a pacified creature's
      // power in full scores enchanting it as a gain — a permanent for a card
      // (`otherPermanents` + `permanentManaValue` against `hand`), and nothing
      // lost. It is a loss: the Wurm never attacks again.
      //
      // The Wurm is tapped — it has attacked — because an untapped one before
      // combat doesn't test the evaluation: the rollout plays the combat and
      // sees the attack lost. Tapped, or after combat, nothing but the
      // evaluation can see it, and at `idlePower: 0` v2 cast it.
      let wurm: ObjectId | null = null;
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 2; i += 1) g.debugSpawn("Plains", A, "battlefield");
        wurm = g.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false, tapped: true });
        g.debugSpawn("Pacifism", A, "hand");
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      const target = action.type === "cast-spell" ? action.targets?.[0] : undefined;
      const hit = target != null && target.kind === "object" ? target.object : null;
      return {
        passed: hit !== wurm,
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "pays life for cards while it can spare it",
    rule: "At 40 life, two life is worth less than a card.",
    run(weights, registry, makeBot) {
      // Read the Bones is two cards for itself and two life — one card up.
      // With every point of life worth half a card whatever the total, that
      // scored exactly zero — and ties go to passing, so v2 held it (and Sign in Blood)
      // forever: it was the card v2 most often ended a turn holding, after
      // Clan Defiance and Vandalblast, in 24 four-player games. `lifeDanger`
      // is what lets a point of life be cheap at 40 and dear at 5; the twin
      // scenario below is the other half.
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 3; i += 1) g.debugSpawn("Swamp", A, "battlefield");
        g.debugSpawn("Read the Bones", A, "hand");
        g.state.players[A].life = 40;
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type === "cast-spell",
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "keeps its life when it is running out",
    rule: "At 5 life, two life is worth more than a card.",
    run(weights, registry, makeBot) {
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 3; i += 1) g.debugSpawn("Swamp", A, "battlefield");
        g.debugSpawn("Read the Bones", A, "hand");
        g.state.players[A].life = 5;
      }, registry);
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type !== "cast-spell",
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "removal finds the threat on a wide four-player board",
    rule: "The creature worth killing is found however many older ones are listed before it.",
    run(weights, registry, makeBot) {
      // `legalTargets` lists the battlefield oldest-first and a searching bot
      // simulates a capped number of targets, so on a real four-player board
      // the newest threat used to be past the cap — the bot never saw it. Eight
      // small creatures, two of them our own, all older than carol's 6/4.
      const game = fourPlayerMain(registry);
      for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
      for (const player of [A, B, C, D]) {
        for (const name of ["Grizzly Bears", "Llanowar Elves"]) {
          game.debugSpawn(name, player, "battlefield", { summoningSick: false });
        }
      }
      const wurm = game.debugSpawn("Craw Wurm", C, "battlefield", { summoningSick: false });
      game.debugSpawn("Murder", A, "hand");

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      const target = action.type === "cast-spell" ? action.targets?.[0] : undefined;
      const hit = target != null && target.kind === "object" ? target.object : null;
      return {
        passed: hit === wurm,
        detail:
          action.type !== "cast-spell"
            ? `did not cast removal: ${describeAction(action)}`
            : `killed ${hit === null ? "nothing" : game.state.objects[hit]?.cardName} of ${
                hit === null ? "?" : game.state.objects[hit]?.controller
              }`,
      };
    },
  },
  {
    name: "aims Drakuseth's trigger at the opponents",
    rule: "Damage from our own attack trigger goes at the table, never at our side.",
    run(weights, registry, makeBot) {
      // Measured in four-player games before targets were ranked: players are
      // listed first, in turn order, so the first target combinations all put
      // the 4 damage on alice herself, the rest of the table lay past the
      // cap, and the bot chose the least bad of those.
      const game = fourPlayerMain(registry);
      for (const player of [A, B, C, D]) {
        for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", player, "battlefield");
        game.debugSpawn("Grizzly Bears", player, "battlefield", { summoningSick: false });
      }
      game.debugSpawn("Llanowar Elves", A, "battlefield", { summoningSick: false });
      game.debugSpawn("Craw Wurm", C, "battlefield", { summoningSick: false });
      const drakuseth = game.debugSpawn("Drakuseth, Maw of Flames", A, "battlefield", {
        summoningSick: false,
      });
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      game.dispatch({
        type: "declare-attackers",
        player: A,
        attackers: [{ attacker: drakuseth, defender: B }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
      if (game.state.awaiting?.kind !== "choose-targets") {
        return { passed: false, detail: "the attack trigger never asked for targets" };
      }

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      const targets = action.type === "choose-targets" ? action.targets : [];
      const ours = targets.filter((t) => t !== null && sideOf(game, t) === A);
      return {
        passed: action.type === "choose-targets" && targets.length > 0 && ours.length === 0,
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "puts its counter on its own creature on a wide board",
    rule: "A +1/+1 counter belongs on our creature, however many of theirs are listed first.",
    run(weights, registry, makeBot) {
      // Nine opposing creatures, all older than ours: in the battlefield's
      // order, ours comes tenth. Before the ranking, the bot saw only the
      // first eight choices, all of them opponents' — and passed.
      const game = fourPlayerMain(registry);
      for (const player of [B, C, D]) {
        for (let i = 0; i < 3; i += 1) {
          game.debugSpawn("Grizzly Bears", player, "battlefield", { summoningSick: false });
        }
      }
      game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
      const ajani = game.debugSpawn("Ajani, Caller of the Pride", A, "battlefield");

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      const targets = action.type === "activate-ability" ? (action.targets ?? []) : [];
      return {
        passed:
          action.type === "activate-ability" &&
          action.source === ajani &&
          targets.every((t) => t === null || sideOf(game, t) === A),
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
  {
    name: "does not counter its own spell",
    rule: "Absorb's three life is no reason to counter our own card draw.",
    run(weights, registry, makeBot) {
      // v1 did it, before it aimed: any spell on the stack is a legal target,
      // and ours was the only one. The evaluation prices it right at the
      // shipped weights, but a vector that rates three life above two cards
      // doesn't — at `life: 5`, v2 counters its own Divination.
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 9; i += 1) g.debugSpawn(i < 3 ? "Plains" : "Island", A, "battlefield");
      }, registry);
      const divination = game.debugSpawn("Divination", A, "hand");
      game.debugSpawn("Absorb", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [] });
      // Divination is on the stack and its caster holds priority (rule
      // 117.3c). Absorb has to be castable, or passing proves nothing.
      const offered = game
        .legalActions(A)
        .some((o) => o.kind === "cast-spell" && o.cardName === "Absorb");
      if (!offered) return { passed: false, detail: "Absorb wasn't castable" };

      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      return {
        passed: action.type !== "cast-spell",
        detail: `chose ${describeAction(action)}`,
      };
    },
  },
];

/** Who a target belongs to: a player, or a permanent's controller. */
function sideOf(game: Game, target: TargetRef): PlayerId | undefined {
  return target.kind === "player" ? target.player : game.state.objects[target.object]?.controller;
}

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
