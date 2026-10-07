/** Creates rooms with unique short codes and looks them up by code. */

import { Game } from "engine";
import { PendingRoom } from "./pending-room.js";
import type { PendingGameConfig } from "./pending-room.js";
import { Room } from "./room.js";
import type { GameRecipe, RoomOptions } from "./room.js";
import type { CaptureConfig } from "./capture.js";
import { BuilderSession } from "./builder.js";
import { HostRole } from "./host.js";

// No 0/O/1/I — avoids characters easily confused when a code is read aloud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

function randomRoomId(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export class RoomManager {
  private readonly rooms = new Map<string, Room | PendingRoom>();
  /** Scenario builder rooms (`builder.ts`), by code — each also in `rooms`,
   * under whichever `Room` it's serving right now. */
  private readonly builders = new Map<string, BuilderSession>();
  private created = 0;
  /** Handed to every room this manager promotes — see `RoomOptions.capture`. */
  private readonly capture: CaptureConfig | undefined;
  /** Likewise `RoomOptions.pacing`: tests drive whole games through the
   * transport with `"immediate"`. */
  private readonly pacing: RoomOptions["pacing"];

  constructor(options: { readonly capture?: CaptureConfig; readonly pacing?: RoomOptions["pacing"] } = {}) {
    this.capture = options.capture;
    this.pacing = options.pacing;
  }

  /** Rooms created since the process started, including ones long since
   * reaped — the live count alone can't tell a quiet server from a restarted
   * one. Reported by the operator status endpoint. */
  get roomsCreated(): number {
    return this.created;
  }

  /** Every live room, promoted or not. For reporting only: callers must not
   * mutate what they get back. */
  all(): (Room | PendingRoom)[] {
    return [...this.rooms.values()];
  }

  /**
   * Called whenever any promoted room publishes a frame — the transport
   * layer sets this once (see `attachRoomServer`) and every `Room` this
   * manager builds is wired to it. A room paces its own bots against the
   * clients' animations, so pushes no longer line up one-to-one with
   * incoming messages and can't be left to the message handlers.
   */
  onRoomUpdate: (room: Room) => void = () => {};

  /** Creates a room with no `Game` yet — every seat's deck is unknown until
   * whoever claims it connects (see `PendingRoom`'s own comment). Call
   * `promote` once `get(id).isReady()` (a `PendingRoom` only) to actually
   * build the `Game` and turn it into a real `Room`. */
  createPending(players: number, config: PendingGameConfig, hostToken?: string): PendingRoom {
    let id = randomRoomId();
    while (this.rooms.has(id)) id = randomRoomId();
    const room = new PendingRoom(id, players, config, hostToken);
    this.rooms.set(id, room);
    this.created += 1;
    return room;
  }

  /** Builds the real `Game`/`Room` for a ready `PendingRoom`, replaying its
   * already-connected seats' claims and bot fills onto the new `Room`, then
   * settles it to the first thing anyone has to answer and publishes that
   * opening frame. Replaces the map entry and returns the promoted `Room`. */
  promote(id: string): Room {
    const pending = this.rooms.get(id);
    if (!(pending instanceof PendingRoom)) {
      throw new Error(`room ${id} is not pending (already promoted, or doesn't exist)`);
    }
    if (!pending.isReady()) throw new Error(`room ${id} isn't ready to start yet`);

    const config = pending.toGameConfig();
    const game = Game.create(config);
    const room = new Room(id, game, {
      onUpdate: (r) => this.onRoomUpdate(r),
      host: pending.host,
      botSpeed: pending.botSpeed,
      firstPlayerChosen: pending.settings.firstPlayer !== "random",
      recipe: { config, firstPlayer: pending.settings.firstPlayer },
      ...this.sharedOptions(),
    });
    for (const claim of pending.claims()) {
      room.claimSeat(claim.player, claim.clientToken, claim.connection, claim.displayName ?? undefined);
    }
    this.rooms.set(id, room);
    // Bot seats go on last, and each one settles the room as it lands — by
    // which point every human claim is already bound, so the opening frame
    // (and any bot mulligan behind it) reaches everybody.
    for (const { player, displayName } of pending.botSeats()) {
      room.addBot(player, undefined, displayName ?? undefined);
    }
    room.start();
    return room;
  }

  /**
   * Deals a new game into a room whose game is over, under the same code so
   * an invite link still works: the same seats and players, each deck as it
   * was, the same settings, a fresh shuffle and (unless the host picked who
   * goes first) a fresh highroll. Mulligans as ever.
   *
   * A new `Room` replaces the old one, as a scenario builder's rebuild does,
   * rather than the old one swapping its `Game`: everything a `Room` keeps
   * (seats' auto-passes and acks, the frame gate, the bots' own memory, the
   * capture log) belongs to one game, and starting over from the
   * constructor clears all of it at once, where resetting it field by field
   * would leave whatever the next field added behind. Frames count on from
   * the old room's, and `gameNumber` tells a client this is a new game.
   *
   * Every human comes along: a connected one bound to the same seat, so they
   * land in the new game with no seat board in between; one who has dropped
   * keeps the seat for their token to reclaim on reconnect. A player who had
   * handed their seat to a bot plays it themselves again. Bots keep their
   * seats and names. Returns the new room.
   */
  rematch(id: string): Room {
    const old = this.rooms.get(id);
    if (!(old instanceof Room)) throw new Error(`room ${id} hasn't started a game yet`);
    if (old.recipe === null) throw new Error("this room can't deal a rematch");
    if (!old.game.state.result.over) throw new Error("the game isn't over yet");

    const recipe: GameRecipe = old.recipe;
    const players = recipe.config.decks.map((d) => d.player);
    const game = Game.create({
      ...recipe.config,
      seed: Math.floor(Math.random() * 0x100000000),
      startingPlayer:
        recipe.firstPlayer === "random" ? players[Math.floor(Math.random() * players.length)] : recipe.firstPlayer,
    });
    old.dispose();
    const room = new Room(id, game, {
      onUpdate: (r) => this.onRoomUpdate(r),
      host: old.host,
      botSpeed: old.botSpeed,
      firstPlayerChosen: old.firstPlayerChosen,
      recipe,
      gameNumber: old.gameNumber + 1,
      startSeq: old.frameSeq,
      ...this.sharedOptions(),
    });
    for (const claim of old.humanClaims()) {
      if (claim.connection !== null) {
        room.claimSeat(claim.player, claim.clientToken, claim.connection, claim.displayName ?? undefined);
      } else {
        room.reserveSeat(claim.player, claim.clientToken, claim.displayName);
      }
    }
    this.rooms.set(id, room);
    // As in `promote`: bots last, once every human is bound.
    for (const { player, displayName } of old.botSeats()) {
      room.addBot(player, undefined, displayName ?? undefined);
    }
    room.start();
    return room;
  }

  /** The options every room this manager builds shares. */
  private sharedOptions(): Pick<RoomOptions, "capture" | "pacing"> {
    return {
      ...(this.capture !== undefined ? { capture: this.capture } : {}),
      ...(this.pacing !== undefined ? { pacing: this.pacing } : {}),
    };
  }

  get(roomId: string): Room | PendingRoom | undefined {
    return this.rooms.get(roomId);
  }

  /** Opens a scenario builder room on an empty board. A server started with
   * `--builder` only — the transport checks. */
  createBuilder(hostToken: string): BuilderSession {
    let id = randomRoomId();
    while (this.rooms.has(id)) id = randomRoomId();
    const session = new BuilderSession(id, new HostRole(hostToken), {
      install: (room) => this.rooms.set(id, room),
      onUpdate: (room) => this.onRoomUpdate(room),
      ...(this.capture !== undefined ? { capture: this.capture } : {}),
    });
    this.builders.set(id, session);
    this.created += 1;
    return session;
  }

  /** The scenario builder serving `roomId`, if it is one. */
  builder(roomId: string): BuilderSession | undefined {
    return this.builders.get(roomId);
  }

  /** Deletes rooms with no connected seats that have been idle past
   * `maxIdleMs`, so an abandoned or never-joined room doesn't sit in memory
   * for the life of the process. Returns how many were reaped. */
  reapIdle(maxIdleMs: number): number {
    let reaped = 0;
    for (const [id, room] of this.rooms) {
      if (room.connectedSeats().length === 0 && room.idleMs() > maxIdleMs) {
        if (room instanceof Room) room.dispose();
        this.rooms.delete(id);
        this.builders.delete(id);
        reaped += 1;
      }
    }
    return reaped;
  }
}
