# server/ — the authoritative room host

Node + `ws`, ESM + NodeNext (relative imports need `.js`). One process runs many rooms; each
owns exactly one real `Game` and pushes every connected seat its own `viewFor(seat)`.

**Full per-file detail: `docs/architecture/server.md`.** Read a file's entry before changing
that file.

## Rules that aren't obvious from any one file

- **Two lifecycle stages.** A `PendingRoom` (`pending-room.ts`: seat claims and decks, no
  `Game`) is promoted into a `Room` (`room.ts`) once every seat is claimed or bot-filled,
  because `Game.create` deals at once and a seat's deck arrives with its claim. The table is
  sized (2–4) in the pending stage only.
- **Bots live in `Room.settle()`**, not in `Game`'s controllers, so mixed bot/human tables
  compose. `settle()` stops at each bot action and publishes a numbered **frame**, then
  releases the move once every acking client reports finishing its animations (with timeouts
  as backstops). Tests and scripts use `RoomOptions.pacing: "immediate"` and fake timers.
- **`broadcast` is never called from a message handler.** A room publishes its own frames
  (`room.publish()` → `onUpdate`).
- **The host** (`host.ts`) is whoever created the room. Only they may add or remove seats and
  bots, set bot decks and speed, start the game, and deal a rematch once it's over
  (`requireHost` in `ws-server.ts`). A rematch is a new `Room` under the same code
  (`RoomManager.rematch`), its frames carrying the next `game` number.
- **The wire protocol lives in the `protocol/` workspace**, imported as types by both server
  and client. Change it there, never restate it here.
- **Security-relevant:** printings are accepted only as a bare Scryfall card id
  (`assertPrintingsAreSafe`, since they become `<img src>` in every seat's browser). The
  `/status` endpoint runs on a **separate loopback-only port** (4010) on purpose: the game port
  is public through the Cloudflare tunnel. Captures (`--capture`) hold whole hidden state, and the
  scenario builder (`--builder`, `builder.ts`) lets a client put any card anywhere, so both are
  dev-only: the production service starts with neither.

## Where things are

`room.ts`, `pending-room.ts`, `room-manager.ts`, `ws-server.ts`, `host.ts`, `decks.ts` (fallback
seat decks from the engine's `SAMPLE_DECKS`), `import-deck.ts` (`POST /import-deck`, streamed
NDJSON; an unimplemented card is read from the engine's Oracle snapshot via `card-data.ts`,
else looked up on Scryfall in batches), `oracle-tags.ts` (the card replacer's generated tag index),
`capture.ts`, `builder.ts` (the scenario builder: a board built from data, rebuilt into a new
frozen `Room` under the same code on every edit), `status.ts`. Tests in `src/test/`.

## Commands

(From the repo root with `-w server`.)

- `test`, `typecheck`, `build`, `start` (the real server on `ws://localhost:4000`), `dev`.
- `dev-rooms`: a room server preloaded with the boards in `scripts/dev-scenarios.mjs`, plus a
  loopback command port on 4099. Use it to check a client change against a known position (the
  `dev-up` skill starts it). Room codes and command-port ops are in
  `docs/architecture/server.md`.
- `gen:oracle-tags`: regenerates the tag index (takes most of an hour; run it in the background).
