/**
 * Top-5000 batch 23h. No engine changes: every card here is existing
 * vocabulary. The tests pin the clause of each most likely to be wired
 * wrong — the counted cost reductions (Hamza), X read off the sacrificed
 * creature (Shadowheart), "that many" Insects only for counters you put
 * (Nest of Scarabs), the linked exile feeding the mana colours (Pit of
 * Offerings), the impulse permission (Blazing Crescendo), "that many"
 * counters from life gained (Treebeard), the kicked search for two (Grow from
 * the Ashes), the granted mana ability (Brightcap Badger), the graveyard
 * activation (Soul of New Phyrexia), the power-filtered attack trigger
 * (Raid Bombardment) and the artifact-creature anthem (Krang).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
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
/** Every token or card of that name, a token stack counted as all of it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 23h — Hamza, Guardian of Arashin", () => {
  it("costs {1} less for each creature you control with a +1/+1 counter", () => {
    const { game } = setUp(["Hamza, Guardian of Arashin"]);
    lands(game, "Forest", 1);
    lands(game, "Plains", 1);
    lands(game, "Wastes", 2);
    const hamza = inHand(game, "Hamza, Guardian of Arashin");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    expect(castable(game, hamza)).toBe(false);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    expect(castable(game, hamza)).toBe(false);
    game.state.objects[giant].counters = { "+1/+1": 3 };
    // Two creatures with counters (however many counters): {4}{G}{W} → {2}{G}{W}.
    expect(castable(game, hamza)).toBe(true);
  });

  it("makes your creature spells cost {1} less for each such creature", () => {
    const { game } = setUp(["Hill Giant"]);
    lands(game, "Mountain", 1);
    lands(game, "Wastes", 1);
    const giant = inHand(game, "Hill Giant");
    spawn(game, "Hamza, Guardian of Arashin");
    const bears = spawn(game, "Grizzly Bears");
    const thopter = spawn(game, "Ornithopter");
    expect(castable(game, giant)).toBe(false);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    expect(castable(game, giant)).toBe(false);
    game.state.objects[thopter].counters = { "+1/+1": 1 };
    // {3}{R} less {2}.
    expect(castable(game, giant)).toBe(true);
  });
});

describe("top-5000 batch 23h — Shadowheart, Dark Justiciar", () => {
  it("draws cards equal to the sacrificed creature's power", () => {
    const { game } = setUp();
    lands(game, "Swamp", 1);
    lands(game, "Wastes", 1);
    const shadowheart = spawn(game, "Shadowheart, Dark Justiciar");
    const giant = spawn(game, "Hill Giant");
    const before = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: shadowheart, abilityIndex: 0, targets: [], sacrifice: giant });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(before + 3);
  });
});

describe("top-5000 batch 23h — Nest of Scarabs", () => {
  it("makes that many Insects when you put -1/-1 counters on a creature, not when an opponent does", () => {
    const { game } = setUp();
    spawn(game, "Nest of Scarabs");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "-1/-1", amount: 2 }, [obj(giant)]);
    settle(game);
    expect(howMany(game, "Insect Token (Nest of Scarabs)")).toBe(2);
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 }, [obj(bears)]);
    settle(game);
    expect(howMany(game, "Insect Token (Nest of Scarabs)")).toBe(2);
  });
});

describe("top-5000 batch 23h — Pit of Offerings", () => {
  it("exiles up to three graveyard cards and taps for one of their colours", () => {
    const { game, a } = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    a.chooseTargetsFn = () => [obj(bolt), obj(bears)];
    const pit = game.debugSpawn("Pit of Offerings", A, "battlefield", { announceEntry: true, summoningSick: false });
    settle(game);
    expect(zone(game, bolt)).toBe("exile");
    expect(zone(game, bears)).toBe("exile");
    game.state.objects[pit].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 1, manaColors: ["R"] });
    expect(pool(game)).toEqual(["R"]);
  });

  it("makes no coloured mana with nothing exiled", () => {
    const { game } = setUp();
    const pit = spawn(game, "Pit of Offerings");
    const offers = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === pit && x.abilityIndex === 1);
    if (offers.length > 0) {
      game.dispatch({ type: "activate-ability", player: A, source: pit, abilityIndex: 1 });
    }
    expect(pool(game)).toEqual([]);
  });
});

describe("top-5000 batch 23h — Blazing Crescendo", () => {
  it("pumps +3/+1 and lets you play the exiled top card", () => {
    const { game } = setUp(["Blazing Crescendo"], "Mountain");
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    const exiledBefore = game.state.zones.shared.exile.length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Blazing Crescendo"), targets: [obj(bears)] });
    settle(game);
    const c = chars(game, bears);
    expect([c.power, c.toughness]).toEqual([5, 3]);
    const exile = game.state.zones.shared.exile;
    expect(exile.length).toBe(exiledBefore + 1);
    const card = exile[exile.length - 1];
    expect(game.state.objects[card].cardName).toBe("Mountain");
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === card)).toBe(true);
  });
});

describe("top-5000 batch 23h — Treebeard, Gracious Host", () => {
  it("puts that many +1/+1 counters on a target Halfling or Treefolk as you gain life", () => {
    const { game, a } = setUp();
    const treebeard = spawn(game, "Treebeard, Gracious Host");
    a.chooseTargetsFn = () => [obj(treebeard)];
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    expect(counters(game, treebeard)).toBe(3);
  });
});

describe("top-5000 batch 23h — Grow from the Ashes", () => {
  it("puts one basic land onto the battlefield, or two when kicked", () => {
    const { game, a } = setUp(["Grow from the Ashes", "Grow from the Ashes"]);
    a.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
    lands(game, "Forest", 3);
    lands(game, "Wastes", 6);
    const wastes = (): number => howMany(game, "Wastes");
    const start = wastes();
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grow from the Ashes"), targets: [], kicked: true });
    settle(game);
    expect(wastes()).toBe(start + 2);
    for (const id of game.battlefield) game.state.objects[id].tapped = false; // mana for the second cast
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grow from the Ashes"), targets: [] });
    settle(game);
    expect(wastes()).toBe(start + 3);
  });
});

describe("top-5000 batch 23h — Brightcap Badger", () => {
  it("gives Saprolings, not other creatures, \"{T}: Add {G}\"", () => {
    const { game } = setUp();
    spawn(game, "Brightcap Badger");
    const saproling = spawn(game, "Saproling Token");
    const bears = spawn(game, "Grizzly Bears");
    const offers = (source: ObjectId) =>
      game.legalActions(A).filter((x) => x.kind === "activate-ability" && x.source === source);
    expect(offers(bears)).toHaveLength(0);
    const tap = offers(saproling)[0];
    expect(tap).toBeDefined();
    if (tap?.kind !== "activate-ability") throw new Error("no offer");
    game.dispatch({ type: "activate-ability", player: A, source: saproling, abilityIndex: tap.abilityIndex, targets: [] });
    expect(pool(game)).toEqual(["G"]);
  });
});

describe("top-5000 batch 23h — Soul of New Phyrexia", () => {
  it("exiles itself from the graveyard to make your permanents indestructible", () => {
    const { game } = setUp();
    lands(game, "Wastes", 5);
    const soul = game.debugSpawn("Soul of New Phyrexia", A, "graveyard");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: soul, abilityIndex: 1, targets: [] });
    expect(zone(game, soul)).toBe("exile");
    settle(game);
    expect(chars(game, bears).keywords.has("indestructible")).toBe(true);
    expect(chars(game, theirs).keywords.has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 23h — Raid Bombardment", () => {
  it("deals 1 to the defending player for each attacker with power 2 or less", () => {
    const { game } = setUp();
    spawn(game, "Raid Bombardment");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const giant = spawn(game, "Hill Giant");
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: bears, defender: B },
        { attacker: elves, defender: B },
        { attacker: giant, defender: B },
      ],
    });
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 23h — Krang, Utrom Warlord", () => {
  it("gives other artifact creatures you control its four keywords", () => {
    const { game } = setUp();
    spawn(game, "Krang, Utrom Warlord");
    const thopter = spawn(game, "Ornithopter");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Ornithopter", B);
    for (const k of ["flying", "trample", "indestructible", "haste"] as const) {
      expect(chars(game, thopter).keywords.has(k)).toBe(true);
    }
    expect(chars(game, bears).keywords.has("trample")).toBe(false);
    expect(chars(game, theirs).keywords.has("trample")).toBe(false);
  });
});
