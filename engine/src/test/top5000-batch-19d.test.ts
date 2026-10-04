/**
 * Top-5000 batch 19d. No engine change; each test pins the clause most
 * likely to be wired wrong — Hull Breach's two-target mode, Icon of
 * Ancestry's chosen type in both the anthem and the look, Mutilate counting
 * only its caster's Swamps, Ioreth's "two other … legendary" slots, Insight
 * Engine drawing for the counter it just got, and God-Eternal Oketra's token
 * and its trip to third from the top from a graveyard or from exile.
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};
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
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;

describe("top-5000 batch 19d — Hull Breach", () => {
  it("destroys an artifact and an enchantment with its third mode", () => {
    const { game } = setUp(["Hull Breach"]);
    spawn(game, "Mountain");
    spawn(game, "Forest");
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Hull Breach"),
      modes: [2],
      targets: [obj(ring), obj(study)],
    });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, study)).toBe("graveyard");
  });
});

describe("top-5000 batch 19d — Icon of Ancestry", () => {
  it("pumps only your creatures of the chosen type, and its look takes only one of them", () => {
    const { game } = setUp();
    const icon = spawn(game, "Icon of Ancestry");
    game.state.objects[icon].chosenCreatureType = "Bear";
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, giant)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([2, 2]);

    // Top of the library, in order: Hill Giant, Grizzly Bears, Llanowar Elves.
    const elves = game.debugSpawn("Llanowar Elves", A, "library");
    const libBears = game.debugSpawn("Grizzly Bears", A, "library");
    const libGiant = game.debugSpawn("Hill Giant", A, "library");
    lands(game, "Wastes", 3);
    game.dispatch({ type: "activate-ability", player: A, source: icon, abilityIndex: 0 });
    settle(game);
    expect(zone(game, libBears)).toBe("hand");
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-2).sort()).toEqual([elves, libGiant].sort());
  });
});

describe("top-5000 batch 19d — Mutilate", () => {
  it("shrinks every creature by the Swamps its caster controls", () => {
    const { game } = setUp(["Mutilate"]);
    lands(game, "Swamp", 2);
    lands(game, "Wastes", 2);
    lands(game, "Swamp", 3, B);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Mutilate"), targets: [] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(pt(game, giant)).toEqual([1, 1]);
  });
});

describe("top-5000 batch 19d — Ioreth of the Healing House", () => {
  it("untaps two other legendary creatures, and no nonlegendary one", () => {
    const { game } = setUp();
    const ioreth = spawn(game, "Ioreth of the Healing House");
    const kokusho = game.debugSpawn("Kokusho, the Evening Star", A, "battlefield", { tapped: true, summoningSick: false });
    const isamaru = game.debugSpawn("Isamaru, Hound of Konda", A, "battlefield", { tapped: true, summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: ioreth,
        abilityIndex: 1,
        targets: [obj(kokusho), obj(bears)],
      }),
    ).toThrow();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ioreth,
      abilityIndex: 1,
      targets: [obj(kokusho), obj(isamaru)],
    });
    settle(game);
    expect(game.state.objects[kokusho].tapped).toBe(false);
    expect(game.state.objects[isamaru].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});

describe("top-5000 batch 19d — Insight Engine", () => {
  it("draws one card for each charge counter, the new one included", () => {
    const { game } = setUp();
    const engine = spawn(game, "Insight Engine");
    lands(game, "Wastes", 4);
    const before = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: engine, abilityIndex: 0 });
    settle(game);
    expect(counters(game, engine, "charge")).toBe(1);
    expect(game.handOf(A)).toHaveLength(before + 1);
    game.state.objects[engine].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: engine, abilityIndex: 0 });
    settle(game);
    expect(counters(game, engine, "charge")).toBe(2);
    expect(game.handOf(A)).toHaveLength(before + 3);
  });
});

describe("top-5000 batch 19d — God-Eternal Oketra", () => {
  it("makes a 4/4 Zombie Warrior when you cast a creature spell", () => {
    const { game } = setUp(["Grizzly Bears"]);
    spawn(game, "God-Eternal Oketra");
    lands(game, "Forest", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    const tokens = named(game, "Zombie Warrior Token");
    expect(tokens).toHaveLength(1);
    expect(pt(game, tokens[0])).toEqual([4, 4]);
  });

  it("goes third from the top of its owner's library when it dies", () => {
    const { game } = setUp();
    const oketra = spawn(game, "God-Eternal Oketra");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(oketra)]);
    settle(game);
    expect(zone(game, oketra)).toBe("library");
    expect(game.state.zones.perPlayer[A].library.indexOf(oketra)).toBe(2);
  });

  it("goes third from the top when it's exiled from the battlefield", () => {
    const { game } = setUp();
    const oketra = spawn(game, "God-Eternal Oketra");
    game.debugApplyEffect(B, { kind: "exile", target: 0 }, [obj(oketra)]);
    settle(game);
    expect(zone(game, oketra)).toBe("library");
    expect(game.state.zones.perPlayer[A].library.indexOf(oketra)).toBe(2);
  });
});
