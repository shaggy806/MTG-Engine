/**
 * Additional costs & kicker (rule 601.2f/h, 702.33) — needed-cards P8.
 *
 * `CardDefinition.additionalCost` is a *mandatory* extra cost paid as the spell
 * is cast (Harrow, Crop Rotation: "sacrifice a land") — so it happens even if
 * the spell is countered, and the spell can't be cast without it.
 * `CardDefinition.kicker` is an *optional* one announced before targets are
 * chosen (Tear Asunder), which is why `legalActions` enumerates the kicked and
 * unkicked casts as two separate entries with their own costs and targets.
 * Plus the small `exile-graveyard` effect (Bojuka Bog).
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** `library` sits below the opening hand + early draws, so it stays to search. */
const mkGame = (aHand: readonly string[], library: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [
          ...aHand,
          ...Array(12).fill("Forest"),
          ...library,
          ...Array(28).fill("Forest"),
        ],
      },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each]?.cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const landsOf = (game: Game, player: typeof A): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].controller === player &&
      game.characteristics(id).types.includes("land"),
  );
const castActionsFor = (game: Game, player: typeof A, name: string) =>
  game
    .legalActions(player)
    .filter((la) => la.kind === "cast-spell" && la.cardName === name);

describe("additional cost — sacrifice a land (Harrow, Crop Rotation)", () => {
  it("isn't castable at all with no land to sacrifice", () => {
    const { game } = mkGame(["Crop Rotation"], ["Mountain"]);
    game.advanceUntil(toPrecombat);
    // Mana from a creature, so there's genuinely no land on the battlefield.
    game.debugSpawn("Llanowar Elves", A, "battlefield", { summoningSick: false });

    expect(castActionsFor(game, A, "Crop Rotation")).toHaveLength(0);
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Crop Rotation"),
      }),
    ).toThrow(/nothing to sacrifice/);
  });

  it("offers every land as a choice and sacrifices the one named", () => {
    const { game } = mkGame(["Crop Rotation"], ["Mountain"]);
    game.advanceUntil(toPrecombat);
    const forest = game.debugSpawn("Forest", A, "battlefield");
    const island = game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield"); // not a land — not a choice

    const [action] = castActionsFor(game, A, "Crop Rotation");
    expect(action.kind === "cast-spell" && action.sacrifice?.choices).toEqual(
      expect.arrayContaining([forest, island]),
    );
    expect(action.kind === "cast-spell" && action.sacrifice?.choices).toHaveLength(2);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Crop Rotation"),
      sacrifice: island,
    });

    // Paid on cast — the Island is already gone while the spell is on the stack.
    expect(game.state.objects[island].zone).toBe("graveyard");
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(game.stack).toHaveLength(1);
  });

  it("rejects a permanent that doesn't match the cost's filter", () => {
    const { game } = mkGame(["Crop Rotation"], ["Mountain"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Forest", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Crop Rotation"),
        sacrifice: bear,
      }),
    ).toThrow(/cannot pay/);
  });

  it("can tap the very land it sacrifices (rule 601.2g)", () => {
    // Crop Rotation costs {G} and one Forest is the only land: tap it for mana
    // first, then sacrifice it. Both halves of the cost come from one permanent.
    const { game, a } = mkGame(["Crop Rotation"], ["Mountain"]);
    game.advanceUntil(toPrecombat);
    const forest = game.debugSpawn("Forest", A, "battlefield");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);

    expect(castActionsFor(game, A, "Crop Rotation")).toHaveLength(1);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Crop Rotation"),
      sacrifice: forest,
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[forest].zone).toBe("graveyard");
    // One land sacrificed, one searched up: back to a single land, untapped
    // (Crop Rotation, unlike Harrow, doesn't tap what it finds).
    const lands = landsOf(game, A);
    expect(lands).toHaveLength(1);
    expect(lands[0]).not.toBe(forest);
    expect(game.state.objects[lands[0]].tapped).toBe(false);
  });

  it("keeps the sacrifice even when the spell is countered (601.2h)", () => {
    const { game } = mkGame(["Harrow"], ["Mountain", "Swamp"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const doomed = game.debugSpawn("Island", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", B, "battlefield");
    game.debugSpawn("Counterspell", B, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Harrow"),
      sacrifice: doomed,
    });
    const harrow = game.stack[0];
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: named(game, game.handOf(B), "Counterspell"),
      targets: [{ kind: "object", object: harrow }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[harrow].zone).toBe("graveyard"); // countered
    expect(game.state.objects[doomed].zone).toBe("graveyard"); // still paid
    // And nothing was searched up — three Forests left, the Island gone.
    expect(landsOf(game, A)).toHaveLength(3);
  });

  it("Harrow fetches two basics tapped", () => {
    const { game, a } = mkGame(["Harrow"], ["Mountain", "Swamp"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const doomed = game.debugSpawn("Island", A, "battlefield");
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    const before = new Set(landsOf(game, A));

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Harrow"),
      sacrifice: doomed,
    });
    game.advanceUntil(quiet);

    // 4 lands - 1 sacrificed + 2 searched up = 5, and both new ones entered
    // tapped (the pre-existing ones are tapped too, but from paying {2}{G}).
    const lands = landsOf(game, A);
    expect(lands).toHaveLength(5);
    const fetched = lands.filter((id) => !before.has(id));
    expect(fetched).toHaveLength(2);
    for (const id of fetched) expect(game.state.objects[id].tapped).toBe(true);
  });
});

describe("kicker — Tear Asunder", () => {
  it("offers the kicked and unkicked casts as separate actions", () => {
    const { game } = mkGame(["Tear Asunder"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Forest", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Sol Ring", B, "battlefield"); // an artifact to hit either way

    const actions = castActionsFor(game, A, "Tear Asunder");
    expect(actions).toHaveLength(2);
    const kicked = actions.find((la) => la.kind === "cast-spell" && la.kicked === true);
    const plain = actions.find((la) => la.kind === "cast-spell" && la.kicked !== true);
    expect(kicked?.kind === "cast-spell" && kicked.kickerCost).toBe("{2}");
    expect(plain?.kind === "cast-spell" && plain.targetSpecs).toEqual([
      "artifact-or-enchantment",
    ]);
    expect(kicked?.kind === "cast-spell" && kicked.targetSpecs).toEqual(["permanent"]);
  });

  it("only offers the unkicked cast when the kicker is unaffordable", () => {
    const { game } = mkGame(["Tear Asunder"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield"); // exactly {B}{G}, no kicker
    game.debugSpawn("Sol Ring", B, "battlefield");

    const actions = castActionsFor(game, A, "Tear Asunder");
    expect(actions).toHaveLength(1);
    expect(actions[0].kind === "cast-spell" && actions[0].kicked).toBeUndefined();
  });

  it("unkicked can't touch a creature; kicked exiles it", () => {
    const { game } = mkGame(["Tear Asunder", "Tear Asunder"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Forest", A, "battlefield");
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Sol Ring", B, "battlefield"); // keeps the unkicked cast legal

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Tear Asunder"),
        targets: [{ kind: "object", object: bear }],
      }),
    ).toThrow(/illegal target/);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Tear Asunder"),
      kicked: true,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("exile");
  });

  it("charges the kicker cost on top of the printed one", () => {
    const { game } = mkGame(["Tear Asunder"]);
    game.advanceUntil(toPrecombat);
    const lands = [
      game.debugSpawn("Swamp", A, "battlefield"),
      game.debugSpawn("Forest", A, "battlefield"),
      game.debugSpawn("Swamp", A, "battlefield"),
      game.debugSpawn("Swamp", A, "battlefield"),
      game.debugSpawn("Swamp", A, "battlefield"),
    ];
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Tear Asunder"),
      kicked: true,
      targets: [{ kind: "object", object: bear }],
    });

    // {B}{G} + the {2} kicker = four lands tapped, one spare.
    expect(lands.filter((id) => game.state.objects[id].tapped)).toHaveLength(4);
  });

  it("refuses `kicked` on a card with no kicker", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Mountain", A, "battlefield");

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: named(game, game.handOf(A), "Lightning Bolt"),
        kicked: true,
        targets: [{ kind: "player", player: B }],
      }),
    ).toThrow(/no kicker/);
  });
});

describe("exile-graveyard — Bojuka Bog", () => {
  it("exiles the whole of a target player's graveyard, leaving others alone", () => {
    const { game, a } = mkGame(["Bojuka Bog"]);
    game.advanceUntil(toPrecombat);
    const theirs = [
      game.debugSpawn("Grizzly Bears", B, "graveyard"),
      game.debugSpawn("Lightning Bolt", B, "graveyard"),
      game.debugSpawn("Island", B, "graveyard"),
    ];
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Bojuka Bog"),
    });
    game.advanceUntil(quiet);

    for (const id of theirs) expect(game.state.objects[id].zone).toBe("exile");
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
    expect(game.state.objects[mine].zone).toBe("graveyard");
  });

  it("enters tapped and taps for {B}", () => {
    const { game } = mkGame(["Bojuka Bog"]);
    game.advanceUntil(toPrecombat);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Bojuka Bog"),
    });
    game.advanceUntil(quiet);

    const bog = named(game, game.battlefield, "Bojuka Bog");
    expect(game.state.objects[bog].tapped).toBe(true);
  });
});
