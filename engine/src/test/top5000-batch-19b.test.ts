/**
 * Top-5000 batch 19b. No engine change: each test pins the clause of one card
 * most likely to be wired wrong — Halvar's double strike for a creature
 * enchanted by *anyone's* Aura and its begin-combat attach, Sword of the
 * Realms (cast as the back face) returning its dead creature to hand, Two-Handed
 * Axe doubling power as the attack trigger resolves, Greater Auramancy's
 * "other" (two give each other shroud), renew's keyword counters, Orthion's
 * hasty copies sacrificed at end step, Together Forever's "when that creature
 * dies this turn" outliving its counters, Nether Traitor watching only
 * creatures you own die, Earthshaker Dreadmaw's "other" Dinosaurs, and
 * Steelbane Hydra's X counters paying for its ability.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { faceName } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
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
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const tokenCount = (game: Game, name: string): number =>
  named(game, name)
    .filter((id) => game.state.objects[id].isToken)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const keywordsOf = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, registry, id).keywords;
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(id)]);
  settle(game);
};
const has = (refs: readonly TargetRef[] | undefined, id: ObjectId): boolean =>
  (refs ?? []).some((r) => r.kind === "object" && r.object === id);

describe("top-5000 batch 19b — Halvar, God of Battle", () => {
  it("gives double strike to creatures you control that are equipped, or enchanted by anyone's Aura", () => {
    const { game } = setUp();
    const halvar = spawn(game, "Halvar, God of Battle");
    const equipped = spawn(game, "Grizzly Bears");
    const splitter = spawn(game, "Bonesplitter");
    game.state.objects[splitter].attachedTo = equipped;
    const enchanted = spawn(game, "Grizzly Bears");
    const pacifism = spawn(game, "Pacifism", B);
    game.state.objects[pacifism].attachedTo = enchanted;
    const plain = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const theirSplitter = spawn(game, "Bonesplitter", B);
    game.state.objects[theirSplitter].attachedTo = theirs;
    expect(keywordsOf(game, equipped).has("double-strike")).toBe(true);
    expect(keywordsOf(game, enchanted).has("double-strike")).toBe(true);
    expect(keywordsOf(game, plain).has("double-strike")).toBe(false);
    expect(keywordsOf(game, halvar).has("double-strike")).toBe(false);
    expect(keywordsOf(game, theirs).has("double-strike")).toBe(false);
  });

  it("at the beginning of combat moves an Equipment from one of your creatures to another, never one on theirs", () => {
    const { game, a } = setUp();
    spawn(game, "Halvar, God of Battle");
    const from = spawn(game, "Grizzly Bears");
    const to = spawn(game, "Hill Giant");
    const splitter = spawn(game, "Bonesplitter");
    game.state.objects[splitter].attachedTo = from;
    const theirs = spawn(game, "Grizzly Bears", B);
    const theirSplitter = spawn(game, "Bonesplitter", B);
    game.state.objects[theirSplitter].attachedTo = theirs;
    let offered: readonly (readonly TargetRef[])[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options;
      return [obj(splitter), obj(to)];
    };
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(has(offered[0], splitter)).toBe(true);
    expect(has(offered[0], theirSplitter)).toBe(false);
    expect(has(offered[1], to)).toBe(true);
    expect(has(offered[1], theirs)).toBe(false);
    expect(game.state.objects[splitter].attachedTo).toBe(to);
    expect(keywordsOf(game, to).has("double-strike")).toBe(true);
    expect(keywordsOf(game, from).has("double-strike")).toBe(false);
  });
});

describe("top-5000 batch 19b — Sword of the Realms", () => {
  it("cast as Halvar's back face, it returns its creature to its owner's hand when it dies", () => {
    const { game } = setUp(["Halvar, God of Battle"], "Plains");
    lands(game, "Plains", 4);
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Halvar, God of Battle")!;
    game.dispatch({ type: "cast-spell", player: A, card, face: 1, targets: [] });
    settle(game);
    expect(zone(game, card)).toBe("battlefield");
    expect(faceName(game.state.objects[card])).toBe("Sword of the Realms");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    expect(game.state.objects[card].attachedTo).toBe(bears);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 2]);
    expect(c.keywords.has("vigilance")).toBe(true);
    destroy(game, bears);
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-5000 batch 19b — Two-Handed Axe", () => {
  it("doubles the equipped attacker's power until end of turn", () => {
    const { game, a } = setUp();
    const giant = spawn(game, "Hill Giant");
    const axe = spawn(game, "Two-Handed Axe");
    game.state.objects[axe].attachedTo = giant;
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(14);
    const c = computeCharacteristics(game.state, registry, giant);
    expect([c.power, c.toughness]).toEqual([6, 3]);
  });
});

describe("top-5000 batch 19b — Greater Auramancy", () => {
  it("shrouds your other enchantments and your enchanted creatures; two shroud each other", () => {
    const { game } = setUp();
    const first = spawn(game, "Greater Auramancy");
    const anthem = spawn(game, "Glorious Anthem");
    const theirAnthem = spawn(game, "Glorious Anthem", B);
    const enchanted = spawn(game, "Grizzly Bears");
    const pacifism = spawn(game, "Pacifism", B);
    game.state.objects[pacifism].attachedTo = enchanted;
    const plain = spawn(game, "Grizzly Bears");
    expect(keywordsOf(game, anthem).has("shroud")).toBe(true);
    expect(keywordsOf(game, enchanted).has("shroud")).toBe(true);
    expect(keywordsOf(game, first).has("shroud")).toBe(false);
    expect(keywordsOf(game, plain).has("shroud")).toBe(false);
    expect(keywordsOf(game, theirAnthem).has("shroud")).toBe(false);
    expect(keywordsOf(game, pacifism).has("shroud")).toBe(false);
    const second = spawn(game, "Greater Auramancy");
    expect(keywordsOf(game, first).has("shroud")).toBe(true);
    expect(keywordsOf(game, second).has("shroud")).toBe(true);
  });
});

describe("top-5000 batch 19b — Qarsi Revenant", () => {
  it("renews from the graveyard: exiles itself and puts three keyword counters on the target", () => {
    const { game } = setUp();
    lands(game, "Swamp", 3);
    const bears = spawn(game, "Grizzly Bears");
    const qarsi = game.debugSpawn("Qarsi Revenant", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: qarsi, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    expect(zone(game, qarsi)).toBe("exile");
    for (const kind of ["flying", "deathtouch", "lifelink"]) {
      expect(counters(game, bears, kind)).toBe(1);
      expect(keywordsOf(game, bears).has(kind)).toBe(true);
    }
  });
});

describe("top-5000 batch 19b — Orthion, Hero of Lavabrink", () => {
  it("makes one, then five, hasty copies of another creature, all sacrificed at the next end step", () => {
    const { game } = setUp();
    const orthion = spawn(game, "Orthion, Hero of Lavabrink");
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Mountain", 11);
    game.dispatch({ type: "activate-ability", player: A, source: orthion, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    expect(tokenCount(game, "Grizzly Bears")).toBe(1);
    const token = named(game, "Grizzly Bears").find((id) => game.state.objects[id].isToken)!;
    expect(keywordsOf(game, token).has("haste")).toBe(true);
    game.state.objects[orthion].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: orthion, abilityIndex: 1, targets: [obj(bears)] });
    settle(game);
    expect(tokenCount(game, "Grizzly Bears")).toBe(6);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    expect(tokenCount(game, "Grizzly Bears")).toBe(0);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 19b — Together Forever", () => {
  it("returns a creature that dies this turn even after it has lost its counters", () => {
    const { game } = setUp();
    spawn(game, "Wastes");
    const forever = spawn(game, "Together Forever");
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    game.dispatch({ type: "activate-ability", player: A, source: forever, abilityIndex: 0, targets: [obj(bears)] });
    settle(game);
    game.state.objects[bears].counters = {};
    destroy(game, bears);
    expect(zone(game, bears)).toBe("hand");
    expect(game.handOf(B)).toContain(bears);
  });
});

describe("top-5000 batch 19b — Nether Traitor", () => {
  it("returns from the graveyard for {B} when a creature you own dies, not one an opponent owns", () => {
    const { game } = setUp();
    const [swamp] = lands(game, "Swamp", 1);
    const traitor = game.debugSpawn("Nether Traitor", A, "graveyard");
    destroy(game, spawn(game, "Grizzly Bears", B));
    expect(zone(game, traitor)).toBe("graveyard");
    expect(game.state.objects[swamp].tapped).toBe(false);
    destroy(game, spawn(game, "Grizzly Bears"));
    expect(zone(game, traitor)).toBe("battlefield");
    expect(game.state.objects[swamp].tapped).toBe(true);
    expect(keywordsOf(game, traitor).has("shadow")).toBe(true);
  });
});

describe("top-5000 batch 19b — Earthshaker Dreadmaw", () => {
  it("draws one card for each other Dinosaur you control", () => {
    const { game } = setUp();
    spawn(game, "Colossal Dreadmaw");
    spawn(game, "Colossal Dreadmaw");
    spawn(game, "Colossal Dreadmaw", B);
    const before = game.handOf(A).length;
    game.debugSpawn("Earthshaker Dreadmaw", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.handOf(A).length).toBe(before + 2);
  });
});

describe("top-5000 batch 19b — Steelbane Hydra", () => {
  it("enters with X counters and spends one to destroy an artifact", () => {
    const { game } = setUp(["Steelbane Hydra"], "Forest");
    lands(game, "Forest", 4);
    const hydra = game.handOf(A).find((id) => game.state.objects[id].cardName === "Steelbane Hydra")!;
    game.dispatch({ type: "cast-spell", player: A, card: hydra, targets: [], xValue: 2 });
    settle(game);
    expect(counters(game, hydra)).toBe(2);
    const ring = spawn(game, "Sol Ring", B);
    lands(game, "Forest", 3);
    game.dispatch({ type: "activate-ability", player: A, source: hydra, abilityIndex: 0, targets: [obj(ring)] });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(counters(game, hydra)).toBe(1);
  });
});
