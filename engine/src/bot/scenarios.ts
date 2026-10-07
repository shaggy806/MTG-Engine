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
 * Move the clock past the opening rounds. A scenario's board stands for the
 * middle of a game (nine lands, a Craw Wurm) though it's built on turn 1, and
 * the bot reads the round: removal is held in the first two (`earlyRemoval`),
 * and mana rocks and creatures count extra until the sixth (`earlyMana`).
 * Every turn number the bot reads is relative, so only that changes.
 */
function midGame(game: Game): void {
  game.state.turn.number += MID_GAME_ROUNDS * game.state.turnOrder.length;
}

const MID_GAME_ROUNDS = 8;

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
  midGame(game);
  setup(game);
  return game;
}

/** A four-player game paused at Alice's precombat main, her hand empty. */
function fourPlayerMain(registry: CardRegistry): Game {
  const game = Game.create({ seed: 3, registry, decks: [A, B, C, D].map(forestDeck) });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  midGame(game);
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
  midGame(game);
  for (const player of players) game.state.zones.perPlayer[player].hand = [];
  return game;
}

/** A permanent that has been there since last turn. */
const onBoard = (game: Game, name: string, player: PlayerId, tapped = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, tapped });

const lands = (game: Game, name: string, player: PlayerId, count: number): void => {
  for (let i = 0; i < count; i += 1) onBoard(game, name, player);
};

/** `count` cards in each of `players`' hands — what's still to come, which
 * a counterspell's reserve is scaled by (`answers`, the opponents' average
 * hand over 3). `table` empties every hand. */
const holding = (game: Game, players: readonly PlayerId[], count: number): void => {
  for (const player of players) for (let i = 0; i < count; i += 1) game.debugSpawn("Forest", player, "hand");
};

/** Cast `card` from `player`'s hand, then pass priority round until
 * `responder` holds it with the spell still on the stack. */
function castAndPassTo(
  game: Game,
  player: PlayerId,
  card: ObjectId,
  responder: PlayerId,
  targets: readonly TargetRef[] = [],
): void {
  game.dispatch({ type: "cast-spell", player, card, targets });
  game.advanceUntil((s) => s.priority.holder === responder);
}

/** Bob, the active player, attacks Alice with `attackers`; paused at Alice's
 * blockers decision, or a failure if it never came. */
function bobAttacks(game: Game, attackers: readonly ObjectId[]): ScenarioResult | null {
  game.advanceUntil(
    (s) => (s.awaiting?.kind === "attackers" && s.awaiting.player === B) || s.result.over,
  );
  if (game.state.awaiting?.kind !== "attackers") {
    return { passed: false, detail: "bob was never asked to attack" };
  }
  game.dispatch({
    type: "declare-attackers",
    player: B,
    attackers: attackers.map((attacker) => ({ attacker, defender: A })),
  });
  const askedToBlock = (s: Game["state"]): boolean =>
    s.awaiting?.kind === "blockers" && s.awaiting.player === A;
  game.advanceUntil((s) => askedToBlock(s) || s.result.over);
  return askedToBlock(game.state)
    ? null
    : { passed: false, detail: "alice was never asked to block" };
}

/** The blocks in a `declare-blockers` answer, or null for any other action. */
function blocksOf(action: Action): readonly { blocker: ObjectId; attacker: ObjectId }[] | null {
  return action.type === "declare-blockers" ? action.blocks : null;
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
      holding(game, [B, C, D], 3);
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
      holding(game, [B, C, D], 3);
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
        holding(game, [B, C, D], 3);
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
  ...(
    [
      ["counters a Grizzly Bears when every hand is empty", 0, true],
      ["lets a Grizzly Bears by while every opponent holds a full grip", 7, false],
    ] as const
  ).map(([name, cards, counter]) =>
    asked({
      name,
      rule: counter
        ? "With nothing left in any opponent's hand, the Counterspell has nothing better to wait for."
        : "With seven cards in every opponent's hand, the Counterspell waits for more than a 2/2.",
      position(registry) {
        // BACKLOG, "Counterspells, beyond answers": the reserve was a
        // constant, so v2 held a Counterspell as firmly into empty hands as
        // into full ones, and countered a Grizzly Bears (4.6) at either. It's
        // scaled by the opponents' average hand now (`answerHandScale`).
        const game = table(registry, [A, B, C, D], B);
        for (const player of [A, B, C, D]) {
          lands(game, player === A ? "Island" : "Forest", player, 4);
        }
        holding(game, [B, C, D], cards);
        game.debugSpawn("Counterspell", A, "hand");
        castAndPassTo(game, B, game.debugSpawn("Grizzly Bears", B, "hand"), A);
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (action.type === "cast-spell") === counter,
            detail: `with bob's Grizzly Bears on the stack, chose ${describeAction(action)}`,
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
    name: "removal takes the token engine",
    rule: "Hero of Bladehold makes two attackers a turn; a vanilla 4/4 is only itself.",
    position(registry) {
      // Priced as a 3/4, the Hero was the smaller threat, and nothing counted
      // the Soldiers it keeps making (the Mardu autopsy: token engines cast
      // far less by v2 than by v1). `tokenEngines` is that rate.
      const game = table(registry, [A, B, C, D], A);
      for (const player of [A, B, C, D]) lands(game, player === A ? "Swamp" : "Plains", player, 4);
      game.debugSpawn("Murder", A, "hand");
      const hero = onBoard(game, "Hero of Bladehold", B);
      onBoard(game, "Rumbling Baloth", B);
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === hero,
            detail: action.type === "cast-spell" ? `killed ${cardOf(game, hit)}` : `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "removal takes the creature that has been drawing cards",
    rule: "A Grizzly Bears that has drawn three cards and dealt six in two rounds is the engine; a vanilla 4/4 is only itself.",
    position(registry) {
      // What its text can't say — it's been wearing a Sword, or paired with a
      // Tandem Lookout: priced by its stats alone the Bears is the smaller
      // threat. `trackRecord` is the evidence (`GameObject.tally`, public),
      // as a rate over the rounds it has been on the battlefield.
      const game = table(registry, [A, B], A);
      lands(game, "Swamp", A, 4);
      game.debugSpawn("Murder", A, "hand");
      onBoard(game, "Rumbling Baloth", B);
      const bears = onBoard(game, "Grizzly Bears", B);
      game.state.objects[bears].enteredBattlefieldOnTurn = game.state.turn.number - 3;
      game.state.objects[bears].tally = {
        lifeTaken: 6,
        cardsDrawn: 3,
        thisTurn: { turn: 0, lifeTaken: 0, cardsDrawn: 0 },
      };
      return {
        game,
        player: A,
        judge(action) {
          const hit = firstTarget(action);
          return {
            passed: action.type === "cast-spell" && hit === bears,
            detail: action.type === "cast-spell" ? `killed ${cardOf(game, hit)}` : `chose ${describeAction(action)}`,
          };
        },
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
        // Something for it to block: our own blockers count only where they'd
        // hold an attack off (`features.ts`'s `deterringBlockers`), and the
        // 0/2 survives a 1/1.
        onBoard(game, "Llanowar Elves", C);
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
  ...(
    [
      ["cracks Bountiful Landscape at the end of the turn before its own", D, true],
      ["holds Bountiful Landscape at another player's end step", B, false],
    ] as const
  ).map(([name, active, crack]) =>
    asked({
      name,
      rule: "A land that taps for mana and fetches a tapped land cracks at the end of the turn before ours, when its mana is gone anyway and the new land untaps.",
      position(registry) {
        // A live capture (2026-10-06, "alice, turn 22 upkeep"): a bot cracked
        // Bountiful Landscape in its own upkeep, so the basic it fetched sat
        // tapped all turn. `isManaLandFetch`.
        const game = table(registry, [A, B, C, D], active);
        lands(game, "Forest", A, 3);
        const landscape = onBoard(game, "Bountiful Landscape", A);
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
            passed: (action.type === "activate-ability" && action.source === landscape) === crack,
            detail: `chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "holds Bountiful Landscape in its own main phase",
    rule: "Cracked on our own turn, a mana land's fetch costs this turn's mana: its own and the fetched land's.",
    position(registry) {
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Forest", A, 3);
      const landscape = onBoard(game, "Bountiful Landscape", A);
      game.state.players[A].landsPlayedThisTurn = 1;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "activate-ability" && action.source === landscape),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "plays a Forest for Birds of Paradise, not a tapped Stomping Ground",
    rule: "The land drop that casts this turn's spell beats one that enters tapped, and a basic beats paying 2 life.",
    position(registry) {
      // Reported from a live game (2026-10-04, no capture): a bot played
      // Stomping Ground and let it enter tapped when a Forest — or the
      // Stomping Ground with 2 life paid — would have cast Birds of Paradise
      // that turn. A Mountain was in hand too. The current bots play the
      // Forest (`castableAfter`, since 95fe54c5 on 2026-10-01), so the site
      // was most likely on an older build; this holds the fix in place.
      // `docs/bot-misplays.md`.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 1;
      const forest = game.debugSpawn("Forest", A, "hand");
      game.debugSpawn("Mountain", A, "hand");
      game.debugSpawn("Stomping Ground", A, "hand");
      game.debugSpawn("Birds of Paradise", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land" && action.card === forest,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "pays 2 life for an untapped Stomping Ground to cast Birds of Paradise",
    rule: "With only a shock land to make this turn's mana, 2 life at 40 is worth a turn-one mana creature.",
    position(registry) {
      // Found recording the Stomping Ground report above: neither bot paid a
      // shock land's life, so a lone Stomping Ground always entered tapped.
      // v1 now pays when the untapped land casts a spell this turn
      // (`payLifeForUntapped`), and v2 takes its answer, since its rollouts
      // pass our seat for the rest of the turn and never see the spell.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 1;
      const ground = game.debugSpawn("Stomping Ground", A, "hand");
      game.debugSpawn("Birds of Paradise", A, "hand");
      game.dispatch({ type: "play-land", player: A, card: ground });
      if (game.state.awaiting?.kind !== "pay-life-for-untapped") {
        return { passed: false, detail: "Stomping Ground never asked to pay 2 life" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "pay-life-for-untapped" && action.pay,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  {
    name: "does not station a Spacecraft past its last threshold",
    kind: "training",
    rule: "Charge counters past a Spacecraft's last station threshold do nothing; the creature tapped for them is a blocker lost.",
    run(weights, registry, makeBot) {
      // Reported from a live game (2026-10-07): "stationing a spaceship
      // beyond its final threshold is almost never worth it." Hearthhull's
      // last band is 8+; at 10 counters, more add nothing. The evaluation
      // counts every charge counter in `counters` (0.5 each, uncapped), so
      // tapping a 6-power Craw Wurm reads as +3 against about 0.5 for keeping
      // it home as a blocker. `docs/bot-misplays.md`.
      const game = table(registry, [A, B], A);
      const hull = onBoard(game, "Hearthhull, the Worldseed", A);
      game.state.objects[hull].counters.charge = 10;
      onBoard(game, "Craw Wurm", A);
      onBoard(game, "Centaur Courser", B);
      const reached = toSecondMain(game);
      if (reached !== null) return reached;
      const action = makeBot(A, registry, weights).act(viewOf(game, A));
      const stations = action.type === "activate-ability" && action.source === hull;
      return { passed: !stations, detail: `chose ${describeAction(action)}` };
    },
  },
  asked({
    name: "plays Stomping Ground over a Mountain to cast Birds of Paradise",
    rule: "With no Forest, an untapped Stomping Ground (2 life paid) is the land that casts a turn-one Birds of Paradise; a Mountain casts nothing.",
    position(registry) {
      // Reported from a live game (2026-10-07, no capture): on turn one alice
      // played a Mountain with Stomping Ground and Birds of Paradise in hand.
      // v1's `castableAfter` reads Stomping Ground as casting nothing — the
      // land stops at its "pay 2 life?" question, which it doesn't look past
      // as it does Valgavoth's Lair's colour — and v2's land search rolls the
      // turn out passing our seat, so Birds is never cast and the shock reads
      // as 2 life for nothing. Fixed: `castableAfter` looks past the shock as
      // paid, and v2 only searches lands that cast the most this turn.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 1;
      game.debugSpawn("Mountain", A, "hand");
      const ground = game.debugSpawn("Stomping Ground", A, "hand");
      for (const name of ["Birds of Paradise", "Arcane Signet", "Old Gnawbone", "Terror of the Peaks", "Frostcliff Siege", "Decanter of Endless Water"]) {
        game.debugSpawn(name, A, "hand");
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land" && action.card === ground,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "lets Stomping Ground enter tapped with nothing to cast",
    rule: "A shock land's 2 life buys nothing when no spell this turn needs the land untapped.",
    position(registry) {
      // The other side of "pays 2 life for an untapped Stomping Ground": with
      // only a Craw Wurm in hand there's nothing to cast this turn.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 1;
      const ground = game.debugSpawn("Stomping Ground", A, "hand");
      game.debugSpawn("Craw Wurm", A, "hand");
      game.dispatch({ type: "play-land", player: A, card: ground });
      if (game.state.awaiting?.kind !== "pay-life-for-untapped") {
        return { passed: false, detail: "Stomping Ground never asked to pay 2 life" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "pay-life-for-untapped" && !action.pay,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "plays its tapped land when the untapped one casts nothing more",
    rule: "When no land drop casts anything more this turn, the land that enters tapped goes down now and the untapped one waits for a turn it matters.",
    position(registry) {
      // Reported from a live game (2026-10-05, no capture): a Temur dragons bot
      // on four lands played a Forest while holding Valgavoth's Lair, with
      // nothing in hand a fifth untapped mana could cast (Heroic Intervention
      // was castable either way). Next turn the Lair enters tapped, and Rorix
      // Bladewing's {R}{R}{R} waits a turn more. v1's `bestLand` ranks by
      // `castableAfter` (a tie here), then by pips no land on board pays —
      // the Lair's "chosen" mana counts for no colour, so the Forest's green
      // wins; nothing weighs "enters tapped". v2's land search plays v1's
      // pick first, and its rollouts pass our seat, so it ties. Worse,
      // `castableAfter` stopped at the Lair's colour choice and saw nothing
      // castable behind it. Now it answers the choice and looks past it, and
      // a land that always enters tapped wins a tie on what's castable.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 17; // alice's fifth turn
      game.state.players[A].commanderIdentity = ["U", "R", "G"];
      for (const land of ["Temple of Abandon", "Forest", "Island", "Frontier Bivouac"]) onBoard(game, land, A);
      game.debugSpawn("Forest", A, "hand");
      const lair = game.debugSpawn("Valgavoth's Lair", A, "hand");
      for (const card of [
        "Broodcaller Scourge",
        "Last March of the Ents",
        "Drakuseth, Maw of Flames",
        "Rorix Bladewing",
        "Heroic Intervention",
      ]) {
        game.debugSpawn(card, A, "hand");
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land" && action.card === lair,
          detail: `chose ${action.type === "play-land" ? cardOf(game, action.card) : describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "sacrifices a tapped land to Harrow",
    rule: "A land sacrificed to a spell's cost goes tapped if one is: its mana is already spent this turn.",
    position(registry) {
      // The user's rule (2026-10-05): "spells that sacrifice lands should
      // always prioritize tapped lands". `cheapestPermanents` ranked lands by
      // value alone, so a tapped Forest and an untapped one were a tie that
      // went to the first listed.
      const game = table(registry, [A, B, C, D], A);
      for (const land of ["Forest", "Forest", "Mountain"]) onBoard(game, land, A);
      const tapped = onBoard(game, "Forest", A, true);
      game.debugSpawn("Harrow", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.sacrifice === tapped,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Explore on turn two with a land to play off it",
    rule: "Explore with a land in hand to follow it is a land down a turn early and a card back — the turn-two play, not a pass.",
    position(registry) {
      // Reported from a live game (2026-10-05, no capture): on its second turn
      // a bot with a Forest and a Mountain out, two Swamps in hand and
      // nothing else castable for two passed with Explore in hand. Explore
      // isn't a cantrip to `isCardFlow` (its additional land drop is no draw
      // or filter), so v2's search decides it, and its rollouts pass our seat
      // for the rest of the turn: the extra land is never played, and two
      // mana for one card back scored no better than passing. An extra land
      // drop now reads as card flow, so Explore is a cantrip, cast when the
      // search would pass.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5; // alice's second turn
      for (const land of ["Forest", "Mountain"]) onBoard(game, land, A);
      game.state.players[A].landsPlayedThisTurn = 1;
      const explore = game.debugSpawn("Explore", A, "hand");
      for (const card of ["Swamp", "Swamp", "Harrow", "Crop Rotation", "Grazing Gladehart", "Lifespring Druid"]) {
        game.debugSpawn(card, A, "hand");
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === explore,
          detail: `chose ${action.type === "cast-spell" ? cardOf(game, action.card) : describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "plays Glacial Fortress tapped on turn one over a Mountain for nothing it would cast",
    rule: "A land letting you cast a spell is of no value if you wouldn't cast the spell with the mana.",
    position(registry) {
      // Reported from a live game (2026-10-05, no capture): on turn one a bot
      // played its untapped land over a Glacial Fortress, which enters tapped
      // with no Plains or Island out. The untapped land made Sticky Fingers
      // castable, but there was nothing of its own to enchant — so nothing
      // it would cast. The user: "A land letting you cast a spell is of no
      // value if you wouldn't cast the spell if you had the mana."
      // `castableAfter` counted every castable spell, and the tie-break on a
      // tapped land skipped check lands, whose tapped-ness is a condition.
      // Now it counts what v1 would cast (`wouldCast`) and reads a check
      // land's condition on the board as it is (`entersTapped`).
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 1;
      onBoard(game, "Grizzly Bears", B);
      game.debugSpawn("Mountain", A, "hand");
      const fortress = game.debugSpawn("Glacial Fortress", A, "hand");
      game.debugSpawn("Sticky Fingers", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "play-land" && action.card === fortress,
          detail: `chose ${action.type === "play-land" ? cardOf(game, action.card) : describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "names a colour its deck plays for Valgavoth's Lair",
    rule: "A land that taps for one chosen colour names a colour the deck's own spells need, never one outside its colour identity.",
    position(registry) {
      // Reported from a live game (2026-10-05, no capture): a Temur bot named
      // white for Valgavoth's Lair. The choice is asked as a
      // "choose-creature-type" over the five colours, whose suggestions are
      // only computed for the creature-type catalog, so every controller
      // answered `suggested[0] ?? options[0]` — white, always. v1 now names
      // a colour with `colorToName` (`land-colors.ts`).
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 17;
      const commander = onBoard(game, "Eshki, Temur's Roar", A);
      game.state.objects[commander].isCommander = true;
      game.state.players[A].commanderIdentity = ["U", "R", "G"];
      for (const land of ["Forest", "Island"]) onBoard(game, land, A);
      game.debugSpawn("Rorix Bladewing", A, "hand");
      game.debugSpawn("Drakuseth, Maw of Flames", A, "hand");
      const lair = game.debugSpawn("Valgavoth's Lair", A, "hand");
      game.dispatch({ type: "play-land", player: A, card: lair });
      if (game.state.awaiting?.kind !== "choose-creature-type") {
        return { passed: false, detail: "Valgavoth's Lair never asked for a colour" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          // Red: the hand's two dragons want {R}{R}{R} and nothing on board makes it.
          passed: action.type === "choose-creature-type" && action.creatureType === "R",
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Jaddi Offshoot before its land drop",
    rule: "A landfall creature castable without the land drop goes first, so the land triggers it.",
    position(registry) {
      // Reported from a live game (2026-10-04, no capture): on turn 2 a bot
      // played a Swamp and then Jaddi Offshoot, when casting the Offshoot off
      // its Forest first would have gained a life from the Swamp's landfall.
      // Both bots played a land before anything else; a landfall permanent
      // castable now goes first since (`isLandfallPermanent`).
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5;
      lands(game, "Forest", A, 1);
      game.debugSpawn("Swamp", A, "hand");
      const offshoot = game.debugSpawn("Jaddi Offshoot", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === offshoot,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "fetches two different basics when every colour is covered",
    rule: "A search for two basic lands takes two colours, not two of one.",
    position(registry) {
      // Captured from a live game (2026-10-04, D8YAV turn 10): Encroaching
      // Dragonstorm found two Forests for a Temur deck with Command Tower out.
      // Every colour already had a source, so nothing ranked above library
      // order (`newColorsFirst` now spreads by sources).
      const game = table(registry, [A, B], A);
      game.state.players[A].commanderIdentity = ["U", "R", "G"];
      onBoard(game, "Forest", A);
      onBoard(game, "Command Tower", A);
      lands(game, "Forest", A, 3);
      const library = game.state.zones.perPlayer[A].library;
      // The search offers the library in order: two Forests first.
      for (const name of ["Mountain", "Island"]) {
        const id = game.debugSpawn(name, A, "library");
        library.splice(library.indexOf(id), 1);
        library.push(id);
      }
      const storm = game.debugSpawn("Encroaching Dragonstorm", A, "battlefield", { announceEntry: true });
      void storm;
      game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.result.over);
      if (game.state.awaiting?.kind !== "choose-from-zone") {
        return { passed: false, detail: "Encroaching Dragonstorm never asked for lands" };
      }
      return {
        game,
        player: A,
        judge(action) {
          const chosen = action.type === "choose-from-zone" ? action.chosen : [];
          const names = chosen.map((id) => cardOf(game, id));
          return {
            passed: chosen.length === 2 && new Set(names).size === 2,
            detail: `took ${names.join(", ") || "nothing"}`,
          };
        },
      };
    },
  }),
  asked({
    name: "keeps its life rather than swap 40 for a 0/40 Tree of Redemption",
    rule: "Toughness past anything on the table that could hit it is worth nothing more.",
    position(registry) {
      // Captured from a live game (2026-10-04, HB5MR turn 18): at 40 life bob
      // swapped his life with Tree of Redemption's 13 toughness — down to 13
      // for a 0/40 wall. Toughness counted without a ceiling outscored the
      // 27 life (`TOUGHNESS_CAP` in `features.ts`).
      const game = table(registry, [A, B, C, D], A);
      for (const player of [A, B, C, D]) game.state.players[player].life = 40;
      const tree = onBoard(game, "Tree of Redemption", A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "activate-ability" && action.source === tree),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "holds Beast Within for the Dragon's controller's turn",
    rule: "Removal that hands its target's controller a token waits for their turn, when the token can't attack.",
    position(registry) {
      // Captured from a live game (2026-10-04, D8YAV turn 15): alice cast
      // Beast Within on dave's Nesting Dragon in her own main phase, so
      // dave's 3/3 Beast was ready for his turn (`holdsCompensationFor`).
      const game = table(registry, [A, B, C, D], A);
      for (const player of [A, B, C, D]) game.state.players[player].life = 40;
      lands(game, "Forest", A, 3);
      lands(game, "Mountain", D, 5);
      const within = game.debugSpawn("Beast Within", A, "hand");
      onBoard(game, "Nesting Dragon", D);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cast-spell" && action.card === within),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
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
    name: "hands Tasigur's controller the weaker card",
    rule: "A card chosen for an opponent is the one least useful to them.",
    position(registry) {
      // Alice activates Tasigur, the Golden Fang, and Bob picks which nonland
      // card in her graveyard she gets back. Both bots ranked the cards as
      // their own pick (graveyard order here), so they handed her the Craw
      // Wurm she can cast next turn rather than the Grizzly Bears.
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 6);
      const tasigur = onBoard(game, "Tasigur, the Golden Fang", A);
      const wurm = game.debugSpawn("Craw Wurm", A, "graveyard");
      const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
      game.dispatch({ type: "activate-ability", player: A, source: tasigur, abilityIndex: 0, targets: [] });
      game.advanceUntil(
        (s) => (s.awaiting?.kind === "choose-from-zone" && s.awaiting.player === B) || s.result.over,
      );
      if (game.state.awaiting?.kind !== "choose-from-zone" || game.state.awaiting.player !== B) {
        return { passed: false, detail: "bob was never asked to choose Alice's card" };
      }
      return {
        game,
        player: B,
        judge(action) {
          const chosen = action.type === "choose-from-zone" ? action.chosen : [];
          return {
            passed: chosen.length === 1 && chosen[0] === bears && !chosen.includes(wurm),
            detail: `handed back ${chosen.map((id) => cardOf(game, id)).join(", ") || "nothing"}`,
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
  // --- blocks ----------------------------------------------------------------
  asked({
    name: "makes a free block",
    rule: "A blocker that kills its attacker and survives blocks it.",
    position(registry) {
      const game = table(registry, [A, B], B);
      const courser = onBoard(game, "Centaur Courser", A);
      const bears = onBoard(game, "Grizzly Bears", B);
      const failed = bobAttacks(game, [bears]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: blocksOf(action)?.some((b) => b.blocker === courser && b.attacker === bears) === true,
          detail: `facing a 2/2 with a 3/3, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "blocks the attacker it can kill",
    rule: "One blocker against a 2/2 and a 6/4, at a healthy life total, eats the 2/2.",
    position(registry) {
      const game = table(registry, [A, B], B);
      const courser = onBoard(game, "Centaur Courser", A);
      const bears = onBoard(game, "Grizzly Bears", B);
      const wurm = onBoard(game, "Craw Wurm", B);
      const failed = bobAttacks(game, [bears, wurm]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge(action) {
          const blocks = blocksOf(action);
          return {
            passed: blocks?.length === 1 && blocks[0].blocker === courser && blocks[0].attacker === bears,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "does not block a deathtouch attacker with its best creature",
    rule: "A 6/4 isn't traded for a 1/1 deathtouch Rat to save one life at 40.",
    position(registry) {
      const game = table(registry, [A, B], B);
      onBoard(game, "Craw Wurm", A);
      const rats = onBoard(game, "Typhoid Rats", B);
      const failed = bobAttacks(game, [rats]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: blocksOf(action)?.length === 0,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "blocks a big attacker with a deathtouch creature",
    rule: "A 1/1 deathtouch Rat trades up for an attacking 6/4.",
    position(registry) {
      const game = table(registry, [A, B], B);
      const rats = onBoard(game, "Typhoid Rats", A);
      const wurm = onBoard(game, "Craw Wurm", B);
      const failed = bobAttacks(game, [wurm]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: blocksOf(action)?.some((b) => b.blocker === rats && b.attacker === wurm) === true,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  asked({
    name: "double-blocks to kill a bigger attacker",
    rule: "Two 3/3s block a 4/4 together: one dies, and so does the 4/4.",
    position(registry) {
      // Blocks were added one at a time, and either 3/3 alone is just a
      // creature lost, so the climb never reached the pair.
      const game = table(registry, [A, B], B);
      onBoard(game, "Centaur Courser", A);
      onBoard(game, "Centaur Courser", A);
      const baloth = onBoard(game, "Rumbling Baloth", B);
      const failed = bobAttacks(game, [baloth]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: blocksOf(action)?.filter((b) => b.attacker === baloth).length === 2,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "flashes in Ambush Viper to block an attacker",
    rule: "A flash deathtouch creature comes down after attacks, in front of the biggest.",
    position(registry) {
      const game = table(registry, [A, B], B);
      lands(game, "Forest", A, 2);
      const viper = game.debugSpawn("Ambush Viper", A, "hand");
      const wurm = onBoard(game, "Craw Wurm", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === B);
      game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: wurm, defender: A }] });
      game.advanceUntil((s) => s.priority.holder === A || s.result.over);
      if (game.state.turn.step !== "declare-attackers") {
        return { passed: false, detail: `reached ${game.state.turn.step}, not the attack` };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === viper,
          detail: `with a 6/4 attacking, chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  // --- planeswalkers ---------------------------------------------------------
  {
    name: "attacks an undefended planeswalker",
    rule: "At a four-player table, a 3/3 kills an unprotected Garruk rather than chip a player at 40.",
    run(weights, registry, makeBot) {
      const game = table(registry, [A, B, C, D], A);
      for (const p of [A, B, C, D]) game.state.players[p].life = 40;
      onBoard(game, "Centaur Courser", A);
      const garruk = onBoard(game, "Garruk Wildspeaker", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 1 && attackers[0].defender === garruk,
        detail: `attacked ${attackers.map((d) => cardOf(game, d.defender as ObjectId)).join(", ") || "nothing"}`,
      };
    },
  },
  {
    name: "takes lethal on the player over their planeswalker",
    rule: "Two 3/3s at a player on 6 win; at Garruk they don't.",
    run(weights, registry, makeBot) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Centaur Courser", A);
      onBoard(game, "Centaur Courser", A);
      onBoard(game, "Garruk Wildspeaker", B);
      game.state.players[B].life = 6;
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 2 && attackers.every((d) => d.defender === B),
        detail: `attacked ${attackers.map((d) => String(d.defender)).join(", ") || "nothing"}`,
      };
    },
  },
  asked({
    name: "bolts a planeswalker",
    rule: "Three damage kills a three-loyalty Garruk; at 40 life the player can wait.",
    position(registry) {
      const game = table(registry, [A, B], A);
      game.state.players[B].life = 40;
      onBoard(game, "Mountain", A);
      const garruk = onBoard(game, "Garruk Wildspeaker", B);
      game.debugSpawn("Lightning Bolt", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === garruk,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "Garruk overruns for lethal",
    rule: "Garruk's -4 on three 2/2s is fifteen trampling damage at a player on 12.",
    position(registry) {
      const game = table(registry, [A, B], A);
      const garruk = onBoard(game, "Garruk Wildspeaker", A);
      game.state.objects[garruk].counters.loyalty = 4;
      for (let i = 0; i < 3; i += 1) onBoard(game, "Grizzly Bears", A);
      game.state.players[B].life = 12;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === garruk && action.abilityIndex === 2,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "Elspeth wipes the big creatures",
    rule: "Facing three 6/4s, Elspeth, Sun's Champion's -3 destroys them.",
    position(registry) {
      const game = table(registry, [A, B], A);
      const elspeth = onBoard(game, "Elspeth, Sun's Champion", A);
      for (let i = 0; i < 3; i += 1) onBoard(game, "Craw Wurm", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === elspeth && action.abilityIndex === 1,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "blocks to protect its planeswalker",
    rule: "A free block on the creature attacking our Garruk.",
    position(registry) {
      const game = table(registry, [A, B], B);
      const garruk = onBoard(game, "Garruk Wildspeaker", A);
      const courser = onBoard(game, "Centaur Courser", A);
      const bears = onBoard(game, "Grizzly Bears", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === B);
      game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: bears, defender: garruk }] });
      game.advanceUntil((s) => (s.awaiting?.kind === "blockers" && s.awaiting.player === A) || s.result.over);
      if (game.state.awaiting?.kind !== "blockers") return { passed: false, detail: "alice was never asked to block" };
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: blocksOf(action)?.some((b) => b.blocker === courser && b.attacker === bears) === true,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  // --- cantrips --------------------------------------------------------------
  ...(
    [
      ["casts Opt at the end of the turn before its own", [A, B], true],
      ["holds Opt earlier in the round", [A, B, C], false],
    ] as const
  ).map(([name, players, cast]) =>
    asked({
      name,
      rule: "An instant cantrip waits for the last window before our untap, then is cast.",
      position(registry) {
        // A cantrip replaces itself, so it scored a wash and v2 never cast
        // Opt at all (`isCantripDue`). At three players, Bob's end step is
        // followed by Carol's turn: the mana stays up a while longer.
        const game = table(registry, [...players], B);
        onBoard(game, "Island", A);
        const opt = game.debugSpawn("Opt", A, "hand");
        game.advanceUntil(
          (s) => (s.turn.step === "end" && s.priority.holder === A && s.zones.shared.stack.length === 0) || s.result.over,
        );
        if (game.state.turn.step !== "end") return { passed: false, detail: "never reached bob's end step" };
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (action.type === "cast-spell" && action.card === opt) === cast,
            detail: `chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "casts Ponder with nothing better to do",
    rule: "A sorcery cantrip is cast in our own main phase rather than held.",
    position(registry) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Island", A);
      const ponder = game.debugSpawn("Ponder", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === ponder,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["casts Expressive Iteration with nothing better to do", ["Island", "Mountain"], "Expressive Iteration"],
      ["casts Compulsive Research at itself", ["Island", "Island", "Island"], "Compulsive Research"],
    ] as const
  ).map(([name, mana, card]) =>
    asked({
      name,
      rule: "Card selection that replaces itself is cast on an empty turn, aimed at ourselves.",
      position(registry) {
        // From the Jeskai Striker autopsy (2026-10-02): stuck on three lands,
        // Expressive Iteration scored a hair under passing and sat in hand —
        // a look that puts a card into hand never counted as a cantrip.
        const game = table(registry, [A, B], A);
        for (const land of mana) onBoard(game, land, A);
        const spell = game.debugSpawn(card, A, "hand");
        return {
          game,
          player: A,
          judge(action) {
            const aimed = action.type === "cast-spell" ? (action.targets ?? []) : [];
            return {
              passed:
                action.type === "cast-spell" &&
                action.card === spell &&
                aimed.every((t) => t === null || t.kind !== "player" || t.player === A),
              detail: `chose ${describeAction(action)}`,
            };
          },
        };
      },
    }),
  ),
  asked({
    name: "holds Faithless Looting with nothing to discard for",
    rule: "Draw two, discard two is a card down: no cantrip, nothing to gain.",
    position(registry) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Mountain", A);
      const looting = game.debugSpawn("Faithless Looting", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cast-spell" && action.card === looting),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "suspends Ancestral Vision",
    rule: "A suspend for one mana is three cards later; the evaluation can't see them, the rule can.",
    position(registry) {
      // The autopsy: offered every turn, scored as discarding a card.
      const game = table(registry, [A, B], A);
      onBoard(game, "Island", A);
      const vision = game.debugSpawn("Ancestral Vision", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "suspend" && action.card === vision,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "flashes in Transcendent Dragon at the end of the turn before its own",
    rule: "A held counter-creature is cast for its body once the mana would go unused.",
    position(registry) {
      // The autopsy: in hand 40 turn starts over six games, never cast — the
      // bot tapped out on its own turns and never had six open for a spell.
      const game = table(registry, [A, B], B);
      lands(game, "Island", A, 6);
      const dragon = game.debugSpawn("Transcendent Dragon", A, "hand");
      game.advanceUntil(
        (s) => (s.turn.step === "end" && s.priority.holder === A && s.zones.shared.stack.length === 0) || s.result.over,
      );
      if (game.state.turn.step !== "end") return { passed: false, detail: "never reached bob's end step" };
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
    name: "casts Curse of the Swine for several on a wide board",
    rule: "X targets offered as the best one, two, three…: a wide board is answered for X of 3 or more.",
    position(registry) {
      // The autopsy: offered as none, each alone and all of them, capped at
      // eight, seven creatures cut "all of them" off and the Curse was only
      // ever cast for X of 1.
      const game = table(registry, [A, B], A);
      lands(game, "Island", A, 6);
      for (const name of ["Craw Wurm", "Craw Wurm", "Serra Angel", "Centaur Courser", "Hill Giant", "Grizzly Bears", "Grizzly Bears", "Llanowar Elves"]) {
        onBoard(game, name, B);
      }
      const curse = game.debugSpawn("Curse of the Swine", A, "hand");
      return {
        game,
        player: A,
        judge(action) {
          const hits = action.type === "cast-spell" ? (action.targets ?? []).filter((t) => t !== null) : [];
          return {
            passed:
              action.type === "cast-spell" &&
              action.card === curse &&
              hits.length >= 3 &&
              hits.every((t) => t !== null && t.kind === "object" && game.state.objects[t.object]?.controller === B),
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),

  {
    name: "keeps the mana for a wrath held until after combat",
    rule: "A wipe saved for the second main phase isn't starved by a creature cast before combat.",
    run(weights, registry, makeBot) {
      // From the Sultai Arisen autopsy: held before combat, the wipe was left
      // out of the candidates, something else spent the mana, and Blood Money
      // sat in hand 61 turn starts while Avenger of Zendikar's eight Plants
      // (none of which block a flier) took the mana. Seven lands: the Avenger
      // (7) or the wrath (4), not both.
      const game = table(registry, [A, B], A);
      lands(game, "Plains", A, 4);
      lands(game, "Forest", A, 3);
      onBoard(game, "Grizzly Bears", A);
      for (let i = 0; i < 3; i += 1) onBoard(game, "Serra Angel", B);
      game.state.players[A].life = 12;
      const wrath = game.debugSpawn("Wrath of God", A, "hand");
      const wurm = game.debugSpawn("Avenger of Zendikar", A, "hand");
      const bot = makeBot(A, registry, weights);
      const first = bot.act(viewOf(game, A));
      if (first.type === "cast-spell" && first.card === wurm) {
        return { passed: false, detail: "cast Avenger of Zendikar before combat, leaving too little for the wrath" };
      }
      if (first.type === "cast-spell" && first.card === wrath) {
        return { passed: false, detail: "cast the wrath before combat" };
      }
      const reached = toSecondMain(game);
      if (reached !== null) return reached;
      const second = bot.act(viewOf(game, A));
      return {
        passed: second.type === "cast-spell" && second.card === wrath,
        detail: `before combat ${describeAction(first)}; after it ${describeAction(second)}`,
      };
    },
  },
  asked({
    name: "casts Chandra's Ignition before combat when it spares its own attacker",
    rule: "A wipe of each *other* creature spares the one dealing it: no attack is lost, so it isn't held for after combat.",
    position(registry) {
      // Reported from a live game (2026-10-06, capture 9M59N t17): carol held
      // Chandra's Ignition for after combat, read as killing the Lathliss it
      // would be cast for, then spent the mana on four Lathliss pumps.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 5);
      onBoard(game, "Shivan Dragon", A);
      for (let i = 0; i < 2; i += 1) onBoard(game, "Serra Angel", B);
      const ignition = game.debugSpawn("Chandra's Ignition", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === ignition,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "exiles a dying creature with Colfenor's Urn",
    rule: "Colfenor's Urn's 'you may exile it' is taken: a card under the Urn comes back, one in the graveyard doesn't.",
    position(registry) {
      // Reported from a live game (2026-10-06, capture 9M59N t22): bob
      // declined every Urn exile as a Magmaquake took three of his creatures,
      // which would all have come back at the end step.
      const game = table(registry, [A, B], B);
      lands(game, "Plains", B, 4);
      onBoard(game, "Colfenor's Urn", A);
      for (let i = 0; i < 3; i += 1) onBoard(game, "Wall of Omens", A);
      onBoard(game, "Craw Wurm", B);
      const wrath = game.debugSpawn("Wrath of God", B, "hand");
      game.dispatch({ type: "cast-spell", player: B, card: wrath, targets: [] });
      game.advanceUntil((s) => (s.awaiting?.kind === "choose-modes" && s.awaiting.player === A) || s.result.over);
      if (game.state.awaiting?.kind !== "choose-modes") return { passed: false, detail: "the Urn never asked" };
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "choose-modes" && action.modes.includes(0),
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "aims Explosion at what it kills",
    rule: "Damage that doesn't kill is gone at cleanup (rule 514.2): X=3 goes at a 3-loyalty planeswalker or a 2/2, not a 5/5.",
    position(registry) {
      // Reported from a live game (2026-10-06, capture NZP7Q t26): Explosion
      // for 3 at a 6/6 Lathliss, with a 3-loyalty Kiora beside it.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Island", A, 2);
      lands(game, "Mountain", A, 5);
      onBoard(game, "Shivan Dragon", B);
      onBoard(game, "Craw Wurm", C);
      const garruk = onBoard(game, "Garruk Wildspeaker", D);
      game.state.objects[garruk].counters.loyalty = 3;
      const bears = onBoard(game, "Grizzly Bears", D);
      const explosion = game.debugSpawn("Expansion // Explosion", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => {
          const target = action.type === "cast-spell" && action.card === explosion ? action.targets?.[0] : undefined;
          const kills = target?.kind === "object" && (target.object === garruk || target.object === bears);
          return { passed: kills, detail: `chose ${describeAction(action)}` };
        },
      };
    },
  }),
  {
    name: "spreads attackers between equal open opponents",
    rule: "With nothing to choose between two open opponents, the attack is split, not piled on one.",
    run(weights, registry, makeBot) {
      // The user (2026-10-07, capture HB5MR t20): "Bot should attempt to
      // spread out attackers". Bob's Centaur Courser blocks and kills a Bear,
      // so carol and dave are the open ones.
      const game = table(registry, [A, B, C, D], A);
      for (let i = 0; i < 4; i += 1) onBoard(game, "Grizzly Bears", A);
      onBoard(game, "Centaur Courser", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const at = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      const hit = (p: PlayerId) => at.some((d) => d.defender === p);
      return {
        passed: hit(C) && hit(D),
        detail: `attacked ${at.map((d) => d.defender).join(", ") || "nobody"}`,
      };
    },
  },
  {
    name: "does not attack into a free block",
    rule: "A 2/2 swung at an untapped 1/3 is blocked for nothing; it only taps the attacker.",
    run(weights, registry, makeBot) {
      // Reported from a live game (2026-10-06, capture AGB72 t15): Scavenging
      // Ooze attacked a 40-life player whose 1/3 blocks it for free.
      const game = table(registry, [A, B, C, D], A);
      onBoard(game, "Grizzly Bears", A);
      onBoard(game, "Troyan, Gutsy Explorer", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: !attackers.some((d) => d.defender === B),
        detail: `attacked ${attackers.map((d) => d.defender).join(", ") || "nobody"}`,
      };
    },
  },
  asked({
    name: "lets its own trigger resolve before spending mana",
    rule: "In our main phase, with only our own trigger on the stack, the mana waits for the sorcery-speed play.",
    position(registry) {
      // From the Sultai Arisen autopsy: 57 times in 34 games an instant or an
      // activation answered the bot's own landfall or main-phase trigger, and
      // the creature it would have cast after went uncast.
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 2);
      onBoard(game, "Island", A);
      onBoard(game, "Scute Swarm", A);
      game.debugSpawn("Think Twice", A, "hand");
      game.debugSpawn("Centaur Courser", A, "hand");
      const forest = game.debugSpawn("Forest", A, "hand");
      game.dispatch({ type: "play-land", player: A, card: forest });
      game.advanceUntil((s) => (s.priority.holder === A && s.zones.shared.stack.length > 0) || s.result.over);
      if (game.state.zones.shared.stack.length === 0) {
        return { passed: false, detail: "the landfall trigger never went on the stack" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "pass-priority",
          detail: `with its own landfall trigger on the stack, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "fetches the colour its hand needs",
    rule: "Two colours missing: a fetch takes the one the spells in hand want and no land in hand makes.",
    position(registry) {
      // From the Sultai Arisen autopsy (seed 73): Foreboding Landscape took a
      // Swamp with Sunken Hollow (black) in hand and five green spells
      // waiting; the deck sat six turns with no green source.
      const game = table(registry, [A, B], A);
      game.state.players[A].commanderIdentity = ["B", "G", "U"];
      onBoard(game, "Island", A);
      const landscape = onBoard(game, "Foreboding Landscape", A);
      game.debugSpawn("Sunken Hollow", A, "hand");
      game.debugSpawn("Farseek", A, "hand");
      game.debugSpawn("Scute Swarm", A, "hand");
      // The Swamp comes first in the library: order alone would take it.
      game.debugSpawn("Forest", A, "library");
      game.debugSpawn("Swamp", A, "library");
      game.dispatch({ type: "activate-ability", player: A, source: landscape, abilityIndex: 1, targets: [] });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || s.result.over);
      if (game.state.awaiting?.kind !== "choose-from-zone") {
        return { passed: false, detail: "the search never asked" };
      }
      return {
        game,
        player: A,
        judge(action) {
          const picked = action.type === "choose-from-zone" ? action.chosen : [];
          const names = picked.map((id) => game.state.objects[id]?.cardName);
          return {
            passed: names.length === 1 && names[0] === "Forest",
            detail: `fetched ${names.join(", ") || "nothing"}`,
          };
        },
      };
    },
  }),

  // --- attacks ---------------------------------------------------------------
  {
    name: "does not attack into a bigger untapped blocker",
    rule: "A 2/2 swung into an untapped 3/3 just dies.",
    run(weights, registry, makeBot) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Grizzly Bears", A);
      onBoard(game, "Centaur Courser", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return { passed: attackers.length === 0, detail: `attacked with ${attackers.length}` };
    },
  },
  {
    name: "attacks the open player, not one with a blocker",
    rule: "At a four-player table, a 2/2 goes at the opponent who can't block it.",
    run(weights, registry, makeBot) {
      // v2 attacked with nothing, here and with no creature anywhere but its
      // own, at three players as at four. The leading opponent counts in
      // full and the rest at `otherOpponents` over their average, so two
      // damage to one of three opponents at 20 is worth about a quarter
      // point, and tapping the 2/2 cost `untappedCreatures` 0.5 — for a
      // blocker that could only chump the 3/3s. Our blockers now count only
      // where they'd hold an attack off (`features.ts`, `deterringBlockers`).
      const game = table(registry, [A, B, C, D], A);
      onBoard(game, "Grizzly Bears", A);
      onBoard(game, "Centaur Courser", B);
      onBoard(game, "Centaur Courser", D);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.length === 1 && attackers[0].defender === C,
        detail: `attacked ${attackers.map((d) => d.defender).join(", ") || "nobody"}`,
      };
    },
  },
  asked({
    name: "does not cycle a land in its own upkeep",
    rule: "Cycling costs mana the main phase wants; the land is better played.",
    position(registry) {
      // From the Mardu Surge autopsy: a land cycled in the upkeep, and the
      // turn's spell never came (4 times in 25 games).
      const game = Game.create({ seed: 3, registry, decks: [A, B, C, D].map(forestDeck) });
      game.advanceUntil(
        (s) =>
          s.turn.number > 4 &&
          s.turnOrder[s.turn.activePlayerIndex] === A &&
          s.turn.step === "upkeep" &&
          s.priority.holder === A,
      );
      if (game.state.turn.step !== "upkeep") return { passed: false, detail: "never reached alice's upkeep" };
      game.state.zones.perPlayer[A].hand = [];
      for (const land of ["Mountain", "Plains", "Swamp"]) onBoard(game, land, A);
      const landscape = game.debugSpawn("Shattered Landscape", A, "hand");
      game.debugSpawn("Hero of Bladehold", A, "hand");
      // A spell on top, so a cycle would draw something.
      const top = game.debugSpawn("Lightning Greaves", A, "library");
      const library = game.state.zones.perPlayer[A].library;
      game.state.zones.perPlayer[A].library = [top, ...library.filter((id) => id !== top)];
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cycle" && action.card === landscape),
          detail: `in its upkeep chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "chumps with one token of a stack, not the stack",
    rule: "A chump block against lethal takes one token; the rest of a stack stays home.",
    position(registry) {
      // From the Mardu Surge autopsy: a lethal attacker chumped with a whole
      // stack of nine Soldiers — every token in it blocks when no count is
      // named.
      const game = table(registry, [A, B], B);
      const stack = onBoard(game, "Soldier Token", A);
      game.state.objects[stack].isToken = true;
      game.state.objects[stack].stackCount = 9;
      const wurm = onBoard(game, "Craw Wurm", B);
      game.state.objects[wurm].counters["+1/+1"] = 6;
      game.state.players[A].life = 5;
      const failed = bobAttacks(game, [wurm]);
      if (failed !== null) return failed;
      return {
        game,
        player: A,
        judge(action) {
          const blocks = action.type === "declare-blockers" ? action.blocks : [];
          return {
            passed: blocks.length === 1 && blocks[0].blocker === stack && blocks[0].count === 1,
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  ...(
    [
      ["takes a Craw Wurm's hit at 35 rather than chump", "Craw Wurm", false],
      ["takes a commander's first small hit at 35 rather than chump", "Centaur Courser", true],
    ] as const
  ).map(([name, attacker, commander]) =>
    asked({
      name,
      rule: commander
        ? "Three commander damage of 21 isn't worth a creature, even a token."
        : "Six of 35 life isn't worth a creature, even a token.",
      position(registry) {
        // From the Mardu Surge autopsy: at 35 life v2 threw Soldier tokens
        // under attackers. `threat`, measured after the simulated combat,
        // grew with the damage taken, and commander damage counted 2 a point
        // from the first.
        const game = table(registry, [A, B, C, D], B);
        for (let i = 0; i < 2; i += 1) {
          const token = onBoard(game, "Soldier Token", A);
          game.state.objects[token].isToken = true;
        }
        game.state.players[A].life = 35;
        const hitter = onBoard(game, attacker, B);
        if (commander) game.state.objects[hitter].isCommander = true;
        const failed = bobAttacks(game, [hitter]);
        if (failed !== null) return failed;
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: (blocksOf(action) ?? []).length === 0,
            detail: `chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  {
    name: "kills a player with a stack of tokens",
    rule: "Ten stacked 1/1s are ten attackers: enough of them at the player on 8 kills him.",
    run(weights, registry, makeBot) {
      // From the Mardu Surge autopsy: the kill planner read a stack of ten
      // 1/1 tokens as one 1/1 and sent it at a player on 40.
      const game = table(registry, [A, B, C, D], A);
      for (const p of [A, C, D]) game.state.players[p].life = 40;
      game.state.players[B].life = 8;
      const stack = onBoard(game, "Soldier Token", A);
      game.state.objects[stack].isToken = true;
      game.state.objects[stack].stackCount = 10;
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      const atBob = attackers
        .filter((d) => d.defender === B)
        .reduce((n, d) => n + (d.count ?? game.state.objects[d.attacker]?.stackCount ?? 1), 0);
      return {
        passed: atBob >= 8,
        detail: `sent ${atBob} at bob (${attackers.map((d) => `${d.count ?? "all"}→${String(d.defender)}`).join(", ") || "nothing"})`,
      };
    },
  },
  asked({
    name: "sacrifices Tree of Redemption to Felothar, not Seedborn Muse",
    rule: "Felothar draws the sacrificed creature's toughness and discards its power: a 0/13 is thirteen cards, a 2/4 two.",
    kind: "training",
    position(registry) {
      // Reported from a live game (2026-10-06, no capture): a bot activated
      // Felothar, the Steadfast sacrificing Seedborn Muse (draw 4, discard
      // 2) with Tree of Redemption (draw 13, discard 0) on the board. v2's
      // candidate for an ability with a sacrifice cost takes the last
      // eligible permanent (`candidates.ts`'s `abilityCandidates`) — the
      // choice is never searched, so the effect's reading of the sacrificed
      // creature never decides it.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Forest", A, 4);
      game.state.players[A].landsPlayedThisTurn = 1;
      const felothar = onBoard(game, "Felothar the Steadfast", A);
      const tree = onBoard(game, "Tree of Redemption", A);
      onBoard(game, "Seedborn Muse", A);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === felothar && action.sacrifice === tree,
          detail: `chose ${action.type === "activate-ability" && action.sacrifice !== undefined ? `${describeAction(action)} sacrificing ${cardOf(game, action.sacrifice)}` : describeAction(action)}`,
        }),
      };
    },
  }),
  {
    name: "lets Archmage Emeritus resolve before casting Abrade",
    rule: "A spell cast while our own cast payoff is still on the stack misses its trigger: let the payoff resolve first.",
    kind: "training",
    run(weights, registry, makeBot) {
      // Reported from a live game (2026-10-06, no capture): Narset cast
      // Archmage Emeritus, then Abrade at Weathered Sentinels with the
      // Archmage still on the stack — and missed magecraft's draw. The
      // payoff went first (`payoffFirst`), but that return didn't record
      // `actedOn`, so the next window wasn't held (`holdPass`): it was
      // searched afresh, and Abrade now scored as well as Abrade later.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Island", A, 4);
      lands(game, "Mountain", A, 2);
      game.state.players[A].landsPlayedThisTurn = 1;
      const archmage = game.debugSpawn("Archmage Emeritus", A, "hand");
      const abrade = game.debugSpawn("Abrade", A, "hand");
      onBoard(game, "Weathered Sentinels", B);
      const bot = makeBot(A, registry, weights);
      const first = bot.act(viewOf(game, A));
      if (!(first.type === "cast-spell" && first.card === archmage)) {
        return { passed: false, detail: `cast first: ${describeAction(first)}` };
      }
      game.dispatch(first);
      if (game.state.priority.holder !== A || game.state.objects[archmage]?.zone !== "stack") {
        return { passed: false, detail: "never held priority with the Archmage on the stack" };
      }
      const second = bot.act(viewOf(game, A));
      return {
        passed: !(second.type === "cast-spell" && second.card === abrade),
        detail: `with the Archmage on the stack, chose ${describeAction(second)}`,
      };
    },
  },
  {
    name: "taps a land, untaps it with Kiora and casts Ganax",
    rule: "An untap ability is one more mana: tap a land, untap it, cast the spell that mana pays for.",
    run(weights, registry, makeBot) {
      // A live capture (2026-10-06, "alice, turn 18"): four lands, Kiora,
      // Behemoth Beckoner on 2 loyalty and Ganax, Astral Hunter ({4}{R}) in
      // hand; v2 cast Temur Ascendancy. The line is tap a land for mana,
      // Kiora's −1 at it, then Ganax with the floating mana and four lands —
      // `untap-plans.ts`. Played out here step by step, every opponent
      // passing, until Ganax is cast or the bot does something else.
      const game = table(registry, [A, B, C, D], A);
      // Untapped, as in the capture: the tri-land and the cycling land enter
      // tapped even spawned onto the battlefield.
      for (const land of ["Frontier Bivouac", "Forest", "Sheltered Thicket", "Bountiful Landscape"]) {
        game.state.objects[onBoard(game, land, A)].tapped = false;
      }
      const kiora = onBoard(game, "Kiora, Behemoth Beckoner", A);
      game.state.objects[kiora].counters.loyalty = 2;
      game.state.players[A].landsPlayedThisTurn = 1;
      const ganax = game.debugSpawn("Ganax, Astral Hunter", A, "hand");
      game.debugSpawn("Temur Ascendancy", A, "hand");
      game.debugSpawn("Garruk's Uprising", A, "hand");
      const bot = makeBot(A, registry, weights);
      const played: string[] = [];
      for (let i = 0; i < 16; i += 1) {
        const zone = game.state.objects[ganax]?.zone;
        if (zone === "stack" || zone === "battlefield") break;
        const holder = game.state.priority.holder;
        if (game.state.awaiting !== null || holder === null || game.state.turn.step !== "precombat-main") break;
        if (holder !== A) {
          game.dispatch({ type: "pass-priority", player: holder });
          continue;
        }
        const action = bot.act(viewOf(game, A));
        played.push(describeAction(action));
        if (action.type === "pass-priority" && game.state.zones.shared.stack.length === 0) break;
        game.dispatch(action);
      }
      const zone = game.state.objects[ganax]?.zone;
      return {
        passed: zone === "stack" || zone === "battlefield",
        detail: `Ganax ${zone}; played ${played.join(" | ")}`,
      };
    },
  },
  {
    name: "sends only enough of a token stack to kill a planeswalker",
    rule: "Five 1/1s kill a five-loyalty planeswalker, and with 2/2s across the table some of the other eight stay home to block.",
    run(weights, registry, makeBot) {
      // Reported from a live game (2026-10-05, no capture): a bot swung all
      // thirteen of its creature tokens at a planeswalker with 5 loyalty,
      // when five would have killed it and eight could have stayed back as
      // blockers. Neither bot could send part of a stack, so it was thirteen
      // or none; v2's climb now sends parts of one (`declareAttackers`).
      // Here the walker's controller has nothing to block with and the other
      // two opponents' crackback is far from lethal — so with the stack split,
      // the eight left over went at that player, until the crackback's
      // damage short of lethal had a price (`crackbackCost`). The user: "in
      // most cases you want to keep at least a few blockers back if there are
      // creatures on opponents' boards".
      const game = table(registry, [A, B, C, D], A);
      for (const p of [A, B, C, D]) game.state.players[p].life = 40;
      const stack = onBoard(game, "Soldier Token", A);
      game.state.objects[stack].isToken = true;
      game.state.objects[stack].stackCount = 13;
      const garruk = onBoard(game, "Garruk Wildspeaker", B);
      game.state.objects[garruk].counters.loyalty = 5;
      for (const p of [C, D]) for (let i = 0; i < 3; i += 1) onBoard(game, "Grizzly Bears", p);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      const sent = (d: (typeof attackers)[number]): number =>
        d.count ?? game.state.objects[d.attacker]?.stackCount ?? 1;
      const atGarruk = attackers.filter((d) => d.defender === garruk).reduce((n, d) => n + sent(d), 0);
      const home = 13 - attackers.reduce((n, d) => n + sent(d), 0);
      return {
        passed: atGarruk >= 5 && atGarruk <= 6 && home >= 3,
        detail: `sent ${atGarruk} at Garruk, kept ${home} home (${attackers.map((d) => `${d.count ?? "all"}→${String(d.defender)}`).join(", ") || "nothing"})`,
      };
    },
  },
  {
    name: "does not send its commander into a gang block",
    rule: "Two blockers that kill the commander together are a block a defender makes; attack the open players instead.",
    run(weights, registry, makeBot) {
      // From the Grave Danger autopsy: v2's attack planner predicted blocks
      // with v1's, which never ganged up, while v2's defenders did — Gisa
      // died on 32 of her 120 attacks and was recast at +2 tax each time.
      const game = table(registry, [A, B, C, D], A);
      for (const p of [A, B, C, D]) game.state.players[p].life = 40;
      const gisa = onBoard(game, "Gisa and Geralf", A);
      game.state.objects[gisa].isCommander = true;
      onBoard(game, "Centaur Courser", B);
      onBoard(game, "Grizzly Bears", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return {
        passed: attackers.every((d) => d.defender !== B),
        detail: `attacked ${attackers.map((d) => String(d.defender)).join(", ") || "nobody"}`,
      };
    },
  },
  {
    name: "flies over a ground blocker",
    rule: "A flier attacks past a bigger creature that can't block it.",
    run(weights, registry, makeBot) {
      const game = table(registry, [A, B], A);
      onBoard(game, "Serra Angel", A);
      onBoard(game, "Craw Wurm", B);
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === A);
      const attackers = makeBot(A, registry, weights).declareAttackers(viewOf(game, A));
      return { passed: attackers.length === 1, detail: `attacked with ${attackers.length}` };
    },
  },

  // --- answering on the stack ------------------------------------------------
  asked({
    name: "saves its creature from Lightning Bolt with Giant Growth",
    rule: "A pump in response to burn keeps the creature.",
    position(registry) {
      const game = table(registry, [A, B], B);
      onBoard(game, "Forest", A);
      onBoard(game, "Mountain", B);
      const courser = onBoard(game, "Centaur Courser", A);
      game.debugSpawn("Giant Growth", A, "hand");
      const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
      castAndPassTo(game, B, bolt, A, [{ kind: "object", object: courser }]);
      if (game.state.zones.shared.stack.length === 0) {
        return { passed: false, detail: "the Bolt never went on the stack" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === courser,
          detail: `with Bolt aimed at its 3/3, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  ...(
    [
      ["counters the wrath that would take its board", "Counterspell", "Island"],
      ["casts Heroic Intervention against a wrath", "Heroic Intervention", "Forest"],
    ] as const
  ).map(([name, answer, land]) =>
    asked({
      name,
      rule: "A board worth more than the opponent's is saved from a wrath when it can be.",
      position(registry) {
        const game = table(registry, [A, B], B);
        lands(game, land, A, 2);
        lands(game, "Plains", B, 4);
        onBoard(game, "Craw Wurm", A);
        onBoard(game, "Craw Wurm", A);
        const saving = game.debugSpawn(answer, A, "hand");
        const wrath = game.debugSpawn("Wrath of God", B, "hand");
        castAndPassTo(game, B, wrath, A);
        if (game.state.zones.shared.stack.length === 0) {
          return { passed: false, detail: "the wrath never went on the stack" };
        }
        return {
          game,
          player: A,
          judge: (action) => ({
            passed: action.type === "cast-spell" && action.card === saving,
            detail: `with Wrath of God on the stack, chose ${describeAction(action)}`,
          }),
        };
      },
    }),
  ),
  asked({
    name: "Yahenni sacrifices to survive a wrath",
    rule: "With a wrath on the stack, a creature that dies anyway buys Yahenni indestructible.",
    position(registry) {
      // From a live game (Mardu Surge): the bot let a wrath take Yahenni,
      // Undying Partisan with another creature there to sacrifice.
      const game = table(registry, [A, B], B);
      lands(game, "Plains", B, 4);
      const yahenni = onBoard(game, "Yahenni, Undying Partisan", A);
      onBoard(game, "Grizzly Bears", A);
      onBoard(game, "Craw Wurm", B);
      const wrath = game.debugSpawn("Wrath of God", B, "hand");
      castAndPassTo(game, B, wrath, A);
      if (game.state.zones.shared.stack.length === 0) {
        return { passed: false, detail: "the wrath never went on the stack" };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "activate-ability" && action.source === yahenni,
          detail: `with Wrath of God on the stack, chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  {
    name: "Yahenni sacrifices to survive its own wrath",
    rule: "Having cast a wrath, Yahenni's controller sacrifices into it before it resolves.",
    run(weights, registry, makeBot) {
      // The live game's likelier shape (Mardu Surge runs Blasphemous Act).
      // One bot plays both windows: `holdPass` passed on a spell the bot had
      // just cast, since the cast was scored as everyone passing until it
      // resolved — a score that never includes a response of our own. It
      // now searches that window when the spell is our own wipe taking a
      // creature of ours (`ownWipeOnStack`).
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 8);
      const yahenni = onBoard(game, "Yahenni, Undying Partisan", A);
      onBoard(game, "Grizzly Bears", A);
      for (let i = 0; i < 3; i += 1) onBoard(game, "Craw Wurm", B);
      const wipe = game.debugSpawn("Blasphemous Act", A, "hand");
      const reached = toSecondMain(game);
      if (reached !== null) return reached;
      const bot = makeBot(A, registry, weights);
      const cast = bot.act(viewOf(game, A));
      if (cast.type !== "cast-spell" || cast.card !== wipe) {
        return { passed: false, detail: `never cast the wipe: ${describeAction(cast)}` };
      }
      game.dispatch(cast);
      if (game.state.priority.holder !== A) return { passed: false, detail: "lost priority after casting" };
      const response = bot.act(viewOf(game, A));
      return {
        passed: response.type === "activate-ability" && response.source === yahenni,
        detail: `with its own Blasphemous Act on the stack, chose ${describeAction(response)}`,
      };
    },
  },
  asked({
    name: "Fogs a lethal attack",
    rule: "Facing lethal combat damage with a Fog in hand, cast the Fog.",
    position(registry) {
      const game = table(registry, [A, B], B);
      onBoard(game, "Forest", A);
      const wurm = onBoard(game, "Craw Wurm", B);
      game.debugSpawn("Fog", A, "hand");
      game.state.players[A].life = 5;
      // With no creature, Alice is never asked to block: she's asked at the
      // first window after the attack.
      game.advanceUntil((s) => s.awaiting?.kind === "attackers" && s.awaiting.player === B);
      game.dispatch({
        type: "declare-attackers",
        player: B,
        attackers: [{ attacker: wurm, defender: A }],
      });
      game.advanceUntil((s) => s.priority.holder === A || s.result.over);
      if (game.state.turn.step !== "declare-attackers" && game.state.turn.step !== "declare-blockers") {
        return { passed: false, detail: `reached ${game.state.turn.step}, not the attack` };
      }
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell",
          detail: `at 5 life with a 6/4 unblocked, chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  // --- sequencing ------------------------------------------------------------
  asked({
    name: "casts the spell that uses all its mana",
    rule: "On three lands with a two-drop and a three-drop, the three-drop comes down.",
    position(registry) {
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 3);
      game.debugSpawn("Grizzly Bears", A, "hand");
      const courser = game.debugSpawn("Centaur Courser", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === courser,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "draws cards with nothing else to do",
    rule: "Harmonize on an empty turn is three cards for mana that would go unused.",
    position(registry) {
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 4);
      const harmonize = game.debugSpawn("Harmonize", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === harmonize,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),

  asked({
    name: "Skullclamps a 1/1 token for two cards",
    rule: "Equipping Skullclamp to a 1/1 token kills it for two cards: a card up.",
    position(registry) {
      // Two cards (+4) against the token's body and its one point of attack:
      // every creature counts `creatures` 2.5 whatever its size, so the body
      // scores about as much as the cards, and the attack tips it to passing.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 2);
      const token = onBoard(game, "Soldier Token", A);
      game.state.objects[token].isToken = true;
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
  asked({
    name: "sacrifices a 1/1 token to Deadly Dispute",
    rule: "A 1/1 token for two cards and a Treasure is a card up and more.",
    position(registry) {
      // The Skullclamp scenario's root from the other side (probed
      // 2026-10-03): v2 casts Deadly Dispute on a Treasure, or a mobilize
      // token due to die, but not on a Soldier token — the token's flat
      // `creatures` 2.5 outweighs two cards and a Treasure.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Swamp", A, 3);
      const token = onBoard(game, "Soldier Token", A);
      game.state.objects[token].isToken = true;
      const dispute = game.debugSpawn("Deadly Dispute", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === dispute,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Urza's Incubator first so Miirym fits in the same turn",
    kind: "training",
    rule: "A cost reducer that pays for itself this turn goes first: Incubator naming Dragon, then Miirym, is seven mana for both.",
    position(registry) {
      // Reported from a live game (2026-10-07): "Bot played Miirym instead of
      // Urza's Incubator; if it had played Urza's Incubator and chosen
      // Dragons it could have afforded to play Miirym too." Seven lands:
      // Incubator (3), then Miirym at {1}{G}{U}{R} (4). Miirym first leaves one
      // mana and no Incubator.
      const game = table(registry, [A, B], A);
      lands(game, "Forest", A, 3);
      lands(game, "Island", A, 2);
      lands(game, "Mountain", A, 2);
      const incubator = game.debugSpawn("Urza's Incubator", A, "hand");
      game.debugSpawn("Miirym, Sentinel Wyrm", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === incubator,
          detail: `chose ${action.type === "cast-spell" ? `Cast ${game.state.objects[action.card]?.cardName}` : action.type}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Omnath, Locus of Rage before cracking its fetch lands",
    kind: "training",
    rule: "A landfall payoff goes down before the lands enter: each fetch cracked after it is another trigger.",
    position(registry) {
      // Reported from a live game (2026-10-07): "bot triggered a ton of lands
      // entering before playing a landfall card." Kresh cracked five fetch
      // lands (and sacrificed a sixth land to Hearthhull), then cast Omnath,
      // Locus of Rage and played Cinder Glade: one Elemental where Omnath
      // first would have made six. Here: Omnath first, then three fetches,
      // three 5/5s. The search scores each cracked fetch with rollouts that
      // pass our own seat, so Omnath's later triggers are never seen —
      // `castPayoff` turns the `"acting"` rollout on only for "whenever you
      // cast" payoffs, not landfall.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 3);
      lands(game, "Forest", A, 3);
      for (const fetch of ["Evolving Wilds", "Fabled Passage", "Terramorphic Expanse"]) onBoard(game, fetch, A);
      const omnath = game.debugSpawn("Omnath, Locus of Rage", A, "hand");
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === omnath,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Dragon Tempest before the Dragon it pays off",
    kind: "training",
    rule: "An enters payoff goes down before the creature it pays off: the Dragon after it gets haste and deals damage.",
    position(registry) {
      // Reported from a live game (2026-10-07): "bot played Dragon Tempest
      // after a Dragon instead of before it." Tempest first, then Shivan
      // Dragon: the Dragon enters with haste and deals 2 (two Dragons) to the
      // Bears. The search scores each cast with rollouts that pass our own
      // seat for the rest of the turn (`castPayoff` turns on the `"acting"`
      // rollout only for "whenever you cast" payoffs), so Tempest first reads
      // as an inert enchantment and the Dragon first as a 5/5 flier.
      const game = table(registry, [A, B], A);
      lands(game, "Mountain", A, 8);
      onBoard(game, "Furnace Whelp", A);
      const tempest = game.debugSpawn("Dragon Tempest", A, "hand");
      game.debugSpawn("Shivan Dragon", A, "hand");
      onBoard(game, "Grizzly Bears", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === tempest,
          detail: `chose ${action.type === "cast-spell" ? `Cast ${game.state.objects[action.card]?.cardName}` : action.type}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Opt first so Shiko's Flurry copies the Lightning Bolt",
    rule: "With a second-spell payoff out, a cheap first spell turns the next one into two.",
    position(registry) {
      // The deck autopsies' "chained spells are invisible": Shiko and Narset,
      // Unified copies the second spell each turn that targets. Opt first
      // makes the Bolt the second, and its copy kills the other Bears. The
      // rollouts pass our own seat for the rest of the turn, so Opt alone
      // scores as a cantrip — held for the end of the turn before ours. Fixed
      // by the `"acting"` rollout while a cast payoff is out (`castPayoff`)
      // and v1 aiming a copy away from the original's target.
      const game = table(registry, [A, B, C, D], A);
      lands(game, "Island", A, 2);
      lands(game, "Mountain", A, 2);
      for (const player of [A, B, C, D]) game.state.players[player].life = 40;
      onBoard(game, "Shiko and Narset, Unified", A);
      const opt = game.debugSpawn("Opt", A, "hand");
      game.debugSpawn("Lightning Bolt", A, "hand");
      onBoard(game, "Grizzly Bears", B);
      onBoard(game, "Grizzly Bears", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && action.card === opt,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "casts Shiko first so the Lightning Bolt after her is copied",
    rule: "A commander with a second-spell payoff is the turn's first spell herself.",
    position(registry) {
      // The user (2026-10-04): Shiko counts herself as a spell. Cast from the
      // command zone she's the first of the turn, so a Bolt after her is the
      // second and Flurry copies it — both Bears die. Bolt first, then Shiko,
      // and nothing is copied.
      const game = Game.create({
        seed: 3,
        registry,
        decks: [
          { player: A, cards: Array<string>(40).fill("Island"), commanders: ["Shiko and Narset, Unified"] },
          ...[B, C, D].map(forestDeck),
        ],
      });
      game.advanceUntil(
        (s) => s.turnOrder[s.turn.activePlayerIndex] === A && s.priority.holder === A && s.turn.step === "precombat-main",
      );
      midGame(game);
      for (const player of [A, B, C, D]) {
        game.state.zones.perPlayer[player].hand = [];
        game.state.players[player].life = 40;
      }
      lands(game, "Island", A, 2);
      lands(game, "Mountain", A, 2);
      lands(game, "Plains", A, 1);
      game.debugSpawn("Lightning Bolt", A, "hand");
      onBoard(game, "Grizzly Bears", B);
      onBoard(game, "Grizzly Bears", B);
      return {
        game,
        player: A,
        judge: (action) => {
          const card = action.type === "cast-spell" ? game.state.objects[action.card]?.cardName : undefined;
          return {
            passed: card === "Shiko and Narset, Unified",
            detail: `chose ${describeAction(action)}`,
          };
        },
      };
    },
  }),
  asked({
    name: "destroys an early Sol Ring over a Warhammer",
    rule: "In the opening rounds, a mana rock is the artifact to destroy.",
    position(registry) {
      // The user's ask (2026-10-04): acceleration is what to kill early. On
      // alice's second turn bob has a Sol Ring and carol a Loxodon Warhammer
      // with nothing to carry it; before `earlyMana` the two scored alike
      // (a permanent and its mana value, against a permanent, its mana value
      // and half a point a mana).
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5;
      for (const player of [A, B, C, D]) lands(game, player === A ? "Plains" : "Forest", player, 2);
      game.debugSpawn("Disenchant", A, "hand");
      const ring = onBoard(game, "Sol Ring", B);
      onBoard(game, "Loxodon Warhammer", C);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === ring,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "kills an early Llanowar Elves",
    rule: "A mana creature on turn one is worth the removal held back in the opening rounds.",
    position(registry) {
      // `earlyRemoval` holds Swords from a 1/6 wall on turn two; a turn-one
      // mana creature is acceleration, which `earlyMana` prices to kill.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5;
      for (const player of [A, B, C, D]) lands(game, player === A ? "Plains" : "Forest", player, 2);
      game.debugSpawn("Swords to Plowshares", A, "hand");
      const elves = onBoard(game, "Llanowar Elves", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === elves,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "later, destroys the Warhammer in use over a Sol Ring",
    rule: "Past the opening rounds a mana rock is one source among many.",
    position(registry) {
      // The other side of "destroys an early Sol Ring": mid-game, the
      // Warhammer on carol's Grizzly Bears is the artifact that matters.
      const game = table(registry, [A, B, C, D], A);
      for (const player of [A, B, C, D]) lands(game, player === A ? "Plains" : "Forest", player, 6);
      game.debugSpawn("Disenchant", A, "hand");
      onBoard(game, "Sol Ring", B);
      const bears = onBoard(game, "Grizzly Bears", C);
      const hammer = onBoard(game, "Loxodon Warhammer", C);
      game.state.objects[hammer].attachedTo = bears;
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === hammer,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "kills a Craw Wurm ramped out on turn two",
    rule: "Early removal is held for a real threat, and a ramped six-power creature is one.",
    position(registry) {
      // The counterweight to holding Swords for more than a wall: whatever
      // `earlyRemoval` is worth, it mustn't outweigh a threat this size.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5;
      for (const player of [A, B, C, D]) lands(game, player === A ? "Plains" : "Forest", player, 2);
      game.debugSpawn("Swords to Plowshares", A, "hand");
      const wurm = onBoard(game, "Craw Wurm", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: action.type === "cast-spell" && firstTarget(action) === wurm,
          detail: `chose ${describeAction(action)}`,
        }),
      };
    },
  }),
  asked({
    name: "holds Swords to Plowshares for more than a wall",
    rule: "Removal isn't spent in the first two rounds on a creature that threatens nothing.",
    position(registry) {
      // The deck autopsies' seed 116: Jeskai Striker spent Swords on a Wall
      // of Reverence on its second turn and had no answer to Lathliss later.
      // Killing the 1/6 defender scores 6.0 against a Grizzly Bears' 3.7,
      // mostly its `toughness`; a flat reserve for removal in hand
      // (`answers`) still fired at it and held Murder from the table's only
      // creature (`docs/plans/deck-autopsies.md`).
      // Held by `earlyRemoval` (the user's ask, 2026-10-04): alice's second turn.
      const game = table(registry, [A, B, C, D], A);
      game.state.turn.number = 5;
      for (const player of [A, B, C, D]) lands(game, player === A ? "Plains" : "Forest", player, 2);
      game.debugSpawn("Swords to Plowshares", A, "hand");
      const wall = onBoard(game, "Wall of Reverence", B);
      return {
        game,
        player: A,
        judge: (action) => ({
          passed: !(action.type === "cast-spell" && firstTarget(action) === wall),
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
