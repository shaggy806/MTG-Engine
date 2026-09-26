import { describe, expect, it } from "vitest";

import { blockingViolations } from "../combat/blocking.js";
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

  // It dies either way: rule 903.9a offers the command zone once it's in the
  // graveyard.
  for (const toCommandZone of [true, false]) {
    it(`a commander whose owner answers ${toCommandZone ? "command zone" : "graveyard"} counts 1, once`, () => {
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
      expect(game.state.players[B].creaturesDiedThisTurn).toBe(1);
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

describe("an effect on each permanent reaches every token in a stack", () => {
  it("a watcher triggers once per token when a stack dies (Pitiless Plunderer)", () => {
    const game = table();
    spawn(game, "Pitiless Plunderer", A);
    stackOf(game, "Goblin Token", A, 9);
    for (let i = 0; i < 2; i += 1) spawn(game, "Mountain", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Pyroclasm", A, "hand"),
      targets: [],
    });
    resolveStack(game);
    expect(tokens(game, "Goblin Token")).toBe(0);
    expect(tokens(game, "Treasure Token")).toBe(9);
  });

  it("an overloaded Cyclonic Rift returns the whole stack", () => {
    const game = table();
    stackOf(game, "Goblin Token", B, 9);
    game.debugApplyEffect(A, { kind: "return-to-hand-all", filter: { controlledBy: "opponent" } });
    expect(tokens(game, "Goblin Token")).toBe(0);
  });

  it("a counter on each creature lands on every token", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 9);
    game.debugApplyEffect(A, {
      kind: "add-counter-all",
      filter: { type: "creature", controlledBy: "you" },
      counter: "+1/+1",
      amount: 1,
    });
    expect(tokens(game, "Goblin Token")).toBe(9);
    expect(game.state.objects[stack].stackCount).toBe(9);
    expect(game.viewFor(A).objects[stack]?.power).toBe(2);
  });

  it("each creature deals damage to its controller: a stack is that many sources", () => {
    const game = table();
    stackOf(game, "Goblin Token", B, 9);
    game.debugApplyEffect(A, {
      kind: "creatures-damage-controllers",
      filter: { type: "creature" },
      amount: 1,
    });
    expect(game.state.players[B].life).toBe(20 - 9);
  });

  it("a stack satisfies menace on its own", () => {
    const offer = {
      kind: "declare-blockers" as const,
      eligible: [{ blocker: "stack" as ObjectId, canBlock: ["brute" as ObjectId], copies: 8 }],
      menaceAttackers: ["brute" as ObjectId],
      mustBlock: [],
    };
    expect(
      blockingViolations([{ blocker: "stack" as ObjectId, attacker: "brute" as ObjectId }], offer),
    ).toEqual([]);
  });

  it("Demand Answers sacrifices the artifact its caster names, one token of a stack", () => {
    const game = table();
    const thopters = stackOf(game, "Thopter Token", A, 9);
    for (let i = 0; i < 2; i += 1) spawn(game, "Mountain", A);
    const card = game.debugSpawn("Demand Answers", A, "hand");
    const offer = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === card && a.costOption === 0);
    expect(offer?.kind === "cast-spell" && offer.sacrifice?.choices).toContain(thopters);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [],
      costOption: 0,
      sacrifice: thopters,
    });
    expect(tokens(game, "Thopter Token")).toBe(8);
  });

  it("tokens granted an activated ability are woken into separate objects (Cryptolith Rite)", () => {
    const game = table();
    stackOf(game, "Goblin Token", A, 8);
    spawn(game, "Cryptolith Rite", A);
    // Both players pass, the step ends, and the next priority window runs
    // state-based actions.
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    const goblins = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    );
    expect(goblins).toHaveLength(8);
    expect(goblins.every((id) => (game.state.objects[id].stackCount ?? 1) === 1)).toBe(true);
  });
});
