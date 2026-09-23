/**
 * Creatures batch 2 — combat, removal, sacrifice and token cards.
 *
 * Toski, Bearer of Secrets (uncounterable, indestructible, attacks each
 * combat if able, draws for each of your creatures that connects — not an
 * opponent's), Warren Soultrader (another creature and 1 life for a Treasure),
 * Accursed Marauder (each player sacrifices a *nontoken* creature), Avenger
 * of Zendikar (a Plant per land you control; landfall's "you may" grows your
 * Plants only, and a stack of them as a whole), Orcish Bowmasters (1 damage
 * and amass Orcs 1 on entering and on an opponent's draws, except the first
 * in their own draw step).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = [], bHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};
const onBattlefield = (game: Game, player: PlayerId, name: string): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
/** How many `name` permanents `player` controls, counting every token in a stack. */
const count = (game: Game, player: PlayerId, name: string): number =>
  onBattlefield(game, player, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const draw = (game: Game, player: PlayerId, amount: number): void => {
  game.debugApplyEffect(player, { kind: "draw", amount });
  game.advanceUntil(quiet);
};
const token = (game: Game, player: PlayerId, name: string, n = 1): void => {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count: n });
  game.advanceUntil(quiet);
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });
const objectRef = (object: ObjectId): TargetRef => ({ kind: "object", object });
const afterCombat = (s: GameState): boolean => s.turn.step === "postcombat-main" && quiet(s);

describe("Toski, Bearer of Secrets", () => {
  it("can't be countered", () => {
    const { game } = setUp(["Toski, Bearer of Secrets"], ["Counterspell"]);
    lands(game, A, "Forest", 4);
    lands(game, B, "Island", 2);
    const toski = inHand(game, A, "Toski, Bearer of Secrets");
    game.dispatch({ type: "cast-spell", player: A, card: toski, targets: [] });
    game.advanceUntil((s) => s.priority.holder === B || quiet(s));
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: inHand(game, B, "Counterspell"),
      targets: [objectRef(toski)],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[toski].zone).toBe("battlefield");
  });

  it("is indestructible", () => {
    const { game } = setUp();
    const toski = game.debugSpawn("Toski, Bearer of Secrets", A, "battlefield");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [objectRef(toski)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[toski].zone).toBe("battlefield");
  });

  it("attacks each combat if able, even when left undeclared", () => {
    const { game, a } = setUp();
    const toski = game.debugSpawn("Toski, Bearer of Secrets", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [];
    const hand = game.handOf(A).length;
    game.advanceUntil(afterCombat);
    expect(game.state.objects[toski].attackedThisTurn).toBe(true);
    expect(life(game, B)).toBe(19);
    // Toski connected: that's a creature you control dealing combat damage.
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("isn't forced to attack while it can't", () => {
    const { game, a } = setUp();
    const toski = game.debugSpawn("Toski, Bearer of Secrets", A, "battlefield");
    a.declareAttackersFn = () => [];
    game.advanceUntil(afterCombat);
    expect(game.state.objects[toski].attackedThisTurn ?? false).toBe(false);
    expect(life(game, B)).toBe(20);
  });

  it("draws once for each of your creatures that deals combat damage to a player", () => {
    const { game, a } = setUp();
    const toski = game.debugSpawn("Toski, Bearer of Secrets", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [
      { attacker: toski, defender: B },
      { attacker: bears, defender: B },
    ];
    const hand = game.handOf(A).length;
    game.advanceUntil(afterCombat);
    expect(life(game, B)).toBe(17);
    expect(game.handOf(A).length).toBe(hand + 2);
  });

  it("doesn't draw when an opponent's creature deals combat damage", () => {
    const { game, b } = setUp();
    game.debugSpawn("Toski, Bearer of Secrets", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    b.declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2 && afterCombat(s));
    expect(life(game, A)).toBe(18);
    expect(game.handOf(A).length).toBe(hand);
  });
});

describe("Warren Soultrader", () => {
  it("pays 1 life and sacrifices another creature for a Treasure", () => {
    const { game } = setUp();
    const trader = game.debugSpawn("Warren Soultrader", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === trader);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("not offered");
    // "Another creature": never the Soultrader itself.
    expect(offer.sacrifice?.choices).toEqual([bears]);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: trader,
      abilityIndex: 0,
      targets: [],
      sacrifice: bears,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(count(game, A, "Treasure Token")).toBe(1);
    expect(life(game, A)).toBe(19);
  });

  it("isn't offered with no other creature to sacrifice", () => {
    const { game } = setUp();
    const trader = game.debugSpawn("Warren Soultrader", A, "battlefield");
    expect(
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === trader),
    ).toBe(false);
    expect(
      game.canDispatch({
        type: "activate-ability",
        player: A,
        source: trader,
        abilityIndex: 0,
        targets: [],
        sacrifice: trader,
      }),
    ).not.toBeNull();
  });
});

describe("Accursed Marauder", () => {
  it("makes each player sacrifice a nontoken creature, sparing tokens", () => {
    const { game, a } = setUp(["Accursed Marauder"]);
    lands(game, A, "Swamp", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    token(game, A, "Soldier Token");
    const visionary = game.debugSpawn("Elvish Visionary", B, "battlefield");
    token(game, B, "Soldier Token");
    let offered: readonly ObjectId[] = [];
    a.chooseSacrificesFn = (_view, eligible) => {
      offered = eligible;
      return [bears];
    };
    const marauder = inHand(game, A, "Accursed Marauder");
    game.dispatch({ type: "cast-spell", player: A, card: marauder, targets: [] });
    game.advanceUntil(quiet);

    // The Marauder itself is a nontoken creature, so it's a legal pick.
    expect([...offered].sort()).toEqual([bears, marauder].sort());
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[marauder].zone).toBe("battlefield");
    expect(game.state.objects[visionary].zone).toBe("graveyard");
    expect(count(game, A, "Soldier Token")).toBe(1);
    expect(count(game, B, "Soldier Token")).toBe(1);
  });

  it("takes nothing from a player who has only tokens", () => {
    const { game } = setUp(["Accursed Marauder"]);
    lands(game, A, "Swamp", 2);
    token(game, B, "Soldier Token");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Accursed Marauder"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(count(game, B, "Soldier Token")).toBe(1);
    // Alone, the Marauder is its own controller's only choice.
    expect(count(game, A, "Accursed Marauder")).toBe(0);
  });
});

describe("Avenger of Zendikar", () => {
  const playLand = (game: Game, player: PlayerId): void => {
    const land = game.debugSpawn("Forest", player, "hand");
    game.dispatch({ type: "play-land", player, card: land });
    game.advanceUntil(quiet);
  };
  const plants = (game: Game, player: PlayerId): ObjectId[] => onBattlefield(game, player, "Plant Token");

  it("makes a 0/1 green Plant for each land you control", () => {
    const { game } = setUp(["Avenger of Zendikar"]);
    lands(game, A, "Forest", 7);
    lands(game, B, "Island", 2);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Avenger of Zendikar"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(count(game, A, "Plant Token")).toBe(7);
    expect(count(game, B, "Plant Token")).toBe(0);
    const plant = plants(game, A)[0];
    expect(pt(game, plant)).toEqual([0, 1]);
    const c = game.characteristics(plant);
    expect([...c.colors]).toEqual(["G"]);
    expect(c.subtypes).toContain("Plant");
    expect(c.types).toContain("creature");
    expect(game.state.objects[plant].isToken).toBe(true);
  });

  it("landfall: you may put a +1/+1 counter on each Plant creature you control", () => {
    const { game, a } = setUp();
    game.debugSpawn("Avenger of Zendikar", A, "battlefield");
    token(game, A, "Plant Token", 2);
    token(game, B, "Plant Token");
    a.chooseModesFn = () => [0];
    playLand(game, A);
    expect(plants(game, A)).toHaveLength(2);
    for (const plant of plants(game, A)) expect(pt(game, plant)).toEqual([1, 2]);
    // Not an opponent's Plant, and not a non-Plant creature.
    expect(pt(game, plants(game, B)[0])).toEqual([0, 1]);
    expect(pt(game, onBattlefield(game, A, "Avenger of Zendikar")[0])).toEqual([5, 5]);
  });

  it("may decline, and doesn't trigger on an opponent's land", () => {
    const { game, a } = setUp();
    game.debugSpawn("Avenger of Zendikar", A, "battlefield");
    token(game, A, "Plant Token", 2);
    let asked = 0;
    a.chooseModesFn = () => {
      asked += 1;
      return [];
    };
    playLand(game, A);
    expect(asked).toBe(1);
    for (const plant of plants(game, A)) expect(pt(game, plant)).toEqual([0, 1]);

    game.debugSpawn("Forest", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(asked).toBe(1);
  });

  it("grows every Plant in a token stack", () => {
    const { game, a } = setUp();
    game.debugSpawn("Avenger of Zendikar", A, "battlefield");
    token(game, A, "Plant Token", 10);
    expect(count(game, A, "Plant Token")).toBe(10);
    // Ten at once is past the stacking threshold: this is the stack path.
    expect(plants(game, A).some((id) => (game.state.objects[id].stackCount ?? 1) > 1)).toBe(true);
    a.chooseModesFn = () => [0];
    playLand(game, A);
    const total = plants(game, A).reduce(
      (n, id) => n + pt(game, id)[0] * (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(total).toBe(10);
  });
});

describe("Orcish Bowmasters", () => {
  const armies = (game: Game): ObjectId[] => onBattlefield(game, A, "Army Token");

  it("deals 1 damage to any target and amasses Orcs 1 as it enters", () => {
    const { game, a } = setUp(["Orcish Bowmasters"]);
    lands(game, A, "Swamp", 2);
    a.chooseTargetsFn = () => [playerRef(B)];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Orcish Bowmasters"),
      targets: [],
    });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(armies(game)).toHaveLength(1);
    const army = armies(game)[0];
    expect(pt(game, army)).toEqual([1, 1]);
    const c = game.characteristics(army);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Orc", "Army"]));
    expect([...c.colors]).toEqual(["B"]);
  });

  it("pings on an opponent's draws and grows the same Army — not on your own", () => {
    const { game, a } = setUp();
    game.debugSpawn("Orcish Bowmasters", A, "battlefield");
    a.chooseTargetsFn = () => [playerRef(B)];
    draw(game, B, 1);
    expect(life(game, B)).toBe(19);
    draw(game, B, 1);
    expect(life(game, B)).toBe(18);
    expect(armies(game)).toHaveLength(1);
    expect(pt(game, armies(game)[0])).toEqual([2, 2]);

    draw(game, A, 1);
    expect(life(game, B)).toBe(18);
    expect(pt(game, armies(game)[0])).toEqual([2, 2]);
  });

  it("skips the opponent's first draw in their own draw step, but not a second", () => {
    const { game, a } = setUp();
    game.debugSpawn("Orcish Bowmasters", A, "battlefield");
    a.chooseTargetsFn = () => [playerRef(B)];
    game.advanceUntil(
      (s) => s.turn.number === 2 && s.turn.step === "draw" && s.priority.holder === B && quiet(s),
    );
    expect(life(game, B)).toBe(20);
    expect(armies(game)).toHaveLength(0);
    draw(game, B, 1);
    expect(life(game, B)).toBe(19);
    expect(armies(game)).toHaveLength(1);
  });

  it("does nothing, no Army included, if its target is gone", () => {
    const { game, a } = setUp();
    game.debugSpawn("Orcish Bowmasters", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    a.chooseTargetsFn = () => [objectRef(bears)];
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    // Wait for the trigger to be on the stack, aimed at the Bears.
    game.advanceUntil(
      (s) =>
        s.zones.shared.stack.some((id) => s.objects[id].kind === "ability") ||
        game.state.result.over,
    );
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [objectRef(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(armies(game)).toHaveLength(0);
    expect(life(game, B)).toBe(20);
  });
});
