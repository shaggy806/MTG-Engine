import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomManager } from "../room-manager.js";
import { ALICE } from "../decks.js";

function config(seed = 1) {
  return { seed };
}

describe("RoomManager", () => {
  it("creates a pending room with a short, unique code", () => {
    const manager = new RoomManager();
    const room = manager.createPending(2, config());
    expect(room.id).toMatch(/^[A-Z0-9]{5}$/);
    expect(manager.get(room.id)).toBe(room);
  });

  it("never collides two rooms' codes", () => {
    const manager = new RoomManager();
    const ids = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      ids.add(manager.createPending(2, config(i)).id);
    }
    expect(ids.size).toBe(50);
  });

  it("returns undefined for an unknown room id", () => {
    const manager = new RoomManager();
    expect(manager.get("NOPE1")).toBeUndefined();
  });

  describe("promote", () => {
    it("refuses to promote a room that isn't ready yet", () => {
      const manager = new RoomManager();
      const room = manager.createPending(2, config());
      room.claimSeat(ALICE, "alice-token", { send: () => {} });
      expect(() => manager.promote(room.id)).toThrow(/isn't ready/);
    });

    it("builds a real Game once every seat is claimed or bot-filled, replaying connections", () => {
      const manager = new RoomManager();
      const pending = manager.createPending(2, config());
      const aliceConnection = { send: () => {} };
      pending.claimSeat(ALICE, "alice-token", aliceConnection, "Alice");
      pending.addBot(pending.seatStatuses()[1].player);
      expect(pending.isReady()).toBe(true);

      const room = manager.promote(pending.id);
      expect(manager.get(pending.id)).toBe(room);
      expect(room.seatOf(aliceConnection)).toBe(ALICE);
      expect(room.seatStatuses().find((s) => s.player === ALICE)?.displayName).toBe("Alice");
      expect(room.seatStatuses().every((s) => s.claimed || s.isBot)).toBe(true);
    });
  });

  describe("reapIdle", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("deletes a room with no connected seats once it's past the idle threshold", () => {
      const manager = new RoomManager();
      const room = manager.createPending(2, config());
      vi.advanceTimersByTime(1_000);

      expect(manager.reapIdle(500)).toBe(1);
      expect(manager.get(room.id)).toBeUndefined();
    });

    it("leaves a room alone until it's actually past the threshold", () => {
      const manager = new RoomManager();
      const room = manager.createPending(2, config());
      vi.advanceTimersByTime(1_000);

      expect(manager.reapIdle(5_000)).toBe(0);
      expect(manager.get(room.id)).toBe(room);
    });

    it("never reaps a room with a connected seat, no matter how idle", () => {
      const manager = new RoomManager();
      const room = manager.createPending(2, config());
      room.claimSeat(ALICE, "alice-token", { send: () => {} });
      vi.advanceTimersByTime(1_000_000);

      expect(manager.reapIdle(500)).toBe(0);
      expect(manager.get(room.id)).toBe(room);
    });

    it("resets the idle clock on real activity (a claim)", () => {
      const manager = new RoomManager();
      const room = manager.createPending(2, config());
      const connection = { send: () => {} };
      vi.advanceTimersByTime(1_000);
      room.claimSeat(ALICE, "alice-token", connection);
      room.disconnect(connection); // back to zero connected seats
      vi.advanceTimersByTime(1_000);

      // 1000ms since the claim, not 2000ms since creation.
      expect(manager.reapIdle(1_500)).toBe(0);
      expect(manager.get(room.id)).toBe(room);
    });
  });
});
