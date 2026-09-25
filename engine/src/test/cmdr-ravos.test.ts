/**
 * Ravos, Soultender — its printed clauses through the real `Game`:
 *
 * - {3}{W}{B} legendary Human Cleric, 2/2, flying, white-black identity.
 * - "Other creatures you control get +1/+1." — *other*, and *you control*:
 *   Ravos itself stays a 2/2 and an opponent's creatures are untouched. The
 *   2020-11-10 ruling ("nonlethal damage may become lethal if Ravos leaves")
 *   is the anthem being a continuous effect rather than a counter, so the
 *   bonus is gone the moment Ravos is.
 * - "At the beginning of your upkeep, you may return target creature card
 *   from your graveyard to your hand." — *your* upkeep, *your* graveyard,
 *   *creature* cards only, and *may*. The card is a *target*, chosen as the
 *   trigger goes on the stack — so with no creature card there the ability
 *   never goes on the stack at all (rule 603.3d).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const RAVOS = "Ravos, Soultender";

const mkGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

const mainPhaseOf = (turn: number, player: PlayerId) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "precombat-main" && s.priority.holder === player;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const awaitingOf = (kind: string, player: PlayerId) => (s: GameState): boolean =>
  s.awaiting !== null && s.awaiting.kind === kind && s.awaiting.player === player;

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const bury = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "graveyard");
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, game.registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const graveyardOf = (game: Game, player: PlayerId): readonly ObjectId[] =>
  game.state.zones.perPlayer[player].graveyard;
const ravosTriggers = (game: Game, from: number): number =>
  game.state.eventLog
    .slice(from)
    .filter(
      (e) => e.type === "ability-triggered" && game.state.objects[e.source]?.cardName === RAVOS,
    ).length;

/**
 * Stand Ravos up on turn 1 and run to A's next upkeep (turn 3), stopping on
 * the "you may …" question the trigger raises.
 */
const toUpkeepQuestion = (
  game: Game,
  setUp: (game: Game) => void,
): { ravos: ObjectId; from: number } => {
  game.advanceUntil(mainPhaseOf(1, A));
  const ravos = spawn(game, RAVOS, A);
  setUp(game);
  const from = game.state.eventLog.length;
  game.advanceUntil((s) => awaitingOf("choose-modes", A)(s) || mainPhaseOf(3, A)(s));
  return { ravos, from };
};

describe("Ravos, Soultender — characteristics", () => {
  it("is a 2/2 legendary Human Cleric with flying, {3}{W}{B}, WB identity", () => {
    const def = createDefaultRegistry().get(RAVOS);
    expect(def.manaCost).toBe("{3}{W}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Human", "Cleric"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(def.keywords).toEqual(["flying"]);
    expect(identityString(colorIdentityOf(def))).toBe("WB");
    // Partner is read off the rules text by `validateCommanderDeck`.
    expect(def.text).toContain("Partner");
  });
});

describe("Ravos — other creatures you control get +1/+1", () => {
  it("pumps another creature you control", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RAVOS, A);
    const bears = spawn(game, "Grizzly Bears", A);

    expect(pt(game, bears)).toEqual([3, 3]);
  });

  it("does NOT pump Ravos itself — 'other'", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const ravos = spawn(game, RAVOS, A);

    expect(pt(game, ravos)).toEqual([2, 2]);
  });

  it("does NOT pump a creature an opponent controls — 'you control'", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RAVOS, A);
    const theirs = spawn(game, "Grizzly Bears", B);

    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("stacks with a second Ravos but never on itself", () => {
    // Two Ravoses can coexist under different controllers (the legend rule is
    // per-player), so A's creature gets one +1/+1 and B's gets the other.
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const mine = spawn(game, RAVOS, A);
    const theirs = spawn(game, RAVOS, B);
    game.advanceUntil(quiet);

    // Each is "another creature you control" from the *other* Ravos's point of
    // view only if they shared a controller; they don't, so both stay 2/2.
    expect(pt(game, mine)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("the bonus is a continuous effect — it goes when Ravos does", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const ravos = spawn(game, RAVOS, A);
    const bears = spawn(game, "Grizzly Bears", A);
    expect(pt(game, bears)).toEqual([3, 3]);

    // Ravos is black, so bounce rather than a nonblack-only removal spell —
    // all this needs is for Ravos to stop being on the battlefield.
    game.debugSpawn("Unsummon", A, "hand");
    const unsummon = game.handOf(A).find((i) => game.state.objects[i].cardName === "Unsummon");
    if (unsummon === undefined) throw new Error("no Unsummon in hand");
    spawn(game, "Island", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: unsummon,
      targets: [{ kind: "object", object: ravos }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[ravos].zone).toBe("hand");
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("Ravos — at the beginning of your upkeep", () => {
  it("returns a creature card from your graveyard to your hand when you say yes", () => {
    const game = mkGame();
    const { from } = toUpkeepQuestion(game, (g) => {
      bury(g, "Grizzly Bears", A);
    });

    expect(game.state.awaiting?.kind).toBe("choose-modes");
    expect(ravosTriggers(game, from)).toBe(1);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);

    const bears = game.handOf(A).find((i) => game.state.objects[i].cardName === "Grizzly Bears");
    expect(bears).toBeDefined();
    expect(graveyardOf(game, A)).toHaveLength(0);
  });

  it("leaves it in the graveyard when you say no — 'you may'", () => {
    const game = mkGame();
    toUpkeepQuestion(game, (g) => {
      bury(g, "Grizzly Bears", A);
    });

    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    game.advanceUntil(quiet);

    expect(graveyardOf(game, A)).toHaveLength(1);
    expect(game.handOf(A).some((i) => game.state.objects[i].cardName === "Grizzly Bears")).toBe(
      false,
    );
  });

  it("does NOT return a noncreature card — 'creature card'", () => {
    const game = mkGame();
    toUpkeepQuestion(game, (g) => {
      bury(g, "Lightning Bolt", A);
      bury(g, "Glorious Anthem", A);
    });

    // No creature card to target: nothing to ask, nothing returned.
    expect(game.state.awaiting).toBeNull();
    expect(graveyardOf(game, A)).toHaveLength(2);
    expect(game.handOf(A).some((i) => game.state.objects[i].cardName === "Lightning Bolt")).toBe(
      false,
    );
  });

  it("does NOT reach an opponent's graveyard — 'your graveyard'", () => {
    const game = mkGame();
    toUpkeepQuestion(game, (g) => {
      bury(g, "Craw Wurm", B);
    });

    // Nothing of A's is eligible, so the only card in play stays put whichever
    // way the question is answered.
    if (game.state.awaiting?.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    }
    game.advanceUntil(quiet);

    expect(graveyardOf(game, B)).toHaveLength(1);
    expect(game.handOf(A).some((i) => game.state.objects[i].cardName === "Craw Wurm")).toBe(false);
  });

  it("returns exactly one of several creature cards, the one you target", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RAVOS, A);
    bury(game, "Grizzly Bears", A);
    const wurm = bury(game, "Craw Wurm", A);
    game.advanceUntil(awaitingOf("choose-targets", A));
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "object", object: wurm }] });
    game.advanceUntil(awaitingOf("choose-modes", A));
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);

    expect(game.handOf(A).some((i) => game.state.objects[i].cardName === "Craw Wurm")).toBe(true);
    // Only one comes back — the Bears stays behind.
    expect(graveyardOf(game, A).map((i) => game.state.objects[i].cardName)).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("does NOT trigger on an opponent's upkeep — 'your upkeep'", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RAVOS, A);
    bury(game, "Grizzly Bears", A);
    const from = game.state.eventLog.length;

    // B's turn-2 upkeep comes and goes with nothing triggering…
    game.advanceUntil(mainPhaseOf(2, B));
    expect(ravosTriggers(game, from)).toBe(0);
    expect(graveyardOf(game, A)).toHaveLength(1);

    // …and then A's own turn-3 upkeep asks.
    game.advanceUntil(awaitingOf("choose-modes", A));
    expect(ravosTriggers(game, from)).toBe(1);
    expect(game.state.turn.number).toBe(3);
    expect(game.state.turn.step).toBe("upkeep");
  });

  it("does NOT trigger for an opponent's Ravos on your upkeep", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, RAVOS, B);
    bury(game, "Grizzly Bears", A);
    const from = game.state.eventLog.length;

    game.advanceUntil((s) => awaitingOf("choose-modes", A)(s) || mainPhaseOf(3, A)(s));

    // B's Ravos looks at B's upkeep, never A's, and A is never asked.
    expect(game.state.awaiting).toBeNull();
    expect(
      game.state.eventLog
        .slice(from)
        .some(
          (e) =>
            e.type === "ability-triggered" &&
            game.state.objects[e.source]?.cardName === RAVOS &&
            e.controller === A,
        ),
    ).toBe(false);
    expect(graveyardOf(game, A)).toHaveLength(1);
  });

  it("asks nothing with an empty graveyard — no target, no ability (rule 603.3d)", () => {
    const game = mkGame();
    toUpkeepQuestion(game, () => {
      /* nothing in any graveyard */
    });

    expect(graveyardOf(game, A)).toHaveLength(0);
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turn.number).toBe(3);
  });
});
