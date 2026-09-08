import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[], land = "Mountain"): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(land),
];

const makeGame = (aCards: readonly string[] = [], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  return { game, a, b };
};

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false,
    loyaltyActivatedThisTurn: false,
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
  } as GameState["objects"][string];
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const atMain = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("ROADMAP Phase 11 EG-1 — targeting decisions", () => {
  it("a targeted dies trigger raises a choose-targets decision its controller answers", () => {
    const { game, b } = makeGame(["Lightning Bolt"]);
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", A);
    const ghoul = spawn(game, "Vengeful Ghoul", B); // "when ~ dies, 2 damage to any target"
    const decoy = spawn(game, "Grizzly Bears", A);
    game.advanceUntil(atMain);

    const bolt = game.handOf(A).find((i) => game.state.objects[i].cardName === "Lightning Bolt")!;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "object", object: ghoul }],
    });

    // The bolt resolves, the Ghoul dies, its dies trigger needs a target — the
    // stack is momentarily empty but the game is *not* settled.
    game.advanceUntil((s) => s.awaiting !== null);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    expect(game.state.awaiting?.player).toBe(B); // the Ghoul's controller
    const la = game.legalActions(B);
    expect(la).toHaveLength(1);
    expect(la[0].kind).toBe("choose-targets");

    // Bob points the Ghoul's parting shot at Alice's Bears.
    b.chooseTargetsFn = () => [{ kind: "object", object: decoy }];
    game.advanceUntil(settled);

    expect(game.state.objects[decoy].zone).toBe("graveyard"); // 2/2 took 2
    expect(
      game.eventsOfType("ability-triggered").some((e) => e.source === ghoul),
    ).toBe(true);
  });

  it("a suspended spell coming off suspend lets its controller pick the target", () => {
    const { game, a } = makeGame(["Rift Bolt"]);
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", A);
    const beefy = spawn(game, "Craw Wurm", B); // 6/4 — survives Rift Bolt's 3
    const frail = spawn(game, "Grizzly Bears", B); // 2/2 — dies to it
    game.advanceUntil(atMain);

    const bolt = game.handOf(A).find((i) => game.state.objects[i].cardName === "Rift Bolt")!;
    game.dispatch({ type: "suspend", player: A, card: bolt });

    // Alice's next upkeep: the time counter comes off, the spell is cast free
    // and needs a target.
    let sawChoice = false;
    a.chooseTargetsFn = (_v, _s, _sp, opts) => {
      sawChoice = true;
      expect(game.state.awaiting?.kind).toBe("choose-targets");
      expect(game.state.awaiting?.player).toBe(A);
      void opts;
      return [{ kind: "object", object: frail }];
    };
    game.advanceUntil((s) => s.turn.number >= 3 && s.turn.step === "postcombat-main");
    expect(sawChoice).toBe(true);

    game.advanceUntil(settled);
    expect(game.state.objects[frail].zone).toBe("graveyard");
    expect(game.state.objects[beefy].damageMarked).toBe(0);
  });

  it("an auto-filled target slot (a saboteur's victim) is not a decision", () => {
    const { game, a } = makeGame();
    const specter = spawn(game, "Hypnotic Specter", A); // combat dmg → that player discards
    // Keep a card in Bob's hand to discard.
    a.declareAttackersFn = () => [{ attacker: specter, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    game.advanceUntil(settled);

    // The trigger's one target slot was auto-filled with Bob — no decision.
    expect(game.state.eventLog.some((e) => e.type === "priority-received")).toBe(true);
    expect(game.eventsOfType("ability-triggered").some((e) => e.source === specter)).toBe(true);
    expect(
      game.state.eventLog.filter((e) => e.type === "cards-discarded" && e.player === B),
    ).toHaveLength(1);
  });
});
