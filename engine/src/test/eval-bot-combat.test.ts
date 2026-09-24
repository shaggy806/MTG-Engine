import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/eval-bot.js";
import { canBlock, damageThrough, isLethal } from "../bot/combat-math.js";
import { simulateAction } from "../bot/simulate.js";
import { combinations, decisionCandidates } from "../bot/decisions.js";
import type { CombatCreature } from "../bot/combat-math.js";
import { createDefaultRegistry } from "../cards.js";
import type { Keyword } from "../cards/define.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const registry = createDefaultRegistry();

// --- combat-math ----------------------------------------------------------

let nextId = 0;
const creature = (
  power: number,
  toughness: number,
  keywords: readonly Keyword[] = [],
  extra: Partial<CombatCreature> = {},
): CombatCreature => ({
  id: asObjectId(`c${(nextId += 1)}`),
  power,
  toughness,
  damage: power,
  keywords: new Set(keywords),
  colors: new Set(),
  types: ["creature"],
  protectionColors: new Set(),
  protectionTypes: new Set(),
  canBlock: true,
  canAttack: true,
  isCommander: false,
  ...extra,
});

describe("combat-math", () => {
  it("lets only flying or reach block a flyer", () => {
    const flyer = creature(3, 3, ["flying"]);
    expect(canBlock(creature(2, 2), flyer)).toBe(false);
    expect(canBlock(creature(2, 2, ["reach"]), flyer)).toBe(true);
    expect(canBlock(creature(2, 2, ["flying"]), flyer)).toBe(true);
  });

  it("blocks the biggest attacker first, saving reach for the flyer", () => {
    // One ground blocker and one reach blocker against a 5/5 and a 3/3 flyer:
    // the reach creature must take the flyer, or the flyer goes unblocked.
    const through = damageThrough(
      [creature(5, 5), creature(3, 3, ["flying"])],
      [creature(1, 1), creature(1, 1, ["reach"])],
    );
    expect(through.damage).toBe(0);
  });

  it("needs two blockers for menace", () => {
    const menace = creature(4, 4, ["menace"]);
    expect(damageThrough([menace], [creature(1, 1)]).damage).toBe(4);
    expect(damageThrough([menace], [creature(1, 1), creature(1, 1)]).damage).toBe(0);
  });

  it("lets trample through past the blocker's toughness, and doubles double strike", () => {
    expect(damageThrough([creature(6, 6, ["trample"])], [creature(2, 4)]).damage).toBe(2);
    expect(damageThrough([creature(3, 3, ["double-strike"])], []).damage).toBe(6);
  });

  it("finds commander damage lethal even when life isn't", () => {
    const game = Game.create({ seed: 1, registry, decks: [deckFor(A), deckFor(B)] });
    const commander = creature(5, 5, [], { isCommander: true });
    game.state.players[B].commanderDamageTaken = { [commander.id]: 17 } as never;
    const through = damageThrough([commander], []);
    expect(through.damage).toBeLessThan(game.state.players[B].life);
    expect(isLethal(game.state, B, through)).toBe(true);
  });
});

// --- the bot's combat decisions -------------------------------------------

function deckFor(player: PlayerId) {
  return { player, cards: Array<string>(40).fill("Forest") };
}

/** A view of `game` for `player`, as the engine would hand a controller. */
const viewOf = (game: Game, player: PlayerId): ControllerView => ({
  state: game.state,
  player,
  legalActions: () => game.legalActions(player),
});

/**
 * A two-player game stopped at Alice's attack (her turn 1) or block (Bob's
 * turn 2, attacking with the v1 bot, which swings with everything)
 * declaration, after `setup` has built the board.
 */
function atDeclaration(
  kind: "attackers" | "blockers",
  setup: (game: Game) => void,
): Game {
  const controllers: Partial<Record<PlayerId, PlayerController>> =
    kind === "blockers" ? { [B]: new HeuristicBotController(B, registry) } : {};
  const game = Game.create({ seed: 3, registry, controllers, decks: [deckFor(A), deckFor(B)] });
  game.advanceUntil((s) => s.priority.holder !== null);
  setup(game);
  game.advanceUntil((s) => s.awaiting?.kind === kind && s.awaiting.player === A);
  return game;
}

const bot = () => new EvalBotController(A, registry);

describe("EvalBotController combat", () => {
  it("swings with everything when that's lethal through the best blocks", () => {
    const game = atDeclaration("attackers", (g) => {
      for (let i = 0; i < 3; i += 1) g.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
      g.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
      g.state.players[B].life = 12;
    });
    // Three 6/4s into one blocker: 12 gets through, exactly lethal.
    expect(bot().declareAttackers(viewOf(game, A))).toHaveLength(3);
  });

  it("holds back a blocker when attacking would lose to the crackback", () => {
    const board = (life: number) =>
      atDeclaration("attackers", (g) => {
        g.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
        // Tapped, so it can't block the bear — but it untaps for Bob's turn.
        // A 4/4 without trample, so a blocking bear stops all of it.
        g.debugSpawn("Rumbling Baloth", B, "battlefield", { summoningSick: false, tapped: true });
        g.state.players[A].life = life;
      });

    // Healthy: the free two damage is worth taking.
    expect(bot().declareAttackers(viewOf(board(40), A))).toHaveLength(1);
    // At 5 life the Baloth swinging back into an empty board is lethal (with
    // the 2-life margin); kept home, the bear blocks it.
    expect(bot().declareAttackers(viewOf(board(5), A))).toHaveLength(0);
  });

  it("races when the crackback is lethal whatever it holds back", () => {
    const game = atDeclaration("attackers", (g) => {
      g.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
      for (let i = 0; i < 2; i += 1) {
        g.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false, tapped: true });
      }
      g.state.players[A].life = 5;
    });
    // One bear can stop one Wurm (all but its 4 trample damage); the other
    // still deals 6.
    expect(bot().declareAttackers(viewOf(game, A))).toHaveLength(1);
  });

  it("chump-blocks only when the damage would be lethal", () => {
    const board = (life: number) =>
      atDeclaration("blockers", (g) => {
        g.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
        g.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
        g.state.players[A].life = life;
      });
    expect(bot().declareBlockers(viewOf(board(40), A))).toHaveLength(0);
    expect(bot().declareBlockers(viewOf(board(5), A))).toHaveLength(1);
  });
});

describe("rollout policies", () => {
  /** Bob's life after Alice passes her precombat main with a Craw Wurm out,
   * rolled to the end of her turn under `policy`. */
  const lifeAfterPass = (policy: "passive" | "combat" | "defensive"): number => {
    const game = Game.create({ seed: 3, registry, decks: [deckFor(A), deckFor(B)] });
    game.advanceUntil((s) => s.priority.holder !== null);
    game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const after = simulateAction(
      game.state,
      registry,
      { type: "pass-priority", player: A },
      "turn",
      policy,
    );
    expect(after).not.toBeNull();
    return after?.players[B].life ?? 0;
  };

  it("only plays combat out under the combat policy", () => {
    expect(lifeAfterPass("passive")).toBe(20);
    expect(lifeAfterPass("combat")).toBe(14);
    // Our own seat holds back; only opponents attack.
    expect(lifeAfterPass("defensive")).toBe(20);
  });
});

describe("decisions mid-resolution", () => {
  it("enumerates combinations in order, capped", () => {
    expect(combinations([1, 2, 3], 2, 10)).toEqual([
      [1, 2],
      [1, 3],
      [2, 3],
    ]);
    expect(combinations([1, 2, 3, 4], 2, 2)).toHaveLength(2);
    expect(combinations([1, 2], 3, 10)).toEqual([]);
  });

  it("offers declining an optional mode and every scry split", () => {
    const modes = decisionCandidates(
      { kind: "choose-modes", source: "s" as never, minModes: 0, maxModes: 1, modeTexts: ["x"] },
      A,
    );
    expect(modes?.map((m) => (m.type === "choose-modes" ? m.modes : null))).toEqual([[], [0]]);
    const scry = decisionCandidates(
      { kind: "scry", mode: "scry", cards: ["a", "b"] as never },
      A,
    );
    expect(scry).toHaveLength(4);
    // Mulligans aren't searched.
    expect(decisionCandidates({ kind: "mulligan", count: 0 }, A)).toBeNull();
  });

  it("aims a trigger at the opponent's best creature and takes the \"you may\"", () => {
    // Overseer of the Damned: "When it enters, you may destroy target
    // creature." v1 takes the first legal target and declines every "you may".
    const game = Game.create({
      seed: 3,
      registry,
      controllers: { [A]: new EvalBotController(A, registry) },
      decks: [deckFor(A), deckFor(B)],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const smallest = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    const biggest = game.debugSpawn("Craw Wurm", B, "battlefield", { summoningSick: false });
    game.debugSpawn("Overseer of the Damned", A, "battlefield", { announceEntry: true });

    // The trigger is only put on the stack the next time anyone would get
    // priority, so run to the next step rather than to "stack empty".
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    const onBattlefield = (id: string) =>
      game.state.zones.shared.battlefield.includes(id as never);
    expect(onBattlefield(biggest)).toBe(false);
    expect(onBattlefield(smallest)).toBe(true);
    expect(onBattlefield(bear)).toBe(true);
  });
});
