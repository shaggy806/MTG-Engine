import { describe, expect, it } from "vitest";

import { AutomaticController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * Rule 903.9a as it reads today: "If a commander is in a graveyard or in exile
 * and that object was put into that zone since the last time state-based
 * actions were checked, its owner may put it into the command zone. This is a
 * state-based action." So a commander dies — its own "dies" trigger, and
 * everyone else's, see it — before its owner is asked, and one put into a
 * graveyard or exile from anywhere at all is asked about: discarded, milled,
 * countered. Rule 903.9b (a hand or a library) stays a replacement effect.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);

function table(active: PlayerId = A): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil(
    (s) =>
      s.turn.step === "precombat-main" &&
      s.turnOrder[s.turn.activePlayerIndex] === active &&
      s.priority.holder === active,
  );
  return game;
}

function spawn(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" = "battlefield"): ObjectId {
  return game.debugSpawn(name, owner, zone, { summoningSick: false });
}

function commander(game: Game, name: string, owner: PlayerId, zone: "battlefield" | "hand" = "battlefield"): ObjectId {
  const id = spawn(game, name, owner, zone);
  game.state.objects[id].isCommander = true;
  return id;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

/** What follows any real change to the game: state-based actions are checked
 * as a player would get priority (rule 117.5). `debugApplyEffect` stops short
 * of it. */
function checkStateBasedActions(game: Game): void {
  const holder = game.state.priority.holder as PlayerId;
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(holder);
}

/**
 * Passes priority until the stack is empty, answering every commander choice
 * with `toCommandZone` and recording each as "owner:cardName@zone" (the zone
 * it was offered from). Targets for triggers are `targets`.
 */
function settle(game: Game, toCommandZone: boolean, targets: TargetRef[] = []): string[] {
  const asked: string[] = [];
  for (let i = 0; i < 300; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "commander-replacement") {
      const card = game.state.objects[awaiting.commander];
      asked.push(`${awaiting.player}:${card.cardName}@${card.zone}`);
      game.dispatch({ type: "commander-replacement", player: awaiting.player, toCommandZone });
      continue;
    }
    if (awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: awaiting.player, targets });
      continue;
    }
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return asked;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("never settled");
}

function cast(game: Game, player: PlayerId, name: string, targets: TargetRef[] = []): ObjectId {
  const card = spawn(game, name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets });
  return card;
}

function lands(game: Game, name: string, player: PlayerId, count: number): void {
  for (let i = 0; i < count; i += 1) spawn(game, name, player);
}

describe("a commander dies before its owner is offered the command zone", () => {
  for (const toCommandZone of [true, false]) {
    it(`Child of Alara's own dies trigger destroys everything (${toCommandZone ? "sent home" : "left in the graveyard"})`, () => {
      const game = table(B);
      const child = commander(game, "Child of Alara", A);
      const bears = [spawn(game, "Grizzly Bears", A), spawn(game, "Grizzly Bears", B)];
      const ring = spawn(game, "Sol Ring", B);
      lands(game, "Swamp", B, 3);

      cast(game, B, "Murder", [obj(child)]);
      expect(settle(game, toCommandZone)).toEqual([`alice:Child of Alara@graveyard`]);
      expect(game.state.objects[child].zone).toBe(toCommandZone ? "command" : "graveyard");
      for (const id of [...bears, ring]) expect(game.state.objects[id].zone).toBe("graveyard");
      // Lands aren't touched.
      expect(game.state.zones.shared.battlefield.length).toBe(3);
    });
  }

  it("Omnath, Locus of Rage deals its 3 damage after going home, as it last existed", () => {
    const game = table(B);
    const omnath = commander(game, "Omnath, Locus of Rage", A);
    lands(game, "Swamp", B, 3);
    const life = game.state.players[B].life;

    cast(game, B, "Murder", [obj(omnath)]);
    settle(game, true, [{ kind: "player", player: B }]);
    expect(game.state.objects[omnath].zone).toBe("command");
    expect(game.state.players[B].life).toBe(life - 3);
  });

  it("Omnath's landfall makes a 5/5 red and green Elemental", () => {
    const game = table(A);
    commander(game, "Omnath, Locus of Rage", A);
    const forest = spawn(game, "Forest", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: forest });
    settle(game, true);
    const token = game.state.zones.shared.battlefield
      .map((id) => game.viewFor(A).objects[id])
      .find((o) => o?.cardName === "5/5 Elemental Token");
    expect(token).toMatchObject({ power: 5, toughness: 5, colors: ["R", "G"] });
  });
});

describe("a commander put into a graveyard or exile from anywhere is offered", () => {
  it("discarded from its owner's hand", () => {
    const game = table(B);
    const krenko = commander(game, "Krenko, Mob Boss", A, "hand");
    lands(game, "Swamp", B, 3);
    cast(game, B, "Mind Rot", [{ kind: "player", player: A }]);
    // Mind Rot discards two: the commander and an Island.
    for (let i = 0; i < 50 && game.state.awaiting?.kind !== "discard"; i += 1) {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
    }
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "discard") throw new Error("no discard");
    const island = game.state.zones.perPlayer[A].hand.find((id) => id !== krenko) as ObjectId;
    game.dispatch({ type: "discard", player: A, cards: [krenko, island] });
    expect(settle(game, true)).toEqual(["alice:Krenko, Mob Boss@graveyard"]);
    expect(game.state.objects[krenko].zone).toBe("command");
  });

  it("countered on the stack", () => {
    const game = table(A);
    const krenko = commander(game, "Krenko, Mob Boss", A, "hand");
    lands(game, "Mountain", A, 5);
    lands(game, "Island", B, 2);
    game.dispatch({ type: "cast-spell", player: A, card: krenko, targets: [] });
    game.dispatch({ type: "pass-priority", player: A });
    const counterspell = spawn(game, "Counterspell", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: counterspell, targets: [obj(krenko)] });
    expect(settle(game, true)).toEqual(["alice:Krenko, Mob Boss@graveyard"]);
    expect(game.state.objects[krenko].zone).toBe("command");
  });

  it("exiled from its owner's graveyard, having been left there once", () => {
    const game = table(B);
    const krenko = commander(game, "Krenko, Mob Boss", A);
    lands(game, "Swamp", B, 3);
    cast(game, B, "Murder", [obj(krenko)]);
    expect(settle(game, false)).toEqual(["alice:Krenko, Mob Boss@graveyard"]);
    // Declined: not asked again at every later check.
    game.advanceUntil((s) => s.turn.step === "end");
    expect(game.eventsOfType("commander-zone-decision")).toHaveLength(1);
    expect(game.state.objects[krenko].zone).toBe("graveyard");

    // Its graveyard exiled: a new arrival, in exile, asked about again.
    game.debugApplyEffect(B, { kind: "exile-graveyard", target: 0 }, [{ kind: "player", player: A }]);
    checkStateBasedActions(game);
    expect(settle(game, true)).toEqual(["alice:Krenko, Mob Boss@exile"]);
    expect(game.state.objects[krenko].zone).toBe("command");
  });

  it("put into a graveyard and then into exile before the check, is asked once, about exile", () => {
    const game = table(B);
    const krenko = commander(game, "Krenko, Mob Boss", A);
    // One resolution, two moves: nothing checks state-based actions between.
    game.debugApplyEffect(
      B,
      {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "exile-graveyard", target: 1 },
        ],
      },
      [obj(krenko), { kind: "player", player: A }],
    );
    checkStateBasedActions(game);
    expect(settle(game, false)).toEqual(["alice:Krenko, Mob Boss@exile"]);
    expect(game.state.objects[krenko].zone).toBe("exile");
  });
});

describe("the default answer", () => {
  it("sends a commander home, but keeps one on an adventure in exile to cast from there", () => {
    const game = table(A);
    const krenko = commander(game, "Krenko, Mob Boss", A);
    const bot = new AutomaticController(A);
    const view = { state: game.state, player: A, legalActions: () => game.legalActions(A) };
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(krenko)]);
    expect(bot.commanderReplacement(view, krenko)).toBe(true);
    game.state.objects[krenko].onAdventure = true;
    expect(bot.commanderReplacement(view, krenko)).toBe(false);
  });
});
