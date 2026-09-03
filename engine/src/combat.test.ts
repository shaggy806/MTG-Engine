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
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

interface Setup {
  game: Game;
  a: ScriptedController;
  b: ScriptedController;
}

const makeGame = (rules: Record<string, unknown> = {}): Setup => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, ...rules },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: opts.tapped ?? false,
    damageMarked: 0,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    sourceObjectId: null,
    abilityIndex: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

describe("declaring attackers", () => {
  it("an unblocked attacker deals its power to the defending player and taps", () => {
    const { game, a } = makeGame();
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[bear].tapped).toBe(true);
    expect(game.eventsOfType("attacker-declared")).toHaveLength(1);
  });

  it("a vigilant attacker does not tap", () => {
    const { game, a } = makeGame();
    const angel = spawn(game, "Serra Angel", A);
    a.declareAttackersFn = () => [{ attacker: angel, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[angel].tapped).toBe(false);
    expect(game.state.players[B].life).toBe(16);
  });

  it("a creature with haste can attack the turn it appears", () => {
    const { game, a } = makeGame();
    const goblin = spawn(game, "Raging Goblin", A, { sick: true });
    a.declareAttackersFn = () => [{ attacker: goblin, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(19);
  });

  it("a creature without haste can't attack the turn it appears", () => {
    const { game, a } = makeGame();
    const bear = spawn(game, "Grizzly Bears", A, { sick: true });
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/summoning sickness/);
  });

  it("a creature with defender can't attack", () => {
    const { game, a } = makeGame();
    const wall = spawn(game, "Wall of Wood", A);
    a.declareAttackersFn = () => [{ attacker: wall, defender: B }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/defender/);
  });

  it("a tapped creature can't attack", () => {
    const { game, a } = makeGame();
    const bear = spawn(game, "Grizzly Bears", A, { tapped: true });
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/tapped/);
  });
});

describe("blocking", () => {
  it("equal creatures trade", () => {
    const { game, a, b } = makeGame();
    const attacker = spawn(game, "Grizzly Bears", A);
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker }];

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[attacker].zone).toBe("graveyard");
    expect(game.state.objects[blocker].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
    expect(game.eventsOfType("blocker-declared")).toHaveLength(1);
  });

  it("a blocked attacker survives a smaller blocker; no damage reaches the player", () => {
    const { game, a, b } = makeGame();
    const giant = spawn(game, "Hill Giant", A); // 3/3
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: giant }];

    game.advanceUntil(toPostcombat);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(game.state.players[B].life).toBe(20);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[giant].damageMarked).toBe(0);
  });

  it("auto-assigns minimum lethal damage down the blocker order", () => {
    const { game, a, b } = makeGame();
    const giant = spawn(game, "Hill Giant", A); // 3/3
    const bear1 = spawn(game, "Grizzly Bears", B); // 2/2
    const bear2 = spawn(game, "Grizzly Bears", B); // 2/2
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: bear1, attacker: giant },
      { blocker: bear2, attacker: giant },
    ];
    a.orderBlockersFn = () => [bear1, bear2];

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[bear1].zone).toBe("graveyard"); // took 2
    expect(game.state.objects[bear2].zone).toBe("battlefield"); // took 1
    expect(game.state.objects[bear2].damageMarked).toBe(1);
    expect(game.state.objects[giant].zone).toBe("graveyard"); // took 2 + 2
  });

  it("a non-flyer can't block a flyer", () => {
    const { game, a, b } = makeGame();
    const angel = spawn(game, "Serra Angel", A);
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: angel, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: angel }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/flying/);
  });

  it("reach can block a flyer", () => {
    const { game, a, b } = makeGame();
    const angel = spawn(game, "Serra Angel", A); // 4/4 flying
    const spider = spawn(game, "Giant Spider", B); // 2/4 reach
    a.declareAttackersFn = () => [{ attacker: angel, defender: B }];
    b.declareBlockersFn = () => [{ blocker: spider, attacker: angel }];

    game.advanceUntil(toPostcombat);
    expect(game.state.objects[angel].zone).toBe("battlefield"); // 2 marked
    expect(game.state.objects[spider].zone).toBe("graveyard"); // 4 marked = lethal
    expect(game.state.players[B].life).toBe(20);
  });

  it("rejects a blocker assigned to a creature that isn't attacking", () => {
    const { game, a, b } = makeGame();
    const attacker = spawn(game, "Grizzly Bears", A);
    const idle = spawn(game, "Hill Giant", A);
    const blocker = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker: idle }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/not attacking/);
  });
});

describe("combat outcomes", () => {
  it("lethal combat damage ends the game", () => {
    const { game, a } = makeGame();
    game.state.players[B].life = 2;
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];

    game.advance();
    expect(game.isOver).toBe(true);
    expect(game.winner).toBe(A);
  });

  it("default controllers never attack", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false },
      decks: [
        { player: A, cards: pad([]) },
        { player: B, cards: pad([]) },
      ],
    });
    const bear = spawn(game, "Grizzly Bears", A);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bear].tapped).toBe(false);
    expect(game.state.players[B].life).toBe(20);
  });

  it("snapshots and restores with attackers and blockers declared", () => {
    const { game, a, b } = makeGame();
    const giant = spawn(game, "Hill Giant", A);
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: giant }];

    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);

    restored.advanceUntil((s) => s.turn.number === 2);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(restored.state.objects[bear].zone).toBe("graveyard");
    expect(restored.state.objects[giant].zone).toBe(
      game.state.objects[giant].zone,
    );
  });
});
