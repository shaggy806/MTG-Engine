/**
 * Commanders the engine could already run, authored in one pass (2026-09-24):
 * the second group, Betor, Ancestor's Voice through Yuna. One `describe` per
 * card, pinning the part that composes several features.
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

describe("Betor, Ancestor's Voice", () => {
  it("counters for life gained, and a creature card back for life lost", () => {
    const { game } = setUp();
    const betor = spawn(game, "Betor, Ancestor's Voice");
    const bear = spawn(game, "Grizzly Bears");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const cheap = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, [], { source: betor });
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2 }, [], { source: betor });
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].counters["+1/+1"]).toBe(3);
    // Hill Giant costs 4; only the Bears fit under 2 life lost.
    expect(game.state.objects[cheap].zone).toBe("battlefield");
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });
});

describe("Sisay, Weatherlight Captain", () => {
  it("grows per colour among other legends, and fetches a legend cheaper than her power", () => {
    const { game, a } = setUp();
    const sisay = spawn(game, "Sisay, Weatherlight Captain");
    spawn(game, "Thrasios, Triton Hero");
    expect(game.characteristics(sisay).power).toBe(4);
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) spawn(game, land);
    const rograkh = game.debugSpawn("Rograkh, Son of Rohgahh", A, "library");
    game.debugSpawn("Edgar Markov", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    activate(game, sisay, 0);
    expect(game.state.objects[rograkh].zone).toBe("battlefield");
    expect(named(game, "Edgar Markov")).toHaveLength(0);
  });
});

describe("Eriette of the Charmed Apple", () => {
  it("drains for each Aura you control at your end step", () => {
    const { game } = setUp();
    spawn(game, "Eriette of the Charmed Apple");
    spawn(game, "Pacifism");
    spawn(game, "Pacifism");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("Fynn, the Fangbearer", () => {
  it("a deathtouch creature's combat damage gives two poison counters", () => {
    const { game, a } = setUp();
    const fynn = spawn(game, "Fynn, the Fangbearer");
    a.declareAttackersFn = () => [{ attacker: fynn, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.players[B].counters.poison).toBe(2);
  });
});

describe("Kynaios and Tiro of Meletis", () => {
  it("you draw; an opponent who puts down no land draws too", () => {
    const { game } = setUp();
    spawn(game, "Kynaios and Tiro of Meletis");
    const [handA, handB] = [game.handOf(A).length, game.handOf(B).length];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.handOf(A).length).toBe(handA + 1);
    expect(game.handOf(B).length).toBe(handB + 1);
  });
});

describe("Leonardo, the Balance", () => {
  it("counters on each creature for a token entering, once a turn", () => {
    const { game, a } = setUp();
    const leo = spawn(game, "Leonardo, the Balance");
    a.chooseModesFn = () => [0];
    for (let i = 0; i < 2; i += 1) {
      game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, [], { source: leo });
      game.advanceUntil(quiet);
    }
    expect(game.state.objects[leo].counters["+1/+1"]).toBe(1);
  });
});

describe("Éowyn, Shieldmaiden", () => {
  it("two Knights at combat if another Human entered this turn", () => {
    const { game } = setUp();
    spawn(game, "Éowyn, Shieldmaiden");
    game.debugSpawn("Human Soldier Token", A, "battlefield", { announceEntry: true });
    toStep(game, "begin-combat");
    expect(named(game, "Human Knight Token")).toHaveLength(2);
  });

  it("nothing without one", () => {
    const { game } = setUp();
    spawn(game, "Éowyn, Shieldmaiden");
    toStep(game, "begin-combat");
    expect(named(game, "Human Knight Token")).toHaveLength(0);
  });
});

describe("Iroh, Grand Lotus", () => {
  it("instants and sorceries in your graveyard have flashback during your turn", () => {
    const { game } = setUp();
    spawn(game, "Iroh, Grand Lotus");
    spawn(game, "Mountain");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === bolt);
    expect(offer).toBeDefined();
    cast(game, bolt, [{ kind: "player", player: B }], { via: "flashback" });
    expect(life(game, B)).toBe(17);
    expect(game.state.objects[bolt].zone).toBe("exile");
  });
});

describe("Lightning, Army of One", () => {
  it("after combat damage, damage to that player is doubled until your next turn", () => {
    const { game, a } = setUp();
    const lightning = spawn(game, "Lightning, Army of One");
    a.declareAttackersFn = () => [{ attacker: lightning, defender: B }];
    toStep(game, "postcombat-main");
    expect(life(game, B)).toBe(17);
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source: lightning });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(13);
  });
});

describe("Kibo, Uktabi Prince", () => {
  it("everyone gets a Banana; an opponent's artifact dying grows Monkeys", () => {
    const { game } = setUp();
    const kibo = spawn(game, "Kibo, Uktabi Prince");
    activate(game, kibo, 0);
    const [theirs] = named(game, "Banana Token", B);
    expect(named(game, "Banana Token", A)).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)], { source: kibo });
    game.advanceUntil(quiet);
    expect(game.state.objects[kibo].counters["+1/+1"]).toBe(1);
  });

  it("a Banana makes {R} or {G} and 2 life", () => {
    const { game } = setUp();
    const banana = spawn(game, "Banana Token");
    activate(game, banana, 0);
    expect(life(game, A)).toBe(22);
  });
});

describe("Eshki, Temur's Roar", () => {
  it("counter, card and damage by the creature spell's power", () => {
    const { game } = setUp(["Craw Wurm"]);
    const eshki = spawn(game, "Eshki, Temur's Roar");
    lands(game, "Forest", 6);
    const hand = game.handOf(A).length;
    cast(game, inHand(game, A, "Craw Wurm"));
    expect(game.state.objects[eshki].counters["+1/+1"]).toBe(1);
    expect(game.handOf(A).length).toBe(hand - 1 + 1);
    expect(life(game, B)).toBe(17);
  });
});

describe("Kykar, Wind's Fury", () => {
  it("a Spirit per noncreature spell; sacrificing one adds {R}", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const kykar = spawn(game, "Kykar, Wind's Fury");
    spawn(game, "Mountain");
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    const [spirit] = named(game, "Spirit Token");
    game.dispatch({ type: "activate-ability", player: A, source: kykar, abilityIndex: 0, targets: [], sacrifice: spirit });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["R"]);
  });
});

describe("Marchesa, the Black Rose", () => {
  it("returns a creature that died with a +1/+1 counter at the next end step", () => {
    const { game } = setUp();
    const marchesa = spawn(game, "Marchesa, the Black Rose");
    const bear = spawn(game, "Grizzly Bears");
    game.state.objects[bear].counters["+1/+1"] = 1;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], { source: marchesa });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].zone).toBe("battlefield");
  });
});

describe("Kratos, Stoic Father", () => {
  it("experience for attacking with a God; counters at the end step", () => {
    const { game, a } = setUp();
    const kratos = spawn(game, "Kratos, Stoic Father");
    a.declareAttackersFn = () => [{ attacker: kratos, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.players[A].counters.experience).toBe(1);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[kratos].counters["+1/+1"]).toBe(1);
  });
});

describe("Fire Lord Zuko", () => {
  it("a counter on each creature for a permanent entering from exile", () => {
    const { game } = setUp();
    const zuko = spawn(game, "Fire Lord Zuko");
    const bear = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(bear)], { source: zuko });
    game.advanceUntil(quiet);
    expect(game.state.objects[zuko].counters["+1/+1"]).toBe(1);
  });
});

describe("Doran, Besieged by Time", () => {
  it("an attacker gets +X/+X for the gap between its power and toughness", () => {
    const { game, a } = setUp();
    const doran = spawn(game, "Doran, Besieged by Time");
    a.declareAttackersFn = () => [{ attacker: doran, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.characteristics(doran).power).toBe(5);
    expect(game.characteristics(doran).toughness).toBe(10);
  });
});

describe("Dr. Eggman", () => {
  it("an opponent's villainous choice: discard, or you put a Construct into play", () => {
    const { game, a, b } = setUp(["Foundry Inspector"]);
    spawn(game, "Dr. Eggman");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    b.chooseModesFn = () => [1];
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "Foundry Inspector", A)).toHaveLength(1);
  });
});

describe("Ramos, Dragon Engine", () => {
  it("a counter per colour of each spell; five counters make ten mana", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const ramos = spawn(game, "Ramos, Dragon Engine");
    spawn(game, "Mountain");
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(game.state.objects[ramos].counters["+1/+1"]).toBe(1);
    game.state.objects[ramos].counters["+1/+1"] = 5;
    game.dispatch({ type: "activate-ability", player: A, source: ramos, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool).toHaveLength(10);
  });
});

describe("The Mindskinner", () => {
  it("damage to an opponent becomes that many cards milled", () => {
    const { game } = setUp();
    const skinner = spawn(game, "The Mindskinner");
    game.debugApplyEffect(A, { kind: "damage", amount: 3, who: "each-opponent" }, [], { source: skinner });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(20);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(3);
  });
});

describe("Tergrid, God of Fright // Tergrid's Lantern", () => {
  it("takes a nontoken permanent an opponent sacrifices", () => {
    const { game, a } = setUp();
    const tergrid = spawn(game, "Tergrid, God of Fright");
    const bear = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "sacrifice", who: "each-opponent", filter: {}, count: 1 }, [], { source: tergrid });
    game.advanceUntil((s) => s.objects[bear].zone === "battlefield" && s.objects[bear].controller === A);
    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].controller).toBe(A);
  });

  it("the Lantern: lose 3 unless they sacrifice or discard", () => {
    const { game, b } = setUp();
    const lantern = spawn(game, "Tergrid, God of Fright");
    game.state.objects[lantern].face = 1;
    b.chooseModesFn = () => [];
    activate(game, lantern, 0, [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(17);
  });
});

describe("Disa the Restless", () => {
  it("a Lhurgoyf milled is put onto the battlefield; combat damage makes a Tarmogoyf", () => {
    const { game, a } = setUp();
    const disa = spawn(game, "Disa the Restless");
    const goyf = game.debugSpawn("Tarmogoyf", A, "library");
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 1 }, [], { source: disa });
    game.advanceUntil(quiet);
    expect(game.state.objects[goyf].zone).toBe("battlefield");
    a.declareAttackersFn = () => [{ attacker: disa, defender: B }];
    toStep(game, "postcombat-main");
    expect(named(game, "Tarmogoyf Token")).toHaveLength(1);
  });
});

describe("Anti-Venom, Horrifying Healer", () => {
  it("damage becomes +1/+1 counters", () => {
    const { game } = setUp();
    const venom = spawn(game, "Anti-Venom, Horrifying Healer");
    game.debugApplyEffect(A, { kind: "damage", amount: 3, target: 0 }, [obj(venom)], { source: venom });
    game.advanceUntil(quiet);
    expect(game.state.objects[venom].damageMarked).toBe(0);
    expect(game.state.objects[venom].counters["+1/+1"]).toBe(3);
  });

  it("returns a creature card only when cast", () => {
    const { game } = setUp(["Anti-Venom, Horrifying Healer"]);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Anti-Venom, Horrifying Healer", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    lands(game, "Plains", 5);
    cast(game, inHand(game, A, "Anti-Venom, Horrifying Healer"));
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });
});

describe("Judith, Carnage Connoisseur", () => {
  it("an Imp whose death burns each opponent", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    spawn(game, "Judith, Carnage Connoisseur");
    spawn(game, "Mountain");
    a.chooseModesFn = () => [1];
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    const [imp] = named(game, "Imp Token (Judith)");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(imp)], { source: imp });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(15);
  });
});

describe("Thalia and The Gitrog Monster", () => {
  it("opponents' creatures enter tapped; attacking sacrifices then draws", () => {
    const { game, a } = setUp();
    const thalia = spawn(game, "Thalia and The Gitrog Monster");
    const bear = spawn(game, "Grizzly Bears", B);
    expect(game.state.objects[bear].tapped).toBe(true);
    const forest = spawn(game, "Forest");
    const hand = game.handOf(A).length;
    a.chooseSacrificesFn = () => [forest];
    a.declareAttackersFn = () => [{ attacker: thalia, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.objects[forest].zone).toBe("graveyard");
  });
});

describe("Arahbo, Roar of the World", () => {
  it("pays to double an attacking Cat's power and give it trample", () => {
    const { game, a } = setUp();
    spawn(game, "Arahbo, Roar of the World");
    const cat = spawn(game, "Cat Token");
    lands(game, "Plains", 3);
    lands(game, "Forest", 3);
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => [{ attacker: cat, defender: B }];
    toStep(game, "declare-blockers");
    // Eminence gave it +3/+3 as combat began: a 5/5, doubled to 10.
    expect(game.characteristics(cat).power).toBe(10);
    expect(game.characteristics(cat).keywords).toContain("trample");
  });
});

describe("Ovika, Enigma Goliath", () => {
  it("hasty Goblins equal to a noncreature spell's mana value", () => {
    const { game } = setUp(["Sol Ring"]);
    spawn(game, "Ovika, Enigma Goliath");
    spawn(game, "Island");
    cast(game, inHand(game, A, "Sol Ring"));
    const goblins = named(game, "Phyrexian Goblin Token");
    expect(goblins).toHaveLength(1);
    expect(game.characteristics(goblins[0]).keywords).toContain("haste");
  });
});

describe("Yuna, Grand Summoner", () => {
  it("Grand Summon: the next creature spell enters with two more counters", () => {
    const { game } = setUp(["Grizzly Bears"]);
    const yuna = spawn(game, "Yuna, Grand Summoner");
    spawn(game, "Forest");
    game.dispatch({ type: "activate-ability", player: A, source: yuna, abilityIndex: 0, targets: [], manaColors: ["G"] });
    const bears = inHand(game, A, "Grizzly Bears");
    cast(game, bears);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(2);
  });

  it("a permanent dying with counters passes them on", () => {
    const { game, a } = setUp();
    const yuna = spawn(game, "Yuna, Grand Summoner");
    const bear = spawn(game, "Grizzly Bears");
    game.state.objects[bear].counters["+1/+1"] = 2;
    a.chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], { source: yuna });
    game.advanceUntil(quiet);
    expect(game.state.objects[yuna].counters["+1/+1"]).toBe(2);
  });
});
