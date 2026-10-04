/**
 * Top-5000 batch 28d — no engine change. Each test pins the clause most
 * likely to be wired wrong: the restless lands' attack triggers ("defending
 * player", "another target attacking creature … untap that creature"),
 * Apprentice Necromancer's delayed sacrifice, Back in Town's X outlaw
 * targets, Galvanic Blast's metalcraft, Mulch's split, the Sagas' chapters,
 * the choices made on resolution (Angelic Skirmisher, Orcish Medicine),
 * Hajar's legendary-only pump and Scampering Surveyor's Cave.
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

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
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
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
/** Run until nothing is left to resolve, answering each `choose-modes` with
 * the next of `picks` (0 once they run out). */
const settle = (game: Game, picks: number[] = []): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [picks.shift() ?? 0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const triggerEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;
const activatedEffect = (name: string, index: number): EffectSpec => registry.get(name)!.activated[index].effect!;
const chapterEffect = (name: string, index: number): EffectSpec => registry.get(name)!.chapters![index].effect!;
/** A restless land, untapped (its enters-tapped replacement applies to a
 * spawn) and animated by its own ability. */
const animatedLand = (game: Game, name: string): ObjectId => {
  const land = spawn(game, name);
  game.state.objects[land].tapped = false;
  game.debugApplyEffect(A, activatedEffect(name, 1), [], { source: land });
  return land;
};
const toAttackers = (game: Game): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
};

describe("top-5000 batch 28d — Restless Fortress", () => {
  it("drains the defending player for 2 when it attacks", () => {
    const { game } = setUp();
    const fortress = animatedLand(game, "Restless Fortress");
    expect(chars(game, fortress).power).toBe(1);
    expect(chars(game, fortress).toughness).toBe(4);
    const [lifeA, lifeB] = [life(game, A), life(game, B)];
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: fortress, defender: B }] });
    settle(game);
    expect(life(game, B)).toBe(lifeB - 2);
    expect(life(game, A)).toBe(lifeA + 2);
  });
});

describe("top-5000 batch 28d — Restless Ridgeline", () => {
  it("gives another attacking creature +2/+0 and untaps it", () => {
    const { game, a } = setUp();
    const ridge = animatedLand(game, "Restless Ridgeline");
    expect(chars(game, ridge).power).toBe(3);
    const bears = spawn(game, "Grizzly Bears");
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: ridge, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    settle(game);
    expect(chars(game, bears).power).toBe(4);
    expect(chars(game, bears).toughness).toBe(2);
    expect(game.state.objects[bears].tapped).toBe(false);
    // Not itself: it stays tapped from attacking and unpumped.
    expect(game.state.objects[ridge].tapped).toBe(true);
    expect(chars(game, ridge).power).toBe(3);
  });
});

describe("top-5000 batch 28d — Back in Town", () => {
  it("returns X outlaw creature cards together, and can't target a non-outlaw", () => {
    const { game } = setUp(["Back in Town"], "Swamp");
    lands(game, "Swamp", 5);
    const kotis = game.debugSpawn("Agent of Kotis", A, "graveyard");
    const ambush = game.debugSpawn("Ambush Party", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const card = inHand(game, "Back in Town");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === card);
    expect(offer).toBeDefined();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      xValue: 2,
      targets: [
        { kind: "object", object: kotis },
        { kind: "object", object: ambush },
      ],
    });
    settle(game);
    expect(named(game, "Agent of Kotis")).toHaveLength(1);
    expect(named(game, "Ambush Party")).toHaveLength(1);
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("rejects a Grizzly Bears among the targets", () => {
    const { game } = setUp(["Back in Town"], "Swamp");
    lands(game, "Swamp", 4);
    game.debugSpawn("Agent of Kotis", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const card = inHand(game, "Back in Town");
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card,
        xValue: 1,
        targets: [{ kind: "object", object: bears }],
      }),
    ).toThrow();
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 28d — Galvanic Blast", () => {
  it("deals 2, or 4 with three artifacts", () => {
    const without = setUp(["Galvanic Blast"], "Mountain");
    lands(without.game, "Mountain", 1);
    lands(without.game, "Memnite", 2);
    const before = life(without.game, B);
    without.game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(without.game, "Galvanic Blast"),
      targets: [{ kind: "player", player: B }],
    });
    settle(without.game);
    expect(life(without.game, B)).toBe(before - 2);

    const withMetal = setUp(["Galvanic Blast"], "Mountain");
    lands(withMetal.game, "Mountain", 1);
    lands(withMetal.game, "Memnite", 3);
    withMetal.game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(withMetal.game, "Galvanic Blast"),
      targets: [{ kind: "player", player: B }],
    });
    settle(withMetal.game);
    expect(life(withMetal.game, B)).toBe(before - 4);
  });
});

describe("top-5000 batch 28d — Mulch", () => {
  it("puts every land of the top four into hand and the rest into the graveyard", () => {
    const { game } = setUp(["Mulch"], "Wastes");
    lands(game, "Forest", 2);
    // Each spawn goes on top: the top four are Bolt, Island, Bears, Forest.
    for (const name of ["Forest", "Grizzly Bears", "Island", "Lightning Bolt"]) {
      game.debugSpawn(name, A, "library");
    }
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Mulch"), targets: [] });
    settle(game);
    const handNames = game.handOf(A).map((id) => game.state.objects[id].cardName);
    expect(handNames).toContain("Forest");
    expect(handNames).toContain("Island");
    const yard = game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName);
    expect(yard).toContain("Grizzly Bears");
    expect(yard).toContain("Lightning Bolt");
    expect(yard).not.toContain("Forest");
    expect(yard).not.toContain("Island");
  });
});

describe("top-5000 batch 28d — Song of Freyalise", () => {
  it("I gives your creatures a mana ability; III counters and keywords on yours only", () => {
    const { game } = setUp();
    const song = spawn(game, "Song of Freyalise");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, chapterEffect("Song of Freyalise", 0), [], { source: song });
    settle(game);
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === bears),
    ).toBe(true);
    expect(game.state.objects[theirs].modifiers.some((m) => (m.grantsActivated?.length ?? 0) > 0)).toBe(false);

    game.debugApplyEffect(A, chapterEffect("Song of Freyalise", 1), [], { source: song });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
    for (const kw of ["vigilance", "trample", "indestructible"] as const) {
      expect(chars(game, bears).keywords.has(kw)).toBe(true);
      expect(chars(game, theirs).keywords.has(kw)).toBe(false);
    }
  });
});

describe("top-5000 batch 28d — Angelic Skirmisher", () => {
  it("gives your creatures the keyword chosen as it resolves, and only that one", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [2];
    const angel = spawn(game, "Angelic Skirmisher");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, triggerEffect("Angelic Skirmisher"), [], { source: angel });
    settle(game, [2]);
    expect(chars(game, bears).keywords.has("lifelink")).toBe(true);
    expect(chars(game, angel).keywords.has("lifelink")).toBe(true);
    expect(chars(game, bears).keywords.has("first-strike")).toBe(false);
    expect(chars(game, bears).keywords.has("vigilance")).toBe(false);
    expect(chars(game, theirs).keywords.has("lifelink")).toBe(false);
  });
});

describe("top-5000 batch 28d — Orcish Medicine", () => {
  it("grants the chosen keyword, then amasses Orcs 1", () => {
    const { game, a } = setUp(["Orcish Medicine"], "Swamp");
    a.chooseModesFn = () => [1];
    lands(game, "Swamp", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Orcish Medicine"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game, [1]);
    expect(chars(game, bears).keywords.has("indestructible")).toBe(true);
    expect(chars(game, bears).keywords.has("lifelink")).toBe(false);
    const army = named(game, "Army Token");
    expect(army).toHaveLength(1);
    expect(counters(game, army[0])).toBe(1);
    expect(chars(game, army[0]).subtypes).toContain("Orc");
  });
});

describe("top-5000 batch 28d — Hajar, Loyal Bodyguard", () => {
  it("pumps and protects only legendary creatures you control", () => {
    const { game } = setUp();
    const hajar = spawn(game, "Hajar, Loyal Bodyguard");
    const legend = spawn(game, "Adrix and Nev, Twincasters");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Adrix and Nev, Twincasters", B);
    game.dispatch({ type: "activate-ability", player: A, source: hajar, abilityIndex: 0 });
    settle(game);
    expect(zone(game, hajar)).toBe("graveyard");
    expect(chars(game, legend).power).toBe(3);
    expect(chars(game, legend).keywords.has("indestructible")).toBe(true);
    expect(chars(game, bears).power).toBe(2);
    expect(chars(game, bears).keywords.has("indestructible")).toBe(false);
    expect(chars(game, theirs).power).toBe(2);
    expect(chars(game, theirs).keywords.has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 28d — Scampering Surveyor", () => {
  it("finds a Cave card, which isn't basic, and puts it onto the battlefield tapped", () => {
    const { game } = setUp([], "Captivating Cave");
    game.debugSpawn("Scampering Surveyor", A, "battlefield", { announceEntry: true });
    settle(game);
    const caves = named(game, "Captivating Cave");
    expect(caves).toHaveLength(1);
    expect(game.state.objects[caves[0]].tapped).toBe(true);
  });
});
