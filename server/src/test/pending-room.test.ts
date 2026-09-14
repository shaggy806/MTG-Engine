import { describe, expect, it } from "vitest";
import { PendingRoom } from "../pending-room.js";
import { ALICE, BOB, SEATS } from "../decks.js";

function pendingRoom(players = 2): PendingRoom {
  return new PendingRoom("TEST1", players, { seed: 1 });
}

describe("PendingRoom", () => {
  it("starts with every seat unclaimed and not ready", () => {
    const room = pendingRoom();
    expect(room.seatStatuses()).toEqual([
      { player: ALICE, claimed: false, online: false, displayName: null, isBot: false },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false },
    ]);
    expect(room.isReady()).toBe(false);
  });

  it("claiming a seat without a deck falls back to its positional starter deck", () => {
    const room = pendingRoom();
    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    room.claimSeat(BOB, "bob-token", { send: () => {} });
    expect(room.isReady()).toBe(true);
    const config = room.toGameConfig();
    expect(config.decks.find((d) => d.player === ALICE)?.cards).toEqual(SEATS[0].cards);
    expect(config.decks.find((d) => d.player === ALICE)?.commander).toBe(SEATS[0].commander);
  });

  it("claiming with a custom deck uses it instead of the positional default", () => {
    const room = pendingRoom();
    room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
      cards: ["Forest", "Forest"],
      commander: "Ureni of the Unwritten",
    });
    room.claimSeat(BOB, "bob-token", { send: () => {} });
    const config = room.toGameConfig();
    const aliceDeck = config.decks.find((d) => d.player === ALICE);
    expect(aliceDeck?.cards).toEqual(["Forest", "Forest"]);
    expect(aliceDeck?.commander).toBe("Ureni of the Unwritten");
  });

  it("the same token reclaims a seat (e.g. a page refresh) without re-defaulting the deck", () => {
    const room = pendingRoom();
    const conn1 = { send: () => {} };
    room.claimSeat(ALICE, "alice-token", conn1, undefined, {
      cards: ["Island"],
      commander: "Some Commander",
    });
    const conn2 = { send: () => {} };
    room.claimSeat(ALICE, "alice-token", conn2); // reconnect, no deck resent
    expect(room.seatOf(conn1)).toBeNull(); // old connection displaced
    expect(room.seatOf(conn2)).toBe(ALICE);
    room.claimSeat(BOB, "bob-token", { send: () => {} });
    expect(room.toGameConfig().decks.find((d) => d.player === ALICE)?.cards).toEqual(["Island"]);
  });

  it("a different token can't steal an already-claimed seat", () => {
    const room = pendingRoom();
    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    expect(() => room.claimSeat(ALICE, "someone-else", { send: () => {} })).toThrow(
      "already claimed",
    );
  });

  it("addBot fills a seat with its positional starter deck and rejects a claimed seat", () => {
    const room = pendingRoom();
    room.addBot(BOB);
    expect(room.seatStatuses().find((s) => s.player === BOB)?.isBot).toBe(true);
    expect(() => room.addBot(BOB)).toThrow("already has a bot");

    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    expect(() => room.addBot(ALICE)).toThrow("already claimed");

    expect(room.isReady()).toBe(true);
    expect(room.botSeats()).toEqual([BOB]);
  });

  it("claims() only reports currently-connected claimed seats", () => {
    const room = pendingRoom();
    const conn = { send: () => {} };
    room.claimSeat(ALICE, "alice-token", conn, "Alice");
    room.addBot(BOB);
    expect(room.claims()).toEqual([
      { player: ALICE, clientToken: "alice-token", connection: conn, displayName: "Alice" },
    ]);

    room.disconnect(conn);
    expect(room.claims()).toEqual([]);
    // Still ready — disconnecting doesn't un-claim a seat, only unbinds the
    // live connection (same as `Room`).
    expect(room.isReady()).toBe(true);
  });

  it("scales seat count with players (3-4)", () => {
    expect(pendingRoom(3).seatStatuses()).toHaveLength(3);
    expect(pendingRoom(4).seatStatuses()).toHaveLength(4);
  });
});
