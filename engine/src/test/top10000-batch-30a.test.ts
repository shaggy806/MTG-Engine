/**
 * Top-10000 batch 30a. No engine change: each test pins the clause most
 * likely to be wired wrong — whose draw Fecundity offers, who Mai drains,
 * what Slash the Ranks spares, Big Mother Mouser's counters read as it last
 * existed, Carnifex Demon sparing itself, Saheeli's and Cadric's token copies,
 * Silverwing Squadron's count and The Boulder's X.
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
    controllers: { [A]: a, [B]: yes(new ScriptedController(B)) },
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
/** Every permanent of that name, a token stack counted as each token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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
const activatedEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.activated[index].effect!;
const triggeredEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-10000 batch 30a — Fecundity", () => {
  it("offers the draw to the dead creature's controller, not to Fecundity's", () => {
    const { game } = setUp();
    spawn(game, "Fecundity");
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = game.handOf(A).length;
    const before = game.handOf(B).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(game.handOf(B)).toHaveLength(before + 1);
    expect(game.handOf(A)).toHaveLength(mine);
  });
});

describe("top-10000 batch 30a — Mai, Scornful Striker and Slash the Ranks", () => {
  it("drains the caster of a noncreature spell only; the wrath spares a commander", () => {
    const { game } = setUp(["Grizzly Bears", "Slash the Ranks"]);
    lands(game, "Forest", 2);
    lands(game, "Plains", 5);
    const mai = spawn(game, "Mai, Scornful Striker");
    const commander = spawn(game, "Hill Giant", B);
    game.state.objects[commander].isCommander = true;
    const jace = spawn(game, "Jace Beleren", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(20);
    const bears = named(game, "Grizzly Bears")[0];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Slash the Ranks"), targets: [] });
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(20);
    expect(zone(game, mai)).toBe("graveyard");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, jace)).toBe("graveyard");
    expect(zone(game, commander)).toBe("battlefield");
  });
});

describe("top-10000 batch 30a — Big Mother Mouser", () => {
  it("enters with two, doubles on attack, and makes a Robot per counter it died with", () => {
    const { game } = setUp();
    const mouser = spawn(game, "Big Mother Mouser");
    expect(counters(game, mouser)).toBe(2);
    game.debugApplyEffect(A, triggeredEffect("Big Mother Mouser", 0), [], { source: mouser });
    settle(game);
    expect(counters(game, mouser)).toBe(4);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mouser }]);
    settle(game);
    expect(zone(game, mouser)).toBe("graveyard");
    expect(howMany(game, "Robot Token (Big Mother Mouser)")).toBe(4);
  });
});

describe("top-10000 batch 30a — Carnifex Demon", () => {
  it("puts a -1/-1 counter on every other creature, its controller's too", () => {
    const { game } = setUp();
    const demon = spawn(game, "Carnifex Demon");
    expect(counters(game, demon, "-1/-1")).toBe(2);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, activatedEffect("Carnifex Demon"), [], { source: demon });
    settle(game);
    expect(counters(game, mine, "-1/-1")).toBe(1);
    expect(counters(game, theirs, "-1/-1")).toBe(1);
    expect(counters(game, demon, "-1/-1")).toBe(2);
  });
});

describe("top-10000 batch 30a — Saheeli, the Sun's Brilliance", () => {
  it("makes a hasty token copy that's an artifact in addition to its other types", () => {
    const { game } = setUp();
    const saheeli = spawn(game, "Saheeli, the Sun's Brilliance");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, activatedEffect("Saheeli, the Sun's Brilliance"), [{ kind: "object", object: bears }], {
      source: saheeli,
    });
    settle(game);
    const token = named(game, "Grizzly Bears").find((id) => game.state.objects[id].isToken);
    expect(token).toBeDefined();
    const c = computeCharacteristics(game.state, registry, token!);
    expect(c.types).toContain("artifact");
    expect(c.types).toContain("creature");
    expect(c.subtypes).toContain("Bear");
    expect(c.keywords.has("haste")).toBe(true);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });
});

describe("top-10000 batch 30a — Cadric, Soul Kindler", () => {
  it("pays {1} for a hasty token copy of a legend, and the legend rule leaves the token alone", () => {
    const { game } = setUp();
    spawn(game, "Cadric, Soul Kindler");
    lands(game, "Wastes", 1);
    game.debugSpawn("Isamaru, Hound of Konda", A, "battlefield", { summoningSick: false, announceEntry: true });
    settle(game);
    const isamarus = named(game, "Isamaru, Hound of Konda");
    expect(isamarus).toHaveLength(2);
    const token = isamarus.find((id) => game.state.objects[id].isToken);
    expect(token).toBeDefined();
    expect(computeCharacteristics(game.state, registry, token!).keywords.has("haste")).toBe(true);
  });
});

describe("top-10000 batch 30a — Silverwing Squadron", () => {
  it("is as big as the number of creatures you control, itself included", () => {
    const { game } = setUp();
    const squadron = spawn(game, "Silverwing Squadron");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    const c = computeCharacteristics(game.state, registry, squadron);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });
});

describe("top-10000 batch 30a — The Boulder, Ready to Rumble", () => {
  it("earthbends X, counting only your creatures with power 4 or greater", () => {
    const { game } = setUp();
    const boulder = spawn(game, "The Boulder, Ready to Rumble");
    spawn(game, "Ravenous Baloth");
    spawn(game, "Hill Giant");
    spawn(game, "Ravenous Baloth", B);
    const [forest] = lands(game, "Forest", 1);
    game.debugApplyEffect(A, triggeredEffect("The Boulder, Ready to Rumble"), [{ kind: "object", object: forest }], {
      source: boulder,
    });
    settle(game);
    expect(counters(game, forest)).toBe(2);
    expect(computeCharacteristics(game.state, registry, forest).types).toContain("creature");
  });
});
