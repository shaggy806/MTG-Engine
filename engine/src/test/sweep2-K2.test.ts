/**
 * Card sweep 2, batch K2 — top-2000 Commander staples the engine could
 * already run, each driven through real play.
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
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}, who: PlayerId = A) => {
  game.dispatch({ type: "cast-spell", player: who, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const types = (game: Game, id: ObjectId) => effectiveTypes(game.state, registry, game.state.objects[id]);
const pool = (game: Game, p: PlayerId = A) => game.state.players[p].manaPool.map((unit) => unit.type).sort();
const hand = (game: Game, p: PlayerId = A) => game.handOf(p).map((id) => game.state.objects[id].cardName);

describe("Krosan Grip", () => {
  it("destroys an artifact, and nothing can be cast in response", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    const ring = spawn(game, "Sol Ring", B);
    const grip = game.debugSpawn("Krosan Grip", A, "hand");
    game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: grip, targets: [obj(ring)] });
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell")).toBe(false);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
  });
});

describe("Boggart Trawler // Boggart Bog", () => {
  it("exiles target player's graveyard", () => {
    const { game, a } = setUp();
    lands(game, "Swamp", 3);
    const dead = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const trawler = game.debugSpawn("Boggart Trawler", A, "hand");
    a.chooseTargetsFn = () => [player(B)];
    cast(game, trawler);
    expect(game.state.objects[dead].zone).toBe("exile");
  });

  it("the land face enters untapped for 3 life", () => {
    const { game, a } = setUp();
    const card = game.debugSpawn("Boggart Trawler", A, "hand");
    a.payLifeForUntappedFn = () => true;
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[card].tapped).toBe(false);
    expect(life(game, A)).toBe(17);
  });
});

describe("Graven Cairns", () => {
  it("{B/R}, {T}: two mana in any combination of {B} and {R}", () => {
    const { game } = setUp();
    const cairns = spawn(game, "Graven Cairns");
    spawn(game, "Swamp");
    const offer = game
      .legalActions(A)
      .find(
        (o) =>
          o.kind === "activate-ability" &&
          o.source === cairns &&
          o.abilityIndex === 1 &&
          o.manaColors?.join("") === "BR",
      );
    expect(offer).toBeDefined();
    activate(game, cairns, 1, [], { manaColors: ["B", "R"] });
    expect(pool(game)).toEqual(["B", "R"]);
    expect(game.state.objects[cairns].tapped).toBe(true);
  });
});

describe("Relic of Legends", () => {
  it("taps a legendary creature you control for mana of any color", () => {
    const { game } = setUp();
    const relic = spawn(game, "Relic of Legends");
    const bears = spawn(game, "Grizzly Bears");
    const legend = spawn(game, "Thrasios, Triton Hero");
    const offers = game
      .legalActions(A)
      .filter((o) => o.kind === "activate-ability" && o.source === relic && o.abilityIndex === 1);
    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0];
    if (offer.kind !== "activate-ability") throw new Error("unreachable");
    expect(offer.tapCost?.choices).toEqual([legend]);
    activate(game, relic, 1, [], { tap: [legend], manaColors: ["G"] });
    expect(pool(game)).toEqual(["G"]);
    expect(game.state.objects[legend].tapped).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[relic].tapped).toBe(false);
  });
});

describe("Springleaf Drum", () => {
  it("{T}, tap a creature you control: one mana of any color", () => {
    const { game } = setUp();
    const drum = spawn(game, "Springleaf Drum");
    const elf = game.debugSpawn("Llanowar Elves", A, "battlefield");
    activate(game, drum, 0, [], { tap: [elf], manaColors: ["U"] });
    expect(pool(game)).toEqual(["U"]);
    expect(game.state.objects[elf].tapped).toBe(true);
    expect(game.state.objects[drum].tapped).toBe(true);
  });
});

describe("Tireless Tracker", () => {
  it("investigates on landfall and grows when you sacrifice a Clue", () => {
    const { game } = setUp();
    const tracker = spawn(game, "Tireless Tracker");
    lands(game, "Forest", 2);
    const land = game.debugSpawn("Forest", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: land });
    game.advanceUntil(quiet);
    const [clue] = named(game, "Clue Token");
    expect(clue).toBeDefined();
    activate(game, clue, 0);
    expect(game.state.objects[tracker].counters["+1/+1"]).toBe(1);
  });
});

describe("Pinnacle Monk // Mystic Peak", () => {
  it("returns an instant from your graveyard, and has prowess", () => {
    const { game, a } = setUp();
    lands(game, "Mountain", 6);
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const monk = game.debugSpawn("Pinnacle Monk", A, "hand");
    a.chooseTargetsFn = () => [obj(bolt)];
    cast(game, monk);
    expect(game.state.objects[bolt].zone).toBe("hand");
    a.chooseTargetsFn = () => [player(B)];
    cast(game, bolt, [player(B)]);
    const view = game.viewFor(A).objects[monk];
    expect(view?.power).toBe(3);
  });
});

describe("Liquimetal Torque", () => {
  it("makes a nonland permanent an artifact until end of turn", () => {
    const { game } = setUp();
    const torque = spawn(game, "Liquimetal Torque");
    const bears = spawn(game, "Grizzly Bears", B);
    activate(game, torque, 1, [obj(bears)]);
    expect(types(game, bears)).toContain("artifact");
    expect(types(game, bears)).toContain("creature");
    game.advanceUntil((s) => s.turn.number === 2 && quiet(s));
    expect(types(game, bears)).not.toContain("artifact");
  });
});

describe("The Reaver Cleaver", () => {
  it("+1/+1, trample, and Treasures equal to the combat damage dealt to a player", () => {
    const { game, a } = setUp();
    lands(game, "Mountain", 3);
    const cleaver = spawn(game, "The Reaver Cleaver");
    const bears = spawn(game, "Grizzly Bears");
    activate(game, cleaver, 0, [obj(bears)]);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    toStep(game, "postcombat-main");
    expect(life(game, B)).toBe(17);
    expect(named(game, "Treasure Token", A).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(3);
  });
});

describe("Brotherhood Regalia", () => {
  it("equips a legendary creature for {1}, making it an unblockable Assassin", () => {
    const { game } = setUp();
    spawn(game, "Plains");
    const regalia = spawn(game, "Brotherhood Regalia");
    const bears = spawn(game, "Grizzly Bears");
    const legend = spawn(game, "Thrasios, Triton Hero");
    const cheap = game
      .legalActions(A)
      .filter((o) => o.kind === "activate-ability" && o.source === regalia && o.abilityIndex === 0);
    expect(cheap.length).toBeGreaterThan(0);
    expect(() => activate(game, regalia, 0, [obj(bears)])).toThrow();
    activate(game, regalia, 0, [obj(legend)]);
    expect(game.state.objects[regalia].attachedTo).toBe(legend);
    expect(effectiveSubtypes(game.state, registry, game.state.objects[legend])).toContain("Assassin");
    expect(game.viewFor(A).objects[legend]?.keywords).toContain("unblockable");
  });

  it("gives ward {2}", () => {
    const { game } = setUp();
    spawn(game, "Plains");
    const regalia = spawn(game, "Brotherhood Regalia");
    const legend = spawn(game, "Thrasios, Triton Hero");
    activate(game, regalia, 0, [obj(legend)]);
    spawn(game, "Mountain", B);
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    toStep(game, "end");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    cast(game, bolt, [obj(legend)], {}, B);
    expect(game.state.objects[legend].zone).toBe("battlefield");
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
});

describe("Puresteel Paladin", () => {
  it("metalcraft gives Equipment you control equip {0}", () => {
    const { game } = setUp();
    spawn(game, "Puresteel Paladin");
    const splitter = spawn(game, "Bonesplitter");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Sol Ring");
    const free = () =>
      game
        .legalActions(A)
        .find((o) => o.kind === "activate-ability" && o.source === splitter && o.abilityIndex === 1);
    expect(free()).toBeUndefined();
    spawn(game, "Mind Stone");
    expect(free()).toBeDefined();
    activate(game, splitter, 1, [obj(bears)]);
    expect(game.state.objects[splitter].attachedTo).toBe(bears);
  });

  it("may draw when an Equipment you control enters", () => {
    const { game, a } = setUp();
    spawn(game, "Puresteel Paladin");
    a.chooseModesFn = () => [0];
    const before = game.handOf(A).length;
    game.debugSpawn("Bonesplitter", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Bonesplitter", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(before + 1);
  });
});

describe("Bridgeworks Battle // Tanglespan Bridgeworks", () => {
  it("pumps, then fights", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    const battle = game.debugSpawn("Bridgeworks Battle", A, "hand");
    cast(game, battle, [obj(bears), obj(giant)]);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("the fight is optional", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    const bears = spawn(game, "Grizzly Bears");
    const battle = game.debugSpawn("Bridgeworks Battle", A, "hand");
    cast(game, battle, [obj(bears), null]);
    expect(game.viewFor(A).objects[bears]?.power).toBe(4);
  });
});

describe("Ripples of Undeath", () => {
  it("mills three, then for {1} and 3 life returns one of them", () => {
    const { game, a } = setUp();
    spawn(game, "Ripples of Undeath");
    spawn(game, "Swamp");
    const old = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const offered: ObjectId[][] = [];
    a.chooseModesFn = () => [0];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered.push([...eligible]);
      return eligible.slice(0, 1);
    };
    toStep(game, "end");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw" && quiet(s));
    const top = [0, 1, 2].map(() => game.debugSpawn("Hill Giant", A, "library"));
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(offered).toHaveLength(1);
    expect(offered[0]).not.toContain(old);
    expect([...offered[0]].sort()).toEqual([...top].sort());
    expect(top.filter((id) => game.state.objects[id].zone === "hand")).toHaveLength(1);
    expect(top.filter((id) => game.state.objects[id].zone === "graveyard")).toHaveLength(2);
    expect(life(game, A)).toBe(17);
  });

  it("without paying, nothing comes back", () => {
    const { game, a } = setUp();
    spawn(game, "Ripples of Undeath");
    spawn(game, "Swamp");
    a.chooseModesFn = () => [];
    toStep(game, "end");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(3);
    expect(life(game, A)).toBe(20);
  });
});
