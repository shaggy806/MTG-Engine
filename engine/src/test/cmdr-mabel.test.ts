/**
 * Mabel, Heir to Cragflame — both printed clauses through the real `Game`:
 *
 * - "Other Mice you control get +1/+1." Other: Mabel is a Mouse herself and
 *   stays a 3/3. Yours: an opponent's Mouse gets nothing. Mice: a non-Mouse
 *   you control gets nothing.
 * - "When Mabel enters, create Cragflame, a legendary colorless Equipment
 *   artifact token with 'Equipped creature gets +1/+1 and has vigilance,
 *   trample, and haste' and equip {2}." One token, with exactly those
 *   characteristics; the grant reaches only the creature it is attached to;
 *   Equip is sorcery-speed and costs {2}; and the token really is legendary,
 *   so a second copy of it dies to the legend rule.
 *
 * Nothing in the pool is printed as a Mouse, so the Mice the lord clause is
 * measured against are made by animating a creature into one (layer 4), which
 * is what the static reads anyway — `matchesFilter` asks for *computed*
 * subtypes.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const MABEL = "Mabel, Heir to Cragflame";
const CRAGFLAME = "Cragflame";

const mkGame = (aHand: readonly string[] = [], bHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Swamp")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Swamp")] },
    ],
  });

/** `player`'s *own* precombat main phase with priority — what a sorcery-speed
 * ability (Equip) needs. Which seat goes first comes off the seed, so this
 * can't be pinned to turn 1. */
const myMain = (game: Game, player: PlayerId) => (s: GameState): boolean =>
  s.turn.step === "precombat-main" &&
  s.priority.holder === player &&
  game.activePlayer === player;
/** A window on an *opponent's* turn where `player` holds priority. */
const theirTurn = (game: Game, player: PlayerId) => (s: GameState): boolean =>
  s.priority.holder === player && game.activePlayer !== player && s.zones.shared.stack.length === 0;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Settled, *and* back in `player`'s own main phase — one `tick` can carry the
 * game out of the phase it started in, so a sorcery-speed activation after a
 * trigger has resolved needs a fresh window. */
const quietMain = (game: Game, player: PlayerId) => (s: GameState): boolean =>
  quiet(s) && myMain(game, player)(s);

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
/** A spawn that announces the entry, so enters-the-battlefield triggers fire. */
const spawnEntering = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) spawn(game, name, player);
};
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const cast = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "cast-spell", player, card: inHand(game, player, name), targets: [] });
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const onBattlefield = (game: Game, name: string, player?: PlayerId): readonly ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      (player === undefined || game.state.objects[id].controller === player),
  );
const only = (game: Game, name: string, player?: PlayerId): ObjectId => {
  const ids = onBattlefield(game, name, player);
  if (ids.length !== 1) throw new Error(`expected exactly one ${name}, found ${ids.length}`);
  return ids[0];
};
const kw = (game: Game, id: ObjectId): readonly string[] => [...game.characteristics(id).keywords];
const pt = (game: Game, id: ObjectId): readonly [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const equipOffered = (game: Game, equipment: ObjectId): boolean =>
  game
    .legalActions(A)
    .some((a) => a.kind === "activate-ability" && a.source === equipment && a.abilityIndex === 0);
const equip = (game: Game, equipment: ObjectId, creature: ObjectId): void => {
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: equipment,
    abilityIndex: 0,
    targets: [obj(creature)],
  });
};
/** Turn a permanent into a Mouse without changing its base P/T (layer 4). */
const makeMouse = (game: Game, player: PlayerId, id: ObjectId, base: readonly [number, number]) => {
  game.debugApplyEffect(
    player,
    {
      kind: "animate",
      target: 0,
      power: base[0],
      toughness: base[1],
      addTypes: [],
      addSubtypes: ["Mouse"],
      duration: "permanent",
    },
    [obj(id)],
  );
  // Guard the guard: a negative Mouse case is only worth anything if the
  // subtype really landed.
  expect([...game.characteristics(id).subtypes]).toContain("Mouse");
};

describe("Mabel — characteristics", () => {
  it("is a legendary 3/3 Mouse Soldier, red and white", () => {
    const def = createDefaultRegistry().get(MABEL);
    expect(def.manaCost).toBe("{1}{R}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect([...def.types]).toEqual(["creature"]);
    expect([...def.subtypes]).toEqual(["Mouse", "Soldier"]);
    expect([def.power, def.toughness]).toEqual([3, 3]);
    expect(new Set(def.colors)).toEqual(new Set(["R", "W"]));
    expect(identityString(colorIdentityOf(def))).toBe("WR");
  });
});

describe("Mabel — When Mabel enters, create Cragflame", () => {
  it("casting Mabel makes exactly one Cragflame", () => {
    const game = mkGame([MABEL]);
    game.advanceUntil(myMain(game, A));
    lands(game, A, ["Mountain", "Plains", "Plains"]);

    expect(onBattlefield(game, CRAGFLAME)).toHaveLength(0);
    cast(game, A, MABEL);
    game.advanceUntil(quiet);

    expect(onBattlefield(game, MABEL, A)).toHaveLength(1);
    const cragflame = only(game, CRAGFLAME, A);
    const c = game.characteristics(cragflame);
    expect(game.state.objects[cragflame].isToken).toBe(true);
    expect([...c.types]).toEqual(["artifact"]);
    expect([...c.subtypes]).toEqual(["Equipment"]);
    expect([...c.colors]).toEqual([]);
    expect(createDefaultRegistry().get(CRAGFLAME).supertypes).toEqual(["legendary"]);
  });

  it("is Mabel's own ETB: an opponent's Mabel makes the opponent's Cragflame, not yours", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawnEntering(game, MABEL, B);
    game.advanceUntil(quiet);

    expect(onBattlefield(game, CRAGFLAME, B)).toHaveLength(1);
    expect(onBattlefield(game, CRAGFLAME, A)).toHaveLength(0);
  });

  it("the Cragflame token is legendary — a second one dies to the legend rule", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawnEntering(game, MABEL, A);
    game.advanceUntil(quiet);
    expect(onBattlefield(game, CRAGFLAME, A)).toHaveLength(1);

    // A second Mabel: its ETB still resolves and makes a second Cragflame,
    // and both legendary pairs are then trimmed to one by rule 704.5j.
    spawnEntering(game, MABEL, A);
    game.advanceUntil(quiet);
    expect(onBattlefield(game, MABEL, A)).toHaveLength(1);
    expect(onBattlefield(game, CRAGFLAME, A)).toHaveLength(1);
  });
});

describe("Cragflame — Equipped creature gets +1/+1 and has vigilance, trample, and haste", () => {
  const setup = () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawnEntering(game, MABEL, A);
    game.advanceUntil(quietMain(game, A));
    lands(game, A, ["Plains", "Plains"]);
    const bears = spawn(game, "Grizzly Bears", A);
    return { game, cragflame: only(game, CRAGFLAME, A), bears };
  };

  it("grants nothing until it is attached", () => {
    const { game, bears } = setup();
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(kw(game, bears)).not.toContain("vigilance");
    expect(kw(game, bears)).not.toContain("trample");
    expect(kw(game, bears)).not.toContain("haste");
  });

  it("gives the equipped creature +1/+1, vigilance, trample and haste", () => {
    const { game, cragflame, bears } = setup();
    expect(equipOffered(game, cragflame)).toBe(true);
    equip(game, cragflame, bears);
    game.advanceUntil(quiet);

    expect(game.state.objects[cragflame].attachedTo).toBe(bears);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(kw(game, bears)).toContain("vigilance");
    expect(kw(game, bears)).toContain("trample");
    expect(kw(game, bears)).toContain("haste");
  });

  it("reaches only the creature it is attached to", () => {
    const { game, cragflame, bears } = setup();
    const other = spawn(game, "Grizzly Bears", A);
    equip(game, cragflame, bears);
    game.advanceUntil(quiet);

    expect(pt(game, bears)).toEqual([3, 3]);
    expect(pt(game, other)).toEqual([2, 2]);
    expect(kw(game, other)).not.toContain("haste");
  });

  it("Equip costs {2} and is sorcery-speed", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawnEntering(game, MABEL, A);
    game.advanceUntil(quietMain(game, A));
    spawn(game, "Grizzly Bears", A);
    const cragflame = only(game, CRAGFLAME, A);

    // No mana: not offered.
    expect(equipOffered(game, cragflame)).toBe(false);
    lands(game, A, ["Plains"]);
    expect(equipOffered(game, cragflame)).toBe(false);
    lands(game, A, ["Plains"]);
    expect(equipOffered(game, cragflame)).toBe(true);

    // On the opponent's turn it's gone again — Equip is sorcery-speed.
    game.advanceUntil(theirTurn(game, A));
    expect(equipOffered(game, cragflame)).toBe(false);
  });
});

describe("Mabel — Other Mice you control get +1/+1", () => {
  it("pumps another Mouse you control", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    const bears = spawn(game, "Grizzly Bears", A);
    expect(pt(game, bears)).toEqual([2, 2]);

    makeMouse(game, A, bears, [2, 2]);
    expect(pt(game, bears)).toEqual([2, 2]); // still no Mabel

    spawn(game, MABEL, A);
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([3, 3]);
  });

  it("does not pump Mabel herself — 'Other'", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    const mabel = spawn(game, MABEL, A);
    game.advanceUntil(quiet);
    expect(pt(game, mabel)).toEqual([3, 3]);
  });

  it("does not pump an opponent's Mouse — 'you control'", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawn(game, MABEL, A);
    game.advanceUntil(quiet);
    const theirs = spawn(game, "Grizzly Bears", B);
    makeMouse(game, B, theirs, [2, 2]);

    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("does not pump a non-Mouse you control — 'Mice'", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    spawn(game, MABEL, A);
    game.advanceUntil(quiet);
    const bears = spawn(game, "Grizzly Bears", A);

    expect(pt(game, bears)).toEqual([2, 2]);
  });

  it("stops pumping once Mabel leaves the battlefield", () => {
    const game = mkGame();
    game.advanceUntil(myMain(game, A));
    const mabel = spawn(game, MABEL, A);
    game.advanceUntil(quiet);
    const bears = spawn(game, "Grizzly Bears", A);
    makeMouse(game, A, bears, [2, 2]);
    expect(pt(game, bears)).toEqual([3, 3]);

    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [obj(mabel)]);
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});
