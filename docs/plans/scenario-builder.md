# Scenario builder

Status: **shipped** (2026-10-03) — the first version; its known gaps are in `BACKLOG.md`.

A developer's tool for testing cards and interactions: build a board from scratch, searching the
card pool and placing cards, with nothing triggering while it's built; then play it, to see how
cards interact, how the bots answer, or whether the engine gets it right. Its first workload is
`docs/manual-checks.md`, whose entries each give a setup to build and what to look for.

## Where it lives

- **Dev only, twice over.** The client offers it only in a dev build: the landing page's
  "Scenario builder" card and the drawer (`client/src/builder/`) sit behind `import.meta.env.DEV`,
  so a production bundle doesn't contain them. The server answers its messages only when started
  with `--builder` (the `dev` script and dev-rooms pass it; the production service doesn't),
  since it lets a client put any card anywhere and see every hand.
- **On the server, because the client never runs a `Game`.** The board has to be a real game
  for the table to draw it, and the table only ever draws server views. So the builder is a
  server-side session (`server/src/builder.ts`), and the client edits it over the room protocol.

## The scenario is data, and every edit rebuilds the game

The board being built is a `ScenarioSpec` (`protocol/src/scenario.ts`): the seats with their life,
poison and whether a bot plays them; whose turn and which step; how many basics fill each library;
and every card — name, owner, zone, and on the battlefield whether it's tapped or summoning sick,
its counters and what it's attached to. A card is named in edits by a `key` of its own, because
object ids change with every rebuild.

Every edit sends the whole spec, and the server builds a **fresh `Game`** from it and swaps it in.
That's what makes "no triggers while building" hold without special cases:

- A fresh game reaches the chosen step on turn 1 with empty boards (`openingHandSize: 0`, and
  whatever the turn drew goes back), so nothing has happened yet.
- Cards are placed with `Game.debugSpawn`, which announces no entry; a commander leaves the
  command zone by `Game.debugMove`, or directly for a zone where moving it would ask the
  rule 903.9 question; and the pending triggers are dropped once the board is laid out. An
  "as this enters" choice a placed card raises is answered as a bot would, so nothing waits.
- Static abilities do apply — the board is drawn exactly as play will start from it.

The alternative, mutating one long-lived game with each edit, would have needed an undo for
every kind of edit (a removed card's leave-the-battlefield triggers, a changed active player
mid-turn) and could drift from what play actually starts from. Rebuilding is a few
milliseconds for a board this size.

## A room per rebuild

A `Room` owns one `Game` for good (`room.game` is readonly, and its seats, gate and auto-pass
bookkeeping all index into that game's event log), so a rebuild makes a new `Room` under the same
code (`BuilderSession.swap`, installed in the manager's map). Two things carry across:

- **The humans.** `Room.humanClaims()` hands each claim (token, connection, name) to the new room,
  which re-seats them; a seat the scenario dropped moves its developer to the first free one.
- **The frame count.** `RoomOptions.startSeq`: the client drops any frame numbered no higher than
  the last it saw (`usePlayback`), so a new room counting from zero would never be drawn.

While building, the room is **frozen** (`RoomOptions.frozen`): `settle()` only publishes, so no bot
moves and no auto-pass passes; `dispatch` is refused; and every seat is sent no legal actions, so
the table can't be played. Starting play builds the game once more, unfrozen, with bots in the
seats the scenario names (never the developer's own). "Back to start" rebuilds the scenario play
started from; "Edit from here" turns the game as it stands back into a scenario
(`snapshotScenario`) and builds on that.

## Acting for every side

`builder-seat` (`Room.switchSeat`) moves the developer's connection to another seat no one else
holds and no bot plays, leaving the old one unclaimed. With every side but one played by bots, or
by the developer moving between seats, one person can test any interaction. A seat nobody holds
and no bot plays simply waits when it's asked something.

## The client

`client/src/builder/BuilderPanel.tsx` is a drawer over the table's right edge, lazy-loaded by
`GameScreen` only in a dev build and only in a builder room (`state.builder`). It never changes the
board itself: each control makes a new spec (`builder/spec.ts`, pure and unit-tested) and sends it.
While building, a press on any card of the board selects it in the drawer, caught in the capture
phase before the table's own handlers — on `pointerdown`, because by the time a click arrives a
tile's hover popover can be what's under the pointer. Scenarios can be saved in the browser
(`localStorage`), copied or downloaded as JSON, and pasted back in.

Changing the number of players between frames was new to the table: `GameScreen` now works out the
seats around the player from the frame being shown, not the newest one, so it never asks a board
about a player who isn't on it.

## Not yet

What a scenario can't say yet, and the snapshot so leaves behind: who controls what they don't own,
a transformed or face-down card, damage marked, effects lasting a turn, and the stack. Play always
starts on turn 1. These are `BACKLOG.md` items.
