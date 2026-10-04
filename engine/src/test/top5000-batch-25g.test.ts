/**
 * Top-5000 batch 25g. No engine change: each test pins the clause of one new
 * card most likely to be wired wrong — Phyrexian Delver's life loss from the
 * returned card's mana value, Cryogen Relic's leave trigger on its own
 * sacrifice, Marketback Walker's draw from the counters it died with, Merrow
 * Reejerey's cast trigger, Grim Servant's devotion-bounded search, Volcanic
 * Torrent's spells-cast X, Virtue of Courage's noncombat-damage impulse,
 * Scavenged Brawler's keyword counters from the graveyard and Sorin's
 * Vampire-only clauses.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const triggerOf = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;
const abilityOf = (name: string, index: number): EffectSpec => registry.get(name)!.activated[index].effect!;

describe("top-5000 batch 25g — Phyrexian Delver", () => {
  it("returns the creature card and loses life equal to its mana value", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, triggerOf("Phyrexian Delver"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(named(game, "Hill Giant")).toHaveLength(1);
    expect(life(game, A)).toBe(16);
  });
});

describe("top-5000 batch 25g — Cryogen Relic", () => {
  it("stuns a tapped creature and draws as it leaves to pay its own cost", () => {
    const { game } = setUp();
    lands(game, "Island", 2);
    const relic = spawn(game, "Cryogen Relic");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    const handBefore = game.handOf(A).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: relic,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, relic)).toBe("graveyard");
    expect(counters(game, bears, "stun")).toBe(1);
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
  });
});

describe("top-5000 batch 25g — Marketback Walker", () => {
  it("enters with X counters and draws one card per counter it died with", () => {
    const { game } = setUp(["Marketback Walker"]);
    lands(game, "Wastes", 4);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Marketback Walker"),
      targets: [],
      xValue: 2,
    });
    settle(game);
    const walker = named(game, "Marketback Walker")[0];
    expect(counters(game, walker)).toBe(2);
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: walker }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore + 2);
  });
});

describe("top-5000 batch 25g — Merrow Reejerey", () => {
  it("taps a target permanent when a Merfolk spell is cast, and pumps other Merfolk", () => {
    const { game, a } = setUp(["Merfolk of the Pearl Trident"]);
    lands(game, "Island", 1);
    spawn(game, "Merrow Reejerey");
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Merfolk of the Pearl Trident"), targets: [] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
    const merfolk = named(game, "Merfolk of the Pearl Trident")[0];
    const c = computeCharacteristics(game.state, registry, merfolk);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });
});

describe("top-5000 batch 25g — Grim Servant", () => {
  it("finds only a card with mana value up to your devotion to black, then loses 3 life", () => {
    const { game, a } = setUp();
    const servant = spawn(game, "Grim Servant");
    spawn(game, "Phyrexian Delver");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible.includes(bears) ? [bears] : [];
    };
    game.debugApplyEffect(A, triggerOf("Grim Servant"), [], { source: servant });
    settle(game);
    // Devotion 3 ({3}{B} + {3}{B}{B}): the 2-drop is findable, the 4-drop isn't.
    expect(offered).toContain(bears);
    expect(offered).not.toContain(giant);
    expect(zone(game, bears)).toBe("hand");
    expect(life(game, A)).toBe(17);
  });
});

describe("top-5000 batch 25g — Volcanic Torrent", () => {
  it("deals X to each opposing creature, X counting every spell you cast this turn", () => {
    const { game } = setUp(["Volcanic Torrent", "Artful Dodge"], "Mountain");
    lands(game, "Mountain", 5);
    lands(game, "Island", 1);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Artful Dodge"),
      targets: [{ kind: "object", object: mine }],
    });
    settle(game);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Volcanic Torrent"), targets: [] });
    settle(game);
    // X = 2: the 2/2 dies, the 3/3 lives, and your own creature is untouched.
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(zone(game, mine)).toBe("battlefield");
    expect(game.state.objects[mine].damageMarked).toBe(0);
  });
});

describe("top-5000 batch 25g — Virtue of Courage", () => {
  it("exiles as many cards as the noncombat damage dealt to an opponent", () => {
    const { game } = setUp();
    const virtue = spawn(game, "Virtue of Courage");
    const exiledBefore = game.state.zones.shared.exile.length;
    game.debugApplyEffect(A, { kind: "damage", amount: 2, target: 0 }, [{ kind: "player", player: B }], {
      source: virtue,
    });
    settle(game);
    expect(life(game, B)).toBe(18);
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A);
    expect(exiled).toHaveLength(2);
    expect(game.state.zones.shared.exile.length).toBe(exiledBefore + 2);
  });
});

describe("top-5000 batch 25g — Scavenged Brawler", () => {
  it("exiles itself from the graveyard to give four +1/+1 counters and four keyword counters", () => {
    const { game } = setUp();
    lands(game, "Wastes", 5);
    const brawler = game.debugSpawn("Scavenged Brawler", A, "graveyard");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: brawler,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, brawler)).toBe("exile");
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([6, 6]);
    for (const k of ["flying", "vigilance", "trample", "lifelink"] as const) expect(c.keywords.has(k)).toBe(true);
  });
});

describe("top-5000 batch 25g — Sorin, Imperious Bloodlord", () => {
  it("+1 grants deathtouch and lifelink, and a counter only to a Vampire", () => {
    const { game } = setUp();
    const vampire = spawn(game, "Qarsi Revenant");
    const bears = spawn(game, "Grizzly Bears");
    const pump = abilityOf("Sorin, Imperious Bloodlord", 0);
    game.debugApplyEffect(A, pump, [{ kind: "object", object: vampire }]);
    game.debugApplyEffect(A, pump, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, vampire)).toBe(1);
    expect(counters(game, bears)).toBe(0);
    const b = computeCharacteristics(game.state, registry, bears);
    expect(b.keywords.has("deathtouch")).toBe(true);
    expect(b.keywords.has("lifelink")).toBe(true);
  });

  it("−3 puts only a Vampire creature card from your hand onto the battlefield", () => {
    const { game, a } = setUp(["Grizzly Bears", "Qarsi Revenant"]);
    const bears = inHand(game, "Grizzly Bears");
    const vampire = inHand(game, "Qarsi Revenant");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible.slice(0, 1);
    };
    game.debugApplyEffect(A, abilityOf("Sorin, Imperious Bloodlord", 2), []);
    settle(game);
    expect(offered).toEqual([vampire]);
    expect(zone(game, vampire)).toBe("battlefield");
    expect(zone(game, bears)).toBe("hand");
  });
});
