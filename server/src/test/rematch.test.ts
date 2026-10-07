/**
 * A rematch, end to end over the transport: a room played to game over, then
 * a new game dealt into it under the same code (`RoomManager.rematch`, the
 * `rematch` message) — the same seats, players and decks, a fresh shuffle,
 * every human carried across, the host alone allowed to ask, and only once
 * the game is over.
 */

import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import type { GameState, PlayerId } from "engine";
import type { ClientMessage, ServerMessage, WireDeck } from "protocol";
import { RoomManager } from "../room-manager.js";
import { Room } from "../room.js";
import { attachRoomServer } from "../ws-server.js";
import { ALICE, BOB, CAROL, SEATS } from "../decks.js";

type StateMessage = Extract<ServerMessage, { type: "state" }>;

/** One socket's messages, buffered, with a way to wait for the next one that
 * matches. */
interface Client {
  readonly ws: WebSocket;
  send(message: ClientMessage): void;
  next(match: (m: ServerMessage) => boolean): Promise<ServerMessage>;
  /** Everything received but not yet waited for. */
  drain(): ServerMessage[];
}

function client(ws: WebSocket): Client {
  let buffer: ServerMessage[] = [];
  const waiters: { match: (m: ServerMessage) => boolean; resolve: (m: ServerMessage) => void }[] = [];
  ws.on("message", (raw) => {
    const message = JSON.parse(raw.toString()) as ServerMessage;
    const i = waiters.findIndex((w) => w.match(message));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(message);
    else buffer.push(message);
  });
  return {
    ws,
    send: (message) => ws.send(JSON.stringify(message)),
    next: (match) =>
      new Promise((resolve) => {
        const i = buffer.findIndex(match);
        if (i >= 0) resolve(buffer.splice(i, 1)[0]);
        else waiters.push({ match, resolve });
      }),
    drain: () => {
      const out = buffer;
      buffer = [];
      return out;
    },
  };
}

const isState = (m: ServerMessage): m is StateMessage => m.type === "state";
const isError = (m: ServerMessage): boolean => m.type === "error";

/** Each player's cards, sorted: the deck as dealt, wherever its cards are. */
function decksOf(state: GameState): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const o of Object.values(state.objects)) {
    if (o.kind !== "card" || o.isToken) continue;
    (out[o.owner] ??= []).push(o.cardName);
  }
  for (const names of Object.values(out)) names.sort();
  return out;
}

function libraryOrder(state: GameState, player: PlayerId): string[] {
  return state.zones.perPlayer[player].library.map((id) => state.objects[id].cardName);
}

describe("rematch", () => {
  let wss: WebSocketServer;
  let manager: RoomManager;
  let port: number;
  let sockets: WebSocket[];

  beforeEach(async () => {
    wss = new WebSocketServer({ port: 0 });
    // Bots answer inside each settle, so the whole game runs on messages.
    manager = new RoomManager({ pacing: "immediate" });
    attachRoomServer(wss, manager);
    await new Promise<void>((resolve) => wss.once("listening", resolve));
    port = (wss.address() as AddressInfo).port;
    sockets = [];
  });

  afterEach(async () => {
    for (const ws of sockets) ws.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });

  async function connect(): Promise<Client> {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });
    sockets.push(ws);
    return client(ws);
  }

  /** A three-seat room started from its waiting room: Alice hosting, Bob,
   * and a bot in Carol's seat playing the fourth seat's starter deck (not
   * its own seat's, so a fallback deck can't pass for the one chosen). */
  async function startRoom(): Promise<{ alice: Client; bob: Client; roomId: string; room: Room }> {
    const alice = await connect();
    const bob = await connect();
    alice.send({ type: "create-room", players: 3, hostToken: "host-secret" });
    const created = await alice.next((m) => m.type === "room-created");
    if (created.type !== "room-created") throw new Error("unreachable");
    const roomId = created.roomId;
    alice.send({ type: "join-room", roomId, hostToken: "host-secret" });
    alice.send({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice-token", displayName: "Ann", ready: true });
    bob.send({ type: "join-room", roomId });
    await bob.next((m) => m.type === "room-joined");
    bob.send({ type: "claim-seat", roomId, seat: BOB, clientToken: "bob-token", displayName: "Ben", ready: true });
    await bob.next((m) => m.type === "room-joined" && m.seats.some((s) => s.player === BOB && s.claimed));
    const deck: WireDeck = { cards: SEATS[3].cards, commanders: SEATS[3].commanders, name: SEATS[3].name };
    alice.send({ type: "add-bot", roomId, seat: CAROL, deck });
    alice.send({ type: "start-game", roomId });
    await alice.next(isState);
    await bob.next(isState);
    const room = manager.get(roomId);
    if (!(room instanceof Room)) throw new Error("the room didn't start");
    return { alice, bob, roomId, room };
  }

  /** Both humans keep their opening hands; the bot has kept its own. */
  async function keepHands(alice: Client, bob: Client, roomId: string): Promise<void> {
    alice.send({ type: "dispatch", roomId, action: { type: "mulligan", player: ALICE, keep: true } });
    await alice.next(isState);
    bob.send({ type: "dispatch", roomId, action: { type: "mulligan", player: BOB, keep: true } });
    await bob.next((m) => isState(m) && m.view.turn.number > 0);
  }

  it("deals a new game into the same room: same seats, players and decks, a fresh shuffle", async () => {
    const { alice, bob, roomId, room: first } = await startRoom();
    const firstDecks = decksOf(first.game.state);
    const firstLibraries = [ALICE, BOB, CAROL].map((p) => libraryOrder(first.game.state, p));
    const botName = first.seatStatuses().find((s) => s.player === CAROL)?.displayName;
    expect(botName).toBeTruthy();
    await keepHands(alice, bob, roomId);

    // Not before the game is over.
    alice.drain();
    alice.send({ type: "rematch", roomId });
    expect(await alice.next(isError)).toEqual({ type: "error", message: "the game isn't over yet" });

    // Both humans concede: the bot wins.
    bob.send({ type: "concede", roomId });
    alice.send({ type: "concede", roomId });
    const over = await alice.next((m) => isState(m) && m.view.result.over);
    if (!isState(over)) throw new Error("unreachable");
    expect(over.view.result.winner).toBe(CAROL);
    expect(over.game).toBe(1);
    expect(over.canRematch).toBe(true);
    await bob.next((m) => isState(m) && m.view.result.over);

    // Bob isn't the host.
    bob.drain();
    bob.send({ type: "rematch", roomId });
    expect(await bob.next(isError)).toEqual({ type: "error", message: "only the host can start a rematch" });
    expect(manager.get(roomId)).toBe(first);

    alice.drain();
    bob.drain();
    alice.send({ type: "rematch", roomId });
    const [aliceFrame, bobFrame] = await Promise.all([alice.next(isState), bob.next(isState)]);
    if (!isState(aliceFrame) || !isState(bobFrame)) throw new Error("unreachable");

    // A new game under the same code, its frames counting on from the old.
    const second = manager.get(roomId);
    if (!(second instanceof Room)) throw new Error("the room is gone");
    expect(second).not.toBe(first);
    expect(second.gameNumber).toBe(2);
    expect(aliceFrame.roomId).toBe(roomId);
    expect(aliceFrame.game).toBe(2);
    expect(bobFrame.game).toBe(2);
    expect(aliceFrame.seq).toBeGreaterThan(over.seq);
    expect(aliceFrame.view.result.over).toBe(false);

    // Everyone in the same seat, with no seat board in between: both humans
    // are dealt a new opening hand to keep or mulligan, the bot already has.
    expect(aliceFrame.seat).toBe(ALICE);
    expect(bobFrame.seat).toBe(BOB);
    expect(aliceFrame.view.turn.number).toBe(0);
    const awaiting = aliceFrame.view.awaiting;
    expect(awaiting?.kind).toBe("mulligan");
    if (awaiting?.kind === "mulligan") expect(Object.keys(awaiting.hands).sort()).toEqual([ALICE, BOB]);
    expect(aliceFrame.isHost).toBe(true);
    expect(bobFrame.isHost).toBe(false);
    expect(
      second.seatStatuses().map((s) => ({ player: s.player, name: s.displayName, bot: s.isBot, online: s.online })),
    ).toEqual([
      { player: ALICE, name: "Ann", bot: false, online: true },
      { player: BOB, name: "Ben", bot: false, online: true },
      { player: CAROL, name: botName, bot: true, online: false },
    ]);

    // The same decks, the bot's chosen one included, shuffled afresh.
    expect(decksOf(second.game.state)).toEqual(firstDecks);
    expect(second.game.state.seed).not.toBe(first.game.state.seed);
    expect([ALICE, BOB, CAROL].map((p) => libraryOrder(second.game.state, p))).not.toEqual(firstLibraries);
    // The same settings: Commander's 40 life, as the waiting room left it.
    expect([ALICE, BOB, CAROL].map((p) => second.game.state.players[p].life)).toEqual([40, 40, 40]);

    // The new game plays: a keep goes through to it, not the old one.
    await keepHands(alice, bob, roomId);
    expect(second.game.state.turn.number).toBeGreaterThan(0);

    // And once it's over too, the room deals a third.
    bob.send({ type: "concede", roomId });
    alice.send({ type: "concede", roomId });
    await alice.next((m) => isState(m) && m.view.result.over);
    alice.send({ type: "rematch", roomId });
    const third = await alice.next((m) => isState(m) && m.game === 3);
    expect(isState(third) && third.view.result.over).toBe(false);
  });

  it("keeps a dropped player's seat for them to reclaim, and hands the rematch to whoever is left", async () => {
    const { alice, bob, roomId, room: first } = await startRoom();
    await keepHands(alice, bob, roomId);
    bob.send({ type: "concede", roomId });
    alice.send({ type: "concede", roomId });
    await bob.next((m) => isState(m) && m.view.result.over);

    // The host leaves after the game: Bob is told he holds the role now.
    bob.drain();
    alice.ws.close();
    const handed = await bob.next(isState);
    expect(isState(handed) && handed.isHost).toBe(true);

    bob.send({ type: "rematch", roomId });
    const frame = await bob.next((m) => isState(m) && m.game === 2);
    expect(isState(frame) && frame.seat).toBe(BOB);
    const second = manager.get(roomId);
    if (!(second instanceof Room)) throw new Error("the room is gone");
    expect(second).not.toBe(first);
    // Alice's seat is still hers, offline, and the bot hasn't taken it.
    const aliceSeat = second.seatStatuses().find((s) => s.player === ALICE);
    expect(aliceSeat).toMatchObject({ claimed: true, online: false, isBot: false, displayName: "Ann" });

    // She comes back with her stored token and the host token, and is in the
    // new game, the host again.
    const back = await connect();
    back.send({ type: "join-room", roomId, hostToken: "host-secret" });
    const joined = await back.next((m) => m.type === "room-joined");
    expect(joined.type === "room-joined" && joined.pending).toBe(false);
    back.send({ type: "claim-seat", roomId, seat: ALICE, clientToken: "alice-token" });
    const resumed = await back.next(isState);
    if (!isState(resumed)) throw new Error("unreachable");
    expect(resumed.game).toBe(2);
    expect(resumed.seat).toBe(ALICE);
    expect(resumed.isHost).toBe(true);
    expect(resumed.view.awaiting?.kind).toBe("mulligan");
  });

  it("refuses a room that can't be rematched", async () => {
    const pending = manager.createPending(2, { seed: 1 });
    expect(() => manager.rematch(pending.id)).toThrow(/hasn't started/);
    expect(() => manager.rematch("NOPE1")).toThrow(/hasn't started/);
  });
});
