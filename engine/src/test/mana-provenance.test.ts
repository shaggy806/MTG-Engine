/**
 * Mana provenance — restricted spend, spend riders, and pool persistence
 * (rule 106.6b / 106.12 / 500.4).
 *
 * The three shapes share one mechanism: the mana pool is a list of tagged
 * units rather than a count per colour, so a unit remembers where it came
 * from. That matters in two places which fail independently, and both are
 * pinned here:
 *
 * - The **planner** must not tap a restricted source for something its mana
 *   can't pay for, or it produces the mana and is then refused it.
 * - The **spend** must choose the right units, restricted ones first. An
 *   unrestricted unit pays for anything, so spending it on a pip a restricted
 *   unit could have covered strands the restricted one and fails a payment
 *   that was affordable.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const mkGame = (
  aCards: readonly string[],
  bCards: readonly string[] = [],
  commander?: string,
): Game =>
  Game.create({
    seed: 5,
    shuffle: false,
    startingPlayer: A,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
    decks: [
      { player: A, cards: pad(aCards), ...(commander !== undefined ? { commander } : {}) },
      { player: B, cards: pad(bCards) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

/** Play `name` from A's hand, answering an "as this enters, choose a creature
 * type" prompt with `type` when one comes up. */
const land = (game: Game, name: string, type?: string): ObjectId => {
  const id = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "play-land", player: A, card: id });
  if (game.state.awaiting?.kind === "choose-creature-type") {
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: type ?? "Bear" });
  }
  game.advanceUntil(settled);
  return id;
};

const untapEverything = (game: Game): void => {
  for (const id of game.state.zones.shared.battlefield) game.state.objects[id].tapped = false;
};

const canCast = (game: Game, name: string): boolean =>
  game.canDispatch({ type: "cast-spell", player: A, card: handCard(game, name), targets: [] }) ===
  null;

const cast = (game: Game, name: string): ObjectId => {
  const id = handCard(game, name);
  game.dispatch({ type: "cast-spell", player: A, card: id, targets: [] });
  return id;
};

describe("restricted mana — the planner won't tap what it can't spend", () => {
  it("funds a matching creature spell and refuses a non-matching one", () => {
    // One Unclaimed Territory naming Bear, plus a Plains. Grizzly Bears is
    // {1}{G}: only the restricted ability can make the {G}, and it may.
    // Lightning Bolt is {R}: the same ability is the only red on the board
    // and it may not, because a Bolt is not a Bear.
    const game = mkGame(["Grizzly Bears", "Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    land(game, "Unclaimed Territory", "Bear");
    land(game, "Plains");

    expect(canCast(game, "Grizzly Bears")).toBe(true);
    expect(canCast(game, "Lightning Bolt")).toBe(false);
  });

  it("still offers its unrestricted colourless half", () => {
    // Naming Sliver makes the colour half useless, but "{T}: Add {C}" is a
    // separate, unrestricted ability — so the Territory can still pay a
    // generic pip. Dropping the whole permanent from the planner (rather
    // than the one option) is what this catches.
    const game = mkGame(["Ajani's Pridemate"]);
    game.advanceUntil(atFirstMain);
    land(game, "Unclaimed Territory", "Sliver");
    land(game, "Plains"); // the {W}
    expect(canCast(game, "Ajani's Pridemate")).toBe(true);
  });

  it("names nothing when the type choice was never answered", () => {
    // `debugSpawn` never raises the "as this enters" choice (AUTHORING §15),
    // so this Cavern has no chosen type — and its restricted mana must then
    // pay for nothing rather than for everything.
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    game.debugSpawn("Cavern of Souls", A);
    game.debugSpawn("Plains", A);
    expect(canCast(game, "Grizzly Bears")).toBe(false);
  });
});

describe("restricted mana — which units pay", () => {
  it("spends the restricted unit on the pip only it can cover", () => {
    // Territory (Bear) and a Forest, casting Grizzly Bears {1}{G}. Both can
    // make the {G}; only the Forest can pay the {1}. Spending the Forest's
    // green on the {G} strands the Territory and fails the cast.
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    land(game, "Unclaimed Territory", "Bear");
    land(game, "Forest");

    cast(game, "Grizzly Bears");
    game.advanceUntil(settled);

    const bears = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Grizzly Bears",
    );
    expect(bears).toBeDefined();
    // Nothing left floating — both units were spent.
    expect(poolCounts(game.state.players[A].manaPool)).toEqual({
      W: 0,
      U: 0,
      B: 0,
      R: 0,
      G: 0,
      C: 0,
    });
  });

  it("pays a generic cost around unusable restricted mana in the pool", () => {
    // Found by the fuzzer. With a restricted unit floating that this payment
    // can't touch, picking the generic pip's colour by "is there a unit of
    // this type" selects that unit's colour and then fails to take it —
    // underflowing on mana that was never available. The choice has to be
    // made over what is actually spendable.
    const game = mkGame([]);
    game.advanceUntil(atFirstMain);
    const territory = land(game, "Unclaimed Territory", "Bear");
    const rock = game.debugSpawn("Mind Stone", A);
    game.state.objects[rock].summoningSick = false;
    land(game, "Forest");

    // Float a restricted "any colour" unit (it lands as white).
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: territory,
      abilityIndex: 1,
      targets: [],
    });
    game.advanceUntil(settled);
    expect(game.state.players[A].manaPool).toHaveLength(1);

    // Mind Stone's "{1}, {T}: Draw a card" is an *ability*, which this
    // restricted mana may never pay for — so the {1} must come from the
    // Forest, and the restricted unit must simply be ignored.
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: rock,
        abilityIndex: 1,
        targets: [],
      }),
    ).not.toThrow();
  });

  it("keeps the restriction on mana left floating in the pool", () => {
    // The path a count-based pool loses: activate the ability by hand so the
    // mana sits in the pool, then try to spend it on the wrong thing.
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    const territory = land(game, "Unclaimed Territory", "Bear");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: territory,
      abilityIndex: 1, // the restricted "one mana of any color" ability
      targets: [],
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].manaPool).toHaveLength(1);
    expect(game.state.players[A].manaPool[0].restriction).toBeDefined();
    expect(canCast(game, "Lightning Bolt")).toBe(false);
  });

  it("keeps it when the colour is named by hand, too", () => {
    // A named colour (`manaColors`) goes through a different `addMana` than
    // the default one, which used to drop the ability's spec — and with it
    // the restriction — on the floor.
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(atFirstMain);
    const territory = land(game, "Unclaimed Territory", "Bear");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: territory,
      abilityIndex: 1,
      targets: [],
      manaColors: ["R"],
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].manaPool).toHaveLength(1);
    expect(game.state.players[A].manaPool[0].type).toBe("R");
    expect(game.state.players[A].manaPool[0].restriction).toBeDefined();
    expect(canCast(game, "Lightning Bolt")).toBe(false);
  });
});

describe("Cavern of Souls — the spell it paid for can't be countered", () => {
  it("marks the spell, and the mark ends with the stack", () => {
    // Plains, not Forest: the {G} can then only come from the Cavern's
    // *restricted* ability, which is the half that carries the clause. With
    // a Forest on board the engine may pay the generic from the Cavern's
    // plain "{T}: Add {C}" instead and grant nothing — correctly, and that
    // is the case below.
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    land(game, "Cavern of Souls", "Bear");
    land(game, "Plains");

    const bears = cast(game, "Grizzly Bears");
    expect(game.state.objects[bears].uncounterable).toBe(true);

    game.advanceUntil(settled);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    // It was about that casting, not about the permanent.
    expect(game.state.objects[bears].uncounterable).toBeUndefined();
  });

  it("survives a real counterspell", () => {
    const game = mkGame(["Grizzly Bears"], ["Counterspell"]);
    game.advanceUntil(atFirstMain);
    land(game, "Cavern of Souls", "Bear");
    land(game, "Plains");
    game.debugSpawn("Island", B);
    game.debugSpawn("Island", B);
    const counter = game.debugSpawn("Counterspell", B, "hand");

    const bears = cast(game, "Grizzly Bears");
    game.advanceUntil((s) => s.priority.holder === B || settled(s));
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: counter,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("grants nothing when only the Cavern's colourless half was used", () => {
    // Rule-correct and easy to get wrong: "{T}: Add {C}" is a *separate*
    // ability with no clause attached. Paying a colourless Cavern mana into
    // a spell protects nothing.
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(atFirstMain);
    const cavern = land(game, "Cavern of Souls", "Bear");
    land(game, "Forest");
    // Spend the colourless half explicitly, so the planner has no choice
    // about which Cavern ability paid.
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: cavern,
      abilityIndex: 0, // "{T}: Add {C}"
      targets: [],
    });
    game.advanceUntil(settled);

    const bears = cast(game, "Grizzly Bears");
    expect(game.state.objects[bears].uncounterable).toBeUndefined();
  });

  it("does not protect a spell the Cavern didn't pay for", () => {
    // Same board, but the Bears is paid for entirely by Forests — the
    // Cavern's mana never touches it, so it counters normally.
    const game = mkGame(["Grizzly Bears"], ["Counterspell"]);
    game.advanceUntil(atFirstMain);
    land(game, "Forest");
    land(game, "Forest");
    game.debugSpawn("Island", B);
    game.debugSpawn("Island", B);
    const counter = game.debugSpawn("Counterspell", B, "hand");

    const bears = cast(game, "Grizzly Bears");
    expect(game.state.objects[bears].uncounterable).toBeUndefined();
    game.advanceUntil((s) => s.priority.holder === B || settled(s));
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: counter,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});

describe("Path of Ancestry — a rider that fires when the mana is spent", () => {
  /** Anafenza is a Human Soldier; Ardent Recruit shares Soldier, Llanowar
   * Elves shares nothing. */
  const withPath = (spell: string): Game => {
    const game = mkGame([spell], [], "Anafenza, the Foremost");
    game.advanceUntil(atFirstMain);
    land(game, "Path of Ancestry");
    // It enters tapped, which is the printed card — untap it so the test is
    // about the rider rather than about waiting a turn.
    untapEverything(game);
    return game;
  };

  it("scries when the mana casts a creature sharing a type with the commander", () => {
    const game = withPath("Ardent Recruit");
    cast(game, "Ardent Recruit");
    // The rider is a triggered ability, so it goes on the stack above the
    // spell and resolves first (rule 603.2).
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    expect(game.state.awaiting?.kind).toBe("scry");
  });

  it("does not fire for a creature that shares no type", () => {
    const game = withPath("Llanowar Elves");
    cast(game, "Llanowar Elves");
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    expect(game.state.awaiting).toBeNull();
  });
});

describe("mana that survives the end of a step (rule 500.4)", () => {
  it("keeps a persistent unit and drops an ordinary one", () => {
    const game = mkGame([]);
    game.advanceUntil(atFirstMain);
    const pool = game.state.players[A].manaPool;
    pool.push({ type: "R" }, { type: "G", persists: true });

    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[A].manaPool).toEqual([{ type: "G", persists: true }]);
  });

  it("empties even persistent mana at cleanup", () => {
    const game = mkGame([]);
    game.advanceUntil(atFirstMain);
    game.state.players[A].manaPool.push({ type: "G", persists: true });

    game.advanceUntil((s) => s.turn.number > 1);
    expect(game.state.players[A].manaPool).toEqual([]);
  });
});
