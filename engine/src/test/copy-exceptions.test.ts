/**
 * Copy exceptions (rule 707.9b): "a token that's a copy of it, except it's a
 * 3/3 black Zombie creature in addition to its other types". The exceptions
 * are part of the copy's copiable values — every other effect applies over
 * them, and anything that copies the copy (a token copy, a Clone) copies them
 * too. `create-token-copy`'s `exceptions`, carried as `copiable` modifiers.
 */

import { describe, expect, it } from "vitest";

import { manaTapAbility } from "../cards/helpers.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { CopyExceptions } from "../effects.js";
import { matchesFilter } from "../filter.js";
import { hasSubtype, subtypeFitsTypes } from "../subtypes.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** State-based actions (the legend rule among them) run at the next priority
 * check, which `advanceUntil(quiet)` skips when nothing else is pending. */
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const ZOMBIE: CopyExceptions = {
  name: "Test Zombie",
  basePt: [3, 3],
  setColors: ["B"],
  addTypes: ["artifact"],
  addSubtypes: ["Zombie"],
  keywords: ["flying"],
};
/** A token copy of `of`, with `exceptions`; its id. */
const copyOf = (game: Game, of: ObjectId, exceptions?: CopyExceptions): ObjectId => {
  const before = new Set(game.state.zones.shared.battlefield);
  game.debugApplyEffect(A, {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    ...(exceptions !== undefined ? { exceptions } : {}),
  }, [{ kind: "object", object: of }]);
  return game.state.zones.shared.battlefield.find((id) => !before.has(id))!;
};
const looks = (game: Game, id: ObjectId) => {
  const c = game.characteristics(id);
  return {
    name: nameOf(game.state.objects[id]),
    pt: [c.power, c.toughness],
    colors: [...c.colors].sort(),
    types: [...c.types].sort(),
    zombie: c.subtypes.includes("Zombie"),
    bear: c.subtypes.includes("Bear"),
    flying: c.keywords.has("flying"),
  };
};
const ZOMBIE_BEAR = {
  name: "Test Zombie",
  pt: [3, 3],
  colors: ["B"],
  types: ["artifact", "creature"],
  zombie: true,
  bear: true,
  flying: true,
};

describe("copy exceptions", () => {
  it("make the copy what they say, on top of the copied card", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const token = copyOf(game, bears, ZOMBIE);
    expect(looks(game, token)).toEqual(ZOMBIE_BEAR);
    // The view names it too, while drawing the Bears' face.
    const seen = game.viewFor(A).objects[token];
    expect([seen?.name, seen?.copyOf]).toEqual(["Test Zombie", "Grizzly Bears"]);
  });

  it("are copied by a copy of the copy, and a newer copy's own exceptions win", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const token = copyOf(game, bears, ZOMBIE);
    expect(looks(game, copyOf(game, token))).toEqual(ZOMBIE_BEAR);
    const small = copyOf(game, token, { basePt: [1, 1] });
    expect(looks(game, small)).toEqual({ ...ZOMBIE_BEAR, pt: [1, 1] });
  });

  it("are copied by a Clone", () => {
    const { game, a } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const token = copyOf(game, bears, ZOMBIE);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    a.chooseCopyFn = () => token;
    const clone = game.debugSpawn("Clone", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: clone });
    game.advanceUntil(quiet);
    expect(looks(game, clone)).toEqual(ZOMBIE_BEAR);
  });

  it("go under every other effect: a later Turn to Frog replaces the P/T and takes the flying", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const token = copyOf(game, bears, ZOMBIE);
    game.debugApplyEffect(B, registry.get("Turn to Frog").effect!, [{ kind: "object", object: token }]);
    const after = looks(game, token);
    expect(after.pt).toEqual([1, 1]);
    expect(after.flying).toBe(false);
    expect(after.colors).toEqual(["U"]);
  });

  it("a new name: the legend rule and \"named\" read it", () => {
    const { game } = setUp();
    const monument = game.debugSpawn("Bontu's Monument", A, "battlefield");
    const renamed = copyOf(game, monument, { name: "Test Warform" });
    settle(game);
    // Differently named, so no legend rule.
    expect(game.state.objects[monument].zone).toBe("battlefield");
    expect(game.state.objects[renamed].zone).toBe("battlefield");
    expect(matchesFilter(game.state, registry, renamed, { name: "Test Warform" }, { you: A })).toBe(true);
    expect(matchesFilter(game.state, registry, renamed, { name: "Bontu's Monument" }, { you: A })).toBe(false);
    // A plain copy has the same name, and one of the two goes.
    copyOf(game, monument);
    settle(game);
    const monuments = game.state.zones.shared.battlefield.filter(
      (id) => nameOf(game.state.objects[id]) === "Bontu's Monument",
    );
    expect(monuments).toHaveLength(1);
  });

  it("set types: only what they say, and the subtypes that went with the rest go too (rule 205.1a)", () => {
    const { game } = setUp();
    // A changeling card: every creature type, as long as it's a creature.
    const morophon = game.debugSpawn("Morophon, the Boundless", A, "graveyard");
    expect(hasSubtype(game.characteristics(morophon).subtypes, "Goblin")).toBe(true);
    const token = copyOf(game, morophon, { setTypes: ["enchantment"] });
    const c = game.characteristics(token);
    expect(c.types).toEqual(["enchantment"]);
    expect(hasSubtype(c.subtypes, "Goblin")).toBe(false);
    // A type-adding exception beside it still applies on top.
    const also = copyOf(game, morophon, { setTypes: ["enchantment"], addTypes: ["artifact"], addSubtypes: ["Food"] });
    expect([...game.characteristics(also).types].sort()).toEqual(["artifact", "enchantment"]);
    expect(game.characteristics(also).subtypes).toContain("Food");
  });

  it("which card types each kind of subtype goes with", () => {
    expect(subtypeFitsTypes("Bear", ["enchantment"])).toBe(false);
    expect(subtypeFitsTypes("Bear", ["artifact", "creature"])).toBe(true);
    expect(subtypeFitsTypes("Forest", ["creature"])).toBe(false);
    expect(subtypeFitsTypes("Forest", ["land"])).toBe(true);
    expect(subtypeFitsTypes("Food", ["enchantment"])).toBe(false);
    expect(subtypeFitsTypes("Equipment", ["artifact"])).toBe(true);
    expect(subtypeFitsTypes("Aura", ["enchantment"])).toBe(true);
    expect(subtypeFitsTypes("Saga", ["creature"])).toBe(false);
    expect(subtypeFitsTypes("Arcane", ["instant"])).toBe(true);
    expect(subtypeFitsTypes("Siege", ["battle"])).toBe(true);
    expect(subtypeFitsTypes("Jace", ["planeswalker"])).toBe(true);
    expect(subtypeFitsTypes("Jace", ["enchantment"])).toBe(false);
  });

  it("an activated ability: offered, activated, and lost with the rest of its abilities (rule 613.7)", () => {
    const { game } = setUp();
    const sacrifice = {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{1}, Sacrifice this token: You gain 2 life.",
    } as const;
    const monument = game.debugSpawn("Bontu's Monument", A, "graveyard");
    const token = copyOf(game, monument, { activated: [sacrifice] });
    game.debugSpawn("Island", A, "battlefield");
    const offered = (id: ObjectId) =>
      game.legalActions(A).filter((action) => action.kind === "activate-ability" && action.source === id);
    const [ability] = offered(token);
    expect(ability).toMatchObject({ text: sacrifice.text });
    // "A creature with no abilities" isn't one with a granted one.
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const hasAbilities = (id: ObjectId): boolean =>
      matchesFilter(game.state, registry, id, { hasAbilities: true }, { you: A });
    expect(hasAbilities(copyOf(game, bears))).toBe(false);
    expect(hasAbilities(copyOf(game, bears, { activated: [sacrifice] }))).toBe(true);
    // A copy of it has it too, until it loses all its abilities.
    const copy = copyOf(game, token);
    expect(offered(copy)).toHaveLength(1);
    game.debugApplyEffect(B, registry.get("Turn to Frog").effect!, [{ kind: "object", object: copy }]);
    expect(offered(copy)).toEqual([]);
    if (ability?.kind !== "activate-ability") throw new Error("not offered");
    const life = game.state.players[A].life;
    game.dispatch({ type: "activate-ability", player: A, source: token, abilityIndex: ability.abilityIndex });
    game.advanceUntil(quiet);
    expect(game.state.objects[token]).toBeUndefined();
    expect(game.state.players[A].life).toBe(life + 2);
  });

  it("a mana ability among them pays for a spell", () => {
    const { game } = setUp();
    const monument = game.debugSpawn("Bontu's Monument", A, "graveyard");
    const token = copyOf(game, monument, { activated: [manaTapAbility("G")] });
    const hasManaAbility = (id: ObjectId): boolean =>
      matchesFilter(game.state, registry, id, { hasManaAbility: true }, { you: A });
    expect(hasManaAbility(token)).toBe(true);
    expect(hasManaAbility(copyOf(game, monument))).toBe(false);
    const elves = game.debugSpawn("Llanowar Elves", A, "hand");
    expect(game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === elves)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: elves });
    game.advanceUntil(quiet);
    expect(game.state.objects[elves].zone).toBe("battlefield");
  });

  it("a copy of a copy that isn't legendary isn't legendary either", () => {
    const { game } = setUp();
    const krenko = game.debugSpawn("Krenko, Mob Boss", A, "battlefield");
    const before = new Set(game.state.zones.shared.battlefield);
    game.debugApplyEffect(
      A,
      { kind: "create-token-copy", of: 0, count: 1, who: "you", notLegendary: true },
      [{ kind: "object", object: krenko }],
    );
    const copy = game.state.zones.shared.battlefield.find((id) => !before.has(id))!;
    const copyOfCopy = copyOf(game, copy);
    settle(game);
    for (const id of [krenko, copy, copyOfCopy]) expect(game.state.objects[id]?.zone).toBe("battlefield");
  });
});
