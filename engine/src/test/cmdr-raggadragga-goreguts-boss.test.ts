/**
 * Raggadragga, Goreguts Boss — {2}{R}{G} 4/4 legendary Human Boar:
 *   Each creature you control with a mana ability gets +2/+2.
 *   Whenever a creature you control with a mana ability attacks, untap it.
 *   Whenever you cast a spell, if at least seven mana was spent to cast it,
 *   untap target creature. It gets +7/+7 and gains trample until end of turn.
 *
 * "With a mana ability" is the `hasManaAbility` filter clause — activated or
 * triggered (the ruling), printed or granted. Its rules are pinned in
 * `card-property-clauses.test.ts`; this is the card.
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
const RAGGADRAGGA = "Raggadragga, Goreguts Boss";
const registry = createDefaultRegistry();

function makeGame(opts: { aCards?: readonly string[]; commander?: string } = {}) {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: [...(opts.aCards ?? []), ...Array<string>(40).fill("Forest")],
        ...(opts.commander !== undefined ? { commander: opts.commander } : {}),
      },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a };
}

const spawn = (game: Game, name: string, player: PlayerId = A, tapped = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, tapped });
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** How many times an ability of `source` has triggered. */
const triggersOf = (game: Game, source: ObjectId): number =>
  game.eventsOfType("ability-triggered").filter((e) => e.source === source).length;

describe("Raggadragga, Goreguts Boss", () => {
  it("is a {2}{R}{G} 4/4 legendary Human Boar", () => {
    const def = registry.get(RAGGADRAGGA);
    expect(def.manaCost).toBe("{2}{R}{G}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Human", "Boar"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(identityString(colorIdentityOf(def))).toBe("RG");
  });

  it("gives +2/+2 to each creature you control with a mana ability, activated or triggered", () => {
    const { game } = makeGame();
    const ragga = spawn(game, RAGGADRAGGA);
    const elves = spawn(game, "Llanowar Elves");
    const ghast = spawn(game, "Crypt Ghast");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Llanowar Elves", B);
    expect(pt(game, elves)).toEqual([3, 3]);
    // "Whenever you tap a Swamp for mana, add an additional {B}" — a
    // triggered mana ability (the first ruling).
    expect(pt(game, ghast)).toEqual([4, 4]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([1, 1]);
    // Raggadragga has no mana ability of its own.
    expect(pt(game, ragga)).toEqual([4, 4]);
  });

  it("counts a granted mana ability — Cryptolith Rite — Raggadragga's own included", () => {
    const { game } = makeGame();
    const ragga = spawn(game, RAGGADRAGGA);
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Cryptolith Rite");
    expect(pt(game, bears)).toEqual([4, 4]);
    expect(pt(game, ragga)).toEqual([6, 6]);
  });

  it("stops once the creature loses its abilities", () => {
    const { game } = makeGame();
    spawn(game, RAGGADRAGGA);
    const elves = spawn(game, "Llanowar Elves");
    game.debugApplyEffect(A, registry.get("Turn to Frog").effect!, [{ kind: "object", object: elves }]);
    expect(pt(game, elves)).toEqual([1, 1]);
  });

  it("untaps an attacking creature with a mana ability, and only that one", () => {
    const { game, a } = makeGame();
    spawn(game, RAGGADRAGGA, A, true);
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [
      { attacker: elves, defender: B },
      { attacker: bears, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.objects[elves].attacking).toBe(B);
    expect(game.state.objects[elves].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(true);
  });

  it("pumps and untaps a target when a spell cast with seven or more mana is cast", () => {
    const { game, a } = makeGame({ aCards: ["Blaze"] });
    spawn(game, RAGGADRAGGA);
    const bears = spawn(game, "Grizzly Bears", A, true);
    for (let i = 0; i < 7; i += 1) spawn(game, "Mountain");
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    const life = game.state.players[B].life;
    const blaze = game.handOf(A).find((id) => game.state.objects[id].cardName === "Blaze")!;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: blaze,
      xValue: 6,
      targets: [{ kind: "player", player: B }],
    });
    expect(game.state.objects[blaze].manaSpent).toBe(7);
    game.advanceUntil(settled);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(pt(game, bears)).toEqual([9, 9]);
    expect(game.characteristics(bears).keywords.has("trample")).toBe(true);
    // And Blaze, below the trigger on the stack, still resolved.
    expect(game.state.players[B].life).toBe(life - 6);
  });

  it("doesn't trigger for a spell cast with six mana", () => {
    const { game, a } = makeGame({ aCards: ["Blaze"] });
    const ragga = spawn(game, RAGGADRAGGA);
    const bears = spawn(game, "Grizzly Bears", A, true);
    for (let i = 0; i < 7; i += 1) spawn(game, "Mountain");
    // Were it to trigger, it would untap the Bears.
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    const blaze = game.handOf(A).find((id) => game.state.objects[id].cardName === "Blaze")!;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: blaze,
      xValue: 5,
      targets: [{ kind: "player", player: B }],
    });
    expect(game.state.objects[blaze].manaSpent).toBe(6);
    game.advanceUntil(settled);
    expect(triggersOf(game, ragga)).toBe(0);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(pt(game, bears)).toEqual([2, 2]);
  });

  it("doesn't trigger off casting itself, however much it cost (rule 113.6)", () => {
    // Two earlier casts from the command zone: {2}{R}{G} plus {4} of tax is
    // eight mana spent — but the ability works only from the battlefield.
    const { game, a } = makeGame({ commander: RAGGADRAGGA });
    game.state.players[A].commanderCastCounts[RAGGADRAGGA] = 2;
    const bears = spawn(game, "Grizzly Bears", A, true);
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain");
    for (let i = 0; i < 4; i += 1) spawn(game, "Forest");
    a.chooseTargetsFn = () => [{ kind: "object", object: bears }];
    const ragga = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].cardName === RAGGADRAGGA,
    )!;
    game.dispatch({ type: "cast-spell", player: A, card: ragga, targets: [] });
    expect(game.state.objects[ragga].manaSpent).toBe(8);
    expect(game.state.zones.shared.stack).toEqual([ragga]);
    game.advanceUntil(settled);
    expect(game.state.objects[ragga].zone).toBe("battlefield");
    expect(triggersOf(game, ragga)).toBe(0);
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});
