import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const reg = createDefaultRegistry();

const pad = (cards: readonly string[], land = "Plains"): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(land),
];

const makeGame = (aCards: readonly string[] = [], bCards: readonly string[] = [], land = "Plains") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards, land) },
      { player: B, cards: pad(bCards, land) },
    ],
  });
  return { game, a, b };
};

const spawn = (game: Game, cardName: string, controller: PlayerId, tapped = false): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false,
    loyaltyActivatedThisTurn: false,
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
  } as GameState["objects"][string];
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const atMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const hand = (g: Game, name: string): ObjectId[] =>
  g.handOf(A).filter((i) => g.state.objects[i].cardName === name);
const onBf = (g: Game, name: string): ObjectId | undefined =>
  g.state.zones.shared.battlefield.find((i) => g.state.objects[i].cardName === name);

describe("Phase 10 — can't be countered", () => {
  it("Counterspell resolves but fails to counter Carnage Tyrant", () => {
    const { game } = makeGame(["Carnage Tyrant"], ["Counterspell"]);
    for (let i = 0; i < 6; i += 1) spawn(game, "Forest", A);
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    game.advanceUntil(atMain);

    const tyrant = hand(game, "Carnage Tyrant")[0];
    game.dispatch({ type: "cast-spell", player: A, card: tyrant, targets: [] });
    game.dispatch({ type: "pass-priority", player: A });
    const cs = game.handOf(B).find((i) => game.state.objects[i].cardName === "Counterspell")!;
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: cs,
      targets: [{ kind: "object", object: tyrant }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[cs].zone).toBe("graveyard");
    expect(game.state.objects[tyrant].zone).toBe("battlefield");
    expect(game.state.eventLog.some((e) => e.type === "counter-failed")).toBe(true);
  });
});

describe("Phase 10 — energy ({E})", () => {
  it("Longtusk Cub gains energy on combat damage and spends it to grow", () => {
    const { game, a } = makeGame();
    const cub = spawn(game, "Longtusk Cub", A);
    a.declareAttackersFn = () => [{ attacker: cub, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    game.advanceUntil(settled);

    expect(game.state.players[A].energy).toBe(2);
    expect(game.state.players[B].life).toBe(18);

    game.dispatch({ type: "activate-ability", player: A, source: cub, abilityIndex: 0 });
    game.advanceUntil(settled);
    expect(game.state.players[A].energy).toBe(0);
    expect(game.state.objects[cub].counters["+1/+1"]).toBe(1);
    expect(computeCharacteristics(game.state, reg, cub).power).toBe(3);
  });

  it("the ability is illegal without enough energy", () => {
    const { game } = makeGame();
    const cub = spawn(game, "Longtusk Cub", A);
    game.advanceUntil(atMain);
    expect(
      game.canDispatch({ type: "activate-ability", player: A, source: cub, abilityIndex: 0 }),
    ).not.toBeNull();
  });
});

describe("Phase 10 — the Monarch", () => {
  it("an ETB makes you the monarch and you draw at your end step", () => {
    const { game } = makeGame(["Thorn of the Black Rose"], [], "Swamp");
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp", A);
    game.advanceUntil(atMain);

    const thorn = hand(game, "Thorn of the Black Rose")[0];
    game.dispatch({ type: "cast-spell", player: A, card: thorn, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.monarch).toBe(A);

    const before = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.handOf(A).length).toBe(before + 1);
  });

  it("a creature dealing combat damage to the monarch steals it", () => {
    const { game, b } = makeGame();
    game.state.monarch = A;
    const raider = spawn(game, "Grizzly Bears", B);
    b.declareAttackersFn = () => [{ attacker: raider, defender: A }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    game.advanceUntil(settled);
    expect(game.state.monarch).toBe(B);
  });
});

describe("Phase 10 — emblems", () => {
  it("Elspeth's ultimate leaves a permanent anthem for its caster", () => {
    const { game } = makeGame(["Elspeth, Sun's Champion"]);
    for (let i = 0; i < 6; i += 1) spawn(game, "Plains", A);
    const bears = spawn(game, "Grizzly Bears", A);
    game.advanceUntil(atMain);

    const elspeth = hand(game, "Elspeth, Sun's Champion")[0];
    game.dispatch({ type: "cast-spell", player: A, card: elspeth, targets: [] });
    game.advanceUntil(settled);

    // Skip the three +1 turns it would take to reach the ultimate — the
    // subject here is the emblem, not loyalty arithmetic.
    game.state.objects[elspeth].counters.loyalty = 7;
    const ultimate = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === elspeth && x.loyalty === -7);
    expect(ultimate).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: elspeth,
      abilityIndex: (ultimate as { abilityIndex: number }).abilityIndex,
      targets: [],
    });
    game.advanceUntil(settled);

    expect(game.state.emblems).toHaveLength(1);
    const c = computeCharacteristics(game.state, reg, bears);
    expect([c.power, c.toughness]).toEqual([4, 4]); // 2/2 + 2/+2
    expect(c.keywords.has("flying")).toBe(true);
  });
});

describe("Phase 10 — disturb", () => {
  it("the back face is cast from the graveyard transformed, and exiled if it leaves play", () => {
    const { game } = makeGame(["Baithook Angler", "Pyroclasm", "Pyroclasm"], [], "Island");
    for (let i = 0; i < 12; i += 1) spawn(game, "Island", A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain", A);
    game.advanceUntil(atMain);

    const squire = hand(game, "Baithook Angler")[0];
    game.dispatch({ type: "cast-spell", player: A, card: squire, targets: [] });
    game.advanceUntil(settled);
    game.dispatch({ type: "cast-spell", player: A, card: hand(game, "Pyroclasm")[0], targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[squire].zone).toBe("graveyard");

    // Disturb-cast the back face.
    const disturb = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && "card" in x && x.card === squire && x.via === "disturb");
    expect(disturb).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: squire, targets: [], via: "disturb", face: 1 });
    game.advanceUntil(settled);
    expect(game.state.objects[squire].zone).toBe("battlefield");
    expect(game.state.objects[squire].face).toBe(1);
    const c = computeCharacteristics(game.state, reg, squire);
    expect([c.power, c.toughness]).toEqual([1, 2]);
    expect(c.keywords.has("flying")).toBe(true);

    // A second wipe — it's exiled, not graveyarded (rule 702.150c).
    game.dispatch({ type: "cast-spell", player: A, card: hand(game, "Pyroclasm")[0], targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[squire].zone).toBe("exile");
  });
});

describe("Phase 10 — adventure", () => {
  it("casting the adventure exiles the card; the creature is castable from exile", () => {
    const { game, a } = makeGame(["Beanstalk Giant"], [], "Forest");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    for (let i = 0; i < 10; i += 1) spawn(game, "Forest", A);
    game.advanceUntil(atMain);

    const giant = hand(game, "Beanstalk Giant")[0];
    const faces = game
      .legalActions(A)
      .filter((x) => x.kind === "cast-spell" && "card" in x && x.card === giant)
      .map((x) => (x as { cardName: string }).cardName)
      .sort();
    expect(faces).toEqual(["Beanstalk Giant", "Fertile Footsteps"]);

    // Cast the adventure half (Fertile Footsteps — a basic-land tutor).
    const landsBefore = game.state.zones.shared.battlefield.length;
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], face: 1 });
    game.advanceUntil(settled);
    expect(game.state.zones.shared.battlefield.length).toBe(landsBefore + 1);
    expect(game.state.objects[giant].zone).toBe("exile");
    expect(game.state.objects[giant].onAdventure).toBe(true);

    // Cast the creature from exile.
    const advCast = game
      .legalActions(A)
      .find((x) => x.kind === "cast-spell" && "card" in x && x.card === giant && x.via === "adventure");
    expect(advCast).toBeDefined();
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [], via: "adventure", face: 0 });
    game.advanceUntil(settled);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].onAdventure).toBeFalsy();
    const c = computeCharacteristics(game.state, reg, giant);
    expect(c.types).toContain("creature");
    // */* — power and toughness each equal the lands its controller has.
    const lands = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].controller === A && computeCharacteristics(game.state, reg, id).types.includes("land"),
    ).length;
    expect([c.power, c.toughness]).toEqual([lands, lands]);
  });
});
