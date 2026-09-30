/**
 * Tarkir: Dragonstorm precons, batch 2 — casting a spell while another
 * spell or ability resolves (rule 608.2g). The `cast-now` effect grew from
 * Chandra, Acolyte of Flame's one target card to a card picked from a hand
 * (Baral's Expertise, Electrodominance, Baral and Kari Zev), a graveyard
 * (Diviner of Mist) or the top of a library (Velomachus Lorehold); "without
 * paying its mana cost" (rule 118.9) with a spell filter judged on the face
 * being cast (601.3e); and "if you do" / "if you don't" (Conduit of Worlds,
 * Breaching Dragonstorm). Transcendent Dragon counters a spell into exile
 * and casts it from there.
 */
import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";
import { viewFor } from "../view.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type Cast = Extract<Action, { type: "cast-spell" }>;

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
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
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
/** Put `names` on top of `player`'s library, the first one on top. */
const stackLibrary = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const bob: TargetRef = { kind: "player", player: B };
const free = (card: ObjectId, targets: readonly (TargetRef | null)[] = [], more: Partial<Cast> = {}): Cast => ({
  type: "cast-spell",
  player: A,
  card,
  targets,
  via: "effect",
  free: true,
  ...more,
});
const attackWith = (game: Game, attacker: ObjectId): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
};
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("TDC batch 2 — Baral's Expertise", () => {
  it("returns the targets, then casts a spell of mana value 4 or less from hand for free", () => {
    const { game, a } = setUp(["Baral's Expertise", "Divination", "Shivan Dragon", "Lightning Bolt", "Island"], "Island");
    const islands = lands(game, "Island", 5);
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const divination = inHand(game, "Divination");
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return free(divination);
    };
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Baral's Expertise"),
      targets: [obj(bears), obj(giant), null],
    });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, giant)).toBe("hand");
    // Divination and Lightning Bolt are on offer; Shivan Dragon (6) and the
    // Island (a land is played, not cast) aren't. Every way is free.
    const names = offer!.cards.map((id) => game.state.objects[id].cardName).sort();
    expect(names).toEqual(["Divination", "Lightning Bolt"]);
    expect(offer!.free).toBe(true);
    expect(offer!.casts.every((c) => c.free === true && c.via === "effect")).toBe(true);
    // The Expertise and Divination left the hand, two cards came in; the five
    // Islands paid for the Expertise alone.
    expect(game.handOf(A).length).toBe(hand - 2 + 2);
    expect(zone(game, divination)).toBe("graveyard");
    expect(islands.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("is still on the stack while the free spell is cast, so a free Regrowth can't return it", () => {
    const { game, a } = setUp(["Baral's Expertise", "Regrowth"], "Island");
    lands(game, "Island", 5);
    const lotus = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const expertise = inHand(game, "Baral's Expertise");
    let offered: readonly TargetRef[] = [];
    a.chooseCastNowFn = (_view, offer) => {
      offered = offer.casts[0].targetOptions[0] ?? [];
      return free(inHand(game, "Regrowth"), [obj(lotus)]);
    };
    game.dispatch({ type: "cast-spell", player: A, card: expertise, targets: [null, null, null] });
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    expect(zone(game, expertise)).toBe("stack");
    settle(game);
    // Regrowth could aim only at what was in the graveyard as it was cast.
    expect(offered).toEqual([obj(lotus)]);
    expect(zone(game, lotus)).toBe("hand");
    expect(zone(game, expertise)).toBe("graveyard");
  });

  it("may cast a card it just returned", () => {
    const { game, a } = setUp(["Baral's Expertise"], "Island");
    lands(game, "Island", 5);
    const bears = spawn(game, "Grizzly Bears");
    a.chooseCastNowFn = (_view, offered) => {
      expect(offered.cards).toEqual([bears]);
      return free(bears);
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Baral's Expertise"), targets: [obj(bears), null, null] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("TDC batch 2 — Electrodominance", () => {
  it("deals X damage, then offers only spells of mana value X or less — a creature too, timing ignored", () => {
    const { game, a } = setUp(["Electrodominance", "Lightning Bolt", "Grizzly Bears", "Divination"], "Mountain");
    lands(game, "Mountain", 4);
    const bears = inHand(game, "Grizzly Bears");
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return free(bears);
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Electrodominance"), targets: [bob], xValue: 2 });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(offer!.cards.map((id) => game.state.objects[id].cardName).sort()).toEqual(["Grizzly Bears", "Lightning Bolt"]);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("TDC batch 2 — Velomachus Lorehold", () => {
  const TOP = ["Lightning Bolt", "Shivan Dragon", "Divination", "Island", "Ghalta, Primal Hunger", "Lava Spike", "Opt"];

  it("offers the instants and sorceries among the top seven no bigger than its power, then puts the rest on the bottom", () => {
    const { game, a } = setUp();
    const velomachus = spawn(game, "Velomachus Lorehold");
    const top = stackLibrary(game, [...TOP, "Hill Giant"]);
    const seven = top.slice(0, 7);
    const divination = top[2];
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return free(divination);
    };
    attackWith(game, velomachus);
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    // Only Velomachus's controller sees the seven while choosing.
    const mine = viewFor(game.state, registry, A);
    const theirs = viewFor(game.state, registry, B);
    expect(seven.every((id) => mine.objects[id] !== undefined)).toBe(true);
    expect(seven.some((id) => theirs.objects[id] !== undefined)).toBe(false);
    expect(theirs.awaiting?.kind === "cast-now" && theirs.awaiting.cards.length).toBe(0);
    settle(game);
    expect(offer!.looked).toEqual(seven);
    expect(offer!.cards.map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Divination",
      "Lava Spike",
      "Lightning Bolt",
      "Opt",
    ]);
    // Divination resolved after the rest went to the bottom, so it drew
    // Hill Giant, now on top.
    expect(zone(game, divination)).toBe("graveyard");
    expect(zone(game, top[7])).toBe("hand");
    const library = game.state.zones.perPlayer[A].library;
    expect([...library.slice(-6)].sort()).toEqual(seven.filter((id) => id !== divination).sort());
  });

  it("caps the mana value at its power as the trigger resolves", () => {
    const { game, a } = setUp();
    const velomachus = spawn(game, "Velomachus Lorehold");
    stackLibrary(game, TOP);
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return null;
    };
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" },
      [obj(velomachus)],
    );
    attackWith(game, velomachus);
    settle(game);
    expect(offer!.cards.map((id) => game.state.objects[id].cardName).sort()).toEqual(["Lava Spike", "Lightning Bolt", "Opt"]);
    expect(game.state.zones.perPlayer[A].library.slice(-7).map((id) => game.state.objects[id].cardName).sort()).toEqual(
      [...TOP].sort(),
    );
  });
});

describe("TDC batch 2 — Diviner of Mist", () => {
  it("mills four, then casts an instant or sorcery of mana value 4 or less from the graveyard and exiles it", () => {
    const { game, a } = setUp();
    const diviner = spawn(game, "Diviner of Mist");
    const [giant, spike, dragon, divination] = stackLibrary(game, ["Beanstalk Giant", "Lava Spike", "Shivan Dragon", "Divination"]);
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return free(spike, [bob]);
    };
    attackWith(game, diviner);
    settle(game);
    expect(zone(game, dragon)).toBe("graveyard");
    // Beanstalk Giant is on offer as its adventure, Fertile Footsteps (a
    // sorcery, 3), and never as the creature (7).
    expect(offer!.cards.sort()).toEqual([giant, spike, divination].sort());
    const giantWays = offer!.casts.filter((c) => c.card === giant);
    expect(giantWays.length).toBeGreaterThan(0);
    expect(giantWays.every((c) => c.face === 1)).toBe(true);
    expect(life(game, B)).toBe(17);
    expect(zone(game, spike)).toBe("exile");
  });
});

describe("TDC batch 2 — Breaching Dragonstorm", () => {
  const cast = (game: Game): void => {
    lands(game, "Mountain", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Breaching Dragonstorm"), targets: [] });
    settle(game);
  };

  it("exiles down to a nonland card and casts it free; a Dragon entering sends it back to hand", () => {
    const { game, a } = setUp(["Breaching Dragonstorm"]);
    const [island1, island2, dragon] = stackLibrary(game, ["Island", "Island", "Shivan Dragon"]);
    a.chooseCastNowFn = () => free(dragon);
    cast(game);
    expect(zone(game, island1)).toBe("exile");
    expect(zone(game, island2)).toBe("exile");
    expect(zone(game, dragon)).toBe("battlefield");
    expect(game.state.objects[dragon].controller).toBe(A);
    // Shivan Dragon entering returned the enchantment.
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Breaching Dragonstorm")).toBe(true);
  });

  it("puts the card into your hand if you don't cast it", () => {
    const { game } = setUp(["Breaching Dragonstorm"]);
    const [dragon] = stackLibrary(game, ["Shivan Dragon"]);
    cast(game);
    expect(zone(game, dragon)).toBe("hand");
    expect(named(game, "Breaching Dragonstorm")).toHaveLength(1);
  });

  it("offers nothing for a spell of mana value 9 or more, which goes to hand", () => {
    const { game, a } = setUp(["Breaching Dragonstorm"]);
    const [ghalta] = stackLibrary(game, ["Ghalta, Primal Hunger"]);
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    cast(game);
    expect(asked).toBe(false);
    expect(zone(game, ghalta)).toBe("hand");
  });
});

describe("TDC batch 2 — Baral and Kari Zev", () => {
  const setUpBaral = () => {
    const ctx = setUp(["Divination", "Lava Spike", "Lightning Bolt", "Opt"], "Island");
    lands(ctx.game, "Island", 4);
    spawn(ctx.game, "Baral and Kari Zev");
    return ctx;
  };

  it("offers a cheaper spell sharing a card type with the first instant or sorcery, free", () => {
    const { game, a } = setUpBaral();
    const spike = inHand(game, "Lava Spike");
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return free(spike, [bob]);
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    // A sorcery of mana value under 3: not the instants.
    expect(offer!.cards).toEqual([spike]);
    expect(life(game, B)).toBe(17);
    expect(named(game, "First Mate Ragavan")).toHaveLength(0);
  });

  it("makes First Mate Ragavan, hasty, if you don't — and only for the first instant or sorcery", () => {
    const { game } = setUpBaral();
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    const [ragavan] = named(game, "First Mate Ragavan");
    expect(ragavan).toBeDefined();
    const token = computeCharacteristics(game.state, registry, ragavan);
    expect(token.keywords).toContain("haste");
    expect(registry.get("First Mate Ragavan").supertypes).toContain("legendary");
    expect([token.power, token.toughness]).toEqual([2, 1]);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Opt"), targets: [] });
    settle(game);
    expect(named(game, "First Mate Ragavan")).toHaveLength(1);
  });
});

describe("TDC batch 2 — Baral and Kari Zev and a countered spell", () => {
  it("compares with the spell as it last was on the stack, its X included", () => {
    const { game, a } = setUp(["Electrodominance", "Think Twice"], "Island");
    lands(game, "Mountain", 5);
    spawn(game, "Baral and Kari Zev");
    const electro = inHand(game, "Electrodominance");
    const thinkTwice = inHand(game, "Think Twice");
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return null;
    };
    game.dispatch({ type: "cast-spell", player: A, card: electro, targets: [bob], xValue: 3 });
    // Countered in response to the trigger: mana value 5 on the stack, 2 in
    // the graveyard.
    expect(game.state.zones.shared.stack).toHaveLength(2);
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [obj(electro)]);
    expect(zone(game, electro)).toBe("graveyard");
    settle(game);
    // Think Twice (2) is lesser than 5: offered.
    expect(offer?.cards).toEqual([thinkTwice]);
  });
});

describe("TDC batch 2 — Transcendent Dragon", () => {
  it("counters an opponent's spell into exile, and its controller casts it free", () => {
    const { game, a } = setUp(["Transcendent Dragon"], "Island");
    lands(game, "Island", 6);
    spawn(game, "Mountain", B);
    game.debugSpawn("Lightning Bolt", B, "hand");
    const bolt = game.handOf(B).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
    a.chooseCastNowFn = (_view, offered) => {
      expect(offered.cards).toEqual([bolt]);
      return free(bolt, [bob]);
    };
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "player", player: A }] });
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Transcendent Dragon"), targets: [] });
    settle(game);
    // Bolt was countered, exiled, and cast by Alice at Bob.
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(17);
    expect(zone(game, bolt)).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].graveyard).toContain(bolt);
  });

  it("does nothing unless it was cast", () => {
    const { game } = setUp();
    game.debugSpawn("Transcendent Dragon", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.zones.shared.stack).toHaveLength(0);
  });
});

describe("TDC batch 2 — Conduit of Worlds", () => {
  const setUpConduit = () => {
    const ctx = setUp(["Lightning Bolt", "Opt"], "Island");
    const conduit = spawn(ctx.game, "Conduit of Worlds");
    lands(ctx.game, "Forest", 2);
    lands(ctx.game, "Mountain", 1);
    lands(ctx.game, "Island", 1);
    const bears = ctx.game.debugSpawn("Grizzly Bears", A, "graveyard");
    return { ...ctx, conduit, bears };
  };
  const activate = (game: Game, conduit: ObjectId, bears: ObjectId): void => {
    game.dispatch({ type: "activate-ability", player: A, source: conduit, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
  };

  it("casts the target card for its cost, then no other spell this turn", () => {
    const { game, a, conduit, bears } = setUpConduit();
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return { type: "cast-spell", player: A, card: bears, targets: [], via: "effect" };
    };
    activate(game, conduit, bears);
    expect(offer!.free).toBe(false);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell")).toBe(false);
  });

  it("offers nothing once you've cast a spell this turn", () => {
    const { game, a, conduit, bears } = setUpConduit();
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Opt"), targets: [] });
    settle(game);
    activate(game, conduit, bears);
    expect(asked).toBe(false);
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("lets you play lands from your graveyard", () => {
    const { game } = setUpConduit();
    const forest = game.debugSpawn("Forest", A, "graveyard");
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === forest)).toBe(true);
  });
});
