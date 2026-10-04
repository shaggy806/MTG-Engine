/**
 * Top-5000 batch 20e. No engine change: every card is built from existing
 * vocabulary. These pin the clause most likely to be wired wrong on each —
 * an activation gate (Leechridden Swamp), an intervening-if (Witch of the
 * Moors, Siege-Gang Lieutenant's "your commander"), a growing X and a real
 * delayed sacrifice (Urabrask's Forge), last-known reads of a sacrificed
 * creature (Momentous Fall), a borrowed creature's end-step exile (Puppeteer
 * Clique), and the damage source (Soul's Fire).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

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
/** How many of `name` there are, a token stack counting as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
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
const toPostcombat = (game: Game, turn: number): void =>
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "postcombat-main" && quiet(s));

describe("top-5000 batch 20e — Leechridden Swamp", () => {
  it("drains only while you control two or more black permanents", () => {
    const { game } = setUp();
    const swamp = spawn(game, "Leechridden Swamp");
    // It enters tapped; untap it to test the drain.
    expect(game.state.objects[swamp].tapped).toBe(true);
    game.state.objects[swamp].tapped = false;
    spawn(game, "Swamp");
    const canDrain = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === swamp && x.abilityIndex === 1);
    spawn(game, "Indulgent Aristocrat");
    expect(canDrain()).toBe(false);
    spawn(game, "Indulgent Aristocrat");
    expect(canDrain()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: swamp, abilityIndex: 1 });
    settle(game);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-5000 batch 20e — Indulgent Aristocrat", () => {
  it("puts a counter on each Vampire you control, and on nothing else", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    const aristocrat = spawn(game, "Indulgent Aristocrat");
    const other = spawn(game, "Indulgent Aristocrat");
    const theirs = spawn(game, "Indulgent Aristocrat", B);
    const bears = spawn(game, "Grizzly Bears");
    const fodder = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: aristocrat, abilityIndex: 0, sacrifice: fodder });
    settle(game);
    expect(zone(game, fodder)).toBe("graveyard");
    expect(counters(game, aristocrat)).toBe(1);
    expect(counters(game, other)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
    expect(counters(game, bears)).toBe(0);
  });
});

describe("top-5000 batch 20e — Witch of the Moors", () => {
  it("does nothing at your end step if you gained no life", () => {
    const { game } = setUp();
    spawn(game, "Witch of the Moors");
    const theirs = spawn(game, "Grizzly Bears", B);
    const dead = game.debugSpawn("Hill Giant", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zone(game, theirs)).toBe("battlefield");
    expect(zone(game, dead)).toBe("graveyard");
  });

  it("with life gained, each opponent sacrifices and the targeted card comes back", () => {
    const { game } = setUp();
    spawn(game, "Witch of the Moors");
    const theirs = spawn(game, "Grizzly Bears", B);
    const dead = game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    settle(game);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, dead)).toBe("hand");
  });
});

describe("top-5000 batch 20e — Siege-Gang Lieutenant", () => {
  it("makes no Goblins without your commander", () => {
    const { game } = setUp();
    spawn(game, "Siege-Gang Lieutenant");
    toPostcombat(game, 1);
    expect(howMany(game, "Goblin Token")).toBe(0);
  });

  it("makes two hasty Goblins while you control a commander you own", () => {
    const { game } = setUp();
    spawn(game, "Siege-Gang Lieutenant");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    toPostcombat(game, 1);
    expect(howMany(game, "Goblin Token")).toBe(2);
    const goblin = named(game, "Goblin Token")[0];
    expect(game.characteristics(goblin).keywords.has("haste")).toBe(true);
  });

  it("doesn't count an opponent's commander you control", () => {
    const { game } = setUp();
    spawn(game, "Siege-Gang Lieutenant");
    const borrowed = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.state.objects[borrowed].isCommander = true;
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0, underYourControl: true }, [obj(borrowed)]);
    settle(game);
    expect(game.state.objects[borrowed].controller).toBe(A);
    toPostcombat(game, 1);
    expect(howMany(game, "Goblin Token")).toBe(0);
  });
});

describe("top-5000 batch 20e — Urabrask's Forge", () => {
  it("makes an X/1 that grows each turn and is sacrificed at the end step", () => {
    const { game } = setUp();
    const forge = spawn(game, "Urabrask's Forge");
    toPostcombat(game, 1);
    expect(counters(game, forge, "oil")).toBe(1);
    const first = named(game, "Phyrexian Horror Token");
    expect(first).toHaveLength(1);
    const c1 = game.characteristics(first[0]);
    expect([c1.power, c1.toughness]).toEqual([1, 1]);
    expect(c1.keywords.has("trample") && c1.keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Phyrexian Horror Token")).toHaveLength(0);
    toPostcombat(game, 3);
    expect(counters(game, forge, "oil")).toBe(2);
    const second = named(game, "Phyrexian Horror Token");
    expect(second).toHaveLength(1);
    const c2 = game.characteristics(second[0]);
    expect([c2.power, c2.toughness]).toEqual([2, 1]);
  });
});

describe("top-5000 batch 20e — Momentous Fall", () => {
  it("draws the sacrificed creature's power and gains its toughness", () => {
    const { game } = setUp(["Momentous Fall"], "Forest");
    lands(game, "Forest", 4);
    const wurm = spawn(game, "Craw Wurm");
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Momentous Fall"), targets: [], sacrifice: wurm });
    settle(game);
    expect(zone(game, wurm)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(hand - 1 + 6);
    expect(life(game, A)).toBe(24);
  });
});

describe("top-5000 batch 20e — Puppeteer Clique", () => {
  it("borrows an opponent's creature card with haste and exiles it at your end step", () => {
    const { game } = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Puppeteer Clique", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(game.characteristics(theirs).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zone(game, theirs)).toBe("exile");
  });
});

describe("top-5000 batch 20e — Megrim", () => {
  it("deals 2 to an opponent for each card they discard, and nothing for yours", () => {
    const { game } = setUp();
    spawn(game, "Megrim");
    game.debugApplyEffect(A, { kind: "discard", target: "each-opponent", amount: 2 }, []);
    settle(game);
    expect(life(game, B)).toBe(16);
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: 1 }, []);
    settle(game);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 20e — Spine of Ish Sah", () => {
  it("returns to its owner's hand when it's put into a graveyard from the battlefield", () => {
    const { game } = setUp();
    const spine = spawn(game, "Spine of Ish Sah");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(spine)]);
    settle(game);
    expect(zone(game, spine)).toBe("hand");
  });
});

describe("top-5000 batch 20e — Priest of Fell Rites", () => {
  it("pays 3 life and sacrifices itself to reanimate a creature card", () => {
    const { game } = setUp();
    const priest = spawn(game, "Priest of Fell Rites");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: priest, abilityIndex: 0, targets: [obj(giant)] });
    settle(game);
    expect(life(game, A)).toBe(17);
    expect(zone(game, priest)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
  });
});

describe("top-5000 batch 20e — Soul's Fire", () => {
  it("has the creature deal damage equal to its power", () => {
    const { game } = setUp(["Soul's Fire"], "Mountain");
    lands(game, "Mountain", 3);
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Soul's Fire"),
      targets: [obj(wurm), { kind: "player", player: B }],
    });
    settle(game);
    expect(life(game, B)).toBe(14);
  });

  it("deals nothing once the creature is gone (the ruling)", () => {
    const { game } = setUp(["Soul's Fire"], "Mountain");
    lands(game, "Mountain", 3);
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Soul's Fire"),
      targets: [obj(wurm), { kind: "player", player: B }],
    });
    // In response, the creature dies: the spell still has a legal target
    // (the player), but no damage is dealt.
    expect(game.state.zones.shared.stack.length).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(wurm)]);
    settle(game);
    expect(zone(game, wurm)).toBe("graveyard");
    expect(life(game, B)).toBe(20);
  });
});
