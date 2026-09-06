import { describe, expect, it } from "vitest";
import { Game, autoSettle } from "engine";
import type { ObjectId } from "engine";
import type { ServerMessage } from "./protocol.js";
import { Room } from "./room.js";
import { ALICE, BOB, DECKS } from "./decks.js";

function makeRoom(): Room {
  const game = Game.create({
    seed: 1,
    decks: [
      { player: ALICE, cards: [...DECKS.alice] },
      { player: BOB, cards: [...DECKS.bob] },
    ],
  });
  autoSettle(game);
  return new Room("TEST1", game);
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
  return new Room("SPARSE", game);
}

function fakeConnection(): { received: ServerMessage[]; connection: { send: (m: ServerMessage) => void } } {
  const received: ServerMessage[] = [];
  return { received, connection: { send: (m) => received.push(m) } };
}

describe("Room", () => {
  it("starts with both seats unclaimed and offline", () => {
    const room = makeRoom();
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: false, online: false },
      { player: BOB, claimed: false, online: false },
    ]);
  });

  it("claims a seat and reports it as claimed and online", () => {
    const room = makeRoom();
    const { connection } = fakeConnection();
    room.claimSeat(ALICE, "token-a", connection);
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: true, online: true },
      { player: BOB, claimed: false, online: false },
    ]);
    expect(room.seatOf(connection)).toBe(ALICE);
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
    const room = makeRoom();
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
    const room = makeRoom();
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
      { player: ALICE, claimed: true, online: false },
      { player: BOB, claimed: false, online: false },
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
      { player: ALICE, claimed: true, online: true },
      { player: BOB, claimed: false, online: false },
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
});
