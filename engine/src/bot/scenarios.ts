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
 * ## Two kinds
 *
 * A **gate** scenario (the default) is a right answer the shipped weights must
 * give. A **training** scenario is a right answer they may still get wrong:
 * kept so `bot:fit-scenarios` can ask what weights would get it right, and so
 * that one no weight can fix is on record as a missing feature rather than
 * forgotten. Most scenarios are asked with one `act` and written as a
 * `position` — the board and a judge of *any* answer — which is what lets the
 * fitter judge every answer the bot weighed rather than only the one it chose
 * (`bot/scenario-fit.ts`). Combat declarations are scripts, run whole.
 *
 * They grow every time a live game shows a bad play. See
 * `docs/plans/smarter-bots.md`, "Not just beating v1", and
 * `docs/plans/bot-effect-knowledge.md`, steps 6 and 8.
 */

import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { createDefaultRegistry } from "../cards.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { printedCardName } from "../state.js";
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

/** A game paused where `player` must answer — a priority window or a
 * decision — and a judge of any answer they could give. */
export interface ScenarioPosition {
  readonly game: Game;
  readonly player: PlayerId;
  judge(action: Action): ScenarioResult;
}

export interface BotScenario {
  readonly name: string;
  /** The rule being asserted, in one line. */
  readonly rule: string;
  /** `"gate"` when absent — see "Two kinds" above. */
  readonly kind?: "gate" | "training";
  /**
   * The scenario as a position, for one asked with a single `act`. A setup
   * that didn't reach the question returns its failure instead, so a scenario
   * can never pass by testing nothing.
   */
  position?(registry: CardRegistry): ScenarioPosition | ScenarioResult;
  run(weights: EvalWeights, registry: CardRegistry, makeBot: BotFactory): ScenarioResult;
}

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const forestDeck = (player: PlayerId) => ({ player, cards: Array<string>(40).fill("Forest") });

const viewOf = (game: Game, player: PlayerId): ControllerView => game.controllerView(player);

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

/** A game paused at `active`'s precombat main, every hand empty. */
function table(registry: CardRegistry, players: readonly PlayerId[], active: PlayerId): Game {
  const game = Game.create({ seed: 3, registry, decks: players.map(forestDeck) });
  game.advanceUntil(
    (s) =>
      s.turnOrder[s.turn.activePlayerIndex] === active &&
      s.priority.holder === active &&
      s.turn.step === "precombat-main",
  );
  for (const player of players) game.state.zones.perPlayer[player].hand = [];
  return game;
}

/** A permanent that has been there since last turn. */
const onBoard = (game: Game, name: string, player: PlayerId, tapped = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, tapped });

const lands = (game: Game, name: string, player: PlayerId, count: number): void => {
  for (let i = 0; i < count; i += 1) onBoard(game, name, player);
};

/** Cast `card` from `player`'s hand, then pass priority round until
 * `responder` holds it with the spell still on the stack. */
function castAndPassTo(game: Game, player: PlayerId, card: ObjectId, responder: PlayerId): void {
  game.dispatch({ type: "cast-spell", player, card, targets: [] });
  game.advanceUntil((s) => s.priority.holder === responder);
}

/**
 * Alice, with Teval, the Balanced Scale as her commander on the battlefield and
 * a Hedron Crab, plays a Forest at a table of `players` (2-4): paused at the
 * Crab's landfall trigger asking whom to mill. `library` trims her library to
 * that many cards. A failure when the trigger never asked.
 */
function landfallMill(
  registry: CardRegistry,
  players: number,
  library?: number,
): Game | ScenarioResult {
  const game = table(registry, [A, B, C, D].slice(0, players), A);
  // Before anything asks: a deck's bias is read once per objects table.
  const teval = onBoard(game, "Teval, the Balanced Scale", A);
  game.state.objects[teval].isCommander = true;
  onBoard(game, "Hedron Crab", A);
  if (library !== undefined) {
    const zones = game.state.zones.perPlayer[A];
    zones.library = zones.library.slice(0, library);
  }
  const forest = game.debugSpawn("Forest", A, "hand");
  game.dispatch({ type: "play-land", player: A, card: forest });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
  if (game.state.awaiting?.kind !== "choose-targets") {
    return { passed: false, detail: "the landfall trigger never asked for a target" };
  }
  return game;
}

/** Take `game` from Alice's first main phase to her second, attacking with
 * nothing; a failure if it doesn't get there. */
function toSecondMain(game: Game): ScenarioResult | null {
  game.advanceUntil(
    (s) =>
      s.awaiting?.kind === "attackers" ||
      (s.turn.step === "postcombat-main" && s.priority.holder === A) ||
      s.result.over,
  );
  if (game.state.awaiting?.kind === "attackers") {
    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });
    game.advanceUntil(
      (s) => (s.turn.step === "postcombat-main" && s.priority.holder === A) || s.result.over,
    );
  }
  return game.state.turn.step === "postcombat-main" && game.state.priority.holder === A
    ? null
    : { passed: false, detail: "never reached the second main phase" };
}

const evalBotFactory: BotFactory = (player, registry, weights) =>
  new EvalBotController(player, registry, { weights });

const describeAction = (action: Action): string => JSON.stringify(action);

/** Who a target belongs to: a player, or a permanent's controller. */
function sideOf(game: Game, target: TargetRef): PlayerId | undefined {
  return target.kind === "player" ? target.player : game.state.objects[target.object]?.controller;
}

/** The object a cast or activation aims its first target at, if any. */
function firstTarget(action: Action): ObjectId | null {
  const targets =
    action.type === "cast-spell" || action.type === "activate-ability" ? action.targets : undefined;
  const target = targets?.[0];
  return target != null && target.kind === "object" ? target.object : null;
}

function cardOf(game: Game, id: ObjectId | null): string {
  if (id === null) return "nothing";
  const object = game.state.objects[id];
  return object === undefined ? String(id) : `${object.controller}'s ${printedCardName(object)}`;
}

/** A scenario asked with one `act`, its `run` following from its position. */
function asked(
  spec: Omit<BotScenario, "run" | "position"> & Required<Pick<BotScenario, "position">>,
): BotScenario {
  return {
    ...spec,
    run(weights, registry, makeBot) {
      const position = spec.position(registry);
      if (!("game" in position)) return position;
      const action = makeBot(position.player, registry, weights).act(
        viewOf(position.game, position.player),
      );
      return position.judge(action);
    },
  };
}

const SCENARIOS: readonly BotScenario[] = [
  asked({
    name: "plays a land",
    rule: "A land drop costs a card and must still be worth making, or the bot never develops.",
    position(registry) {
      // The founding regression: under the naive feature set a land drop is one
      // fewer card in hand and nothing else, so it scores negative and the bot
      // passes every turn for the whole game. Measured, before any of this
      // existed: 0 wins, 20 losses, 215 consecutive passes, dead on an empty
      // board at turn 20 holding seven cards.
      const game = mainPhase((g) => {
        g.debugSpawn("Forest", A, "hand");
      }, registry);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land",
          detail: `played ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "plays a land past the land cap",
    rule: "Lands beyond `landCap` are worth less, never negative — a flooded board still develops.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land",
          detail: `on 12 lands, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "removal takes the biggest threat",
    rule: "Given one removal spell and two targets, the bigger creature is the one that dies.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge(action) {
          if (action.type !== "cast-spell") {
            return { passed: false, detail: `did not cast removal: ${describeAction(action)}` };
          }
          const hit = firstTarget(action);
          return {
            passed: hit === big,
            detail: hit === small ? "killed the 2/2 and left the 6/4" : `targeted ${String(hit)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "does not tap mana for nothing",
    rule: "With nothing to cast, floating mana gains nothing and strands the source.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "activate-ability",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "recasts a taxed commander",
    rule: "Commander tax makes the next cast dearer; it doesn't make casting wrong.",
    position(registry) {
      // The other trap a fitted vector walks into. A commander that has been
      // cast four times is a commander that has *died* four times, so a high
      // tax is strongly associated with losing — and `commanderTax` is a
      // subtracted term, so the regression drives it up until the bot would
      // rather leave its commander in the command zone forever.
      const game = Game.create({
        seed: 3,
        registry,
        decks: [
          {
            player: A,
            cards: Array<string>(40).fill("Forest"),
            commanders: ["Azusa, Lost but Seeking"],
          },
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
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell",
          detail: `at {4} of tax with 8 lands, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
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
    name: "swings walls for lethal under Felothar",
    rule: "Under Felothar, combat damage is toughness: three 0-power walls are 13 damage.",
    run(weights, registry, makeBot) {
      // Felothar the Steadfast's creatures assign combat damage equal to their
      // toughness and attack despite defender, so a board of 0-power walls is
      // a real attack — read as power, it's nothing at all.
      const game = mainPhase((g) => {
        g.debugSpawn("Felothar the Steadfast", A, "battlefield", { summoningSick: false });
        for (let i = 0; i < 2; i += 1) {
          g.debugSpawn("Wall of Omens", A, "battlefield", { summoningSick: false });
        }
        g.state.players[B].life = 13;
      }, registry);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 3,
        detail: `attacked with ${attackers.length} of 3`,
      };
    },
  },
  {
    name: "splits its attack to kill two opponents",
    rule: "Lethal for two is spent so both die: 3+2 and 3+2, not 3+3 and a short 2+2.",
    run(weights, registry, makeBot) {
      // The kill planner took the biggest attackers until one opponent was
      // dead, leaving too little for the other — the user saw a bot send
      // everything at one opponent with the damage to kill both.
      const game = table(registry, [A, B, C], A);
      for (const name of ["Hill Giant", "Hill Giant", "Grizzly Bears", "Grizzly Bears"]) {
        onBoard(game, name, A);
      }
      game.state.players[B].life = 5;
      game.state.players[C].life = 5;
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      const at = (p: PlayerId): number =>
        attackers
          .filter((d) => d.defender === p)
          .reduce((sum, d) => sum + (game.state.objects[d.attacker]?.cardName === "Hill Giant" ? 3 : 2), 0);
      return {
        passed: at(B) >= 5 && at(C) >= 5,
        detail: `${at(B)} at bob, ${at(C)} at carol`,
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
  asked({
    name: "does not pacify its own creature",
    rule: "An Aura that stops a creature attacking is worth nothing on your own creature.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "cast-spell" || firstTarget(action) !== wurm,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "pays life for cards while it can spare it",
    rule: "At 40 life, two life is worth less than a card.",
    position(registry) {
      // Read the Bones is two cards for itself and two life — one card up.
      // With every point of life worth half a card whatever the total, that
      // scored exactly zero — and ties go to passing, so v2 held it (and Sign
      // in Blood) forever: it was the card v2 most often ended a turn holding,
      // after Clan Defiance and Vandalblast, in 24 four-player games.
      // `lifeDanger` is what lets a point of life be cheap at 40 and dear at
      // 5; the twin scenario below is the other half.
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 3; i += 1) g.debugSpawn("Swamp", A, "battlefield");
        g.debugSpawn("Read the Bones", A, "hand");
        g.state.players[A].life = 40;
      }, registry);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "keeps its life when it is running out",
    rule: "At 5 life, two life is worth more than a card.",
    position(registry) {
      const game = mainPhase((g) => {
        g.state.zones.perPlayer[A].hand = [];
        for (let i = 0; i < 3; i += 1) g.debugSpawn("Swamp", A, "battlefield");
        g.debugSpawn("Read the Bones", A, "hand");
        g.state.players[A].life = 5;
      }, registry);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "cast-spell",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "removal finds the threat on a wide four-player board",
    rule: "The creature worth killing is found however many older ones are listed before it.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === wurm,
            detail:
              action.type !== "cast-spell"
                ? `did not cast removal: ${describeAction(action)}`
                : `killed ${cardOf(game, hit)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "aims Drakuseth's trigger at the opponents",
    rule: "Damage from our own attack trigger goes at the table, never at our side.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge(action) {
          const targets = action.type === "choose-targets" ? action.targets : [];
          const ours = targets.filter((t) => t !== null && sideOf(game, t) === A);
          return {
            passed: action.type === "choose-targets" && targets.length > 0 && ours.length === 0,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "puts its counter on its own creature on a wide board",
    rule: "A +1/+1 counter belongs on our creature, however many of theirs are listed first.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge(action) {
          const targets = action.type === "activate-ability" ? (action.targets ?? []) : [];
          return {
            passed:
              action.type === "activate-ability" &&
              action.source === ajani &&
              targets.every((t) => t === null || sideOf(game, t) === A),
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "does not counter its own spell",
    rule: "Absorb's three life is no reason to counter our own card draw.",
    position(registry) {
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
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "cast-spell",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  // --- development ---------------------------------------------------------
  //
  // Each of these is right because a card deployed beats a card held, and each
  // is a counterweight: `bot:fit-scenarios` would otherwise fix a scenario
  // about holding cards (a Counterspell, a bomb it shouldn't discard) by
  // making every card in hand dearer, and stop the bot casting Sol Ring.
  ...(
    [
      ["casts Sol Ring on turn one", "Sol Ring", "Forest", 1],
      ["casts a mana rock", "Arcane Signet", "Forest", 3],
      ["casts a two-drop on turn two", "Grizzly Bears", "Forest", 2],
      ["casts ramp", "Cultivate", "Forest", 3],
      ["casts card draw with nothing better to do", "Divination", "Island", 3],
      ["casts a draw engine", "Phyrexian Arena", "Swamp", 3],
      ["casts a six-drop with six lands", "Craw Wurm", "Forest", 6],
    ] as const
  ).map(([name, card, land, count]) =>
    asked({
      name,
      rule: "A card on the battlefield is worth more than the same card held.",
      position(registry) {
        const game = table(registry, [A, B], A);
        lands(game, land, A, count);
        game.debugSpawn(card, A, "hand");
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: action.type === "cast-spell",
            detail: `with ${card} and ${count} ${land}, chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),

  // --- answers -------------------------------------------------------------
  asked({
    name: "counters a big threat",
    rule: "A Counterspell exists for the six-drop.",
    position(registry) {
      const game = table(registry, [A, B, C, D], B);
      for (const player of [A, B, C, D]) {
        lands(game, player === A ? "Island" : "Forest", player, 6);
      }
      game.debugSpawn("Counterspell", A, "hand");
      castAndPassTo(game, B, game.debugSpawn("Craw Wurm", B, "hand"), A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell",
          detail: `with bob's Craw Wurm on the stack, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "saves Counterspell for a threat",
    rule: "A Counterspell is wasted on a mana rock when three opponents have bombs to come.",
    position(registry) {
      // v2 countered bob's Arcane Signet: the Signet is worth `otherPermanents`
      // + `permanentManaValue` to him, more than the card it cost us, while
      // a card in hand was worth `hand` whatever it could answer later.
      // `answers` is that reserve.
      const game = table(registry, [A, B, C, D], B);
      for (const player of [A, B, C, D]) {
        lands(game, player === A ? "Island" : "Forest", player, 4);
      }
      game.debugSpawn("Counterspell", A, "hand");
      castAndPassTo(game, B, game.debugSpawn("Arcane Signet", B, "hand"), A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "cast-spell",
          detail: `with bob's Arcane Signet on the stack, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["counters a draw engine", "Rhystic Study", "Island", true],
      ["lets a cantrip through", "Divination", "Island", false],
    ] as const
  ).map(([name, card, land, counter]) =>
    asked({
      name,
      rule: counter
        ? "A draw engine is worth a Counterspell's reserve: it keeps drawing."
        : "Two cards once aren't worth the Counterspell's reserve.",
      position(registry) {
        const game = table(registry, [A, B, C, D], B);
        for (const player of [A, B, C, D]) {
          lands(game, player === A || player === B ? land : "Forest", player, 4);
        }
        game.debugSpawn("Counterspell", A, "hand");
        castAndPassTo(game, B, game.debugSpawn(card, B, "hand"), A);
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (action.type === "cast-spell") === counter,
            detail: `with bob's ${card} on the stack, chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "sacrifices its least creature to an edict",
    rule: "An edict takes the creature we'd miss least.",
    position(registry) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Craw Wurm", A);
      const bears = onBoard(game, "Grizzly Bears", A);
      game.debugApplyEffect(
        B,
        { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
        [],
      );
      game.advanceUntil((s) => s.awaiting !== null);
      if (game.state.awaiting?.kind !== "sacrifice") {
        return { passed: false, detail: "the edict never asked" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed:
            action.type === "sacrifice" &&
            action.permanents.length === 1 &&
            action.permanents[0] === bears,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["wraths when far behind", ["Grizzly Bears"], ["Craw Wurm", "Craw Wurm", "Craw Wurm"], true],
      ["keeps its own winning board", ["Craw Wurm", "Craw Wurm", "Craw Wurm"], ["Grizzly Bears"], false],
    ] as const
  ).map(([name, mine, theirs, wrath]) =>
    asked({
      name,
      rule: "A wrath is for the board you're losing, not the one you're winning.",
      position(registry) {
        const game = table(registry, [A, B], A);
        lands(game, "Plains", A, 4);
        for (const creature of mine) onBoard(game, creature, A);
        for (const creature of theirs) onBoard(game, creature, B);
        game.debugSpawn("Wrath of God", A, "hand");
        // Asked after combat: before it, a wrath that would take our own
        // attackers waits ("saves the wrath until after combat").
        const reached = toSecondMain(game);
        if (reached !== null) return reached;
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (action.type === "cast-spell") === wrath,
            detail: `chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "saves the wrath until after combat",
    rule: "A wipe that takes our own attackers waits for the second main phase.",
    position(registry) {
      // Cast first, the Wurm's attack is lost with it; cast after, Bob takes
      // six and the wipe does the same. v2's rollouts never cast the held
      // wrath later in the turn, so the search alone cast it now.
      const game = table(registry, [A, B], A);
      lands(game, "Plains", A, 4);
      onBoard(game, "Craw Wurm", A);
      for (let i = 0; i < 3; i += 1) onBoard(game, "Craw Wurm", B, true);
      const wrath = game.debugSpawn("Wrath of God", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cast-spell" && action.card === wrath),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["bolts a creature before a healthy face", 40, "creature"],
      ["bolts the face for lethal", 3, "face"],
    ] as const
  ).map(([name, life, aim]) =>
    asked({
      name,
      rule: "Burn kills a creature, until the face is lethal.",
      position(registry) {
        const game = table(registry, [A, B], A);
        onBoard(game, "Mountain", A);
        const bears = onBoard(game, "Grizzly Bears", B);
        game.state.players[B].life = life;
        game.debugSpawn("Lightning Bolt", A, "hand");
        return {
          game,
          player: A,
          judge(action) {
            const target = action.type === "cast-spell" ? action.targets?.[0] : undefined;
            const right =
              aim === "creature"
                ? target?.kind === "object" && target.object === bears
                : target?.kind === "player" && target.player === B;
            return {
              passed: action.type === "cast-spell" && right,
              detail: `chose ${describeAction(action)}`,
            };
          },
        };
      },
    }),
  ),
  asked({
    name: "pumps its blocked attacker",
    rule: "A combat trick wins the fight it's in.",
    position(registry) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Forest", A);
      const bears = onBoard(game, "Grizzly Bears", A);
      const courser = onBoard(game, "Centaur Courser", B);
      game.debugSpawn("Giant Growth", A, "hand");
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      game.dispatch({
        type: "declare-attackers",
        player: A,
        attackers: [{ attacker: bears, defender: B }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "blockers" && s.awaiting.player === B);
      game.dispatch({
        type: "declare-blockers",
        player: B,
        blocks: [{ blocker: courser, attacker: bears }],
      });
      game.advanceUntil((s) => s.priority.holder === A);
      if (game.state.turn.step !== "declare-blockers") {
        return { passed: false, detail: `reached ${game.state.turn.step}, not the blocks` };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === bears,
          detail: `with its 2/2 blocked by a 3/3, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "holds Beast Within with only lands to hit",
    rule: "Destroying a land for a 3/3 Beast gives the Beast away.",
    position(registry) {
      const game = table(registry, [A, B], A);
      for (const player of [A, B]) lands(game, "Forest", player, 10);
      game.debugSpawn("Beast Within", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type !== "cast-spell",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "mills an opponent, not itself",
    rule: "With nothing that wants a full graveyard, a mill trigger goes at an opponent.",
    position(registry) {
      // The counterweight to `graveyard` as a hidden discount: every spell cast
      // lands in its caster's graveyard, so a fit that wants spells cast more
      // readily can get it by pricing graveyard cards up — and then five
      // cards milled into our own graveyard look like a gift.
      const game = table(registry, [A, B], A);
      game.debugSpawn("Geralf's Mindcrusher", A, "battlefield", { announceEntry: true });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
      if (game.state.awaiting?.kind !== "choose-targets") {
        return { passed: false, detail: "the enters trigger never asked for a target" };
      }
      return {
        game,
        player: A,
        judge(action) {
          const target = action.type === "choose-targets" ? action.targets[0] : undefined;
          return {
            passed: target?.kind === "player" && target.player === B,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  ...(
    [
      ["scries a flood land to the bottom", 8, 0, true],
      ["keeps a land on top when short of lands", 2, 0, false],
      ["counts the lands in hand before keeping another", 3, 4, true],
    ] as const
  ).map(([name, out, inHand, bottom]) =>
    asked({
      name,
      rule: "A scry sends away the land a flooded board doesn't need, and keeps one it does.",
      position(registry) {
        // A scry changes the next draw, which a rollout to the end of the turn
        // rarely reaches, so v2 tied every answer and kept everything —
        // v1's old answer. `scry-pick.ts` makes the call.
        const game = table(registry, [A, B], A);
        lands(game, "Forest", A, out);
        for (let i = 0; i < inHand; i += 1) game.debugSpawn("Forest", A, "hand");
        const top = game.debugSpawn("Forest", A, "library");
        const temple = game.debugSpawn("Temple of Malady", A, "hand");
        game.dispatch({ type: "play-land", player: A, card: temple });
        game.advanceUntil((s) => s.awaiting?.kind === "scry" || s.result.over);
        if (game.state.awaiting?.kind !== "scry") {
          return { passed: false, detail: "the Temple never asked to scry" };
        }
        return {
          game,
          player: A,
          judge(action) {
            const away = action.type === "scry" ? action.away : [];
            return {
              passed: away.includes(top) === bottom,
              detail: away.includes(top) ? "bottomed the Forest" : "kept the Forest",
            };
          },
        };
      },
    }),
  ),
  asked({
    name: "moves Lightning Greaves to the creature just cast",
    rule: "Equipment goes where it does most: Greaves gives the new Craw Wurm haste.",
    position(registry) {
      const game = table(registry, [A, B], A);
      const bears = onBoard(game, "Grizzly Bears", A);
      const greaves = onBoard(game, "Lightning Greaves", A);
      game.state.objects[greaves].attachedTo = bears;
      const wurm = game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: true });
      return {
        game,
        player: A,
        judge(action) {
          const target = action.type === "activate-ability" ? action.targets?.[0] : undefined;
          return {
            passed: action.type === "activate-ability" && action.source === greaves &&
              target?.kind === "object" && target.object === wurm,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "equips Blade of Selves at a four-player table",
    rule: "Myriad copies swing at every other opponent: worth the equip at four players.",
    position(registry) {
      // Myriad's "you may create a token copy" read as worth nothing, so the
      // rollout declined every copy and the equip looked like a wasted {4}.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Mountain", A, 5);
      onBoard(game, "Craw Wurm", A);
      const blade = onBoard(game, "Blade of Selves", A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === blade,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["cracks Sakura-Tribe Elder at the end of the turn before its own", D, true],
      ["keeps Sakura-Tribe Elder as a blocker earlier in the round", B, false],
    ] as const
  ).map(([name, active, crack]) =>
    asked({
      name,
      rule: "A creature that fetches a land by sacrificing itself does it at the end of the turn before ours.",
      position(registry) {
        // From a live capture ("bob, turn 11 end: not Pass"): two lands on turn
        // 11, and the search kept the 0/2 over the land every window. At the
        // end of the turn before ours its body has blocked all it can this
        // round, and the land untaps for our turn; earlier, it still blocks.
        const game = table(registry, [A, B, C, D], active);
        lands(game, "Forest", A, 2);
        const elder = onBoard(game, "Sakura-Tribe Elder", A);
        game.advanceUntil(
          (s) =>
            (s.turn.step === "end" && s.priority.holder === A && s.zones.shared.stack.length === 0) ||
            s.result.over,
        );
        if (game.state.turn.step !== "end" || game.state.priority.holder !== A) {
          return { passed: false, detail: "never reached the end step with priority" };
        }
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (action.type === "activate-ability" && action.source === elder) === crack,
            detail: `chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "fetches the colour it can't make yet",
    rule: "A land search takes a land of a missing colour over another of one it has.",
    position(registry) {
      // A blue-green deck with only Forests out: Rampant Growth's basic land
      // should be the Island. Both bots took the first land offered, and the
      // evaluation counts lands, not their colours, so v2's search tied.
      const game = table(registry, [A, B], A);
      game.state.players[A].commanderIdentity = ["U", "G"];
      lands(game, "Forest", A, 3);
      const library = game.state.zones.perPlayer[A].library;
      const island = game.debugSpawn("Island", A, "library");
      // To the bottom: library order is the order a search offers cards in.
      library.splice(library.indexOf(island), 1);
      library.push(island);
      const growth = game.debugSpawn("Rampant Growth", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: growth, targets: [] });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.result.over);
      if (game.state.awaiting?.kind !== "choose-from-zone") {
        return { passed: false, detail: "Rampant Growth never asked for a land" };
      }
      return {
        game,
        player: A,
        judge(action) {
          const chosen = action.type === "choose-from-zone" ? action.chosen : [];
          return {
            passed: chosen.length === 1 && chosen[0] === island,
            detail: `took ${chosen.map((id) => cardOf(game, id)).join(", ") || "nothing"}`,
          };
        },
      };
    },
  }),
  asked({
    name: "holds Transcendent Dragon with nothing to counter",
    rule: "A creature that counters a spell as it enters waits for an opponent's spell.",
    position(registry) {
      // Cast into an empty stack its trigger has no target and is removed
      // (rule 603.3d): a six-mana 4/3 flyer, where held it's a Counterspell
      // with a body. The body alone outscores the card in hand, so v2 cast it.
      const game = table(registry, [A, B], A);
      lands(game, "Island", A, 6);
      const dragon = game.debugSpawn("Transcendent Dragon", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cast-spell" && action.card === dragon),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "flashes in Transcendent Dragon to counter an opponent's spell",
    rule: "The held Dragon comes down in answer to a spell worth countering.",
    position(registry) {
      // The other half of holding it: an opponent's Craw Wurm on the stack is
      // what the Dragon was kept for.
      const game = table(registry, [A, B], B);
      lands(game, "Island", A, 6);
      lands(game, "Forest", B, 6);
      const dragon = game.debugSpawn("Transcendent Dragon", A, "hand");
      castAndPassTo(game, B, game.debugSpawn("Craw Wurm", B, "hand"), A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === dragon,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "Teval mills itself, not an opponent",
    rule: "A self-mill commander's deck aims a mill at its own library (deck-bias.ts).",
    position(registry) {
      // The mirror of the scenario above, and the first deck bias: Sultai
      // Arisen wants its own graveyard full. Without the bias, Hedron Crab's
      // landfall trigger goes at an opponent like anyone else's.
      const game = landfallMill(registry, 3);
      if (!(game instanceof Game)) return game;
      return {
        game,
        player: A,
        judge(action) {
          const target = action.type === "choose-targets" ? action.targets[0] : undefined;
          return {
            passed: target?.kind === "player" && target.player === A,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "Teval stops milling itself near an empty library",
    rule: "A self-mill bias never mills its own deck out: at 12 cards, the Crab hits an opponent.",
    position(registry) {
      // The bias's `libraryDanger`: the polarity alone says "mill yourself"
      // whatever is left, and v1 does; v2's own-feature weights price the
      // last fifteen cards of the library.
      const game = landfallMill(registry, 3, 12);
      if (!(game instanceof Game)) return game;
      return {
        game,
        player: A,
        judge(action) {
          const target = action.type === "choose-targets" ? action.targets[0] : undefined;
          return {
            passed: target?.kind === "player" && target.player !== A,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "removal takes the leader's threat first",
    rule: "Two equal threats: the one on the leading board dies.",
    position(registry) {
      // The counterweight to "kills a trailing player's threat" below: caring
      // more about the players behind must not stop the bot pressing the one
      // ahead.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Swamp", A, 3);
      lands(game, "Forest", B, 8);
      onBoard(game, "Grizzly Bears", B);
      const leaders = onBoard(game, "Craw Wurm", B);
      lands(game, "Forest", C, 3);
      onBoard(game, "Craw Wurm", C);
      lands(game, "Forest", D, 3);
      game.debugSpawn("Murder", A, "hand");
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === leaders,
            detail: `killed ${cardOf(game, hit)}`,
          };
        },
      };
    },
  }),

  // --- tuned to (step 8): training scenarios the weights now get right ---
  asked({
    name: "kills the commander one hit from lethal commander damage",
    rule: "A commander that has dealt 18 of 21 is the threat, whatever else is bigger.",
    position(registry) {
      // At `commanderOnBoard: 0` v2 killed the bigger Craw Wurm: nothing in the
      // evaluation looks at what the next attack would do, and
      // `commanderDamage` counts damage already taken, which killing the
      // commander doesn't undo. Pricing a commander on the battlefield above
      // its body is the lever `bot:fit-scenarios` found.
      const game = table(registry, [A, B], A);
      lands(game, "Swamp", A, 3);
      const commander = onBoard(game, "Anafenza, the Foremost", B);
      game.state.objects[commander].isCommander = true;
      onBoard(game, "Craw Wurm", B);
      game.state.players[A].commanderDamageTaken = { [commander]: 18 };
      game.debugSpawn("Murder", A, "hand");
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === commander,
            detail: `killed ${cardOf(game, hit)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "discards its extra land, not its bomb",
    rule: "With ten lands out, the land in hand is the card to lose.",
    position(registry) {
      // At `handManaValue: 0` every choice scored the same — `hand` prices a
      // Forest in hand like a Craw Wurm — and the tie went to v1's answer, the
      // front of the hand. A twentieth of a point per mana value breaks it.
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 10);
      game.debugSpawn("Craw Wurm", A, "hand");
      game.debugSpawn("Grizzly Bears", A, "hand");
      const forest = game.debugSpawn("Forest", A, "hand");
      game.debugApplyEffect(B, { kind: "discard", target: 0, amount: 1 }, [
        { kind: "player", player: A },
      ]);
      if (game.state.awaiting?.kind !== "discard") {
        return { passed: false, detail: "the discard never asked" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed:
            action.type === "discard" && action.cards.length === 1 && action.cards[0] === forest,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "kills a trailing player's threat when the leader has none",
    rule: "The only creature on the table is worth a removal spell, whoever controls it.",
    position(registry) {
      // Bob leads on lands and cards, carol has the table's only creature. A
      // trailing opponent's score is averaged with the other trailing one's
      // and counted at `otherOpponents`; at 0.25 carol's Wurm was worth an
      // eighth of bob's, and v2 held its Murder. At 0.5 it kills the Wurm,
      // and "removal takes the leader's threat first" still holds. See
      // BACKLOG, "Removal only for the leader".
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Swamp", A, 3);
      lands(game, "Forest", B, 9);
      for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", B, "hand");
      lands(game, "Forest", C, 3);
      const wurm = onBoard(game, "Craw Wurm", C);
      lands(game, "Forest", D, 3);
      game.debugSpawn("Murder", A, "hand");
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === wurm,
            detail:
              action.type === "cast-spell"
                ? `killed ${cardOf(game, hit)}`
                : `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),

  asked({
    name: "kills the creature attacking it, not the leader's",
    rule: "A trailing player's creature swinging at us is the threat, over the leader's twin at home.",
    position(registry) {
      // BACKLOG, "Removal only for the leader": the evaluation weighed a
      // player's board by where they stand — the leader at `opponent`, the
      // rest averaged at `otherOpponents` — and nothing in it asked whose
      // creatures are pointed at us, so v2 killed bob's Wurm and took six.
      // Carol trails and attacks alice with a Craw Wurm; bob leads with the
      // same Wurm at home. Fixed by `threat` (1.0), from who attacked whom.
      const game = table(registry, [A, B, C, D], C);
      lands(game, "Swamp", A, 3);
      lands(game, "Forest", B, 9);
      for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", B, "hand");
      onBoard(game, "Craw Wurm", B);
      lands(game, "Forest", C, 3);
      const attacker = onBoard(game, "Craw Wurm", C);
      lands(game, "Forest", D, 3);
      game.debugSpawn("Murder", A, "hand");
      game.state.players[A].life = 20;
      game.advanceUntil((s) => s.awaiting?.kind === "attackers");
      game.dispatch({ type: "declare-attackers", player: C, attackers: [{ attacker, defender: A }] });
      game.advanceUntil((s) => s.priority.holder === A);
      if (game.state.objects[attacker].attacking !== A) {
        return { passed: false, detail: "carol's Wurm never attacked" };
      }
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === attacker,
            detail:
              action.type === "cast-spell"
                ? `killed ${cardOf(game, hit)}`
                : `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),

  asked({
    name: "puts Vow of Duty on the creature attacking it",
    rule: "A creature that can't attack us is no threat to us, however big.",
    position(registry) {
      // `threat` counted every creature able to attack, so Vow of Duty's
      // +2/+2 read as more threat and v2 stopped casting it on an
      // opponent's creature. It now asks the attack rules who the creature
      // could attack next turn (`playersAttackableNextTurn`). Carol's Craw
      // Wurm attacked alice last round; bob's twin never has.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Plains", A, 3);
      onBoard(game, "Craw Wurm", B);
      const attacker = onBoard(game, "Craw Wurm", C);
      game.debugSpawn("Vow of Duty", A, "hand");
      game.state.players[A].life = 20;
      game.state.players[A].lastAttackedBy = { [C]: game.state.turn.number - 1 };
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === attacker,
            detail:
              action.type === "cast-spell"
                ? `enchanted ${cardOf(game, hit)}`
                : `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),

  asked({
    name: "spends a Treasure on Sol Ring",
    rule: "A one-shot Treasure for a Sol Ring is a trade up: two mana every turn after.",
    position(registry) {
      // From the behaviour sweep (seed 20): lands tapped, a Treasure the only
      // mana, and v2 held Sol Ring three turns running with Rorix Bladewing
      // stuck in hand. A Treasure counted as a full permanent, like the Ring.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 4);
      for (const id of game.state.zones.shared.battlefield) {
        if (game.state.objects[id]?.controller === A) game.state.objects[id].tapped = true;
      }
      // A token, as one made in play is: `debugSpawn` makes a card.
      game.state.objects[onBoard(game, "Treasure Token", A)].isToken = true;
      const ring = game.debugSpawn("Sol Ring", A, "hand");
      game.debugSpawn("Rorix Bladewing", A, "hand");
      const reached = toSecondMain(game);
      if (reached !== null) return reached;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === ring,
          detail: `chose ${describeAction(action)}`,
        }),

  // --- training: right answers the shipped weights get wrong ----------------
      };
    },
  }),
  asked({
    name: "Skullclamps a 1/1 token for two cards",
    rule: "Equipping Skullclamp to a 1/1 token kills it for two cards: a card up.",
    kind: "training",
    position(registry) {
      // Two cards (+4) against the token's body and its one point of attack:
      // every creature counts `creatures` 2.5 whatever its size, so the body
      // scores about as much as the cards, and the attack tips it to passing.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 2);
      onBoard(game, "Soldier Token", A);
      const clamp = onBoard(game, "Skullclamp", A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === clamp,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
];

/** The gate: every vector that ships passes all of these. */
export const BOT_SCENARIOS: readonly BotScenario[] = SCENARIOS.filter(
  (scenario) => (scenario.kind ?? "gate") === "gate",
);

/** Right answers the shipped weights may still get wrong — see "Two kinds". */
export const TRAINING_SCENARIOS: readonly BotScenario[] = SCENARIOS.filter(
  (scenario) => scenario.kind === "training",
);

export interface ScenarioReport {
  readonly name: string;
  readonly rule: string;
  readonly kind: "gate" | "training";
  readonly passed: boolean;
  readonly detail: string;
}

/** Every scenario against one weight vector — the gate unless told otherwise.
 * A vector that fails a gate scenario doesn't ship, whatever it benched. */
export function runScenarios(
  weights: EvalWeights = DEFAULT_WEIGHTS,
  registry: CardRegistry = createDefaultRegistry(),
  makeBot: BotFactory = evalBotFactory,
  scenarios: readonly BotScenario[] = BOT_SCENARIOS,
): ScenarioReport[] {
  return scenarios.map((scenario) => {
    const kind = scenario.kind ?? "gate";
    try {
      const { passed, detail } = scenario.run(weights, registry, makeBot);
      return { name: scenario.name, rule: scenario.rule, kind, passed, detail };
    } catch (error) {
      return {
        name: scenario.name,
        rule: scenario.rule,
        kind,
        passed: false,
        detail: `threw: ${String((error as Error)?.message ?? error)}`,
      };
    }
  });
}
