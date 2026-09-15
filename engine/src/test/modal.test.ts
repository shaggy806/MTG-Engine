import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const scriptedGame = (aCards: readonly string[]) => {
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
    timestamp: 0,
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

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

describe("a castModal spell cast from an alternative zone (Snapcaster-style flashback)", () => {
  it("still carries its castModal descriptor and resolves with cast-time modes", () => {
    const { game } = scriptedGame([]);
    game.advanceUntil(toPrecombat);
    for (const land of ["Plains", "Island", "Swamp"]) spawn(game, land, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const charm = game.debugSpawn("Simic Charm", A, "graveyard");
    game.state.objects[charm].grantedFlashback = { cost: "{W}{U}{B}", untilEndOfTurn: true };

    const flash = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && x.card === charm && x.via === "flashback");
    expect(flash).toBeDefined();
    // The bug this guards: the alt-zone cast-spell loops used to omit castModal.
    expect((flash as { castModal?: unknown }).castModal).toBeDefined();

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: charm,
      via: "flashback",
      modes: [1], // "Permanents you control gain hexproof until end of turn." — no targets
      targets: [],
    });
    game.advanceUntil(settled);

    expect(game.viewFor(A).objects[bears].keywords).toContain("hexproof");
    // A flashback spell is exiled, not put back in the graveyard.
    expect(game.state.zones.shared.exile).toContain(charm);
  });
});

describe("modal spells (rule 700.2) — Austere Command", () => {
  // Every mode is a targetless mass effect, so the modes are chosen as the
  // spell *resolves* (the `modal` EffectSpec), not as it is cast.
  const withSixMana = (): ReturnType<typeof scriptedGame> => {
    const made = scriptedGame(["Austere Command"]);
    made.game.advanceUntil(toPrecombat);
    for (let i = 0; i < 6; i += 1) spawn(made.game, "Plains", A);
    return made;
  };

  const cast = (game: Game): void => {
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Austere Command"),
    });
    game.advanceUntil((s) => s.awaiting !== null);
  };

  it("the game pauses on a choose-modes decision as the spell resolves", () => {
    const { game } = withSixMana();
    cast(game);

    expect(game.state.awaiting).toMatchObject({ kind: "choose-modes", player: A });
    const legal = game.legalActions(A);
    expect(legal).toHaveLength(1);
    expect(legal[0]).toMatchObject({
      kind: "choose-modes",
      minModes: 2,
      maxModes: 2,
      modeTexts: [
        "Destroy all artifacts.",
        "Destroy all enchantments.",
        "Destroy all creatures with mana value 3 or less.",
        "Destroy all creatures with mana value 4 or greater.",
      ],
    });
  });

  it("applies exactly the two chosen modes", () => {
    const { game } = withSixMana();
    const signet = spawn(game, "Arcane Signet", A);
    const anthem = spawn(game, "Glorious Anthem", A);
    const bears = spawn(game, "Grizzly Bears", A); // MV 2
    const wurm = spawn(game, "Craw Wurm", A); // MV 6
    cast(game);

    game.dispatch({ type: "choose-modes", player: A, modes: [0, 2] });
    game.advanceUntil(settled);

    expect(game.state.objects[signet].zone).toBe("graveyard");
    expect(game.state.objects[bears].zone).toBe("graveyard");
    // The two unchosen modes did nothing.
    expect(game.state.objects[anthem].zone).toBe("battlefield");
    expect(game.state.objects[wurm].zone).toBe("battlefield");
  });

  it("splits creatures by mana value across the two creature modes", () => {
    const { game } = withSixMana();
    const bears = spawn(game, "Grizzly Bears", A); // MV 2
    const wurm = spawn(game, "Craw Wurm", A); // MV 6
    cast(game);

    game.dispatch({ type: "choose-modes", player: A, modes: [2, 3] });
    game.advanceUntil(settled);

    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });

  it("rejects any mode count other than exactly two", () => {
    const { game } = withSixMana();
    cast(game);

    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [0] })).not.toBeNull();
    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [] })).not.toBeNull();
    expect(
      game.canDispatch({ type: "choose-modes", player: A, modes: [0, 1, 2] }),
    ).not.toBeNull();
    expect(game.canDispatch({ type: "choose-modes", player: A, modes: [0, 1] })).toBeNull();
  });

  it("a ScriptedController answers via chooseModesFn", () => {
    const { game, a } = withSixMana();
    a.chooseModesFn = () => [1, 3];
    const anthem = spawn(game, "Glorious Anthem", A);
    const wurm = spawn(game, "Craw Wurm", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Austere Command"),
    });
    game.advanceUntil(settled);

    expect(game.state.objects[anthem].zone).toBe("graveyard");
    expect(game.state.objects[wurm].zone).toBe("graveyard");
  });
});
