/** Creates rooms with unique short codes and looks them up by code. */

import { Game, autoSettle } from "engine";
import { PendingRoom } from "./pending-room.js";
import type { PendingGameConfig } from "./pending-room.js";
import { Room } from "./room.js";

// No 0/O/1/I — avoids characters easily confused when a code is read aloud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

function randomRoomId(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export class RoomManager {
  private readonly rooms = new Map<string, Room | PendingRoom>();

  /** Creates a room with no `Game` yet — every seat's deck is unknown until
   * whoever claims it connects (see `PendingRoom`'s own comment). Call
   * `promote` once `get(id).isReady()` (a `PendingRoom` only) to actually
   * build the `Game` and turn it into a real `Room`. */
  createPending(players: number, config: PendingGameConfig): PendingRoom {
    let id = randomRoomId();
    while (this.rooms.has(id)) id = randomRoomId();
    const room = new PendingRoom(id, players, config);
    this.rooms.set(id, room);
    return room;
  }

  /** Builds the real `Game`/`Room` for a ready `PendingRoom`, replaying its
   * already-connected seats' claims and bot fills onto the new `Room`, then
   * settles it once (mirroring the old eager `create`'s one-time
   * `autoSettle` call) before anyone can act. Replaces the map entry and
   * returns the promoted `Room`. */
  promote(id: string): Room {
    const pending = this.rooms.get(id);
    if (!(pending instanceof PendingRoom)) {
      throw new Error(`room ${id} is not pending (already promoted, or doesn't exist)`);
    }
    if (!pending.isReady()) throw new Error(`room ${id} isn't ready to start yet`);

    const game = Game.create(pending.toGameConfig());
    const room = new Room(id, game);
    for (const claim of pending.claims()) {
      room.claimSeat(claim.player, claim.clientToken, claim.connection, claim.displayName ?? undefined);
    }
    for (const player of pending.botSeats()) {
      room.addBot(player);
    }
    autoSettle(game);
    this.rooms.set(id, room);
    return room;
  }

  get(roomId: string): Room | PendingRoom | undefined {
    return this.rooms.get(roomId);
  }

  /** Deletes rooms with no connected seats that have been idle past
   * `maxIdleMs`, so an abandoned or never-joined room doesn't sit in memory
   * for the life of the process. Returns how many were reaped. */
  reapIdle(maxIdleMs: number): number {
    let reaped = 0;
    for (const [id, room] of this.rooms) {
      if (room.connectedSeats().length === 0 && room.idleMs() > maxIdleMs) {
        this.rooms.delete(id);
        reaped += 1;
      }
    }
    return reaped;
  }
}
