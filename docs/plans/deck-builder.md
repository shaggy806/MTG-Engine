# Deck builder (build a deck, then actually play it)

Status: **implemented** — see `client/src/deck-builder/` (the page + local persistence),
`server/src/pending-room.ts` + `server/src/room-manager.ts`'s `createPending`/`promote`, the
`claim-seat` protocol's `deck` field, and `engine/src/deck-validation.ts` /
`engine/src/sample-decks.ts`. This file is the design record kept for future reference, not
living documentation — see `CLAUDE.md` for current architecture.

Third of the five long-term features named in `basic-bots.md` (bots and the public card-library
page shipped first). The remaining two — server-side deck save/share, and a decklist-import card
replacer — are still unscoped.

## Key architectural finding

A deck builder is worthless without a way to *use* the deck it builds. Before this, every room's
decks came from `server/src/decks.ts`'s hardcoded showcase piles, baked in the instant
`create-room` ran — before anyone had even joined. Discussed with the user: the deck picker
should be its own page, decoupled from the room lobby, and the chosen deck should follow the
player whether they create a room or join one by code. That second half is the one with real
architectural weight — a joiner's deck isn't known until they connect, so the room's `Game`
(which shuffles libraries and deals opening hands immediately, for every seat, the moment it's
built) can't be constructed at `create-room` time any more. It has to wait for every seat's deck
to be known — a real waiting-room phase between "room exists" and "game started."

**User-visible behavior change**: a room used to start the instant it was created, with empty
seats just sitting uncontrolled. Now nobody sees a board until every seat is filled (claimed by a
human or bot-filled) — standard multiplayer-lobby behavior, but a deliberate change from before.

## 1. Engine: shared deck validation + sample decks

`validateCommanderDeck` (singleton/colour-identity/size checks) moved from `server/` to
`engine/src/deck-validation.ts` — pure, synchronous logic over a `CardRegistry`, so the client's
builder can run the exact same checks with zero network round-trip instead of duplicating the
rules. `engine/src/sample-decks.ts`'s `SAMPLE_DECKS` lifts the four hand-curated showcase decks
out of `server/src/decks.ts`'s `PlayerId`-keyed `SEATS` into a plain, nameable list — one source
of truth for both the server's per-seat fallback and the builder's "starter decks."

## 2. Server: `PendingRoom`

A room now starts as a `PendingRoom` (`server/src/pending-room.ts`) — the same claim/reclaim/
connection bookkeeping `Room` already has, deliberately kept as a separate class rather than
making `Room.game` nullable, since `Room`'s entire surface (`dispatch`/`settle`/bot turns) already
assumes a real `Game` and threading null-checks through it for no benefit risked destabilizing an
already-tested class. Claiming a seat with no `deck` (a bare room-code link, nobody having
visited the builder) immediately falls back to that seat's positional starter deck, so the old
zero-friction "just click and play" flow is unchanged. Once every seat is claimed or bot-filled
(`isReady()`), `RoomManager.promote` builds the real `Game`, wraps it in a `Room`, replays each
connected seat's claim onto it, and settles it for the first time.

## 3. Client: the deck builder + wiring it into create/join

`client/src/deck-builder/DeckBuilderPage.tsx` — a search/filter list (same shape as the card
library) where each row adds/removes itself from the deck being edited, plus a commander toggle
and a live legality panel. `decks.ts` persists to `localStorage` (per-browser only — no
server-side save/share yet) as a small named list, one of which is "active": either one of your
own saved decks, or directly one of `SAMPLE_DECKS`'s starters (playable as-is, no duplication
required). Routed via `main.tsx`'s `pathname` branch, same as `/library` — no WebSocket ever
opens for this page.

`SeatPickerScreen` sends the active deck's payload along with `claim-seat` and shows which deck
is about to come along before you click Join. `useNetworkGame` gained a `'waiting-for-players'`
status (and `WaitingForPlayersScreen`) for the new gap between claiming a seat and every other
seat filling — the claim is persisted to `sessionStorage` as soon as the first `room-joined` reply
confirms it (not only once a `state` eventually arrives, which might be a while off), so a refresh
mid-wait still reclaims the same seat instead of stranding the player.

## Non-goals for v1 (explicitly deferred)

- Server-side deck save/share (shareable codes, cross-device) — the separate, later roadmap item.
- Enforcing deck legality server-side — advisory only, exactly like the pre-existing `/import-deck`
  audit; the engine has no opinion on format legality (today's showcase decks aren't legal either).
- Bots bringing a custom deck — a bot-filled seat always uses its positional starter deck.
- Non-Commander formats in the builder UI — the data shape leaves room for future use, but v1's UI
  only targets exactly one commander + 99 other cards.
