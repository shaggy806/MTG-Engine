---
name: ab-bench
description: Bench the current bot against the same bot at an older commit (default origin/main) at four players — one seat on the working build, three on the baseline — to measure whether a bot change made it stronger. Use when the user asks to bench a bot change, A/B test the bots, compare the bot to main or an earlier commit, or check whether a change helped or hurt the bot's win rate.
---

# A/B bench the bot across commits

`bot:bench` compares weight vectors within one build; this compares **builds**:
the current engine's bot in one seat against the baseline commit's in the
others, seeded and seated exactly as `bot:bench` seats them.

## Before

- `npm run build -w engine` — the working side is a frozen copy of
  `engine/dist`, so it must include the change. (The baseline is built from
  `git archive` into `.scratch/baseline/<sha>/` the first time, about a minute.)
- Pick the baseline: `origin/main` when the change is uncommitted or
  unpushed; otherwise the commit before it (`HEAD~1`, or the commit named).
- `--bot v2` (default) is what live rooms seat. `--bot v1` only for a change to
  `HeuristicBotController` on its own — v1 is also v2's rollout policy, so a
  v1 change needs a v2 bench too.
- Nothing else heavy running (`dev-down` if unsure): count budgets are CPU,
  and the user wants the cores used — 18 workers is right for this machine.
  Each worker's heap is capped (`scripts/worker-limits.mjs`, 768 MB): uncapped,
  a worker grew to ~1 GB of garbage and 18 of them ran the machine out of
  memory (2026-10-02). Capped, 18 workers come to about 8 GB.

## Run

Background, with a check-in every few minutes (Monitor on the output file,
3-minute interval — the user likes to see progress):

```bash
cd "$(git rev-parse --show-toplevel)/engine" && npm run bot:ab -- --base origin/main --bot v2 --games 400 > "$TEMP/bot-ab.log" 2>&1
```

400 four-player games resolve about ±4 points; v2 plays ~6-7 games a minute,
so about an hour. Interrupted? Rerun the same command — it resumes from its
NDJSON (`.scratch/ab-<bot>-<sha>-4p.ndjson`).

## Reading it

Even is 25% at four players. Report the result with its interval, and:

- **Level** (interval spans 25%): no measured change — a fix a player can see
  ships on that plus a scenario (the plan's rule), a change meant to add
  strength didn't.
- **Leaning one way but not resolved**: don't grind more games by reflex. The
  user prefers reading what changed: offer `decision-diff` instead, which says
  *why* in a few games.
- **Timeouts/errors**: listed by seed. A timeout is worth a `replay-seed`
  look (seed 50 hid three problems); an error is a bug — reproduce it on both
  builds before blaming the change.

Stop early when the answer can no longer change the decision.
