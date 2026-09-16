/**
 * The default `"realtime"` pacing: a bot seat gets one frame per action, and
 * doesn't take the next one until the seats watching have reported finishing
 * the last one (see `Room`'s class comment). Driven on a fake clock so the
 * whole thing stays synchronous and deterministic.
 */

import { describe, expect, it } from "vitest";
import { Game, autoSettle } from "engine";
import { Room } from "../room.js";
import type { Connection, RoomTimers } from "../room.js";
import type { BotSpeed, ServerMessage } from "../protocol.js";
import { ALICE, BOB } from "../decks.js";

/** A hand-cranked clock — `advance(ms)` fires whatever is due, so a test can
 * say exactly when a bot's think time elapses or its ack wait times out. */
function fakeClock() {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; fn: () => void }>();
  const timers: RoomTimers = {
    setTimeout: (fn, ms) => {
      const id = nextId++;
      pending.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (handle) => {
      pending.delete(handle as number);
    },
  };
  const advance = (ms: number): void => {
    const target = now + ms;
    for (;;) {
      let dueId: number | null = null;
      let dueAt = Infinity;
      for (const [id, t] of pending) {
        if (t.at <= target && t.at < dueAt) {
          dueId = id;
          dueAt = t.at;
        }
      }
      if (dueId === null) break;
      const due = pending.get(dueId)!;
      pending.delete(dueId);
      now = due.at;
      due.fn();
    }
    now = target;
  };
  return { timers, advance, get pendingCount() { return pending.size; } };
}

/** Records every frame pushed to this seat, the way the WebSocket layer
 * would. Acks are opt-in per test: `ackAll` mimics a client that keeps up. */
function watcher(room: () => Room, ackAll: boolean) {
  const frames: { seq: number; events: number }[] = [];
  const connection: Connection = {
    send: (m: ServerMessage) => {
      if (m.type !== "state") return;
      frames.push({ seq: m.seq, events: m.view.events.length });
      if (ackAll) room().ack(connection, m.seq);
    },
  };
  return { frames, connection };
}

/** All-Forest decks: nothing is ever castable, so a bot's turn is a
 * predictable string of land drops and passes rather than whatever a shuffle
 * happens to deal. */
function makePacedRoom(ackAll: boolean, botSpeed: BotSpeed = "fast") {
  const clock = fakeClock();
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
  let room: Room;
  const alice = watcher(() => room, ackAll);
  room = new Room("PACE1", game, {
    timers: clock.timers,
    // No pause after a move is shown, so these tests are about the ack gate
    // alone; the pause itself has its own tests below.
    botSpeed,
    onUpdate: (r) => {
      const seats = r.connectedSeats();
      for (const { seat, connection } of seats) {
        connection.send({
          type: "state",
          roomId: r.id,
          seq: r.frameSeq,
          seat,
          view: r.game.viewFor(seat),
          actions: r.game.legalActions(seat),
          seats: r.seatStatuses(),
          autoPassing: r.isAutoPassing(seat),
          skipManaOnly: r.isSkippingManaOnly(seat),
          isHost: r.isHost(connection),
          botSpeed: r.botSpeed,
        });
      }
    },
  });
  room.claimSeat(ALICE, "alice-token", alice.connection);
  return { room, clock, alice };
}

describe("Room pacing (realtime)", () => {
  it("publishes a frame before a bot acts, and holds the bot until it's acked", () => {
    const { room, clock, alice } = makePacedRoom(false);
    room.addBot(BOB);
    room.start();
    expect(alice.frames.length).toBeGreaterThan(0);
    // One ack enrols Alice's seat as one the gate waits on.
    room.ack(alice.connection, room.frameSeq);

    room.requestPassTurn(alice.connection);
    const beforeBot = alice.frames.length;

    // The think-time floor elapsing isn't enough on its own — Alice is still
    // showing the frame Bob is about to act on.
    clock.advance(400);
    expect(alice.frames.length).toBe(beforeBot);

    // Catching up releases him.
    room.ack(alice.connection, room.frameSeq);
    expect(alice.frames.length).toBeGreaterThan(beforeBot);
  });

  it("never waits on a seat that has never acked, so an old client can't wedge a room", () => {
    const { room, clock, alice } = makePacedRoom(false);
    room.addBot(BOB);
    room.start();

    room.requestPassTurn(alice.connection);
    const before = alice.frames.length;
    clock.advance(400); // the think-time floor, and nothing else to wait for
    expect(alice.frames.length).toBeGreaterThan(before);
  });

  it("lets a bot move on once every acking seat has caught up", () => {
    const { room, clock, alice } = makePacedRoom(true);
    room.addBot(BOB);
    room.start();
    room.requestPassTurn(alice.connection);

    const before = alice.frames.length;
    clock.advance(400); // the think-time floor; the acks are already in
    expect(alice.frames.length).toBeGreaterThan(before);
  });

  it("doesn't let a bot take its turn inside the push that hands it over", () => {
    const { room, clock, alice } = makePacedRoom(true);
    room.addBot(BOB);
    room.start();

    const botLands = (): number =>
      room.game.state.zones.shared.battlefield.filter(
        (id) => room.game.state.objects[id].controller === BOB,
      ).length;

    room.requestPassTurn(alice.connection);
    // The old behaviour: Bob's whole turn happened inside this one call, so
    // the only board anyone ever saw was the one after it. Now his land is
    // still in hand at this point — it takes a clock beat to reach the table.
    expect(botLands()).toBe(0);

    for (let i = 0; i < 8 && botLands() === 0; i += 1) clock.advance(400);
    expect(botLands()).toBe(1);

    // Every frame is numbered, strictly increasing, one per push.
    const seqs = alice.frames.map((f) => f.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(new Set(seqs).size).toBe(seqs.length);
  });

  it("spends no frame on a bot simply passing priority", () => {
    const { room, clock, alice } = makePacedRoom(true);
    room.addBot(BOB);
    room.start();
    room.requestPassTurn(alice.connection);

    // Bob passes priority many times over a turn; none of those are worth a
    // beat of their own, so the frames pushed stay well under the number of
    // actions the bot actually takes.
    const before = alice.frames.length;
    for (let i = 0; i < 8; i += 1) clock.advance(400);
    expect(alice.frames.length - before).toBeLessThan(8);
  });

  it("moves on without a seat that acked before and then went quiet", () => {
    const { room, clock, alice } = makePacedRoom(false);
    room.addBot(BOB);
    room.start();
    // One ack, so Alice's seat counts as one the gate waits on — then silence.
    room.ack(alice.connection, room.frameSeq);
    room.requestPassTurn(alice.connection);

    const before = alice.frames.length;
    clock.advance(1000);
    expect(alice.frames.length).toBe(before); // still holding

    clock.advance(6000); // past the ack timeout
    expect(alice.frames.length).toBeGreaterThan(before);
  });

  it("stops waiting on a seat that disconnects mid-frame", () => {
    const { room, clock, alice } = makePacedRoom(false);
    room.addBot(BOB);
    room.start();
    room.ack(alice.connection, room.frameSeq);
    room.requestPassTurn(alice.connection);

    clock.advance(400); // the think-time floor passes, but Alice hasn't acked
    const before = room.frameSeq;
    room.disconnect(alice.connection);
    expect(room.frameSeq).toBeGreaterThan(before); // released immediately
  });

  it("leaves no timers behind once disposed", () => {
    const { room, clock, alice } = makePacedRoom(false);
    room.addBot(BOB);
    room.start();
    room.ack(alice.connection, room.frameSeq);
    room.requestPassTurn(alice.connection);

    expect(clock.pendingCount).toBeGreaterThan(0);
    room.dispose();
    expect(clock.pendingCount).toBe(0);
  });

  describe("bot speed", () => {
    it("pauses after everyone has caught up, for as long as the speed says", () => {
      const { room, clock, alice } = makePacedRoom(false, "normal");
      room.addBot(BOB);
      room.start();
      room.ack(alice.connection, room.frameSeq);

      room.requestPassTurn(alice.connection);
      const before = alice.frames.length;
      clock.advance(400);
      room.ack(alice.connection, room.frameSeq);
      // Caught up, but "normal" lets the move sit on screen first.
      clock.advance(650);
      expect(alice.frames.length).toBe(before);
      clock.advance(100);
      expect(alice.frames.length).toBeGreaterThan(before);
    });

    it("pauses longer on slow", () => {
      const { room, clock, alice } = makePacedRoom(false, "slow");
      room.addBot(BOB);
      room.start();
      room.ack(alice.connection, room.frameSeq);

      room.requestPassTurn(alice.connection);
      const before = alice.frames.length;
      clock.advance(400);
      room.ack(alice.connection, room.frameSeq);
      clock.advance(1_500);
      expect(alice.frames.length).toBe(before);
      clock.advance(200);
      expect(alice.frames.length).toBeGreaterThan(before);
    });

    it("isn't cut short by the ack timeout", () => {
      const { room, clock, alice } = makePacedRoom(false, "slow");
      room.addBot(BOB);
      room.start();
      room.ack(alice.connection, room.frameSeq);

      room.requestPassTurn(alice.connection);
      const before = alice.frames.length;
      // A slow client catches up just before the 6s backstop would have
      // fired; the pause still runs its full length after that.
      clock.advance(5_900);
      room.ack(alice.connection, room.frameSeq);
      clock.advance(1_000);
      expect(alice.frames.length).toBe(before);
      clock.advance(700);
      expect(alice.frames.length).toBeGreaterThan(before);
    });

    it("applies a changed speed to the next move", () => {
      const { room, clock, alice } = makePacedRoom(true, "slow");
      room.addBot(BOB);
      room.start();
      room.setBotSpeed("fast");
      room.requestPassTurn(alice.connection);
      const before = alice.frames.length;
      clock.advance(400);
      expect(alice.frames.length).toBeGreaterThan(before);
    });
  });
});
