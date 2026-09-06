/**
 * End-to-end proof that dispatch → broadcast round-trips over a real
 * WebSocket connection, not just through the in-process `Room` API.
 */

import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "./room-manager.js";
import { attachRoomServer } from "./ws-server.js";
import type { ServerMessage } from "./protocol.js";
import { ALICE, BOB, CAROL, DAVE } from "./decks.js";

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

function connect(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

describe("room server (end to end over WebSocket)", () => {
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
    const aliceState = await nextMessage(aliceWs);
    expect(aliceState.type).toBe("state");
    if (aliceState.type !== "state") throw new Error("unreachable");
    expect(aliceState.seat).toBe(ALICE);
    expect(aliceState.seats).toEqual([
      { player: ALICE, claimed: true, online: true, displayName: null },
      { player: BOB, claimed: false, online: false, displayName: null },
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
    // Real rooms turn on mulligans — both players keep their opening hand
    // before turn 1's priority even exists.
    expect(bobState.view.awaiting).toEqual({ kind: "mulligan", player: ALICE, count: 0 });

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
});
