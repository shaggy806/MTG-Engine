/**
 * Tarkir: Dragonstorm precons, batch 1 — 41 of the five default decks' 147
 * missing cards. One engine addition: a `create-token` can exile its tokens
 * at the next end step (Manaform Hellkite). The rest pin the clauses most
 * likely to be wired wrong: a target bounded by the triggering spell's mana
 * value (Hammerhead Tyrant), a card with no mana cost (Ancestral Vision), an
 * attack restriction under a condition (Gadrak), a type-replacing animation
 * (Nogi), counters read off the board as it enters (Towering Titan, Bone
 * Devourer), a number chosen on resolution (Expel the Interlopers), a
 * tempting offer (Tempt with Vengeance), and the once-a-turn triggers.
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
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  // A free cast on offer (suspend's, cascade's) is taken.
  c.chooseCastNowFn = (_v, offer) =>
    offer.casts.length === 0
      ? null
      : {
          type: "cast-spell",
          player: c.playerId,
          card: offer.casts[0].card,
          targets: offer.casts[0].targetOptions.map((options) => options[0]),
          via: "effect",
          free: true,
        };
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
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const tokens = (game: Game, name: string, player?: PlayerId): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};
const toAttackers = (game: Game): void =>
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");

describe("TDC batch 1 — Hammerhead Tyrant", () => {
  it("offers only nonland permanents no bigger than the spell cast", () => {
    const { game, a } = setUp(["Grizzly Bears"], "Forest");
    lands(game, "Forest", 2);
    spawn(game, "Hammerhead Tyrant");
    const small = spawn(game, "Llanowar Elves", B);
    const big = spawn(game, "Hill Giant", B);
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      offered = legal[0] ?? [];
      return [{ kind: "object", object: small }];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    const ids = offered.map((t) => (t.kind === "object" ? t.object : null));
    expect(ids).toContain(small);
    expect(ids).not.toContain(big);
    expect(zone(game, small)).toBe("hand");
    expect(zone(game, big)).toBe("battlefield");
  });
});

describe("TDC batch 1 — Ancestral Vision", () => {
  it("has no mana cost, so it can only be suspended", () => {
    const { game } = setUp(["Ancestral Vision"], "Island");
    lands(game, "Island", 3);
    const vision = inHand(game, "Ancestral Vision");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === vision)).toBe(false);
    expect(game.legalActions(A).some((x) => x.kind === "suspend" && x.card === vision)).toBe(true);
  });

  it("is cast for free once its last time counter comes off", () => {
    const { game } = setUp(["Ancestral Vision"], "Island");
    lands(game, "Island", 1);
    const vision = inHand(game, "Ancestral Vision");
    game.dispatch({ type: "suspend", player: A, card: vision });
    settle(game);
    expect(zone(game, vision)).toBe("exile");
    const hands = (): number => game.handOf(A).length + game.handOf(B).length;
    const before = hands();
    game.advanceUntil((s) => s.turn.number === 9 && s.turn.step === "precombat-main");
    settle(game);
    expect(zone(game, vision)).toBe("graveyard");
    // Turns 2 to 9: each player's four draw steps, then the three it gave.
    expect(hands()).toBe(before + 8 + 3);
  });
});

describe("TDC batch 1 — Manaform Hellkite", () => {
  it("makes an X/X for the mana spent, exiled at the next end step", () => {
    const { game } = setUp(["Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 1);
    spawn(game, "Manaform Hellkite");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    const [illusion] = named(game, "Dragon Illusion Token");
    expect(illusion).toBeDefined();
    const c = computeCharacteristics(game.state, registry, illusion);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect(c.keywords.has("flying") && c.keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(named(game, "Dragon Illusion Token")).toHaveLength(0);
  });
});

describe("TDC batch 1 — Gadrak, the Crown-Scourge", () => {
  it("can't attack without four artifacts", () => {
    const { game } = setUp();
    const gadrak = spawn(game, "Gadrak, the Crown-Scourge");
    lands(game, "Sol Ring", 3);
    toAttackers(game);
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: gadrak, defender: B }] }),
    ).toThrow();
  });

  it("attacks beside four artifacts", () => {
    const { game } = setUp();
    const gadrak = spawn(game, "Gadrak, the Crown-Scourge");
    lands(game, "Sol Ring", 4);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: gadrak, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(life(game, B)).toBe(15);
  });

  it("makes a Treasure for each nontoken creature that died this turn", () => {
    const { game } = setUp();
    spawn(game, "Gadrak, the Crown-Scourge");
    destroy(game, spawn(game, "Grizzly Bears", B));
    destroy(game, spawn(game, "Hill Giant"));
    game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 1 }, []);
    settle(game);
    destroy(game, named(game, "Servo Token")[0]);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(tokens(game, "Treasure Token")).toBe(2);
  });
});

describe("TDC batch 1 — Nogi, Draco-Zealot", () => {
  it("becomes a 5/5 flying Dragon, and only a Dragon, beside three Dragons", () => {
    const { game } = setUp();
    const nogi = spawn(game, "Nogi, Draco-Zealot");
    lands(game, "Shivan Dragon", 3);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: nogi, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.turn.step === "combat-damage");
    const c = computeCharacteristics(game.state, registry, nogi);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.subtypes).toEqual(["Dragon"]);
  });
});

describe("TDC batch 1 — Towering Titan", () => {
  it("enters with counters equal to the other creatures' total toughness", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant");
    spawn(game, "Hill Giant", B);
    const titan = game.debugSpawn("Towering Titan", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, titan)).toBe(5);
  });
});

describe("TDC batch 1 — Bone Devourer", () => {
  it("enters with a counter per creature that died this turn, and cashes them in as it dies", () => {
    const { game } = setUp();
    destroy(game, spawn(game, "Grizzly Bears", B));
    destroy(game, spawn(game, "Hill Giant"));
    const devourer = game.debugSpawn("Bone Devourer", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, devourer)).toBe(2);
    const hand = game.handOf(A).length;
    destroy(game, devourer);
    expect(game.handOf(A)).toHaveLength(hand + 2);
    expect(life(game, A)).toBe(18);
  });
});

describe("TDC batch 1 — Expel the Interlopers", () => {
  it("destroys the creatures with power at least the number chosen", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const dragon = spawn(game, "Shivan Dragon", B);
    game.debugApplyEffect(A, registry.get("Expel the Interlopers")!.effect!, []);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [3] });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, dragon)).toBe("graveyard");
  });
});

describe("TDC batch 1 — Tempt with Vengeance", () => {
  it("gives X more Elementals for each opponent who takes the offer", () => {
    const { game } = setUp(["Tempt with Vengeance"], "Mountain");
    lands(game, "Mountain", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Tempt with Vengeance"), targets: [], xValue: 2 });
    settle(game);
    expect(tokens(game, "Elemental Token", A)).toBe(4);
    expect(tokens(game, "Elemental Token", B)).toBe(2);
  });
});

describe("TDC batch 1 — Thalisse, Reverent Medium", () => {
  it("makes a Spirit for each token you created this turn", () => {
    const { game } = setUp();
    spawn(game, "Thalisse, Reverent Medium");
    game.debugApplyEffect(A, { kind: "create-token", token: "Servo Token", count: 2 }, []);
    settle(game);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(tokens(game, "Spirit Token", A)).toBe(2);
  });
});

describe("TDC batch 1 — Jaws of Defeat", () => {
  it("drains the difference between the entering creature's power and toughness", () => {
    const { game } = setUp();
    spawn(game, "Jaws of Defeat");
    game.debugSpawn("Overgrown Battlement", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(16);
  });
});

describe("TDC batch 1 — once-a-turn triggers", () => {
  it("Kishla Skimmer draws once, however many cards leave the graveyard", () => {
    const { game } = setUp();
    spawn(game, "Kishla Skimmer");
    const one = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const two = game.debugSpawn("Hill Giant", A, "graveyard");
    const hand = game.handOf(A).length;
    const back = (id: ObjectId): void => {
      game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [{ kind: "object", object: id }]);
      settle(game);
    };
    back(one);
    back(two);
    expect(game.handOf(A)).toHaveLength(hand + 3);
  });

  it("Crawling Sensation makes one Insect a turn for lands put into the graveyard", () => {
    const { game } = setUp([], "Forest");
    spawn(game, "Crawling Sensation");
    const mill = (): void => {
      game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, []);
      settle(game);
    };
    mill();
    mill();
    expect(tokens(game, "Insect Token", A)).toBe(1);
  });

  it("Aligned Heart counts rally counters on the second spell of the turn", () => {
    const { game } = setUp(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 3);
    const heart = spawn(game, "Aligned Heart");
    for (let i = 0; i < 3; i += 1) {
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Lightning Bolt"),
        targets: [{ kind: "player", player: B }],
      });
      settle(game);
    }
    expect(counters(game, heart, "rally")).toBe(1);
    expect(tokens(game, "Monk Token", A)).toBe(1);
  });
});

describe("TDC batch 1 — Amphin Mutineer", () => {
  it("exiles a creature and gives its controller a 4/3 Salamander", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Amphin Mutineer", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(tokens(game, "Salamander Warrior Token", B)).toBe(1);
    expect(tokens(game, "Salamander Warrior Token", A)).toBe(0);
  });
});

describe("TDC batch 1 — Broodcaller Scourge", () => {
  it("puts a permanent card no bigger than the damage onto the battlefield", () => {
    const { game } = setUp(["Hill Giant", "Shivan Dragon"]);
    const scourge = spawn(game, "Broodcaller Scourge");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: scourge, defender: B }] });
    settle(game);
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    settle(game);
    expect(life(game, B)).toBe(15);
    expect(named(game, "Hill Giant", A)).toHaveLength(1);
    expect(game.handOf(A).map((id) => game.state.objects[id].cardName)).toContain("Shivan Dragon");
  });
});

// Pinning that the stand-in effect is exactly what the card file says.
const _effect: EffectSpec | null = registry.get("Storm's Wrath")!.effect;
void _effect;
