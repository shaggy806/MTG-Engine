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

const makeGame = (aCards: readonly string[] = ["Act of Treason"]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
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
  game.state.objects[id] = {
    id,
    cardName,
    owner,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false,
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

const giveLands = (game: Game, p: PlayerId, n: number, name = "Mountain"): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, p);
};

const handCard = (game: Game, p: PlayerId, name: string): ObjectId => {
  const id = game.state.zones.perPlayer[p].hand.find(
    (x) => game.state.objects[x].cardName === name,
  );
  if (id === undefined) throw new Error(`no ${name} in ${p}'s hand`);
  return id;
};

const atFirstMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("Act of Treason", () => {
  it("hands control to the caster, untapped and hasty, and lets it attack now", () => {
    const { game, a } = makeGame();
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 3);
    const bear = spawn(game, "Grizzly Bears", B);
    game.state.objects[bear].tapped = true;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Act of Treason")!,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bear].controller).toBe(A);
    expect(game.state.objects[bear].tapped).toBe(false);
    expect(game.characteristics(bear).keywords.has("haste")).toBe(true);

    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(18);
  });

  it("reverts control to the owner at end of turn", () => {
    const { game } = makeGame();
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 3);
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Act of Treason")!,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil((s) => s.turn.number === 2);

    expect(game.state.objects[bear].controller).toBe(B);
    expect(game.state.objects[bear].controlEndsAtCleanup).toBe(false);
    expect(game.characteristics(bear).keywords.has("haste")).toBe(false);
  });

  it("a stolen creature that dies goes to its owner's graveyard", () => {
    const { game } = makeGame();
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 3);
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Act of Treason")!,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[bear].controller).toBe(A);

    // Kill it while Alice controls it.
    game.state.objects[bear].damageMarked = 99;
    game.advanceUntil((s) => game.state.objects[bear].zone === "graveyard" || s.turn.number > 1);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.graveyardOf(B)).toContain(bear);
    expect(game.graveyardOf(A)).not.toContain(bear);
    expect(game.state.objects[bear].controller).toBe(B);
  });
});

describe("Mind Control (permanent control via an Aura)", () => {
  it("gives the caster lasting control of the enchanted creature", () => {
    const { game } = makeGame(["Mind Control"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 5, "Island");
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Mind Control"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[bear].controller).toBe(A);
    // Still Alice's a turn later — no cleanup revert.
    game.advanceUntil((s) => s.turn.number === 3);
    expect(game.state.objects[bear].controller).toBe(A);
  });

  it("reverts control when the Aura is destroyed", () => {
    const { game } = makeGame(["Mind Control", "Disenchant"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 5, "Island");
    giveLands(game, A, 2, "Plains");
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Mind Control"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    const aura = game.battlefield.find((id) => game.state.objects[id].cardName === "Mind Control")!;
    expect(game.state.objects[bear].controller).toBe(A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Disenchant"),
      targets: [{ kind: "object", object: aura }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[aura].zone).toBe("graveyard");
    expect(game.state.objects[bear].controller).toBe(B);
  });

  it("the Aura falls off to the graveyard if the stolen creature dies", () => {
    const { game } = makeGame(["Mind Control"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, 5, "Island");
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Mind Control"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    const aura = game.battlefield.find((id) => game.state.objects[id].cardName === "Mind Control")!;

    game.state.objects[bear].damageMarked = 99;
    game.advanceUntil((s) => game.state.objects[bear].zone === "graveyard" || s.turn.number > 1);

    expect(game.graveyardOf(B)).toContain(bear); // owner's graveyard
    expect(game.state.objects[aura].zone).toBe("graveyard");
  });
});
