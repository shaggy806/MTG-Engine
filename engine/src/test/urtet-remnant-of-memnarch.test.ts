/**
 * Urtet, Remnant of Memnarch — every clause through the real `Game`:
 *
 * - "Whenever you cast a Myr spell, create a 1/1 colorless Myr artifact
 *   creature token." A cast trigger (rule 601.2i), so the token arrives
 *   before the Myr spell resolves; not off a non-Myr spell, not off an
 *   opponent's spell, and not off Urtet's own cast (rule 113.6 — the ability
 *   only works from the battlefield).
 * - "At the beginning of combat on your turn, untap each Myr you control."
 *   Only your Myr, only on your turn.
 * - "{W}{U}{B}{R}{G}, {T}: Put three +1/+1 counters on each Myr you control.
 *   Activate only during your turn." Gated to your turn (rule 602.5) but not
 *   to sorcery speed.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const URTET = "Urtet, Remnant of Memnarch";
const WUBRG = ["Plains", "Island", "Swamp", "Mountain", "Forest"];

const mkGame = (aHand: readonly string[] = [], bHand: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Swamp")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Forest")] },
    ],
  });

const mainPhaseOf = (turn: number, player: PlayerId) => (s: GameState): boolean =>
  s.turn.number === turn && s.turn.step === "precombat-main" && s.priority.holder === player;
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const spawn = (game: Game, name: string, player: PlayerId, tapped = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, tapped });
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
/** Myr tokens `player` controls, counting a compacted stack as every token in it. */
const myrTokens = (game: Game, player: PlayerId): number =>
  game.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Myr Token" && o.controller === player)
    .reduce((n, o) => n + (o.stackCount ?? 1), 0);
const pumpOffered = (game: Game, urtet: ObjectId): boolean =>
  game
    .legalActions(A)
    .some((a) => a.kind === "activate-ability" && a.source === urtet && a.abilityIndex === 0);
const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;

describe("Urtet — characteristics", () => {
  it("is colourless with a five-colour identity, read off its activation cost (rule 903.4)", () => {
    const def = createDefaultRegistry().get(URTET);
    expect(def.colors).toEqual([]);
    expect(identityString(colorIdentityOf(def))).toBe("WUBRG");
  });
});

describe("Urtet — whenever you cast a Myr spell", () => {
  it("makes a 1/1 colourless Myr artifact creature token, before the spell resolves", () => {
    const game = mkGame(["Darksteel Myr"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, URTET, A);
    lands(game, A, ["Swamp", "Swamp", "Swamp"]);

    cast(game, A, "Darksteel Myr");
    game.advanceUntil(quiet);

    expect(myrTokens(game, A)).toBe(1);
    const token = game.battlefield.find((id) => game.state.objects[id].cardName === "Myr Token");
    if (token === undefined) throw new Error("no Myr token");
    const c = game.characteristics(token);
    expect(game.state.objects[token].isToken).toBe(true);
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect([...c.types].sort()).toEqual(["artifact", "creature"]);
    expect([...c.subtypes]).toEqual(["Myr"]);
    expect([...c.colors]).toEqual([]);

    // A cast trigger, not an enters trigger: it resolves on top of the Myr
    // spell, so the token is on the battlefield before Darksteel Myr is.
    const log = game.state.eventLog;
    const tokenEntered = log.findIndex(
      (e) => e.type === "permanent-entered-battlefield" && e.object === token,
    );
    const myrResolved = log.findIndex(
      (e) =>
        e.type === "spell-resolved" && game.state.objects[e.object]?.cardName === "Darksteel Myr",
    );
    expect(tokenEntered).toBeGreaterThanOrEqual(0);
    expect(myrResolved).toBeGreaterThan(tokenEntered);
  });

  it("doesn't trigger off a non-Myr spell", () => {
    const game = mkGame(["Grizzly Bears"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, URTET, A);
    lands(game, A, ["Forest", "Forest"]);

    cast(game, A, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(myrTokens(game, A)).toBe(0);
  });

  it("doesn't trigger off an opponent's Myr spell", () => {
    const game = mkGame([], ["Darksteel Myr"]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, URTET, A);
    game.advanceUntil(mainPhaseOf(2, B));
    lands(game, B, ["Forest", "Forest", "Forest"]);

    cast(game, B, "Darksteel Myr");
    game.advanceUntil(quiet);
    expect(myrTokens(game, A)).toBe(0);
    expect(myrTokens(game, B)).toBe(0);
  });

  it("doesn't trigger off casting Urtet itself", () => {
    const game = mkGame([URTET]);
    game.advanceUntil(mainPhaseOf(1, A));
    lands(game, A, ["Swamp", "Swamp", "Swamp"]);

    cast(game, A, URTET);
    game.advanceUntil(quiet);

    // Urtet is a Myr spell, and the spell being cast is in the trigger scan,
    // so without `otherOnly` it would make a token off its own cast.
    expect(game.battlefield.some((id) => game.state.objects[id].cardName === URTET)).toBe(true);
    expect(myrTokens(game, A)).toBe(0);
  });

  it("does trigger off casting a second Urtet while the first is on the battlefield", () => {
    // `otherOnly` excludes only the object being cast; the Urtet already on
    // the battlefield is a different object and sees a Myr spell.
    const game = mkGame([URTET]);
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, URTET, A);
    lands(game, A, ["Swamp", "Swamp", "Swamp"]);

    cast(game, A, URTET);
    game.advanceUntil(quiet);
    expect(myrTokens(game, A)).toBe(1);
  });
});

describe("Urtet — beginning of combat on your turn", () => {
  it("untaps each Myr you control, and nothing else", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A, true);
    const myr = spawn(game, "Darksteel Myr", A, true);
    game.debugApplyEffect(A, { kind: "create-token", token: "Myr Token", count: 1 });
    const token = game.battlefield.find((id) => game.state.objects[id].cardName === "Myr Token");
    if (token === undefined) throw new Error("no Myr token");
    game.state.objects[token].tapped = true;
    const bears = spawn(game, "Grizzly Bears", A, true);
    const land = spawn(game, "Swamp", A, true);
    const theirMyr = spawn(game, "Darksteel Myr", B, true);

    game.advanceUntil(
      (s) => s.turn.step === "declare-attackers" || s.awaiting !== null || s.result.over,
    );
    expect(game.state.turn.number).toBe(1);

    for (const id of [urtet, myr, token]) expect(game.state.objects[id].tapped).toBe(false);
    // A creature that isn't a Myr, a land, and an opponent's Myr all stay put.
    for (const id of [bears, land, theirMyr]) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("reaches every token in a compacted stack", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    spawn(game, URTET, A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Myr Token", count: 9 });
    const stack = game.battlefield.find((id) => game.state.objects[id].cardName === "Myr Token");
    if (stack === undefined) throw new Error("no Myr tokens");
    expect(game.state.objects[stack].stackCount).toBe(9);
    game.state.objects[stack].tapped = true;

    game.advanceUntil(
      (s) => s.turn.step === "declare-attackers" || s.awaiting !== null || s.result.over,
    );
    expect(game.state.objects[stack].tapped).toBe(false);
    expect(myrTokens(game, A)).toBe(9);
  });

  it("does nothing at the beginning of combat on an opponent's turn", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A);
    const myr = spawn(game, "Darksteel Myr", A);

    game.advanceUntil(mainPhaseOf(2, B));
    game.state.objects[urtet].tapped = true;
    game.state.objects[myr].tapped = true;
    const logFrom = game.state.eventLog.length;

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    // B's beginning of combat did happen — Urtet just doesn't care.
    expect(
      game.state.eventLog
        .slice(logFrom)
        .some((e) => e.type === "step-began" && e.step === "begin-combat"),
    ).toBe(true);
    expect(game.state.objects[urtet].tapped).toBe(true);
    expect(game.state.objects[myr].tapped).toBe(true);
  });
});

describe("Urtet — {W}{U}{B}{R}{G}, {T}: three +1/+1 counters on each Myr you control", () => {
  it("counters each Myr you control — Urtet, a card, a token stack — and nothing else", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A);
    const myr = spawn(game, "Darksteel Myr", A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Myr Token", count: 9 });
    const stack = game.battlefield.find((id) => game.state.objects[id].cardName === "Myr Token");
    if (stack === undefined) throw new Error("no Myr tokens");
    const bears = spawn(game, "Grizzly Bears", A);
    const theirMyr = spawn(game, "Darksteel Myr", B);
    lands(game, A, WUBRG);

    expect(pumpOffered(game, urtet)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: urtet, abilityIndex: 0 });
    // {T} is part of the cost, paid on activation.
    expect(game.state.objects[urtet].tapped).toBe(true);
    game.advanceUntil(quiet);

    expect(plusOnes(game, urtet)).toBe(3);
    expect(plusOnes(game, myr)).toBe(3);
    expect(game.characteristics(urtet).power).toBe(5);
    expect(game.characteristics(myr).toughness).toBe(4);
    // The whole stack, not one token peeled off it.
    expect(game.state.objects[stack].stackCount).toBe(9);
    expect(plusOnes(game, stack)).toBe(3);
    expect(game.characteristics(stack).power).toBe(4);
    expect(plusOnes(game, bears)).toBe(0);
    expect(plusOnes(game, theirMyr)).toBe(0);
  });

  it("needs all five colours", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A);
    lands(game, A, ["Plains", "Island", "Swamp", "Mountain", "Mountain", "Mountain"]);
    expect(pumpOffered(game, urtet)).toBe(false);
  });

  it("can't be activated while Urtet is summoning sick ({T} in the cost)", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = game.debugSpawn(URTET, A, "battlefield");
    expect(game.state.objects[urtet].summoningSick).toBe(true);
    lands(game, A, WUBRG);
    expect(pumpOffered(game, urtet)).toBe(false);
  });

  it("can't be activated during an opponent's turn", () => {
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A);

    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    lands(game, A, WUBRG);
    expect(game.state.objects[urtet].tapped).toBe(false);
    expect(pumpOffered(game, urtet)).toBe(false);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: urtet, abilityIndex: 0 }),
    ).toThrow(/activation condition/);
    expect(plusOnes(game, urtet)).toBe(0);
  });

  it("works at instant speed on your own turn — in response to its own untap trigger", () => {
    // The line the card is built for: pump with the combat trigger on the
    // stack, and the trigger then untaps Urtet so it can still attack.
    const game = mkGame();
    game.advanceUntil(mainPhaseOf(1, A));
    const urtet = spawn(game, URTET, A);
    lands(game, A, WUBRG);

    game.advanceUntil(
      (s) =>
        s.turn.step === "begin-combat" &&
        s.priority.holder === A &&
        s.zones.shared.stack.length === 1,
    );
    expect(pumpOffered(game, urtet)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: urtet, abilityIndex: 0 });
    expect(game.state.objects[urtet].tapped).toBe(true);

    game.advanceUntil(
      (s) => s.turn.step === "declare-attackers" || s.awaiting !== null || s.result.over,
    );
    expect(plusOnes(game, urtet)).toBe(3);
    expect(game.state.objects[urtet].tapped).toBe(false);
    expect(game.state.awaiting?.kind).toBe("attackers");
  });
});
