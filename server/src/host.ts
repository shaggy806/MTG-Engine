/**
 * Who runs a room: the host. Only the host sizes the table, fills and
 * re-decks bot seats, starts the game, and sets how fast bots play — the
 * things that shape the table for everyone, which used to be open to anyone
 * who happened to be connected.
 *
 * **Who it is.** Whoever created the room. `create-room` carries a
 * `hostToken` the creating tab keeps in `sessionStorage`, and a `join-room`
 * presenting that token binds its connection as the host — so a refresh or a
 * reconnect keeps the role, and the host needn't have claimed a seat.
 *
 * **When they're gone.** A room shouldn't be stuck because its creator closed
 * the tab. While the host isn't connected, the role falls to the first
 * connected human seat in seating order; it returns to the creator the moment
 * they reconnect. Nothing is stored for the fallback, so there's no hand-off
 * to get out of sync. With nobody eligible at all (no host token, nobody
 * seated — scripts and tests), no one is excluded.
 *
 * Shared by `PendingRoom` and `Room`, and carried across promotion, so the
 * host of the waiting room is the host of the game.
 */

import type { Connection } from "./room.js";

export class HostRole {
  private readonly token: string | null;
  private connection: Connection | null = null;

  constructor(token: string | null) {
    this.token = token;
  }

  /** Binds `connection` as the host if it presents the host token. */
  bind(connection: Connection, token: string | undefined): void {
    if (this.token !== null && token === this.token) this.connection = connection;
  }

  /** Forgets `connection` if it was the host's. */
  drop(connection: Connection): void {
    if (this.connection === connection) this.connection = null;
  }

  /** The connection holding the role right now, given the room's human seats
   * in seating order — or `null` when nobody is eligible. */
  current(humanSeats: readonly { readonly connection: Connection | null }[]): Connection | null {
    if (this.connection !== null) return this.connection;
    return humanSeats.find((s) => s.connection !== null)?.connection ?? null;
  }

  /** Whether `connection` may take a host-only action. */
  allows(
    connection: Connection,
    humanSeats: readonly { readonly connection: Connection | null }[],
  ): boolean {
    const host = this.current(humanSeats);
    return host === null || host === connection;
  }

  /** The unseated host's connection, if the host hasn't claimed a seat —
   * so the waiting room still keeps them up to date. */
  unseatedConnection(
    seats: readonly { readonly connection: Connection | null }[],
  ): Connection | null {
    const host = this.connection;
    if (host === null || seats.some((s) => s.connection === host)) return null;
    return host;
  }
}
