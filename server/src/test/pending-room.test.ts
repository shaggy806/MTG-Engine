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
      { player: ALICE, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: false, isHost: false },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false, deck: null, ready: false, isHost: false },
    ]);
    expect(room.isReady()).toBe(false);
    expect(room.allReady()).toBe(false);
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

  it("carries a deck's chosen printings through to its DeckList and seat status", () => {
    const id = "3d3f4e6a-1c5d-4f8b-9a2e-7b1c0d5e6f70";
    const room = pendingRoom();
    room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
      cards: ["Forest", "Sol Ring"],
      commander: "Ureni of the Unwritten",
      printings: { "Sol Ring": id, "Ureni of the Unwritten": id },
    });
    room.claimSeat(BOB, "bob-token", { send: () => {} });

    expect(room.toGameConfig().decks.find((d) => d.player === ALICE)?.printings).toEqual({
      "Sol Ring": id,
      "Ureni of the Unwritten": id,
    });
    // Only the commander's printing rides on the seat status — that's the
    // one card the seat board draws.
    expect(room.seatStatuses().find((s) => s.player === ALICE)?.deck?.commanderPrinting).toBe(id);
    expect(room.seatStatuses().find((s) => s.player === BOB)?.deck?.commanderPrinting).toBeNull();
  });

  // A printing ends up as `VisibleObject.art` in every seat's view, which
  // the client turns into an <img src> — so anything but a Scryfall card id
  // would let one player point the whole table's card art at a host they
  // control. See `assertPrintingsAreSafe`.
  it("refuses a printing that isn't a bare Scryfall card id", () => {
    const room = pendingRoom();
    for (const bad of ["https://evil.example/pixel.png", "not-a-uuid", ""]) {
      expect(() =>
        room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
          cards: ["Forest"],
          printings: { Forest: bad },
        }),
      ).toThrow("invalid printing");
    }
  });

  it("the same token reclaims a seat (e.g. a page refresh) without re-defaulting the deck", () => {
    const room = pendingRoom();
    const conn1 = { send: () => {} };
    room.claimSeat(ALICE, "alice-token", conn1, undefined, {
      cards: ["Island"],
      commander: "Ayara, First of Locthwain",
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

  it("addSeat grows the table to four and no further", () => {
    const room = pendingRoom();
    expect(room.addSeat()).toBe(SEATS[2].id);
    expect(room.addSeat()).toBe(SEATS[3].id);
    expect(room.seatStatuses().map((s) => s.player)).toEqual(SEATS.map((s) => s.id));
    expect(() => room.addSeat()).toThrow("seats at most");
  });

  it("removeSeat shrinks the table to two and no further", () => {
    const room = pendingRoom(4);
    room.removeSeat(SEATS[3].id);
    room.removeSeat(SEATS[2].id);
    expect(room.seatStatuses().map((s) => s.player)).toEqual([ALICE, BOB]);
    expect(() => room.removeSeat(BOB)).toThrow("at least 2 seats");
  });

  it("removeSeat drops a bot's seat but never one a player is sitting in", () => {
    const room = pendingRoom(3);
    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    room.addBot(SEATS[2].id);
    expect(() => room.removeSeat(ALICE)).toThrow("claimed by a player");
    room.removeSeat(SEATS[2].id);
    expect(room.seatStatuses().map((s) => s.player)).toEqual([ALICE, BOB]);
    expect(room.botSeats()).toEqual([]);
  });

  it("leave frees the leaver's seat for someone else, and drops their host role", () => {
    const room = new PendingRoom("TEST1", 2, { seed: 1 }, "host-token");
    const alice = { send: () => {} };
    const bob = { send: () => {} };
    room.bindHost(alice, "host-token");
    room.claimSeat(ALICE, "alice-token", alice, "Alice", undefined, true);
    room.claimSeat(BOB, "bob-token", bob);
    expect(room.isHost(bob)).toBe(false);

    room.leave(alice);
    const [freed] = room.seatStatuses();
    expect(freed).toMatchObject({ claimed: false, online: false, displayName: null, deck: null, ready: false });
    // With the creator gone, the role falls to whoever is still seated.
    expect(room.isHost(bob)).toBe(true);
    expect(() => room.claimSeat(ALICE, "carol-token", { send: () => {} })).not.toThrow();
  });

  it("a seat dropped and re-added leaves the table in printed seating order", () => {
    const room = pendingRoom(4);
    room.removeSeat(SEATS[2].id);
    room.addSeat();
    // Not [A, B, D, C] — turn order comes straight off this array, so the
    // order a table was assembled in must not leak into who plays when.
    expect(room.seatStatuses().map((s) => s.player)).toEqual(SEATS.map((s) => s.id));
    for (const seat of SEATS) room.addBot(seat.id);
    expect(room.toGameConfig().decks.map((d) => d.player)).toEqual(SEATS.map((s) => s.id));
  });

  it("addBot fills a seat with its positional starter deck and rejects a claimed seat", () => {
    const room = pendingRoom();
    room.addBot(BOB);
    const bobStatus = room.seatStatuses().find((s) => s.player === BOB);
    expect(bobStatus?.isBot).toBe(true);
    expect(bobStatus?.deck).toEqual({
      name: SEATS[1].name,
      commander: SEATS[1].commander ?? null,
      commanderPrinting: null,
    });
    expect(() => room.addBot(BOB)).toThrow("already has a bot");

    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    expect(() => room.addBot(ALICE)).toThrow("already claimed");

    expect(room.isReady()).toBe(true);
    expect(room.botSeats()).toEqual([BOB]);
  });

  it("addBot with a chosen deck uses it instead of the positional default", () => {
    const room = pendingRoom();
    room.addBot(BOB, { cards: ["Forest", "Forest"], commander: "Ureni of the Unwritten", name: "My Deck" });
    expect(room.seatStatuses().find((s) => s.player === BOB)?.deck).toEqual({
      name: "My Deck",
      commander: "Ureni of the Unwritten",
      commanderPrinting: null,
    });
    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    expect(room.toGameConfig().decks.find((d) => d.player === BOB)?.cards).toEqual(["Forest", "Forest"]);
  });

  it("setBotDeck changes an already-bot-filled seat's deck, and only a bot seat's", () => {
    const room = pendingRoom();
    room.addBot(BOB);
    room.setBotDeck(BOB, { cards: ["Island", "Island"], commander: "Ayara, First of Locthwain", name: "Mono-Black" });
    expect(room.seatStatuses().find((s) => s.player === BOB)?.deck).toEqual({
      name: "Mono-Black",
      commander: "Ayara, First of Locthwain",
      commanderPrinting: null,
    });

    room.claimSeat(ALICE, "alice-token", { send: () => {} });
    expect(() => room.setBotDeck(ALICE, { cards: ["Forest"] })).toThrow("isn't played by a bot");
  });

  it("setBotDeck rejects a deck naming an unknown card", () => {
    const room = pendingRoom();
    room.addBot(BOB);
    expect(() => room.setBotDeck(BOB, { cards: ["Ashmark, Mardu Vanguard"] })).toThrow(/doesn't know/);
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

  // A deck saved in a browser's localStorage outlives any card the pool later
  // renames or drops. Without this the bad name survives until `toGameConfig`
  // and then throws inside promotion — at the instant the room's last seat
  // fills, taking the room down for everyone in it.
  it("rejects a deck naming a card the registry doesn't have", () => {
    const room = pendingRoom();
    expect(() =>
      room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
        cards: ["Forest", "Ashmark, Mardu Vanguard", "Island"],
      }),
    ).toThrow(/doesn't know: Ashmark, Mardu Vanguard/);
    // The seat is left unclaimed, so the player can pick another deck.
    expect(room.seatStatuses()[0].claimed).toBe(false);
  });

  it("rejects a deck whose commander is unknown, even when its cards are fine", () => {
    const room = pendingRoom();
    expect(() =>
      room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
        cards: ["Forest", "Forest"],
        commander: "Sarova, the Undying Current",
      }),
    ).toThrow(/doesn't know: Sarova, the Undying Current/);
  });

  it("accepts a deck whose cards are all real", () => {
    const room = pendingRoom();
    room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, {
      cards: ["Forest", "Forest"],
      commander: "Ayara, First of Locthwain",
    });
    expect(room.seatStatuses()[0].claimed).toBe(true);
  });

  it("scales seat count with players (3-4)", () => {
    expect(pendingRoom(3).seatStatuses()).toHaveLength(3);
    expect(pendingRoom(4).seatStatuses()).toHaveLength(4);
  });

  describe("ready / allReady", () => {
    it("a bot seat is always reported ready; a claimed seat starts not ready", () => {
      const room = pendingRoom();
      room.addBot(BOB);
      room.claimSeat(ALICE, "alice-token", { send: () => {} });
      expect(room.seatStatuses().find((s) => s.player === BOB)?.ready).toBe(true);
      expect(room.seatStatuses().find((s) => s.player === ALICE)?.ready).toBe(false);
      expect(room.isReady()).toBe(true); // every seat filled...
      expect(room.allReady()).toBe(false); // ...but Alice hasn't readied up
    });

    it("claimSeat's own ready param readies up in the same call", () => {
      const room = pendingRoom();
      room.addBot(BOB);
      room.claimSeat(ALICE, "alice-token", { send: () => {} }, undefined, undefined, true);
      expect(room.seatStatuses().find((s) => s.player === ALICE)?.ready).toBe(true);
      expect(room.allReady()).toBe(true);
    });

    it("setReady toggles the caller's own seat and rejects an unclaimed connection", () => {
      const room = pendingRoom();
      const conn = { send: () => {} };
      room.claimSeat(ALICE, "alice-token", conn);
      room.setReady(conn, true);
      expect(room.seatStatuses().find((s) => s.player === ALICE)?.ready).toBe(true);
      room.setReady(conn, false);
      expect(room.seatStatuses().find((s) => s.player === ALICE)?.ready).toBe(false);

      expect(() => room.setReady({ send: () => {} }, true)).toThrow(/claim a seat/);
    });

    it("rejects changing a readied seat's deck until it un-readies", () => {
      const room = pendingRoom();
      const conn = { send: () => {} };
      room.claimSeat(ALICE, "alice-token", conn, undefined, { cards: ["Forest"] }, true);
      expect(() =>
        room.claimSeat(ALICE, "alice-token", conn, undefined, { cards: ["Island"] }),
      ).toThrow(/readied up/);
      // still the original deck
      room.addBot(BOB);
      expect(room.toGameConfig().decks.find((d) => d.player === ALICE)?.cards).toEqual(["Forest"]);

      room.setReady(conn, false);
      room.claimSeat(ALICE, "alice-token", conn, undefined, { cards: ["Island"] });
      expect(room.toGameConfig().decks.find((d) => d.player === ALICE)?.cards).toEqual(["Island"]);
    });
  });
});
