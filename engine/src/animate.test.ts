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

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
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
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const atFirstMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

const animate = (game: Game, source: ObjectId): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex: 1 });
  game.advanceUntil(stackEmpty);
};

describe("man-lands (layer 4 — type-change / animation)", () => {
  it("Mishra's Factory becomes a 2/2 artifact creature and is still a land", () => {
    const { game } = makeGame();
    const factory = spawn(game, "Mishra's Factory", A);
    spawn(game, "Forest", A); // pays the {1}
    game.advanceUntil(atFirstMain);

    expect(game.characteristics(factory)).toMatchObject({ power: 0, toughness: 0 });
    animate(game, factory);

    const c = game.characteristics(factory);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(2);
    expect(c.types).toEqual(expect.arrayContaining(["land", "artifact", "creature"]));
    expect(c.subtypes).toContain("Assembly-Worker");

    const view = game.viewFor(A).objects[factory];
    expect(view.power).toBe(2);
    expect(view.types).toContain("land");
    expect(game.eventsOfType("permanent-animated")).toHaveLength(1);
  });

  it("Blinkmoth Nexus animates with flying", () => {
    const { game } = makeGame();
    const nexus = spawn(game, "Blinkmoth Nexus", A);
    spawn(game, "Forest", A);
    game.advanceUntil(atFirstMain);
    animate(game, nexus);

    expect(game.characteristics(nexus).keywords.has("flying")).toBe(true);
    expect(game.characteristics(nexus)).toMatchObject({ power: 1, toughness: 1 });
  });

  it("an animated man-land can attack", () => {
    const { game, a } = makeGame();
    const factory = spawn(game, "Mishra's Factory", A);
    spawn(game, "Forest", A);
    game.advanceUntil(atFirstMain);
    animate(game, factory);

    a.declareAttackersFn = () => [{ attacker: factory, defender: B }];
    game.advanceUntil(toPostcombat);

    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[factory].tapped).toBe(true);
  });

  it("a man-land played this turn is summoning sick and cannot attack", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
      controllers: { [A]: a, [B]: b },
      decks: [
        { player: A, cards: pad(["Mishra's Factory"]) },
        { player: B, cards: pad([]) },
      ],
    });
    spawn(game, "Forest", A); // pays the {1}
    spawn(game, "Grizzly Bears", A); // a legal companion so attackers are asked at all
    game.advanceUntil(atFirstMain);
    const factory = game.handOf(A).find(
      (id) => game.state.objects[id].cardName === "Mishra's Factory",
    )!;
    game.dispatch({ type: "play-land", player: A, card: factory });
    animate(game, factory);

    a.declareAttackersFn = () => [{ attacker: factory, defender: B }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/summoning sickness/);
  });

  it("the animation wears off at end of turn — the land survives as a 0/0", () => {
    const { game } = makeGame();
    const factory = spawn(game, "Mishra's Factory", A);
    spawn(game, "Forest", A);
    game.advanceUntil(atFirstMain);
    animate(game, factory);

    game.advanceUntil((s) => s.turn.number === 2);

    expect(game.state.objects[factory].zone).toBe("battlefield");
    expect(game.state.objects[factory].modifiers).toHaveLength(0);
    const c = game.characteristics(factory);
    expect(c.types).not.toContain("creature");
  });

  it("an animated man-land dealt lethal damage dies as a state-based action", () => {
    const { game } = makeGame();
    const factory = spawn(game, "Mishra's Factory", A);
    spawn(game, "Forest", A);
    game.advanceUntil(atFirstMain);
    animate(game, factory);

    game.state.objects[factory].damageMarked = 2;
    game.advanceUntil(
      (s) => game.state.objects[factory].zone === "graveyard" || s.turn.number > 1,
    );

    expect(game.state.objects[factory].zone).toBe("graveyard");
  });
});
