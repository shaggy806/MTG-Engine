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
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

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
  return { game, a, b };
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  owner: PlayerId = controller,
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const mana = (game: Game): void => {
  for (let i = 0; i < 4; i += 1) spawn(game, "Mountain", A);
  for (let i = 0; i < 3; i += 1) spawn(game, "Plains", A);
};
const bolt = (game: Game, target: { kind: "player"; player: PlayerId } | { kind: "object"; object: ObjectId }) => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: inHand(game, "Lightning Bolt"),
    targets: [target],
  });
  game.advanceUntil(settled);
};

describe("EG-6 — one-shot damage-prevention shields (Sunlit Bastion)", () => {
  it("absorbs damage across multiple hits, then lapses", () => {
    const { game } = mkGame([
      "Sunlit Bastion",
      "Sunlit Bastion",
      "Lightning Bolt",
      "Lightning Bolt",
      "Lightning Bolt",
    ]);
    game.advanceUntil(toPrecombat);
    mana(game);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sunlit Bastion"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.preventionShields).toHaveLength(1);

    bolt(game, { kind: "player", player: B }); // 3 prevented, 1 left on the shield
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.preventionShields[0]?.amount).toBe(1);

    bolt(game, { kind: "player", player: B }); // 1 prevented, 2 through
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.preventionShields).toHaveLength(0);

    // A fresh turn clears any leftover shields (there are none, but re-shield
    // then roll the turn to prove it lapses).
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sunlit Bastion"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(game.state.preventionShields).toHaveLength(0);
    bolt(game, { kind: "player", player: B });
    expect(game.state.players[B].life).toBe(15); // full 3
  });

  it("shields a creature — a lethal burn spell is prevented", () => {
    const { game } = mkGame(["Sunlit Bastion", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    mana(game);
    const bear = spawn(game, "Grizzly Bears", B); // 2/2

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Sunlit Bastion"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    bolt(game, { kind: "object", object: bear });

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].damageMarked).toBe(0);
  });
});

describe("EG-6 — filtered graveyard exile (Anafenza, the Foremost)", () => {
  it("exiles a creature an opponent owns that would die, but not your own", () => {
    const { game } = mkGame(["Lightning Bolt", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    mana(game);
    spawn(game, "Anafenza, the Foremost", A);
    const mine = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Grizzly Bears", B);

    bolt(game, { kind: "object", object: theirs });
    expect(game.state.objects[theirs].zone).toBe("exile");

    bolt(game, { kind: "object", object: mine });
    expect(game.state.objects[mine].zone).toBe("graveyard"); // filter is opponent-owned only
  });
});

describe("EG-6 — would-draw redirect (Notion Thief)", () => {
  it("an opponent's draw becomes your draw; your own draws are untouched", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    mana(game);
    spawn(game, "Notion Thief", A);

    const aHand0 = game.handOf(A).length;
    const bHand0 = game.handOf(B).length;

    // Roll to bob's draw step.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.handOf(B).length).toBe(bHand0); // bob drew nothing
    expect(game.handOf(A).length).toBe(aHand0 + 1); // alice drew instead
    expect(game.eventsOfType("draw-redirected").length).toBeGreaterThan(0);

    // Alice's own turn-3 draw is a normal draw.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(game.handOf(A).length).toBe(aHand0 + 2);
  });
});
