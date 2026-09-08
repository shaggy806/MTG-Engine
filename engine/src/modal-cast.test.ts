import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "./characteristics.js";
import { createDefaultRegistry } from "./cards.js";
import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const reg = createDefaultRegistry();

const pad = (cards: readonly string[], land: string): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(land),
];

const makeGame = (aCards: readonly string[], land: string) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards, land) },
      { player: B, cards: pad([], land) },
    ],
  });
  return { game, a, b };
};

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false,
    targets: null, attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    timestamp: 0, isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null, counters: {}, modifiers: [],
  } as GameState["objects"][string];
  game.state.zones.shared.battlefield.push(id);
  return id;
};

/** Spawn untapped basics for a full colour spread + generic. */
const mana = (game: Game): void => {
  for (const b of ["Plains", "Island", "Swamp", "Mountain", "Forest", "Forest"]) {
    spawn(game, b, A);
  }
};

const atMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const inHand = (g: Game, name: string): ObjectId =>
  g.handOf(A).find((i) => g.state.objects[i].cardName === name)!;

describe("ROADMAP Phase 11 EG-2 — targeted modal spells", () => {
  it("legalActions offers a castModal descriptor with per-mode target options", () => {
    const { game } = makeGame(["Sunder Charm"], "Plains");
    mana(game);
    const bear = spawn(game, "Grizzly Bears", B);
    void bear;
    game.advanceUntil(atMain);
    const la = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && "card" in x && x.card === inHand(game, "Sunder Charm"));
    expect(la).toBeDefined();
    const cm = (la as { castModal?: unknown }).castModal as
      | { minModes: number; maxModes: number; modes: { text: string; targetOptions: unknown[] }[] }
      | undefined;
    expect(cm).toBeDefined();
    expect(cm!.minModes).toBe(1);
    expect(cm!.maxModes).toBe(1);
    expect(cm!.modes).toHaveLength(3);
    expect(cm!.modes[0].targetOptions).toHaveLength(1); // "damage target creature"
    expect(cm!.modes[2].targetOptions).toHaveLength(0); // "draw a card"
  });

  it("choose the damage mode → 3 damage to the chosen creature", () => {
    const { game } = makeGame(["Sunder Charm"], "Plains");
    mana(game);
    const wurm = spawn(game, "Craw Wurm", B); // 6/4
    game.advanceUntil(atMain);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sunder Charm"),
      modes: [0],
      targets: [{ kind: "object", object: wurm }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[wurm].damageMarked).toBe(3);
    expect(game.state.eventLog.some((e) => e.type === "modes-chosen")).toBe(true);
  });

  it("choose the non-targeted draw mode → draw a card, no targets", () => {
    const { game } = makeGame(["Sunder Charm"], "Plains");
    mana(game);
    game.advanceUntil(atMain);
    const before = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sunder Charm"),
      modes: [2],
      targets: [],
    });
    game.advanceUntil(settled);
    expect(game.handOf(A).length).toBe(before - 1 /* the Charm */ + 1 /* the draw */);
  });

  it("too many modes is rejected", () => {
    const { game } = makeGame(["Sunder Charm"], "Plains");
    mana(game);
    const wurm = spawn(game, "Craw Wurm", B);
    game.advanceUntil(atMain);
    expect(
      game.canDispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Sunder Charm"),
        modes: [0, 2],
        targets: [{ kind: "object", object: wurm }],
      }),
    ).not.toBeNull();
  });

  it("choose two → both modes apply with their own target slice", () => {
    const { game } = makeGame(["Duskwood Verdict"], "Forest");
    mana(game);
    const mine = spawn(game, "Grizzly Bears", A); // 2/2
    game.advanceUntil(atMain);
    const life = game.state.players[A].life;
    // Mode 0 (+1/+1 counter on target creature) + mode 2 (gain 3 life).
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Duskwood Verdict"),
      modes: [0, 2],
      targets: [{ kind: "object", object: mine }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[mine].counters["+1/+1"]).toBe(1);
    expect(computeCharacteristics(game.state, reg, mine).power).toBe(3);
    expect(game.state.players[A].life).toBe(life + 3);
  });

  it("a mode whose target became illegal is skipped; the other still applies", () => {
    const { game } = makeGame(["Duskwood Verdict", "Lightning Bolt"], "Forest");
    mana(game);
    const doomed = spawn(game, "Grizzly Bears", B); // will be bolted in response
    const safe = spawn(game, "Craw Wurm", A);
    game.advanceUntil(atMain);
    // Cast Verdict: mode 0 (counter on `doomed`) + mode 1 (vigilance on `safe`).
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Duskwood Verdict"),
      modes: [0, 1],
      targets: [
        { kind: "object", object: doomed },
        { kind: "object", object: safe },
      ],
    });
    // Alice holds priority — bolt her own target off the stack's reach.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Lightning Bolt"),
      targets: [{ kind: "object", object: doomed }],
    });
    game.advanceUntil(settled);
    // `doomed` is gone; its mode was skipped. `safe` still got vigilance.
    expect(game.state.objects[doomed].zone).toBe("graveyard");
    expect(computeCharacteristics(game.state, reg, safe).keywords.has("vigilance")).toBe(true);
  });
});
