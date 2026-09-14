/**
 * End-to-end proof that dispatch → broadcast round-trips over a real
 * WebSocket connection, not just through the in-process `Room` API.
 */

import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "../room-manager.js";
import { Room } from "../room.js";
import { attachRoomServer } from "../ws-server.js";
import type { ServerMessage } from "../protocol.js";
import { ALICE, BOB, CAROL, DAVE } from "../decks.js";

function nextMessage(ws: WebSocket): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    ws.once("message", (raw) => {
      try {
        resolve(JSON.parse(raw.toString()) as ServerMessage);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/** Buffers every message from `ws`, so back-to-back server sends aren't lost
 * between `nextMessage` calls. */
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

function connect(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

describe("room server (end to end over WebSocket)", () => {
  let wss: WebSocketServer;
  let manager: RoomManager;
  let port: number;
  let sockets: WebSocket[];

  beforeEach(async () => {
    wss = new WebSocketServer({ port: 0 });
    manager = new RoomManager();
    attachRoomServer(wss, manager);
    await new Promise<void>((resolve) => wss.once("listening", resolve));
    port = (wss.address() as AddressInfo).port;
    sockets = [];
  });

  afterEach(async () => {
    for (const ws of sockets) ws.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });

  async function openSocket(): Promise<WebSocket> {
    const ws = await connect(port);
    sockets.push(ws);
    return ws;
  }

  it("lets two devices create a room, claim both seats, and see each other's moves", async () => {
    const aliceWs = await openSocket();
    const bobWs = await openSocket();

    aliceWs.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(aliceWs);
    expect(created.type).toBe("room-created");
    if (created.type !== "room-created") throw new Error("unreachable");
    const roomId = created.roomId;

    aliceWs.send(
      JSON.stringify({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice-token" }),
    );
    // The room isn't ready to start yet — Bob hasn't claimed a seat, so
    // there's no Game yet, just a refreshed seat list (no `state`).
    const aliceJoined = await nextMessage(aliceWs);
    expect(aliceJoined.type).toBe("room-joined");
    if (aliceJoined.type !== "room-joined") throw new Error("unreachable");
    expect(aliceJoined.seats).toEqual([
      { player: ALICE, claimed: true, online: true, displayName: null, isBot: false },
      { player: BOB, claimed: false, online: false, displayName: null, isBot: false },
    ]);

    bobWs.send(JSON.stringify({ type: "join-room", roomId }));
    const joined = await nextMessage(bobWs);
    expect(joined.type).toBe("room-joined");

    bobWs.send(
      JSON.stringify({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob-token" }),
    );
    // Both sockets get pushed a fresh state once the second seat is claimed.
    const aliceRebroadcast = await nextMessage(aliceWs);
    const bobState = await nextMessage(bobWs);
    if (aliceRebroadcast.type !== "state" || bobState.type !== "state") {
      throw new Error("unreachable");
    }
    expect(aliceRebroadcast.seats.every((s) => s.claimed)).toBe(true);
    expect(bobState.seat).toBe(BOB);
    // Real rooms turn on mulligans — both players are asked at once (parallel,
    // not turn order) and keep their opening hand before turn 1's priority
    // even exists.
    expect(bobState.view.awaiting).toEqual({
      kind: "mulligan",
      player: ALICE,
      hands: {
        [ALICE]: { taken: 0, step: "decide" },
        [BOB]: { taken: 0, step: "decide" },
      },
    });

    aliceWs.send(
      JSON.stringify({
        type: "dispatch",
        roomId,
        action: { type: "mulligan", player: ALICE, keep: true },
      }),
    );
    await Promise.all([nextMessage(aliceWs), nextMessage(bobWs)]);

    bobWs.send(
      JSON.stringify({
        type: "dispatch",
        roomId,
        action: { type: "mulligan", player: BOB, keep: true },
      }),
    );
    const [, bobAfterKeep] = await Promise.all([nextMessage(aliceWs), nextMessage(bobWs)]);
    if (bobAfterKeep.type !== "state") throw new Error("unreachable");

    const holder = bobAfterKeep.view.priority.holder;
    expect(holder).not.toBeNull();
    const holderWs = holder === ALICE ? aliceWs : bobWs;
    const otherWs = holder === ALICE ? bobWs : aliceWs;

    holderWs.send(
      JSON.stringify({ type: "dispatch", roomId, action: { type: "pass-priority", player: holder } }),
    );

    const [holderUpdate, otherUpdate] = await Promise.all([
      nextMessage(holderWs),
      nextMessage(otherWs),
    ]);
    expect(holderUpdate.type).toBe("state");
    expect(otherUpdate.type).toBe("state");
  });

  it("creating a room without a seed picks a fresh random one each time, not a fixed default", async () => {
    const aliceWs = await openSocket();

    async function createAndStartRoom(): Promise<string> {
      aliceWs.send(JSON.stringify({ type: "create-room" }));
      const created = await nextMessage(aliceWs);
      if (created.type !== "room-created") throw new Error("unreachable");
      aliceWs.send(
        JSON.stringify({
          type: "claim-seat",
          roomId: created.roomId,
          seat: ALICE,
          clientToken: "alice-token",
        }),
      );
      await nextMessage(aliceWs); // room-joined — Bob hasn't claimed yet
      aliceWs.send(JSON.stringify({ type: "add-bot", roomId: created.roomId, seat: BOB }));
      await nextMessage(aliceWs); // state — both seats filled, room started
      return created.roomId;
    }

    const firstRoomId = await createAndStartRoom();
    const secondRoomId = await createAndStartRoom();

    const firstRoom = manager.get(firstRoomId);
    const secondRoom = manager.get(secondRoomId);
    if (!(firstRoom instanceof Room) || !(secondRoom instanceof Room)) {
      throw new Error("expected both rooms to have started");
    }
    expect(firstRoom.game.state.seed).not.toBe(secondRoom.game.state.seed);
  });

  it("rejects a dispatch for a seat the connection hasn't claimed", async () => {
    const aliceWs = await openSocket();
    aliceWs.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(aliceWs);
    if (created.type !== "room-created") throw new Error("unreachable");

    aliceWs.send(
      JSON.stringify({
        type: "dispatch",
        roomId: created.roomId,
        action: { type: "pass-priority", player: BOB },
      }),
    );
    const reply = await nextMessage(aliceWs);
    expect(reply.type).toBe("error");
  });

  it("a rejected seat claim sends an error and a fresh seat list", async () => {
    const aliceWs = await openSocket();
    aliceWs.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(aliceWs);
    if (created.type !== "room-created") throw new Error("unreachable");
    aliceWs.send(
      JSON.stringify({
        type: "claim-seat",
        roomId: created.roomId,
        seat: ALICE,
        clientToken: "alice-token",
      }),
    );
    await nextMessage(aliceWs); // room-joined — Alice is in, room not started yet

    // Bob's device tries to grab Alice's seat with a different token.
    const bobWs = await openSocket();
    const bobMsg = messageQueue(bobWs);
    bobWs.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    await bobMsg(); // room-joined
    bobWs.send(
      JSON.stringify({
        type: "claim-seat",
        roomId: created.roomId,
        seat: ALICE,
        clientToken: "bob-token",
      }),
    );
    const err = await bobMsg();
    expect(err.type).toBe("error");
    const refreshed = await bobMsg();
    if (refreshed.type !== "room-joined") throw new Error("expected room-joined");
    const alice = refreshed.seats.find((s) => s.player === ALICE);
    expect(alice?.claimed).toBe(true);
    expect(refreshed.seats.find((s) => s.player === BOB)?.claimed).toBe(false);
  });

  it("reports an error for an unknown room id", async () => {
    const ws = await openSocket();
    ws.send(JSON.stringify({ type: "join-room", roomId: "NOPE1" }));
    const reply = await nextMessage(ws);
    expect(reply).toEqual({ type: "error", message: "no such room: NOPE1" });
  });

  it("omitting players still creates a 2-seat room", async () => {
    const ws = await openSocket();
    ws.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(ws);
    if (created.type !== "room-created") throw new Error("unreachable");

    ws.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    const joined = await nextMessage(ws);
    if (joined.type !== "room-joined") throw new Error("unreachable");
    expect(joined.seats.map((s) => s.player)).toEqual([ALICE, BOB]);
  });

  it("players: 3 creates a room with a third seat", async () => {
    const ws = await openSocket();
    ws.send(JSON.stringify({ type: "create-room", players: 3 }));
    const created = await nextMessage(ws);
    if (created.type !== "room-created") throw new Error("unreachable");

    ws.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    const joined = await nextMessage(ws);
    if (joined.type !== "room-joined") throw new Error("unreachable");
    expect(joined.seats).toHaveLength(3);
    expect(joined.seats.map((s) => s.player)).toEqual([ALICE, BOB, CAROL]);
  });

  it("players: 4 creates a room with all four seats", async () => {
    const ws = await openSocket();
    ws.send(JSON.stringify({ type: "create-room", players: 4 }));
    const created = await nextMessage(ws);
    if (created.type !== "room-created") throw new Error("unreachable");

    ws.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    const joined = await nextMessage(ws);
    if (joined.type !== "room-joined") throw new Error("unreachable");
    expect(joined.seats.map((s) => s.player)).toEqual([ALICE, BOB, CAROL, DAVE]);
  });

  it("clamps an out-of-range players count into 2-4", async () => {
    const ws = await openSocket();
    ws.send(JSON.stringify({ type: "create-room", players: 99 }));
    const created = await nextMessage(ws);
    if (created.type !== "room-created") throw new Error("unreachable");

    ws.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    const joined = await nextMessage(ws);
    if (joined.type !== "room-joined") throw new Error("unreachable");
    expect(joined.seats).toHaveLength(4);
  });

  it("rate-limits a connection that sends a flood of messages", async () => {
    const ws = await openSocket();
    const nextMsg = messageQueue(ws);
    // Comfortably past RATE_LIMIT_MAX_MESSAGES within the same window.
    for (let i = 0; i < 60; i += 1) {
      ws.send(JSON.stringify({ type: "join-room", roomId: "NOPE1" }));
    }
    const replies = await Promise.all(Array.from({ length: 60 }, () => nextMsg()));
    expect(replies.some((r) => r.type === "error" && r.message === "too many requests, slow down"))
      .toBe(true);
    // Everything up to the limit still went through as normal "no such room" errors.
    expect(replies.some((r) => r.type === "error" && r.message === "no such room: NOPE1")).toBe(
      true,
    );
  });

  it("doesn't rate-limit ordinary play", async () => {
    const ws = await openSocket();
    const nextMsg = messageQueue(ws);
    // Fewer messages than the limit, spread across normal room setup —
    // should never see a rate-limit error.
    ws.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMsg();
    if (created.type !== "room-created") throw new Error("unreachable");
    for (let i = 0; i < 10; i += 1) {
      ws.send(JSON.stringify({ type: "join-room", roomId: created.roomId }));
    }
    const replies = await Promise.all(Array.from({ length: 10 }, () => nextMsg()));
    expect(replies.every((r) => r.type === "room-joined")).toBe(true);
  });

  it("fills an open seat with a bot and refreshes an unclaimed watcher's seat list", async () => {
    const aliceWs = await openSocket();
    aliceWs.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(aliceWs);
    if (created.type !== "room-created") throw new Error("unreachable");
    const roomId = created.roomId;

    // Alice hasn't claimed a seat yet — she's still on the seat picker,
    // deciding whether to fill Bob's seat with a bot before claiming her own.
    const aliceMsg = messageQueue(aliceWs);
    aliceWs.send(JSON.stringify({ type: "join-room", roomId }));
    await aliceMsg(); // room-joined

    aliceWs.send(JSON.stringify({ type: "add-bot", roomId, seat: BOB }));
    const refreshed = await aliceMsg();
    if (refreshed.type !== "room-joined") throw new Error("expected room-joined");
    expect(refreshed.seats).toContainEqual({
      player: BOB,
      claimed: false,
      online: false,
      displayName: null,
      isBot: true,
    });
  });

  it("rejects adding a bot to a seat someone already claimed", async () => {
    const aliceWs = await openSocket();
    aliceWs.send(JSON.stringify({ type: "create-room" }));
    const created = await nextMessage(aliceWs);
    if (created.type !== "room-created") throw new Error("unreachable");
    const roomId = created.roomId;

    aliceWs.send(
      JSON.stringify({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice-token" }),
    );
    await nextMessage(aliceWs); // room-joined

    aliceWs.send(JSON.stringify({ type: "add-bot", roomId, seat: ALICE }));
    const reply = await nextMessage(aliceWs);
    expect(reply.type).toBe("error");
  });
});
