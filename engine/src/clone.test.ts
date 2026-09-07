import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const makeGame = (aCards: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false, loyaltyActivatedThisTurn: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: game.state.timestampSeq,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const giveLands = (game: Game, p: PlayerId, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, "Island", p);
};

const handCard = (game: Game, p: PlayerId, name: string): ObjectId => {
  const id = game.state.zones.perPlayer[p].hand.find(
    (x) => game.state.objects[x].cardName === name,
  );
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const atFirstMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const castClone = (game: Game): void => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: handCard(game, A, "Clone"),
  });
};

describe("Clone (layer 1 — copy)", () => {
  it("becomes a copy of the chosen creature — P/T, subtype, keywords", () => {
    const { game, a } = makeGame(["Clone"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 4);
    const angel = spawn(game, "Serra Angel", B); // 4/4 flying vigilance
    a.chooseCopyFn = () => angel;

    castClone(game);
    game.advanceUntil(settled);

    const clone = game.battlefield.find(
      (id) => game.state.objects[id].copyOf === "Serra Angel",
    )!;
    const c = game.characteristics(clone);
    expect(c.power).toBe(4);
    expect(c.toughness).toBe(4);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.subtypes).toContain("Angel");
    const view = game.viewFor(A).objects[clone];
    expect(view.cardName).toBe("Clone");
    expect(view.copyOf).toBe("Serra Angel");
    expect(view.power).toBe(4);
  });

  it("gains the copied creature's activated ability", () => {
    const { game, a } = makeGame(["Clone"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 4);
    const elf = spawn(game, "Llanowar Elves", A);
    void elf;
    a.chooseCopyFn = (_v, _s, options) =>
      options.find((id) => game.state.objects[id].cardName === "Llanowar Elves") ?? null;

    castClone(game);
    game.advanceUntil(settled);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const clone = game.battlefield.find(
      (id) => game.state.objects[id].copyOf === "Llanowar Elves",
    )!;

    const ability = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === clone);
    expect(ability?.kind).toBe("activate-ability");
    game.dispatch({ type: "activate-ability", player: A, source: clone, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.G).toBe(1);
  });

  it("copying nothing leaves it a 0/0 that dies to a state-based action", () => {
    const { game, a } = makeGame(["Clone"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 4);
    spawn(game, "Grizzly Bears", B);
    a.chooseCopyFn = () => null;

    castClone(game);
    game.advanceUntil(settled);

    expect(
      game.eventsOfType("permanent-destroyed").some((e) => e.reason.includes("toughness")),
    ).toBe(true);
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === "Clone")).toBe(false);
  });

  it("with no creatures to copy, it never pauses and just dies", () => {
    const { game } = makeGame(["Clone"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 4);

    castClone(game);
    game.advanceUntil(settled);
    // Never set an awaiting decision.
    expect(game.eventsOfType("permanent-copied")).toHaveLength(0);
    expect(
      game.eventsOfType("permanent-destroyed").some((e) => e.object !== undefined),
    ).toBe(true);
  });

  it("a Clone of a Clone copies the underlying creature", () => {
    const { game, a } = makeGame(["Clone", "Clone"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 8);
    const bear = spawn(game, "Grizzly Bears", B);

    a.chooseCopyFn = () => bear;
    castClone(game);
    game.advanceUntil(settled);
    const firstClone = game.battlefield.find(
      (id) => game.state.objects[id].copyOf === "Grizzly Bears",
    )!;

    a.chooseCopyFn = () => firstClone;
    castClone(game);
    game.advanceUntil(settled);

    const clones = game.battlefield.filter(
      (id) => game.state.objects[id].copyOf === "Grizzly Bears",
    );
    expect(clones).toHaveLength(2);
  });
});
