/**
 * Top-5000 batch 15 (ranks 2036–2111). No new engine vocabulary; these pin
 * the clauses most likely to be wired wrong — the second draw of a turn
 * (Homunculus Horde), a search matching the sacrificed creature's mana value
 * plus one (Birthing Pod), the graveyard-count condition on a static
 * (Elvish Reclaimer), hexproof only while untapped (Paradise Druid), a hand
 * size CDA (Body of Knowledge), a discard cost firing a discard trigger
 * (Glint-Horn Buccaneer), and "twice X" (Drown in Dreams). A recheck of the
 * batch's blockers added four more: damage from a goaded attacker to its own
 * controller (Vengeful Ancestor), a kicked-only cast trigger (Sowing
 * Mycospawn), a reveal on the second resolution of a turn only (Nissa,
 * Resurgent Animist), and a delayed return beside an exile replacement
 * (Liesa, Forgotten Archangel).
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

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: yes(new ScriptedController(A)), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
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

describe("top-5000 batch 15 — Homunculus Horde", () => {
  it("copies itself on the second draw of the turn only", () => {
    const game = setUp();
    spawn(game, "Homunculus Horde");
    // The turn's draw step was the first.
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Homunculus Horde")).toHaveLength(2);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Homunculus Horde")).toHaveLength(2);
  });
});

describe("top-5000 batch 15 — Birthing Pod", () => {
  it("finds a creature with mana value one more than the one sacrificed", () => {
    const game = setUp([], "Forest");
    lands(game, "Forest", 2);
    const pod = spawn(game, "Birthing Pod");
    const bears = spawn(game, "Grizzly Bears");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const courser = game.debugSpawn("Courser of Kruphix", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: pod, abilityIndex: 0, sacrifice: bears });
    settle(game);
    expect(zone(game, courser)).toBe("battlefield");
    expect(zone(game, giant)).toBe("library");
  });
});

describe("top-5000 batch 15 — Elvish Reclaimer", () => {
  it("gets +2/+2 with three land cards in your graveyard", () => {
    const game = setUp();
    const elf = spawn(game, "Elvish Reclaimer");
    game.debugSpawn("Forest", A, "graveyard");
    game.debugSpawn("Forest", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(pt(game, elf)).toEqual([1, 2]);
    game.debugSpawn("Forest", A, "graveyard");
    expect(pt(game, elf)).toEqual([3, 4]);
  });
});

describe("top-5000 batch 15 — Paradise Druid", () => {
  it("has hexproof only while untapped", () => {
    const game = setUp();
    const druid = spawn(game, "Paradise Druid");
    expect([...computeCharacteristics(game.state, registry, druid).keywords]).toContain("hexproof");
    game.state.objects[druid].tapped = true;
    expect([...computeCharacteristics(game.state, registry, druid).keywords]).not.toContain("hexproof");
  });
});

describe("top-5000 batch 15 — Body of Knowledge", () => {
  it("is as big as your hand", () => {
    const game = setUp();
    const body = spawn(game, "Body of Knowledge");
    const n = game.handOf(A).length;
    expect(pt(game, body)).toEqual([n, n]);
  });
});

describe("top-5000 batch 15 — Glint-Horn Buccaneer", () => {
  it("pings each opponent for the card its own loot discards", () => {
    const game = setUp([], "Mountain");
    lands(game, "Mountain", 2);
    const horn = spawn(game, "Glint-Horn Buccaneer");
    game.state.objects[horn].attacking = B;
    const life = game.state.players[B].life;
    game.dispatch({ type: "activate-ability", player: A, source: horn, abilityIndex: 0 });
    settle(game);
    expect(game.state.players[B].life).toBe(life - 1);
  });
});

describe("top-5000 batch 15 — Drown in Dreams", () => {
  it("mills twice X", () => {
    const game = setUp(["Drown in Dreams"], "Island");
    lands(game, "Island", 5);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Drown in Dreams"),
      targets: [{ kind: "player", player: B }],
      xValue: 2,
      modes: [1],
    });
    settle(game);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(4);
  });
});

/** A game whose A library is `library` in order, top first, after the
 * opening hand and first draw — and A's controller, for its callbacks. */
const withLibrary = (library: readonly string[]): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...Array<string>(8).fill("Wastes"), ...library, ...Array<string>(30).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("top-5000 batch 15 — Vengeful Ancestor", () => {
  it("has a goaded attacker deal 1 damage to its own controller, and only a goaded one", () => {
    const game = setUp();
    spawn(game, "Vengeful Ancestor");
    const goaded = spawn(game, "Grizzly Bears");
    const plain = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "object", object: goaded }]);
    settle(game);
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: goaded, defender: B },
        { attacker: plain, defender: B },
      ],
    });
    settle(game);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 15 — Sowing Mycospawn", () => {
  const cast = (kicked: boolean): Game => {
    const { game, a } = withLibrary([]);
    const spell = game.debugSpawn("Sowing Mycospawn", A, "hand");
    lands(game, "Forest", 2);
    lands(game, "Wastes", 4);
    const theirs = spawn(game, "Forest", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      targets: [],
      ...(kicked ? { kicked: true } : {}),
    });
    settle(game);
    return game;
  };
  it("kicked: finds a land and exiles target land", () => {
    const game = cast(true);
    expect(named(game, "Sowing Mycospawn")).toHaveLength(1);
    expect(game.battlefield.filter((id) => game.state.objects[id].controller === B)).toHaveLength(0);
    // Two Forests and four Wastes paid, plus the Wastes the search found.
    expect(named(game, "Wastes")).toHaveLength(5);
  });
  it("unkicked: finds a land and exiles nothing", () => {
    const game = cast(false);
    expect(game.battlefield.filter((id) => game.state.objects[id].controller === B)).toHaveLength(1);
    expect(named(game, "Wastes")).toHaveLength(5);
  });
});

describe("top-5000 batch 15 — Nissa, Resurgent Animist", () => {
  it("reveals for an Elf or Elemental on the second landfall of the turn only", () => {
    const { game } = withLibrary(["Wastes", "Wastes", "Llanowar Elves", "Wastes", "Elvish Mystic"]);
    spawn(game, "Nissa, Resurgent Animist");
    const hand = (): string[] => game.handOf(A).map((id) => game.state.objects[id].cardName);
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(hand()).not.toContain("Llanowar Elves");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(hand()).toContain("Llanowar Elves");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(hand()).not.toContain("Elvish Mystic");
    // The two Wastes revealed went to the bottom; the next card is the one
    // after the Elf.
    const library = game.state.zones.perPlayer[A].library;
    expect(game.state.objects[library[0]].cardName).toBe("Wastes");
    expect(game.state.objects[library[1]].cardName).toBe("Elvish Mystic");
  });
});

describe("top-5000 batch 15 — Liesa, Forgotten Archangel", () => {
  it("returns your creature that died at the next end step, and exiles an opponent's", () => {
    const game = setUp();
    spawn(game, "Liesa, Forgotten Archangel");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(zone(game, theirs)).toBe("exile");
    expect(game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName)).toContain(
      "Grizzly Bears",
    );
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    settle(game);
    expect(game.handOf(A).map((id) => game.state.objects[id].cardName)).toContain("Grizzly Bears");
  });
});
