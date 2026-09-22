import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * A compacted token stack is `stackCount` permanents, not one, everywhere the
 * engine counts permanents (see `permanentCount`). Counting objects instead
 * broke Krenko, Mob Boss outright: once his tokens folded into a stack he saw
 * "himself plus one Goblin" forever and made two tokens a turn.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

/** Real tokens, made the way a card makes them: a batch of eight or more
 * compacts into one stack object that carries `isToken`. */
function stackOf(game: Game, name: string, player: PlayerId, count: number): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} ${name}`);
  }
  return stack;
}

function tokens(game: Game, name: string): number {
  return game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === name)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
}

function resolveStack(game: Game): void {
  for (let i = 0; i < 200 && game.state.zones.shared.stack.length > 0; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "commander-replacement") {
      game.dispatch({ type: "commander-replacement", player: awaiting.player, toCommandZone: false });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
}

describe("counting permanents counts every token in a stack", () => {
  it("Krenko, Mob Boss doubles his Goblins every activation", () => {
    const game = table();
    const krenko = spawn(game, "Krenko, Mob Boss", A);
    const made: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const before = tokens(game, "Goblin Token");
      game.state.objects[krenko].tapped = false;
      game.dispatch({ type: "activate-ability", player: A, source: krenko, abilityIndex: 0, targets: [] });
      resolveStack(game);
      made.push(tokens(game, "Goblin Token") - before);
    }
    // X is the number of Goblins you control, Krenko included.
    expect(made).toEqual([1, 2, 4, 8, 16, 32]);
    expect(tokens(game, "Goblin Token")).toBe(63);
  });

  it("a cost reduction per creature sees the whole stack (Blasphemous Act)", () => {
    const game = table();
    stackOf(game, "Goblin Token", B, 12);
    spawn(game, "Mountain", A);
    const act = game.debugSpawn("Blasphemous Act", A, "hand");
    // {8}{R}, {1} less per creature on the battlefield: 12 creatures → {R}.
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === act),
    ).toBe(true);
  });

  it("a static condition's threshold sees the whole stack (Bloodline Keeper)", () => {
    const game = table();
    const keeper = spawn(game, "Bloodline Keeper", A);
    spawn(game, "Swamp", A);
    // "Activate only if you control five or more Vampires": a stack of eight
    // Vampire tokens is eight, where counting objects saw two.
    stackOf(game, "Vampire Token", A, 8);
    expect(
      game
        .legalActions(A)
        .some((a) => a.kind === "activate-ability" && a.source === keeper && a.abilityIndex === 1),
    ).toBe(true);
  });

  it("a count-scaled bonus sees the whole stack (Skycat Sovereign, \"each other\")", () => {
    const game = table();
    const skycat = spawn(game, "Skycat Sovereign", A);
    stackOf(game, "Cat Bird Token", A, 8);
    // 1/1, +1/+1 for each other creature you control with flying.
    expect(game.viewFor(A).objects[skycat]?.power).toBe(9);
  });
});

describe("creatures that died this turn", () => {
  it("a destroyed stack is that many deaths", () => {
    const game = table();
    stackOf(game, "Goblin Token", A, 9);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Wrath of God", A, "hand"),
      targets: [],
    });
    resolveStack(game);
    expect(game.state.players[A].creaturesDiedThisTurn).toBe(9);
    expect(game.state.creaturesDiedThisTurn).toBe(9);
  });

  for (const [toCommandZone, died] of [
    [true, 0],
    [false, 1],
  ] as const) {
    it(`a commander whose owner answers ${toCommandZone ? "command zone" : "graveyard"} counts ${died}, once`, () => {
      const game = table();
      const krenko = spawn(game, "Krenko, Mob Boss", B);
      game.state.objects[krenko].isCommander = true;
      for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: game.debugSpawn("Murder", A, "hand"),
        targets: [{ kind: "object", object: krenko }],
      });
      for (let i = 0; i < 20 && game.state.zones.shared.stack.length > 0; i += 1) {
        const awaiting = game.state.awaiting;
        if (awaiting?.kind === "commander-replacement") {
          game.dispatch({ type: "commander-replacement", player: B, toCommandZone });
        } else {
          game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
        }
      }
      if (game.state.awaiting?.kind === "commander-replacement") {
        game.dispatch({ type: "commander-replacement", player: B, toCommandZone });
      }
      expect(game.state.objects[krenko].zone).toBe(toCommandZone ? "command" : "graveyard");
      expect(game.state.players[B].creaturesDiedThisTurn).toBe(died);
    });
  }

  it("a creature exiled by Rest in Peace instead didn't die", () => {
    const game = table();
    spawn(game, "Rest in Peace", A);
    const bears = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Murder", A, "hand"),
      targets: [{ kind: "object", object: bears }],
    });
    resolveStack(game);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("Rest in Peace exiles tokens too, so a token stack under it didn't die", () => {
    const game = table();
    spawn(game, "Rest in Peace", A);
    stackOf(game, "Goblin Token", B, 9);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Wrath of God", A, "hand"),
      targets: [],
    });
    resolveStack(game);
    expect(tokens(game, "Goblin Token")).toBe(0);
    expect(game.state.creaturesDiedThisTurn).toBe(0);
  });

  it("Anafenza's \"creature card\" leaves tokens alone", () => {
    const game = table();
    spawn(game, "Anafenza, the Foremost", A);
    const goblins = stackOf(game, "Goblin Token", B, 9);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Wrath of God", A, "hand"),
      targets: [],
    });
    resolveStack(game);
    // Died (into a graveyard, then ceased to exist), not exiled.
    expect(game.state.objects[goblins]?.zone ?? "gone").not.toBe("exile");
    expect(game.state.players[B].creaturesDiedThisTurn).toBe(9);
  });
});

describe("per-unit effects stay bounded however big a stack gets", () => {
  it("drawing a card per creature stops once the library is empty", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 8);
    game.state.objects[stack].stackCount = 1_000_000;
    const before = game.events.length;
    game.debugApplyEffect(A, {
      kind: "draw",
      amount: { countOf: { type: "creature", controlledBy: "you" } },
    });
    expect(game.state.zones.perPlayer[A].library).toHaveLength(0);
    expect(game.state.players[A].attemptedDrawFromEmptyLibrary).toBe(true);
    expect(game.events.length - before).toBeLessThan(200);
  });

  it("a non-stacking token made once per creature is capped", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 8);
    game.state.objects[stack].stackCount = 1_000_000;
    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Treasure Token",
      count: { countOf: { type: "creature", controlledBy: "you" } },
    });
    expect(tokens(game, "Treasure Token")).toBe(Game.MAX_EFFECT_INSTANCES);
  });
});
