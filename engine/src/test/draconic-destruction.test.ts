/**
 * The engine surface the Draconic Destruction precon needed:
 *
 * - `tap-all` — Thundermaw Hellkite's "Tap those creatures".
 * - `damage-all { exceptSource }` — Harbinger of the Hunt's "each **other**
 *   creature with flying".
 * - `EffectAmount` `{ countOf, times }` + a scaling `gain-life` — Shamanic
 *   Revelation's "4 life for each creature you control with power 4 or
 *   greater".
 * - The structured `{ kind: "permanent", filter }` target spec, and the
 *   `"player-or-planeswalker"` literal — both Clan Defiance.
 * - `StaticCondition` `self-kicked` — Verix Bladewing's ETB rider.
 * - `tapLand` — the enters-tapped / gain-1-life common land cycle.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import { printedCardName } from "../state.js";
import { legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

/**
 * Advance to A's first main phase with `n` untapped Mountains *and* `n`
 * untapped Forests out — this deck is Gruul, and several of these cards want
 * both colours.
 */
const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

/**
 * Run until the stack *and* the pending-trigger queue are both empty.
 *
 * `advanceUntil` checks its predicate before ticking, so a bare "stack is
 * empty" returns immediately while a just-detected ETB trigger is still
 * sitting in `pendingTriggers`.
 */
const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("Thundermaw Hellkite", () => {
  it("burns and taps only the opponents' fliers", () => {
    const game = makeGame();
    openWith(game, 0);
    const theirFlier = game.debugSpawn("Serra Angel", B, "battlefield");
    const theirGround = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const myFlier = game.debugSpawn("Serra Angel", A, "battlefield");
    for (const id of [theirFlier, theirGround, myFlier]) {
      game.state.objects[id].tapped = false;
    }

    game.debugSpawn("Thundermaw Hellkite", A, "battlefield", { announceEntry: true });
    settle(game);

    expect(game.state.objects[theirFlier].tapped).toBe(true);
    expect(game.state.objects[theirFlier].damageMarked).toBe(1);
    // A ground creature is neither damaged nor tapped...
    expect(game.state.objects[theirGround].tapped).toBe(false);
    // ...and neither is my own flier.
    expect(game.state.objects[myFlier].tapped).toBe(false);
    expect(game.state.objects[myFlier].damageMarked ?? 0).toBe(0);
  });
});

describe("Harbinger of the Hunt", () => {
  it("spares itself when sweeping the other fliers", () => {
    const game = makeGame();
    openWith(game, 5);
    const harbinger = game.debugSpawn("Harbinger of the Hunt", A, "battlefield");
    const otherFlier = game.debugSpawn("Serra Angel", B, "battlefield");
    const ground = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const legal = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability" && a.source === harbinger);
    // The green ability is the second of the two.
    const green = legal.find((a) => a.kind === "activate-ability" && a.abilityIndex === 1);
    expect(green).toBeDefined();
    if (green === undefined || green.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: green.source,
      abilityIndex: green.abilityIndex,
      targets: [],
    });
    settle(game);

    expect(game.state.objects[otherFlier].damageMarked).toBe(1);
    expect(game.state.objects[harbinger].damageMarked ?? 0).toBe(0);
    expect(game.state.objects[ground].damageMarked ?? 0).toBe(0);
  });

  it("hits every non-flier, itself excluded by having flying", () => {
    const game = makeGame();
    openWith(game, 5);
    const harbinger = game.debugSpawn("Harbinger of the Hunt", A, "battlefield");
    const ground = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: harbinger,
      abilityIndex: 0,
      targets: [],
    });
    settle(game);

    expect(game.state.objects[ground].damageMarked).toBe(1);
    expect(game.state.objects[harbinger].damageMarked ?? 0).toBe(0);
  });
});

describe("Shamanic Revelation", () => {
  it("draws one per creature and gains 4 per big one", () => {
    const game = makeGame();
    openWith(game, 5);
    // Two 4/4s and one 2/2: three cards, but only the 4/4s pay life.
    game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");

    const handBefore = game.state.zones.perPlayer[A].hand.length;
    const lifeBefore = game.state.players[A].life;
    const card = game.debugSpawn("Shamanic Revelation", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);

    // +3 drawn, −1 for the Revelation itself leaving the hand.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore + 3);
    expect(game.state.players[A].life).toBe(lifeBefore + 8);
  });

  it("gains nothing with no creature big enough", () => {
    const game = makeGame();
    openWith(game, 5);
    game.debugSpawn("Grizzly Bears", A, "battlefield");

    const lifeBefore = game.state.players[A].life;
    const card = game.debugSpawn("Shamanic Revelation", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);

    expect(game.state.players[A].life).toBe(lifeBefore);
  });
});

describe("Clan Defiance's target specs", () => {
  it("separates fliers from non-fliers", () => {
    const game = makeGame();
    openWith(game, 0);
    const flier = game.debugSpawn("Serra Angel", B, "battlefield");
    const ground = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const fliers = legalTargets(
      game.state,
      game.registry,
      { kind: "permanent", filter: { type: "creature", keyword: "flying" } },
      A,
    );
    expect(fliers.map((t) => t.kind === "object" && t.object)).toEqual([flier]);

    const grounded = legalTargets(
      game.state,
      game.registry,
      { kind: "permanent", filter: { type: "creature", notKeyword: "flying" } },
      A,
    );
    expect(grounded.map((t) => t.kind === "object" && t.object)).toEqual([ground]);
  });

  it("lets 'target player or planeswalker' reach you, unlike the opponent-only spec", () => {
    const game = makeGame();
    openWith(game, 0);

    const any = legalTargets(game.state, game.registry, "player-or-planeswalker", A);
    expect(any.filter((t) => t.kind === "player").length).toBe(2);

    const opponentsOnly = legalTargets(
      game.state,
      game.registry,
      "opponent-or-planeswalker",
      A,
    );
    expect(opponentsOnly.filter((t) => t.kind === "player").length).toBe(1);
  });

  it("deals X to each chosen mode", () => {
    const game = makeGame();
    openWith(game, 6);
    const ground = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const card = game.debugSpawn("Clan Defiance", A, "hand");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === card);
    expect(legal).toBeDefined();

    const lifeBefore = game.state.players[B].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      xValue: 2,
      modes: [1, 2],
      targets: [
        { kind: "object", object: ground },
        { kind: "player", player: B },
      ],
    });
    settle(game);

    expect(game.state.players[B].life).toBe(lifeBefore - 2);
    // 2 damage on a 2/2 is lethal, so it's already gone.
    expect(game.state.zones.shared.battlefield).not.toContain(ground);
  });
});

describe("Verix Bladewing", () => {
  it("makes Karox only when kicked", () => {
    const game = makeGame();
    openWith(game, 4);
    const card = game.debugSpawn("Verix Bladewing", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);

    expect(game.state.zones.shared.battlefield.some((id) => game.state.objects[id].isToken)).toBe(
      false,
    );
  });

  it("makes Karox when kicked", () => {
    const game = makeGame();
    openWith(game, 7);
    const card = game.debugSpawn("Verix Bladewing", A, "hand");

    const kicked = game
      .legalActions(A)
      .find((a) => a.kind === "cast-spell" && a.card === card && a.kicked === true);
    expect(kicked).toBeDefined();

    game.dispatch({ type: "cast-spell", player: A, card, targets: [], kicked: true });
    settle(game);

    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].isToken,
    );
    expect(token).toBeDefined();
    if (token === undefined) return;
    expect(game.characteristics(token).power).toBe(4);

    // A *named legendary* token, not the generic 5/5 Dragon.
    expect(printedCardName(game.state.objects[token])).toBe("Karox Bladewing");
    expect(game.registry.get("Karox Bladewing")?.supertypes).toContain("legendary");
  });
});

/** Answer the defender's blocker decision with "no blocks". */
const noBlocks = (game: Game) => {
  game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
  const awaiting = game.state.awaiting;
  if (awaiting?.kind === "blockers") {
    game.dispatch({ type: "declare-blockers", player: awaiting.player, blocks: [] });
  }
};

describe("Mordant Dragon", () => {
  it("aims 'that much damage' at a creature the damaged player controls", () => {
    const game = makeGame();
    openWith(game, 0);
    const dragon = game.debugSpawn("Mordant Dragon", A, "battlefield");
    game.state.objects[dragon].summoningSick = false;
    // A 4/4, so 5 damage is lethal but it survives long enough to be targeted.
    const victim = game.debugSpawn("Serra Angel", B, "battlefield");

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: dragon, defender: B }],
    });

    // B has a flier of their own, so the blocker decision has to be answered
    // before combat damage can happen at all.
    noBlocks(game);

    // The trigger targets on its way to the stack, then asks the "you may".
    game.advanceUntil(
      (s) =>
        s.awaiting?.kind === "choose-targets" ||
        s.awaiting?.kind === "choose-modes" ||
        s.result.over,
    );
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "object", object: victim }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
    }
    expect(game.state.awaiting?.kind).toBe("choose-modes");

    game.dispatch({ type: "choose-modes", player: A, modes: [0] });

    // "That much" is the 5 the Dragon just dealt bob — lethal for a 4/4, and
    // state-based actions bury it in the same breath. A `triggerValue` of 0
    // (the bug this guards) would have left the Angel untouched.
    expect(game.state.zones.shared.battlefield).not.toContain(victim);
  });

  it("does nothing when declined", () => {
    const game = makeGame();
    openWith(game, 0);
    const dragon = game.debugSpawn("Mordant Dragon", A, "battlefield");
    game.state.objects[dragon].summoningSick = false;
    const victim = game.debugSpawn("Serra Angel", B, "battlefield");

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: dragon, defender: B }],
    });
    noBlocks(game);
    game.advanceUntil(
      (s) =>
        s.awaiting?.kind === "choose-targets" ||
        s.awaiting?.kind === "choose-modes" ||
        s.result.over,
    );
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "object", object: victim }],
      });
      game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || s.result.over);
    }

    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    expect(game.state.objects[victim].damageMarked ?? 0).toBe(0);
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);
    expect(game.state.zones.shared.battlefield).toContain(victim);
  });
});

describe("the tap-land helpers", () => {
  it("enters tapped and pays a life for the gain-life half", () => {
    const game = makeGame();
    openWith(game, 0);
    const lifeBefore = game.state.players[A].life;

    const plain = game.debugSpawn("Timber Gorge", A, "battlefield");
    expect(game.state.objects[plain].tapped).toBe(true);
    // No trigger on the plain cycle.
    expect(game.state.players[A].life).toBe(lifeBefore);

    game.debugSpawn("Kazandu Refuge", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].life).toBe(lifeBefore + 1);
  });
});
