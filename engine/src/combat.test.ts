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
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    summoningSick: opts.sick ?? false,
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
    counters: {},
    modifiers: [],
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

    // Wait until the blockers have actually been declared (it is an action now).
    game.advanceUntil(
      (s) => s.turn.step === "declare-blockers" && s.awaiting === null,
    );
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

describe("combat keywords", () => {
  const zone = (game: Game, id: ObjectId): string =>
    game.state.objects[id].zone;

  it("first strike kills the blocker before it deals damage back", () => {
    const { game, a, b } = makeGame();
    const knight = spawn(game, "White Knight", A); // 2/2 first strike
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    a.declareAttackersFn = () => [{ attacker: knight, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: knight }];

    game.advanceUntil(toPostcombat);
    expect(zone(game, bear)).toBe("graveyard");
    expect(zone(game, knight)).toBe("battlefield");
    expect(game.state.objects[knight].damageMarked).toBe(0);
  });

  it("first strike vs first strike is simultaneous", () => {
    const { game, a, b } = makeGame();
    const attacker = spawn(game, "White Knight", A);
    const blocker = spawn(game, "White Knight", B);
    a.declareAttackersFn = () => [{ attacker, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker }];

    game.advanceUntil(toPostcombat);
    expect(zone(game, attacker)).toBe("graveyard");
    expect(zone(game, blocker)).toBe("graveyard");
  });

  it("double strike deals damage unblocked twice", () => {
    const { game, a } = makeGame();
    const ace = spawn(game, "Fencing Ace", A); // 1/1 double strike
    a.declareAttackersFn = () => [{ attacker: ace, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(18);
  });

  it("double strike deals damage to a blocker in both passes", () => {
    const { game, a, b } = makeGame();
    const ace = spawn(game, "Fencing Ace", A); // 1/1 double strike
    const baloth = spawn(game, "Rumbling Baloth", B); // 4/4
    a.declareAttackersFn = () => [{ attacker: ace, defender: B }];
    b.declareBlockersFn = () => [{ blocker: baloth, attacker: ace }];

    game.advanceUntil(toPostcombat);
    expect(game.state.objects[baloth].damageMarked).toBe(2); // 1 + 1
    expect(zone(game, ace)).toBe("graveyard");
  });

  it("trample carries excess damage to the defending player", () => {
    const { game, a, b } = makeGame();
    const wurm = spawn(game, "Craw Wurm", A); // 6/4 trample
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: wurm }];

    game.advanceUntil(toPostcombat);
    expect(zone(game, bear)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(16); // 20 - (6 - 2)
  });

  it("trample assigns lethal to each blocker before the player", () => {
    const { game, a, b } = makeGame();
    const wurm = spawn(game, "Craw Wurm", A); // 6/4 trample
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    const giant = spawn(game, "Hill Giant", B); // 3/3
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: bear, attacker: wurm },
      { blocker: giant, attacker: wurm },
    ];
    a.orderBlockersFn = () => [bear, giant];

    game.advanceUntil(toPostcombat);
    expect(zone(game, bear)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(19); // 20 - (6 - 2 - 3)
  });

  it("deathtouch lets a trampler assign just 1 to each blocker", () => {
    const { game, a, b } = makeGame();
    const rats = spawn(game, "Typhoid Rats", A); // 1/1 deathtouch
    // Grant it +5/+5 and trample for a 6/6 deathtouch trampler.
    game.state.objects[rats].modifiers.push({
      power: 5,
      toughness: 5,
      keywords: ["trample"],
      untilEndOfTurn: false,
    });
    const bear = spawn(game, "Grizzly Bears", B); // 2/2
    const giant = spawn(game, "Hill Giant", B); // 3/3
    a.declareAttackersFn = () => [{ attacker: rats, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: bear, attacker: rats },
      { blocker: giant, attacker: rats },
    ];
    a.orderBlockersFn = () => [bear, giant];

    game.advanceUntil(toPostcombat);
    expect(zone(game, bear)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.state.players[B].life).toBe(16); // 20 - (6 - 1 - 1)
  });

  it("deathtouch makes any amount of damage lethal", () => {
    const { game, a, b } = makeGame();
    const baloth = spawn(game, "Rumbling Baloth", A); // 4/4
    const rats = spawn(game, "Typhoid Rats", B); // 1/1 deathtouch
    a.declareAttackersFn = () => [{ attacker: baloth, defender: B }];
    b.declareBlockersFn = () => [{ blocker: rats, attacker: baloth }];

    game.advanceUntil(toPostcombat);
    expect(zone(game, rats)).toBe("graveyard");
    expect(zone(game, baloth)).toBe("graveyard"); // 1 deathtouch damage
  });

  it("lifelink gains the controller life on combat damage", () => {
    const { game, a } = makeGame();
    const hawk = spawn(game, "Vampire Nighthawk", A); // 2/3 flying deathtouch lifelink
    a.declareAttackersFn = () => [{ attacker: hawk, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.players[A].life).toBe(22);
  });

  it("lifelink triggers on damage to a blocker too", () => {
    const { game, a, b } = makeGame();
    const hawk = spawn(game, "Vampire Nighthawk", A); // 2/3 flying deathtouch lifelink
    const spider = spawn(game, "Giant Spider", B); // 2/4 reach
    a.declareAttackersFn = () => [{ attacker: hawk, defender: B }];
    b.declareBlockersFn = () => [{ blocker: spider, attacker: hawk }];

    game.advanceUntil(toPostcombat);
    expect(zone(game, spider)).toBe("graveyard"); // 2 deathtouch damage
    expect(zone(game, hawk)).toBe("battlefield");
    expect(game.state.players[A].life).toBe(22); // +2 from lifelink
  });

  it("menace rejects a lone blocker", () => {
    const { game, a, b } = makeGame();
    const brute = spawn(game, "Boggart Brute", A); // 3/2 menace
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: brute, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: brute }];

    expect(() => game.advanceUntil(toPostcombat)).toThrow(/menace/);
  });

  it("menace accepts two blockers", () => {
    const { game, a, b } = makeGame();
    const brute = spawn(game, "Boggart Brute", A); // 3/2 menace
    const bear1 = spawn(game, "Grizzly Bears", B);
    const bear2 = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: brute, defender: B }];
    b.declareBlockersFn = () => [
      { blocker: bear1, attacker: brute },
      { blocker: bear2, attacker: brute },
    ];
    a.orderBlockersFn = () => [bear1, bear2];

    game.advanceUntil(toPostcombat);
    expect(zone(game, brute)).toBe("graveyard"); // 4 damage from two bears
    expect(game.state.players[B].life).toBe(20);
  });

  it("menace lets the attacker through unblocked", () => {
    const { game, a } = makeGame();
    const brute = spawn(game, "Boggart Brute", A); // 3/2 menace
    a.declareAttackersFn = () => [{ attacker: brute, defender: B }];

    game.advanceUntil(toPostcombat);
    expect(game.state.players[B].life).toBe(17);
  });
});
