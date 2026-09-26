/**
 * Top-5000 card backlog, batch 1: cards the engine could run once the land
 * type, copy, mana and filter work of 2026-09-26 landed — Urborg, Yavimaya,
 * Dryad of the Ilysian Grove, Black Market Connections, Urza's Saga, Esper
 * Sentinel, Goldspan Dragon, Sanctum Weaver, Changeling Outcast, The Scarab
 * God, Kutzil, Malamet Exemplar and Guardian Project.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import type { GameRules } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";
import { hasSubtype } from "../subtypes.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (rules: Partial<GameRules> = { maxLandsPerTurn: 99 }) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, ...rules },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const castable = (game: Game, name: string, player: PlayerId = A): boolean => {
  const card = game.debugSpawn(name, player, "hand");
  return game.legalActions(player).some((action) => action.kind === "cast-spell" && action.card === card);
};
const tokensNamed = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("Urborg, Tomb of Yawgmoth and Yavimaya, Cradle of Growth", () => {
  it("every land is a Swamp, and taps for {B} — Urborg's own and an opponent's", () => {
    const { game } = setUp();
    const urborg = spawn(game, "Urborg, Tomb of Yawgmoth");
    const theirs = spawn(game, "Plains", B);
    expect(hasSubtype(game.characteristics(urborg).subtypes, "Swamp")).toBe(true);
    expect(hasSubtype(game.characteristics(theirs).subtypes, "Swamp")).toBe(true);
    // Urborg alone pays for Dark Ritual.
    expect(castable(game, "Dark Ritual")).toBe(true);
  });

  it("Yavimaya makes every land a Forest", () => {
    const { game } = setUp();
    spawn(game, "Yavimaya, Cradle of Growth");
    const plains = spawn(game, "Plains");
    expect(hasSubtype(game.characteristics(plains).subtypes, "Forest")).toBe(true);
    game.state.objects[plains].tapped = false;
    expect(castable(game, "Llanowar Elves")).toBe(true);
  });
});

describe("Dryad of the Ilysian Grove", () => {
  it("an additional land each turn, and your lands are every basic land type", () => {
    const { game } = setUp({});
    spawn(game, "Dryad of the Ilysian Grove");
    const lands = [game.debugSpawn("Wastes", A, "hand"), game.debugSpawn("Wastes", A, "hand")];
    const theirs = spawn(game, "Wastes", B);
    for (const land of lands) game.dispatch({ type: "play-land", player: A, card: land });
    expect(lands.map((id) => game.state.objects[id].zone)).toEqual(["battlefield", "battlefield"]);
    const third = game.debugSpawn("Wastes", A, "hand");
    expect(game.legalActions(A).some((action) => action.kind === "play-land" && action.card === third)).toBe(false);
    for (const type of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
      expect(hasSubtype(game.characteristics(lands[0]).subtypes, type)).toBe(true);
    }
    expect(hasSubtype(game.characteristics(lands[0]).subtypes, "Gate")).toBe(false);
    expect(hasSubtype(game.characteristics(theirs).subtypes, "Forest")).toBe(false);
    expect(castable(game, "Opt")).toBe(true);
    expect(castable(game, "Llanowar Elves")).toBe(true);
  });
});

describe("Black Market Connections", () => {
  it("chooses one or more as your first main phase begins: a Treasure, a card, a changeling — and the life", () => {
    const { game, a } = setUp();
    spawn(game, "Black Market Connections");
    a.chooseModesFn = () => [0, 1, 2];
    const life = game.state.players[A].life;
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(tokensNamed(game, "Treasure Token")).toHaveLength(1);
    const [merc] = tokensNamed(game, "3/2 Shapeshifter Token");
    expect(hasSubtype(game.characteristics(merc).subtypes, "Goblin")).toBe(true);
    expect(game.state.players[A].life).toBe(life - 6);
    // Two draw steps and Buy Information.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 2);
  });
});

describe("Urza's Saga", () => {
  it("played as a land, it gains {T}: Add {C}, then a Construct maker, then finds a {0} or {1} artifact", () => {
    const { game, a } = setUp();
    const saga = game.debugSpawn("Urza's Saga", A, "hand");
    // Mana costs {X} and {U} under {1} and {0}, and draw fodder on top.
    game.debugSpawn("Stonecoil Serpent", A, "library");
    game.debugSpawn("Cogwork Wrestler", A, "library");
    const sol = game.debugSpawn("Sol Ring", A, "library");
    const ornithopter = game.debugSpawn("Ornithopter", A, "library");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Wastes", A, "library");
    expect(game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === saga)).toBe(false);
    game.dispatch({ type: "play-land", player: A, card: saga });
    game.advanceUntil(quiet);
    expect(game.state.objects[saga].counters.lore).toBe(1);
    const abilities = () =>
      game
        .legalActions(A)
        .filter((action) => action.kind === "activate-ability" && action.source === saga)
        .map((action) => (action.kind === "activate-ability" ? action.text : ""));
    expect(abilities()).toEqual(["{T}: Add {C}."]);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.state.objects[saga].counters.lore).toBe(2);
    // Chapter I's ability stays.
    expect(abilities()).toContain("{T}: Add {C}.");
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const construct = game.legalActions(A).find(
      (action) => action.kind === "activate-ability" && action.source === saga && action.text.startsWith("{2}"),
    );
    if (construct?.kind !== "activate-ability") throw new Error("no Construct ability");
    game.dispatch({ type: "activate-ability", player: A, source: saga, abilityIndex: construct.abilityIndex });
    game.advanceUntil(quiet);
    expect(tokensNamed(game, "Construct Token")).toHaveLength(1);
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [sol];
    };
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main" && quiet(s));
    expect([...offered].sort()).toEqual([ornithopter, sol].sort());
    expect(game.state.objects[sol].zone).toBe("battlefield");
    expect(game.state.objects[saga].zone).toBe("graveyard");
  });
});

describe("Esper Sentinel", () => {
  it("an opponent's first noncreature spell each turn: a card unless they pay {X}", () => {
    const { game } = setUp();
    spawn(game, "Esper Sentinel");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    const hand = game.state.zones.perPlayer[A].hand.length;
    // A creature spell first doesn't count.
    const cast = (name: string): void => {
      game.dispatch({ type: "cast-spell", player: B, card: game.debugSpawn(name, B, "hand") });
      game.advanceUntil(quiet);
    };
    cast("Ornithopter");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
    // Opt, with one Island left over: bob declines to pay, and alice draws.
    cast("Opt");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
    // His second noncreature spell this turn: nothing.
    cast("Opt");
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });

  it("paying {X} — its power — stops the draw", () => {
    const { game, b } = setUp();
    spawn(game, "Esper Sentinel");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    b.chooseModesFn = () => [0];
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: B, card: game.debugSpawn("Opt", B, "hand") });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
    expect(game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].controller === B && game.state.objects[id].tapped)).toHaveLength(2);
  });
});

describe("Goldspan Dragon", () => {
  it("a Treasure as it attacks and as a spell targets it; your Treasures make two of one colour", () => {
    const { game, a } = setUp();
    const dragon = spawn(game, "Goldspan Dragon");
    a.declareAttackersFn = () => [{ attacker: dragon, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(tokensNamed(game, "Treasure Token")).toHaveLength(1);
    // Treasure + one Island pays for Divination only with two of one colour.
    spawn(game, "Island");
    expect(castable(game, "Divination")).toBe(true);
    // Bob's Lightning Bolt at it: another Treasure.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    spawn(game, "Mountain", B);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: dragon }] });
    game.advanceUntil(quiet);
    expect(tokensNamed(game, "Treasure Token")).toHaveLength(2);
  });
});

describe("Sanctum Weaver", () => {
  it("taps for X mana of one colour, X the enchantments you control", () => {
    const { game } = setUp();
    const weaver = spawn(game, "Sanctum Weaver");
    spawn(game, "Exploration");
    spawn(game, "Font of Fertility");
    const tap = game.legalActions(A).find((action) => action.kind === "activate-ability" && action.source === weaver);
    if (tap?.kind !== "activate-ability") throw new Error("no mana ability offered");
    game.dispatch({ type: "activate-ability", player: A, source: weaver, abilityIndex: tap.abilityIndex });
    const pool = game.state.players[A].manaPool.map((unit) => unit.type);
    expect(pool).toHaveLength(3);
    expect(new Set(pool).size).toBe(1);
  });
});

describe("Changeling Outcast", () => {
  it("is every creature type, can't block and can't be blocked", () => {
    const { game } = setUp();
    const outcast = spawn(game, "Changeling Outcast");
    const c = game.characteristics(outcast);
    expect(hasSubtype(c.subtypes, "Goblin")).toBe(true);
    expect(c.keywords.has("unblockable")).toBe(true);
    expect(c.restrictions).toContain("cant-block");
  });
});

describe("The Scarab God", () => {
  it("upkeep: each opponent loses X life and you scry X, X your Zombies", () => {
    const { game } = setUp();
    spawn(game, "The Scarab God");
    spawn(game, "Bog Raiders");
    spawn(game, "Dreg Reaver");
    const life = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.players[B].life).toBe(life - 2);
  });

  it("reanimates a creature card from any graveyard as a 4/4 black Zombie, other subtypes kept", () => {
    const { game } = setUp();
    const god = spawn(game, "The Scarab God");
    for (const land of ["Island", "Island", "Swamp", "Swamp"]) spawn(game, land);
    const hound = game.debugSpawn("Goldhound", B, "graveyard");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: god,
      abilityIndex: 0,
      targets: [{ kind: "object", object: hound }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[hound].zone).toBe("exile");
    const [token] = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].isToken);
    expect(nameOf(game.state.objects[token])).toBe("Goldhound");
    const c = game.characteristics(token);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect([...c.colors]).toEqual(["B"]);
    expect([...c.subtypes].sort()).toEqual(["Treasure", "Zombie"]);
    expect(game.state.objects[token].controller).toBe(A);
  });

  it("returns to its owner's hand at the next end step after it dies", () => {
    const { game } = setUp();
    const god = spawn(game, "The Scarab God");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: god }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[god].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.objects[god].zone).toBe("hand");
  });
});

describe("Kutzil, Malamet Exemplar", () => {
  it("opponents can't cast spells during your turn", () => {
    const { game } = setUp();
    spawn(game, "Kutzil, Malamet Exemplar");
    spawn(game, "Island", B);
    const opt = game.debugSpawn("Opt", B, "hand");
    game.advanceUntil((s) => s.turn.number === 1 && s.priority.holder === B);
    expect(game.legalActions(B).some((action) => action.kind === "cast-spell" && action.card === opt)).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === B);
    expect(game.legalActions(B).some((action) => action.kind === "cast-spell" && action.card === opt)).toBe(true);
  });

  it("draws when a creature with power over its base power deals combat damage to a player", () => {
    const bumped = setUp();
    spawn(bumped.game, "Kutzil, Malamet Exemplar");
    const bears = spawn(bumped.game, "Grizzly Bears");
    spawn(bumped.game, "Glorious Anthem");
    bumped.a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    const hand = bumped.game.state.zones.perPlayer[A].hand.length;
    bumped.game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(bumped.game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);

    const plain = setUp();
    spawn(plain.game, "Kutzil, Malamet Exemplar");
    const other = spawn(plain.game, "Grizzly Bears");
    plain.a.declareAttackersFn = () => [{ attacker: other, defender: B }];
    const before = plain.game.state.zones.perPlayer[A].hand.length;
    plain.game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(plain.game.state.zones.perPlayer[A].hand.length).toBe(before);
  });
});

describe("Guardian Project", () => {
  const hand = (game: Game): number => game.state.zones.perPlayer[A].hand.length;
  /** `name` enters under `player`'s control — announced, unlike a spawn. */
  const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
    const card = game.debugSpawn(name, player, "hand");
    game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
    return card;
  };

  it("draws for the first creature of its name — not a second, not one named like a creature card in your graveyard", () => {
    const { game } = setUp();
    spawn(game, "Guardian Project");
    const before = hand(game);
    enter(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    enter(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    game.debugSpawn("Llanowar Elves", A, "graveyard");
    enter(game, "Llanowar Elves");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    // An opponent's creature of that name doesn't matter.
    enter(game, "Goldhound", B);
    enter(game, "Goldhound");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 2);
  });

  it("asks again as it resolves: the creature dying into your graveyard first stops the draw", () => {
    const { game } = setUp();
    spawn(game, "Guardian Project");
    const before = hand(game);
    const bears = enter(game, "Grizzly Bears");
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before);
  });
});

describe("Guardian Project, a creature that leaves and returns in response", () => {
  it("the first ability draws nothing — the returned creature is a new one of that name — and the second draws", () => {
    const { game } = setUp();
    spawn(game, "Guardian Project");
    const before = game.state.zones.perPlayer[A].hand.length;
    const card = game.debugSpawn("Grizzly Bears", A, "hand");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: card }]);
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 1);
  });
});
