/**
 * Wires a `WebSocketServer` to a `RoomManager`: parses each connection's
 * incoming messages as `ClientMessage`s, and pushes `ServerMessage`s back.
 * Kept separate from `index.ts` (which just starts a listener) so this can
 * be exercised in tests against an in-process server on an ephemeral port.
 */

import type { IncomingMessage } from "node:http";
import type { WebSocket, WebSocketServer } from "ws";
import { COMMANDER_RULES } from "engine";
import type { ArtManifestEntry } from "engine";
import type { RoomManager } from "./room-manager.js";
import type { Room, Connection } from "./room.js";
import type { CaptureLog } from "./capture.js";
import { PendingRoom } from "./pending-room.js";
import type { BuilderSession } from "./builder.js";
import type { ClientMessage, ServerMessage } from "protocol";

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

/**
 * Turns one published frame into one `state` message per connected seat.
 * Never called directly by a message handler: a room publishes its own
 * frames (it paces bot moves against the clients' animations, so pushes
 * don't line up one-to-one with incoming messages any more), and this is
 * wired up as `RoomManager.onRoomUpdate`. Anything that wants a push asks
 * the room for one via `room.publish()`.
 */
function broadcast(room: Room): void {
  const seats = room.seatStatuses();
  for (const { seat, connection } of room.connectedSeats()) {
    const firstFrame = !sentArtManifest.has(connection);
    if (firstFrame) sentArtManifest.add(connection);
    connection.send({
      type: "state",
      roomId: room.id,
      seq: room.frameSeq,
      seat,
      view: room.game.viewFor(seat),
      actions: room.frozen ? [] : room.game.legalActions(seat),
      seats,
      autoPassing: room.isAutoPassing(seat),
      autoPassPaused: room.isAutoPassPaused(seat),
      isHost: room.isHost(connection),
      botSpeed: room.botSpeed,
      botsPaused: room.botsPaused,
      ...(room.captures !== null ? { capture: true as const } : {}),
      ...(room.builder !== null ? { builder: room.builder } : {}),
      ...(firstFrame ? { artManifest: artManifestFor(room) } : {}),
    });
  }
}

/** The connections that have had this game's art manifest — each gets it
 * with its first frame, a reconnecting one (a new connection) again. */
const sentArtManifest = new WeakSet<Connection>();
const artManifests = new WeakMap<Room, readonly ArtManifestEntry[]>();

/** Every card in the room's decks, worked out once: the cards are all there
 * from the start, and none join a deck later. */
function artManifestFor(room: Room): readonly ArtManifestEntry[] {
  let manifest = artManifests.get(room);
  if (manifest === undefined) {
    manifest = room.game.artManifest();
    artManifests.set(room, manifest);
  }
  return manifest;
}

/** The capture log of a room that keeps one, for its host — see
 * `capture.ts`. */
function requireCaptures(manager: RoomManager, roomId: string, connection: Connection): CaptureLog {
  const room = requireActiveRoom(manager, roomId);
  requireHost(room, connection, "capture positions");
  if (room.captures === null) throw new Error("this server isn't capturing (start it with --capture)");
  return room.captures;
}

/** A `room-joined` for one connection — `isHost` differs per recipient. */
function roomJoined(room: Room | PendingRoom, connection: Connection): ServerMessage {
  return {
    type: "room-joined",
    roomId: room.id,
    seats: room.seatStatuses(),
    isHost: room.isHost(connection),
    botSpeed: room.botSpeed,
    seat: room.seatOf(connection),
    pending: room instanceof PendingRoom,
  };
}

/** Every currently-connected seat of a still-waiting room gets a refreshed
 * seat list (no `state` — there's no `Game` yet), same as `broadcast` does
 * for a real `Room`. */
function broadcastPending(room: PendingRoom, except?: Connection): void {
  const connections = room.connectedSeats().map((s) => s.connection);
  // A host who hasn't picked a seat yet is running the table from the seat
  // picker, and needs to see it change as much as anyone seated.
  const host = room.unseatedHost();
  if (host !== null) connections.push(host);
  for (const connection of connections) {
    if (connection !== except) connection.send(roomJoined(room, connection));
  }
}

/** Throws unless `connection` holds `room`'s host role — see `HostRole`. */
function requireHost(room: Room | PendingRoom, connection: Connection, what: string): void {
  if (!room.isHost(connection)) throw new Error(`only the host can ${what}`);
}

function requireRoom(manager: RoomManager, roomId: string): Room | PendingRoom {
  const room = manager.get(roomId);
  if (room === undefined) throw new Error(`no such room: ${roomId}`);
  // Bind this transport to the room's frames if nobody has. Rooms this
  // manager promoted are wired at construction; one built by hand and served
  // through a bare manager (the repo-root `scratch.mjs` pattern) is wired
  // here instead. Idempotent, so it doesn't matter which came first.
  if (!(room instanceof PendingRoom)) room.onUpdate = broadcast;
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

/** The inverse of `requireActiveRoom` — for messages (`set-ready`/
 * `start-game`) that only make sense before the room's `Game` exists. */
function requirePendingRoom(manager: RoomManager, roomId: string): PendingRoom {
  const room = requireRoom(manager, roomId);
  if (!(room instanceof PendingRoom)) {
    throw new Error(`room ${roomId} has already started`);
  }
  return room;
}

/** Promotes a ready `PendingRoom` and broadcasts the result, or reports why
 * not without taking the whole room down — a bad deck only surfaces here,
 * at promotion time (see `manager.promote`). Returns the new `Room` on
 * success so the caller can update its own `boundRoom`, or `null` if
 * promotion failed (the room is left pending). */
function tryPromote(ws: WebSocket, manager: RoomManager, room: PendingRoom): Room | null {
  try {
    // `promote` settles the new room and publishes its opening frame itself,
    // so there's nothing to broadcast here on the way out.
    return manager.promote(room.id);
  } catch (err) {
    send(ws, {
      type: "error",
      message: `could not start the game: ${err instanceof Error ? err.message : String(err)}`,
    });
    broadcastPending(room);
    return null;
  }
}

/** What a server offers beyond the public game. */
export interface RoomServerOptions {
  /** The scenario builder's messages (`builder.ts`): a developer's server
   * only, since it lets a client put any card anywhere. */
  readonly builder?: boolean;
}

/** The scenario builder serving `roomId`, or why there isn't one. */
function requireBuilder(manager: RoomManager, roomId: string, enabled: boolean): BuilderSession {
  if (!enabled) throw new Error("this server wasn't started with --builder");
  const session = manager.builder(roomId);
  if (session === undefined) throw new Error(`room ${roomId} isn't a scenario builder`);
  // As `requireRoom` does: bind this transport to the room's frames.
  session.room.onUpdate = broadcast;
  return session;
}

export function attachRoomServer(
  wss: WebSocketServer,
  manager: RoomManager,
  options: RoomServerOptions = {},
): void {
  const builderEnabled = options.builder === true;
  // Every frame a promoted room publishes — whether it came from a message
  // just handled or from a bot the room released on its own clock — goes out
  // through here.
  manager.onRoomUpdate = broadcast;

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
          const room = manager.createPending(
            numPlayers,
            {
              seed,
              mulligans: true,
              rules: COMMANDER_RULES,
            },
            message.hostToken,
          );
          send(ws, { type: "room-created", roomId: room.id });
          return;
        }
        case "join-room": {
          const room = requireRoom(manager, message.roomId);
          boundRoom = room;
          room.bindHost(connection, message.hostToken);
          send(ws, roomJoined(room, connection));
          // The host coming back takes the role back from whoever was
          // standing in, which everyone else's seat board shows.
          if (room instanceof PendingRoom) broadcastPending(room, connection);
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
              message.ready,
            );
          } catch (err) {
            // Rejected claim (seat taken by someone else, etc.) — tell the
            // client why *and* re-send the current seat list so its picker
            // isn't stuck on a stale view.
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            send(ws, roomJoined(room, connection));
            return;
          }
          boundRoom = room;
          if (room instanceof PendingRoom) broadcastPending(room);
          else room.publish();
          return;
        }
        case "take-seat": {
          const room = requirePendingRoom(manager, message.roomId);
          try {
            room.takeSeat(message.clientToken, connection, message.displayName, message.deck);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            send(ws, roomJoined(room, connection));
            return;
          }
          boundRoom = room;
          broadcastPending(room);
          return;
        }
        case "add-bot": {
          const room = requireRoom(manager, message.roomId);
          try {
            requireHost(room, connection, "add bots");
            room.addBot(message.seat, message.deck);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            return;
          }
          // An active room already published a frame from inside `addBot`
          // (it settles), so only a pending one needs a push here.
          if (room instanceof PendingRoom) broadcastPending(room);
          // A caller who hasn't claimed a seat yet (still on the seat
          // picker) isn't in `connectedSeats()`, so the broadcast above
          // never reaches them — refresh their picker directly, same as a
          // rejected `claim-seat` does.
          if (room.seatOf(connection) === null && !(room instanceof PendingRoom && room.unseatedHost() === connection)) {
            send(ws, roomJoined(room, connection));
          }
          return;
        }
        case "set-bot-deck": {
          const room = requireRoom(manager, message.roomId);
          try {
            requireHost(room, connection, "choose a bot's deck");
            room.setBotDeck(message.seat, message.deck);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            return;
          }
          // `setBotDeck` throws outright on an active room, so this is only
          // ever the pending case.
          if (room instanceof PendingRoom) broadcastPending(room);
          // Same as `add-bot` above — a caller still on the seat picker
          // isn't in `connectedSeats()`, so refresh them directly.
          if (room.seatOf(connection) === null && !(room instanceof PendingRoom && room.unseatedHost() === connection)) {
            send(ws, roomJoined(room, connection));
          }
          return;
        }
        case "add-seat":
        case "remove-seat": {
          // Sizing the table is a waiting-room decision by construction —
          // once there's a `Game`, its turn order is dealt and fixed.
          const room = requirePendingRoom(manager, message.roomId);
          try {
            requireHost(room, connection, "change the table size");
            if (message.type === "add-seat") room.addSeat();
            else room.removeSeat(message.seat);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            return;
          }
          broadcastPending(room);
          // Same as `add-bot` above: whoever resized the table may not hold a
          // seat here yet, so they aren't in `connectedSeats()` and the
          // broadcast above never reaches them.
          if (room.seatOf(connection) === null && room.unseatedHost() !== connection) {
            send(ws, roomJoined(room, connection));
          }
          return;
        }
        case "set-ready": {
          const room = requirePendingRoom(manager, message.roomId);
          try {
            room.setReady(connection, message.ready);
          } catch (err) {
            send(ws, {
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
            return;
          }
          broadcastPending(room);
          return;
        }
        case "leave-room": {
          const room = requirePendingRoom(manager, message.roomId);
          room.leave(connection);
          boundRoom = null;
          broadcastPending(room);
          return;
        }
        case "start-game": {
          const room = requirePendingRoom(manager, message.roomId);
          requireHost(room, connection, "start the game");
          if (!room.allReady()) {
            send(ws, { type: "error", message: "not everyone is ready yet" });
            return;
          }
          const activeRoom = tryPromote(ws, manager, room);
          if (activeRoom !== null) boundRoom = activeRoom;
          return;
        }
        case "set-bot-speed": {
          const room = requireRoom(manager, message.roomId);
          requireHost(room, connection, "set the bot speed");
          if (!["fast", "normal", "slow"].includes(message.speed)) {
            throw new Error(`unknown bot speed: ${String(message.speed)}`);
          }
          room.setBotSpeed(message.speed);
          if (room instanceof PendingRoom) broadcastPending(room);
          else room.publish();
          return;
        }
        case "set-bots-paused": {
          const room = requireActiveRoom(manager, message.roomId);
          requireHost(room, connection, "pause the bots");
          room.setBotsPaused(message.paused === true);
          room.publish();
          return;
        }
        case "step-bots": {
          const room = requireActiveRoom(manager, message.roomId);
          requireHost(room, connection, "step the bots");
          room.stepBots();
          return;
        }
        // Each of these settles the room, and settling publishes its own
        // frame (one per bot action, in `"realtime"` pacing) — so none of
        // them broadcasts on the way out.
        case "dispatch": {
          requireActiveRoom(manager, message.roomId).dispatch(connection, message.action);
          return;
        }
        case "set-pass-settings": {
          requireActiveRoom(manager, message.roomId).setPassSettings(connection, message.settings);
          return;
        }
        case "concede": {
          requireActiveRoom(manager, message.roomId).concede(connection);
          return;
        }
        case "bot-takeover": {
          requireActiveRoom(manager, message.roomId).setBotTakeover(connection, message.on);
          return;
        }
        case "pass-turn": {
          requireActiveRoom(manager, message.roomId).requestPassTurn(connection);
          return;
        }
        case "auto-pass": {
          requireActiveRoom(manager, message.roomId).requestAutoPass(connection);
          return;
        }
        case "resolve-all": {
          requireActiveRoom(manager, message.roomId).requestResolveAll(connection);
          return;
        }
        case "capture-list": {
          const log = requireCaptures(manager, message.roomId, connection);
          connection.send({ type: "capture-list", entries: log.list() });
          return;
        }
        case "capture-options": {
          const log = requireCaptures(manager, message.roomId, connection);
          connection.send({ type: "capture-options", id: message.id, ...log.options(message.id) });
          return;
        }
        case "capture-save": {
          const log = requireCaptures(manager, message.roomId, connection);
          const file = log.save(message.id, message.expect, message.note ?? "", message.name);
          connection.send({ type: "capture-saved", file });
          return;
        }
        case "capture-report": {
          const log = requireCaptures(manager, message.roomId, connection);
          const room = requireActiveRoom(manager, message.roomId);
          const file = log.report(
            room.game.state,
            room.seatOf(connection),
            message.title ?? "",
            message.description ?? "",
            message.image,
          );
          connection.send({ type: "capture-saved", file });
          return;
        }
        case "builder-create": {
          if (!builderEnabled) throw new Error("this server wasn't started with --builder");
          const session = manager.createBuilder(message.hostToken);
          send(ws, { type: "room-created", roomId: session.id });
          return;
        }
        case "builder-update": {
          const session = requireBuilder(manager, message.roomId, builderEnabled);
          requireHost(session.room, connection, "change the board");
          session.update(message.spec);
          return;
        }
        case "builder-start": {
          const session = requireBuilder(manager, message.roomId, builderEnabled);
          requireHost(session.room, connection, "start play");
          session.start();
          return;
        }
        case "builder-stop": {
          const session = requireBuilder(manager, message.roomId, builderEnabled);
          requireHost(session.room, connection, "stop play");
          session.stop();
          return;
        }
        case "builder-snapshot": {
          const session = requireBuilder(manager, message.roomId, builderEnabled);
          requireHost(session.room, connection, "stop play");
          session.snapshot();
          return;
        }
        case "builder-seat": {
          requireBuilder(manager, message.roomId, builderEnabled).switchSeat(connection, message.seat);
          return;
        }
        case "ack": {
          // Purely a pacing signal, and one the client sends on its own
          // schedule — a stale room id here means the game is over or the
          // server restarted, which is nothing to report back about.
          const room = manager.get(message.roomId);
          if (room instanceof PendingRoom || room === undefined) return;
          room.ack(connection, message.seq);
          return;
        }
      }
    };

    ws.on("message", (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        if (!isRateLimited(ip)) send(ws, { type: "error", message: "malformed message" });
        return;
      }
      // `ack` is automatic traffic — one per frame the client finishes
      // showing, with no effect beyond releasing a bot — and a busy table
      // sends plenty of them, so it doesn't spend the budget meant for
      // someone hammering `join-room` to guess room codes.
      if (message.type !== "ack" && isRateLimited(ip)) {
        send(ws, { type: "error", message: "too many requests, slow down" });
        return;
      }
      try {
        handle(message);
      } catch (err) {
        send(ws, { type: "error", message: err instanceof Error ? err.message : String(err) });
      }
    });

    ws.on("close", () => {
      if (boundRoom === null) return;
      // A scenario builder has replaced the room this connection first bound
      // to with each rebuild: the one under the code now is the one it's in.
      const room = manager.get(boundRoom.id) ?? boundRoom;
      room.disconnect(connection);
      // The host leaving hands the role to someone still here.
      if (room instanceof PendingRoom) broadcastPending(room);
    });
  });
}
