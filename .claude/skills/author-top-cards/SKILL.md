---
name: author-top-cards
description: Author the next batch of missing cards — while the starter precons (engine/src/sample-decks.ts, the bots' default decks) still have stand-ins, their missing cards deck by deck; after that, the top-5000 Commander cards (engine/src/cards/top-commander-cards.txt, most-played first) — pick the next unimplemented cards, author every one the engine runs faithfully, record what blocks the rest, build the blocking feature when one clearly leads, test, and ship the batch. Use when the user says to work on cards, author cards, do the next card batch, continue the top-5000 / card backlog, or runs this skill with no other instructions.
---

# Author the next card batch

The current authoring priority (BACKLOG, "Card backlog"): **the stand-ins
left in the `SAMPLE_DECKS` precons** (`npm run decks:stand-ins -w engine`
lists them with their blockers; the five Tarkir: Dragonstorm decks have none
left) — and after them the top 5000 cards by EDHREC rank, worked down in rank
order. One run = one batch, shipped.

**The tools, in the order a card uses them** (each prints what you'd
otherwise grep for — reach for them first):

- `npm run card:brief -w engine -- "A" "B" …` — Oracle text and rulings, the
  card's triage records (each need flagged if built since), and per Oracle
  line the pool's closest authored abilities with their files. `--test`
  adds a test outline. Reads `dist/`: build first.
- `npm run card:vocab -w engine -- <term>` — whether the vocabulary can say
  something: usage with small example cards, declarations with docs, the
  guide's lines.
- `npm run cards:needs -w engine -- --stale | --rank | --feature <key>` —
  what's been built since triage, what blocks the most cards, one need's cards.
- `engine/src/test/harness.ts` — the shared test table.
- `npm run verify` — every check, the fuzzer with the batch's new cards in.
- `npm run decks:stand-ins -w engine -- --implemented` — drops the authored
  cards' stand-ins and fixes BACKLOG's count.

Edit files with the Edit tool (`game.ts` included — it keeps its CRLF and
NUL), not with scripts that rewrite text.

**Rule zero governs everything here** (`engine/src/cards/AUTHORING.md` §0):
never author a card the engine can't run *exactly* — no dropped clause, no
hardcoded number, no choice made for the player. A missing card costs
nothing; a wrong one lies at the table. When in doubt, it's blocked.

## 0. Orient (read, don't skim)

- `git status` clean enough to work on (the `sync-check` skill if on a
  different machine than last time). `npm run build -w engine`.
- `BACKLOG.md`, "Card backlog": the counts, the line marked **Next** (the
  feature measured to unblock the most), anything to merge first.
- `engine/src/cards/AUTHORING.md` §0-1 and §15 (what the engine can't
  express) if not already in context this session; §3-10 as each card needs.
- `engine/src/cards/neededCards-features.md`, "Open: the card backlog", for
  features already ranked.

If BACKLOG lists something to do *before* authoring (a branch to merge, a
broken build), do that first or tell the user.

## 1. Pick the batch

**First, `npm run cards:needs -w engine -- --stale`**: cards whose recorded
blockers have all been built since are the cheapest cards there are — recheck
them before anything new.

**While any `SAMPLE_DECKS` deck has substitutions**, the batch is precon
cards: `npm run decks:stand-ins -w engine` lists them with their blockers.
**Group them by shared blocker** — a feature several stand-ins need, or one
that `cards:needs -- --feature <key>` shows blocking many other cards, is
built once for all of them — and take the cheapest groups first. Otherwise,
the top-5000 list:

The next ~60 unmarked `[ ]` entries of `engine/src/cards/top-commander-cards.txt`
in rank order. Skip the ones `engine/data/sweep-2/K*.json` or a
`engine/data/sweep-3/*.json` already records as blocked — unless a feature
they need has since landed (its key in `top-commanders-gaps.json`'s `built`).

For each: `npm run card:brief -w engine -- "Name" …` (several names per
call). Sort into:

- **Authorable now** — every clause expressible with the existing
  vocabulary. The brief's analogs show how the pool already says each line;
  `card:vocab <term>` answers the rest (several "missing" mechanics have
  turned out to exist, unused). `npm run card:scaffold -w engine -- --next 60
  --cards` writes skeletons for the lot into `cards/scaffold/`; a card the
  parser reads whole goes to `cards/review/`.
- **Blocked** — name the missing feature with a key from the need vocabulary
  (`top-commanders-gaps.json`'s `features` or `engine/data/needs-vocabulary.json`'s;
  add a new one there, with its `family`, when none fits —
  `test/needs-vocabulary.test.ts` fails on an unknown key), with one line of
  why.

## 2. Build a feature, if one leads

If one missing feature blocks **five or more** cards of the batch (or is the
BACKLOG's **Next** line and blocks at least three here), build it before
authoring: engine change + its own test file + the AUTHORING.md vocabulary
entry, following `engine/CLAUDE.md`'s rules (every decision is a
dispatched action; `Game` is the only writer; rules accuracy with rule
numbers). A feature needing a new player decision is also a client change —
check it live in a 2- and a 4-player room (`dev-up`, `dev-down`) at ~768px
tall. Then author the cards it unblocks in this batch. Otherwise, skip
feature work this run and note the leader for the next.

## 3. Author

Target 30-50 cards. For each:

- File in `engine/src/cards/pool/` (kebab-case name); tokens in `tokens/`,
  reusing an existing token file when one matches exactly. `text` stays close
  to Oracle.
- Anything the scaffolder filled in, **read against the Oracle text** — its
  templates match sentences, not meaning.
- Cycles and families: a shared helper in `cards/helpers.ts` beats ten copies.
- `npm run gen:cards -w engine` after adding files.

## 4. Test

- `engine/src/test/top5000-batch-<N>.test.ts` (next N after the existing
  ones; precon stand-ins go in `precon-standins.test.ts`), written on
  `src/test/harness.ts` — `card:brief -- "Name" --test` prints an outline:
  one focused test per card whose behaviour is more than a stat line or a
  copy of a tested pattern — the clause most likely to be wrong. For a test
  that could pass by accident, break the card and watch it fail.
- `npm run card:text -w engine -- --offline` (no new MISSING/EXTRA lines from
  this batch).
- While authoring, run only the touched tests (`npx vitest run
  top5000-batch-<N> pool.test` from `engine/`).
- Then **`npm run verify`** (in the background): the build, every suite, the
  new test files type-checked, card:verify, both fuzzer table sizes, the
  fuzzer with every card the batch adds forced in, and the bot gate.

## 5. Record

- Precon cards: `npm run decks:stand-ins -w engine -- --implemented` deletes
  each authored card's stand-in and rewrites BACKLOG's count
  (`sample-decks.test.ts` fails until every implemented card's substitution
  is gone). A TDC deck's card also has a row in `docs/plans/precon-decks.md`.
  Blocked precon cards' records are in `engine/data/sweep-3/PC-*.json`.
- A feature that landed: add its key to `top-commanders-gaps.json`'s `built`
  array (`cards:needs -- --stale` then flags every card that waited on it).
- `verify` re-marks `top-commander-cards.txt` and `top-commanders.txt`.
- The blocked cards: `engine/data/sweep-3/<batch>.json`, same shape as
  `sweep-2`'s files (`batch`, `status`, `authored: [{name, files, tested}]`,
  `blocked: [{name, needs, why}]`), so the next run skips them.
- `BACKLOG.md`: the implemented count, and the **Next** line if the ranking
  of blockers changed; the batch's summary (authored headliners, what blocks
  the rest) goes in `docs/card-blockers.md`, not BACKLOG; `neededCards-features.md` if a feature landed or a new
  one now leads.
- Any commander this batch happened to implement is re-marked by `verify` too.

## 6. Ship

Use the `ship` skill. Commit message in the history's style: `Cards:
top-5000 batch <N> — <three or four headline cards> and <count> more` (or
`Cards: TDC precons batch <N> — …` for precon cards, naming the decks), the
rank range, the cycles, and any engine fix found on the way, each with why.

## 7. Report and offer the next

A few lines: how many authored (with the rank range), how many blocked and
the feature blocking the most of them, anything built or fixed. Then offer the
next batch — don't start it unasked.
