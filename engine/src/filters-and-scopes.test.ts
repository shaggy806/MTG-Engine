import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "./cards.js";
import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { matchesFilter } from "./filter.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const TEST_COMMANDER = defineCard({
  name: "Edict Test Commander",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
});
const registry = createDefaultRegistry().register(TEST_COMMANDER);

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  isCommander = false,
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = (aCards: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const cast = (game: Game, name: string): void => {
  game.dispatch({ type: "cast-spell", player: A, card: named(game, game.handOf(A), name) });
};
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id]?.zone ?? "gone";

describe("CardFilter — matchesFilter", () => {
  it("matches on computed type / colour / power / controller", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const bears = spawn(game, "Grizzly Bears", A); // 2/2 green creature
    const bolt = spawn(game, "Darksteel Myr", B); // 0/3 colourless artifact creature

    const m = (id: ObjectId, f: Parameters<typeof matchesFilter>[3]) =>
      matchesFilter(game.state, registry, id, f, { you: A });

    expect(m(bears, { type: "creature" })).toBe(true);
    expect(m(bears, { colors: ["G"] })).toBe(true);
    expect(m(bears, { colors: ["R"] })).toBe(false);
    expect(m(bears, { power: { op: "lte", n: 2 } })).toBe(true);
    expect(m(bears, { power: { op: "gt", n: 2 } })).toBe(false);
    expect(m(bears, { controlledBy: "you" })).toBe(true);
    expect(m(bolt, { controlledBy: "you" })).toBe(false);
    expect(m(bolt, { controlledBy: "opponent" })).toBe(true);
    expect(m(bolt, { colorless: true, type: "artifact" })).toBe(true);
    expect(m(bears, { colorless: true })).toBe(false);
    expect(m(bolt, { notTypes: ["creature"] })).toBe(false);
  });
});

describe("destroy-all — Wrath of God (rule 700-style mass destroy)", () => {
  it("destroys every creature, both players', and leaves non-creatures", () => {
    const { game } = mkGame(["Wrath of God"]);
    game.advanceUntil(toPrecombat);
    const bears = spawn(game, "Grizzly Bears", A);
    const goblin = spawn(game, "Raging Goblin", B);
    const land = spawn(game, "Forest", A);
    const anthem = spawn(game, "Glorious Anthem", A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);

    cast(game, "Wrath of God");
    game.advanceUntil(settled);

    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, goblin)).toBe("graveyard");
    expect(zoneOf(game, land)).toBe("battlefield");
    expect(zoneOf(game, anthem)).toBe("battlefield");
  });

  it("spares an indestructible creature", () => {
    const { game } = mkGame(["Wrath of God"]);
    game.advanceUntil(toPrecombat);
    const myr = spawn(game, "Darksteel Myr", A); // indestructible
    const bears = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);

    cast(game, "Wrath of God");
    game.advanceUntil(settled);

    expect(zoneOf(game, myr)).toBe("battlefield");
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(
      game.eventsOfType("permanent-destroy-prevented").some((e) => e.object === myr),
    ).toBe(true);
  });

  it("pauses on a commander's 903.9a choice mid-wipe, then finishes the rest", () => {
    const a = new ScriptedController(A);
    a.commanderReplacementFn = () => true;
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: pad(["Wrath of God"]), commander: "Edict Test Commander" },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(toPrecombat);
    const commander = spawn(game, "Edict Test Commander", A, true);
    const bears1 = spawn(game, "Grizzly Bears", A);
    const bears2 = spawn(game, "Grizzly Bears", B);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);

    cast(game, "Wrath of God");
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    // the wipe is paused — the two vanilla bears are still queued / on board
    expect(game.state.objects[commander].zone).toBe("battlefield");

    game.advanceUntil(settled);
    expect(game.state.objects[commander].zone).toBe("command");
    expect(zoneOf(game, bears1)).toBe("graveyard");
    expect(zoneOf(game, bears2)).toBe("graveyard");
  });
});

describe("damage-all — Pyroclasm", () => {
  it("kills 2-toughness creatures but not tougher ones", () => {
    const { game } = mkGame(["Pyroclasm"]);
    game.advanceUntil(toPrecombat);
    const bears = spawn(game, "Grizzly Bears", A); // 2/2
    const spider = spawn(game, "Giant Spider", B); // 2/4
    spawn(game, "Mountain", A);
    spawn(game, "Mountain", A);

    cast(game, "Pyroclasm");
    game.advanceUntil(settled);

    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, spider)).toBe("battlefield");
    expect(game.state.objects[spider].damageMarked).toBe(2);
  });
});

describe("sacrifice effect — edicts (rule 701.16)", () => {
  it("Diabolic Edict: target with one creature auto-sacrifices it", () => {
    const { game } = mkGame(["Diabolic Edict"]);
    game.advanceUntil(toPrecombat);
    const goblin = spawn(game, "Raging Goblin", B);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Diabolic Edict"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(zoneOf(game, goblin)).toBe("graveyard");
    expect(game.eventsOfType("permanent-sacrificed").some((e) => e.player === B)).toBe(true);
  });

  it("Diabolic Edict: target with two creatures is asked to choose one", () => {
    const b = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: b },
      decks: [
        { player: A, cards: pad(["Diabolic Edict"]) },
        { player: B, cards: pad([]) },
      ],
    });
    game.advanceUntil(toPrecombat);
    const goblin = spawn(game, "Raging Goblin", B);
    const bears = spawn(game, "Grizzly Bears", B);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);
    b.chooseSacrificesFn = (_v, eligible) => [eligible.find((id) => id === bears) as ObjectId];

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Diabolic Edict"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "sacrifice");
    expect(game.state.awaiting).toMatchObject({ kind: "sacrifice", player: B, count: 1 });

    game.advanceUntil(settled);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, goblin)).toBe("battlefield");
  });

  it("Diabolic Edict: target with no creatures does nothing", () => {
    const { game } = mkGame(["Diabolic Edict"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Diabolic Edict"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.eventsOfType("permanent-sacrificed")).toHaveLength(0);
  });

  it("Fleshbag Marauder: each player sacrifices a creature on its ETB", () => {
    const { game } = mkGame(["Fleshbag Marauder"]);
    game.advanceUntil(toPrecombat);
    const aBears = spawn(game, "Grizzly Bears", A);
    const bGoblin = spawn(game, "Raging Goblin", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);

    cast(game, "Fleshbag Marauder");
    game.advanceUntil(settled);
    const fleshbag = named(game, game.battlefield, "Fleshbag Marauder");

    // A controls Bears + Fleshbag; the ScriptedController sacrifices from the
    // front (Bears, the older permanent). B has just the Goblin (auto).
    expect(zoneOf(game, aBears)).toBe("graveyard");
    expect(zoneOf(game, bGoblin)).toBe("graveyard");
    expect(zoneOf(game, fleshbag)).toBe("battlefield");
  });
});

// `matchesFilter` answers type / subtype / colour clauses from the object's own
// printed values plus its own modifiers (layers 3-5), and only reaches for the
// full layer fold when a `power` / `toughness` / `keyword` clause needs it —
// the fold is expensive enough that a static ability's condition scanning the
// battlefield used to dominate a long game's runtime. These pin the cases where
// the cheap path must still see a *changed* characteristic.
describe("matchesFilter sees layer 3-5 changes without the full fold", () => {
  const filterIn = (game: Game, id: ObjectId, filter: Parameters<typeof matchesFilter>[3]) =>
    matchesFilter(game.state, game.registry, id, filter, { you: A });

  it("an animated man-land matches a creature filter (layer 4)", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const factory = spawn(game, "Mishra's Factory", A);
    spawn(game, "Forest", A);

    expect(filterIn(game, factory, { type: "creature" })).toBe(false);
    expect(filterIn(game, factory, { type: "land" })).toBe(true);

    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1 });
    game.advanceUntil(settled);

    // Still a land, and now also a creature and an Assembly-Worker.
    expect(filterIn(game, factory, { type: "creature" })).toBe(true);
    expect(filterIn(game, factory, { type: "land" })).toBe(true);
    expect(filterIn(game, factory, { subtype: "Assembly-Worker" })).toBe(true);
  });

  it("a Turn to Frog'd creature matches on its new colour and subtype (layers 3-5)", () => {
    const { game } = mkGame(["Turn to Frog"]);
    game.advanceUntil(toPrecombat);
    const bear = spawn(game, "Grizzly Bears", B);
    spawn(game, "Island", A);
    spawn(game, "Island", A); // {1}{U}

    expect(filterIn(game, bear, { colors: ["G"] })).toBe(true);
    expect(filterIn(game, bear, { subtype: "Bear" })).toBe(true);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Turn to Frog"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(filterIn(game, bear, { colors: ["U"] })).toBe(true);
    expect(filterIn(game, bear, { notColors: ["G"] })).toBe(true);
    expect(filterIn(game, bear, { subtype: "Frog" })).toBe(true);
    expect(filterIn(game, bear, { subtype: "Bear" })).toBe(false);
  });

  it("still consults the layer fold for an anthem's P/T and keyword grant", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const bear = spawn(game, "Grizzly Bears", A);
    expect(filterIn(game, bear, { power: { op: "gte", n: 3 } })).toBe(false);
    expect(filterIn(game, bear, { keyword: "trample" })).toBe(false);

    spawn(game, "Garruk's Uprising", A); // creatures you control have trample
    spawn(game, "Glorious Anthem", A); // +1/+1

    expect(filterIn(game, bear, { power: { op: "gte", n: 3 } })).toBe(true);
    expect(filterIn(game, bear, { keyword: "trample" })).toBe(true);
  });
});
