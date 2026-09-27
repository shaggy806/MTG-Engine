---
name: replay-seed
description: Replay one bot game by seed and watch it — every slow decision and activation with its step and stack, each turn's time and life totals — optionally saving a snapshot at a turn and restarting from it, to study a slow, stuck, timed-out or odd bot game. Use when a bench or fuzzer reports a timeout or odd result for a seed, the user asks why a bot game is slow or what a bot did on some turn, or wants to look at a specific position.
---

# Replay a seed

How seed 50's bench timeout was taken apart on 2026-09-27: three stacked
problems (a search per activation, Treasures valued without end, then plain
board size), each visible only once the one before it was fixed.

## Run

`npm run build -w engine` first — it plays the current build.

First pass, to find the turn that matters and save it:

```bash
cd "$(git rev-parse --show-toplevel)/engine" && npm run bot:replay -- --seed 50 --players 4 --snapshot-at 40 > "$TEMP/replay-50.log" 2>&1
```

Then study that turn from the snapshot — seconds to start instead of the
minutes it took to get there:

```bash
npm run bot:replay -- --from ../.scratch/replays/seed-50-t40.json --until 41
```

- A seed from `bot:bench`/`bot:ab`: same seed, same `--players`, and the seats
  and decks come out the same (`bot-seating.mjs`). Every seat plays the current
  build here, so a mixed-build bench game won't replay move for move — the
  decisions that matter usually do.
- Long runs go in the background with a Monitor check every 3 minutes (the
  user wants the updates), and get stopped once they've shown what's needed.
- `--slow MS` sets what counts as slow (2000 default); `--quiet-before TURN`
  skips the early game.
- A snapshot holds only the game, not the bots' own memory (v1's activation
  counts, v2's batch and pass holds) — harmless at the start of a turn.

## Reading it

Say turns the way people count them: at four players turn 37 is the first
player's tenth. Look for a decision repeated with a full search each time,
searches that grow turn over turn, one seat dominating the time, and a board
the evaluation rewards for no progress (life totals not moving while scores
climb). To see *why* a move scored as it did, re-score the candidates on the
snapshot with `evaluateState`/`outcomeOf` and diff their features, as the
seed-50 probe did.
