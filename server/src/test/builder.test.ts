/**
 * The scenario builder (`builder.ts`): a board built from a scenario triggers
 * nothing, lies as the scenario says, and plays from where it stands; a game
 * comes back as a scenario; and a builder room keeps its developer seated,
 * and its frames numbered upward, across every rebuild.
 */

import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { asPlayerId } from "engine";
import type { ObjectId } from "engine";
import type { ScenarioCard, ScenarioSpec, ServerMessage } from "protocol";
import { buildScenario, defaultScenario, snapshotScenario, validateScenario } from "../builder.js";
import { RoomManager } from "../room-manager.js";
import { attachRoomServer } from "../ws-server.js";

const ALICE = asPlayerId("alice");
const BOB = asPlayerId("bob");

const card = (key: string, name: string, extra: Partial<ScenarioCard> = {}): ScenarioCard => ({
  key,
  name,
  owner: ALICE,
  zone: "battlefield",
  ...extra,
});

const spec = (cards: ScenarioCard[], extra: Partial<ScenarioSpec> = {}): ScenarioSpec => ({
  ...defaultScenario(),
  cards,
  ...extra,
});

const idOf = (objects: Record<ObjectId, string>, key: string): ObjectId => {
  const id = Object.entries(objects).find(([, k]) => k === key)?.[0];
  if (id === undefined) throw new Error(`no object for ${key}`);
  return id as ObjectId;
};

describe("buildScenario", () => {
  it("places every card where the scenario says, on the step it says, triggering nothing", () => {
    const { game, objects } = buildScenario(
      spec(
        [
          card("warden", "Soul Warden"),
          card("bears", "Grizzly Bears", { tapped: true }),
          card("wurm", "Craw Wurm", { sick: true, counters: { "+1/+1": 2 } }),
          card("aura", "Pacifism", { attachedTo: "wurm" }),
          card("soldier", "Soldier Token", { owner: BOB }),
          card("bolt", "Lightning Bolt", { zone: "hand" }),
          card("top", "Hill Giant", { zone: "library" }),
          card("second", "Craw Wurm", { zone: "library" }),
          card("dead", "Blood Artist", { owner: BOB, zone: "graveyard" }),
          card("gone", "Lotus Cobra", { zone: "exile" }),
          card("cmdr", "Chandra, Acolyte of Flame", { owner: BOB, commander: true }),
        ],
        { active: BOB, step: "begin-combat" },
      ),
    );
    const s = game.state;
    expect(s.turnOrder[s.turn.activePlayerIndex]).toBe(BOB);
    expect(s.turn.step).toBe("begin-combat");
    expect(s.priority.holder).toBe(BOB);
    // Soul Warden saw four creatures enter, and gained nothing.
    expect(s.players[ALICE].life).toBe(40);
    expect(s.pendingTriggers).toEqual([]);
    expect(s.zones.shared.stack).toEqual([]);

    expect(s.objects[idOf(objects, "bears")].tapped).toBe(true);
    expect(s.objects[idOf(objects, "warden")].summoningSick).toBe(false);
    const wurm = s.objects[idOf(objects, "wurm")];
    expect(wurm.summoningSick).toBe(true);
    expect(wurm.counters["+1/+1"]).toBe(2);
    expect(s.objects[idOf(objects, "aura")].attachedTo).toBe(wurm.id);
    const soldier = s.objects[idOf(objects, "soldier")];
    expect(soldier.isToken).toBe(true);
    expect(soldier.controller).toBe(BOB);
    // A hand is only what the scenario puts in it; a library is listed top first.
    expect(s.zones.perPlayer[ALICE].hand).toEqual([idOf(objects, "bolt")]);
    expect(s.zones.perPlayer[BOB].hand).toEqual([]);
    expect(s.zones.perPlayer[ALICE].library.slice(0, 2)).toEqual([idOf(objects, "top"), idOf(objects, "second")]);
    expect(s.zones.perPlayer[BOB].graveyard).toEqual([idOf(objects, "dead")]);
    expect(s.zones.shared.exile).toEqual([idOf(objects, "gone")]);
    const chandra = s.objects[idOf(objects, "cmdr")];
    expect(chandra.isCommander).toBe(true);
    expect(chandra.zone).toBe("battlefield");
    expect(chandra.counters.loyalty).toBe(4);
  });

  it("sets life and poison, and a commander left in the command zone stays there", () => {
    const { game, objects } = buildScenario(
      spec([card("cmdr", "Chandra, Acolyte of Flame", { zone: "command", commander: true })], {
        seats: [
          { player: ALICE, life: 7, poison: 3, bot: false },
          { player: BOB, life: 40, bot: true },
        ],
      }),
    );
    expect(game.state.players[ALICE].life).toBe(7);
    expect(game.state.players[ALICE].counters.poison).toBe(3);
    expect(game.state.zones.shared.command).toContain(idOf(objects, "cmdr"));
  });

  it("refuses a board it can't build", () => {
    expect(() => validateScenario(spec([card("x", "Not A Real Card")]))).toThrow(/no card named/);
    expect(() => validateScenario(spec([card("t", "Soldier Token", { zone: "hand" })]))).toThrow(/token/);
    expect(() => validateScenario(spec([card("a", "Hill Giant"), card("a", "Hill Giant")]))).toThrow(/unique/);
    expect(() => validateScenario(spec([card("p", "Pacifism", { attachedTo: "nobody" })]))).toThrow(/attached/);
    expect(() => validateScenario(spec([card("h", "Hill Giant", { zone: "command" })]))).toThrow(/command zone/);
    expect(() => validateScenario(spec([], { step: "declare-attackers" as never }))).toThrow(/step/);
  });

  it("comes back from a game as the same scenario, give or take keys", () => {
    const original = spec([
      card("bears", "Grizzly Bears", { tapped: true, counters: { "+1/+1": 1 } }),
      card("aura", "Pacifism", { attachedTo: "bears" }),
      card("bolt", "Lightning Bolt", { zone: "hand" }),
      card("top", "Hill Giant", { zone: "library" }),
      card("dead", "Blood Artist", { owner: BOB, zone: "graveyard" }),
    ]);
    const { game } = buildScenario(original);
    const back = snapshotScenario(game, original);
    const shape = (s: ScenarioSpec) =>
      s.cards.map(({ key: _key, attachedTo, ...rest }) => ({ ...rest, attached: attachedTo !== undefined }));
    expect(shape(back)).toEqual(shape(original));
    expect(back.libraryFill).toBe(original.libraryFill);
    expect(back.active).toBe(original.active);
    expect(back.step).toBe(original.step);
    // And it builds again.
    expect(() => buildScenario(back)).not.toThrow();
  });
});

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

describe("a scenario builder room", () => {
  let wss: WebSocketServer;
  let port: number;
  let sockets: WebSocket[];

  const open = async (builder: boolean) => {
    wss = new WebSocketServer({ port: 0 });
    attachRoomServer(wss, new RoomManager(), { builder });
    await new Promise<void>((resolve) => wss.once("listening", resolve));
    port = (wss.address() as AddressInfo).port;
  };

  beforeEach(() => {
    sockets = [];
  });

  afterEach(async () => {
    for (const ws of sockets) ws.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });

  const connect = async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise((resolve, reject) => {
      ws.once("open", resolve);
      ws.once("error", reject);
    });
    sockets.push(ws);
    return { ws, next: messageQueue(ws), send: (m: object) => ws.send(JSON.stringify(m)) };
  };

  /** The next `state` push, skipping anything else. */
  const nextState = async (next: () => Promise<ServerMessage>) => {
    for (;;) {
      const m = await next();
      if (m.type === "error") throw new Error(m.message);
      if (m.type === "state") return m;
    }
  };

  it("isn't there on a server started without --builder", async () => {
    await open(false);
    const { next, send } = await connect();
    send({ type: "builder-create", hostToken: "h" });
    const m = await next();
    expect(m.type === "error" && m.message).toMatch(/--builder/);
  });

  it("builds frozen, keeps its developer seated and frames numbered upward, then plays", async () => {
    await open(true);
    const { next, send } = await connect();
    send({ type: "builder-create", hostToken: "h" });
    const created = await next();
    if (created.type !== "room-created") throw new Error(`got ${created.type}`);
    const roomId = created.roomId;
    send({ type: "join-room", roomId, hostToken: "h" });
    expect((await next()).type).toBe("room-joined");
    send({ type: "claim-seat", roomId, seat: ALICE, clientToken: "t" });
    const first = await nextState(next);
    expect(first.builder?.mode).toBe("build");
    expect(first.actions).toEqual([]);

    const board = spec([card("bears", "Grizzly Bears"), card("bolt", "Lightning Bolt", { zone: "hand" }), card("land", "Mountain")], {
      seats: [
        { player: ALICE, life: 40, bot: false },
        { player: BOB, life: 40, bot: true },
      ],
    });
    send({ type: "builder-update", roomId, spec: board });
    const built = await nextState(next);
    expect(built.seat).toBe(ALICE);
    expect(built.seq).toBeGreaterThan(first.seq);
    expect(built.actions).toEqual([]);
    expect(Object.values(built.builder?.objects ?? {}).sort()).toEqual(["bears", "bolt", "land"]);
    const bears = Object.keys(built.builder!.objects).find((id) => built.builder!.objects[id] === "bears")!;
    expect(built.view.objects[bears]?.cardName).toBe("Grizzly Bears");

    // Frozen: nothing can be done on the board being built.
    send({ type: "dispatch", roomId, action: { type: "pass-priority", player: ALICE } });
    const refused = await next();
    expect(refused.type === "error" && refused.message).toMatch(/being built/);

    send({ type: "builder-start", roomId });
    const playing = await nextState(next);
    expect(playing.builder?.mode).toBe("play");
    expect(playing.seq).toBeGreaterThan(built.seq);
    expect(playing.seats.find((s) => s.player === BOB)?.isBot).toBe(true);
    expect(playing.actions.some((a) => a.kind === "cast-spell")).toBe(true);

    // Back to building from where play stands.
    send({ type: "builder-snapshot", roomId });
    let again = await nextState(next);
    while (again.builder?.mode !== "build") again = await nextState(next);
    expect(again.builder?.mode).toBe("build");
    expect(again.builder?.spec.cards.map((c) => c.name).sort()).toEqual(["Grizzly Bears", "Lightning Bolt", "Mountain"]);
  });

  it("only lets its host change the board", async () => {
    await open(true);
    const host = await connect();
    host.send({ type: "builder-create", hostToken: "h" });
    const created = await host.next();
    if (created.type !== "room-created") throw new Error(`got ${created.type}`);
    host.send({ type: "join-room", roomId: created.roomId, hostToken: "h" });
    await host.next();
    host.send({ type: "claim-seat", roomId: created.roomId, seat: ALICE, clientToken: "t" });
    await nextState(host.next);
    const other = await connect();
    other.send({ type: "join-room", roomId: created.roomId });
    await other.next();
    other.send({ type: "builder-update", roomId: created.roomId, spec: defaultScenario() });
    const m = await other.next();
    expect(m.type === "error" && m.message).toMatch(/only the host/);
  });
});
