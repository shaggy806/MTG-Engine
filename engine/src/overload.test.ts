/**
 * Overload (rule 702.126) — the EDH-popularity backlog's second Tier-1
 * feature (`neededCards-features.md`): an alternative cost that *replaces*
 * the mana cost entirely (unlike kicker, which is additive) and changes
 * "target" to "each" — the spell takes no targets and instead applies to
 * every matching permanent. New engine surface: `CardDefinition.overload`,
 * `Action`/`LegalAction.overload`, `GameObject.overloaded`, and a new
 * `return-to-hand-all` `EffectSpec` (mirroring `destroy-all`). Also two new
 * `TargetSpec`s the unkicked/untargeted modes needed to be faithful:
 * `artifact-an-opponent-controls`, `nonland-permanent-an-opponent-controls`.
 * Shipped against Cyclonic Rift, Vandalblast, Damn.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

const withMana = (game: Game, player: ReturnType<typeof asPlayerId>, count: number): void => {
  for (let i = 0; i < count; i++) game.debugSpawn("Command Tower", player);
};

describe("Cyclonic Rift", () => {
  it("unkicked: returns a target nonland permanent an opponent controls", () => {
    const game = makeGame(["Cyclonic Rift"]);
    withMana(game, A, 2);
    const target = game.debugSpawn("Arcane Signet", B);
    const own = game.debugSpawn("Arcane Signet", A);

    const rift = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Cyclonic Rift")!;
    const action = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === rift);
    expect(action?.kind).toBe("cast-spell");
    if (action?.kind !== "cast-spell") throw new Error("no cast-spell action");
    expect(action.overload).toBeUndefined();
    // Can't target your own permanent.
    expect(action.targetOptions[0]).toEqual([{ kind: "object", object: target }]);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: rift,
      targets: [{ kind: "object", object: target }],
    });
    settle(game);

    expect(game.state.objects[target]?.zone).toBe("hand");
    expect(game.state.objects[own]?.zone).toBe("battlefield");
  });

  it("overloaded: returns every nonland permanent every opponent controls, and none of your own", () => {
    const game = makeGame(["Cyclonic Rift"]);
    withMana(game, A, 7);
    const opp1 = game.debugSpawn("Arcane Signet", B);
    const opp2 = game.debugSpawn("Sol Ring", B);
    const mine = game.debugSpawn("Arcane Signet", A);

    const rift = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Cyclonic Rift")!;
    const overloadAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === rift && a.overload === true);
    expect(overloadAction?.kind).toBe("cast-spell");
    if (overloadAction?.kind !== "cast-spell") throw new Error("no overload action");
    expect(overloadAction.targetSpecs).toEqual([]);

    game.dispatch({ type: "cast-spell", player: A, card: rift, overload: true });
    settle(game);

    expect(game.state.objects[opp1]?.zone).toBe("hand");
    expect(game.state.objects[opp2]?.zone).toBe("hand");
    expect(game.state.objects[mine]?.zone).toBe("battlefield");
  });
});

describe("Vandalblast", () => {
  it("unkicked destroys a target artifact an opponent controls; overloaded destroys every one", () => {
    const withoutOverload = makeGame(["Vandalblast"]);
    withMana(withoutOverload, A, 1);
    const oppArtifact = withoutOverload.debugSpawn("Arcane Signet", B);
    const vandal1 = withoutOverload
      .handOf(A)
      .find((id) => withoutOverload.state.objects[id]?.cardName === "Vandalblast")!;
    withoutOverload.dispatch({
      type: "cast-spell",
      player: A,
      card: vandal1,
      targets: [{ kind: "object", object: oppArtifact }],
    });
    settle(withoutOverload);
    expect(withoutOverload.state.objects[oppArtifact]?.zone).toBe("graveyard");

    const overloaded = makeGame(["Vandalblast"]);
    withMana(overloaded, A, 5);
    const opp1 = overloaded.debugSpawn("Arcane Signet", B);
    const opp2 = overloaded.debugSpawn("Sol Ring", B);
    const mine = overloaded.debugSpawn("Sol Ring", A);
    const vandal2 = overloaded
      .handOf(A)
      .find((id) => overloaded.state.objects[id]?.cardName === "Vandalblast")!;
    overloaded.dispatch({ type: "cast-spell", player: A, card: vandal2, overload: true });
    settle(overloaded);
    expect(overloaded.state.objects[opp1]?.zone).toBe("graveyard");
    expect(overloaded.state.objects[opp2]?.zone).toBe("graveyard");
    expect(overloaded.state.objects[mine]?.zone).toBe("battlefield");
  });
});

describe("Damn", () => {
  it("overloaded destroys every creature, yours included (a wrath, not an edict)", () => {
    const game = makeGame(["Damn"], []);
    withMana(game, A, 4);
    const mine = game.debugSpawn("Prodigal Sorcerer", A);
    const theirs = game.debugSpawn("Prodigal Sorcerer", B);
    const damn = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Damn")!;

    game.dispatch({ type: "cast-spell", player: A, card: damn, overload: true });
    settle(game);

    expect(game.state.objects[mine]?.zone).toBe("graveyard");
    expect(game.state.objects[theirs]?.zone).toBe("graveyard");
  });

  it("can't be cast for its overload cost without enough mana", () => {
    const game = makeGame(["Damn"], []);
    // Only enough for the unkicked {B}{B}, not the overload {2}{W}{W}.
    game.debugSpawn("Swamp", A);
    game.debugSpawn("Swamp", A);
    const damn = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Damn")!;
    const overloadAction = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === damn && a.overload === true);
    expect(overloadAction).toBeUndefined();
  });
});
