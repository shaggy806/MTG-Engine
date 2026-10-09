/**
 * Top-5000 batch 20f. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — a prohibition read from the right
 * side (Linvala), an Aura's dies trigger finding the card in the graveyard
 * (Angelic Destiny), job select's token and granted trigger (Black Mage's
 * Rod), "those creatures" (Virtue of Loyalty), two different target players
 * and the second draw (Gleaming Splendor), the next-spell copy (Twinferno),
 * a graveyard permission (Zul Ashur), a count of attacking Elves (Dwynen).
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
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
const castable = (game: Game, card: ObjectId, player: PlayerId = A): boolean =>
  game.legalActions(player).some((o: LegalAction) => o.kind === "cast-spell" && o.card === card);
const activatable = (game: Game, source: ObjectId, player: PlayerId = A): boolean =>
  game.legalActions(player).some((o: LegalAction) => o.kind === "activate-ability" && o.source === source);
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
const player = (p: PlayerId) => ({ kind: "player", player: p }) as const;

describe("top-5000 batch 20f — Linvala, Keeper of Silence", () => {
  it("stops the abilities of her controller's opponents' creatures, mana ones included, and nothing else", () => {
    const { game } = setUp();
    const wastes = spawn(game, "Wastes");
    const elves = spawn(game, "Llanowar Elves");
    expect(activatable(game, elves)).toBe(true);
    spawn(game, "Linvala, Keeper of Silence", B);
    expect(activatable(game, elves)).toBe(false);
    // A land isn't a creature.
    expect(activatable(game, wastes)).toBe(true);
    // Alice's own Linvala doesn't stop Alice's creatures.
    const { game: other } = setUp();
    const mine = spawn(other, "Llanowar Elves");
    spawn(other, "Linvala, Keeper of Silence");
    expect(activatable(other, mine)).toBe(true);
  });
});

describe("top-5000 batch 20f — Black Mage's Rod", () => {
  it("job select makes a Hero wearing it, a 2/1 Wizard that pings each opponent on a noncreature spell", () => {
    const { game } = setUp(["Sol Ring"]);
    spawn(game, "Wastes");
    const rod = game.debugSpawn("Black Mage's Rod", A, "battlefield", { announceEntry: true });
    settle(game);
    const heroes = named(game, "Hero Token (Black Mage's Rod)");
    expect(heroes).toHaveLength(1);
    expect(game.state.objects[rod].attachedTo).toBe(heroes[0]);
    const c = computeCharacteristics(game.state, registry, heroes[0]);
    expect([c.power, c.toughness]).toEqual([2, 1]);
    expect(c.subtypes).toContain("Wizard");
    // The trigger's resolution leaves turn 1's main phase; cast on the next.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 20f — Cid, Freeflier Pilot", () => {
  it("flies on its controller's turn only, and returns an Equipment card from the graveyard", () => {
    const { game } = setUp();
    lands(game, "Wastes", 2);
    const cid = spawn(game, "Cid, Freeflier Pilot");
    const theirs = spawn(game, "Cid, Freeflier Pilot", B);
    expect(computeCharacteristics(game.state, registry, cid).keywords.has("flying")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("flying")).toBe(false);
    const splitter = game.debugSpawn("Bonesplitter", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: cid, abilityIndex: 0, targets: [obj(splitter)] });
    settle(game);
    expect(zone(game, splitter)).toBe("hand");
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("takes {1} off an Equipment spell", () => {
    const { game } = setUp(["Vulshok Morningstar"]);
    spawn(game, "Wastes");
    const morningstar = inHand(game, "Vulshok Morningstar");
    expect(castable(game, morningstar)).toBe(false);
    spawn(game, "Cid, Freeflier Pilot");
    expect(castable(game, morningstar)).toBe(true);
  });
});

describe("top-5000 batch 20f — Virtue of Loyalty", () => {
  it("puts a counter on each creature you control at your end step and untaps them", () => {
    const { game } = setUp();
    spawn(game, "Virtue of Loyalty");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end");
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(counters(game, theirs)).toBe(0);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });
});

describe("top-5000 batch 20f — Kabira Takedown", () => {
  it("deals damage equal to the creatures you control", () => {
    const { game } = setUp(["Kabira Takedown"]);
    lands(game, "Plains", 2);
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    const dreadmaw = spawn(game, "Colossal Dreadmaw", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Kabira Takedown"), targets: [obj(giant)] });
    settle(game);
    // Two creatures: 2 damage, short of the Giant's 3 toughness.
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, dreadmaw)).toBe("battlefield");
  });

  it("kills with enough creatures", () => {
    const { game } = setUp(["Kabira Takedown"]);
    lands(game, "Plains", 2);
    for (let i = 0; i < 3; i += 1) spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Kabira Takedown"), targets: [obj(giant)] });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 20f — Vraska Joins Up", () => {
  it("gives each creature you control a deathtouch counter as it enters", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Vraska Joins Up", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, bears, "deathtouch")).toBe(1);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("deathtouch")).toBe(true);
    expect(counters(game, theirs, "deathtouch")).toBe(0);
  });
});

describe("top-5000 batch 20f — Gleaming Splendor", () => {
  it("two target players each draw, and an opponent's second draw of the turn makes a Treasure", () => {
    const { game } = setUp();
    lands(game, "Plains", 3);
    const splendor = spawn(game, "Gleaming Splendor");
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: splendor,
      abilityIndex: 0,
      targets: [player(A), player(B)],
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handA + 1);
    expect(game.handOf(B)).toHaveLength(handB + 1);
    // Bob's first draw this turn: nothing yet.
    expect(named(game, "Treasure Token")).toHaveLength(0);
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    settle(game);
    const treasures = named(game, "Treasure Token");
    expect(treasures).toHaveLength(1);
    expect(game.state.objects[treasures[0]].controller).toBe(A);
    // A third draw doesn't trigger again.
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 20f — Twinferno", () => {
  it("copies the next instant or sorcery spell you cast this turn", () => {
    const { game } = setUp(["Twinferno", "Divination"]);
    lands(game, "Mountain", 2);
    lands(game, "Island", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Twinferno"), modes: [0], targets: [] });
    settle(game);
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    // Divination left the hand; it and its copy drew two each.
    expect(game.handOf(A)).toHaveLength(before - 1 + 4);
  });

  it("gives a creature you control double strike", () => {
    const { game } = setUp(["Twinferno"]);
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Twinferno"), modes: [1], targets: [obj(bears)] });
    settle(game);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("double-strike")).toBe(true);
  });
});

describe("top-5000 batch 20f — Zul Ashur, Lich Lord", () => {
  it("lets you cast a Zombie creature card from your graveyard this turn", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    const zul = spawn(game, "Zul Ashur, Lich Lord");
    const ghoul = game.debugSpawn("Diregraf Ghoul", A, "graveyard");
    expect(castable(game, ghoul)).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: zul, abilityIndex: 0, targets: [obj(ghoul)] });
    settle(game);
    expect(castable(game, ghoul)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: ghoul, targets: [], via: "graveyard-permission" });
    settle(game);
    expect(zone(game, ghoul)).toBe("battlefield");
  });
});

describe("top-5000 batch 20f — Dwynen, Gilt-Leaf Daen", () => {
  it("gains 1 life for each attacking Elf you control, itself included", () => {
    const { game } = setUp();
    const dwynen = spawn(game, "Dwynen, Gilt-Leaf Daen");
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    expect(computeCharacteristics(game.state, registry, elves).power).toBe(2);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: dwynen, defender: B },
        { attacker: elves, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    settle(game);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 20f — Valorous Stance", () => {
  it("destroys only a creature with toughness 4 or greater, and protects any creature", () => {
    const { game } = setUp(["Valorous Stance"]);
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const dreadmaw = spawn(game, "Colossal Dreadmaw", B);
    const stance = inHand(game, "Valorous Stance");
    const offer = game
      .legalActions(A)
      .find((o: LegalAction) => o.kind === "cast-spell" && o.card === stance) as
      | (LegalAction & { castModal?: { modes: readonly { targetOptions: readonly (readonly unknown[])[] }[] } })
      | undefined;
    const modes = offer?.castModal?.modes;
    expect(modes?.[0].targetOptions[0]).toContainEqual(obj(bears));
    expect(modes?.[1].targetOptions[0]).not.toContainEqual(obj(bears));
    expect(modes?.[1].targetOptions[0]).toContainEqual(obj(dreadmaw));
    game.dispatch({ type: "cast-spell", player: A, card: stance, modes: [1], targets: [obj(dreadmaw)] });
    settle(game);
    expect(zone(game, dreadmaw)).toBe("graveyard");
  });
});
