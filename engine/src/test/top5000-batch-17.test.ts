/**
 * Top-5000 batch 17 (ranks 2185–2243, a short batch). No new engine
 * vocabulary; these pin a mass bounce whose toughness bound is read off the
 * board (Scourge of Fleets) and a token count that grows with a counter
 * (Assemble the Legion). The recheck of the batch's short-pass blockers
 * added three more: a mass -1/-1 counted after its own tokens (Swarmyard
 * Massacre), counters by the target's type (Forge of Heroes), and three
 * different tokens on death (Triplicate Titan), and a reflexive trigger
 * behind an intervening-if (Earthbender Ascension).
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

/** A searches for as many cards as it may, up to one. */
const searching = (): ScriptedController => {
  const c = new ScriptedController(A);
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (a: ScriptedController = new ScriptedController(A)): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const tokens = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("top-5000 batch 17 — Scourge of Fleets", () => {
  it("bounces opponents' creatures with toughness up to your Island count", () => {
    const game = setUp();
    spawn(game, "Island");
    spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    const mine = spawn(game, "Grizzly Bears");
    game.debugSpawn("Scourge of Fleets", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 17 — Assemble the Legion", () => {
  it("makes one more Soldier each upkeep", () => {
    const game = setUp();
    spawn(game, "Assemble the Legion");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(tokens(game, "Red-White Soldier Token")).toBe(1);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main");
    expect(tokens(game, "Red-White Soldier Token")).toBe(3);
  });
});

describe("top-5000 batch 17 — Swarmyard Massacre", () => {
  it("gives -1/-1 per Insect, Rat, Spider or Squirrel, counting its own Squirrels", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, registry.get("Swarmyard Massacre")!.effect!, []);
    game.advanceUntil(quiet);
    // Two Squirrels: -2/-2 to each creature that isn't one of the four types.
    expect(computeCharacteristics(game.state, registry, bears).toughness).toBe(0);
    expect(computeCharacteristics(game.state, registry, giant).toughness).toBe(1);
    expect(tokens(game, "Squirrel Token")).toBe(2);
  });
});

describe("top-5000 batch 17 — Forge of Heroes", () => {
  it("puts a +1/+1 counter on a creature commander that entered this turn", () => {
    const game = setUp();
    const forge = spawn(game, "Forge of Heroes");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: forge,
      abilityIndex: 1,
      targets: [{ kind: "object", object: commander }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[commander].counters?.["+1/+1"] ?? 0).toBe(1);
    expect(game.state.objects[commander].counters?.["loyalty"] ?? 0).toBe(0);
  });
});

describe("top-5000 batch 17 — Triplicate Titan", () => {
  it("leaves a flying, a vigilance and a trample Golem", () => {
    const game = setUp();
    const titan = spawn(game, "Triplicate Titan");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: titan }]);
    game.advanceUntil(quiet);
    for (const [name, kw] of [["Golem Flying Token", "flying"], ["Golem Vigilance Token", "vigilance"], ["Golem Trample Token", "trample"]] as const) {
      const golem = game.battlefield.find((id) => game.state.objects[id].cardName === name)!;
      expect(computeCharacteristics(game.state, registry, golem).keywords.has(kw)).toBe(true);
    }
  });
});

describe("top-5000 batch 17 — Earthbender Ascension", () => {
  const quest = (game: Game, id: ObjectId): number => game.state.objects[id].counters?.["quest"] ?? 0;
  const plusOne = (game: Game, id: ObjectId): number => game.state.objects[id].counters?.["+1/+1"] ?? 0;

  it("earthbends 2 and fetches a basic land tapped as it enters", () => {
    const game = setUp(searching());
    const forest = spawn(game, "Forest");
    const ascension = game.debugSpawn("Earthbender Ascension", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(plusOne(game, forest)).toBe(2);
    expect(computeCharacteristics(game.state, registry, forest).types).toContain("creature");
    const fetched = game.battlefield.filter((id) => game.state.objects[id].cardName === "Wastes");
    expect(fetched).toHaveLength(1);
    expect(game.state.objects[fetched[0]].tapped).toBe(true);
    // The fetched land's landfall.
    expect(quest(game, ascension)).toBe(1);
  });

  it("pumps a creature from the fourth quest counter on", () => {
    const game = setUp();
    const ascension = spawn(game, "Earthbender Ascension");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[ascension].counters = { quest: 2 };
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(quest(game, ascension)).toBe(3);
    expect(plusOne(game, bears)).toBe(0);
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(quest(game, ascension)).toBe(4);
    expect(plusOne(game, bears)).toBe(1);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("trample")).toBe(true);
  });

  it("does nothing more once it has left, however many counters it had", () => {
    const game = setUp();
    const ascension = spawn(game, "Earthbender Ascension");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[ascension].counters = { quest: 5 };
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ascension }]);
    game.advanceUntil(quiet);
    expect(zone(game, ascension)).toBe("graveyard");
    expect(plusOne(game, bears)).toBe(0);
  });
});
