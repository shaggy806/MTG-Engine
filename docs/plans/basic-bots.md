# Basic bots (v1 heuristic opponent)

Status: **implemented** — see `HeuristicBotController` (`engine/src/controller.ts`),
`Room.addBot`/`Room.settle` (`server/src/room.ts`), the `add-bot` wire message
(`server/src/protocol.ts`, mirrored in `client/src/net/protocol.ts`), and the "Add bot"
button in `SeatPickerScreen` (`client/src/App.tsx`). This file is the design record kept
for future reference, not living documentation — see `CLAUDE.md` for current architecture.

This is the first of five long-term client/server features discussed together: a public
card-library page, a deck builder, server-side deck save/share, an automatic replacer for
unimplemented cards on decklist import, and basic bots. Bots went first because — unlike
the other four — it needed no new persistence/identity layer: it plugs into the engine's
existing `PlayerController` seam, and it's immediately useful (solo deck testing, filling
empty seats, a second fuzz target beyond `random-demo.mjs`'s `RandomController`). The card-
library page (`card-library-page.md`), the deck builder (`deck-builder.md`), and the card
replacer (`card-replacer.md`) followed. Only deck save/share is still unscoped — it should use
shareable deck codes (no login), matching the existing room-code pattern, rather than full user
accounts.

## Key architectural finding

`engine/src/game.ts`'s `tick()` *does* auto-drive a `PlayerController` per seat via
`config.controllers` — but only for callers that use `Game.advance()`/`advanceUntil()` all the way
through a decision (tests, `play.mjs`, the card lab sandbox). The live multiplayer path
(`server/src/room.ts`) never reaches that: `Room.settle()` calls
`game.advanceUntil(isSettled)`, and `isSettled` (`engine/src/auto-settle.ts`) returns `true` the
instant *any* seat holds priority or an `awaiting` decision exists — before `tick()` would invoke
that seat's controller. `Room.settle()` then always returns control to the WS layer, which is
correct for a room of humans, each waiting to send a `dispatch` message.

So a bot in a live room is **not** "attach a `PlayerController` to `Game.create`" — it's new logic
in `Room.settle()`: when the seat that's next up is bot-controlled, synthesize its decision
in-process (build a `ControllerView`, call the bot's `act(view)`, `game.dispatch(...)` it directly)
and keep looping instead of returning. This reuses the `PlayerController` contract 1:1 (same
interface `RandomController`/`AutomaticController` already implement) with zero engine-core
changes — only a new controller subclass.

## 1. Engine: `HeuristicBotController`

Lives alongside `RandomController` in `engine/src/controller.ts`, same shape: a
`PlayerController` whose `act(view)` reads `view.legalActions()` and picks one, and whose
combat/decision methods build declarations from the `LegalAction` fields (`eligible`,
`defenders`, `canBlock`, etc. — `engine/src/actions.ts`). Owns its own `CardRegistry`
(`createDefaultRegistry()`) so it can look up a card's mana cost (`parseManaCost`/`manaValue`)
and call `computeCharacteristics(view.state, registry, id)` for battlefield power/toughness —
`ControllerView.state` is the real, un-redacted `GameState`, safe for any battlefield object.

v1 heuristics (deliberately simple — "plays a sensible game", not "plays well"):
- **Priority action** (cast-spell / play-land / activate-ability / pass): play a land if one's
  legal; otherwise cast the highest-mana-value affordable spell/permanent currently offered by
  `legalActions()`; otherwise activate an ability if one's offered; otherwise pass. Because `act()`
  is called again each time the bot still holds priority after its own action, this greedily
  spends a turn's mana across repeated calls without any lookahead needed.
- **declare-attackers**: attack with every eligible creature with power > 0, each assigned to
  whichever legal defender (opponent or their planeswalker) currently has the lowest life /
  loyalty. No block-prediction — a known v1 limitation.
- **declare-blockers**: for each attacker, block with a favorable trade if one exists (a blocker
  whose power ≥ the attacker's toughness and toughness > the attacker's power); if unblocked
  damage would be lethal or near-lethal this turn, chump-block the largest remaining unblocked
  attackers with whatever's left untapped.
- **assign-combat-damage / order-blockers**: reuse the existing `standardDamageAssignment`.
- **targeting / modes / sacrifice / scry / mulligan / etc.**: inherits `AutomaticController`'s
  existing conservative defaults (first legal target, decline optional modes, keep an opening
  hand, etc.) rather than inventing new logic for every decision kind.

Tested by `engine/src/test/heuristic-bot.test.ts`: bot-vs-bot and bot-vs-`AutomaticController`
games across 2/3/4 players, run to `game.state.result.over` — a second fuzz target alongside
`random-demo.mjs`, not a "does it win well" test.

## 2. Server: bot seats in `Room`

`server/src/room.ts`:
- `Room.addBot(player)` fills an open seat with a `HeuristicBotController`, rejecting a seat
  already claimed by a human or already bot-controlled; `claimSeat` gets the mirror-image guard.
  `seatStatuses()` reports `isBot`.
- `Room.settle()`'s loop: before either of its two "return to caller" points (`awaiting !== null`
  and `priority.holder`), it checks whether the next decider is a bot seat and answers it in-process
  instead of returning. Mulligan is parallel (`awaiting.hands`, not a single `awaiting.player`
  pointer), so that check is seat-by-seat across `hands`; every other `awaiting` kind has one
  decider. Composes correctly with a mix of bot and human deciders for free: once no more bot
  decisions are answerable, it returns exactly as it did before bots existed.

## 3. Protocol + wire

New `ClientMessage`: `{ type: "add-bot", roomId, seat }`. `SeatStatus.isBot: boolean`. The
`add-bot` handler in `ws-server.ts` mirrors `claim-seat`'s error-reporting shape, and — since the
caller may not have claimed a seat yet and so isn't in `connectedSeats()` — also sends a direct
`room-joined` refresh when needed (the normal `broadcast` only reaches claimed/connected seats).

## 4. Client

`SeatPickerScreen` (`client/src/App.tsx`) gets an "Add bot" button next to each open seat,
calling a new `NetworkGame.addBot(seat)` (`client/src/net/useNetworkGame.ts`). This lets whoever's
in the lobby fill any subset of the remaining seats with bots (solo vs 1-3 bots, or leave seats
open for more humans) rather than a single "N humans + M bots at room creation" picker.

## Non-goals for v1 (explicitly deferred)

- Difficulty levels / multiple bot personalities — one heuristic bot only.
- Reclaiming a bot seat back to human control mid-game.
- Lookahead/minimax-style combat math (block prediction before attacking, EV-based target/spell
  selection) — v1 is greedy and locally-reasonable, not strong play.
- Bots as a solo/local hot-seat mode outside the room server — bots only ever occupy a seat in a
  real `Room`, consistent with "never a local hot-seat demo" in `CLAUDE.md`.
