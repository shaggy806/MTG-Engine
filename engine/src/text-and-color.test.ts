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
    summoningSick: false,
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

const giveLands = (game: Game, p: PlayerId, n: number, name = "Island"): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, p);
};

const hand = (game: Game, p: PlayerId, name: string): ObjectId => {
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

describe("Turn to Frog (layers 4/5/6/7b)", () => {
  it("becomes a 0/1 blue Frog with no abilities", () => {
    const { game } = makeGame(["Turn to Frog"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 2);
    const hawk = spawn(game, "Vampire Nighthawk", B); // 2/3 B, flying deathtouch lifelink

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Turn to Frog"),
      targets: [{ kind: "object", object: hawk }],
    });
    game.advanceUntil(settled);

    const c = game.characteristics(hawk);
    expect(c.power).toBe(0);
    expect(c.toughness).toBe(1);
    expect(c.subtypes).toEqual(["Frog"]);
    expect([...c.colors]).toEqual(["U"]);
    expect(c.keywords.size).toBe(0);
  });

  it("a Frogged mana dork can't tap for mana", () => {
    const { game } = makeGame(["Turn to Frog"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 2);
    const elf = spawn(game, "Llanowar Elves", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Turn to Frog"),
      targets: [{ kind: "object", object: elf }],
    });
    game.advanceUntil(settled);

    const canActivate = game
      .legalActions(A)
      .some((x) => x.kind === "activate-ability" && x.source === elf);
    expect(canActivate).toBe(false);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: elf, abilityIndex: 0 }),
    ).toThrow(/lost its abilities/);
  });

  it("wears off at end of turn", () => {
    const { game } = makeGame(["Turn to Frog"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 2);
    const hawk = spawn(game, "Vampire Nighthawk", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Turn to Frog"),
      targets: [{ kind: "object", object: hawk }],
    });
    game.advanceUntil(settled);
    game.advanceUntil((s) => s.turn.number === 2);

    const c = game.characteristics(hawk);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(3);
    expect([...c.colors]).toEqual(["B"]);
    expect(c.keywords.has("flying")).toBe(true);
  });
});

describe("Doom Blade (layer 5 — colour-conditional target)", () => {
  it("can't target a black creature, but can once it's Frogged blue", () => {
    const { game } = makeGame(["Doom Blade", "Turn to Frog"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 3, "Island");
    giveLands(game, A, 3, "Swamp");
    const hawk = spawn(game, "Vampire Nighthawk", B);

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: hand(game, A, "Doom Blade"),
        targets: [{ kind: "object", object: hawk }],
      }),
    ).toThrow(/nonblack-creature target/i);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Turn to Frog"),
      targets: [{ kind: "object", object: hawk }],
    });
    game.advanceUntil(settled);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Doom Blade"),
      targets: [{ kind: "object", object: hawk }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[hawk].zone).toBe("graveyard");
  });

  it("can target a plain green creature", () => {
    const { game } = makeGame(["Doom Blade"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 2, "Swamp");
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Doom Blade"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[bear].zone).toBe("graveyard");
  });
});

describe("Artificial Evolution (layer 3 — text-change)", () => {
  it("rewrites a lord's creature-type word so it buffs a different tribe", () => {
    const { game, a } = makeGame(["Artificial Evolution"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 1);
    const chieftain = spawn(game, "Goblin Chieftain", A); // Goblins get +1/+1, haste
    const bear = spawn(game, "Grizzly Bears", A); // 2/2 Bear
    const rager = spawn(game, "Raging Goblin", A); // 1/1 Goblin, haste

    // Baseline: the Goblin is pumped, the Bear isn't.
    expect(game.characteristics(rager)).toMatchObject({ power: 2, toughness: 2 });
    expect(game.characteristics(bear)).toMatchObject({ power: 2, toughness: 2 });

    a.chooseTextFn = () => ["Goblin", "Bear"];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Artificial Evolution"),
      targets: [{ kind: "object", object: chieftain }],
    });
    game.advanceUntil(settled);

    // The word "Goblin" now reads "Bear" everywhere on the Chieftain.
    expect(game.characteristics(chieftain).subtypes).toEqual(["Bear"]);
    expect(game.characteristics(bear)).toMatchObject({ power: 3, toughness: 3 });
    expect(game.characteristics(bear).keywords.has("haste")).toBe(true);
    expect(game.characteristics(rager)).toMatchObject({ power: 1, toughness: 1 });
    expect(
      game.eventsOfType("text-changed").some((e) => e.from === "Goblin" && e.to === "Bear"),
    ).toBe(true);
  });

  it("does nothing to a creature with no matching creature type", () => {
    const { game, a } = makeGame(["Artificial Evolution"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 1);
    const wurm = spawn(game, "Craw Wurm", B); // subtype Wurm — not in the menu

    a.chooseTextFn = () => ["Goblin", "Bear"];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hand(game, A, "Artificial Evolution"),
      targets: [{ kind: "object", object: wurm }],
    });
    game.advanceUntil(settled);

    expect(game.eventsOfType("text-changed")).toHaveLength(0);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
  });
});
