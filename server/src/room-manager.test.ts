import { describe, expect, it } from "vitest";
import { RoomManager } from "./room-manager.js";
import { ALICE, BOB, DECKS } from "./decks.js";

function config(seed = 1) {
  return {
    seed,
    decks: [
      { player: ALICE, cards: [...DECKS.alice] },
      { player: BOB, cards: [...DECKS.bob] },
    ],
  };
}

describe("RoomManager", () => {
  it("creates a room with a short, unique code", () => {
    const manager = new RoomManager();
    const room = manager.create(config());
    expect(room.id).toMatch(/^[A-Z0-9]{5}$/);
    expect(manager.get(room.id)).toBe(room);
  });

  it("never collides two rooms' codes", () => {
    const manager = new RoomManager();
    const ids = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      ids.add(manager.create(config(i)).id);
    }
    expect(ids.size).toBe(50);
  });

  it("returns undefined for an unknown room id", () => {
    const manager = new RoomManager();
    expect(manager.get("NOPE1")).toBeUndefined();
  });
});
