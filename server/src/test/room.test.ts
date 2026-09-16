import { describe, expect, it } from "vitest";
import { Game, autoSettle } from "engine";
import type { ObjectId } from "engine";
import type { ServerMessage } from "../protocol.js";
import { Room } from "../room.js";
import { ALICE, BOB, DECKS } from "../decks.js";

/** `pacing: "immediate"` throughout this file: it runs bot seats straight
 * through inside `settle()`, the way a room did before bot moves were paced
 * against the clients' animations, so these tests stay synchronous. The
 * paced path has its own file (`room-pacing.test.ts`). */
function makeRoom(): Room {
  const game = Game.create({
    seed: 1,
    decks: [
      { player: ALICE, cards: [...DECKS.alice] },
      { player: BOB, cards: [...DECKS.bob] },
    ],
  });
  autoSettle(game);
  return new Room("TEST1", game, { pacing: "immediate" });
}

function namedCard(room: Room, ids: readonly ObjectId[], name: string): ObjectId {
  const id = ids.find((i) => room.game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
}

/** All-Forest decks — nothing is ever castable, so a played land's window is
 * unambiguously mana-only rather than depending on which spells a shuffle
 * happens to deal into an opening hand. */
function makeSparseRoom(): Room {
  const forests = Array<string>(40).fill("Forest");
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: ALICE, cards: forests },
      { player: BOB, cards: forests },
    ],
  });
  autoSettle(game);
  return new Room("SPARSE", game, { pacing: "immediate" });
}

function fakeConnection(): { received: ServerMessage[]; connection: { send: (m: ServerMessage) => void } } {
  const received: ServerMessage[] = [];
  return { received, connection: { send: (m) => received.push(m) } };
}

describe("Room", () => {
  it("starts with both seats unclaimed and offline", () => {
    const room = makeRoom();
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
    ]);
  });

  it("claims a seat and reports it as claimed and online", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection);
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: true, online: true, displayName: null, isBot: false, deck: null, ready: true, isHost: true },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
    ]);
    expect(room.seatOf(connection)).toBe(ALICE);
  });

  it("claims a seat with a chosen display name", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection, "Toby");
    expect(room.seatStatuses()[0]).toEqual({
      player: ALICE,
      claimed: true,
      online: true,
      displayName: "Toby",
      isBot: false,
      deck: null,
      ready: true,
      // Nobody created this room with a host token, so the role falls to
      // the first connected human seat (see `HostRole`).
      isHost: true,
    });
  });

  it("trims whitespace and drops an empty name, keeping the seat unnamed", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection, "   ");
    expect(room.seatStatuses()[0].displayName).toBeNull();
  });

  it("truncates an overly long display name", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection, "a".repeat(50));
    expect(room.seatStatuses()[0].displayName).toHaveLength(20);
  });

  it("keeps an existing name across a reconnect that doesn't specify one", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first, "Toby");
    room.disconnect(first);

    const { connection: second } = fakeConnection();
    room.claimSeat(ALICE, "token-a", second);

    expect(room.seatStatuses()[0].displayName).toBe("Toby");
  });

  it("lets a reconnect change the name to a new one", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first, "Toby");
    room.disconnect(first);

    const { connection: second } = fakeConnection();
    room.claimSeat(ALICE, "token-a", second, "Robert");

    expect(room.seatStatuses()[0].displayName).toBe("Robert");
  });

  it("rejects claiming a seat already held by a different token", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    const { connection: second } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first);
    expect(() => room.claimSeat(ALICE, "token-b", second)).toThrow(/already claimed/);
  });

  it("lets the same token reclaim its seat (e.g. a page refresh)", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    const { connection: second } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first);
    expect(() => room.claimSeat(ALICE, "token-a", second)).not.toThrow();
    expect(room.seatOf(second)).toBe(ALICE);
  });

  it("rejects dispatching for a connection that hasn't claimed a seat", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    expect(() =>
      room.dispatch(connection, { type: "pass-priority", player: ALICE }),
    ).toThrow(/claim a seat/);
  });

  it("rejects dispatching an action for a seat other than the one claimed", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection);
    expect(() =>
      room.dispatch(connection, { type: "pass-priority", player: BOB }),
    ).toThrow(/cannot dispatch/);
  });

  it("accepts a legal dispatch from the claimed seat and settles the game", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    const holder = room.game.state.priority.holder;
    expect(holder).not.toBeNull();
    room.claimSeat(holder!, "token", connection);
    expect(() =>
      room.dispatch(connection, { type: "pass-priority", player: holder! }),
    ).not.toThrow();
  });

  it("rejects requesting pass-turn for a connection that hasn't claimed a seat", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    expect(() => room.requestPassTurn(connection)).toThrow(/claim a seat/);
  });

  it("never auto-passes a seat other than the one that asked", () => {
    const room = makeRoom();
    const { connection: aliceConn } = fakeConnection();
    const { connection: bobConn } = fakeConnection();
    room.claimSeat(ALICE, "alice-token", aliceConn);
    room.claimSeat(BOB, "bob-token", bobConn);

    // Whoever does NOT currently hold priority asks to fast-forward. Since
    // they aren't up right now, nothing should happen — regardless of
    // whether the actual holder's window is itself dead or has real options.
    const holder = room.game.state.priority.holder!;
    const waiting = holder === ALICE ? BOB : ALICE;
    const waitingConn = waiting === ALICE ? aliceConn : bobConn;
    const stepBefore = room.game.state.turn.step;

    room.requestPassTurn(waitingConn);

    expect(room.game.state.priority.holder).toBe(holder);
    expect(room.game.state.turn.step).toBe(stepBefore);
  });

  it("Pass Turn carries a seat clean through its own end step into the opponent's turn", () => {
    // Sparse (all-Forest) decks: no shuffle-dependent castable turns up, so the
    // starting position is a plain "play a land or pass" window every time.
    const room = makeSparseRoom();
    const { connection: aliceConn } = fakeConnection();
    const { connection: bobConn } = fakeConnection();
    room.claimSeat(ALICE, "alice-token", aliceConn);
    room.claimSeat(BOB, "bob-token", bobConn);
    const startTurn = room.game.state.turn.number;
    const active = room.game.activePlayer;

    room.requestPassTurn(active === ALICE ? aliceConn : bobConn);

    // Must not get stuck at the active player's own end step (the old bug) —
    // it should carry all the way into the next turn.
    expect(room.game.state.turn.number).toBeGreaterThan(startTurn);
    expect(room.game.activePlayer).not.toBe(active);
  });

  it("rejects requesting auto-pass for a connection that hasn't claimed a seat", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    expect(() => room.requestAutoPass(connection)).toThrow(/claim a seat/);
  });

  it("reports auto-pass as active once requested, and inactive once toggled off", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    const active = room.game.activePlayer;
    room.claimSeat(active, "token", connection);

    expect(room.isAutoPassing(active)).toBe(false);
    room.requestAutoPass(connection);
    expect(room.isAutoPassing(active)).toBe(true);
    room.requestAutoPass(connection); // toggle off
    expect(room.isAutoPassing(active)).toBe(false);
  });

  it("auto-pass carries a seat through an opponent's entire turn, stopping at its own next turn", () => {
    // Sparse decks — see the pass-turn test above.
    const room = makeSparseRoom();
    const { connection: aliceConn } = fakeConnection();
    const { connection: bobConn } = fakeConnection();
    room.claimSeat(ALICE, "alice-token", aliceConn);
    room.claimSeat(BOB, "bob-token", bobConn);
    const startTurn = room.game.state.turn.number;
    const active = room.game.activePlayer;
    const waiting = active === ALICE ? BOB : ALICE;
    const waitingConn = waiting === ALICE ? aliceConn : bobConn;

    // The non-active seat auto-passes through the rest of this turn *and*
    // the whole of its own next turn's opponent phase — i.e. all the way
    // until it becomes `waiting`'s turn again.
    room.requestAutoPass(waitingConn);
    expect(room.isAutoPassing(waiting)).toBe(true);

    // Nothing should happen yet — it's not `waiting`'s turn, so there's
    // nothing for the flag to do until the active player's turn actually ends.
    expect(room.game.state.turn.number).toBe(startTurn);

    // The active player now also passes through their own turn manually
    // (a real seat wouldn't need to, since real windows still stop for them —
    // but with nothing else to do here, driving it via requestPassTurn
    // reaches the same place deterministically).
    room.requestPassTurn(active === ALICE ? aliceConn : bobConn);

    expect(room.game.activePlayer).toBe(waiting);
    expect(room.isAutoPassing(waiting)).toBe(false);
  });

  it("rejects toggling mana-skip for a connection that hasn't claimed a seat", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    expect(() => room.toggleSkipManaOnly(connection)).toThrow(/claim a seat/);
  });

  it("toggles mana-skip on and off, and leaves it off by default", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token", connection);

    expect(room.isSkippingManaOnly(ALICE)).toBe(false);
    room.toggleSkipManaOnly(connection);
    expect(room.isSkippingManaOnly(ALICE)).toBe(true);
    room.toggleSkipManaOnly(connection);
    expect(room.isSkippingManaOnly(ALICE)).toBe(false);
  });

  it("leaves a mana-only window alone by default, but skips it once opted in", () => {
    const room = makeSparseRoom();
    const { connection: aliceConn } = fakeConnection();
    const { connection: bobConn } = fakeConnection();
    room.claimSeat(ALICE, "alice-token", aliceConn);
    room.claimSeat(BOB, "bob-token", bobConn);

    const forest = namedCard(room, room.game.handOf(ALICE), "Forest");
    room.dispatch(aliceConn, { type: "play-land", player: ALICE, card: forest });

    // Nothing else to do this early — a genuine mana-only window — but by
    // default the room still leaves it for Alice to pass herself.
    expect(room.game.isDeadForMana(ALICE)).toBe(true);
    expect(room.game.state.priority.holder).toBe(ALICE);
    expect(room.game.state.turn.step).toBe("precombat-main");

    const startTurn = room.game.state.turn.number;
    room.toggleSkipManaOnly(aliceConn);

    // Opting in carries her straight through it — and, since an all-Forest
    // board has no eligible attacker or blocker either, straight through the
    // rest of the turn's forced passes too — to the next real decision:
    // Bob's own land drop, next turn.
    expect(room.game.state.turn.number).toBeGreaterThan(startTurn);
    expect(room.game.activePlayer).toBe(BOB);
    expect(room.game.state.turn.step).toBe("precombat-main");
  });

  it("goes offline (but stays claimed) on disconnect", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection);
    room.disconnect(connection);
    expect(room.seatOf(connection)).toBeNull();
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: true, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
    ]);
  });

  it("lets the same token reclaim its seat after disconnecting, going back online", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first);
    room.disconnect(first);

    const { connection: second } = fakeConnection();
    room.claimSeat(ALICE, "token-a", second);

    expect(room.seatOf(second)).toBe(ALICE);
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: true, online: true, displayName: null, isBot: false, deck: null, ready: true, isHost: true },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
    ]);
  });

  it("rejects a different token claiming a seat while its holder is merely offline", () => {
    const room = makeRoom();
    const { connection: first } = fakeConnection();
    room.claimSeat(ALICE, "token-a", first);
    room.disconnect(first);

    // A dropped connection must not hand the seat to a stranger — only the
    // same token can come back to it.
    const { connection: stranger } = fakeConnection();
    expect(() => room.claimSeat(ALICE, "token-b", stranger)).toThrow(/already claimed/);
  });

  describe("bot seats", () => {
    it("reports a bot seat as such, and never claimed/online", () => {
      const room = makeRoom();
      room.addBot(BOB);
      expect(room.seatStatuses()).toEqual([
        { player: ALICE, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: true, isHost: false },
        { player: BOB, claimed: false, online: false, displayName: null, isBot: true, deck: null, ready: true, isHost: false },
      ]);
    });

    it("rejects adding a bot to a seat a human already claimed", () => {
      const room = makeRoom();
      const { connection } = fakeConnection();
      room.claimSeat(ALICE, "token-a", connection);
      expect(() => room.addBot(ALICE)).toThrow(/already claimed/);
    });

    it("rejects changing a bot's deck once the game has started", () => {
      const room = makeRoom();
      room.addBot(BOB);
      expect(() => room.setBotDeck(BOB, { cards: ["Forest"] })).toThrow(/already started/);
    });

    it("rejects claiming a seat that's already bot-controlled", () => {
      const room = makeRoom();
      room.addBot(ALICE);
      const { connection } = fakeConnection();
      expect(() => room.claimSeat(ALICE, "token-a", connection)).toThrow(/played by a bot/);
    });

    it("rejects adding a second bot to an already-bot seat", () => {
      const room = makeRoom();
      room.addBot(ALICE);
      expect(() => room.addBot(ALICE)).toThrow(/already has a bot/);
    });

    it("answers its own parallel mulligan decision the moment it's added, leaving only the human", () => {
      const game = Game.create({
        seed: 1,
        mulligans: true,
        decks: [
          { player: ALICE, cards: [...DECKS.alice] },
          { player: BOB, cards: [...DECKS.bob] },
        ],
      });
      const room = new Room("MULL1", game, { pacing: "immediate" });
      const before = room.game.state.awaiting;
      if (before === null || before.kind !== "mulligan") throw new Error("expected mulligan");
      expect(Object.keys(before.hands).sort()).toEqual([ALICE, BOB].sort());

      room.addBot(BOB);

      const after = room.game.state.awaiting;
      if (after === null || after.kind !== "mulligan") throw new Error("expected mulligan");
      expect(Object.keys(after.hands)).toEqual([ALICE]);
    });

    it("plays its own turn without any dispatch on its behalf", () => {
      const room = makeSparseRoom();
      room.addBot(BOB);
      const { connection: aliceConn } = fakeConnection();
      room.claimSeat(ALICE, "alice-token", aliceConn);

      // All-Forest decks — nothing castable, so this only exercises land
      // drops and passes. Alice plays her land and passes for the turn;
      // settle() stops again almost immediately, at Bob's own upkeep — not
      // because of Bob (his dead window already auto-passed, with no
      // dispatch on his behalf), but because Alice still has a leftover
      // Forest of her own and, as a human, stops for that trivial mana-tap
      // decision every priority round. That's pre-existing, bot-unrelated
      // `Room.settle` behavior (see the mana-skip tests above) — simulate
      // her declining it, same as a real human clicking past it, and
      // confirm Bob's land lands on the battlefield on his own.
      expect(room.game.activePlayer).toBe(ALICE); // sparse decks never trigger a mulligan
      const forest = namedCard(room, room.game.handOf(ALICE), "Forest");
      room.dispatch(aliceConn, { type: "play-land", player: ALICE, card: forest });
      room.requestPassTurn(aliceConn);

      expect(room.game.activePlayer).toBe(BOB);
      expect(room.game.state.priority.holder).toBe(ALICE);
      expect(
        room.game.state.zones.shared.battlefield.some(
          (id) => room.game.state.objects[id].controller === BOB,
        ),
      ).toBe(false); // Bob hasn't reached his main phase yet

      for (
        let i = 0;
        i < 20 && room.game.state.zones.shared.battlefield.length < 2;
        i += 1
      ) {
        if (room.game.state.priority.holder !== ALICE) break;
        room.dispatch(aliceConn, { type: "pass-priority", player: ALICE });
      }

      const bobBattlefield = room.game.state.zones.shared.battlefield.filter(
        (id) => room.game.state.objects[id].controller === BOB,
      );
      expect(bobBattlefield).toHaveLength(1); // Bob's land, played by the bot alone
    });
  });
});
