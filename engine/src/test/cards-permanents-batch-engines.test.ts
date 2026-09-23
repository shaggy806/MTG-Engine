/**
 * A batch of artifact and enchantment staples, each driven through a real
 * `Game`:
 *
 * - Mox Opal: metalcraft gates the mana ability, counting the Mox itself, and
 *   keeps it out of auto-payment while fewer than three artifacts are around.
 * - Panharmonicon: an artifact or creature entering triggers your abilities
 *   once more, whoever controls the entering permanent; a land doesn't.
 * - Anointed Procession / Parallel Lives: twice as many tokens under *your*
 *   control, stacking multiplicatively; nobody else's tokens.
 * - Bastion of Remembrance: a Human Soldier on entry, and a drain whenever a
 *   creature you control dies.
 * - Goblin Bombardment: sacrifice one of your creatures, 1 damage anywhere.
 * - Expedition Map: {2}, {T}, sacrifice — any land card to hand, revealed.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (aCards: readonly string[] = [], opts: { aFill?: string; players?: 2 | 3 } = {}) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const c = new ScriptedController(C);
  const three = opts.players === 3;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: three ? { [A]: a, [B]: b, [C]: c } : { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aCards, ...Array<string>(40).fill(opts.aFill ?? "Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
      ...(three ? [{ player: C, cards: Array<string>(40).fill("Forest") }] : []),
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b, c };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
/** Permanents named `name` that `player` controls, a token stack counting as
 * every token in it. */
const count = (game: Game, name: string, player: PlayerId = A): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const lands = (game: Game, player: PlayerId, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player, "battlefield"));
const abilityOffers = (game: Game, player: PlayerId, source: ObjectId) =>
  game
    .legalActions(player)
    .filter((x) => x.kind === "activate-ability" && x.source === source);

describe("Mox Opal", () => {
  it("with three artifacts, itself included, it taps for any colour and pays for a spell", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const mox = game.debugSpawn("Mox Opal", A, "battlefield");
    game.debugSpawn("Bonesplitter", A, "battlefield");
    game.debugSpawn("Bonesplitter", A, "battlefield");
    // No lands on the battlefield: the Mox is the only mana there is.
    expect(abilityOffers(game, A, mox).length).toBeGreaterThan(0);

    const bolt = inHand(game, "Lightning Bolt");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bolt)).toBe(true);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
    expect(game.state.objects[mox].tapped).toBe(true);
  });

  it("with two artifacts it can't be activated and the auto-payer won't tap it", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const mox = game.debugSpawn("Mox Opal", A, "battlefield");
    game.debugSpawn("Bonesplitter", A, "battlefield");
    expect(abilityOffers(game, A, mox)).toEqual([]);
    const bolt = inHand(game, "Lightning Bolt");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bolt)).toBe(false);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: mox, abilityIndex: 0 }),
    ).toThrow();
    // An opponent's artifacts are no help.
    game.debugSpawn("Bonesplitter", B, "battlefield");
    expect(abilityOffers(game, A, mox)).toEqual([]);
  });
});

describe("Panharmonicon", () => {
  it("an entering creature triggers your abilities twice, whoever controls it", () => {
    const { game } = setUp();
    game.debugSpawn("Panharmonicon", A, "battlefield");
    game.debugSpawn("Soul Warden", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(22);
    // Bob's creature: it's the ability's controller that matters.
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(24);
  });

  it("doubles the entering creature's own trigger, and an artifact entering", () => {
    const { game } = setUp();
    game.debugSpawn("Panharmonicon", A, "battlefield");
    const hand = game.handOf(A).length;
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 2);

    game.debugSpawn("Chishiro, the Shattered Blade", A, "battlefield");
    game.debugSpawn("Bonesplitter", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(count(game, "2/2 Red Spirit Token")).toBe(2);
  });

  it("a land entering isn't an artifact or creature, and an opponent's copy does nothing for you", () => {
    const { game } = setUp();
    game.debugSpawn("Panharmonicon", A, "battlefield");
    game.debugSpawn("Tatyova, Benthic Druid", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(21);

    const { game: g2 } = setUp();
    g2.debugSpawn("Panharmonicon", B, "battlefield");
    g2.debugSpawn("Soul Warden", A, "battlefield");
    g2.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    g2.advanceUntil(quiet);
    expect(life(g2, A)).toBe(21);
  });
});

describe("Anointed Procession and Parallel Lives", () => {
  const makeSoldiers = (game: Game, player: PlayerId, n: number): void => {
    game.debugApplyEffect(player, { kind: "create-token", token: "Soldier Token", count: n });
    game.advanceUntil(quiet);
  };

  it("Anointed Procession doubles tokens created under your control", () => {
    const { game } = setUp();
    game.debugSpawn("Anointed Procession", A, "battlefield");
    makeSoldiers(game, A, 2);
    expect(count(game, "Soldier Token")).toBe(4);
  });

  it("Parallel Lives doubles any token, not only creatures, and the two stack to four times", () => {
    const { game } = setUp();
    game.debugSpawn("Parallel Lives", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    game.advanceUntil(quiet);
    expect(count(game, "Treasure Token")).toBe(2);

    game.debugSpawn("Anointed Procession", A, "battlefield");
    makeSoldiers(game, A, 1);
    expect(count(game, "Soldier Token")).toBe(4);
  });

  it("an opponent's tokens aren't doubled — even ones your own effect makes for them", () => {
    const { game } = setUp();
    game.debugSpawn("Anointed Procession", A, "battlefield");
    game.debugSpawn("Parallel Lives", A, "battlefield");
    makeSoldiers(game, B, 1);
    expect(count(game, "Soldier Token", B)).toBe(1);

    // Beast Within's shape: Alice's effect, but the token is created under
    // the target's controller.
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(
      A,
      { kind: "create-token", token: "3/3 Beast Token", count: 1, who: "target-controller" },
      [{ kind: "object", object: theirs }],
    );
    game.advanceUntil(quiet);
    expect(count(game, "3/3 Beast Token", B)).toBe(1);
    expect(count(game, "3/3 Beast Token", A)).toBe(0);
  });
});

describe("Bastion of Remembrance", () => {
  it("enters with a 1/1 white Human Soldier", () => {
    const { game } = setUp(["Bastion of Remembrance"]);
    lands(game, A, "Swamp", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bastion of Remembrance") });
    game.advanceUntil(quiet);
    const soldier = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "Human Soldier Token",
    );
    expect(soldier).toBeDefined();
    const c = game.characteristics(soldier as ObjectId);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.colors]).toEqual(["W"]);
    expect([...c.subtypes].sort()).toEqual(["Human", "Soldier"]);
    expect(c.types).toContain("creature");
  });

  it("each opponent loses 1 and you gain 1 when a creature you control dies", () => {
    const { game } = setUp([], { players: 3 });
    game.debugSpawn("Bastion of Remembrance", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(21);
    expect(life(game, B)).toBe(19);
    expect(life(game, C)).toBe(19);
  });

  it("ignores an opponent's creature dying, and its own departure", () => {
    const { game } = setUp();
    const bastion = game.debugSpawn("Bastion of Remembrance", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bastion }]);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(20);
  });
});

describe("Goblin Bombardment", () => {
  it("sacrifices a creature you control to deal 1 damage to any target", () => {
    const { game } = setUp();
    const bombardment = game.debugSpawn("Goblin Bombardment", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const [offer] = abilityOffers(game, A, bombardment);
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : undefined).toEqual([bears]);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: bombardment,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
      sacrifice: bears,
    });
    // The sacrifice is a cost: gone before the ability resolves.
    expect(game.state.objects[bears].zone).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(game.state.objects[theirs].zone).toBe("battlefield");
  });

  it("needs a creature of your own to sacrifice", () => {
    const { game } = setUp();
    const bombardment = game.debugSpawn("Goblin Bombardment", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(abilityOffers(game, A, bombardment)).toEqual([]);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: bombardment,
        abilityIndex: 0,
        targets: [{ kind: "player", player: B }],
        sacrifice: theirs,
      }),
    ).toThrow();
    expect(life(game, B)).toBe(20);
  });
});

describe("Expedition Map", () => {
  it("finds a land card, and only a land card, and puts it in hand revealed", () => {
    const { game, a } = setUp([], { aFill: "Grizzly Bears" });
    const tower = game.debugSpawn("Command Tower", A, "library");
    const fell = game.debugSpawn("Fell the Profane", A, "library");
    const map = game.debugSpawn("Expedition Map", A, "battlefield");
    const forests = lands(game, A, "Forest", 2);
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible.slice(0, 1);
    };

    game.dispatch({ type: "activate-ability", player: A, source: map, abilityIndex: 0 });
    game.advanceUntil(quiet);
    // An MDFC with a land back is only its front face in a library.
    expect(offered).toEqual([tower]);
    expect(offered).not.toContain(fell);
    expect(game.state.objects[tower].zone).toBe("hand");
    expect(game.state.objects[map].zone).toBe("graveyard");
    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.revealedThisTurn).toContain(tower);
  });

  it("can't be activated without {2} to pay", () => {
    const { game } = setUp();
    const map = game.debugSpawn("Expedition Map", A, "battlefield");
    lands(game, A, "Forest", 1);
    expect(abilityOffers(game, A, map)).toEqual([]);
  });
});
