/**
 * Top-5000 batch 27g. Pins the clauses most likely to be wired wrong: the
 * Goblin-only cast permission off Rundvelt Hordemaster's exile, Goblin
 * Rabblemaster's "other" must-attack and its count of other attackers, Shaman
 * of the Pack's Elf count, Shield of the Oversoul's colour gates, City of
 * Death's token copy, and Aang's Journey's kicked two-card search.
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const countNamed = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 27g — Goblin Rabblemaster", () => {
  it("makes other Goblins attack, makes a hasty Goblin, and gets +1/+0 per other attacking Goblin", () => {
    const { game } = setUp();
    const rabble = spawn(game, "Goblin Rabblemaster");
    const brutes = [spawn(game, "Boggart Brute"), spawn(game, "Boggart Brute")];
    expect(game.characteristics(brutes[0]).restrictions.has("must-attack")).toBe(true);
    expect(game.characteristics(rabble).restrictions.has("must-attack")).toBe(false);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const token = named(game, "Goblin Token (Haste)");
    expect(token).toHaveLength(1);
    expect(game.characteristics(token[0]).keywords.has("haste")).toBe(true);
    const attackers = [rabble, ...brutes, token[0]].map((attacker) => ({ attacker, defender: B }));
    game.dispatch({ type: "declare-attackers", player: A, attackers });
    game.advanceUntil((s) => (s.turn.step === "declare-blockers" && quiet(s)) || s.result.over);
    // Three other attacking Goblins: 2 + 3 power, toughness unchanged.
    expect(pt(game, rabble)).toEqual([5, 2]);
  });
});

describe("top-5000 batch 27g — Shaman of the Pack", () => {
  it("drains the target opponent for every Elf you control, itself included", () => {
    const { game } = setUp();
    spawn(game, "Llanowar Elves");
    spawn(game, "Llanowar Elves", B);
    game.debugSpawn("Shaman of the Pack", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 27g — Shield of the Oversoul", () => {
  it("gives a green creature +1/+1 and indestructible, a white one +1/+1 and flying", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const lions = spawn(game, "Savannah Lions");
    const onBears = spawn(game, "Shield of the Oversoul");
    game.state.objects[onBears].attachedTo = bears;
    const onLions = spawn(game, "Shield of the Oversoul");
    game.state.objects[onLions].attachedTo = lions;
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bears).keywords.has("flying")).toBe(false);
    expect(pt(game, lions)).toEqual([3, 2]);
    expect(game.characteristics(lions).keywords.has("flying")).toBe(true);
    expect(game.characteristics(lions).keywords.has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 27g — City of Death", () => {
  it("chapter II copies the target token you control", () => {
    const { game } = setUp();
    const city = spawn(game, "City of Death");
    const goblin = spawn(game, "Goblin Token");
    const copy = registry.get("City of Death")!.chapters![1];
    expect(copy.at).toEqual([2, 3, 4, 5, 6]);
    game.debugApplyEffect(A, copy.effect!, [{ kind: "object", object: goblin }], { source: city });
    settle(game);
    expect(countNamed(game, "Goblin Token")).toBe(2);
  });
});

describe("top-5000 batch 27g — Aang's Journey", () => {
  it("unkicked finds one basic land; kicked a basic land and a Shrine; 2 life either way", () => {
    const { game, a } = setUp();
    const def = registry.get("Aang's Journey")!;
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, def.effect!);
    settle(game);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    expect(life(game, A)).toBe(22);

    const shrine = game.debugSpawn("Sanctum of Stone Fangs", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => {
      const isShrine = (id: ObjectId): boolean => game.state.objects[id].cardName === "Sanctum of Stone Fangs";
      return [eligible.find((id) => !isShrine(id))!, eligible.find(isShrine)!];
    };
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, def.kicker!.effect!);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 2);
    expect(game.handOf(A)).toContain(shrine);
    expect(life(game, A)).toBe(24);
  });
});
