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
  ...Array(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const attach = (game: Game, aura: ObjectId, host: ObjectId): void => {
  game.state.objects[aura].attachedTo = host;
};

const mkGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const eligibleAttackers = (game: Game): readonly ObjectId[] => {
  const la = game.legalActions(A).find((x) => x.kind === "declare-attackers");
  return la?.kind === "declare-attackers" ? la.eligible : [];
};

describe("Pacifism — can't attack or block", () => {
  it("keeps the pacified creature out of the eligible-attacker list", () => {
    const { game } = mkGame();
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const pacified = spawn(game, "Grizzly Bears", A);
    const free = spawn(game, "Grizzly Bears", A);
    const pacifism = spawn(game, "Pacifism", A);
    attach(game, pacifism, pacified);

    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(eligibleAttackers(game)).toContain(free);
    expect(eligibleAttackers(game)).not.toContain(pacified);

    // Aura gone → free again.
    game.state.objects[pacifism].zone = "graveyard";
    game.state.zones.shared.battlefield = game.state.zones.shared.battlefield.filter(
      (id) => id !== pacifism,
    );
    game.state.objects[pacified].attachedTo = null;
    expect(eligibleAttackers(game)).toContain(pacified);
  });

  it("a pacified blocker can't block, so the attacker connects", () => {
    const { game, a } = mkGame();
    const attacker = spawn(game, "Grizzly Bears", A);
    const blocker = spawn(game, "Hill Giant", B);
    const pacifism = spawn(game, "Pacifism", B);
    attach(game, pacifism, blocker);
    a.declareAttackersFn = () => [{ attacker, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(18); // took 2 — the block was impossible
  });
});

describe("Juggernaut — must attack each combat if able", () => {
  it("is auto-declared even when the player declares no attackers", () => {
    const { game, a } = mkGame();
    const jug = spawn(game, "Juggernaut", A);
    a.declareAttackersFn = () => [];

    game.advanceUntil(toPostcombat);
    expect(game.eventsOfType("attacker-declared").some((e) => e.attacker === jug)).toBe(true);
    expect(game.state.players[B].life).toBe(15); // 5 damage
  });

  it("is not forced while pacified", () => {
    const { game, a } = mkGame();
    const jug = spawn(game, "Juggernaut", A);
    const pacifism = spawn(game, "Pacifism", A);
    attach(game, pacifism, jug);
    a.declareAttackersFn = () => [];

    game.advanceUntil(toPostcombat);
    expect(game.eventsOfType("attacker-declared").some((e) => e.attacker === jug)).toBe(false);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Invisible Stalker — can't be blocked", () => {
  it("connects even with a would-be blocker on the board", () => {
    const { game, a } = mkGame();
    const stalker = spawn(game, "Invisible Stalker", A);
    spawn(game, "Hill Giant", B); // a 3/3 that would love to block, but can't
    a.declareAttackersFn = () => [{ attacker: stalker, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(19);
  });
});
