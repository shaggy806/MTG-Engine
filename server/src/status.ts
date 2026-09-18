/**
 * An operator's view of the running server: what rooms exist, who is in them,
 * and whether the process is healthy. Meant to be read over SSH with `curl`.
 *
 * ## Why this listens on its own port, on loopback only
 *
 * The game server's port is published to the open internet — `ws.tobyens.com`
 * forwards straight to it through the Cloudflare tunnel (see `DEPLOYMENT.md`).
 * And **a room code is a join credential**: anyone who knows one can walk into
 * that game. A status page listing room codes on the public port would be an
 * open invitation to every game in progress.
 *
 * Checking the caller's address on the main port would not help either, because
 * `cloudflared` connects to `http://localhost:4000` — every public request
 * *arrives* from 127.0.0.1, so a loopback check there would pass for the whole
 * internet. Binding a second listener to 127.0.0.1 on a port the tunnel does
 * not forward is what actually makes it private, and it is why this is a
 * separate server rather than another route.
 */

import { createServer } from "node:http";
import type { Server } from "node:http";

import { activePlayerOf } from "engine";
import { Room } from "./room.js";
import type { RoomManager } from "./room-manager.js";

export interface SeatSummary {
  readonly player: string;
  readonly claimed: boolean;
  readonly online: boolean;
  readonly isBot: boolean;
  readonly displayName: string | null;
}

export interface RoomSummary {
  readonly id: string;
  /** `waiting` is a `PendingRoom` with seats still to fill; `playing` and
   * `finished` are promoted rooms either side of the game ending. */
  readonly stage: "waiting" | "playing" | "finished";
  readonly seats: readonly SeatSummary[];
  readonly humansOnline: number;
  readonly bots: number;
  /** Only for a promoted room. */
  readonly turn: number | null;
  readonly step: string | null;
  readonly activePlayer: string | null;
  readonly winner: string | null;
  readonly idleMs: number;
}

export interface StatusSnapshot {
  readonly startedAt: string;
  readonly uptimeSeconds: number;
  readonly pid: number;
  readonly node: string;
  readonly rssMb: number;
  readonly heapUsedMb: number;
  readonly roomsCreated: number;
  readonly rooms: readonly RoomSummary[];
  readonly counts: {
    readonly total: number;
    readonly waiting: number;
    readonly playing: number;
    readonly finished: number;
  };
  readonly humansOnline: number;
  readonly bots: number;
}

const startedAt = Date.now();
const mb = (bytes: number): number => Math.round(bytes / 1024 / 1024);

export function statusSnapshot(manager: RoomManager): StatusSnapshot {
  const memory = process.memoryUsage();
  const rooms: RoomSummary[] = [];

  for (const room of manager.all()) {
    const seats: SeatSummary[] = room.seatStatuses().map((s) => ({
      player: String(s.player),
      claimed: s.claimed,
      online: s.online,
      isBot: s.isBot ?? false,
      displayName: s.displayName,
    }));
    const bots = seats.filter((s) => s.isBot).length;
    const humansOnline = seats.filter((s) => s.online && !s.isBot).length;

    if (room instanceof Room) {
      const over = room.game.isOver;
      rooms.push({
        id: room.id,
        stage: over ? "finished" : "playing",
        seats,
        humansOnline,
        bots,
        turn: room.game.state.turn.number,
        step: room.game.state.turn.step,
        // A finished game has no one to act, and asking costs nothing but
        // means nothing either.
        activePlayer: over ? null : String(activePlayerOf(room.game.state)),
        winner: room.game.winner === null ? null : String(room.game.winner),
        idleMs: room.idleMs(),
      });
      continue;
    }

    rooms.push({
      id: room.id,
      stage: "waiting",
      seats,
      humansOnline,
      bots,
      turn: null,
      step: null,
      activePlayer: null,
      winner: null,
      idleMs: room.idleMs(),
    });
  }

  const counts = {
    total: rooms.length,
    waiting: rooms.filter((r) => r.stage === "waiting").length,
    playing: rooms.filter((r) => r.stage === "playing").length,
    finished: rooms.filter((r) => r.stage === "finished").length,
  };

  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    pid: process.pid,
    node: process.version,
    rssMb: mb(memory.rss),
    heapUsedMb: mb(memory.heapUsed),
    roomsCreated: manager.roomsCreated,
    rooms,
    counts,
    humansOnline: rooms.reduce((n, r) => n + r.humansOnline, 0),
    bots: rooms.reduce((n, r) => n + r.bots, 0),
  };
}

const duration = (ms: number): string => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

/** The same snapshot as an aligned table, because this is read by a person on
 * a terminal far more often than it is parsed. */
export function renderStatus(snapshot: StatusSnapshot): string {
  const lines: string[] = [];
  lines.push("MTG-Engine server");
  lines.push(
    `  uptime   ${duration(snapshot.uptimeSeconds * 1000).padEnd(10)}` +
      `pid ${String(snapshot.pid).padEnd(8)}node ${snapshot.node}`,
  );
  lines.push(`  memory   rss ${snapshot.rssMb} MB, heap ${snapshot.heapUsedMb} MB`);
  lines.push(
    `  rooms    ${snapshot.counts.total} live — ${snapshot.counts.waiting} waiting, ` +
      `${snapshot.counts.playing} playing, ${snapshot.counts.finished} finished` +
      `   (${snapshot.roomsCreated} created since start)`,
  );
  lines.push(`  seats    ${snapshot.humansOnline} human online, ${snapshot.bots} bot`);

  if (snapshot.rooms.length === 0) {
    lines.push("");
    lines.push("  no rooms");
    return `${lines.join("\n")}\n`;
  }

  lines.push("");
  lines.push(
    `  ${"ROOM".padEnd(7)}${"STAGE".padEnd(10)}${"SEATS".padEnd(26)}` +
      `${"TURN".padEnd(7)}${"STEP".padEnd(18)}IDLE`,
  );
  for (const room of snapshot.rooms) {
    const seats = room.seats
      .map((s) => {
        if (s.isBot) return "bot";
        if (!s.claimed) return "open";
        return `${s.displayName ?? s.player}${s.online ? "" : "*"}`;
      })
      .join(",");
    const turn = room.turn === null ? "—" : `T${room.turn}`;
    const step = room.winner !== null ? `won by ${room.winner}` : (room.step ?? "—");
    lines.push(
      `  ${room.id.padEnd(7)}${room.stage.padEnd(10)}${seats.slice(0, 25).padEnd(26)}` +
        `${turn.padEnd(7)}${step.padEnd(18)}${duration(room.idleMs)}`,
    );
  }
  lines.push("");
  lines.push("  a * after a name means that seat is claimed but currently disconnected");
  return `${lines.join("\n")}\n`;
}

/**
 * Start the operator endpoint. Always bound to loopback — see the note at the
 * top of this file for why that is load-bearing rather than cautious.
 *
 * - `GET /`        the table above, as text
 * - `GET /status`  the same
 * - `GET /status.json`  the snapshot, for scripting
 * - `GET /healthz` `ok`, for a monitor that only wants a 200
 */
export function startStatusServer(manager: RoomManager, port: number): Server {
  const server = createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    if (url === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok\n");
      return;
    }
    if (url === "/status.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(`${JSON.stringify(statusSnapshot(manager), null, 2)}\n`);
      return;
    }
    if (url === "/" || url === "/status") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(renderStatus(statusSnapshot(manager)));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found\n");
  });
  server.listen(port, "127.0.0.1");
  return server;
}
