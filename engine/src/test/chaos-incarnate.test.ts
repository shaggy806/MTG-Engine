/**
 * The engine surface the Chaos Incarnate precon needed:
 *
 * - `cast-spell` trigger: a `filter` on the spell, and a `who: "opponent"`
 *   that the matcher never actually handled (Guttersnipe, Thermo-Alchemist,
 *   Kaervek the Merciless).
 * - `add-mana.amount` widened to an `EffectAmount` (Mana Geyser).
 * - `StaticCondition` `{ kind: "not", of }` (Titan Hunter).
 * - `damage { toControllerOfTarget }` (Unlicensed Disintegration).
 * - `goad { who }` and `CardFilter.attacking` reading last-known information
 *   off the battlefield (Kardur, Doomscourge).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import { poolCounts } from "../mana.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Mountain"),
    })),
  });

/**
 * A's first main phase, with `n` untapped lands of each basic type — these
 * tests cast off-colour fodder (Grizzly Bears) as much as real deck cards, so
 * it's simpler to open on all five than to pick an in-colour stand-in each
 * time.
 */
const openWith = (game: Game, n: number, who: PlayerId = A) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Mountain", "Swamp", "Forest", "Island", "Plains"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, who, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("a filtered cast-spell trigger", () => {
  it("fires on an instant but not on a creature", () => {
    const game = makeGame();
    openWith(game, 6);
    game.debugSpawn("Guttersnipe", A, "battlefield");

    const lifeBefore = game.state.players[B].life;
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    // 3 from the Bolt, 2 from Guttersnipe.
    expect(game.state.players[B].life).toBe(lifeBefore - 5);

    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    const afterBolt = game.state.players[B].life;
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    settle(game);
    expect(game.state.players[B].life).toBe(afterBolt);
  });

  it("untaps Thermo-Alchemist, which is what makes it a damage engine", () => {
    const game = makeGame();
    openWith(game, 6);
    const alchemist = game.debugSpawn("Thermo-Alchemist", A, "battlefield");
    game.state.objects[alchemist].summoningSick = false;

    game.dispatch({ type: "activate-ability", player: A, source: alchemist, abilityIndex: 0, targets: [] });
    settle(game);
    expect(game.state.objects[alchemist].tapped).toBe(true);

    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.state.objects[alchemist].tapped).toBe(false);
  });
});

describe("a cast-spell trigger watching an opponent", () => {
  it("fires on their spell and not on yours", () => {
    const game = makeGame();
    openWith(game, 6);
    game.debugSpawn("Kaervek the Merciless", A, "battlefield");

    // A's own spell: no trigger, so no decision is ever raised.
    const mine = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: mine, targets: [] });
    settle(game);
    expect(game.state.awaiting).toBeNull();

    // B responds with an instant on A's turn, so Kaervek deals that spell's
    // mana value to a target A chooses.
    openWith(game, 6, B);
    const theirs = game.debugSpawn("Breath of Malfegor", B, "hand");
    game.advanceUntil((s) => s.priority.holder === B || s.result.over);
    game.dispatch({ type: "cast-spell", player: B, card: theirs, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    expect(game.state.awaiting?.kind).toBe("choose-targets");

    const lifeBefore = game.state.players[B].life;
    game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    settle(game);
    // Breath of Malfegor is {3}{B}{R} — mana value 5 — and it deals A 5 of
    // its own, which is why only B's life is asserted here.
    expect(game.state.players[B].life).toBe(lifeBefore - 5);
  });
});

describe("Mana Geyser", () => {
  it("adds one red per tapped land the opponents control", () => {
    const game = makeGame();
    openWith(game, 5);
    for (let i = 0; i < 3; i += 1) {
      const id = game.debugSpawn("Mountain", B, "battlefield");
      game.state.objects[id].tapped = true;
    }
    // An untapped one and one of A's own don't count.
    const untapped = game.debugSpawn("Mountain", B, "battlefield");
    game.state.objects[untapped].tapped = false;

    const card = game.debugSpawn("Mana Geyser", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);
    expect(poolCounts(game.state.players[A].manaPool).R).toBe(3);
  });
});

describe("a negated static condition", () => {
  it("lets Titan Hunter fire only when nothing died", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Titan Hunter", A, "battlefield");

    const lifeBefore = game.state.players[A].life;
    game.advanceUntil((s) => s.turn.number > 1 || s.result.over);
    // A's own end step passed with nothing dead — A takes 4.
    expect(game.state.players[A].life).toBe(lifeBefore - 4);
  });

  it("stays silent on a turn a creature died", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Titan Hunter", A, "battlefield");
    const fodder = game.debugSpawn("Grizzly Bears", A, "battlefield");

    const lifeBefore = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: fodder },
    ]);
    game.advanceUntil((s) => s.turn.number > 1 || s.result.over);
    expect(game.state.players[A].life).toBe(lifeBefore);
  });
});

describe("Unlicensed Disintegration", () => {
  it("burns the dead creature's controller when you have an artifact", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Arcane Signet", A, "battlefield");
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const lifeBefore = game.state.players[B].life;
    const card = game.debugSpawn("Unlicensed Disintegration", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: victim }],
    });
    settle(game);

    expect(game.state.zones.shared.battlefield).not.toContain(victim);
    expect(game.state.players[B].life).toBe(lifeBefore - 3);
  });

  it("only destroys without one", () => {
    const game = makeGame();
    openWith(game, 4);
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const lifeBefore = game.state.players[B].life;
    const card = game.debugSpawn("Unlicensed Disintegration", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: victim }],
    });
    settle(game);

    expect(game.state.zones.shared.battlefield).not.toContain(victim);
    expect(game.state.players[B].life).toBe(lifeBefore);
  });
});

describe("Kardur, Doomscourge", () => {
  it("goads every opponent's creatures at once", () => {
    const game = makeGame([A, B, C]);
    openWith(game, 0);
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const others = game.debugSpawn("Grizzly Bears", C, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");

    game.debugSpawn("Kardur, Doomscourge", A, "battlefield", { announceEntry: true });
    settle(game);

    expect(game.state.objects[theirs].goadedBy).toEqual([A]);
    expect(game.state.objects[others].goadedBy).toEqual([A]);
    expect(game.state.objects[mine].goadedBy).toBeUndefined();
  });

  it("drains when an attacking creature dies, using last-known attacking state", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Kardur, Doomscourge", A, "battlefield");
    const attacker = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[attacker].summoningSick = false;
    // A 3/3 blocker, so the 2/2 attacker dies in combat.
    const blocker = game.debugSpawn("Hill Giant", B, "battlefield");
    game.state.objects[blocker].tapped = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker, defender: B }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: [{ blocker, attacker }],
    });

    const aLife = game.state.players[A].life;
    const bLife = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.step === "end" || s.result.over);

    expect(game.state.zones.shared.battlefield).not.toContain(attacker);
    // The Bears was attacking when it died, so the trigger fires.
    expect(game.state.players[A].life).toBe(aLife + 1);
    expect(game.state.players[B].life).toBe(bLife - 1);
  });

  it("does not fire for a creature that dies outside combat", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Kardur, Doomscourge", A, "battlefield");
    const fodder = game.debugSpawn("Grizzly Bears", A, "battlefield");

    const aLife = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: fodder },
    ]);
    settle(game);
    expect(game.state.players[A].life).toBe(aLife);
  });
});
