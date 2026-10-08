/**
 * The room host (see `HostRole`): whoever created the room runs the table —
 * its size, its bots, when it starts, how fast bots play — and the role falls
 * back to a connected player while the host is away.
 */

import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "../room-manager.js";
import { attachRoomServer } from "../ws-server.js";
import type { ServerMessage } from "protocol";
import { ALICE, BOB } from "../decks.js";

/** Buffers every message from `ws`, so back-to-back server sends aren't lost. */
function messageQueue(ws: WebSocket): () => Promise<ServerMessage> {
  const buffer: ServerMessage[] = [];
  const waiters: ((m: ServerMessage) => void)[] = [];
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString()) as ServerMessage;
    const waiter = waiters.shift();
    if (waiter) waiter(msg);
    else buffer.push(msg);
  });
  return () =>
    new Promise((resolve) => {
      const buffered = buffer.shift();
      if (buffered) resolve(buffered);
      else waiters.push(resolve);
    });
}

/** Resolves with the next message of `type`, skipping any others. */
async function next<T extends ServerMessage["type"]>(
  queue: () => Promise<ServerMessage>,
  type: T,
): Promise<Extract<ServerMessage, { type: T }>> {
  for (;;) {
    const m = await queue();
    if (m.type === type) return m as Extract<ServerMessage, { type: T }>;
  }
}

describe("room host", () => {
  let wss: WebSocketServer;
  let port: number;
  let sockets: WebSocket[];

  beforeEach(async () => {
    wss = new WebSocketServer({ port: 0 });
    attachRoomServer(wss, new RoomManager());
    await new Promise<void>((resolve) => wss.once("listening", resolve));
    port = (wss.address() as AddressInfo).port;
    sockets = [];
  });

  afterEach(async () => {
    for (const ws of sockets) ws.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });

  async function client() {
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(`ws://127.0.0.1:${port}`);
      socket.once("open", () => resolve(socket));
      socket.once("error", reject);
    });
    sockets.push(ws);
    const queue = messageQueue(ws);
    const send = (m: object) => ws.send(JSON.stringify(m));
    return { ws, queue, send };
  }

  /** A room created by `host` with a host token, which `host` has joined. */
  async function hostedRoom() {
    const host = await client();
    host.send({ type: "create-room", hostToken: "secret" });
    const { roomId } = await next(host.queue, "room-created");
    host.send({ type: "join-room", roomId, hostToken: "secret" });
    const joined = await next(host.queue, "room-joined");
    return { host, roomId, joined };
  }

  it("makes the room's creator the host, before they've taken a seat", async () => {
    const { joined } = await hostedRoom();
    expect(joined.isHost).toBe(true);
    expect(joined.botSpeed).toBe("normal");
    expect(joined.settings).toEqual({ startingLife: 40, firstPlayer: "random", commanderLegalOnly: false, botDecks: "precon" });
    expect(joined.seats.some((s) => s.isHost)).toBe(false);
  });

  it("refuses host-only actions from anyone else", async () => {
    const { roomId } = await hostedRoom();
    const guest = await client();
    guest.send({ type: "join-room", roomId });
    expect((await next(guest.queue, "room-joined")).isHost).toBe(false);
    guest.send({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob", ready: true });
    await next(guest.queue, "room-joined");

    for (const message of [
      { type: "add-bot", roomId, seat: ALICE },
      { type: "add-seat", roomId },
      { type: "start-game", roomId },
      { type: "set-bot-speed", roomId, speed: "slow" },
      { type: "set-room-settings", roomId, settings: { startingLife: 20 } },
    ]) {
      guest.send(message);
      const reply = await next(guest.queue, "error");
      expect(reply.message).toMatch(/only the host/);
    }
  });

  it("lets the host run the table, and shows everyone the bot speed", async () => {
    const { host, roomId } = await hostedRoom();
    const guest = await client();
    guest.send({ type: "join-room", roomId });
    await next(guest.queue, "room-joined");
    guest.send({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob", ready: true });
    await next(guest.queue, "room-joined");

    host.send({ type: "set-bot-speed", roomId, speed: "slow" });
    const seen = await next(guest.queue, "room-joined");
    expect(seen.botSpeed).toBe("slow");
    expect(seen.isHost).toBe(false);

    host.send({ type: "add-seat", roomId });
    const resized = await next(guest.queue, "room-joined");
    expect(resized.seats).toHaveLength(3);
  });

  it("hands the role to a connected player while the host is away, and back when they return", async () => {
    const { host, roomId } = await hostedRoom();
    const guest = await client();
    guest.send({ type: "join-room", roomId });
    await next(guest.queue, "room-joined");
    guest.send({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob" });
    expect((await next(guest.queue, "room-joined")).isHost).toBe(false);

    host.ws.close();
    const standIn = await next(guest.queue, "room-joined");
    expect(standIn.isHost).toBe(true);
    expect(standIn.seats.find((s) => s.player === BOB)?.isHost).toBe(true);

    const back = await client();
    back.send({ type: "join-room", roomId, hostToken: "secret" });
    expect((await next(back.queue, "room-joined")).isHost).toBe(true);
    expect((await next(guest.queue, "room-joined")).isHost).toBe(false);
  });

  it("shows everyone the room settings, and refuses a bad one whole", async () => {
    const { host, roomId } = await hostedRoom();
    const guest = await client();
    guest.send({ type: "join-room", roomId });
    await next(guest.queue, "room-joined");
    guest.send({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob" });
    await next(guest.queue, "room-joined");

    host.send({ type: "set-room-settings", roomId, settings: { startingLife: 25, firstPlayer: BOB } });
    expect((await next(guest.queue, "room-joined")).settings).toEqual({ startingLife: 25, firstPlayer: BOB, commanderLegalOnly: false, botDecks: "precon" });

    for (const settings of [
      { startingLife: 0 },
      { startingLife: 1000 },
      { startingLife: 12.5 },
      { startingLife: "30" },
      { firstPlayer: "nobody" },
      { startingLife: 30, firstPlayer: "nobody" },
    ]) {
      host.send({ type: "set-room-settings", roomId, settings });
      expect((await next(host.queue, "error")).message).toMatch(/starting life|no such seat/);
    }
    host.send({ type: "set-room-settings", roomId, settings: {} });
    expect((await next(host.queue, "room-joined")).settings).toEqual({ startingLife: 25, firstPlayer: BOB, commanderLegalOnly: false, botDecks: "precon" });
  });

  it("goes back to the highroll when the seat picked to go first is removed", async () => {
    const { host, roomId } = await hostedRoom();
    host.send({ type: "add-seat", roomId });
    const three = await next(host.queue, "room-joined");
    const third = three.seats[2].player;
    host.send({ type: "set-room-settings", roomId, settings: { firstPlayer: third } });
    expect((await next(host.queue, "room-joined")).settings?.firstPlayer).toBe(third);
    host.send({ type: "remove-seat", roomId, seat: third });
    expect((await next(host.queue, "room-joined")).settings?.firstPlayer).toBe("random");
  });

  it("starts the game with the host's starting life and first player", async () => {
    const { host, roomId } = await hostedRoom();
    host.send({ type: "set-room-settings", roomId, settings: { startingLife: 30, firstPlayer: BOB } });
    await next(host.queue, "room-joined");
    host.send({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice", ready: true });
    await next(host.queue, "room-joined");
    host.send({ type: "add-bot", roomId, seat: BOB });
    await next(host.queue, "room-joined");
    host.send({ type: "start-game", roomId });

    const state = await next(host.queue, "state");
    expect(state.view.startingPlayer).toBe(BOB);
    expect(state.firstPlayerChosen).toBe(true);
    expect(state.view.players[ALICE].life).toBe(30);
    expect(state.view.players[BOB].life).toBe(30);
  });

  it("carries the host and bot speed into the started game", async () => {
    const { host, roomId } = await hostedRoom();
    host.send({ type: "set-bot-speed", roomId, speed: "fast" });
    await next(host.queue, "room-joined");
    host.send({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice", ready: true });
    await next(host.queue, "room-joined");
    host.send({ type: "add-bot", roomId, seat: BOB });
    await next(host.queue, "room-joined");
    host.send({ type: "start-game", roomId });

    const state = await next(host.queue, "state");
    expect(state.isHost).toBe(true);
    expect(state.botSpeed).toBe("fast");
    expect(state.firstPlayerChosen).toBeUndefined();

    // Still adjustable mid-game.
    host.send({ type: "set-bot-speed", roomId, speed: "slow" });
    for (;;) {
      const s = await next(host.queue, "state");
      if (s.botSpeed === "slow") break;
    }
  });
});
