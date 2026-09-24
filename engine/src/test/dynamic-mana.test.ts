/**
 * Mana abilities whose output is a live amount (Vivi Ornitier's power,
 * Marwyn's power, Kydele's cards drawn this turn), and the `turnStat` /
 * `playersWithTurnStat` amounts Kydele reads.
 *
 * The auto-payer plans from `manaSources`, which runs with nothing resolving,
 * so a live amount is sized there against the board as it stands. "X mana in
 * any combination of {U} and/or {R}" is one compressed option (X units, each
 * either colour) rather than X+1 enumerated splits, so a huge X costs the
 * planner nothing extra.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController, RandomController } from "../controller.js";
import type { PlayerController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts, poolTotal } from "../mana.js";
import { asPlayerId, createRng } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array(40).fill("Island") })),
  });

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === A;

const pool = (game: Game, p: PlayerId = A) => poolCounts(game.state.players[p].manaPool);

const counters = (game: Game, id: ObjectId, n: number): void =>
  game.debugApplyEffect(
    A,
    { kind: "add-counter", target: "source", counter: "+1/+1", amount: n },
    [],
    { source: id },
  );

const canCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);

const cast = (game: Game, card: ObjectId): void =>
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });

describe("printed stat blocks", () => {
  // Oracle: Kydele is a 2/3 Human Wizard; Vivi is a 0/3 Wizard (no Human).
  // Scryfall is the authority (`card:verify`), but this pins what shipped
  // wrong once.
  const registry = createDefaultRegistry();
  it("Kydele is 2/3", () => {
    const k = registry.get("Kydele, Chosen of Kruphix");
    expect([k.power, k.toughness, k.subtypes]).toEqual([2, 3, ["Human", "Wizard"]]);
  });
  it("Vivi is a 0/3 Wizard", () => {
    const v = registry.get("Vivi Ornitier");
    expect([v.power, v.toughness, v.subtypes]).toEqual([0, 3, ["Wizard"]]);
  });
  it("Marwyn is a 1/1 Elf Druid", () => {
    const m = registry.get("Marwyn, the Nurturer");
    expect([m.power, m.toughness, m.subtypes]).toEqual([1, 1, ["Elf", "Druid"]]);
  });
});

describe("Marwyn, the Nurturer", () => {
  it("taps for {G} equal to her power, which grows as Elves enter", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const marwyn = game.debugSpawn("Marwyn, the Nurturer", A, "battlefield");
    game.state.objects[marwyn].summoningSick = false;
    game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Elvish Mystic", A, "battlefield", { announceEntry: true });
    // An opponent's Elf isn't "an Elf you control".
    game.debugSpawn("Llanowar Elves", B, "battlefield", { announceEntry: true });
    game.advanceUntil(
      (s) =>
        s.zones.shared.stack.length === 0 &&
        s.pendingTriggers.length === 0 &&
        s.priority.holder === A,
    );
    expect(game.state.objects[marwyn].counters["+1/+1"]).toBe(2);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: marwyn,
      abilityIndex: 0,
      targets: [],
    });
    expect(pool(game).G).toBe(3);
  });

  it("pays a spell's whole cost from one tap when she's big enough", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const marwyn = game.debugSpawn("Marwyn, the Nurturer", A, "battlefield");
    game.state.objects[marwyn].summoningSick = false;
    counters(game, marwyn, 2);
    const second = game.debugSpawn("Marwyn, the Nurturer", A, "hand");
    expect(canCast(game, second)).toBe(true);
    cast(game, second);
    expect(game.state.objects[marwyn].tapped).toBe(true);
    expect(poolTotal(pool(game))).toBe(0);
  });

  it("makes nothing at power 0 and isn't offered to the payer", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const marwyn = game.debugSpawn("Marwyn, the Nurturer", A, "battlefield");
    game.state.objects[marwyn].summoningSick = false;
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: -1, toughness: 0, duration: "end-of-turn" },
      [{ kind: "object", object: marwyn }],
    );
    const elves = game.debugSpawn("Llanowar Elves", A, "hand");
    expect(canCast(game, elves)).toBe(false);
  });
});

describe("Kydele, Chosen of Kruphix", () => {
  it("adds {C} for each card drawn this turn, and pays with it", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const kydele = game.debugSpawn("Kydele, Chosen of Kruphix", A, "battlefield");
    game.state.objects[kydele].summoningSick = false;
    const drawnSoFar = game.state.players[A].cardsDrawnThisTurn;
    const opt = game.debugSpawn("Opt", A, "hand");
    // {U} can't come from colourless mana.
    expect(canCast(game, opt)).toBe(false);

    // Marwyn's {2}{G}: the {G} from a Forest, the {2} from Kydele.
    const bear = game.debugSpawn("Marwyn, the Nurturer", A, "hand");
    game.debugSpawn("Forest", A, "battlefield");
    expect(canCast(game, bear)).toBe(drawnSoFar >= 2);
    while (game.state.players[A].cardsDrawnThisTurn < 2) {
      game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    }
    expect(canCast(game, bear)).toBe(true);
    cast(game, bear);
    expect(game.state.objects[kydele].tapped).toBe(true);
  });

  it("counts only this turn's draws", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const kydele = game.debugSpawn("Kydele, Chosen of Kruphix", A, "battlefield");
    game.state.objects[kydele].summoningSick = false;
    game.debugApplyEffect(A, { kind: "draw", amount: 3 }, []);
    const drawn = game.state.players[A].cardsDrawnThisTurn;
    game.dispatch({ type: "activate-ability", player: A, source: kydele, abilityIndex: 0, targets: [] });
    expect(pool(game).C).toBe(drawn);
  });
});

describe("Vivi Ornitier", () => {
  const setup = () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const vivi = game.debugSpawn("Vivi Ornitier", A, "battlefield");
    return { game, vivi };
  };

  it("pays a mixed {U}{R} cost alone — untapped, even summoning sick", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 4);
    const bria = game.debugSpawn("Bria, Riptide Rogue", A, "hand");
    expect(canCast(game, bria)).toBe(true);
    cast(game, bria);
    const object = game.state.objects[vivi];
    expect(object.tapped).toBe(false);
    expect(object.abilitiesUsedThisTurn).toEqual([0]);
    expect(game.state.zones.shared.stack).toContain(bria);
  });

  it("convokes and still makes its mana — the ability doesn't tap", () => {
    // Nissa's Expedition, {4}{G}: Vivi convokes for {1}, her three mana pay
    // {3}, the Forest pays {G}. Convoking takes a creature's *tap*, and
    // Vivi's {0} ability never needed her untapped.
    const { game, vivi } = setup();
    counters(game, vivi, 3);
    game.debugSpawn("Forest", A, "battlefield");
    const expedition = game.debugSpawn("Nissa's Expedition", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: expedition,
      targets: [],
      convoke: [{ creature: vivi }],
    });
    expect(game.state.zones.shared.stack).toContain(expedition);
    expect(game.state.objects[vivi].tapped).toBe(true);
    expect(game.state.objects[vivi].abilitiesUsedThisTurn).toEqual([0]);
  });

  it("can't pay a colour outside {U} and {R}", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 5);
    expect(canCast(game, game.debugSpawn("Llanowar Elves", A, "hand"))).toBe(false);
    // Kydele's {2}{G}{U}: Vivi covers the {U} and the {2}, and her leftover
    // units still can't be {G} once she's been drawn on.
    expect(canCast(game, game.debugSpawn("Kydele, Chosen of Kruphix", A, "hand"))).toBe(false);
    expect(canCast(game, game.debugSpawn("Opt", A, "hand"))).toBe(true);
  });

  it("floats the surplus as U or R, and is spent for the turn", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 6);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    const floating = pool(game);
    expect(poolTotal(floating)).toBe(5);
    expect(floating.U + floating.R).toBe(5);

    // Once each turn: a second spell can't draw on it again — the floating
    // five still pay for Bria, but not for a second Bria.
    const bria = game.debugSpawn("Bria, Riptide Rogue", A, "hand");
    expect(game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === vivi)).toBe(
      false,
    );
    expect(canCast(game, bria)).toBe(floating.U >= 1 && floating.R >= 1);
  });

  it("does nothing at power 0 and nothing on an opponent's turn", () => {
    const { game, vivi } = setup();
    expect(canCast(game, game.debugSpawn("Opt", A, "hand"))).toBe(false);
    counters(game, vivi, 3);
    game.advanceUntil((s) => s.turn.activePlayer === B && s.priority.holder === A);
    const opt = game.debugSpawn("Opt", A, "hand");
    expect(canCast(game, opt)).toBe(false);
  });

  it("grows and pings each opponent on a noncreature spell, not a creature one", () => {
    const { game, vivi } = setup();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    const life = game.state.players[B].life;
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: game.debugSpawn("Llanowar Elves", B, "battlefield") }],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.priority.holder === A);
    expect(game.state.objects[vivi].counters["+1/+1"]).toBe(1);
    expect(game.state.players[B].life).toBe(life - 1);

    const elves = game.debugSpawn("Llanowar Elves", A, "hand");
    game.debugSpawn("Forest", A, "battlefield");
    cast(game, elves);
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.priority.holder === A);
    expect(game.state.objects[vivi].counters["+1/+1"]).toBe(1);
    expect(game.state.players[B].life).toBe(life - 1);
  });

  it("still pings if Vivi has left before the trigger resolves", () => {
    const { game, vivi } = setup();
    game.debugSpawn("Mountain", A, "battlefield");
    const life = game.state.players[B].life;
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: A }],
    });
    // The cast trigger is on the stack above the Bolt; Vivi goes before it
    // resolves.
    game.advanceUntil((s) => s.zones.shared.stack.length === 2 && s.priority.holder === A);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: vivi }]);
    expect(game.state.objects[vivi].zone).toBe("graveyard");
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.priority.holder === A);
    expect(game.state.players[B].life).toBe(life - 1);
  });

  it("offers each split by hand when X is small, one per colour when it's large", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 3);
    const offered = () =>
      game
        .legalActions(A)
        .flatMap((a) => (a.kind === "activate-ability" && a.source === vivi ? [a.manaColors] : []));
    expect(offered()).toEqual([
      ["U", "U", "U"],
      ["U", "U", "R"],
      ["U", "R", "R"],
      ["R", "R", "R"],
    ]);
    // A realistic big Vivi still gets every split — floating ten of each is
    // the player's call.
    counters(game, vivi, 17);
    const twenty = offered();
    expect(twenty).toHaveLength(21);
    expect(twenty).toContainEqual([...Array(10).fill("U"), ...Array(10).fill("R")]);
    counters(game, vivi, 1_000_000);
    expect(offered()).toHaveLength(2);
  });

  it("makes exactly X of its own colours whatever manaColors a client sends", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 2);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: vivi,
      abilityIndex: 0,
      targets: [],
      manaColors: ["R", "B", "B", "B", "B", "B"],
    });
    const floating = pool(game);
    expect(poolTotal(floating)).toBe(2);
    expect(floating.R).toBe(1);
    expect(floating.B).toBe(0);
  });

  it("plans with an enormous X without enumerating it", () => {
    const { game, vivi } = setup();
    counters(game, vivi, 1_000_000);
    const bria = game.debugSpawn("Bria, Riptide Rogue", A, "hand");
    const t = Date.now();
    expect(canCast(game, bria)).toBe(true);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe("bots and the fuzzer with live-amount mana sources", () => {
  const deck = [
    ...Array(4).fill("Vivi Ornitier"),
    ...Array(4).fill("Marwyn, the Nurturer"),
    ...Array(4).fill("Kydele, Chosen of Kruphix"),
    ...Array(4).fill("Llanowar Elves"),
    ...Array(6).fill("Opt"),
    ...Array(6).fill("Brainstorm"),
    ...Array(6).fill("Lightning Bolt"),
    ...Array(4).fill("Bria, Riptide Rogue"),
    ...Array(6).fill("Island"),
    ...Array(6).fill("Mountain"),
    ...Array(6).fill("Forest"),
  ];

  const play = (controllers: (p: PlayerId, seed: number) => PlayerController, seed: number) => {
    const game = Game.create({
      seed,
      controllers: { [A]: controllers(A, seed), [B]: controllers(B, seed + 1) },
      decks: [
        { player: A, cards: deck },
        { player: B, cards: deck },
      ],
    });
    game.advanceUntil((s) => s.turn.number > 30);
    return game;
  };

  it("RandomController games run without a refused action or a stall", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const rng = (s: number) => {
        const r = createRng(s);
        return () => r.next();
      };
      expect(() => play((p, s) => new RandomController(p, rng(s)), seed)).not.toThrow();
    }
  });

  it("HeuristicBotController games run to turn 30 or an end", () => {
    for (const seed of [1, 2]) {
      const game = play((p) => new HeuristicBotController(p), seed);
      expect(game.state.result.over || game.state.turn.number > 30).toBe(true);
    }
  });
});
