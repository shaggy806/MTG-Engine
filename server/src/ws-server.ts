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
import type { ClientMessage, ServerMessage } from "./protocol.js";
import { SEATS } from "./decks.js";

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

function requireRoom(manager: RoomManager, roomId: string): Room {
  const room = manager.get(roomId);
  if (room === undefined) throw new Error(`no such room: ${roomId}`);
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
    let boundRoom: Room | null = null;
    const ip = clientIp(req);
    const connection: Connection = { send: (message) => send(ws, message) };

    const handle = (message: ClientMessage): void => {
      switch (message.type) {
        case "create-room": {
          const numPlayers = Math.min(4, Math.max(2, message.players ?? 2));
          const seats = SEATS.slice(0, numPlayers);
          // The "highroll" — who goes first is randomized per room, not
          // always the first-listed seat. Independent of `seed` (which only
          // governs deck shuffling) so it doesn't shift the deterministic
          // draw order tests and replays rely on.
          const startingPlayer = seats[Math.floor(Math.random() * seats.length)].id;
          const room = manager.create({
            seed: message.seed,
            mulligans: true,
            rules: { startingLife: 40 },
            startingPlayer,
            decks: seats.map((seat) => ({
              player: seat.id,
              cards: [...seat.cards],
              commander: seat.commander,
            })),
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
