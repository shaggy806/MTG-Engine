/**
 * A batch of utility and fixing lands, each driven through a real `Game`.
 *
 * - Prismatic Vista: pay 1 life, sacrifice, fetch a *basic* land untapped.
 * - Inventors' Fair: a metalcraft upkeep life trigger (an intervening-if,
 *   rechecked on resolution) and a metalcraft-gated, revealing artifact tutor.
 * - Spire of Industry: a life-costing, artifact-gated "any color" mana ability
 *   the auto-payer uses — and only when the painless {C} won't do.
 * - High Market: sacrifice a creature (what is a creature *now*) for 1 life.
 * - Strip Mine: sacrifice to destroy target land, and only a land.
 * - Urza's Cave: {3} to fetch any land card, tapped.
 * - Vault of the Archangel: deathtouch and lifelink for your creatures as the
 *   ability resolves, not for later arrivals and not past the turn.
 * - Bonders' Enclave: draw, gated on controlling a creature with power 4+.
 * - Blazemire Verge and the four Tainted lands: coloured mana gated on
 *   controlling a land type — a typed dual counts, an opponent's land doesn't.
 * - Hedge Maze / Undercity Sewers: typed duals that enter tapped and surveil 1.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { parseManaCost } from "../mana.js";
import type { ManaCost } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = [], aFill = "Island") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill(aFill)] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const life = (game: Game, p: PlayerId = A): number => game.state.players[p].life;
const nameOf = (game: Game, id: ObjectId): string => game.state.objects[id].cardName;
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const inHand = (game: Game, name: string, p: PlayerId = A): ObjectId => {
  const id = game.handOf(p).find((c) => nameOf(game, c) === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

/** Whether `player` could pay `cost` right now from its mana sources — the
 * planner the engine itself asks (white-box, as in `dual-lands.test.ts`). */
const canPay = (game: Game, cost: string, player: PlayerId = A): boolean =>
  (game as unknown as { payMana: (p: PlayerId, c: ManaCost) => unknown }).payMana(
    player,
    parseManaCost(cost),
  ) !== null;

const offered = (game: Game, source: ObjectId, abilityIndex: number) =>
  game
    .legalActions(A)
    .filter(
      (a) => a.kind === "activate-ability" && a.source === source && a.abilityIndex === abilityIndex,
    );
const castable = (game: Game, name: string): boolean =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && nameOf(game, a.card) === name);
const activate = (
  game: Game,
  source: ObjectId,
  abilityIndex: number,
  extra: { targets?: { kind: "object"; object: ObjectId }[]; sacrifice?: ObjectId } = {},
): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, ...extra });
  game.advanceUntil(quiet);
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn(name, player));

describe("Prismatic Vista", () => {
  it("pays 1 life and sacrifices itself to put a basic land onto the battlefield untapped", () => {
    const { game, a } = setUp();
    const vista = game.debugSpawn("Prismatic Vista", A);
    const wood = game.debugSpawn("Tainted Wood", A, "library");
    const maze = game.debugSpawn("Hedge Maze", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, ids) => {
      eligible = ids;
      return ids.slice(0, 1);
    };

    activate(game, vista, 0);

    expect(life(game)).toBe(19);
    expect(zoneOf(game, vista)).toBe("graveyard");
    // Only basics: the two nonbasic lands on top are never offered.
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible).not.toContain(wood);
    expect(eligible).not.toContain(maze);
    expect(eligible.every((id) => nameOf(game, id) === "Island")).toBe(true);
    const fetched = eligible[0];
    expect(zoneOf(game, fetched)).toBe("battlefield");
    expect(game.state.objects[fetched].tapped).toBe(false);
  });
});

describe("Inventors' Fair", () => {
  const board = (artifacts: number) => {
    const setup = setUp();
    const fair = setup.game.debugSpawn("Inventors' Fair", A);
    const arts = Array.from({ length: artifacts }, () => setup.game.debugSpawn("Bonesplitter", A));
    return { ...setup, fair, arts };
  };
  const toTurn = (game: Game, turn: number) =>
    game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "draw");

  it("gains 1 life at your upkeep while you control three or more artifacts, not at an opponent's", () => {
    const { game } = board(3);
    toTurn(game, 2); // Bob's upkeep
    expect(life(game)).toBe(20);
    toTurn(game, 3); // Alice's upkeep
    expect(life(game)).toBe(21);
  });

  it("doesn't trigger with only two artifacts", () => {
    const { game } = board(2);
    toTurn(game, 3);
    expect(life(game)).toBe(20);
  });

  it("rechecks the artifact count on resolution (rule 603.4)", () => {
    const { game, arts } = board(3);
    game.advanceUntil(
      (s) => s.turn.number === 3 && s.turn.step === "upkeep" && s.zones.shared.stack.length === 1,
    );
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: arts[0] }]);
    toTurn(game, 3);
    expect(life(game)).toBe(20);
  });

  it("taps for {C}", () => {
    const { game } = board(0);
    expect(canPay(game, "{1}")).toBe(true);
    expect(canPay(game, "{G}")).toBe(false);
  });

  it("with three artifacts, tutors an artifact card to hand and reveals it", () => {
    const { game, a, fair } = board(3);
    const forests = lands(game, "Forest", 4);
    game.debugSpawn("Grizzly Bears", A, "library");
    const ring = game.debugSpawn("Sol Ring", A, "library");
    game.debugSpawn("Tainted Wood", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, ids) => {
      eligible = ids;
      return ids.slice(0, 1);
    };

    expect(offered(game, fair, 1)).toHaveLength(1);
    activate(game, fair, 1);

    expect(eligible).toEqual([ring]);
    expect(game.handOf(A)).toContain(ring);
    expect(zoneOf(game, fair)).toBe("graveyard");
    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
    const revealed = game.eventsOfType("cards-revealed");
    expect(revealed.some((e) => e.player === A && e.objects.includes(ring))).toBe(true);
  });

  it("can't be activated with only two artifacts", () => {
    const { game, fair } = board(2);
    lands(game, "Forest", 4);
    game.debugSpawn("Sol Ring", A, "library");
    expect(offered(game, fair, 1)).toHaveLength(0);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: fair, abilityIndex: 1 }),
    ).toThrow();
  });
});

describe("Spire of Industry", () => {
  it("makes coloured mana only while you control an artifact, and it costs 1 life", () => {
    const { game } = setUp(["Raging Goblin"]);
    const spire = game.debugSpawn("Spire of Industry", A);
    expect(canPay(game, "{1}")).toBe(true);
    expect(canPay(game, "{R}")).toBe(false);
    expect(castable(game, "Raging Goblin")).toBe(false);
    expect(offered(game, spire, 1)).toHaveLength(0);

    game.debugSpawn("Bonesplitter", A);
    expect(castable(game, "Raging Goblin")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Raging Goblin") });
    game.advanceUntil(quiet);
    expect(life(game)).toBe(19);
    expect(game.state.objects[spire].tapped).toBe(true);
  });

  it("an opponent's artifact doesn't turn it on", () => {
    const { game } = setUp();
    game.debugSpawn("Spire of Industry", A);
    game.debugSpawn("Bonesplitter", B);
    expect(canPay(game, "{R}")).toBe(false);
  });

  it("pays a generic cost with the painless {C}", () => {
    const { game } = setUp(["Bonesplitter"]);
    game.debugSpawn("Spire of Industry", A);
    game.debugSpawn("Bonesplitter", A);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bonesplitter") });
    game.advanceUntil(quiet);
    expect(life(game)).toBe(20);
  });

  it("activated by hand, it offers every colour and charges the life", () => {
    const { game } = setUp();
    const spire = game.debugSpawn("Spire of Industry", A);
    game.debugSpawn("Bonesplitter", A);
    const variants = offered(game, spire, 1);
    expect(variants.flatMap((v) => (v.kind === "activate-ability" ? (v.manaColors ?? []) : [])).sort()).toEqual(
      ["B", "G", "R", "U", "W"],
    );
    game.dispatch({ type: "activate-ability", player: A, source: spire, abilityIndex: 1, manaColors: ["G"] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G"]);
    expect(life(game)).toBe(19);
  });
});

describe("High Market", () => {
  it("sacrifices a creature you control to gain 1 life", () => {
    const { game } = setUp();
    const market = game.debugSpawn("High Market", A);
    const bears = game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Bonesplitter", A);
    game.debugSpawn("Grizzly Bears", B);

    const [offer] = offered(game, market, 1);
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : null).toEqual([bears]);
    activate(game, market, 1, { sacrifice: bears });
    expect(life(game)).toBe(21);
    expect(zoneOf(game, bears)).toBe("graveyard");
  });

  it("isn't offered without a creature, and a non-creature can't pay the cost", () => {
    const { game } = setUp();
    const market = game.debugSpawn("High Market", A);
    const blade = game.debugSpawn("Bonesplitter", A);
    game.debugSpawn("Grizzly Bears", B);
    expect(offered(game, market, 1)).toHaveLength(0);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: market, abilityIndex: 1, sacrifice: blade }),
    ).toThrow();
  });

  it("counts a land that is a creature right now", () => {
    const { game } = setUp();
    const market = game.debugSpawn("High Market", A);
    const forest = game.debugSpawn("Forest", A);
    game.debugApplyEffect(
      A,
      {
        kind: "animate",
        target: 0,
        power: 2,
        toughness: 2,
        addTypes: ["creature"],
        addSubtypes: [],
        duration: "end-of-turn",
      },
      [{ kind: "object", object: forest }],
    );
    const [offer] = offered(game, market, 1);
    expect(offer?.kind === "activate-ability" ? offer.sacrifice?.choices : null).toEqual([forest]);
  });
});

describe("Strip Mine", () => {
  it("sacrifices itself to destroy target land", () => {
    const { game } = setUp();
    const mine = game.debugSpawn("Strip Mine", A);
    const forest = game.debugSpawn("Forest", B);
    const bears = game.debugSpawn("Grizzly Bears", B);

    const [offer] = offered(game, mine, 1);
    const options = offer?.kind === "activate-ability" ? offer.targetOptions[0] : [];
    expect(options).toContainEqual({ kind: "object", object: forest });
    expect(options).not.toContainEqual({ kind: "object", object: bears });

    activate(game, mine, 1, { targets: [{ kind: "object", object: forest }] });
    expect(zoneOf(game, forest)).toBe("graveyard");
    expect(zoneOf(game, mine)).toBe("graveyard");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });

  it("can't target a nonland permanent", () => {
    const { game } = setUp();
    const mine = game.debugSpawn("Strip Mine", A);
    const bears = game.debugSpawn("Grizzly Bears", B);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: mine,
        abilityIndex: 1,
        targets: [{ kind: "object", object: bears }],
      }),
    ).toThrow();
    expect(zoneOf(game, mine)).toBe("battlefield");
  });

  it("taps for {C}", () => {
    const { game } = setUp();
    game.debugSpawn("Strip Mine", A);
    expect(canPay(game, "{1}")).toBe(true);
    expect(canPay(game, "{U}")).toBe(false);
  });
});

describe("Urza's Cave", () => {
  it("pays {3} and sacrifices itself to put any land card onto the battlefield tapped", () => {
    const { game, a } = setUp();
    const cave = game.debugSpawn("Urza's Cave", A);
    lands(game, "Forest", 3);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const wood = game.debugSpawn("Tainted Wood", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, ids) => {
      eligible = ids;
      return ids.filter((id) => id === wood);
    };

    activate(game, cave, 1);

    expect(eligible).toContain(wood); // a nonbasic land is fine
    expect(eligible).not.toContain(bears); // a nonland card isn't
    expect(zoneOf(game, cave)).toBe("graveyard");
    expect(zoneOf(game, wood)).toBe("battlefield");
    expect(game.state.objects[wood].tapped).toBe(true);
  });

  it("isn't offered without {3} from other sources", () => {
    const { game } = setUp();
    const cave = game.debugSpawn("Urza's Cave", A);
    lands(game, "Forest", 2);
    expect(offered(game, cave, 1)).toHaveLength(0);
  });

  it("is an Urza's Cave", () => {
    expect(registry.get("Urza's Cave").subtypes).toEqual(["Urza's", "Cave"]);
  });
});

describe("Vault of the Archangel", () => {
  it("gives the creatures you control deathtouch and lifelink until end of turn", () => {
    const { game } = setUp();
    const vault = game.debugSpawn("Vault of the Archangel", A);
    game.debugSpawn("Plains", A);
    game.debugSpawn("Swamp", A);
    lands(game, "Forest", 2);
    const mine = game.debugSpawn("Grizzly Bears", A);
    const theirs = game.debugSpawn("Grizzly Bears", B);

    activate(game, vault, 1);
    const kw = (id: ObjectId) => game.characteristics(id).keywords;
    expect(kw(mine).has("deathtouch")).toBe(true);
    expect(kw(mine).has("lifelink")).toBe(true);
    expect(kw(theirs).has("deathtouch")).toBe(false);
    expect(kw(theirs).has("lifelink")).toBe(false);

    // A creature arriving after it resolved isn't covered.
    const late = game.debugSpawn("Hill Giant", A);
    expect(kw(late).has("deathtouch")).toBe(false);
    expect(kw(late).has("lifelink")).toBe(false);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(kw(mine).has("deathtouch")).toBe(false);
    expect(kw(mine).has("lifelink")).toBe(false);
  });

  it("needs {W} and {B} to activate", () => {
    const { game } = setUp();
    const vault = game.debugSpawn("Vault of the Archangel", A);
    game.debugSpawn("Swamp", A);
    lands(game, "Forest", 3);
    game.debugSpawn("Grizzly Bears", A);
    expect(offered(game, vault, 1)).toHaveLength(0);
  });
});

describe("Bonders' Enclave", () => {
  it("draws a card while you control a creature with power 4 or greater", () => {
    const { game } = setUp();
    const enclave = game.debugSpawn("Bonders' Enclave", A);
    lands(game, "Forest", 3);
    game.debugSpawn("Rumbling Baloth", A);
    const hand = game.handOf(A).length;

    expect(offered(game, enclave, 1)).toHaveLength(1);
    activate(game, enclave, 1);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(game.state.objects[enclave].tapped).toBe(true);
  });

  it("isn't offered for a 3-power creature or an opponent's 4-power one; counters count", () => {
    const { game } = setUp();
    const enclave = game.debugSpawn("Bonders' Enclave", A);
    lands(game, "Forest", 3);
    const giant = game.debugSpawn("Hill Giant", A);
    game.debugSpawn("Rumbling Baloth", B);
    expect(offered(game, enclave, 1)).toHaveLength(0);

    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
      { kind: "object", object: giant },
    ]);
    game.advanceUntil(quiet);
    expect(offered(game, enclave, 1)).toHaveLength(1);
  });
});

describe("Blazemire Verge", () => {
  it("always taps for {B}; for {R} only while you control a Swamp or a Mountain", () => {
    const { game } = setUp();
    game.debugSpawn("Blazemire Verge", A);
    expect(canPay(game, "{B}")).toBe(true);
    expect(canPay(game, "{R}")).toBe(false);

    game.debugSpawn("Mountain", B); // an opponent's doesn't count
    expect(canPay(game, "{R}")).toBe(false);

    game.debugSpawn("Hedge Maze", A); // enters tapped; Forest Island
    expect(canPay(game, "{R}")).toBe(false);

    game.debugSpawn("Undercity Sewers", A); // enters tapped; Island Swamp
    expect(canPay(game, "{R}")).toBe(true);
    expect(canPay(game, "{B}{R}")).toBe(false); // still one tap
  });

  it("a Mountain turns on the red half too", () => {
    const { game } = setUp();
    const verge = game.debugSpawn("Blazemire Verge", A);
    game.debugSpawn("Mountain", A, "battlefield", { tapped: true });
    expect(canPay(game, "{R}")).toBe(true);
    expect(offered(game, verge, 1)).toHaveLength(1);
  });
});

describe("the Tainted lands", () => {
  const CASES = [
    { name: "Tainted Wood", colours: ["B", "G"], other: "W" },
    { name: "Tainted Field", colours: ["W", "B"], other: "G" },
    { name: "Tainted Peak", colours: ["B", "R"], other: "U" },
    { name: "Tainted Isle", colours: ["U", "B"], other: "R" },
  ] as const;

  for (const { name, colours, other } of CASES) {
    it(`${name}: {C} always, {${colours[0]}} or {${colours[1]}} only while you control a Swamp`, () => {
      const { game } = setUp();
      const land = game.debugSpawn(name, A);
      expect(canPay(game, "{1}")).toBe(true);
      for (const c of colours) expect(canPay(game, `{${c}}`)).toBe(false);
      expect(offered(game, land, 1)).toHaveLength(0);
      expect(offered(game, land, 2)).toHaveLength(0);

      game.debugSpawn("Swamp", B); // an opponent's Swamp doesn't count
      for (const c of colours) expect(canPay(game, `{${c}}`)).toBe(false);

      game.debugSpawn("Swamp", A, "battlefield", { tapped: true });
      for (const c of colours) expect(canPay(game, `{${c}}`)).toBe(true);
      expect(canPay(game, `{${other}}`)).toBe(false);
      expect(canPay(game, `{${colours[0]}}{${colours[1]}}`)).toBe(false); // one tap
      expect(offered(game, land, 1)).toHaveLength(1);
      expect(offered(game, land, 2)).toHaveLength(1);
    });
  }

  it("a typed dual with the Swamp type turns one on", () => {
    const { game } = setUp();
    game.debugSpawn("Tainted Isle", A);
    game.debugSpawn("Hedge Maze", A); // Forest Island — no
    expect(canPay(game, "{U}")).toBe(false);
    game.debugSpawn("Undercity Sewers", A); // Island Swamp — yes
    expect(canPay(game, "{U}")).toBe(true);
  });
});

describe("Hedge Maze and Undercity Sewers", () => {
  const DUALS = [
    { name: "Hedge Maze", types: ["Forest", "Island"], colours: ["G", "U"], other: "R" },
    { name: "Undercity Sewers", types: ["Island", "Swamp"], colours: ["U", "B"], other: "G" },
  ] as const;

  for (const { name, types, colours, other } of DUALS) {
    it(`${name} enters tapped and surveils 1 — the top card may go to the graveyard`, () => {
      const { game, a } = setUp();
      const land = game.debugSpawn(name, A, "hand");
      const top = game.debugSpawn("Grizzly Bears", A, "library");
      let mode: string | null = null;
      a.chooseScryFn = (_v, cards, m) => {
        mode = m;
        return cards;
      };
      game.dispatch({ type: "play-land", player: A, card: land });
      game.advanceUntil(quiet);
      expect(zoneOf(game, land)).toBe("battlefield");
      expect(game.state.objects[land].tapped).toBe(true);
      expect(mode).toBe("surveil");
      expect(zoneOf(game, top)).toBe("graveyard");
    });

    it(`${name}: keeping the card leaves it on top`, () => {
      const { game } = setUp();
      const land = game.debugSpawn(name, A, "hand");
      const top = game.debugSpawn("Grizzly Bears", A, "library");
      game.dispatch({ type: "play-land", player: A, card: land });
      game.advanceUntil(quiet);
      expect(game.libraryOf(A)[0]).toBe(top);
    });

    it(`${name} is a ${types.join(" ")} and taps for {${colours[0]}} or {${colours[1]}} only`, () => {
      const { game } = setUp();
      const land = game.debugSpawn(name, A);
      expect(game.state.objects[land].tapped).toBe(true);
      expect(canPay(game, `{${colours[0]}}`)).toBe(false); // tapped
      game.state.objects[land].tapped = false;
      expect(game.characteristics(land).subtypes).toEqual([...types]);
      for (const c of colours) expect(canPay(game, `{${c}}`)).toBe(true);
      expect(canPay(game, `{${other}}`)).toBe(false);
    });
  }
});
