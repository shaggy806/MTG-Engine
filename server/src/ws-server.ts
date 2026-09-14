/**
 * Wires a `WebSocketServer` to a `RoomManager`: parses each connection's
 * incoming messages as `ClientMessage`s, and pushes `ServerMessage`s back.
 * Kept separate from `index.ts` (which just starts a listener) so this can
 * be exercised in tests against an in-process server on an ephemeral port.
 */

import type { IncomingMessage } from "node:http";
import type { WebSocket, WebSocketServer } from "ws";
import type { RoomManager } from "./room-manager.js";
import type { Room, Connection } from "./room.js";
import { PendingRoom } from "./pending-room.js";
import type { ClientMessage, ServerMessage } from "./protocol.js";

const RATE_LIMIT_WINDOW_MS = 5_000;
const RATE_LIMIT_MAX_MESSAGES = 40;

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["cf-connecting-ip"];
  if (typeof forwarded === "string") return forwarded;
  return req.socket.remoteAddress ?? "unknown";
}

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

/** Every currently-connected seat of a still-waiting room gets a refreshed
 * seat list (no `state` — there's no `Game` yet), same as `broadcast` does
 * for a real `Room`. */
function broadcastPending(room: PendingRoom): void {
  const seats = room.seatStatuses();
  for (const { connection } of room.connectedSeats()) {
    connection.send({ type: "room-joined", roomId: room.id, seats });
  }
}

function requireRoom(manager: RoomManager, roomId: string): Room | PendingRoom {
  const room = manager.get(roomId);
  if (room === undefined) throw new Error(`no such room: ${roomId}`);
  return room;
}

/** Like `requireRoom`, but for messages (`dispatch`/`pass-turn`/etc.) that
 * only make sense once the room's `Game` actually exists — a client
 * shouldn't be able to send these before its first `state` message arrives,
 * but this guards it with a clear error instead of a confusing crash if it
 * somehow does. */
function requireActiveRoom(manager: RoomManager, roomId: string): Room {
  const room = requireRoom(manager, roomId);
  if (room instanceof PendingRoom) {
    throw new Error(`room ${roomId} hasn't started yet — still waiting on seats`);
  }
  return room;
}

export function attachRoomServer(wss: WebSocketServer, manager: RoomManager): void {
  // Keyed by client IP rather than per-connection, since nothing stops one
  // IP from opening many sockets — a fixed window is enough to blunt a bot
  // hammering `join-room`/`claim-seat` to brute-force room codes without
  // getting in the way of normal play (a real game is nowhere near this
  // chatty). Swept periodically so the map doesn't grow unbounded across
  // many distinct visitors over the life of the process; the sweep stops
  // once `wss` closes rather than outliving it.
  const rateLimitState = new Map<string, { count: number; resetAt: number }>();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitState) {
      if (now >= entry.resetAt) rateLimitState.delete(ip);
    }
  }, RATE_LIMIT_WINDOW_MS * 10);
  sweep.unref();
  wss.once("close", () => clearInterval(sweep));

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitState.get(ip);
    if (entry === undefined || now >= entry.resetAt) {
      rateLimitState.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX_MESSAGES;
  }

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    let boundRoom: Room | PendingRoom | null = null;
    const ip = clientIp(req);
    const connection: Connection = { send: (message) => send(ws, message) };

    const handle = (message: ClientMessage): void => {
      switch (message.type) {
        case "create-room": {
          const numPlayers = Math.min(4, Math.max(2, message.players ?? 2));
          // A real room should shuffle freshly every time — only fall back
          // to Game.create's fixed internal default (meant for scripts/tests
          // that omit a seed on purpose) when nobody asked for a specific
          // one. Without this, every "Create Room" click reused that same
          // constant and every game opened with an identical shuffle.
          const seed = message.seed ?? Math.floor(Math.random() * 0x100000000);
          const room = manager.createPending(numPlayers, {
            seed,
            mulligans: true,
            rules: { startingLife: 40, freeFirstMulligan: true },
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
          try {
            room.claimSeat(
              message.seat,
              message.clientToken,
              connection,
              message.displayName,
              message.deck,
            );
          } catch (err) {
            // Rejected claim (seat taken by someone else, etc.) — tell the
            // client why *and* re-send the current seat list so its picker
            // isn't stuck on a stale view.
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            send(ws, {
              type: "room-joined",
              roomId: room.id,
              seats: room.seatStatuses(),
            });
            return;
          }
          if (room instanceof PendingRoom && room.isReady()) {
            const activeRoom = manager.promote(room.id);
            boundRoom = activeRoom;
            broadcast(activeRoom);
            return;
          }
          boundRoom = room;
          if (room instanceof PendingRoom) broadcastPending(room);
          else broadcast(room);
          return;
        }
        case "add-bot": {
          const room = requireRoom(manager, message.roomId);
          try {
            room.addBot(message.seat);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            return;
          }
          if (room instanceof PendingRoom && room.isReady()) {
            broadcast(manager.promote(room.id));
            return;
          }
          if (room instanceof PendingRoom) broadcastPending(room);
          else broadcast(room);
          // A caller who hasn't claimed a seat yet (still on the seat
          // picker) isn't in `connectedSeats()`, so the broadcast above
          // never reaches them — refresh their picker directly, same as a
          // rejected `claim-seat` does.
          if (room.seatOf(connection) === null) {
            send(ws, { type: "room-joined", roomId: room.id, seats: room.seatStatuses() });
          }
          return;
        }
        case "dispatch": {
          const room = requireActiveRoom(manager, message.roomId);
          room.dispatch(connection, message.action);
          broadcast(room);
          return;
        }
        case "pass-turn": {
          const room = requireActiveRoom(manager, message.roomId);
          room.requestPassTurn(connection);
          broadcast(room);
          return;
        }
        case "auto-pass": {
          const room = requireActiveRoom(manager, message.roomId);
          room.requestAutoPass(connection);
          broadcast(room);
          return;
        }
        case "toggle-mana-skip": {
          const room = requireActiveRoom(manager, message.roomId);
          room.toggleSkipManaOnly(connection);
          broadcast(room);
          return;
        }
      }
    };

    ws.on("message", (raw) => {
      if (isRateLimited(ip)) {
        send(ws, { type: "error", message: "too many requests, slow down" });
        return;
      }
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
