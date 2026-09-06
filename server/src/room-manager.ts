/** Creates rooms with unique short codes and looks them up by code. */

import { Game, autoSettle } from "engine";
import type { GameConfig } from "engine";
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
  private readonly rooms = new Map<string, Room>();

  create(config: GameConfig): Room {
    let id = randomRoomId();
    while (this.rooms.has(id)) id = randomRoomId();
    const game = Game.create(config);
    autoSettle(game);
    const room = new Room(id, game);
    this.rooms.set(id, room);
    return room;
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }
}
