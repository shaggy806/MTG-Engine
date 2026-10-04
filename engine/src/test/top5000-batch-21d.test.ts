/**
 * Top-5000 batch 21d. No engine change: each test pins the clause of one
 * newly authored card most likely to be wired wrong — whose life changes on
 * an attack (Parasitic Impetus), who gets the Myr (Genesis Chamber), the 7+
 * band reaching only tapped legends (The Seriema), a granted two-of-one-colour
 * land ability (Resonating Lute), and the cast-trigger windows.
 */
import { describe, expect, it } from "vitest";

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
/** How many permanents of this name a player controls, a token stack counted per token. */
const count = (game: Game, name: string, player: PlayerId = A): number =>
  game.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === name && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};

describe("top-5000 batch 21d — Parasitic Impetus", () => {
  it("drains the attacking creature's controller for the Aura's controller", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", A);
    const aura = spawn(game, "Parasitic Impetus", B);
    game.state.objects[aura].attachedTo = bears;
    expect(pt(game, bears)).toEqual([4, 4]);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    game.advanceUntil((s) => (s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    // Alice loses 2; Bob gains 2 and takes the 4 combat damage.
    expect(life(game, A)).toBe(18);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-5000 batch 21d — Genesis Chamber", () => {
  it("gives the entering creature's controller the Myr, only while untapped", () => {
    const { game } = setUp();
    const chamber = spawn(game, "Genesis Chamber", A);
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(count(game, "Myr Token", B)).toBe(1);
    expect(count(game, "Myr Token", A)).toBe(0);
    game.state.objects[chamber].tapped = true;
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(count(game, "Myr Token", A)).toBe(0);
    expect(count(game, "Myr Token", B)).toBe(1);
  });
});

describe("top-5000 batch 21d — The Seriema", () => {
  it("at 7+ charge counters gives only other tapped legendary creatures indestructible", () => {
    const { game } = setUp();
    const seriema = spawn(game, "The Seriema");
    game.state.objects[seriema].counters = { charge: 7 };
    const tappedLegend = game.debugSpawn("Kokusho, the Evening Star", A, "battlefield", { tapped: true });
    const untappedLegend = spawn(game, "Kokusho, the Evening Star");
    const tappedBears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    expect(game.characteristics(tappedLegend).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(untappedLegend).keywords.has("indestructible")).toBe(false);
    expect(game.characteristics(tappedBears).keywords.has("indestructible")).toBe(false);
    const ship = game.characteristics(seriema);
    expect(ship.types.includes("creature")).toBe(true);
    expect(ship.keywords.has("flying")).toBe(true);
  });

  it("below 7 counters is neither a creature nor a shield", () => {
    const { game } = setUp();
    const seriema = spawn(game, "The Seriema");
    game.state.objects[seriema].counters = { charge: 6 };
    const tappedLegend = game.debugSpawn("Kokusho, the Evening Star", A, "battlefield", { tapped: true });
    expect(game.characteristics(tappedLegend).keywords.has("indestructible")).toBe(false);
    expect(game.characteristics(seriema).types.includes("creature")).toBe(false);
  });
});

describe("top-5000 batch 21d — Elven Ambush", () => {
  it("makes one Elf Warrior per Elf you control, a changeling included", () => {
    const { game } = setUp();
    lands(game, "Llanowar Elves", 2);
    spawn(game, "Graveshifter");
    spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, effectOf("Elven Ambush"), []);
    settle(game);
    expect(count(game, "Elf Warrior Token", A)).toBe(3);
    expect(count(game, "Elf Warrior Token", B)).toBe(0);
  });
});

describe("top-5000 batch 21d — Jeskai Ascendancy", () => {
  it("pumps and untaps your creatures when you cast a noncreature spell", () => {
    const { game } = setUp(["Opt"]);
    lands(game, "Island", 1);
    spawn(game, "Jeskai Ascendancy");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Opt"), targets: [] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(pt(game, bears)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 21d — Mistveil Plains", () => {
  it("activates only with two or more white permanents", () => {
    const { game } = setUp();
    const mist = spawn(game, "Mistveil Plains");
    game.state.objects[mist].tapped = false;
    spawn(game, "Plains");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const canActivate = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === mist && x.abilityIndex === 1);
    spawn(game, "Savannah Lions");
    expect(canActivate()).toBe(false);
    spawn(game, "Savannah Lions");
    expect(canActivate()).toBe(true);
  });
});

describe("top-5000 batch 21d — Sylvan Anthem", () => {
  it("pumps only green creatures", () => {
    const { game } = setUp();
    spawn(game, "Sylvan Anthem");
    const bears = spawn(game, "Grizzly Bears");
    const lions = spawn(game, "Savannah Lions");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, lions)).toEqual([2, 1]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 21d — Pyromancer's Goggles", () => {
  it("copies the red instant its mana paid for", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const goggles = spawn(game, "Pyromancer's Goggles");
    game.dispatch({ type: "activate-ability", player: A, source: goggles, abilityIndex: 0 });
    expect(pool(game)).toEqual(["R"]);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    // Two Bolts' worth of damage, wherever the copy was pointed.
    expect(life(game, A) + life(game, B)).toBe(34);
  });
});

describe("top-5000 batch 21d — Carmen, Cruel Skymarcher", () => {
  it("grows and gains life when a permanent is sacrificed", () => {
    const { game } = setUp();
    const carmen = spawn(game, "Carmen, Cruel Skymarcher");
    const treasure = spawn(game, "Treasure Token");
    game.state.objects[treasure].isToken = true;
    game.dispatch({ type: "activate-ability", player: A, source: treasure, abilityIndex: 0, manaColors: ["W"] });
    settle(game);
    expect(counters(game, carmen)).toBe(1);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-5000 batch 21d — Kozilek's Unsealing", () => {
  it("makes two Spawn for a mana value 4 creature spell, and draws nothing", () => {
    const { game } = setUp(["Hill Giant"], "Mountain");
    lands(game, "Mountain", 4);
    spawn(game, "Kozilek's Unsealing");
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Hill Giant"), targets: [] });
    settle(game);
    expect(count(game, "Eldrazi Spawn Token")).toBe(2);
    expect(game.handOf(A)).toHaveLength(handBefore - 1);
  });
});

describe("top-5000 batch 21d — Resonating Lute", () => {
  it("gives lands two mana of one colour, and draws only with seven cards in hand", () => {
    const { game } = setUp();
    const lute = spawn(game, "Resonating Lute");
    const island = spawn(game, "Island");
    const granted = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === island)
      .map((x) => (x.kind === "activate-ability" ? x.abilityIndex : -1));
    expect(new Set(granted).size).toBe(2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: island,
      abilityIndex: Math.max(...granted),
      manaColors: ["R"],
    });
    expect(pool(game)).toEqual(["R", "R"]);
    const canDraw = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === lute && x.abilityIndex === 0);
    expect(game.handOf(A).length).toBeGreaterThanOrEqual(7);
    expect(canDraw()).toBe(true);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" }, []);
    settle(game);
    expect(canDraw()).toBe(false);
  });
});

describe("top-5000 batch 21d — Ulvenwald Hydra", () => {
  it("is as big as the number of lands you control", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    lands(game, "Forest", 2, B);
    const hydra = spawn(game, "Ulvenwald Hydra");
    expect(pt(game, hydra)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 21d — Chromatic Star", () => {
  it("draws a card when it goes to the graveyard from the battlefield", () => {
    const { game } = setUp();
    const star = spawn(game, "Chromatic Star");
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: star }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(handBefore + 1);
  });
});
