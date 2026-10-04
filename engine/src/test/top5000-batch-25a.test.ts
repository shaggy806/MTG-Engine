/**
 * Top-5000 batch 25a. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — tiered as spree with one mode (Fire Magic),
 * a two-type anthem (Tempered Steel), a target by any of six creature types
 * (Animal Sanctuary), a Shrine count (Sanctum of Stone Fangs), a token's
 * dying trigger reaching its Garruk, "this or another Human" (Lossarnach
 * Captain), a non-targeted bounce that may take itself (Whitemane Lion), the
 * sacrificed permanent's mana value (Reckoner's Bargain), "attack with three
 * or more" transforming (Legion's Landing), "that player's" creature on an
 * attack (Karazikar) and "two other Merfolk" (Svyelun).
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
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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

describe("top-5000 batch 25a — Tempered Steel", () => {
  it("pumps artifact creatures you control, and nothing else", () => {
    const { game } = setUp();
    spawn(game, "Tempered Steel");
    const thopter = spawn(game, "Ornithopter");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Ornithopter", B);
    expect([chars(game, thopter).power, chars(game, thopter).toughness]).toEqual([2, 4]);
    expect([chars(game, bears).power, chars(game, bears).toughness]).toEqual([2, 2]);
    expect([chars(game, theirs).power, chars(game, theirs).toughness]).toEqual([0, 2]);
  });
});

describe("top-5000 batch 25a — Animal Sanctuary", () => {
  it("can target a Cat but not a Bear", () => {
    const { game } = setUp();
    const sanctuary = spawn(game, "Animal Sanctuary");
    lands(game, "Wastes", 2);
    const cat = spawn(game, "Canyon Wildcat");
    const bears = spawn(game, "Grizzly Bears");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === sanctuary && x.abilityIndex === 1);
    const options = offer?.kind === "activate-ability" ? offer.targetOptions[0] : [];
    const ids = options.map((t) => (t.kind === "object" ? t.object : null));
    expect(ids).toContain(cat);
    expect(ids).not.toContain(bears);
  });
});

describe("top-5000 batch 25a — Sanctum of Stone Fangs", () => {
  it("drains for each Shrine you control", () => {
    const { game } = setUp();
    const sanctum = spawn(game, "Sanctum of Stone Fangs");
    spawn(game, "Go-Shintai of Life's Origin");
    const drain = registry.get("Sanctum of Stone Fangs")!.triggered[0].effect!;
    game.debugApplyEffect(A, drain, [], { source: sanctum });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 25a — Garruk, Cursed Huntsman", () => {
  it("a Wolf dying puts a loyalty counter on each Garruk you control", () => {
    const { game } = setUp();
    const garruk = spawn(game, "Garruk, Cursed Huntsman");
    const before = game.state.objects[garruk].counters.loyalty ?? 0;
    // One Wolf, so the destroy can't take a whole token stack.
    game.debugApplyEffect(A, { kind: "create-token", token: "Wolf Token (Garruk, Cursed Huntsman)", count: 1 }, [], {
      source: garruk,
    });
    settle(game);
    const wolves = named(game, "Wolf Token (Garruk, Cursed Huntsman)");
    expect(wolves).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: wolves[0] }]);
    settle(game);
    expect(game.state.objects[garruk].counters.loyalty ?? 0).toBe(before + 1);
  });
});

describe("top-5000 batch 25a — Lossarnach Captain", () => {
  it("taps an opponent's creature when another Human enters", () => {
    const { game } = setUp();
    spawn(game, "Lossarnach Captain");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugSpawn("Abbey Matron", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});

describe("top-5000 batch 25a — Whitemane Lion", () => {
  it("returns itself when it's the only creature you control", () => {
    const { game } = setUp();
    const lion = game.debugSpawn("Whitemane Lion", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, lion)).toBe("hand");
  });
});

describe("top-5000 batch 25a — Reckoner's Bargain", () => {
  it("gains life equal to the sacrificed creature's mana value, and draws two", () => {
    const { game } = setUp(["Reckoner's Bargain"], "Swamp");
    lands(game, "Swamp", 2);
    const giant = spawn(game, "Hill Giant");
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Reckoner's Bargain"),
      targets: [],
      sacrifice: giant,
    });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(life(game, A)).toBe(24);
    expect(game.handOf(A)).toHaveLength(hand - 1 + 2);
  });
});

describe("top-5000 batch 25a — Legion's Landing", () => {
  it("transforms when you attack with three creatures, not two", () => {
    const { game } = setUp();
    const landing = spawn(game, "Legion's Landing");
    const [x, y, z] = [spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears")];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: x, defender: B },
        { attacker: y, defender: B },
        { attacker: z, defender: B },
      ],
    });
    settle(game);
    expect(game.state.objects[landing].face).toBe(1);
  });
});

describe("top-5000 batch 25a — Karazikar, the Eye Tyrant", () => {
  it("taps and goads a creature the attacked player controls", () => {
    const { game } = setUp();
    const karazikar = spawn(game, "Karazikar, the Eye Tyrant");
    const bears = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: karazikar, defender: B }] });
    settle(game);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[bears].goadedBy).toContain(A);
  });
});

describe("top-5000 batch 25a — Svyelun of Sea and Sky", () => {
  it("is indestructible only with two other Merfolk", () => {
    const { game } = setUp();
    const svyelun = spawn(game, "Svyelun of Sea and Sky");
    spawn(game, "Merfolk Looter");
    expect(chars(game, svyelun).keywords.has("indestructible")).toBe(false);
    spawn(game, "Merfolk Looter");
    expect(chars(game, svyelun).keywords.has("indestructible")).toBe(true);
  });
});
