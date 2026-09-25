/**
 * Card sweep 2, batch C1 (top-500 commanders): every card from the batch the
 * engine could already run faithfully, one describe per card.
 */

import { describe, expect, it } from "vitest";

import { effectiveSubtypes, effectiveTypes } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const types = (game: Game, id: ObjectId) => effectiveTypes(game.state, registry, game.state.objects[id]);

const hand = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "hand");

describe("Lathril, Blade of the Elves", () => {
  it("makes that many Elf Warriors on combat damage", () => {
    const { game, a } = setUp();
    const lathril = spawn(game, "Lathril, Blade of the Elves");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(lathril)]);
    game.advanceUntil(quiet);
    a.declareAttackersFn = () => [{ attacker: lathril, defender: B }];
    toStep(game, "postcombat-main");
    expect(life(game, B)).toBe(17);
    const warriors = named(game, "Elf Warrior Token");
    expect(warriors.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(3);
  });

  it("taps ten other Elves: each opponent loses 10, you gain 10", () => {
    const { game } = setUp();
    const lathril = spawn(game, "Lathril, Blade of the Elves");
    const elves: ObjectId[] = [];
    for (let i = 0; i < 9; i += 1) elves.push(spawn(game, "Llanowar Elves"));
    expect(game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === lathril)).toBe(false);
    elves.push(spawn(game, "Llanowar Elves"));
    const offer = game.legalActions(A).find((o) => o.kind === "activate-ability" && o.source === lathril);
    expect(offer).toBeDefined();
    activate(game, lathril, 0, [], { tap: elves });
    expect(life(game, B)).toBe(10);
    expect(life(game, A)).toBe(30);
    expect(elves.every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

const makeTokens = (game: Game, token: string, count: number, player: PlayerId = A): ObjectId[] => {
  const before = new Set(game.state.zones.shared.battlefield);
  game.debugApplyEffect(player, { kind: "create-token", token, count }, []);
  game.advanceUntil(quiet);
  return game.state.zones.shared.battlefield.filter((id) => !before.has(id));
};

describe("Baylen, the Haymaker", () => {
  it("taps two tokens for a mana of the chosen colour", () => {
    const { game } = setUp();
    const baylen = spawn(game, "Baylen, the Haymaker");
    const tokens = makeTokens(game, "Elf Warrior Token", 2);
    game.dispatch({ type: "activate-ability", player: A, source: baylen, abilityIndex: 0, targets: [], tap: tokens, manaColors: ["G"] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G"]);
    expect(tokens.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("three tokens draw; four put three counters and grant trample", () => {
    const { game } = setUp();
    const baylen = spawn(game, "Baylen, the Haymaker");
    const tokens = makeTokens(game, "Elf Warrior Token", 7);
    const handBefore = game.handOf(A).length;
    activate(game, baylen, 1, [], { tap: tokens.slice(0, 3) });
    expect(game.handOf(A).length).toBe(handBefore + 1);
    activate(game, baylen, 2, [], { tap: tokens.slice(3, 7) });
    expect(game.state.objects[baylen].counters["+1/+1"]).toBe(3);
    expect(game.viewFor(A).objects[baylen]?.keywords).toContain("trample");
  });
});

describe("Meren of Clan Nel Toth", () => {
  it("experience per other death; end step reanimates within it, else returns to hand", () => {
    const { game, a } = setUp();
    spawn(game, "Meren of Clan Nel Toth");
    const bear = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)]);
    game.advanceUntil(quiet);
    expect(game.state.players[A].counters.experience).toBe(1);
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    a.chooseTargetsFn = () => [obj(giant)];
    toStep(game, "cleanup");
    // Hill Giant is mana value 4 > 1 experience: to hand.
    expect(game.state.objects[giant].zone).toBe("hand");
  });

  it("returns a card to the battlefield when its mana value fits", () => {
    const { game, a } = setUp();
    spawn(game, "Meren of Clan Nel Toth");
    for (let i = 0; i < 2; i += 1) {
      const bear = spawn(game, "Grizzly Bears");
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)]);
      game.advanceUntil(quiet);
    }
    expect(game.state.players[A].counters.experience).toBe(2);
    const bears = game.state.zones.perPlayer[A].graveyard[0];
    a.chooseTargetsFn = () => [obj(bears)];
    toStep(game, "cleanup");
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("Atla Palani, Nest Tender", () => {
  const deck = [...Array<string>(10).fill("Island"), "Hill Giant"];
  it("makes an Egg; an Egg dying digs out a creature onto the battlefield", () => {
    const { game } = setUp(deck);
    const atla = spawn(game, "Atla Palani, Nest Tender");
    lands(game, "Mountain", 2);
    activate(game, atla, 0);
    const [egg] = named(game, "Egg Token");
    expect(game.viewFor(A).objects[egg]?.keywords).toContain("defender");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(egg)]);
    game.advanceUntil(quiet);
    expect(named(game, "Hill Giant", A)).toHaveLength(1);
  });

  it("sees an Egg that dies alongside it", () => {
    const { game } = setUp(deck);
    const atla = spawn(game, "Atla Palani, Nest Tender");
    lands(game, "Mountain", 2);
    activate(game, atla, 0);
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } }, []);
    game.advanceUntil(quiet);
    expect(named(game, "Hill Giant", A)).toHaveLength(1);
  });
});
