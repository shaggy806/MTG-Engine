/**
 * Top-5000 batch 22c — no engine change. Each test pins the clause most
 * likely to be wired wrong: a per-player half-life amount (Heartless
 * Hidetsugu), a batched "create one or more creature tokens" (Staff of the
 * Storyteller), an animated land with a granted attack trigger (Den of the
 * Bugbear), counter thresholds, an intervening "had a -1/-1 counter", an
 * experience-counter earthbend, a player-targeted search, and so on.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
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
    registry,
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
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
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
const throughCombat = (game: Game): void => {
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};

describe("top-5000 batch 22c — Heartless Hidetsugu", () => {
  it("deals each player half their own life, rounded down", () => {
    const { game } = setUp();
    const hidetsugu = spawn(game, "Heartless Hidetsugu");
    game.debugApplyEffect(B, { kind: "lose-life", amount: 13 });
    expect(life(game, B)).toBe(7);
    game.dispatch({ type: "activate-ability", player: A, source: hidetsugu, abilityIndex: 0, targets: [] });
    settle(game);
    expect(life(game, A)).toBe(10);
    // Half of 7, rounded down, is 3.
    expect(life(game, B)).toBe(4);
  });
});

describe("top-5000 batch 22c — Staff of the Storyteller", () => {
  it("gets one story counter per creation of creature tokens, not for nontoken creatures or other tokens", () => {
    const { game } = setUp([], "Plains");
    const staff = game.debugSpawn("Staff of the Storyteller", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Spirit Token")).toBe(1);
    expect(counters(game, staff, "story")).toBe(1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 3 });
    settle(game);
    expect(counters(game, staff, "story")).toBe(2);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 });
    settle(game);
    expect(counters(game, staff, "story")).toBe(2);
    lands(game, "Plains", 1);
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: staff, abilityIndex: 0, targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    expect(counters(game, staff, "story")).toBe(1);
  });
});

describe("top-5000 batch 22c — Den of the Bugbear", () => {
  it("becomes a 3/2 red Goblin that makes an attacking Goblin as it attacks", () => {
    const { game, a } = setUp([], "Mountain");
    lands(game, "Mountain", 4);
    const den = spawn(game, "Den of the Bugbear");
    game.dispatch({ type: "activate-ability", player: A, source: den, abilityIndex: 1, targets: [] });
    settle(game);
    // Whatever paid the {3}{R}, the Den is to attack.
    game.state.objects[den].tapped = false;
    const c = game.characteristics(den);
    expect([c.power, c.toughness]).toEqual([3, 2]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Goblin");
    expect([...c.colors]).toEqual(["R"]);
    a.declareAttackersFn = () => [{ attacker: den, defender: B }];
    throughCombat(game);
    expect(tokenCount(game, "Goblin Token")).toBe(1);
    expect(life(game, B)).toBe(16);
  });
});

describe("top-5000 batch 22c — Creeping Tar Pit", () => {
  it("becomes a blue and black 3/2 Elemental land that can't be blocked", () => {
    const { game } = setUp([], "Island");
    lands(game, "Island", 1);
    lands(game, "Swamp", 2);
    const pit = spawn(game, "Creeping Tar Pit");
    game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 1, targets: [] });
    settle(game);
    const c = game.characteristics(pit);
    expect([c.power, c.toughness]).toEqual([3, 2]);
    expect(c.types).toContain("land");
    expect(c.types).toContain("creature");
    expect(c.subtypes).toContain("Elemental");
    expect([...c.colors].sort()).toEqual(["B", "U"]);
    expect(c.keywords.has("unblockable")).toBe(true);
  });
});

describe("top-5000 batch 22c — Voice of the Blessed", () => {
  it("grows on life gain, flies and has vigilance at four counters, indestructible at ten", () => {
    const { game } = setUp();
    const voice = spawn(game, "Voice of the Blessed");
    game.state.objects[voice].counters = { "+1/+1": 3 };
    expect(game.characteristics(voice).keywords.has("flying")).toBe(false);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 5 });
    settle(game);
    expect(counters(game, voice)).toBe(4);
    const four = game.characteristics(voice);
    expect(four.keywords.has("flying") && four.keywords.has("vigilance")).toBe(true);
    expect(four.keywords.has("indestructible")).toBe(false);
    game.state.objects[voice].counters = { "+1/+1": 10 };
    expect(game.characteristics(voice).keywords.has("indestructible")).toBe(true);
  });
});

describe("top-5000 batch 22c — Blowfly Infestation", () => {
  it("passes a -1/-1 counter on only from a creature that died with one", () => {
    const { game } = setUp();
    spawn(game, "Blowfly Infestation");
    const plain = spawn(game, "Grizzly Bears", B);
    const marked = spawn(game, "Grizzly Bears", B);
    game.state.objects[marked].counters = { "-1/-1": 1 };
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: plain }]);
    settle(game);
    expect(zone(game, plain)).toBe("graveyard");
    expect(counters(game, giant, "-1/-1")).toBe(0);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: marked }]);
    settle(game);
    expect(zone(game, marked)).toBe("graveyard");
    // The Hill Giant is the only creature left to target.
    expect(counters(game, giant, "-1/-1")).toBe(1);
  });
});

describe("top-5000 batch 22c — Toph, Earthbending Master", () => {
  it("gets an experience counter per land, then earthbends that many as you attack", () => {
    const { game, a } = setUp();
    const toph = spawn(game, "Toph, Earthbending Master");
    const forest = game.debugSpawn("Forest", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: forest });
    settle(game);
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].counters.experience).toBe(2);
    a.declareAttackersFn = () => [{ attacker: toph, defender: B }];
    throughCombat(game);
    const bent = named(game, "Forest").filter((id) => counters(game, id) === 2);
    expect(bent).toHaveLength(1);
    const c = game.characteristics(bent[0]);
    expect(c.types).toContain("creature");
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 22c — Fertilid", () => {
  it("enters with two counters and spends one to have the target player fetch a basic land tapped", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const fertilid = spawn(game, "Fertilid");
    expect(counters(game, fertilid)).toBe(2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: fertilid,
      abilityIndex: 0,
      targets: [{ kind: "player", player: A }],
    });
    settle(game);
    expect(counters(game, fertilid)).toBe(1);
    const fetched = named(game, "Wastes");
    expect(fetched).toHaveLength(1);
    expect(game.state.objects[fetched[0]].tapped).toBe(true);
  });
});

describe("top-5000 batch 22c — Spawnbed Protector", () => {
  it("returns an Eldrazi creature card and makes two Scions at your end step", () => {
    const { game } = setUp();
    spawn(game, "Spawnbed Protector");
    const buried = game.debugSpawn("Spawnbed Protector", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(zone(game, buried)).toBe("hand");
    expect(tokenCount(game, "Eldrazi Scion Token")).toBe(2);
  });
});

describe("top-5000 batch 22c — Necroduality", () => {
  it("copies a nontoken Zombie once, and not the token copy", () => {
    const { game } = setUp();
    spawn(game, "Necroduality");
    game.debugSpawn("Gravecrawler", A, "battlefield", { announceEntry: true });
    settle(game);
    const crawlers = named(game, "Gravecrawler");
    expect(crawlers.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(crawlers.filter((id) => game.state.objects[id].isToken === true)).toHaveLength(1);
  });
});

describe("top-5000 batch 22c — Ravenous Squirrel", () => {
  it("grows when you sacrifice a creature, and its ability gains 1 and draws", () => {
    const { game } = setUp();
    lands(game, "Swamp", 2);
    lands(game, "Forest", 1);
    const squirrel = spawn(game, "Ravenous Squirrel");
    const bears = spawn(game, "Grizzly Bears");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: squirrel, abilityIndex: 0, targets: [], sacrifice: bears });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(counters(game, squirrel)).toBe(1);
    expect(life(game, A)).toBe(21);
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });
});

describe("top-5000 batch 22c — Chivalric Alliance", () => {
  it("draws for an attack with two creatures, and makes a white and blue Knight", () => {
    const { game, a } = setUp();
    spawn(game, "Chivalric Alliance");
    const one = spawn(game, "Grizzly Bears");
    const two = spawn(game, "Grizzly Bears");
    const handBefore = game.handOf(A).length;
    a.declareAttackersFn = () => [
      { attacker: one, defender: B },
      { attacker: two, defender: B },
    ];
    throughCombat(game);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    lands(game, "Wastes", 2);
    const alliance = named(game, "Chivalric Alliance")[0];
    game.dispatch({ type: "activate-ability", player: A, source: alliance, abilityIndex: 0, targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(handBefore);
    const knights = named(game, "Knight Token (Chivalric Alliance)");
    expect(knights).toHaveLength(1);
    expect([...game.characteristics(knights[0]).colors].sort()).toEqual(["U", "W"]);
  });
});

describe("top-5000 batch 22c — Blanchwood Armor", () => {
  it("counts only the Forests its controller controls", () => {
    const { game } = setUp(["Blanchwood Armor"], "Forest");
    lands(game, "Forest", 3);
    lands(game, "Forest", 2, B);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Blanchwood Armor"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([5, 5]);
  });
});
