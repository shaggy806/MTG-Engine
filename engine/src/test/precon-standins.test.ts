/**
 * The nine starter precons' stand-ins (`SAMPLE_DECKS`' substitution tables),
 * authored one by one on 2026-10-09 — each card's own behaviour, and the
 * engine piece it needed where it needed one.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
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
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const toHand = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "hand");
const cast = (game: Game, card: ObjectId, more: { xValue?: number; targets?: never[] } = {}): void => {
  game.dispatch({ type: "cast-spell", player: A, card, targets: [], ...more });
  settle(game);
};
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const keywords = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, game.registry, id).keywords;

describe("Carnelian Orb of Dragonkind", () => {
  it("gives a Dragon creature spell its mana pays for haste, until end of turn", () => {
    const { game } = setUp();
    spawn(game, "Carnelian Orb of Dragonkind");
    lands(game, "Wastes", 2);
    const whelp = toHand(game, "Firespitter Whelp");
    // The Orb is the only red source, so the auto-payer spends its mana.
    cast(game, whelp);
    expect(zone(game, whelp)).toBe("battlefield");
    expect(keywords(game, whelp).has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(keywords(game, whelp).has("haste")).toBe(false);
  });

  it("gives nothing to a spell that isn't a Dragon creature", () => {
    const { game } = setUp();
    spawn(game, "Carnelian Orb of Dragonkind");
    lands(game, "Wastes", 1);
    const goblin = toHand(game, "Goblin Piker");
    cast(game, goblin);
    expect(zone(game, goblin)).toBe("battlefield");
    expect(keywords(game, goblin).has("haste")).toBe(false);
  });
});

describe("Rowdy Research", () => {
  it("costs {1} less for each creature that attacked this turn, one that's gone included", () => {
    const { game, a } = setUp();
    const bears = lands(game, "Grizzly Bears", 3);
    a.declareAttackersFn = () => bears.map((id) => ({ attacker: id, defender: B }));
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A);
    // One of them dies after attacking: it still attacked this turn.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears[0] }]);
    settle(game);
    lands(game, "Island", 4);
    const research = toHand(game, "Rowdy Research");
    const hand = game.handOf(A).length;
    cast(game, research);
    expect(zone(game, research)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand - 1 + 3);
  });

  it("costs its full {6}{U} with nothing attacking", () => {
    const { game } = setUp();
    lands(game, "Island", 4);
    const research = toHand(game, "Rowdy Research");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === research)).toBe(false);
  });
});

describe("Tetsuko Umezawa, Fugitive", () => {
  it("makes creatures you control with power or toughness 1 or less unblockable", () => {
    const { game, a } = setUp();
    const tetsuko = spawn(game, "Tetsuko Umezawa, Fugitive"); // 1/3
    const piker = spawn(game, "Goblin Piker"); // 2/1
    const bears = spawn(game, "Grizzly Bears"); // 2/2
    const giant = spawn(game, "Hill Giant", B);
    a.declareAttackersFn = () => [tetsuko, piker, bears].map((attacker) => ({ attacker, defender: B }));
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const offer = game
      .legalActions(B)
      .find((o): o is Extract<typeof o, { kind: "declare-blockers" }> => o.kind === "declare-blockers");
    expect(offer?.eligible.find((e) => e.blocker === giant)?.canBlock).toEqual([bears]);
  });
});

describe("Challenger Troll", () => {
  type BlockOffer = Extract<ReturnType<Game["legalActions"]>[number], { kind: "declare-blockers" }>;
  const toBlocks = (game: Game, a: ScriptedController, attackers: ObjectId[]): BlockOffer => {
    a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    return game.legalActions(B).find((o): o is BlockOffer => o.kind === "declare-blockers")!;
  };

  it("lets each creature you control with power 4 or greater be blocked by one creature at most", () => {
    const { game, a } = setUp();
    const troll = spawn(game, "Challenger Troll");
    const bears = spawn(game, "Grizzly Bears");
    const [b1, b2, b3] = [spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B)];
    const offer = toBlocks(game, a, [troll, bears]);
    expect(offer.singleBlockerAttackers).toEqual([troll]);
    expect(() =>
      game.dispatch({
        type: "declare-blockers",
        player: B,
        blocks: [
          { blocker: b1, attacker: troll },
          { blocker: b2, attacker: troll },
        ],
      }),
    ).toThrow(/can't be blocked by more than one creature/);
    // One on the Troll, and two on the Bears (power 2): legal.
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: [
        { blocker: b1, attacker: troll },
        { blocker: b2, attacker: bears },
        { blocker: b3, attacker: bears },
      ],
    });
    expect(game.state.objects[troll].blockedBy).toEqual([b1]);
  });

  it("reads power as blocks are declared: a pumped creature is covered", () => {
    const { game, a } = setUp();
    spawn(game, "Challenger Troll");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    spawn(game, "Hill Giant", B);
    const offer = toBlocks(game, a, [bears]);
    expect(offer.singleBlockerAttackers).toEqual([bears]);
  });
});

describe("Skyclave Apparition", () => {
  const illusions = (game: Game, player: PlayerId): ObjectId[] =>
    game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Illusion Token (Skyclave Apparition)" && game.state.objects[id].controller === player,
    );

  it("exiles a small permanent, and when it leaves the card's owner gets an X/X Illusion", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    const skyclave = game.debugSpawn("Skyclave Apparition", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: skyclave }]);
    settle(game);
    const [token] = illusions(game, B);
    expect(token).toBeDefined();
    expect(computeCharacteristics(game.state, game.registry, token)).toMatchObject({ power: 2, toughness: 2 });
    // The card stays exiled.
    expect(zone(game, bears)).toBe("exile");
  });

  it("creates no token when it exiled nothing", () => {
    const { game } = setUp();
    const skyclave = game.debugSpawn("Skyclave Apparition", A, "battlefield", { announceEntry: true });
    settle(game);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: skyclave }]);
    settle(game);
    expect(illusions(game, A).length + illusions(game, B).length).toBe(0);
  });

  it("can't exile a permanent with mana value over 4", () => {
    const { game, a } = setUp();
    const angel = spawn(game, "Serra Angel", B);
    const bears = spawn(game, "Grizzly Bears", B);
    let offered: readonly ObjectId[] = [];
    a.chooseTargetsFn = (_view, _name, _specs, options) => {
      offered = options.flat().flatMap((t) => (t.kind === "object" ? [t.object] : []));
      return [undefined];
    };
    game.debugSpawn("Skyclave Apparition", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(offered).toContain(bears);
    expect(offered).not.toContain(angel);
    expect(zone(game, angel)).toBe("battlefield");
  });
});

describe("Ram Through", () => {
  const ram = (game: Game, mine: ObjectId, theirs: ObjectId): void => {
    lands(game, "Forest", 2);
    const spell = toHand(game, "Ram Through");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      targets: [
        { kind: "object", object: mine },
        { kind: "object", object: theirs },
      ],
    });
    settle(game);
  };

  it("with trample, deals the excess to the creature's controller", () => {
    const { game } = setUp();
    const wurm = spawn(game, "Craw Wurm"); // 6/4
    game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" }, [
      { kind: "object", object: wurm },
    ]);
    const bears = spawn(game, "Grizzly Bears", B); // 2/2
    ram(game, wurm, bears);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20 - 4);
  });

  it("without trample, all of it goes to the creature", () => {
    const { game } = setUp();
    const wurm = spawn(game, "Craw Wurm");
    const bears = spawn(game, "Grizzly Bears", B);
    ram(game, wurm, bears);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("counts damage already marked toward lethal", () => {
    const { game } = setUp();
    const wurm = spawn(game, "Craw Wurm");
    game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" }, [
      { kind: "object", object: wurm },
    ]);
    const giant = spawn(game, "Hill Giant", B); // 3/3
    game.state.objects[giant].damageMarked = 2;
    ram(game, wurm, giant);
    expect(game.state.players[B].life).toBe(20 - 5);
  });
});

describe("Foe-Razer Regent", () => {
  it("may fight as it enters, then gets two +1/+1 counters at the next end step", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    a.chooseModesFn = () => [0];
    const regent = game.debugSpawn("Foe-Razer Regent", A, "battlefield", { announceEntry: true, summoningSick: false });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[regent].counters["+1/+1"] ?? 0).toBe(0);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[regent].counters["+1/+1"]).toBe(2);
  });

  it("counts any creature you control fighting — each of two of yours", () => {
    const { game } = setUp();
    spawn(game, "Foe-Razer Regent");
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "fight", a: 0, b: 1 }, [
      { kind: "object", object: giant },
      { kind: "object", object: bears },
    ]);
    settle(game);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[giant].counters["+1/+1"]).toBe(2);
    // The Bears died in the fight: nothing to put counters on.
    expect(zone(game, bears)).toBe("graveyard");
  });

  it("isn't a fight when the other creature is gone, so nothing triggers", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    a.chooseModesFn = () => [0];
    const regent = game.debugSpawn("Foe-Razer Regent", A, "battlefield", { announceEntry: true, summoningSick: false });
    // The target leaves before the enters ability resolves.
    expect(game.state.pendingTriggers.length + game.state.zones.shared.stack.length).toBeGreaterThan(0);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    expect(zone(game, bears)).toBe("graveyard");
    settle(game);
    expect(game.state.eventLog.some((e) => e.type === "creature-fought")).toBe(false);
    game.advanceUntil((s) => s.turn.step === "cleanup");
    expect(game.state.objects[regent].counters["+1/+1"] ?? 0).toBe(0);
  });
});
