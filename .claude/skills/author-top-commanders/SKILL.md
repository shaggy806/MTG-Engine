---
name: author-top-commanders
description: Author the next batch of the top-500 commanders (engine/src/cards/top-commanders.txt, ranked by decks run as commander) — take the next feature in the commander gaps' greedy build order, build it, then author every commander (and any top-5000 card) it unblocks, test, and ship. Use when the user says to work on commanders, author commanders, do the next commander batch, close the commander gap, or runs this skill with no other instructions.
---

# Author the next commander batch

`top-commanders.txt` ranks the 500 most-played commanders by decks built
around them — a commander is the one card an imported deck can't do without.
No commander is left that needs no engine work (BACKLOG, "Commander gap"), so
a batch is **a feature, then the commanders it unblocks**.

**Rule zero governs everything here** (`engine/src/cards/AUTHORING.md` §0):
never author a card the engine can't run *exactly*. A commander authored
wrong is worse than one substituted — the deck is built around it.

## 0. Orient

- `git status`; `npm run build -w engine`.
- `BACKLOG.md`, "Commander gap": the count, the greedy order, the UI-bound
  list, the dropped commanders.
- `npm run cmdrs:gaps -w engine` — every missing feature ranked by
  commanders blocked, and the greedy engine-only build order over
  `engine/src/cards/top-commanders-gaps.json`.
- `engine/src/cards/AUTHORING.md` §0-1 and §15 if not already in context.
- The user moved the *overall* priority to the top-5000 cards
  (`author-top-cards`); this skill is for when they ask for commanders.

## 1. Pick the feature

The first entry of the greedy order that is **engine-only**. Take a
UI-bound one (it needs a new client decision) only if the user asked, or if
nothing engine-only is left — and then plan the browser check.

**The gaps JSON over-counts, in both directions.** Its per-commander `needs`
were triaged by keyword: before building, read the Oracle text of every
commander the feature is said to unblock (`npm run card:lookup -w engine --
"Name" --rulings`) and confirm (a) it really needs this, and (b) nothing else
it needs is missing. Fix the JSON's `needs` for any that were wrong. If the
feature turns out to unblock nothing on its own, take the next one.

Also grep the top-5000 backlog for cards the same feature unblocks
(`top-commander-cards.txt` `[ ]` entries, `engine/data/sweep-*/*.json`
`needs`) — they come along in this batch.

## 2. Build it

Engine change + its own `engine/src/test/<feature>.test.ts` + its entry in
AUTHORING.md's vocabulary (and `neededCards-features.md`'s index). Follow
`engine/CLAUDE.md`'s rules: every decision is a dispatched action with a
`decisions/` module; `Game` is the only writer of state; cite the rule
numbers. Add its key to `top-commanders-gaps.json`'s `built`.

## 3. Author

Every commander it unblocks, plus the top-5000 cards, in `cards/pool/`
(scaffold with `npm run card:scaffold -w engine -- "Name"` and read what it
filled in against the Oracle text). Partners and backgrounds: the declarative
`pairing`. `npm run gen:cards -w engine`.

## 4. Test

- `engine/src/test/commanders-<feature or batch>.test.ts`: each commander's
  own defining clause, played through a real `Game`, and break it once to see
  the test fail.
- `npm run card:verify -w engine` (network) and `npm run card:text -w engine`.
- Touched tests while working, the full engine suite at the end; the fuzzer
  with each new commander forced in (`--with`), two and four players.
- A new client decision: `npm run test:e2e -w client` and a live check at a 2-
  and a 4-player table, ~768px tall (`dev-up` / `dev-down`).

## 5. Record

- `npm run cmdrs:mark -w engine` and `npm run cards:mark -w engine`.
- `BACKLOG.md`: the "N of the 500" count, the greedy order's next ten (rerun
  `cmdrs:gaps`), the most-needed list; delete what landed.
- `neededCards-features.md`: the feature under its finished passes.

## 6. Ship

The `ship` skill. Commit style from the history: `Cards: <feature> — <the
commanders>` or `Engine, cards: …`, with what the feature is (rule numbers)
and each commander it brought.

## 7. Report and offer the next

The count before and after, the feature and what it unblocked, any
`needs` corrected, and the next feature in the greedy order. Offer it —
don't start it unasked.
