import { describe, expect, it } from "vitest";

import { RoomManager } from "../room-manager.js";
import { renderStatus, statusSnapshot } from "../status.js";
import { ALICE, BOB } from "../decks.js";

const config = (seed = 1) => ({ seed });

/** A room with every seat bot-filled and the game actually running — the
 * `playing` case, which is what an operator is usually looking at. */
function startedRoom(manager: RoomManager) {
  const pending = manager.createPending(2, config());
  pending.addBot(ALICE);
  pending.addBot(BOB);
  return manager.promote(pending.id);
}

describe("status snapshot", () => {
  it("reports an empty server without inventing rooms", () => {
    const snapshot = statusSnapshot(new RoomManager());
    expect(snapshot.rooms).toHaveLength(0);
    expect(snapshot.counts.total).toBe(0);
    expect(snapshot.roomsCreated).toBe(0);
    expect(renderStatus(snapshot)).toContain("no rooms");
  });

  it("separates a room still filling up from one being played", () => {
    const manager = new RoomManager();
    manager.createPending(2, config(1));
    startedRoom(manager);

    const snapshot = statusSnapshot(manager);
    expect(snapshot.counts.total).toBe(2);
    expect(snapshot.counts.waiting).toBe(1);
    expect(snapshot.counts.playing).toBe(1);
    expect(snapshot.counts.finished).toBe(0);
  });

  it("counts rooms created since start, not just the live ones", () => {
    // A live count alone can't tell a quiet server from one that just
    // restarted, which is exactly the question being asked after an incident.
    const manager = new RoomManager();
    for (let i = 0; i < 3; i += 1) manager.createPending(2, config(i));
    manager.reapIdle(-1);
    const snapshot = statusSnapshot(manager);
    expect(snapshot.counts.total).toBe(0);
    expect(snapshot.roomsCreated).toBe(3);
  });

  it("reports a playing room's turn, step and seats", () => {
    const manager = new RoomManager();
    startedRoom(manager);
    const [room] = statusSnapshot(manager).rooms;

    expect(room.stage).toBe("playing");
    expect(room.turn).toBeGreaterThan(0);
    expect(room.step).toBeTruthy();
    expect(room.activePlayer).toBeTruthy();
    expect(room.winner).toBeNull();
    expect(room.bots).toBe(2);
    expect(room.humansOnline).toBe(0);
    expect(room.seats).toHaveLength(2);
  });

  it("leaves a waiting room's game fields empty rather than guessing", () => {
    const manager = new RoomManager();
    manager.createPending(4, config());
    const [room] = statusSnapshot(manager).rooms;

    expect(room.stage).toBe("waiting");
    expect(room.turn).toBeNull();
    expect(room.step).toBeNull();
    expect(room.activePlayer).toBeNull();
    expect(room.seats).toHaveLength(4);
    expect(room.seats.every((s) => !s.claimed)).toBe(true);
  });

  it("renders a table a person can read", () => {
    const manager = new RoomManager();
    const room = startedRoom(manager);
    const text = renderStatus(statusSnapshot(manager));

    expect(text).toContain(room.id);
    expect(text).toContain("playing");
    expect(text).toMatch(/uptime/);
    expect(text).toMatch(/rss \d+ MB/);
    // Bot seats read as "bot" rather than as a player name.
    expect(text).toContain("bot,bot");
  });

  it("carries room codes, which is why the endpoint is loopback-only", () => {
    // Not a behaviour test so much as a standing reminder: a room code is a
    // join credential, so this payload must never be served on the port the
    // Cloudflare tunnel forwards. See `status.ts`.
    const manager = new RoomManager();
    const room = startedRoom(manager);
    expect(statusSnapshot(manager).rooms[0].id).toBe(room.id);
  });
});
