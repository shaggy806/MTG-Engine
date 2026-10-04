---
name: bot-misplay
description: Record and explain a bad choice a bot made in a live game that couldn't be captured — rebuild the position from the user's description as a training scenario, confirm v2 still makes the mistake, find the code that chose it and why, and log it in docs/bot-misplays.md. Use when the user reports a bot misplay from the site ("a bot played X when it should have Y", "why did the bot…"), especially without a Capture file.
---

# Record a bot misplay

The in-game Capture button saves a position exactly (`captures/`, read by
`bot:captures`). This skill is for everything else: a misplay seen on the live
site that only exists as the user's description. The goal is the same — a
position that makes the bot answer the same question, so the mistake can be
seen, explained and later fixed and gated.

**Record and explain; don't fix unasked.** End by offering the fix.

## 1. Pin down the decision

From the report, write down before touching code:

- **The question the bot was asked**: a land drop, a spell or activation in a
  priority window, attackers, blockers, a target, a "you may", a mode, a card
  from a zone, a pay-or-not (a shock land's 2 life, a ward cost).
- **What it chose, and what it should have** — and *why* the right answer is
  right in the user's words. That sentence becomes the scenario's `rule`.
- **The board that matters**: turn/round, life, lands (tapped or not), hand,
  relevant permanents, table size. Leave out everything that doesn't bear on
  the choice.

Ask the user only for what you can't rebuild the position without (one
question, with your best guess offered). Don't ask for what doesn't matter.

## 2. Find the code that answers that question

- Land drops: v2 (`bot/eval-bot.ts`, "lands.length > 1") scores each land with
  its search, v1's pick (`controller.ts`'s `bestLand`, `castableAfter`) first,
  so v1 wins every tie.
- "As this enters / you may pay" (shock lands, `choose-modes` with costs):
  `controller.ts`'s `chooseModes`, priced by `effect-worth.ts`.
- Priority, attacks, blocks, targets: `bot/eval-bot.ts`; the evaluation's
  terms are `bot/evaluate.ts` + `bot/features.ts`.
- `controller.ts`'s `answerAwaited` routes every pending decision; grep the
  decision kind there when unsure.

Read that code until you can say what the bot compared and why the wrong option
won. That explanation is the deliverable as much as the scenario.

## 3. Write the scenario

In `engine/src/bot/scenarios.ts`, beside the scenarios like it, as
`kind: "training"` (a known-wrong answer; it doesn't gate). Follow the file:

- `table(registry, players, active)` gives a board on a **mid-game clock**
  (`midGame`); an early-game misplay sets `game.state.turn.number` back (round
  2 for alice at four players is turn 5). `lands`, `onBoard`,
  `game.debugSpawn(name, player, "hand")`; tokens need `isToken = true`.
- A comment: "Reported from a live game (DATE): …" in the user's terms, then
  what the bot compares (from step 2).
- `judge` passes only the right answer; `detail` names what was chosen.
- Check the setup **reaches the question** (`game.state.awaiting`, the
  legal actions) — a scenario that never asks tests nothing.

## 4. Confirm it reproduces

```bash
cd "$(git rev-parse --show-toplevel)/engine" && npm run build && npm run bot:scenarios > "$TEMP/sc.txt" 2>&1; grep -E "FAIL|passed|right|wrong" "$TEMP/sc.txt"
```

The gate must still pass, and the new training scenario must read **wrong**
with the choice the user saw. If it reads right, the position is missing
something the live board had: compare with the report, adjust, rerun. If it
still won't reproduce, say so and record it as not reproduced — don't keep a
scenario that passes by accident.

For a choice made by the search (not a fixed heuristic), `npm run
bot:fit-scenarios` lists the single weights that would flip it and what each
breaks — part of the explanation.

## 5. Log it

Add an entry at the top of `docs/bot-misplays.md`: date, what the bot did,
what it should have done, the scenario's name, the explanation from step 2,
and the likely fix with what it might break. Status `open`. Then the `ship`
skill's checks (the engine suite covers the scenarios) and commit:
`Bots: record a live misplay — <short description>`.

## 6. Report

A few lines: what the bot compared and why the wrong option won, the scenario
name, and the fix you'd make. Ask before making it.
