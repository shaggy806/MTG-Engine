/**
 * `PlayerView.decisionSource` — the card behind a pending decision.
 *
 * A sacrifice or discard effect raises its prompt after the spell that
 * ordered it has already left the stack, so without this a player facing a
 * forced choice had nothing on screen saying where it came from.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const mkGame = (aCards: readonly string[], bCards: readonly string[] = []) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });

const toPrecombat = (s: GameState): boolean => s.turn.step === "precombat-main";

const handCard = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
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
    counters: {},
    modifiers: [],
    timestamp: game.state.timestampSeq,
    isToken: false,
    attachedTo: null,
    isCommander: false,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

describe("PlayerView.decisionSource", () => {
  it("names the edict that made an opponent sacrifice, after it left the stack", () => {
    const game = mkGame(["Diabolic Edict"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Raging Goblin", B);
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);
    const edict = handCard(game, A, "Diabolic Edict");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: edict,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "sacrifice");

    // The edict itself is in A's graveyard by now — the whole point.
    expect(game.state.objects[edict].zone).toBe("graveyard");
    const view = game.viewFor(B);
    expect(view.decisionSource).toEqual({ object: edict, cardName: "Diabolic Edict" });
    // And the deciding player can actually render it: a graveyard is public.
    expect(view.objects[edict]).toBeDefined();
  });

  it("names the spell behind a forced discard", () => {
    const game = mkGame(["Mind Rot"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp", A);
    const mindRot = handCard(game, A, "Mind Rot");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: mindRot,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "discard");

    expect(game.viewFor(B).decisionSource).toMatchObject({ cardName: "Mind Rot" });
  });

  it("is null once the decision is answered and priority comes back round", () => {
    const game = mkGame(["Diabolic Edict"]);
    game.advanceUntil(toPrecombat);
    const goblin = spawn(game, "Raging Goblin", B);
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Swamp", A);
    spawn(game, "Swamp", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, A, "Diabolic Edict"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "sacrifice");
    game.dispatch({ type: "sacrifice", player: B, permanents: [goblin] });
    game.advanceUntil((s) => s.awaiting === null && s.zones.shared.stack.length === 0);

    expect(game.state.decisionSource).toBeNull();
    expect(game.viewFor(B).decisionSource).toBeNull();
  });

  it("is null for the decisions no single card causes — declaring attackers", () => {
    const game = mkGame([]);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    expect(game.viewFor(A).decisionSource).toBeNull();
  });

  /**
   * The three decisions raised *outside* a resolution.
   *
   * `state.decisionSource` is only set by `Game.withDecisionSource`, which
   * wraps resolving a spell or an ability. A decision raised while an action
   * is being taken — paying a cost, cycling a card — ran outside all of that,
   * and `choose-from-zone`, `discard` and `sacrifice` carry no `source` field
   * of their own to fall back on, so the prompt named nothing (or whatever was
   * left over). Each of these fails without its fix in `game.ts`.
   */
  describe("decisions raised outside a resolution", () => {
    it("names the cycled card behind a landcycling search", () => {
      const game = mkGame(["Migratory Route"]);
      game.advanceUntil(toPrecombat);
      for (let i = 0; i < 2; i += 1) spawn(game, "Swamp", A);
      const route = handCard(game, A, "Migratory Route");

      game.dispatch({ type: "cycle", player: A, card: route });
      expect(game.state.awaiting?.kind).toBe("choose-from-zone");

      // Cycling discards the card as part of its cost, so — as with the edict
      // — the card naming the decision is already in the graveyard.
      expect(game.state.objects[route].zone).toBe("graveyard");
      expect(game.viewFor(A).decisionSource).toEqual({
        object: route,
        cardName: "Migratory Route",
      });
    });

    it("names the spell whose additional cost is the discard", () => {
      const game = mkGame(["Thrill of Possibility", "Grizzly Bears", "Raging Goblin"]);
      game.advanceUntil(toPrecombat);
      for (let i = 0; i < 2; i += 1) spawn(game, "Mountain", A);
      const thrill = handCard(game, A, "Thrill of Possibility");

      game.dispatch({ type: "cast-spell", player: A, card: thrill, targets: [] });
      expect(game.state.awaiting?.kind).toBe("discard");

      // Asked while the spell is still on the stack, not as it resolves.
      expect(game.state.objects[thrill].zone).toBe("stack");
      expect(game.viewFor(A).decisionSource).toEqual({
        object: thrill,
        cardName: "Thrill of Possibility",
      });
    });
  });

  it("names the spell doing the renaming, not the creature renamed", () => {
    const game = mkGame(["Artificial Evolution"]);
    game.advanceUntil(toPrecombat);
    const bears = spawn(game, "Grizzly Bears", A);
    spawn(game, "Island", A);
    const evolution = handCard(game, A, "Artificial Evolution");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: evolution,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-text");

    // `choose-text` is the one kind carrying both: `target` is the creature
    // being renamed, `source` is the spell asking. They used to be the same
    // id, so the prompt answered "why am I being asked about Grizzly Bears?"
    // with "Grizzly Bears".
    expect(game.viewFor(A).decisionSource).toEqual({
      object: evolution,
      cardName: "Artificial Evolution",
    });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind === "choose-text" && awaiting.target).toBe(bears);
  });
});
