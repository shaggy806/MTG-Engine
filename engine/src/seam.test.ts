import { describe, expect, it } from "vitest";

import type { LegalAction } from "./actions.js";
import { RandomController, ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asObjectId, asPlayerId, createRng } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const mkGame = (
  aCards: readonly string[] = [],
  bCards: readonly string[] = [],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  game.state.timestampSeq += 1;
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: opts.tapped ?? false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    summoningSick: opts.sick ?? false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    counters: {},
    modifiers: [],
    timestamp: game.state.timestampSeq,
    isToken: false,
    attachedTo: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

/** `[["Forest", 17], ...]` -> a flat deck list. */
const deck = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

// Mana bases that can actually cast their own spells, so the fuzz exercises
// both seats rather than leaving one player unable to do anything.
const fuzzDeckA = deck([
  ["Forest", 17],
  ["Llanowar Elves", 4],
  ["Grizzly Bears", 4],
  ["Elvish Visionary", 4],
  ["Wildwood Sentinel", 2],
  ["Rumbling Baloth", 3],
  ["Craw Wurm", 3],
  ["Giant Growth", 3],
]);
const fuzzDeckB = deck([
  ["Mountain", 6],
  ["Plains", 6],
  ["Swamp", 4],
  ["Raging Goblin", 3],
  ["Goblin Raider", 3],
  ["White Knight", 3],
  ["Boggart Brute", 3],
  ["Typhoid Rats", 3],
  ["Hill Giant", 1],
  ["Lightning Bolt", 4],
  ["Vampire Nighthawk", 2],
  ["Serra Angel", 1],
  ["Disenchant", 2],
  ["Raise the Alarm", 2],
  ["Holy Strength", 2],
  ["Bonesplitter", 2],
  ["Wurmcoil Engine", 1],
]);

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const kinds = (actions: readonly LegalAction[]): string[] =>
  actions.map((a) => a.kind);
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("legalActions", () => {
  it("is empty for the player who does not hold priority", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    expect(game.legalActions(B)).toEqual([]);
    expect(kinds(game.legalActions(A))).toContain("pass-priority");
  });

  it("offers a land in a main phase and not in upkeep", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil((s) => s.turn.step === "upkeep");
    expect(kinds(game.legalActions(A))).not.toContain("play-land");

    game.advanceUntil(atFirstMain);
    const lands = game
      .legalActions(A)
      .filter((a) => a.kind === "play-land");
    expect(lands.length).toBeGreaterThan(0);
  });

  it("drops the land option once the land drop is used", () => {
    const game = mkGame(["Forest", "Forest"], [], { rules: { maxLandsPerTurn: 1 } });
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    expect(kinds(game.legalActions(A))).not.toContain("play-land");
  });

  it("only offers spells whose mana can actually be paid", () => {
    const game = mkGame(["Forest", "Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const bears = named(game, game.handOf(A), "Grizzly Bears");

    // One Forest is not enough for {1}{G}.
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === bears),
    ).toBe(false);

    spawn(game, "Forest", A);
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === bears),
    ).toBe(true);
  });

  it("reports the legal targets for a targeted spell", () => {
    const game = mkGame(["Mountain", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    game.dispatch({ type: "play-land", player: A, card: game.handOf(A)[0] });
    const bear = spawn(game, "Grizzly Bears", B);

    const bolt = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.cardName === "Lightning Bolt");
    expect(bolt?.kind).toBe("cast-spell");
    if (bolt?.kind !== "cast-spell") throw new Error("unreachable");
    expect(bolt.targetOptions).toHaveLength(1);
    const options = bolt.targetOptions[0];
    expect(options).toContainEqual({ kind: "player", player: A });
    expect(options).toContainEqual({ kind: "player", player: B });
    expect(options).toContainEqual({ kind: "object", object: bear });
  });

  it("lists activatable abilities and respects tap / summoning sickness", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const ready = spawn(game, "Prodigal Sorcerer", A);
    const sick = spawn(game, "Prodigal Sorcerer", A, { sick: true });
    const tapped = spawn(game, "Prodigal Sorcerer", A, { tapped: true });

    const sources = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability")
      .map((a) => (a.kind === "activate-ability" ? a.source : null));
    expect(sources).toContain(ready);
    expect(sources).not.toContain(sick);
    expect(sources).not.toContain(tapped);
  });

  it("narrows to the single awaited declaration", () => {
    const game = mkGame();
    game.advanceUntil((s) => s.awaiting !== null);
    expect(game.state.awaiting?.kind).toBe("attackers");
    const actions = game.legalActions(A);
    expect(kinds(actions)).toEqual(["declare-attackers"]);
    expect(game.legalActions(B)).toEqual([]);
  });

  it("canDispatch mirrors dispatch's refusal", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil((s) => s.turn.step === "upkeep");
    const action = {
      type: "play-land",
      player: A,
      card: game.handOf(A)[0],
    } as const;
    expect(game.canDispatch(action)).toMatch(/main phase/);
    expect(() => game.dispatch(action)).toThrow(/main phase/);
  });
});

describe("declarations as actions", () => {
  const combatGame = (): Game =>
    Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });

  it("asks the active player for attackers and accepts an empty declaration", () => {
    const game = combatGame();
    spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(game.state.awaiting?.player).toBe(A);

    game.dispatch({ type: "declare-attackers", player: A, attackers: [] });
    expect(game.state.awaiting).toBeNull();
    expect(game.eventsOfType("attacker-declared")).toHaveLength(0);
  });

  it("attacking through the action deals damage", () => {
    const game = combatGame();
    const bear = spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[bear].tapped).toBe(true);
  });

  it("rejects an illegal attacker without mutating anything", () => {
    const game = combatGame();
    const bear = spawn(game, "Grizzly Bears", A);
    const sick = spawn(game, "Grizzly Bears", A, { sick: true });
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");

    expect(() =>
      game.dispatch({
        type: "declare-attackers",
        player: A,
        attackers: [
          { attacker: bear, defender: B },
          { attacker: sick, defender: B },
        ],
      }),
    ).toThrow(/summoning sickness/);
    expect(game.state.objects[bear].attacking).toBeNull();
    expect(game.state.objects[bear].tapped).toBe(false);
  });

  it("rejects a declaration from the wrong player or when not awaited", () => {
    const game = combatGame();
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: B, attackers: [] }),
    ).toThrow(/not being asked/);
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [] }),
    ).toThrow(/not being asked/);
  });

  it("refuses to pass priority while a declaration is pending", () => {
    const game = combatGame();
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(() =>
      game.dispatch({ type: "pass-priority", player: A }),
    ).toThrow(/declaration is pending/);
  });

  it("asks the defender for blockers only when someone attacks", () => {
    const game = combatGame();
    const bear = spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: bear, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    expect(game.state.awaiting?.player).toBe(B);

    const legal = game.legalActions(B);
    expect(kinds(legal)).toEqual(["declare-blockers"]);
  });

  it("flags menace attackers in the declare-blockers legal action", () => {
    const game = combatGame();
    const brute = spawn(game, "Boggart Brute", A); // 3/2 menace
    spawn(game, "Grizzly Bears", A); // vanilla, for contrast
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: brute, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");

    const legal = game.legalActions(B);
    expect(legal).toHaveLength(1);
    expect(
      legal[0].kind === "declare-blockers" && legal[0].menaceAttackers,
    ).toEqual([brute]);
  });

  it("skips the blocker declaration when nobody attacks", () => {
    const game = combatGame();
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.awaiting).toBeNull();
  });

  it("asks the active player to discard in cleanup", () => {
    const game = mkGame();
    // These games draw on turn 1, so Alice hits 8 cards and discards first.
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    const awaiting = game.state.awaiting;
    expect(awaiting?.player).toBe(A);
    expect(awaiting?.kind === "discard" && awaiting.count).toBe(1);

    const legal = game.legalActions(A);
    expect(kinds(legal)).toEqual(["discard"]);

    game.dispatch({
      type: "discard",
      player: A,
      cards: [game.handOf(A)[0]],
    });
    expect(game.handOf(A)).toHaveLength(7);
    expect(game.state.awaiting).toBeNull();
  });

  it("rejects a discard of the wrong size", () => {
    const game = mkGame();
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    expect(() =>
      game.dispatch({ type: "discard", player: A, cards: [] }),
    ).toThrow(/exactly 1 card/);
  });

  const doubleBlock = (): {
    game: Game;
    giant: ObjectId;
    bear1: ObjectId;
    bear2: ObjectId;
  } => {
    const game = combatGame();
    const giant = spawn(game, "Hill Giant", A); // 3/3
    const bear1 = spawn(game, "Grizzly Bears", B); // 2/2
    const bear2 = spawn(game, "Grizzly Bears", B); // 2/2
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: giant, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: [
        { blocker: bear1, attacker: giant },
        { blocker: bear2, attacker: giant },
      ],
    });
    return { game, giant, bear1, bear2 };
  };

  it("asks the attacking player to order multiple blockers", () => {
    const { game, giant, bear1, bear2 } = doubleBlock();
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("order-blockers");
    expect(awaiting?.player).toBe(A);
    expect(awaiting?.kind === "order-blockers" && awaiting.attacker).toBe(giant);

    const legal = game.legalActions(A);
    expect(kinds(legal)).toEqual(["order-blockers"]);
    expect(legal[0].kind === "order-blockers" && legal[0].blockers).toEqual([
      bear1,
      bear2,
    ]);
    expect(game.legalActions(B)).toEqual([]);
  });

  it("assigns combat damage down the chosen blocker order", () => {
    const { game, giant, bear1, bear2 } = doubleBlock();
    game.dispatch({
      type: "order-blockers",
      player: A,
      attacker: giant,
      order: [bear2, bear1], // reverse of declaration order
    });
    expect(game.state.awaiting).toBeNull();

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.objects[bear2].zone).toBe("graveyard"); // took 2 first
    expect(game.state.objects[bear1].damageMarked).toBe(1); // took the last 1
    expect(game.state.objects[bear1].zone).toBe("battlefield");
  });

  it("rejects a blocker order that is not a permutation", () => {
    const { game, giant, bear1 } = doubleBlock();
    expect(() =>
      game.dispatch({
        type: "order-blockers",
        player: A,
        attacker: giant,
        order: [bear1],
      }),
    ).toThrow(/permutation/);
    expect(() =>
      game.dispatch({ type: "pass-priority", player: A }),
    ).toThrow(/declaration is pending/);
  });
});

describe("viewFor", () => {
  it("shows your own hand and only a count of the opponent's", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const view = game.viewFor(A);

    expect(view.zones.hands[A]).toHaveLength(game.handOf(A).length);
    expect(view.zones.hands[B]).toHaveLength(0);
    expect(view.players[B].handSize).toBe(game.handOf(B).length);
    for (const id of game.handOf(B)) {
      expect(view.objects[id]).toBeUndefined();
    }
  });

  it("never exposes library contents, only sizes", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const view = game.viewFor(A, { revealAll: true });
    expect(view.players[A].librarySize).toBe(game.libraryOf(A).length);
    for (const id of game.libraryOf(A)) {
      expect(view.objects[id]).toBeUndefined();
    }
  });

  it("revealAll exposes both hands", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const view = game.viewFor(A, { revealAll: true });
    expect(view.zones.hands[B]).toHaveLength(game.handOf(B).length);
  });

  it("bakes computed characteristics into battlefield objects", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    const bear = spawn(game, "Grizzly Bears", A);
    const forest = spawn(game, "Forest", A);
    spawn(game, "Glorious Anthem", A);

    const view = game.viewFor(A);
    expect(view.objects[bear].power).toBe(3);
    expect(view.objects[bear].toughness).toBe(3);
    expect(view.objects[forest].power).toBeNull();

    const angel = spawn(game, "Serra Angel", A);
    expect(game.viewFor(A).objects[angel].keywords).toEqual(
      expect.arrayContaining(["flying", "vigilance"]),
    );
  });
});

describe("random play", () => {
  it("random-vs-random games run to completion", () => {
    for (let seed = 1; seed <= 8; seed += 1) {
      const rng = createRng(seed * 7919);
      const pick = (): number => rng.next();
      const game = Game.create({
        seed,
        controllers: {
          [A]: new RandomController(A, pick),
          [B]: new RandomController(B, pick),
        },
        decks: [
          { player: A, cards: fuzzDeckA },
          { player: B, cards: fuzzDeckB },
        ],
      });
      game.advance();
      expect(game.isOver).toBe(true);
      expect(game.state.awaiting).toBeNull();
    }
  });

  it("a ScriptedController still drives combat through the new actions", () => {
    const attacker = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false },
      controllers: { [A]: attacker },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });
    const bear = spawn(game, "Grizzly Bears", A);
    attacker.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(18);
  });
});
