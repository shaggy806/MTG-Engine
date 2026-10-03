/**
 * Precon cards behind five small effect features: Chaos Warp
 * (`shuffle-into-library`, and `reveal-top` of the target's owner's
 * library), Unbreathing Horde (`remove-counter`, and an entering card
 * counting itself in the graveyard it came from), Braids, Arisen Nightmare
 * (the permanent sacrificed in answer to an `each-player-may` is its
 * follow-up's "sacrificed"), Goddric, Cloaked Reveler (a static
 * `setSubtypes`, and rule 613.6 for a static with a layer-4 part whose
 * source loses its abilities) and Echoing Assault (a target "attacking that
 * player").
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = (
  libraries: Partial<Record<PlayerId, readonly string[]>> = {},
  players: readonly PlayerId[] = [A, B],
  seed = 1,
): Game => {
  const game = Game.create({
    seed,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: players.map((player) => ({
      player,
      cards: [...(libraries[player] ?? Array<string>(40).fill("Wastes"))],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

type Awaiting = NonNullable<GameState["awaiting"]>;

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Pass priority until the stack and triggers are empty, handing every
 * decision to `answer` (which dispatches it). */
const settle = (game: Game, answer: (awaiting: Awaiting) => void = unexpected): void => {
  for (let i = 0; i < 300; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting !== null) {
      answer(awaiting);
      continue;
    }
    if (quiet(game.state)) return;
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("never settled");
};

function unexpected(awaiting: Awaiting): never {
  throw new Error(`unexpected ${awaiting.kind} decision`);
}

const spawn = (game: Game, name: string, player: PlayerId = A, announce = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: announce });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const onBattlefield = (game: Game, id: ObjectId): boolean => game.state.objects[id]?.zone === "battlefield";
const named = (game: Game, name: string, player: PlayerId): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player);
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};

describe("Chaos Warp", () => {
  const warp = (game: Game, target: ObjectId): void => {
    lands(game, "Mountain", 3);
    const card = game.debugSpawn("Chaos Warp", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(target)] });
    settle(game);
  };

  it("shuffles the permanent into its owner's library and puts a revealed permanent card onto the battlefield under that owner's control", () => {
    const game = setUp({ [B]: Array<string>(30).fill("Hill Giant") });
    const bears = spawn(game, "Grizzly Bears", B);
    const libraryBefore = game.state.zones.perPlayer[B].library.length;
    warp(game, bears);
    expect(onBattlefield(game, bears)).toBe(false);
    // Into the library, which was shuffled, and one permanent card out of it.
    expect(game.state.eventLog.some((e) => e.type === "library-shuffled" && e.player === B)).toBe(true);
    expect(game.state.zones.perPlayer[B].library.length).toBe(libraryBefore);
    const entered = game.battlefield.filter(
      (id) => game.state.objects[id].owner === B && game.state.objects[id].kind === "card",
    );
    expect(entered).toHaveLength(1);
    expect(game.state.objects[entered[0]].controller).toBe(B);
    // Revealed by its owner, from their library — not the caster's.
    expect(game.state.eventLog.some((e) => e.type === "cards-revealed" && e.player === B)).toBe(true);
    expect(game.state.eventLog.some((e) => e.type === "cards-revealed" && e.player === A)).toBe(false);
  });

  it("leaves a revealed nonpermanent card on top of that library", () => {
    const game = setUp({ [A]: Array<string>(30).fill("Wastes"), [B]: Array<string>(30).fill("Lightning Bolt") });
    const bears = spawn(game, "Grizzly Bears", B);
    warp(game, bears);
    const library = game.state.zones.perPlayer[B].library;
    expect(library).toContain(bears);
    // This seed doesn't shuffle the Bears to the top: a Bolt is revealed, and stays.
    expect(game.state.objects[library[0]].cardName).toBe("Lightning Bolt");
    expect(game.battlefield.filter((id) => game.state.objects[id].owner === B)).toHaveLength(0);
    // The caster's own library (all permanent cards) is never looked at.
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Wastes")).toHaveLength(0);
  });

  it("shuffles the owner's library for a token, which ceases to exist, then reveals from it", () => {
    const game = setUp({ [B]: Array<string>(30).fill("Hill Giant") });
    const token = game.debugSpawn("Zombie Token", B, "battlefield");
    warp(game, token);
    expect(named(game, "Zombie Token", B)).toHaveLength(0);
    expect(game.state.eventLog.some((e) => e.type === "library-shuffled" && e.player === B)).toBe(true);
    expect(named(game, "Hill Giant", B)).toHaveLength(1);
  });

  it("goes into its owner's library, not its controller's", () => {
    const game = setUp({ [A]: Array<string>(30).fill("Lightning Bolt"), [B]: Array<string>(30).fill("Hill Giant") });
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    expect(game.state.objects[bears].controller).toBe(A);
    warp(game, bears);
    expect(game.state.zones.perPlayer[B].library).toContain(bears);
    expect(named(game, "Hill Giant", B)).toHaveLength(1);
  });
});

describe("Unbreathing Horde", () => {
  it("enters with a counter for each other Zombie you control and each Zombie card in your graveyard", () => {
    const game = setUp();
    lands(game, "Swamp", 3);
    spawn(game, "Zombie Token");
    spawn(game, "Walking Corpse");
    spawn(game, "Walking Corpse", B); // an opponent's Zombie doesn't count
    game.debugSpawn("Diregraf Ghoul", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Diregraf Ghoul", B, "graveyard"); // nor a Zombie in their graveyard
    const horde = game.debugSpawn("Unbreathing Horde", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: horde, targets: [] });
    settle(game);
    expect(game.state.objects[horde].counters["+1/+1"]).toBe(3);
    expect(pt(game, horde)).toEqual([3, 3]);
  });

  it("prevents damage dealt to it and loses one +1/+1 counter however much it was", () => {
    const game = setUp();
    const horde = spawn(game, "Unbreathing Horde");
    game.state.objects[horde].counters["+1/+1"] = 3;
    game.debugApplyEffect(B, { kind: "damage", amount: 5, target: 0 }, [obj(horde)]);
    settle(game);
    expect(onBattlefield(game, horde)).toBe(true);
    expect(game.state.objects[horde].damage ?? 0).toBe(0);
    expect(game.state.objects[horde].counters["+1/+1"]).toBe(2);
    expect(game.state.eventLog.filter((e) => e.type === "counter-removed" && e.object === horde)).toHaveLength(1);
  });

  it("returned from your graveyard, counts itself among the Zombie cards there", () => {
    const game = setUp();
    const horde = game.debugSpawn("Unbreathing Horde", A, "graveyard");
    game.debugSpawn("Diregraf Ghoul", A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(horde)]);
    settle(game);
    expect(game.state.objects[horde].counters["+1/+1"]).toBe(2);
  });
});

describe("remove-counter", () => {
  it("removes up to the amount there is, and nothing from a permanent with none", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 2;
    game.debugApplyEffect(A, { kind: "remove-counter", target: 0, counter: "+1/+1", amount: 5 }, [obj(bears)]);
    expect(game.state.objects[bears].counters["+1/+1"]).toBeUndefined();
    const removed = game.state.eventLog.filter((e) => e.type === "counter-removed" && e.object === bears);
    expect(removed).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "remove-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(bears)]);
    expect(game.state.eventLog.filter((e) => e.type === "counter-removed" && e.object === bears)).toHaveLength(1);
  });
});

describe("Braids, Arisen Nightmare", () => {
  /** To A's end step, where Braids triggers. */
  const toEndStep = (game: Game): void => {
    game.advanceUntil((s) => s.turn.step === "end" && (s.awaiting !== null || s.zones.shared.stack.length > 0));
  };

  /** Answers: A's "may" with `sacrifice` (a permanent of A's, or none), each
   * opponent's with `opponents` (their permanent to sacrifice, or none). */
  const answers =
    (game: Game, sacrifice: ObjectId | null, opponents: Partial<Record<PlayerId, ObjectId | null>>) =>
    (awaiting: Awaiting): void => {
      if (awaiting.kind === "choose-modes") {
        const pick = awaiting.player === A ? sacrifice : (opponents[awaiting.player] ?? null);
        game.dispatch({ type: "choose-modes", player: awaiting.player, modes: pick === null ? [] : [0] });
        return;
      }
      if (awaiting.kind === "sacrifice") {
        const pick = awaiting.player === A ? sacrifice : opponents[awaiting.player];
        expect(pick).toBeDefined();
        expect(awaiting.eligible).toContain(pick);
        game.dispatch({ type: "sacrifice", player: awaiting.player, permanents: [pick!] });
        return;
      }
      unexpected(awaiting);
    };

  it("an opponent who won't sacrifice a permanent sharing a type loses 2 life, and you draw", () => {
    const game = setUp();
    spawn(game, "Braids, Arisen Nightmare");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    const hand = game.handOf(A).length;
    toEndStep(game);
    settle(game, answers(game, bears, { [B]: null }));
    expect(onBattlefield(game, bears)).toBe(false);
    expect(game.state.players[B].life).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("an opponent who does sacrifice one loses nothing, and you draw nothing", () => {
    const game = setUp();
    spawn(game, "Braids, Arisen Nightmare");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    lands(game, "Wastes", 2, B);
    const hand = game.handOf(A).length;
    toEndStep(game);
    settle(game, answers(game, bears, { [B]: giant }));
    expect(onBattlefield(game, giant)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("offers the opponent only what shares a card type with what you sacrificed", () => {
    const game = setUp();
    spawn(game, "Braids, Arisen Nightmare");
    const swamp = spawn(game, "Swamp");
    spawn(game, "Hill Giant", B); // a creature, not a land: nothing B can sacrifice
    const hand = game.handOf(A).length;
    toEndStep(game);
    let opponentAsked = false;
    settle(game, (awaiting) => {
      if (awaiting.player === B) opponentAsked = true;
      answers(game, swamp, {})(awaiting);
    });
    expect(opponentAsked).toBe(false);
    expect(onBattlefield(game, swamp)).toBe(false);
    expect(game.state.players[B].life).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("does nothing if you don't sacrifice", () => {
    const game = setUp();
    spawn(game, "Braids, Arisen Nightmare");
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    const hand = game.handOf(A).length;
    toEndStep(game);
    settle(game, answers(game, null, { [B]: null }));
    expect(game.state.players[B].life).toBe(20);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("asks each opponent: one who sacrifices is spared, one who doesn't pays", () => {
    const game = setUp({}, [A, B, C]);
    spawn(game, "Braids, Arisen Nightmare");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    spawn(game, "Hill Giant", C);
    const hand = game.handOf(A).length;
    toEndStep(game);
    settle(game, answers(game, bears, { [B]: giant, [C]: null }));
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.players[C].life).toBe(18);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Goddric, Cloaked Reveler", () => {
  it("is a 3/3 Human Noble with haste and no flying without celebration", () => {
    const game = setUp();
    const goddric = spawn(game, "Goddric, Cloaked Reveler");
    const c = game.characteristics(goddric);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect([...c.subtypes].sort()).toEqual(["Human", "Noble"]);
    expect(c.keywords.has("haste")).toBe(true);
    expect(c.keywords.has("flying")).toBe(false);
  });

  it("with two nonland permanents entered this turn, is a 4/4 flying Dragon with no other creature types", () => {
    const game = setUp();
    const goddric = spawn(game, "Goddric, Cloaked Reveler");
    spawn(game, "Grizzly Bears", A, true);
    expect(game.characteristics(goddric).subtypes).toContain("Human");
    spawn(game, "Sol Ring", A, true);
    const c = game.characteristics(goddric);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect([...c.subtypes]).toEqual(["Dragon"]);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.keywords.has("haste")).toBe(true);
  });

  it("counts himself entering, and not a land or an opponent's permanent", () => {
    const game = setUp();
    spawn(game, "Grizzly Bears", B, true);
    spawn(game, "Mountain", A, true);
    const goddric = spawn(game, "Goddric, Cloaked Reveler", A, true);
    expect(game.characteristics(goddric).subtypes).not.toContain("Dragon");
    spawn(game, "Grizzly Bears", A, true);
    expect(game.characteristics(goddric).subtypes).toEqual(["Dragon"]);
  });

  it("has '{R}: Dragons you control get +1/+0', pumping only Dragons", () => {
    const game = setUp();
    const goddric = spawn(game, "Goddric, Cloaked Reveler");
    const dragon = spawn(game, "Shivan Dragon", A, true);
    const bears = spawn(game, "Grizzly Bears", A, true);
    lands(game, "Mountain", 1);
    const index = game.legalActions(A).find(
      (a) => a.kind === "activate-ability" && a.source === goddric,
    );
    expect(index).toBeDefined();
    if (index?.kind !== "activate-ability") return;
    game.dispatch({ type: "activate-ability", player: A, source: goddric, abilityIndex: index.abilityIndex, targets: [] });
    settle(game);
    expect(pt(game, goddric)).toEqual([5, 4]);
    expect(pt(game, dragon)).toEqual([6, 5]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });

  it("losing all abilities once a Dragon leaves him a 4/4 Dragon, without flying (rule 613.6)", () => {
    const game = setUp();
    const goddric = spawn(game, "Goddric, Cloaked Reveler");
    spawn(game, "Grizzly Bears", A, true);
    spawn(game, "Sol Ring", A, true);
    game.debugApplyEffect(B, { kind: "lose-abilities", target: 0, duration: "end-of-turn" }, [obj(goddric)]);
    const c = game.characteristics(goddric);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect([...c.subtypes]).toEqual(["Dragon"]);
    expect(c.keywords.has("flying")).toBe(false);
    expect(c.keywords.has("haste")).toBe(false);
    expect(game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === goddric)).toBe(false);
  });
});

describe("Echoing Assault", () => {
  /** To A's declare-attackers decision, with Echoing Assault out. */
  const toAttack = (game: Game): void => {
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  };

  const chooseTarget = (game: Game, target: ObjectId) => (awaiting: Awaiting): void => {
    if (awaiting.kind !== "choose-targets") unexpected(awaiting);
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(target)] });
  };

  it("copies the attacker as a 1/1 token, tapped and attacking that player, with menace, sacrificed at the end step", () => {
    const game = setUp();
    spawn(game, "Echoing Assault");
    const giant = spawn(game, "Hill Giant");
    toAttack(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: giant, defender: B }] });
    game.advanceUntil(
      (s) => s.awaiting !== null || s.zones.shared.stack.length > 0 || s.turn.step !== "declare-attackers",
    );
    settle(game, chooseTarget(game, giant));
    const copies = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Hill Giant" && game.state.objects[id].isToken,
    );
    expect(copies).toHaveLength(1);
    const token = game.state.objects[copies[0]];
    expect(token.tapped).toBe(true);
    expect(token.attacking).toBe(B);
    const c = game.characteristics(copies[0]);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect(c.keywords.has("menace")).toBe(true);
    expect(game.characteristics(giant).keywords.has("menace")).toBe(false);
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1 || s.result.over);
    expect(game.state.objects[copies[0]]?.zone === "battlefield").toBe(false);
  });

  it("triggers for each player attacked, each targeting only a creature attacking that player", () => {
    const game = setUp({}, [A, B, C]);
    spawn(game, "Echoing Assault");
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    toAttack(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: giant, defender: B },
        { attacker: bears, defender: C },
      ],
    });
    // Each trigger has one legal target, so it's chosen for it; were both
    // attackers legal for either, it would ask — and must offer just one.
    settle(game, (awaiting) => {
      if (awaiting.kind !== "choose-targets") unexpected(awaiting);
      const legal = game.legalActions(A).filter((a) => a.kind === "choose-targets");
      // One legal target each: the creature attacking that trigger's player.
      expect(legal).toHaveLength(1);
      if (legal[0]?.kind !== "choose-targets") return;
      game.dispatch({ type: "choose-targets", player: A, targets: legal[0].targets });
    });
    const copies = game.battlefield.filter((id) => game.state.objects[id].isToken);
    expect(copies.map((id) => [game.state.objects[id].cardName, game.state.objects[id].attacking]).sort()).toEqual([
      ["Grizzly Bears", C],
      ["Hill Giant", B],
    ]);
  });
});
