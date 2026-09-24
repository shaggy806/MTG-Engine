/**
 * Teval, the Balanced Scale (EDHREC commander rank 12): an attack trigger
 * that mills three and then may return a land card from the graveyard to the
 * battlefield tapped, and the batched `leaves-graveyard` trigger — "whenever
 * one or more cards leave your graveyard, create a 2/2 black Zombie Druid
 * creature token", which triggers once for cards that leave at the same time
 * (its ruling).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const TEVAL = "Teval, the Balanced Scale";
const DRUID = "Zombie Druid Token";

const registry = createDefaultRegistry();

const makeGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

const settled = (s: GameState): boolean =>
  s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 0 && s.awaiting === null;

const druidIds = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === DRUID && game.state.objects[id].controller === player,
  );
/** How many Zombie Druids — a second one made later may join the first as a
 * token stack (`GameObject.stackCount`), so this counts tokens, not objects. */
const druids = (game: Game, player: PlayerId = A): number =>
  druidIds(game, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

const teval = (game: Game, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(TEVAL, player, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};

/** Attack with Teval and stop when its attack trigger asks which land to
 * return. */
const attackToChoice = (game: Game, id: ObjectId): void => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers");
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: [{ attacker: id, defender: B }],
  });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
};

describe("Teval, the Balanced Scale — the card", () => {
  it("is a 4/4 flying legendary Spirit Dragon in Sultai colours", () => {
    const def = registry.get(TEVAL);
    expect(def.manaCost).toBe("{1}{B}{G}{U}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Spirit", "Dragon"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(def.keywords).toEqual(["flying"]);
    expect(identityString(colorIdentityOf(def))).toBe("UBG");
  });
});

describe("Teval's attack trigger — mill three, then you may return a land", () => {
  it("returns a land it just milled, tapped, and that land leaving makes a Zombie Druid", () => {
    const game = makeGame();
    const t = teval(game);
    // The top three of Alice's library: a Forest among two spells.
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    const forest = game.debugSpawn("Forest", A, "library");
    const opt = game.debugSpawn("Opt", A, "library");
    const fourth = game.state.zones.perPlayer[A].library[3];

    attackToChoice(game, t);
    for (const id of [opt, forest, bolt]) expect(game.state.objects[id].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].library[0]).toBe(fourth);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("no land choice");
    // Only land cards may be chosen, and choosing none is allowed.
    expect(awaiting.eligible).toEqual([forest]);
    expect(awaiting.min).toBe(0);
    expect(awaiting.max).toBe(1);

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [forest] });
    game.advanceUntil(settled);
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    // The Forest left the graveyard: one Zombie Druid.
    const tokens = druidIds(game);
    expect(tokens).toHaveLength(1);
    expect(druids(game)).toBe(1);
    const c = computeCharacteristics(game.state, game.registry, tokens[0]);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect([...c.colors]).toEqual(["B"]);
    expect([...c.subtypes]).toEqual(["Zombie", "Druid"]);
  });

  it("may return nothing, and then no card left the graveyard", () => {
    const game = makeGame();
    const t = teval(game);
    const forest = game.debugSpawn("Forest", A, "graveyard");
    attackToChoice(game, t);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[forest].zone).toBe("graveyard");
    expect(druids(game)).toBe(0);
  });
});

describe("Teval's graveyard trigger — once per move, not once per card", () => {
  it("a whole graveyard exiled at once makes one token (the ruling)", () => {
    const game = makeGame();
    teval(game);
    for (const name of ["Grizzly Bears", "Lightning Bolt", "Forest", "Opt"]) {
      game.debugSpawn(name, A, "graveyard");
    }
    game.debugApplyEffect(B, { kind: "exile-graveyard", target: 0 }, [
      { kind: "player", player: A },
    ]);
    game.advanceUntil(settled);
    expect(game.graveyardOf(A)).toHaveLength(0);
    expect(druids(game)).toBe(1);
  });

  it("each separate move makes its own: casting a flashback spell, then returning a card", () => {
    const game = makeGame();
    teval(game);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Mountain", A);
    const looting = game.debugSpawn("Faithless Looting", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: looting, targets: [], via: "flashback" });
    // Let the trigger resolve; Faithless Looting's own discard is answered
    // with whatever the hand holds.
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || settled(s));
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({
        type: "discard",
        player: A,
        cards: game.handOf(A).slice(0, 2),
      });
    }
    game.advanceUntil(settled);
    expect(druids(game)).toBe(1);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
      { kind: "object", object: bears },
    ]);
    game.advanceUntil(settled);
    expect(druids(game)).toBe(2);
  });

  it("an opponent's graveyard is not Teval's", () => {
    const game = makeGame();
    teval(game);
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: 0 }, [
      { kind: "player", player: B },
    ]);
    game.advanceUntil(settled);
    expect(druids(game)).toBe(0);
    expect(druids(game, B)).toBe(0);
  });

  it("Teval returning from the graveyard doesn't see itself leave it", () => {
    const game = makeGame();
    const t = game.debugSpawn(TEVAL, A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [
      { kind: "object", object: t },
    ]);
    game.advanceUntil(settled);
    expect(game.state.objects[t].zone).toBe("battlefield");
    expect(druids(game)).toBe(0);
  });
});
