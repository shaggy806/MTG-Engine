/**
 * Card sweep 1 — top-2000 Commander staples authored from existing
 * vocabulary. One `describe` per card with behaviour worth pinning.
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
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const objectRef = (object: ObjectId): TargetRef => ({ kind: "object", object });
const playerRef = (player: PlayerId): TargetRef => ({ kind: "player", player });
const cast = (game: Game, player: PlayerId, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const activate = (
  game: Game,
  player: PlayerId,
  source: ObjectId,
  abilityIndex: number,
  targets: (TargetRef | null)[] = [],
  extra = {},
) => {
  game.dispatch({ type: "activate-ability", player, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const pool = (game: Game, player: PlayerId): string =>
  game.state.players[player].manaPool.map((u) => u.type).sort().join("");
const zoneOf = (game: Game, id: ObjectId) => game.state.objects[id]?.zone;

describe("Gaea's Cradle", () => {
  it("adds {G} for each creature you control", () => {
    const { game } = setUp();
    const cradle = game.debugSpawn("Gaea's Cradle", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    activate(game, A, cradle, 0);
    expect(pool(game, A)).toBe("GG");
  });
});

describe("the Verges", () => {
  it("offer the second colour only with a matching land type", () => {
    const { game } = setUp();
    const verge = game.debugSpawn("Gloomlake Verge", A, "battlefield");
    const offered = () =>
      game.legalActions(A).filter((o) => o.kind === "activate-ability" && o.source === verge).length;
    const without = offered();
    game.debugSpawn("Swamp", A, "battlefield");
    expect(offered()).toBeGreaterThan(without);
  });
});

describe("Castle Ardenvale", () => {
  it("enters tapped without a Plains, untapped with one", () => {
    const { game } = setUp();
    const first = game.debugSpawn("Castle Ardenvale", A, "battlefield");
    expect(game.state.objects[first].tapped).toBe(true);
    game.debugSpawn("Plains", A, "battlefield");
    const second = game.debugSpawn("Castle Ardenvale", A, "battlefield");
    expect(game.state.objects[second].tapped).toBe(false);
  });
});

describe("Return of the Wildspeaker", () => {
  it("draws the greatest power among your non-Humans", () => {
    const { game } = setUp(["Return of the Wildspeaker"]);
    lands(game, A, "Forest", 5);
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield"); // 6/6 Dinosaur
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    const hand = game.handOf(A).length;
    cast(game, A, inHand(game, A, "Return of the Wildspeaker"), [], { modes: [0] });
    expect(game.handOf(A).length).toBe(hand - 1 + 6);
  });

  it("pumps only your non-Human creatures", () => {
    const { game } = setUp(["Return of the Wildspeaker"]);
    lands(game, A, "Forest", 5);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const human = game.debugSpawn("Human Token", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, A, inHand(game, A, "Return of the Wildspeaker"), [], { modes: [1] });
    expect(pt(game, bears)).toEqual([5, 5]);
    expect(pt(game, human)).toEqual([1, 1]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("Overwhelming Stampede", () => {
  it("gives your creatures trample and +X/+X, X the greatest power, read once", () => {
    const { game } = setUp(["Overwhelming Stampede"]);
    lands(game, A, "Forest", 5);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    cast(game, A, inHand(game, A, "Overwhelming Stampede"));
    expect(pt(game, bears)).toEqual([8, 8]);
    expect(pt(game, dreadmaw)).toEqual([12, 12]);
    expect(game.characteristics(bears).keywords).toContain("trample");
  });
});

describe("Massacre Wurm", () => {
  it("shrinks opponents' creatures and drains for each that dies", () => {
    const { game } = setUp(["Massacre Wurm"]);
    lands(game, A, "Swamp", 6);
    const elf = game.debugSpawn("Llanowar Elves", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    cast(game, A, inHand(game, A, "Massacre Wurm"));
    expect(zoneOf(game, elf)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(pt(game, dreadmaw)).toEqual([4, 4]);
    expect(zoneOf(game, mine)).toBe("battlefield");
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(20);
  });
});

describe("The Meathook Massacre", () => {
  it("gives each creature -X/-X and drains or gains on deaths", () => {
    const { game } = setUp(["The Meathook Massacre"]);
    lands(game, A, "Swamp", 4);
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const big = game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    cast(game, A, inHand(game, A, "The Meathook Massacre"), [], { xValue: 2 });
    expect(zoneOf(game, mine)).toBe("graveyard");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(pt(game, big)).toEqual([4, 4]);
    // Mine died: each opponent loses 1. Theirs died: I gain 1.
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});

describe("Cathars' Crusade", () => {
  it("puts a counter on each of your creatures whenever one enters", () => {
    const { game } = setUp(["Grizzly Bears"]);
    game.debugSpawn("Cathars' Crusade", A, "battlefield");
    lands(game, A, "Forest", 2);
    const old = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const bears = inHand(game, A, "Grizzly Bears");
    cast(game, A, bears);
    expect(pt(game, old)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("Beastmaster Ascension", () => {
  it("pumps your creatures once it has seven quest counters", () => {
    const { game } = setUp();
    const ascension = game.debugSpawn("Beastmaster Ascension", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "quest", amount: 6 }, [
      objectRef(ascension),
    ]);
    expect(pt(game, bears)).toEqual([2, 2]);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "quest", amount: 1 }, [
      objectRef(ascension),
    ]);
    expect(pt(game, bears)).toEqual([7, 7]);
  });

  it("gets a quest counter per attacker, if you choose", () => {
    const { game, a } = setUp();
    const ascension = game.debugSpawn("Beastmaster Ascension", A, "battlefield");
    const one = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    const two = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [
      { attacker: one, defender: B },
      { attacker: two, defender: B },
    ];
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.objects[ascension].counters.quest).toBe(2);
  });
});

describe("Mayhem Devil", () => {
  it("deals 1 damage whenever any player sacrifices a permanent", () => {
    const { game } = setUp();
    game.debugSpawn("Mayhem Devil", A, "battlefield");
    const treasure = game.debugSpawn("Treasure Token", A, "battlefield");
    // Cracking a Treasure is a sacrifice: the Devil pings (first legal target).
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: treasure,
      abilityIndex: 0,
      targets: [],
    });
    game.advanceUntil(quiet);
    const total = life(game, A) + life(game, B);
    expect(total).toBe(39);
  });
});

describe("Wheel of Fortune", () => {
  it("discards every hand and draws seven for each player", () => {
    const { game } = setUp(["Wheel of Fortune"]);
    lands(game, A, "Mountain", 3);
    cast(game, A, inHand(game, A, "Wheel of Fortune"));
    expect(game.handOf(A).length).toBe(7);
    expect(game.handOf(B).length).toBe(7);
    expect(game.state.zones.perPlayer[B].graveyard.length).toBe(7);
  });
});

describe("Selfless Spirit", () => {
  it("makes your creatures indestructible, not an opponent's", () => {
    const { game } = setUp();
    const spirit = game.debugSpawn("Selfless Spirit", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    activate(game, A, spirit, 0);
    expect(zoneOf(game, spirit)).toBe("graveyard");
    expect(game.characteristics(bears).keywords).toContain("indestructible");
    expect(game.characteristics(theirs).keywords).not.toContain("indestructible");
  });
});

describe("Access Tunnel", () => {
  it("targets only a creature with power 3 or less", () => {
    const { game } = setUp();
    const tunnel = game.debugSpawn("Access Tunnel", A, "battlefield");
    lands(game, A, "Island", 3);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const big = game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === tunnel && o.abilityIndex === 1);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("not offered");
    const options = offer.targetOptions[0].map((t) => (t.kind === "object" ? t.object : null));
    expect(options).toContain(bears);
    expect(options).not.toContain(big);
    activate(game, A, tunnel, 1, [objectRef(bears)]);
    expect(game.characteristics(bears).keywords).toContain("unblockable");
  });
});

describe("Scrawling Crawler", () => {
  it("makes each player draw on your upkeep, and opponents lose 1 per card", () => {
    const { game } = setUp();
    game.debugSpawn("Scrawling Crawler", A, "battlefield");
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    // Bob's turn 2: his draw step costs him 1 life.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    expect(life(game, B)).toBe(19);
    expect(game.handOf(B).length).toBe(handB + 1);
    // Alice's turn 3: upkeep draws for both (Bob loses 1), then her own draw.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
    expect(game.handOf(A).length).toBe(handA + 2);
  });
});

describe("Reprieve", () => {
  it("returns a spell to its owner's hand and draws", () => {
    const { game } = setUp(["Reprieve"], ["Lightning Bolt"]);
    lands(game, A, "Plains", 2);
    lands(game, B, "Mountain", 1);
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.priority.holder === B);
    const bolt = inHand(game, B, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [playerRef(A)] });
    game.advanceUntil((s) => s.priority.holder === A);
    const hand = game.handOf(A).length;
    cast(game, A, inHand(game, A, "Reprieve"), [objectRef(bolt)]);
    expect(zoneOf(game, bolt)).toBe("hand");
    expect(life(game, A)).toBe(20);
    expect(game.handOf(A).length).toBe(hand);
  });
});

describe("Tribute to the World Tree", () => {
  it("draws for a big creature, grows a small one", () => {
    const { game } = setUp(["Grizzly Bears", "Colossal Dreadmaw"]);
    game.debugSpawn("Tribute to the World Tree", A, "battlefield");
    lands(game, A, "Forest", 8);
    const bears = inHand(game, A, "Grizzly Bears");
    cast(game, A, bears);
    expect(pt(game, bears)).toEqual([4, 4]);
    const hand = game.handOf(A).length;
    const dreadmaw = inHand(game, A, "Colossal Dreadmaw");
    cast(game, A, dreadmaw);
    expect(pt(game, dreadmaw)).toEqual([6, 6]);
    expect(game.handOf(A).length).toBe(hand);
  });
});

describe("Carrion Feeder", () => {
  it("can't block, and grows by sacrificing a creature", () => {
    const { game } = setUp();
    const feeder = game.debugSpawn("Carrion Feeder", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    activate(game, A, feeder, 0, [], { sacrifice: bears });
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(pt(game, feeder)).toEqual([2, 2]);
    expect(game.characteristics(feeder).restrictions).toContain("cant-block");
  });
});

describe("Greater Good", () => {
  it("draws the sacrificed creature's power, then discards three", () => {
    const { game } = setUp();
    const good = game.debugSpawn("Greater Good", A, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    const hand = game.handOf(A).length;
    activate(game, A, good, 0, [], { sacrifice: dreadmaw });
    expect(game.handOf(A).length).toBe(hand + 6 - 3);
  });
});

describe("Altar of Dementia", () => {
  it("mills target player by the sacrificed creature's power", () => {
    const { game } = setUp();
    const altar = game.debugSpawn("Altar of Dementia", A, "battlefield");
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    activate(game, A, altar, 0, [playerRef(B)], { sacrifice: dreadmaw });
    expect(game.state.zones.perPlayer[B].graveyard.length).toBe(6);
  });
});

describe("Ophiomancer", () => {
  it("makes a black deathtouch Snake each upkeep while you have none", () => {
    const { game } = setUp();
    game.debugSpawn("Ophiomancer", A, "battlefield");
    const snakes = (): number =>
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Black Deathtouch Snake Token")
        .length;
    // Bob's upkeep counts too ("each upkeep").
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(snakes()).toBe(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(snakes()).toBe(1);
  });
});

describe("Goreclaw, Terror of Qal Sisma", () => {
  it("discounts creature spells with power 4 or greater by {2}", () => {
    const { game } = setUp(["Colossal Dreadmaw", "Grizzly Bears"]);
    game.debugSpawn("Goreclaw, Terror of Qal Sisma", A, "battlefield");
    lands(game, A, "Forest", 4);
    const castable = (id: ObjectId) =>
      game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === id);
    // {4}{G}{G} → {2}{G}{G}; Grizzly Bears (power 2) is left at {1}{G}.
    expect(castable(inHand(game, A, "Colossal Dreadmaw"))).toBe(true);
  });

  it("pumps and tramples your power-4+ creatures when it attacks", () => {
    const { game, a } = setUp();
    const goreclaw = game.debugSpawn("Goreclaw, Terror of Qal Sisma", A, "battlefield", {
      summoningSick: false,
    });
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    a.declareAttackersFn = () => [{ attacker: goreclaw, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(pt(game, dreadmaw)).toEqual([7, 7]);
    expect(pt(game, goreclaw)).toEqual([5, 4]);
    expect(game.characteristics(dreadmaw).keywords).toContain("trample");
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("Rite of Flame", () => {
  it("adds {R}{R} plus {R} per Rite of Flame in every graveyard", () => {
    const { game } = setUp(["Rite of Flame"]);
    lands(game, A, "Mountain", 1);
    game.debugSpawn("Rite of Flame", A, "graveyard");
    game.debugSpawn("Rite of Flame", B, "graveyard");
    cast(game, A, inHand(game, A, "Rite of Flame"));
    expect(pool(game, A)).toBe("RRRR");
  });
});

describe("Ruinous Ultimatum", () => {
  it("destroys only opponents' nonland permanents", () => {
    const { game } = setUp(["Ruinous Ultimatum"]);
    lands(game, A, "Plains", 3);
    lands(game, A, "Swamp", 2);
    lands(game, A, "Mountain", 2);
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const theirLand = game.debugSpawn("Forest", B, "battlefield");
    cast(game, A, inHand(game, A, "Ruinous Ultimatum"));
    expect(zoneOf(game, mine)).toBe("battlefield");
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(zoneOf(game, theirLand)).toBe("battlefield");
  });
});

describe("Aetherflux Reservoir", () => {
  it("gains 1 life per spell you've cast this turn, counted on resolution", () => {
    const { game } = setUp(["Llanowar Elves", "Llanowar Elves"]);
    game.debugSpawn("Aetherflux Reservoir", A, "battlefield");
    lands(game, A, "Forest", 2);
    const [one, two] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Llanowar Elves");
    cast(game, A, one);
    expect(life(game, A)).toBe(21);
    cast(game, A, two);
    expect(life(game, A)).toBe(23);
  });

  it("pays 50 life to deal 50 damage", () => {
    const { game } = setUp();
    const reservoir = game.debugSpawn("Aetherflux Reservoir", A, "battlefield");
    const offered = () =>
      game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === reservoir);
    expect(offered()).toBe(false);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 40 });
    expect(offered()).toBe(true);
    activate(game, A, reservoir, 0, [playerRef(B)]);
    expect(life(game, A)).toBe(10);
    expect(game.state.players[B].hasLost).toBe(true);
  });
});

describe("Red Elemental Blast", () => {
  it("can only target a blue spell or a blue permanent", () => {
    const { game } = setUp(["Red Elemental Blast"]);
    lands(game, A, "Mountain", 1);
    const blue = game.debugSpawn("Consecrated Sphinx", B, "battlefield");
    const green = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const reb = inHand(game, A, "Red Elemental Blast");
    const offers = game.legalActions(A).filter((o) => o.kind === "cast-spell" && o.card === reb);
    const objects = offers.flatMap((o) =>
      o.kind === "cast-spell"
        ? (o.castModal?.modes ?? []).flatMap((m) =>
            m.targetOptions.flat().map((t) => (t.kind === "object" ? t.object : null)),
          )
        : [],
    );
    expect(objects).toContain(blue);
    expect(objects).not.toContain(green);
  });
});

describe("Mental Misstep", () => {
  it("counters a mana-value-1 spell and nothing else", () => {
    const { game } = setUp(["Mental Misstep"], ["Lightning Bolt", "Grizzly Bears"]);
    lands(game, A, "Island", 1);
    lands(game, B, "Mountain", 1);
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.priority.holder === B);
    const bolt = inHand(game, B, "Lightning Bolt");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [playerRef(A)] });
    game.advanceUntil((s) => s.priority.holder === A);
    const misstep = inHand(game, A, "Mental Misstep");
    expect(
      game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === misstep),
    ).toBe(true);
    cast(game, A, misstep, [objectRef(bolt)]);
    expect(zoneOf(game, bolt)).toBe("graveyard");
    expect(life(game, A)).toBe(20);
  });

  it("can't target a spell with another mana value", () => {
    const { game } = setUp(["Mental Misstep"], ["Grizzly Bears"]);
    lands(game, A, "Island", 1);
    lands(game, B, "Forest", 2);
    game.dispatch({ type: "pass-priority", player: A });
    game.advanceUntil((s) => s.priority.holder === B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const bears = inHand(game, B, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: B, card: bears, targets: [] });
    game.advanceUntil((s) => s.priority.holder === A);
    const misstep = inHand(game, A, "Mental Misstep");
    expect(
      game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === misstep),
    ).toBe(false);
  });
});

describe("Conjurer's Closet", () => {
  it("blinks a creature you control at your end step, if you choose", () => {
    const { game, a } = setUp();
    game.debugSpawn("Conjurer's Closet", A, "battlefield");
    const elves = game.debugSpawn("Wood Elves", A, "battlefield");
    game.debugSpawn("Forest", A, "library");
    const start = game.state.eventLog.length;
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);
    const forests = () =>
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest").length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    // It left and came back, so its enters trigger fetched a Forest.
    const exiled = game.state.eventLog
      .slice(start)
      .some((e) => e.type === "permanent-exiled" && e.object === elves);
    expect(exiled).toBe(true);
    expect(zoneOf(game, elves)).toBe("battlefield");
    expect(forests()).toBe(1);
  });
});

describe("Consecrated Sphinx", () => {
  it("offers two cards whenever an opponent draws", () => {
    const { game, a } = setUp();
    game.debugSpawn("Consecrated Sphinx", A, "battlefield");
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(B, { kind: "draw", amount: 2 });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 4);
  });
});

describe("Dramatic Reversal", () => {
  it("untaps your nonland permanents only", () => {
    const { game } = setUp(["Dramatic Reversal"]);
    lands(game, A, "Island", 2);
    const rock = game.debugSpawn("Charcoal Diamond", A, "battlefield");
    const theirs = game.debugSpawn("Charcoal Diamond", B, "battlefield");
    cast(game, A, inHand(game, A, "Dramatic Reversal"));
    expect(game.state.objects[rock].tapped).toBe(false);
    expect(game.state.objects[theirs].tapped).toBe(true);
    const islands = game.battlefield.filter((id) => game.state.objects[id].cardName === "Island");
    expect(islands.every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("Intangible Virtue", () => {
  it("pumps creature tokens you control, not nontoken creatures", () => {
    const { game } = setUp();
    game.debugSpawn("Intangible Virtue", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token", token: "Human Token", count: 1 });
    const token = game.battlefield.find((id) => game.state.objects[id].cardName === "Human Token");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    if (token === undefined) throw new Error("no token");
    expect(pt(game, token)).toEqual([2, 2]);
    expect(game.characteristics(token).keywords).toContain("vigilance");
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("Kindred Dominance", () => {
  it("destroys every creature not of the chosen type", () => {
    const { game, a } = setUp(["Kindred Dominance"]);
    lands(game, A, "Swamp", 7);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const elf = game.debugSpawn("Llanowar Elves", B, "battlefield");
    a.chooseCreatureTypeFn = () => "Elf";
    cast(game, A, inHand(game, A, "Kindred Dominance"));
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, elf)).toBe("battlefield");
  });
});

describe("Howling Mine", () => {
  it("gives the active player an extra draw only while untapped", () => {
    const { game } = setUp();
    const mine = game.debugSpawn("Howling Mine", A, "battlefield");
    const hand = game.handOf(B).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.handOf(B).length).toBe(hand + 2);
    game.state.objects[mine].tapped = true;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    game.state.objects[mine].tapped = true;
    const handA = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.handOf(A).length).toBe(handA + 1);
  });
});

describe("Haywire Mite", () => {
  it("exiles a noncreature artifact or enchantment, and gains 2 as it dies", () => {
    const { game } = setUp();
    const mite = game.debugSpawn("Haywire Mite", A, "battlefield");
    lands(game, A, "Forest", 1);
    const rock = game.debugSpawn("Charcoal Diamond", B, "battlefield");
    const artifactCreature = game.debugSpawn("Haywire Mite", B, "battlefield");
    const offer = game.legalActions(A).find((o) => o.kind === "activate-ability" && o.source === mite);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("not offered");
    const options = offer.targetOptions[0].map((t) => (t.kind === "object" ? t.object : null));
    expect(options).toContain(rock);
    expect(options).not.toContain(artifactCreature);
    activate(game, A, mite, 0, [objectRef(rock)]);
    expect(zoneOf(game, rock)).toBe("exile");
    expect(life(game, A)).toBe(22);
  });
});

describe("Branching Evolution", () => {
  it("doubles +1/+1 counters on your creatures only", () => {
    const { game } = setUp();
    game.debugSpawn("Branching Evolution", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const rock = game.debugSpawn("Charcoal Diamond", A, "battlefield");
    for (const id of [bears, theirs, rock]) {
      game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
        objectRef(id),
      ]);
    }
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[rock].counters["+1/+1"]).toBe(1);
  });
});

describe("Land Tax", () => {
  it("fetches up to three basics only while an opponent has more lands", () => {
    const { game, a } = setUp();
    game.debugSpawn("Land Tax", A, "battlefield");
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    a.chooseFromZoneFn = (_v, eligible, _min, max) => eligible.slice(0, max);
    lands(game, A, "Plains", 1);
    lands(game, B, "Island", 1);
    // Equal lands on Alice's turn-3 upkeep: nothing.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    let hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.handOf(A).length).toBe(hand + 1); // just the draw
    lands(game, B, "Island", 1);
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.handOf(A).length).toBe(hand + 1 + 3);
  });
});

describe("Knight of the White Orchid", () => {
  it("fetches a Plains onto the battlefield when behind on lands", () => {
    const { game, a } = setUp(["Knight of the White Orchid"]);
    lands(game, A, "Plains", 2);
    lands(game, B, "Island", 3);
    game.debugSpawn("Plains", A, "library");
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);
    cast(game, A, inHand(game, A, "Knight of the White Orchid"));
    const plains = game.battlefield.filter((id) => game.state.objects[id].cardName === "Plains");
    expect(plains.length).toBe(3);
  });

  it("does nothing when you have as many lands", () => {
    const { game, a } = setUp(["Knight of the White Orchid"]);
    lands(game, A, "Plains", 2);
    lands(game, B, "Island", 2);
    game.debugSpawn("Plains", A, "library");
    a.chooseModesFn = (_v, _min, max) => (max >= 1 ? [0] : []);
    a.chooseFromZoneFn = (_v, eligible) => eligible.slice(0, 1);
    cast(game, A, inHand(game, A, "Knight of the White Orchid"));
    const plains = game.battlefield.filter((id) => game.state.objects[id].cardName === "Plains");
    expect(plains.length).toBe(2);
  });
});

describe("Cabal Coffers", () => {
  it("pays {2} and adds {B} per Swamp you control", () => {
    const { game } = setUp();
    const coffers = game.debugSpawn("Cabal Coffers", A, "battlefield");
    lands(game, A, "Swamp", 4);
    activate(game, A, coffers, 0);
    expect(pool(game, A)).toBe("BBBB");
    const untapped = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Swamp" && !game.state.objects[id].tapped,
    );
    expect(untapped.length).toBe(2);
  });
});

describe("Treasure Vault", () => {
  it("pays {X}{X} for X Treasures", () => {
    const { game } = setUp();
    const vault = game.debugSpawn("Treasure Vault", A, "battlefield");
    lands(game, A, "Island", 4);
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === vault && o.abilityIndex === 1);
    if (offer === undefined || offer.kind !== "activate-ability") throw new Error("not offered");
    expect(offer.xCost?.maxX).toBe(2);
    activate(game, A, vault, 1, [], { xValue: 2 });
    const treasures = game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token");
    expect(treasures.length).toBe(2);
    expect(zoneOf(game, vault)).toBe("graveyard");
  });
});

describe("Marionette Apprentice", () => {
  it("fabricates, and drains when another creature or artifact of yours dies", () => {
    const { game, a } = setUp(["Marionette Apprentice"]);
    lands(game, A, "Swamp", 2);
    a.chooseModesFn = () => [1];
    const apprentice = inHand(game, A, "Marionette Apprentice");
    cast(game, A, apprentice);
    const servo = game.battlefield.find((id) => game.state.objects[id].cardName === "Servo Token");
    if (servo === undefined) throw new Error("no Servo");
    expect(pt(game, apprentice)).toEqual([1, 2]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [objectRef(servo)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    // An opponent's creature dying is not yours.
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [objectRef(theirs)]);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
  });

  it("can take the counter instead", () => {
    const { game, a } = setUp(["Marionette Apprentice"]);
    lands(game, A, "Swamp", 2);
    a.chooseModesFn = () => [0];
    const apprentice = inHand(game, A, "Marionette Apprentice");
    cast(game, A, apprentice);
    expect(pt(game, apprentice)).toEqual([2, 3]);
  });
});

describe("Farewell", () => {
  it("exiles each chosen class, token stacks whole, and graveyards", () => {
    const { game } = setUp(["Farewell"]);
    lands(game, A, "Plains", 6);
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const rock = game.debugSpawn("Charcoal Diamond", B, "battlefield");
    const virtue = game.debugSpawn("Intangible Virtue", A, "battlefield");
    game.debugApplyEffect(B, { kind: "create-token", token: "Human Token", count: 12 });
    game.advanceUntil(quiet);
    const dead = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const farewell = inHand(game, A, "Farewell");
    cast(game, A, farewell, [], { modes: [1, 3] });
    expect(zoneOf(game, bears)).toBe("exile");
    expect(zoneOf(game, dead)).toBe("exile");
    expect(zoneOf(game, rock)).toBe("battlefield");
    expect(zoneOf(game, virtue)).toBe("battlefield");
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Human Token")).toBe(false);
    // Farewell itself goes to the graveyard after its modes.
    expect(zoneOf(game, farewell)).toBe("graveyard");
  });
});
