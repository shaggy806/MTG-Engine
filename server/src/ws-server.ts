/**
 * Wires a `WebSocketServer` to a `RoomManager`: parses each connection's
 * incoming messages as `ClientMessage`s, and pushes `ServerMessage`s back.
 * Kept separate from `index.ts` (which just starts a listener) so this can
 * be exercised in tests against an in-process server on an ephemeral port.
 */

import type { WebSocket, WebSocketServer } from "ws";
import type { RoomManager } from "./room-manager.js";
import type { Room, Connection } from "./room.js";
import type { ClientMessage, ServerMessage } from "./protocol.js";
import { ALICE, BOB, COMMANDERS, DECKS } from "./decks.js";

function send(ws: WebSocket, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

function broadcast(room: Room): void {
  const seats = room.seatStatuses();
  for (const { seat, connection } of room.connectedSeats()) {
    connection.send({
      type: "state",
      roomId: room.id,
      seat,
      view: room.game.viewFor(seat),
      actions: room.game.legalActions(seat),
      seats,
      autoPassing: room.isAutoPassing(seat),
      skipManaOnly: room.isSkippingManaOnly(seat),
    });
  }
}

function requireRoom(manager: RoomManager, roomId: string): Room {
  const room = manager.get(roomId);
  if (room === undefined) throw new Error(`no such room: ${roomId}`);
  return room;
}

export function attachRoomServer(wss: WebSocketServer, manager: RoomManager): void {
  wss.on("connection", (ws: WebSocket) => {
    let boundRoom: Room | null = null;
    const connection: Connection = { send: (message) => send(ws, message) };

    const handle = (message: ClientMessage): void => {
      switch (message.type) {
        case "create-room": {
          const room = manager.create({
            seed: message.seed,
            decks: [
              { player: ALICE, cards: [...DECKS.alice], commander: COMMANDERS.alice },
              { player: BOB, cards: [...DECKS.bob], commander: COMMANDERS.bob },
            ],
          });
          send(ws, { type: "room-created", roomId: room.id });
          return;
        }
        case "join-room": {
          const room = requireRoom(manager, message.roomId);
          boundRoom = room;
          send(ws, { type: "room-joined", roomId: room.id, seats: room.seatStatuses() });
          return;
        }
        case "claim-seat": {
          const room = requireRoom(manager, message.roomId);
          room.claimSeat(message.seat, message.clientToken, connection);
          boundRoom = room;
          broadcast(room);
          return;
        }
        case "dispatch": {
          const room = requireRoom(manager, message.roomId);
          room.dispatch(connection, message.action);
          broadcast(room);
          return;
        }
        case "pass-turn": {
          const room = requireRoom(manager, message.roomId);
          room.requestPassTurn(connection);
          broadcast(room);
          return;
        }
        case "auto-pass": {
          const room = requireRoom(manager, message.roomId);
          room.requestAutoPass(connection);
          broadcast(room);
          return;
        }
        case "toggle-mana-skip": {
          const room = requireRoom(manager, message.roomId);
          room.toggleSkipManaOnly(connection);
          broadcast(room);
          return;
        }
      }
    };

    ws.on("message", (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        send(ws, { type: "error", message: "malformed message" });
        return;
      }
      try {
        handle(message);
      } catch (err) {
        send(ws, { type: "error", message: err instanceof Error ? err.message : String(err) });
      }
    });

    ws.on("close", () => {
      if (boundRoom !== null) boundRoom.disconnect(connection);
    });
  });
}
