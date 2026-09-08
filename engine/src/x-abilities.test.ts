import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  zone: "battlefield" | "graveyard" = "battlefield",
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone,
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  if (zone === "battlefield") game.state.zones.shared.battlefield.push(id);
  else game.state.zones.perPlayer[controller].graveyard.push(id);
  return id;
};

const mkGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game };
};

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("{X} in an activated-ability cost — Cinder Elemental", () => {
  it("advertises maxX from affordable mana and deals X damage", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const cinder = spawn(game, "Cinder Elemental", A);
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain", A);

    const legal = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === cinder);
    expect(legal?.kind).toBe("activate-ability");
    // {X}{R} paid off 4 Mountains -> {R} + up to {3} for X.
    expect(legal && "xCost" in legal ? legal.xCost?.maxX : undefined).toBe(3);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: cinder,
      abilityIndex: 0,
      xValue: 3,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(17);
    // {T}, Sacrifice self as part of the cost.
    expect(game.state.objects[cinder].zone).toBe("graveyard");
  });

  it("maxX shrinks with less mana, and X=0 is always legal", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const cinder = spawn(game, "Cinder Elemental", A);
    spawn(game, "Mountain", A);
    spawn(game, "Mountain", A);

    const legal = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === cinder);
    expect(legal && "xCost" in legal ? legal.xCost?.maxX : undefined).toBe(1);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: cinder,
      abilityIndex: 0,
      xValue: 0,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(20);
  });

  it("throws when X exceeds what the player can pay", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const cinder = spawn(game, "Cinder Elemental", A);
    spawn(game, "Mountain", A);
    spawn(game, "Mountain", A);

    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: cinder,
        abilityIndex: 0,
        xValue: 5,
        targets: [{ kind: "player", player: B }],
      }),
    ).toThrow();
  });
});

describe("conditional static abilities", () => {
  it("Kird Ape — +1/+2 only while you control a Forest", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const ape = spawn(game, "Kird Ape", A);
    expect(game.characteristics(ape).power).toBe(1);
    expect(game.characteristics(ape).toughness).toBe(1);

    const forest = spawn(game, "Forest", A);
    expect(game.characteristics(ape).power).toBe(2);
    expect(game.characteristics(ape).toughness).toBe(3);

    // A Forest an opponent controls doesn't count.
    const oppForest = spawn(game, "Forest", B);
    game.state.zones.shared.battlefield = game.state.zones.shared.battlefield.filter(
      (x) => x !== forest,
    );
    game.state.objects[forest].zone = "graveyard";
    game.state.zones.perPlayer[A].graveyard.push(forest);
    expect(game.characteristics(ape).power).toBe(1);
    expect(game.characteristics(ape).toughness).toBe(1);
    expect(game.state.objects[oppForest].controller).toBe(B);
  });

  it("Werebear — threshold +3/+3 at 7+ cards in your graveyard", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const bear = spawn(game, "Werebear", A);
    for (let i = 0; i < 6; i += 1) spawn(game, "Swamp", A, "graveyard");
    expect(game.characteristics(bear).power).toBe(1);

    spawn(game, "Swamp", A, "graveyard"); // 7th
    expect(game.characteristics(bear).power).toBe(4);
    expect(game.characteristics(bear).toughness).toBe(4);

    // The mana ability is unaffected by threshold.
    game.dispatch({ type: "activate-ability", player: A, source: bear, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.G).toBe(1);
  });

  it("Ardent Recruit — metalcraft +1/+1 at 3+ artifacts", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const recruit = spawn(game, "Ardent Recruit", A);
    spawn(game, "Bonesplitter", A);
    spawn(game, "Bonesplitter", A);
    expect(game.characteristics(recruit).power).toBe(1);

    spawn(game, "Bonesplitter", A); // 3rd artifact
    expect(game.characteristics(recruit).power).toBe(2);
    expect(game.characteristics(recruit).toughness).toBe(2);
  });
});

describe("cost modification is evaluated against the face being cast", () => {
  // Regression: Thalia taxes noncreature spells. An adventure card's creature
  // half is a creature (untaxed); its adventure half is an instant (taxed +1).
  // `whyCannotCastSpell` must set the chosen face before consulting
  // `costModification`, or `legalActions` offers a cast `castSpell` then refuses.
  it("Thalia taxes an adventure's instant half but not its creature half", () => {
    const { game } = mkGame(["Emberclaw Scout"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Thalia, Guardian of Thraben", B);
    spawn(game, "Mountain", A);
    const dummy = spawn(game, "Grizzly Bears", B);
    const card = inHand(game, "Emberclaw Scout");

    // One Mountain: {R}. Ember Dart is {R} + Thalia's {1} = {1}{R} — unaffordable.
    const casts1 = game
      .legalActions(A)
      .filter((x) => x.kind === "cast-spell" && "card" in x && x.card === card);
    expect(casts1.map((x) => "face" in x ? x.face : undefined).sort()).toEqual([]);

    spawn(game, "Mountain", A); // now {R}{R} → {1}{R} affordable
    const casts2 = game
      .legalActions(A)
      .filter((x) => x.kind === "cast-spell" && "card" in x && x.card === card);
    expect(casts2.some((x) => "face" in x && x.face === 1)).toBe(true);

    // And it actually casts (no "cannot pay" throw) — Ember Dart, {1}{R}.
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      face: 1,
      targets: [{ kind: "object", object: dummy }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[dummy].zone).toBe("graveyard"); // 2 damage killed the 2/2
    expect(game.state.objects[card].zone).toBe("exile"); // adventure → exile
  });
});
