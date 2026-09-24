/**
 * Kess, Dissident Mage — a once-a-turn, your-turn-only permission to cast an
 * instant or sorcery from your graveyard, and the general piece behind it: a
 * spell marked as it's cast (`castFromGraveyard.exileAfterwards` →
 * `GameObject.exileIfWouldGoToGraveyard`) is exiled instead of being put into
 * its owner's graveyard however it leaves the stack.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId, type ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });

const untappedLands = (game: Game, n: number) => {
  for (const kind of ["Swamp", "Island", "Mountain"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  untappedLands(game, n);
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

const graveyardCasts = (game: Game) =>
  game
    .legalActions(A)
    .filter((a) => a.kind === "cast-spell" && a.via === "graveyard-permission")
    .map((a) => (a.kind === "cast-spell" ? a.card : null));

const boltFromGraveyard = (game: Game, bolt: ObjectId) =>
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: bolt,
    targets: [{ kind: "player", player: B }],
    via: "graveyard-permission",
  });

describe("Kess, Dissident Mage", () => {
  it("offers instants and sorceries in your own graveyard, nothing else", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const sorcery = game.debugSpawn("Sign in Blood", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Lightning Bolt", B, "graveyard");

    expect(new Set(graveyardCasts(game))).toEqual(new Set([bolt, sorcery]));
  });

  it("exiles a spell cast this way as it resolves, once a turn", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const second = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    settle(game);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[bolt].zone).toBe("exile");
    expect(game.state.objects[bolt].exileIfWouldGoToGraveyard).toBeUndefined();
    // One spell a turn: the second Bolt is still there, the permission isn't.
    expect(graveyardCasts(game)).toEqual([]);
    expect(game.state.objects[second].zone).toBe("graveyard");

    const turn = game.state.turn.number;
    game.advanceUntil(
      (s) =>
        (s.turn.number > turn + 1 && s.priority.holder === A && s.turn.step === "precombat-main") ||
        s.result.over,
    );
    untappedLands(game, 1);
    expect(graveyardCasts(game)).toEqual([second]);
  });

  it("can't be used on an opponent's turn, even for an instant", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    game.debugSpawn("Lightning Bolt", A, "graveyard");

    game.advanceUntil((s) => (s.priority.holder === A && s.turn.number === 2) || s.result.over);
    expect(game.state.turn.number).toBe(2);
    expect(graveyardCasts(game)).toEqual([]);
  });

  it("exiles a countered spell cast this way", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    expect(game.state.objects[bolt].zone).toBe("stack");
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [
      { kind: "object", object: bolt },
    ]);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("exiles a spell cast this way that fizzles", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: bears }],
      via: "graveyard-permission",
    });
    game.debugApplyEffect(B, { kind: "return-to-hand", target: 0 }, [
      { kind: "object", object: bears },
    ]);
    settle(game);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("still exiles the spell if Kess leaves before it resolves", () => {
    const game = makeGame();
    openWith(game, 3);
    const kess = game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [
      { kind: "object", object: kess },
    ]);
    expect(game.state.objects[kess].zone).toBe("graveyard");
    settle(game);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("leaves a spell cast from hand alone", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
  it("lets a Remanded spell go to its owner's hand, unmarked", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    // The replacement only replaces a move to the graveyard; Remand's is to hand.
    game.debugApplyEffect(B, { kind: "counter", target: 0, into: "hand" }, [
      { kind: "object", object: bolt },
    ]);
    expect(game.state.objects[bolt].zone).toBe("hand");
    expect(game.state.objects[bolt].exileIfWouldGoToGraveyard).toBeUndefined();

    // Cast again from hand, it's an ordinary spell and goes to the graveyard.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("marks only the spell cast this way, not a copy of it", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    game.debugApplyEffect(A, { kind: "copy-spell", target: 0 }, [
      { kind: "object", object: bolt },
    ]);
    const copies = game.state.zones.shared.stack.filter((id) => game.state.objects[id]?.isCopy);
    expect(copies).toHaveLength(1);
    expect(game.state.objects[copies[0]].exileIfWouldGoToGraveyard).toBeUndefined();
    settle(game);
    expect(game.state.players[B].life).toBe(14);
    expect(game.state.objects[bolt].zone).toBe("exile");
    // The copy ceased to exist rather than being exiled.
    expect(game.state.objects[copies[0]]).toBeUndefined();
  });

  it("isn't spent by casting with flashback, which exiles on its own", () => {
    const game = makeGame();
    openWith(game, 3);
    game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const analysis = game.debugSpawn("Deep Analysis", A, "graveyard");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: analysis,
      targets: [{ kind: "player", player: A }],
      via: "flashback",
    });
    settle(game);
    expect(game.state.objects[analysis].zone).toBe("exile");
    expect(graveyardCasts(game)).toEqual([bolt]);
  });

  it("gives a new Kess a fresh use the same turn", () => {
    const game = makeGame();
    openWith(game, 3);
    const kess = game.debugSpawn("Kess, Dissident Mage", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const second = game.debugSpawn("Lightning Bolt", A, "graveyard");

    boltFromGraveyard(game, bolt);
    settle(game);
    expect(graveyardCasts(game)).toEqual([]);

    // Kess leaves and comes back: a new object (rule 400.7), a new use.
    game.debugApplyEffect(B, { kind: "return-to-hand", target: 0 }, [
      { kind: "object", object: kess },
    ]);
    expect(graveyardCasts(game)).toEqual([]);
    untappedLands(game, 2);
    game.dispatch({ type: "cast-spell", player: A, card: kess, targets: [] });
    settle(game);
    expect(game.state.objects[kess].zone).toBe("battlefield");
    expect(graveyardCasts(game)).toEqual([second]);
  });
});
