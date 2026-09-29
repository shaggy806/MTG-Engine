/**
 * Top-5000 batch 8 (ranks 1357–1505) and what it needed: "destroy all
 * **other** creatures" after making tokens (Martial Coup — `notThisWay`, and
 * tokens made as their own objects so an older stack isn't spared with
 * them), "if **another** Desert was returned this way" (Arid Archway), a
 * second pick only "if you don't" take from the first (Planar Genesis),
 * activation costs that "can't reduce the mana in that cost to less than
 * one mana" and reach only permanents' abilities, mana abilities included
 * (Forensic Gadgeteer, Training Grounds), "if this spell was cast from
 * exile" asked of the spell itself (Delayed Blast Fireball), and "you may
 * reveal a historic card from among them" showing only that card
 * (Monumental Henge). One test per clause most likely to be wrong.
 */
import { describe, expect, it } from "vitest";

import type { ActivatedAbility } from "../abilities.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { isGoaded } from "../goad.js";
import type { ManaCost } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUpScripted = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: [...handB, ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const setUp = (hand: readonly string[] = [], library = "Wastes", handB: readonly string[] = []): Game =>
  setUpScripted(hand, library, handB).game;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many tokens named `name` — a token stack counts as every token in it. */
const tokens = (game: Game, name: string, owner?: PlayerId): number =>
  named(game, name)
    .filter((id) => owner === undefined || game.state.objects[id].controller === owner)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
/** Put these cards on top of `player`'s library, the first named on top. */
const onTop = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] => {
  const library = game.state.zones.perPlayer[player].library;
  const ids = names.map((name) => game.debugSpawn(name, player, "library"));
  for (const id of ids) library.splice(library.indexOf(id), 1);
  library.splice(0, 0, ...ids);
  return ids;
};
/** Answer every `choose-targets` with the given slots, and every "you may"
 * with its first option, until nothing is left to resolve. */
const settle = (game: Game, targets?: readonly (ObjectId | null)[]): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting?.kind === "choose-targets" || s.awaiting?.kind === "choose-modes");
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-targets" && targets !== undefined) {
      game.dispatch({
        type: "choose-targets",
        player: awaiting.player,
        targets: targets.map((t) => (t === null ? null : { kind: "object", object: t })),
      });
    } else if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      return;
    }
  }
  throw new Error("settle: still unresolved");
};
/** What activating `source`'s `index`th ability costs `player` right now. */
const abilityCost = (game: Game, source: ObjectId, index = 0, x = 0): ManaCost => {
  const g = game as unknown as {
    effectiveActivated(id: ObjectId): readonly ActivatedAbility[];
    activatedAbilityManaCost(p: PlayerId, s: ObjectId, a: ActivatedAbility, x: number): { cost: ManaCost };
  };
  return g.activatedAbilityManaCost(game.state.objects[source].controller, source, g.effectiveActivated(source)[index], x).cost;
};
const canActivate = (game: Game, source: ObjectId, index = 0): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);

describe("top-5000 batch 8 — Martial Coup's 'all other creatures'", () => {
  it("with X of 5 destroys every other creature, a stack of older Soldiers included", () => {
    const game = setUp(["Martial Coup"], "Plains");
    lands(game, "Plains", 7);
    // Eight at once is a token stack, the one new Soldiers would join.
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 8 }, []);
    expect(tokens(game, "Soldier Token")).toBe(8);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Martial Coup"), targets: [], xValue: 5 });
    settle(game);
    expect(tokens(game, "Soldier Token")).toBe(5);
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("with X under 5 only makes the Soldiers", () => {
    const game = setUp(["Martial Coup"], "Plains");
    lands(game, "Plains", 6);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Martial Coup"), targets: [], xValue: 4 });
    settle(game);
    expect(tokens(game, "Soldier Token")).toBe(4);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 8 — Arid Archway's 'another Desert'", () => {
  const archway = (returned: "desert" | "itself" | "plains") => {
    const { game, a } = setUpScripted();
    const desert = spawn(game, "Conduit Pylons");
    const plains = spawn(game, "Plains");
    let surveilled = false;
    a.chooseScryFn = (_view, _cards, mode) => {
      if (mode === "surveil") surveilled = true;
      return [];
    };
    let arch: ObjectId | undefined;
    a.choosePermanentsFn = () => [returned === "desert" ? desert : returned === "plains" ? plains : arch!];
    arch = enter(game, "Arid Archway");
    game.advanceUntil(quiet);
    return { game, surveilled, arch, desert, plains };
  };

  it("surveils when another Desert went back", () => {
    const { game, surveilled, desert } = archway("desert");
    expect(zone(game, desert)).toBe("hand");
    expect(surveilled).toBe(true);
  });

  it("doesn't when it returned itself, a Desert but not another one", () => {
    const { game, surveilled, arch } = archway("itself");
    expect(zone(game, arch!)).toBe("hand");
    expect(surveilled).toBe(false);
  });

  it("doesn't for a land that isn't a Desert", () => {
    const { game, surveilled, plains } = archway("plains");
    expect(zone(game, plains)).toBe("hand");
    expect(surveilled).toBe(false);
  });
});

describe("top-5000 batch 8 — Planar Genesis's 'if you don't'", () => {
  it("a land taken onto the battlefield means nothing goes to the hand", () => {
    const { game, a } = setUpScripted(["Planar Genesis"]);
    lands(game, "Forest", 1);
    lands(game, "Island", 1);
    const [forest, bears, bolt, island] = onTop(game, ["Forest", "Grizzly Bears", "Lightning Bolt", "Island"]);
    const hand = game.handOf(A).length;
    const offers: (readonly ObjectId[])[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offers.push(eligible);
      return offers.length === 1 ? [forest] : eligible.slice(0, 1);
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Planar Genesis"), targets: [] });
    game.advanceUntil(quiet);
    expect(offers).toHaveLength(1);
    expect(zone(game, forest)).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
    expect(game.handOf(A).length).toBe(hand - 1);
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-3).sort()).toEqual([bears, bolt, island].sort());
  });

  it("without one, a card from among them must go to the hand", () => {
    const { game, a } = setUpScripted(["Planar Genesis"]);
    lands(game, "Forest", 1);
    lands(game, "Island", 1);
    const [forest, bears] = onTop(game, ["Forest", "Grizzly Bears", "Lightning Bolt", "Island"]);
    const offers: { eligible: readonly ObjectId[]; min: number }[] = [];
    a.chooseFromZoneFn = (_view, eligible, min) => {
      offers.push({ eligible, min });
      return offers.length === 1 ? [] : [bears];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Planar Genesis"), targets: [] });
    game.advanceUntil(quiet);
    expect(offers).toHaveLength(2);
    expect(offers[1].min).toBe(1);
    expect(offers[1].eligible).toHaveLength(4);
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, forest)).toBe("library");
  });
});

describe("top-5000 batch 8 — activation costs that leave one mana", () => {
  it("Training Grounds takes {2} off but never below one mana, and only generic", () => {
    const game = setUp();
    const ballista = spawn(game, "Walking Ballista");
    const envoy = spawn(game, "Llanowar Envoy");
    spawn(game, "Training Grounds");
    expect(abilityCost(game, ballista).generic).toBe(2);
    // {1}{G}: the generic goes, the {G} stays — one mana left either way.
    const envoyCost = abilityCost(game, envoy);
    expect(envoyCost.generic).toBe(0);
    expect(envoyCost.colored.G).toBe(1);
    spawn(game, "Training Grounds");
    // {4} less 2 and 2 is {1}: never less than one mana.
    expect(abilityCost(game, ballista).generic).toBe(1);
  });

  it("an ability with the {1} left can still be activated off one land", () => {
    const game = setUp();
    const ballista = spawn(game, "Walking Ballista");
    spawn(game, "Training Grounds");
    spawn(game, "Training Grounds");
    expect(canActivate(game, ballista)).toBe(false);
    lands(game, "Wastes", 1);
    expect(canActivate(game, ballista)).toBe(true);
  });

  it("doesn't reach a creature card's ability in the graveyard", () => {
    const game = setUp();
    spawn(game, "Training Grounds");
    const cathar = game.debugSpawn("Dauntless Cathar", A, "graveyard");
    expect(abilityCost(game, cathar).generic).toBe(1);
  });

  it("Forensic Gadgeteer reaches artifacts' mana abilities, down to one mana", () => {
    const game = setUp();
    spawn(game, "Forensic Gadgeteer");
    const prism = spawn(game, "Celestial Prism");
    const signet = spawn(game, "Arcane Signet");
    const ballista = spawn(game, "Walking Ballista");
    const bears = spawn(game, "Grizzly Bears");
    expect(abilityCost(game, prism).generic).toBe(1);
    expect(abilityCost(game, ballista).generic).toBe(3);
    // Nothing to take: Arcane Signet's {T} has no mana in it.
    expect(abilityCost(game, signet).generic).toBe(0);
    expect(bears).toBeDefined();
  });
});

describe("top-5000 batch 8 — Delayed Blast Fireball", () => {
  it("cast from a hand deals 2 to each opponent and their creatures only", () => {
    const game = setUp(["Delayed Blast Fireball"], "Mountain");
    lands(game, "Mountain", 3);
    const mine = spawn(game, "Grizzly Bears");
    const wurm = spawn(game, "Craw Wurm", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Delayed Blast Fireball"), targets: [] });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
    expect(game.state.objects[wurm].damageMarked).toBe(2);
    expect(game.state.objects[mine].damageMarked).toBe(0);
  });

  it("cast from exile (foretold) deals 5 instead", () => {
    const game = setUp(["Delayed Blast Fireball"], "Mountain");
    lands(game, "Mountain", 6);
    const wurm = spawn(game, "Craw Wurm", B);
    const fireball = inHand(game, "Delayed Blast Fireball");
    game.dispatch({ type: "foretell", player: A, card: fireball });
    expect(zone(game, fireball)).toBe("exile");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.dispatch({ type: "cast-spell", player: A, card: fireball, targets: [], via: "foretell" });
    settle(game);
    expect(life(game, B)).toBe(15);
    expect(zone(game, wurm)).toBe("graveyard");
  });
});

describe("top-5000 batch 8 — Monumental Henge reveals only what it takes", () => {
  it("the historic card taken is revealed; the rest aren't", () => {
    const { game, a } = setUpScripted();
    lands(game, "Plains", 4);
    const henge = spawn(game, "Monumental Henge");
    const [bears, ring, forest] = onTop(game, ["Grizzly Bears", "Sol Ring", "Forest", "Island", "Swamp"]);
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [ring];
    };
    game.dispatch({ type: "activate-ability", player: A, source: henge, abilityIndex: 1, targets: [] });
    settle(game);
    expect(offered).toEqual([ring]);
    expect(zone(game, ring)).toBe("hand");
    expect(game.state.revealedThisTurn).toContain(ring);
    expect(game.state.revealedThisTurn).not.toContain(bears);
    expect(game.state.revealedThisTurn).not.toContain(forest);
  });
});

describe("top-5000 batch 8 — Terastodon", () => {
  it("each permanent put into a graveyard makes its controller an Elephant", () => {
    const { game, a } = setUpScripted();
    const ring = spawn(game, "Sol Ring");
    const signet = spawn(game, "Arcane Signet", B);
    const ingot = spawn(game, "Darksteel Ingot", B);
    a.chooseModesFn = () => [0];
    game.debugSpawn("Terastodon", A, "battlefield", { summoningSick: false, announceEntry: true });
    settle(game, [ring, signet, ingot]);
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, signet)).toBe("graveyard");
    expect(zone(game, ingot)).toBe("battlefield");
    expect(tokens(game, "Elephant Token", A)).toBe(1);
    expect(tokens(game, "Elephant Token", B)).toBe(1);
  });
});

describe("top-5000 batch 8 — Dark Deal", () => {
  it("each player draws one fewer than they discarded", () => {
    const game = setUp(["Dark Deal", "Swamp", "Swamp", "Swamp"], "Swamp");
    lands(game, "Swamp", 3);
    const handA = game.handOf(A).length - 1;
    const handB = game.handOf(B).length;
    const graveA = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Dark Deal"), targets: [] });
    settle(game);
    expect(game.handOf(A).length).toBe(handA - 1);
    expect(game.handOf(B).length).toBe(handB - 1);
    // Every card discarded, plus Dark Deal itself.
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveA + handA + 1);
  });

  it("an empty hand draws nothing", () => {
    const game = setUp(["Dark Deal"], "Swamp");
    lands(game, "Swamp", 3);
    const drop = [...game.handOf(A)].filter((id) => game.state.objects[id].cardName !== "Dark Deal");
    for (const id of drop) (game as unknown as { moveObject(i: ObjectId, z: string): void }).moveObject(id, "exile");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Dark Deal"), targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(0);
  });
});

describe("top-5000 batch 8 — Eldrazi Monument's upkeep", () => {
  it("sacrifices itself when there's no creature to sacrifice", () => {
    const game = setUp();
    const monument = spawn(game, "Eldrazi Monument");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(zone(game, monument)).toBe("graveyard");
  });

  it("stays when a creature went instead — indestructible or not", () => {
    const game = setUp();
    const monument = spawn(game, "Eldrazi Monument");
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, monument)).toBe("battlefield");
  });
});

describe("top-5000 batch 8 — Genesis Wave", () => {
  it("puts permanents with mana value X or less onto the battlefield, the rest in the graveyard", () => {
    const { game, a } = setUpScripted(["Genesis Wave"], "Forest");
    lands(game, "Forest", 6);
    const [bears, wurm, bolt] = onTop(game, ["Grizzly Bears", "Craw Wurm", "Lightning Bolt"]);
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible;
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Genesis Wave"), targets: [], xValue: 3 });
    settle(game);
    expect(offered).toEqual([bears]);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, wurm)).toBe("graveyard");
    expect(zone(game, bolt)).toBe("graveyard");
  });
});

describe("top-5000 batch 8 — Bonehoard Dracosaur", () => {
  const upkeep = (top: readonly string[]) => {
    const game = setUp();
    spawn(game, "Bonehoard Dracosaur");
    const ids = onTop(game, top);
    // Past alice's own draw, so the library top is the pair on her next turn.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const library = game.state.zones.perPlayer[A].library;
    for (const id of ids) library.splice(library.indexOf(id), 1);
    library.splice(0, 0, ...ids);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    return { game, ids };
  };

  it("a land and a nonland exiled make a Dinosaur and a Treasure, both playable", () => {
    const { game, ids } = upkeep(["Forest", "Grizzly Bears"]);
    expect(ids.map((id) => zone(game, id))).toEqual(["exile", "exile"]);
    expect(tokens(game, "3/1 Dinosaur Token")).toBe(1);
    expect(tokens(game, "Treasure Token")).toBe(1);
  });

  it("two lands make one Dinosaur and no Treasure", () => {
    const { game } = upkeep(["Forest", "Island"]);
    expect(tokens(game, "3/1 Dinosaur Token")).toBe(1);
    expect(tokens(game, "Treasure Token")).toBe(0);
  });
});

describe("top-5000 batch 8 — Rankle's 'choose any number'", () => {
  const rankle = (modes: readonly number[]) => {
    const { game, a, b } = setUpScripted();
    const rank = spawn(game, "Rankle, Master of Pranks");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: rank, defender: B }];
    a.chooseModesFn = () => modes;
    a.chooseSacrificesFn = () => [mine];
    b.chooseSacrificesFn = () => [theirs];
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    return { game, mine, theirs, handA, handB };
  };

  it("modes 1 and 3: everyone discards and sacrifices", () => {
    const { game, mine, theirs, handA, handB } = rankle([0, 2]);
    expect(game.handOf(A).length).toBe(handA - 1);
    expect(game.handOf(B).length).toBe(handB - 1);
    expect(zone(game, mine)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("graveyard");
  });

  it("mode 2: everyone loses 1 life and draws", () => {
    const { game, handA, handB } = rankle([1]);
    expect(life(game, A)).toBe(19);
    expect(life(game, B)).toBe(20 - 3 - 1);
    expect(game.handOf(A).length).toBe(handA + 1);
    expect(game.handOf(B).length).toBe(handB + 1);
  });

  it("no modes at all is a choice too", () => {
    const { game, mine, handA } = rankle([]);
    expect(game.handOf(A).length).toBe(handA);
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 8 — Guide of Souls", () => {
  it("another creature entering is 1 life and {E}", () => {
    const game = setUp();
    spawn(game, "Guide of Souls");
    enter(game, "Grizzly Bears");
    game.advanceUntil((s) => s.players[A].energy > 0 && quiet(s));
    expect(game.state.players[A].energy).toBe(1);
    expect(life(game, A)).toBe(21);
  });

  it("paying {E}{E}{E} as you attack makes an attacking creature an Angel", () => {
    const { game, a } = setUpScripted();
    spawn(game, "Guide of Souls");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    game.state.players[A].energy = 3;
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: elves, defender: B },
    ];
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(bears)];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.players[A].energy).toBe(0);
    const c = game.characteristics(bears);
    expect(c.power).toBe(4);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.subtypes).toContain("Angel");
    expect(c.subtypes).toContain("Bear");
    expect(game.characteristics(elves).subtypes).not.toContain("Angel");
  });
});

describe("top-5000 batch 8 — Twitching Doll", () => {
  it("its mana puts a nest counter on it; sacrificed, a Spider for each counter", () => {
    const game = setUp();
    const doll = spawn(game, "Twitching Doll");
    game.dispatch({ type: "activate-ability", player: A, source: doll, abilityIndex: 0, targets: [], manaColors: ["G"] });
    expect(game.state.objects[doll].counters.nest).toBe(1);
    game.state.objects[doll].tapped = false;
    game.state.objects[doll].counters["+1/+1"] = 1;
    game.dispatch({ type: "activate-ability", player: A, source: doll, abilityIndex: 1, targets: [] });
    settle(game);
    expect(zone(game, doll)).toBe("graveyard");
    expect(tokens(game, "2/2 Green Spider Token (Reach)")).toBe(2);
  });
});

describe("top-5000 batch 8 — Fell the Mighty", () => {
  it("destroys only creatures with greater power than the target's", () => {
    const game = setUp(["Fell the Mighty"], "Plains");
    lands(game, "Plains", 5);
    const bears = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears", B);
    const wurm = spawn(game, "Craw Wurm", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Fell the Mighty"), targets: [obj(bears)] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, other)).toBe("battlefield");
    expect(zone(game, wurm)).toBe("graveyard");
  });
});

describe("top-5000 batch 8 — Coiling Oracle", () => {
  it("a land on top goes onto the battlefield", () => {
    const game = setUp();
    const [forest] = onTop(game, ["Forest"]);
    enter(game, "Coiling Oracle");
    game.advanceUntil(quiet);
    expect(zone(game, forest)).toBe("battlefield");
  });

  it("anything else goes to the hand", () => {
    const game = setUp();
    const [bolt] = onTop(game, ["Lightning Bolt"]);
    enter(game, "Coiling Oracle");
    game.advanceUntil(quiet);
    expect(zone(game, bolt)).toBe("hand");
  });
});

describe("top-5000 batch 8 — Legolas's Quick Reflexes", () => {
  it("untaps it, and tapped later it deals its power to up to one target creature", () => {
    const { game, a } = setUpScripted(["Legolas's Quick Reflexes"], "Forest");
    lands(game, "Forest", 1);
    const wurm = spawn(game, "Craw Wurm");
    game.state.objects[wurm].tapped = true;
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Legolas's Quick Reflexes"),
      targets: [obj(wurm)],
    });
    settle(game);
    expect(game.state.objects[wurm].tapped).toBe(false);
    expect(game.characteristics(wurm).keywords.has("reach")).toBe(true);
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    a.chooseTargetsFn = () => [obj(bears)];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 8 — Embercleave", () => {
  it("costs {1} less for each attacker, and attaches as it enters", () => {
    const { game, a } = setUpScripted(["Embercleave"], "Mountain");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    lands(game, "Mountain", 4);
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: elves, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting === null && s.objects[bears].tapped);
    const cleave = inHand(game, "Embercleave");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === cleave)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: cleave, targets: [] });
    settle(game, [bears]);
    expect(game.state.objects[cleave].attachedTo).toBe(bears);
    const c = game.characteristics(bears);
    expect(c.power).toBe(3);
    expect(c.keywords.has("double-strike")).toBe(true);
  });
});

describe("top-5000 batch 8 — Goldvein Hydra", () => {
  it("dies into tapped Treasures equal to the power it had", () => {
    const game = setUp(["Murder"], "Swamp");
    const hydra = spawn(game, "Goldvein Hydra");
    game.state.objects[hydra].counters["+1/+1"] = 3;
    lands(game, "Swamp", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(hydra)] });
    settle(game);
    const treasures = named(game, "Treasure Token");
    expect(tokens(game, "Treasure Token")).toBe(3);
    expect(treasures.every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 8 — Odric, Lunarch Marshal", () => {
  it("shares a keyword one creature has with the rest", () => {
    const game = setUp();
    spawn(game, "Odric, Lunarch Marshal");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Serra Angel");
    game.advanceUntil((s) => s.turn.step === "begin-combat" && quiet(s));
    const c = game.characteristics(bears);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.keywords.has("vigilance")).toBe(true);
    expect(c.keywords.has("trample")).toBe(false);
  });
});

describe("top-5000 batch 8 — Fling", () => {
  it("deals the sacrificed creature's power", () => {
    const game = setUp(["Fling"], "Mountain");
    lands(game, "Mountain", 2);
    const wurm = spawn(game, "Craw Wurm");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Fling"),
      targets: [{ kind: "player", player: B }],
      sacrifice: wurm,
    });
    settle(game);
    expect(zone(game, wurm)).toBe("graveyard");
    expect(life(game, B)).toBe(14);
  });
});

describe("top-5000 batch 8 — Wave Goodbye", () => {
  it("creatures with a +1/+1 counter stay", () => {
    const game = setUp(["Wave Goodbye"], "Island");
    lands(game, "Island", 4);
    const kept = spawn(game, "Grizzly Bears");
    game.state.objects[kept].counters["+1/+1"] = 1;
    const gone = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Wave Goodbye"), targets: [] });
    settle(game);
    expect(zone(game, kept)).toBe("battlefield");
    expect(zone(game, gone)).toBe("hand");
  });
});

describe("top-5000 batch 8 — Feign Death and Fake Your Own Death", () => {
  it("Feign Death returns it tapped with a +1/+1 counter", () => {
    const game = setUp(["Feign Death", "Murder"], "Swamp");
    lands(game, "Swamp", 4);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Feign Death"), targets: [obj(bears)] });
    settle(game);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(bears)] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
  });

  it("Fake Your Own Death's Treasure goes to whoever controlled the creature", () => {
    const game = setUp(["Fake Your Own Death", "Murder"], "Swamp");
    lands(game, "Swamp", 5);
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Fake Your Own Death"), targets: [obj(theirs)] });
    settle(game);
    expect(game.characteristics(theirs).power).toBe(4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Murder"), targets: [obj(theirs)] });
    settle(game);
    expect(zone(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(B);
    expect(tokens(game, "Treasure Token", B)).toBe(1);
    expect(tokens(game, "Treasure Token", A)).toBe(0);
  });
});

describe("top-5000 batch 8 — Dreadhorde Invasion", () => {
  it("amasses at upkeep; a big Zombie token attacking gains lifelink", () => {
    const { game, a } = setUpScripted();
    spawn(game, "Dreadhorde Invasion");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const army = named(game, "Zombie Army Token")[0] ?? game.battlefield.find((id) => game.state.objects[id].isToken);
    expect(army).toBeDefined();
    expect(life(game, A)).toBe(19);
    expect(game.state.objects[army!].counters["+1/+1"]).toBe(1);
    game.state.objects[army!].counters["+1/+1"] = 6;
    game.state.objects[army!].summoningSick = false;
    a.declareAttackersFn = () => [{ attacker: army!, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.characteristics(army!).keywords.has("lifelink")).toBe(true);
  });
});

describe("top-5000 batch 8 — Cover of Darkness", () => {
  it("creatures of the chosen type have fear, whoever controls them", () => {
    const { game, a } = setUpScripted(["Cover of Darkness"], "Swamp");
    lands(game, "Swamp", 2);
    a.chooseCreatureTypeFn = () => "Bear";
    const theirs = spawn(game, "Grizzly Bears", B);
    const elf = spawn(game, "Llanowar Elves");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Cover of Darkness"), targets: [] });
    settle(game);
    expect(game.characteristics(theirs).keywords.has("fear")).toBe(true);
    expect(game.characteristics(elf).keywords.has("fear")).toBe(false);
  });
});

describe("top-5000 batch 8 — Shiny Impetus", () => {
  it("goads the creature, and its attacks make the Aura's controller a Treasure", () => {
    const { game, b } = setUpScripted();
    const bears = spawn(game, "Grizzly Bears", B);
    const impetus = spawn(game, "Shiny Impetus");
    game.state.objects[impetus].attachedTo = bears;
    expect(game.characteristics(bears).power).toBe(4);
    expect(isGoaded(game.state, createDefaultRegistry(), bears)).toBe(true);
    b.declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-blockers");
    expect(tokens(game, "Treasure Token", A)).toBe(1);
    expect(tokens(game, "Treasure Token", B)).toBe(0);
  });
});

describe("top-5000 batch 8 — Formidable Speaker", () => {
  it("discarding a card finds a creature", () => {
    const { game, a } = setUpScripted(["Lightning Bolt"], "Wastes");
    const [bears] = onTop(game, ["Grizzly Bears"]);
    a.chooseModesFn = () => [0];
    a.chooseDiscardsFn = (hand) => hand.filter((c) => c.cardName === "Lightning Bolt").map((c) => c.id);
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    enter(game, "Formidable Speaker");
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-5000 batch 8 — Weathered Wayfarer", () => {
  it("activates only while an opponent controls more lands", () => {
    const game = setUp();
    const wayfarer = spawn(game, "Weathered Wayfarer");
    lands(game, "Plains", 1);
    lands(game, "Wastes", 1, B);
    expect(canActivate(game, wayfarer)).toBe(false);
    lands(game, "Wastes", 1, B);
    expect(canActivate(game, wayfarer)).toBe(true);
  });
});

describe("top-5000 batch 8 — Restoration Angel", () => {
  it("blinks a non-Angel creature you control, never an Angel", () => {
    const { game, a } = setUpScripted();
    const serra = spawn(game, "Serra Angel");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    const stint = game.state.objects[bears].zoneChangeCount ?? 0;
    let legal: ObjectId[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      legal = (options[0] ?? []).flatMap((t) => (t.kind === "object" ? [t.object] : []));
      return [obj(bears)];
    };
    a.chooseModesFn = () => [0];
    enter(game, "Restoration Angel");
    game.advanceUntil(quiet);
    expect(legal).toContain(bears);
    expect(legal).toContain(elves);
    expect(legal).not.toContain(serra);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].zoneChangeCount).toBe(stint + 2);
  });
});
