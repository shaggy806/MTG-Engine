/**
 * Graveyard cast permissions past Gisa and Geralf's single use
 * (`graveyard-permission.test.ts`):
 *
 * - Muldrotha's per-type allowances, a multi-typed card spending one type of
 *   the player's choosing, and its land allowance still taking the land drop;
 * - the one-shot permission that lives on a card (Silas Renn, Emry) — lapsing
 *   at end of turn, and lost when the card leaves the graveyard and comes back
 *   as a new object;
 * - a choice of grantor when two permissions both apply;
 * - the `exileAfterwards` (Kess) and `payLife` shapes of the static.
 */

import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { createDefaultRegistry } from "../cards.js";
import { defineCard } from "../cards/define.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = (opts: { maxLands?: number; registry?: ReturnType<typeof createDefaultRegistry> } = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: opts.maxLands ?? 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    ...(opts.registry !== undefined ? { registry: opts.registry } : {}),
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  return { game, a, b };
};

const toMain = (game: Game, turn = 1) =>
  game.advanceUntil(
    (s) => s.turn.number === turn && s.priority.holder === A && s.turn.step === "precombat-main",
  );

const addLands = (game: Game, n: number) => {
  for (const kind of ["Swamp", "Island", "Forest"]) {
    for (let i = 0; i < n; i += 1) game.debugSpawn(kind, A, "battlefield");
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

type Offer = Extract<LegalAction, { kind: "cast-spell" } | { kind: "play-land" }>;

/** Every graveyard-permission offer for `card`: the casts and the land plays
 * that carry a grant. */
const offersFor = (game: Game, card: ObjectId): Offer[] =>
  game
    .legalActions(A)
    .filter(
      (a): a is Offer =>
        (a.kind === "cast-spell" && a.via === "graveyard-permission" && a.card === card) ||
        (a.kind === "play-land" && a.card === card && a.graveyardGrant !== undefined),
    );

const typesOffered = (game: Game, card: ObjectId) =>
  offersFor(game, card)
    .map((o) => o.graveyardGrant?.asType)
    .sort();

const castAs = (game: Game, card: ObjectId, offer: Offer): Action =>
  offer.kind === "cast-spell"
    ? {
        type: "cast-spell",
        player: A,
        card,
        targets: [],
        via: "graveyard-permission",
        ...(offer.face !== undefined ? { face: offer.face } : {}),
        ...(offer.graveyardGrant !== undefined ? { graveyardGrant: offer.graveyardGrant } : {}),
      }
    : {
        type: "play-land",
        player: A,
        card,
        ...(offer.face !== undefined ? { face: offer.face } : {}),
        ...(offer.graveyardGrant !== undefined ? { graveyardGrant: offer.graveyardGrant } : {}),
      };

const moveObject = (game: Game, id: ObjectId, to: string) =>
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, to);

describe("Muldrotha, the Gravetide", () => {
  it("offers a multi-typed card once per type, and spends only the one chosen", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 4);
    game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const myr2 = game.debugSpawn("Darksteel Myr", A, "graveyard");

    expect(typesOffered(game, myr)).toEqual(["artifact", "creature"]);
    expect(typesOffered(game, ring)).toEqual(["artifact"]);

    const asArtifact = offersFor(game, myr).find((o) => o.graveyardGrant?.asType === "artifact")!;
    game.dispatch(castAs(game, myr, asArtifact));
    settle(game);
    expect(game.state.objects[myr].zone).toBe("battlefield");

    // The artifact allowance is gone: Sol Ring can't come back, and the other
    // Myr only as a creature.
    expect(offersFor(game, ring)).toEqual([]);
    expect(typesOffered(game, myr2)).toEqual(["creature"]);
    game.dispatch(castAs(game, myr2, offersFor(game, myr2)[0]));
    settle(game);
    expect(game.state.objects[myr2].zone).toBe("battlefield");
    expect(offersFor(game, myr2)).toEqual([]);
  });

  it("refuses a type the card doesn't have, or one already spent", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 4);
    const muldrotha = game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    const action = (asType: "enchantment" | "creature"): Action => ({
      type: "cast-spell",
      player: A,
      card: myr,
      targets: [],
      via: "graveyard-permission",
      graveyardGrant: { source: muldrotha, asType },
    });
    expect(game.canDispatch(action("enchantment"))).not.toBeNull();
    game.state.objects[muldrotha].graveyardCastTypesUsedThisTurn = ["creature"];
    expect(game.canDispatch(action("creature"))).not.toBeNull();
    // A grant on anything but a graveyard-permission cast is refused.
    const inHand = game.debugSpawn("Darksteel Myr", A, "hand");
    const plain: Action = { type: "cast-spell", player: A, card: inHand, targets: [] };
    expect(game.canDispatch(plain)).toBeNull();
    expect(
      game.canDispatch({ ...plain, graveyardGrant: { source: muldrotha, asType: "artifact" } }),
    ).not.toBeNull();
  });

  it("plays a land from the graveyard with its land allowance, which is also the land drop", () => {
    const { game } = makeGame({ maxLands: 1 });
    toMain(game);
    addLands(game, 2);
    game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const citadel = game.debugSpawn("Darksteel Citadel", A, "graveyard");
    const citadel2 = game.debugSpawn("Darksteel Citadel", A, "graveyard");

    // An artifact land is played, never cast: only the land allowance.
    const offers = offersFor(game, citadel);
    expect(offers.map((o) => [o.kind, o.graveyardGrant?.asType])).toEqual([["play-land", "land"]]);
    // …offered once, not a second time as an ungranted play.
    expect(
      game.legalActions(A).filter((x) => x.kind === "play-land" && x.card === citadel).length,
    ).toBe(1);
    game.dispatch(castAs(game, citadel, offers[0]));
    expect(game.state.objects[citadel].zone).toBe("battlefield");
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
    expect(offersFor(game, citadel2)).toEqual([]);

    // With the land drop taken from the hand instead, the allowance can't
    // add a second land.
    const next = makeGame({ maxLands: 1 }).game;
    toMain(next);
    next.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const inYard = next.debugSpawn("Darksteel Citadel", A, "graveyard");
    const inHand = next.debugSpawn("Darksteel Citadel", A, "hand");
    next.dispatch({ type: "play-land", player: A, card: inHand });
    expect(offersFor(next, inYard)).toEqual([]);
  });

  it("beside Ramunap Excavator, the land is offered both ways, and the unlimited one is the default", () => {
    const { game } = makeGame();
    toMain(game);
    const muldrotha = game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    game.debugSpawn("Ramunap Excavator", A, "battlefield");
    const citadel = game.debugSpawn("Darksteel Citadel", A, "graveyard");
    const citadel2 = game.debugSpawn("Darksteel Citadel", A, "graveyard");
    const plays = game.legalActions(A).filter((x) => x.kind === "play-land" && x.card === citadel);
    expect(plays.map((x) => (x.kind === "play-land" ? x.graveyardGrant : null))).toEqual([
      { source: muldrotha, asType: "land" },
      undefined,
    ]);
    // Named no grant: Ramunap's, which spends nothing of Muldrotha's.
    game.dispatch({ type: "play-land", player: A, card: citadel });
    expect(game.state.objects[muldrotha].graveyardCastTypesUsedThisTurn).toBeUndefined();
    expect(typesOffered(game, citadel2)).toEqual(["land"]);
  });

  it("offers each face of a modal double-faced card: the creature cast, the land played", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 3);
    game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const mammoth = game.debugSpawn("Kazandu Mammoth", A, "graveyard");
    const offers = offersFor(game, mammoth);
    expect(offers.map((o) => [o.kind, o.face, o.graveyardGrant?.asType])).toEqual([
      ["cast-spell", 0, "creature"],
      ["play-land", 1, "land"],
    ]);
    game.dispatch(castAs(game, mammoth, offers[1]));
    expect(game.state.objects[mammoth].zone).toBe("battlefield");
    expect(game.state.objects[mammoth].face).toBe(1);
  });

  it("offers nothing that isn't a permanent, and nothing on an opponent's turn", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 4);
    game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    expect(offersFor(game, bolt)).toEqual([]);
    expect(offersFor(game, myr).length).toBe(2);

    game.advanceUntil((s) => (s.turn.number === 2 && s.priority.holder === A) || s.result.over);
    expect(game.state.turn.number).toBe(2);
    expect(offersFor(game, myr)).toEqual([]);
  });

  it("a Muldrotha that leaves and returns is a new object with fresh allowances", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 4);
    const muldrotha = game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const ring2 = game.debugSpawn("Sol Ring", A, "graveyard");
    game.dispatch(castAs(game, ring, offersFor(game, ring)[0]));
    settle(game);
    expect(offersFor(game, ring2)).toEqual([]);

    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: muldrotha }]);
    settle(game);
    expect(game.state.objects[muldrotha].zone).toBe("battlefield");
    expect(typesOffered(game, ring2)).toEqual(["artifact"]);
  });

  it("resets its allowances at the start of your next turn", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 4);
    game.debugSpawn("Muldrotha, the Gravetide", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const ring2 = game.debugSpawn("Sol Ring", A, "graveyard");
    game.dispatch(castAs(game, ring, offersFor(game, ring)[0]));
    settle(game);
    expect(offersFor(game, ring2)).toEqual([]);
    toMain(game, 3);
    expect(typesOffered(game, ring2)).toEqual(["artifact"]);
  });
});

describe("a choice of grantor", () => {
  it("offers a card once per permission that applies, and spends the one chosen", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 8);
    const gisa = game.debugSpawn("Gisa and Geralf", A, "battlefield");
    const karador = game.debugSpawn("Karador, Ghost Chieftain", A, "battlefield");
    const zombie = game.debugSpawn("Vengeful Dead", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");

    expect(offersFor(game, zombie).map((o) => o.graveyardGrant?.source).sort()).toEqual(
      [gisa, karador].sort(),
    );
    // Only Karador reaches a non-Zombie.
    expect(offersFor(game, bears).map((o) => o.graveyardGrant?.source)).toEqual([karador]);

    // Spend Gisa's on the Zombie, and Karador's is still there for the Bears.
    const viaGisa = offersFor(game, zombie).find((o) => o.graveyardGrant?.source === gisa)!;
    game.dispatch(castAs(game, zombie, viaGisa));
    settle(game);
    expect(game.state.objects[zombie].zone).toBe("battlefield");
    expect(offersFor(game, bears).map((o) => o.graveyardGrant?.source)).toEqual([karador]);
  });
});

describe("Silas Renn, Seeker Adept", () => {
  it("lets you cast the targeted artifact card this turn, after it connects", () => {
    const { game, a } = makeGame();
    toMain(game);
    addLands(game, 2);
    const silas = game.debugSpawn("Silas Renn, Seeker Adept", A, "battlefield", {
      summoningSick: false,
    });
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    expect(offersFor(game, ring)).toEqual([]);

    a.declareAttackersFn = () => [{ attacker: silas, defender: B }];
    game.advanceUntil(
      (s: GameState) => s.turn.step === "postcombat-main" && s.priority.holder === A,
    );
    settle(game);
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[ring].graveyardCastPermission).toEqual({ player: A, turn: 1 });

    const offers = offersFor(game, ring);
    expect(offers.map((o) => o.graveyardGrant)).toEqual([{ source: ring }]);
    game.dispatch(castAs(game, ring, offers[0]));
    settle(game);
    expect(game.state.objects[ring].zone).toBe("battlefield");
  });
});

describe("Emry, Lurker of the Loch", () => {
  it("costs {1} less per artifact you control, and mills four as it enters", () => {
    const { game } = makeGame();
    toMain(game);
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Sol Ring", A, "battlefield");
    game.debugSpawn("Darksteel Myr", A, "battlefield");
    game.debugSpawn("Darksteel Myr", B, "battlefield"); // not yours: doesn't count
    const emry = game.debugSpawn("Emry, Lurker of the Loch", A, "hand");
    // {2}{U} less two: the Island alone pays, Sol Ring untouched.
    const cast = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === emry);
    expect(cast).toBeDefined();
    const library = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: emry, targets: [] });
    settle(game);
    expect(game.state.objects[emry].zone).toBe("battlefield");
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 4);
  });

  it("{T}: the chosen artifact card may be cast this turn, and the permission lapses at end of turn", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 3);
    const emry = game.debugSpawn("Emry, Lurker of the Loch", A, "battlefield", {
      summoningSick: false,
    });
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    const other = game.debugSpawn("Darksteel Myr", A, "graveyard");

    const tap = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === emry);
    expect(tap?.kind === "activate-ability" && tap.targetOptions[0]).toEqual([
      { kind: "object", object: myr },
      { kind: "object", object: other },
    ]);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: emry,
      abilityIndex: 0,
      targets: [{ kind: "object", object: myr }],
    });
    settle(game);
    // Only the chosen card.
    expect(offersFor(game, myr).map((o) => o.graveyardGrant)).toEqual([{ source: myr }]);
    expect(offersFor(game, other)).toEqual([]);

    // Unused, it lapses: nothing on the next turn of yours.
    toMain(game, 3);
    expect(offersFor(game, myr)).toEqual([]);
    expect(game.canDispatch({
      type: "cast-spell",
      player: A,
      card: myr,
      targets: [],
      via: "graveyard-permission",
    })).not.toBeNull();
  });

  it("the permission doesn't follow the card out of the graveyard and back", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 3);
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    game.debugApplyEffect(A, { kind: "grant-graveyard-cast", target: 0 }, [
      { kind: "object", object: myr },
    ]);
    expect(offersFor(game, myr).length).toBe(1);

    moveObject(game, myr, "exile");
    moveObject(game, myr, "graveyard");
    expect(game.state.objects[myr].zone).toBe("graveyard");
    expect(offersFor(game, myr)).toEqual([]);
  });

  it("outlives Emry: the card keeps the permission after Emry leaves", () => {
    const { game } = makeGame();
    toMain(game);
    addLands(game, 3);
    const emry = game.debugSpawn("Emry, Lurker of the Loch", A, "battlefield", {
      summoningSick: false,
    });
    const myr = game.debugSpawn("Darksteel Myr", A, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: emry,
      abilityIndex: 0,
      targets: [{ kind: "object", object: myr }],
    });
    settle(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: emry }]);
    settle(game);
    expect(offersFor(game, myr).length).toBe(1);
  });
});

describe("the static's other shapes", () => {
  const registry = createDefaultRegistry();
  // Test-only grantors: Kess's shape (once per your turn, instants and
  // sorceries, exiled afterwards) and an extra life cost.
  registry.register(
    defineCard({
      name: "Test Kess Grantor",
      manaCost: "{2}",
      types: ["artifact"],
      static: [
        {
          affects: { scope: "self" },
          castFromGraveyard: {
            filter: { typesAnyOf: ["instant", "sorcery"] },
            oncePerTurn: true,
            yourTurnOnly: true,
            exileAfterwards: true,
          },
          text: "",
        },
      ],
    }),
  );
  registry.register(
    defineCard({
      name: "Test Life Grantor",
      manaCost: "{2}",
      types: ["artifact"],
      static: [
        {
          affects: { scope: "self" },
          castFromGraveyard: { filter: { type: "artifact" }, payLife: 3 },
          text: "",
        },
      ],
    }),
  );

  it("exileAfterwards: a spell cast this way is exiled instead of going to the graveyard", () => {
    const { game } = makeGame({ registry });
    toMain(game);
    addLands(game, 2);
    game.debugSpawn("Test Kess Grantor", A, "battlefield");
    game.debugSpawn("Mountain", A, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
      via: "graveyard-permission",
    });
    settle(game);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });

  it("payLife: the life is paid on top of the mana, and gates the offer", () => {
    const { game } = makeGame({ registry });
    toMain(game);
    addLands(game, 2);
    game.debugSpawn("Test Life Grantor", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const ring2 = game.debugSpawn("Sol Ring", A, "graveyard");
    game.dispatch(castAs(game, ring, offersFor(game, ring)[0]));
    settle(game);
    expect(game.state.objects[ring].zone).toBe("battlefield");
    expect(game.state.players[A].life).toBe(17);

    game.state.players[A].life = 2;
    expect(offersFor(game, ring2)).toEqual([]);
  });
});
