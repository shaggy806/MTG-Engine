/**
 * Tramplesaurus Rex precon (FDC, Ghalta, Primal Hunger), batch 1 — the cards
 * the engine already runs. No engine addition. These pin the clauses most
 * likely to be wired wrong: a combat restriction under a "controls another
 * creature with power 4 or greater" condition (Rhonas), an intervening if on
 * total power (Surrak), a "destroyed this way" count (Whiptongue Hydra), a
 * CDA counting Forests by land type (Dungrove Elder), flash for green creature
 * spells only (Yeva), the greatest power drawn plus a free spell of mana value
 * 5 or less (Rishkar's Expertise), and a reveal-until onto the battlefield
 * tapped (Clifftop Lookout). Bite Down, Steel Leaf Champion and Whisperer of
 * the Wilds are copies of already-tested patterns (Stump Stomp, Delney's
 * `cantBeBlockedBy`, Fanatic of Rhonas).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = (
  hand: readonly string[] = [],
  library: readonly string[] = [],
  scripted = true,
): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    // Without controllers, advancing stops wherever a player gets priority.
    ...(scripted ? { controllers: { [A]: a, [B]: new ScriptedController(B) } } : {}),
    decks: [
      { player: A, cards: [...hand, ...Array<string>(8 - hand.length).fill("Wastes"), ...library, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(48).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const cast = (game: Game, name: string, targets: (TargetRef | null)[] = []): void => {
  game.dispatch({ type: "cast-spell", player: A, card: inHand(game, name), targets });
  game.advanceUntil(quiet);
};
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
const eligibleAttackers = (game: Game): readonly ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  const offer = game.legalActions(A).find((x) => x.kind === "declare-attackers");
  return offer?.kind === "declare-attackers" ? offer.eligible : [];
};

describe("Rhonas the Indomitable", () => {
  it("can't attack unless you control another creature with power 4 or greater", () => {
    const { game } = setUp();
    const rhonas = spawn(game, "Rhonas the Indomitable");
    spawn(game, "Grizzly Bears");
    expect(eligibleAttackers(game)).not.toContain(rhonas);
  });

  it("can attack beside a power-4 creature, which needn't attack itself", () => {
    const { game } = setUp();
    const rhonas = spawn(game, "Rhonas the Indomitable");
    spawn(game, "Colossal Dreadmaw");
    expect(eligibleAttackers(game)).toContain(rhonas);
  });

  it("pumps another target creature +2/+0 with trample, never itself", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    const rhonas = spawn(game, "Rhonas the Indomitable");
    const bears = spawn(game, "Grizzly Bears");
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: rhonas, abilityIndex: 0, targets: [obj(rhonas)] }),
    ).toThrow();
    game.dispatch({ type: "activate-ability", player: A, source: rhonas, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 2]);
    expect(c.keywords.has("trample")).toBe(true);
  });
});

describe("Surrak, the Hunt Caller", () => {
  it("gives a target creature you control haste when your creatures total power 8 or more", () => {
    const { game, a } = setUp();
    spawn(game, "Surrak, the Hunt Caller");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    spawn(game, "Grizzly Bears"); // 5 + 2 + 2 = 9
    a.chooseTargetsFn = () => [obj(bears)];
    expect(eligibleAttackers(game)).toContain(bears);
  });

  it("doesn't trigger below total power 8", () => {
    const { game, a } = setUp();
    spawn(game, "Surrak, the Hunt Caller");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield"); // 5 + 2 = 7
    a.chooseTargetsFn = () => [obj(bears)];
    expect(eligibleAttackers(game)).not.toContain(bears);
  });
});

describe("Whiptongue Hydra", () => {
  it("destroys every creature with flying and grows by the number destroyed", () => {
    const { game } = setUp(["Whiptongue Hydra"]);
    lands(game, "Forest", 6);
    const angel = spawn(game, "Serra Angel");
    const birds = spawn(game, "Birds of Paradise", B);
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, "Whiptongue Hydra");
    const hydra = game.battlefield.find((id) => game.state.objects[id].cardName === "Whiptongue Hydra")!;
    expect(game.state.objects[angel].zone).toBe("graveyard");
    expect(game.state.objects[birds].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(pt(game, hydra)).toEqual([6, 6]);
  });
});

describe("Dungrove Elder", () => {
  it("is as big as the number of lands you control with the Forest type", () => {
    const { game } = setUp();
    const elder = spawn(game, "Dungrove Elder");
    lands(game, "Forest", 2);
    spawn(game, "Bayou");
    spawn(game, "Forest", B);
    expect(pt(game, elder)).toEqual([3, 3]);
  });
});

describe("Regal Imperiosaur", () => {
  it("gives other Dinosaurs you control +1/+1, not itself", () => {
    const { game } = setUp();
    const regal = spawn(game, "Regal Imperiosaur");
    const stomper = spawn(game, "Topiary Stomper");
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, regal)).toEqual([5, 4]);
    expect(pt(game, stomper)).toEqual([5, 5]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("Yeva, Nature's Herald", () => {
  const castable = (game: Game, card: ObjectId): boolean =>
    game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

  it("lets you cast green creature spells at instant speed, and only those", () => {
    const { game } = setUp(["Grizzly Bears", "Savannah Lions"], [], false);
    lands(game, "Forest", 2);
    lands(game, "Plains", 2);
    spawn(game, "Yeva, Nature's Herald");
    // Both are castable in a main phase, so only the timing differs below.
    expect(castable(game, inHand(game, "Savannah Lions"))).toBe(true);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(castable(game, inHand(game, "Grizzly Bears"))).toBe(true);
    expect(castable(game, inHand(game, "Savannah Lions"))).toBe(false);
  });

  it("without Yeva, the green creature waits for a main phase", () => {
    const { game } = setUp(["Grizzly Bears"], [], false);
    lands(game, "Forest", 2);
    game.advanceUntil((s) => s.turn.step === "begin-combat" && s.priority.holder === A);
    expect(castable(game, inHand(game, "Grizzly Bears"))).toBe(false);
  });
});

describe("Rishkar's Expertise", () => {
  it("draws the greatest power among your creatures, then casts a spell of mana value 5 or less free", () => {
    const { game, a } = setUp(["Rishkar's Expertise", "Grizzly Bears", "Colossal Dreadmaw"]);
    lands(game, "Forest", 6);
    spawn(game, "Grizzly Bears");
    spawn(game, "Carnage Tyrant"); // 7/6
    const bears = inHand(game, "Grizzly Bears");
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, o) => {
      offer = o;
      return { type: "cast-spell", player: A, card: bears, targets: [], via: "effect", free: true };
    };
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Rishkar's Expertise"), targets: [] });
    game.advanceUntil(quiet);
    // -1 the Expertise, +7 drawn, -1 the free Bears.
    expect(game.handOf(A).length).toBe(before - 1 + 7 - 1);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    // The Dreadmaw (mana value 6) isn't offered.
    const offered = offer?.casts.map((c) => game.state.objects[c.card].cardName) ?? [];
    expect(offered).toContain("Grizzly Bears");
    expect(offered).not.toContain("Colossal Dreadmaw");
  });
});

describe("Clifftop Lookout", () => {
  it("reveals until a land, puts it onto the battlefield tapped and the rest on the bottom", () => {
    const { game } = setUp(["Clifftop Lookout"], ["Grizzly Bears", "Savannah Lions", "Forest"]);
    lands(game, "Forest", 3);
    const library = game.libraryOf(A);
    const top3 = library.slice(0, 3).map((id) => game.state.objects[id].cardName);
    expect(top3).toEqual(["Grizzly Bears", "Savannah Lions", "Forest"]);
    const forest = library[2];
    cast(game, "Clifftop Lookout");
    expect(game.state.objects[forest].zone).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    const after = game.libraryOf(A);
    expect(after.slice(-2).map((id) => game.state.objects[id].cardName).sort()).toEqual(["Grizzly Bears", "Savannah Lions"]);
    expect(game.state.objects[after[0]].cardName).toBe("Wastes");
  });
});
