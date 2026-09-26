/**
 * Triggers keyed on an Equipment's or Aura's host — "whenever **equipped**
 * creature …", "whenever **enchanted** creature / land …" (`TriggerWho`
 * `"attached"`): Skullclamp, Wild Growth, the Swords, Curiosity, Ophidian
 * Eye, Aqueous Form, Mask of Memory, Goldvein Pick, Beamtown Beatstick,
 * Argentum Armor, Explorer's Scope and Sticky Fingers.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, maxLandsPerTurn: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
const graveyard = (game: Game, player: PlayerId = A): readonly ObjectId[] =>
  game.state.zones.perPlayer[player].graveyard;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  game.state.zones.shared.battlefield
    .filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const lands = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].controller === player && game.characteristics(id).types.includes("land"),
  );

/** Equip `equipment` to `creature` for real — its Equip ability, paid from
 * fresh Wastes. `survives: false` for a creature the Equipment itself kills. */
const equip = (game: Game, equipment: ObjectId, creature: ObjectId, cost: number, survives = true): void => {
  for (let i = 0; i < cost; i++) spawn(game, "Wastes");
  game.dispatch({ type: "activate-ability", player: A, source: equipment, abilityIndex: 0, targets: [obj(creature)] });
  game.advanceUntil(quiet);
  if (survives) expect(game.state.objects[equipment].attachedTo).toBe(creature);
};
/** Cast the Aura `name` from `player`'s hand onto `host`, paying with `land`s. */
const enchant = (game: Game, name: string, host: ObjectId, land: string, count = 1, player: PlayerId = A): ObjectId => {
  for (let i = 0; i < count; i++) spawn(game, land, player);
  const aura = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card: aura, targets: [obj(host)] });
  game.advanceUntil(quiet);
  expect(game.state.objects[aura].attachedTo).toBe(host);
  return aura;
};
/** Attack `defender` with `attacker` and play the combat out. */
const attack = (game: Game, a: ScriptedController, attacker: ObjectId, defender: PlayerId = B): void => {
  a.declareAttackersFn = () => [{ attacker, defender }];
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
};

describe("Skullclamp", () => {
  it("a 1-toughness creature it's put on dies to the -1, and its controller draws two", () => {
    const { game } = setUp();
    const clamp = spawn(game, "Skullclamp");
    const elves = spawn(game, "Llanowar Elves");
    const before = hand(game);
    equip(game, clamp, elves, 1, false);
    // Equip resolved, the state-based check killed the 2/0 Elves, and the
    // Equipment — still attached as its host died — triggered.
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(hand(game)).toBe(before + 2);
    // Skullclamp stays, unattached (rule 704.5n).
    expect(zoneOf(game, clamp)).toBe("battlefield");
    expect(game.state.objects[clamp].attachedTo).toBeNull();
  });

  it("gives +1/-1 and triggers on its current host only", () => {
    const { game } = setUp();
    const clamp = spawn(game, "Skullclamp");
    const bears = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears");
    equip(game, clamp, bears, 1);
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).toughness).toBe(1);
    equip(game, clamp, other, 1);
    const before = hand(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(hand(game)).toBe(before);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(other)]);
    settle(game);
    expect(hand(game)).toBe(before + 2);
  });

  it("triggers when it and its creature are destroyed at once (rule 603.10a)", () => {
    const { game } = setUp();
    const clamp = spawn(game, "Skullclamp");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, clamp, bears, 1);
    const before = hand(game);
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { notTypes: ["land"] } }, []);
    settle(game);
    expect(zoneOf(game, clamp)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(hand(game)).toBe(before + 2);
  });

  it("an unattached Skullclamp draws nothing when a creature dies", () => {
    const { game } = setUp();
    spawn(game, "Skullclamp");
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(hand(game)).toBe(before);
  });
});

describe("Wild Growth", () => {
  it("tapping the enchanted land adds an additional {G}", () => {
    const { game } = setUp();
    const forest = spawn(game, "Forest");
    enchant(game, "Wild Growth", forest, "Forest");
    game.state.objects[forest].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: forest, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G"]);
  });

  it("the auto-payer counts it: one enchanted Forest pays for {1}{G}", () => {
    const { game } = setUp();
    const forest = spawn(game, "Forest");
    enchant(game, "Wild Growth", forest, "Forest");
    for (const id of lands(game)) game.state.objects[id].tapped = id !== forest;
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bears)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("battlefield");
  });

  it("an opponent's enchanted land gives the extra {G} to its controller", () => {
    const { game } = setUp();
    const theirs = spawn(game, "Forest", B);
    enchant(game, "Wild Growth", theirs, "Forest");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    game.state.objects[theirs].tapped = false;
    game.dispatch({ type: "activate-ability", player: B, source: theirs, abilityIndex: 0 });
    expect(game.state.players[B].manaPool.map((u) => u.type)).toEqual(["G", "G"]);
  });
});

describe("Sword of the Animist", () => {
  it("attacking fetches a basic land onto the battlefield tapped", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of the Animist");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    expect(game.characteristics(bears).power).toBe(3);
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const before = lands(game).length;
    const library = game.state.zones.perPlayer[A].library.length;
    attack(game, a, bears);
    const after = lands(game);
    expect(after.length).toBe(before + 1);
    expect(game.state.objects[after[after.length - 1]].tapped).toBe(true);
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 1);
  });
});

describe("Sword of Feast and Famine", () => {
  it("gives +2/+2 and protection from black and green", () => {
    const { game } = setUp();
    const sword = spawn(game, "Sword of Feast and Famine");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    expect(game.characteristics(bears).power).toBe(4);
    expect([...game.characteristics(bears).protectionFrom.colors].sort()).toEqual(["B", "G"]);
  });

  it("combat damage to a player: they discard a card and you untap all your lands", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Feast and Famine");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    for (const id of lands(game)) game.state.objects[id].tapped = true;
    const theirHand = hand(game, B);
    attack(game, a, bears);
    expect(life(game, B)).toBe(20 - 4);
    expect(hand(game, B)).toBe(theirHand - 1);
    expect(lands(game).every((id) => !game.state.objects[id].tapped)).toBe(true);
  });

  it("untaps your lands even when that player has nothing to discard", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Feast and Famine");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    for (const id of [...game.state.zones.perPlayer[B].hand]) {
      game.debugApplyEffect(B, { kind: "put-on-library", target: 0, position: "bottom" }, [obj(id)]);
    }
    expect(hand(game, B)).toBe(0);
    for (const id of lands(game)) game.state.objects[id].tapped = true;
    attack(game, a, bears);
    expect(lands(game).every((id) => !game.state.objects[id].tapped)).toBe(true);
  });
});

describe("Sword of Fire and Ice", () => {
  it("combat damage: 2 damage to any target from the Sword, and a card", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Fire and Ice");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    equip(game, sword, bears, 2);
    expect([...game.characteristics(bears).protectionFrom.colors].sort()).toEqual(["R", "U"]);
    a.chooseTargetsFn = () => [obj(theirs)];
    const before = hand(game);
    attack(game, a, bears);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(hand(game)).toBe(before + 1);
    const hit = game.state.eventLog.find(
      (e) => e.type === "damage-dealt" && e.target.kind === "object" && e.target.object === theirs,
    );
    expect(hit !== undefined && hit.type === "damage-dealt" ? hit.source : null).toBe(sword);
  });
});

describe("Sword of Light and Shadow", () => {
  it("gains 3 and may return the targeted creature card", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Light and Shadow");
    const bears = spawn(game, "Grizzly Bears");
    const dead = game.debugSpawn("Llanowar Elves", A, "graveyard");
    equip(game, sword, bears, 2);
    a.chooseTargetsFn = () => [obj(dead)];
    a.chooseModesFn = () => [0];
    attack(game, a, bears);
    expect(life(game, A)).toBe(23);
    expect(zoneOf(game, dead)).toBe("hand");
  });

  it("with no creature card to target, still gains the 3 (rule 603.3d)", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Light and Shadow");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    attack(game, a, bears);
    expect(life(game, A)).toBe(23);
  });

  it("a target gone by resolution means no life either (rule 608.2b)", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Light and Shadow");
    const bears = spawn(game, "Grizzly Bears");
    const dead = game.debugSpawn("Llanowar Elves", A, "graveyard");
    equip(game, sword, bears, 2);
    a.chooseTargetsFn = () => [obj(dead)];
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(dead)]);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(zoneOf(game, dead)).toBe("exile");
    expect(life(game, A)).toBe(20);
  });
});

describe("Curiosity and Ophidian Eye", () => {
  it("combat damage to an opponent: you may draw", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Curiosity", bears, "Island");
    a.chooseModesFn = () => [0];
    const before = hand(game);
    attack(game, a, bears);
    expect(hand(game)).toBe(before + 1);
  });

  it("'an opponent' is the Aura's controller's: on their creature, damage to you draws nothing", () => {
    const { game, a } = setUp();
    const pinger = spawn(game, "Prodigal Pyromancer", B);
    enchant(game, "Curiosity", pinger, "Island");
    a.chooseModesFn = () => [0];
    const before = hand(game);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: A }], {
      source: pinger,
    });
    settle(game);
    expect(hand(game)).toBe(before);
    // Noncombat damage to Curiosity's controller's opponent does draw — and
    // the draw is Curiosity's controller's, not the creature's.
    const theirs = hand(game, B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: B }], {
      source: pinger,
    });
    settle(game);
    expect(hand(game)).toBe(before + 1);
    expect(hand(game, B)).toBe(theirs);
  });

  it("damage to a creature draws nothing", () => {
    const { game, a } = setUp();
    const pinger = spawn(game, "Prodigal Pyromancer");
    const theirs = spawn(game, "Grizzly Bears", B);
    enchant(game, "Ophidian Eye", pinger, "Island", 3);
    a.chooseModesFn = () => [0];
    const before = hand(game);
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [obj(theirs)], { source: pinger });
    settle(game);
    expect(hand(game)).toBe(before);
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "player", player: B }], {
      source: pinger,
    });
    settle(game);
    expect(hand(game)).toBe(before + 1);
  });
});

describe("Aqueous Form", () => {
  it("can't be blocked, and attacking scries 1", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Aqueous Form", bears, "Island");
    expect(game.characteristics(bears).keywords).toContain("unblockable");
    attack(game, a, bears);
    expect(game.state.eventLog.some((e) => e.type === "scried" && e.player === A && e.looked === 1)).toBe(true);
    expect(life(game, B)).toBe(18);
  });
});

describe("Mask of Memory", () => {
  it("combat damage: may draw two, then discard one", () => {
    const { game, a } = setUp();
    const mask = spawn(game, "Mask of Memory");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, mask, bears, 1);
    a.chooseModesFn = () => [0];
    const before = hand(game);
    const yard = graveyard(game).length;
    attack(game, a, bears);
    expect(hand(game)).toBe(before + 1);
    expect(graveyard(game).length).toBe(yard + 1);
  });
});

describe("Treasure on combat damage", () => {
  it("Goldvein Pick: +1/+1 and a Treasure", () => {
    const { game, a } = setUp();
    const pick = spawn(game, "Goldvein Pick");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, pick, bears, 1);
    expect(game.characteristics(bears).power).toBe(3);
    attack(game, a, bears);
    expect(tokenCount(game, "Treasure Token")).toBe(1);
  });

  it("Beamtown Beatstick: +1/+0, menace, and a Treasure", () => {
    const { game, a } = setUp();
    const stick = spawn(game, "Beamtown Beatstick");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, stick, bears, 2);
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).toughness).toBe(2);
    expect(game.characteristics(bears).keywords).toContain("menace");
    attack(game, a, bears);
    expect(tokenCount(game, "Treasure Token")).toBe(1);
  });

  it("an unequipped attacker makes none", () => {
    const { game, a } = setUp();
    spawn(game, "Goldvein Pick");
    const bears = spawn(game, "Grizzly Bears");
    attack(game, a, bears);
    expect(life(game, B)).toBe(18);
    expect(tokenCount(game, "Treasure Token")).toBe(0);
  });
});

describe("a combat damage trigger's targets are the controller's choice", () => {
  it("Mindscour Dragon may make its own controller mill", () => {
    const { game, a } = setUp();
    const dragon = spawn(game, "Mindscour Dragon");
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0];
      return [{ kind: "player", player: A }];
    };
    const [mine, theirs] = [
      game.state.zones.perPlayer[A].library.length,
      game.state.zones.perPlayer[B].library.length,
    ];
    attack(game, a, dragon);
    expect(offered).toEqual(expect.arrayContaining([{ kind: "player", player: A }, { kind: "player", player: B }]));
    expect(game.state.zones.perPlayer[A].library.length).toBe(mine - 4);
    expect(game.state.zones.perPlayer[B].library.length).toBe(theirs);
  });
});

describe("Argentum Armor", () => {
  it("+6/+6, and attacking destroys target permanent", () => {
    const { game, a } = setUp();
    const armor = spawn(game, "Argentum Armor");
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring", B);
    equip(game, armor, bears, 6);
    expect(game.characteristics(bears).power).toBe(8);
    a.chooseTargetsFn = () => [obj(ring)];
    attack(game, a, bears);
    expect(zoneOf(game, ring)).toBe("graveyard");
    expect(life(game, B)).toBe(12);
  });
});

describe("Explorer's Scope", () => {
  it("a land on top may go onto the battlefield tapped", () => {
    const { game, a } = setUp();
    const scope = spawn(game, "Explorer's Scope");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, scope, bears, 1);
    const top = game.state.zones.perPlayer[A].library[0];
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    attack(game, a, bears);
    expect(zoneOf(game, top)).toBe("battlefield");
    expect(game.state.objects[top].tapped).toBe(true);
  });

  it("anything else stays on top", () => {
    const { game, a } = setUp();
    const scope = spawn(game, "Explorer's Scope");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, scope, bears, 1);
    const top = game.debugSpawn("Llanowar Elves", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    attack(game, a, bears);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(top);
  });
});

describe("Sticky Fingers", () => {
  it("grants menace and a Treasure trigger; the creature dying draws its controller a card", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const fingers = enchant(game, "Sticky Fingers", bears, "Mountain");
    expect(game.characteristics(bears).keywords).toContain("menace");
    attack(game, a, bears);
    expect(tokenCount(game, "Treasure Token")).toBe(1);
    const before = hand(game);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(zoneOf(game, fingers)).toBe("graveyard");
    expect(hand(game)).toBe(before + 1);
  });

  it("on an opponent's creature: the Treasure is theirs, the card is yours", () => {
    const { game, b } = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    enchant(game, "Sticky Fingers", theirs, "Mountain");
    game.debugApplyEffect(B, { kind: "damage", amount: 2, target: 0 }, [{ kind: "player", player: A }], {
      source: theirs,
    });
    settle(game);
    // Not combat damage: the granted trigger doesn't fire.
    expect(tokenCount(game, "Treasure Token", B)).toBe(0);
    b.declareAttackersFn = () => [{ attacker: theirs, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, A)).toBe(16);
    expect(tokenCount(game, "Treasure Token", B)).toBe(1);
    expect(tokenCount(game, "Treasure Token", A)).toBe(0);
    const before = hand(game);
    const theirHand = hand(game, B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    settle(game);
    expect(hand(game)).toBe(before + 1);
    expect(hand(game, B)).toBe(theirHand);
  });
});
