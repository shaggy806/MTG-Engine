---
name: author-top-cards
description: Add the next batch of cards to the pool, going down the Commander-legal cards by EDHREC rank (most-played first) — recheck cards whose blockers have been built, pick the next untriaged ones by rank, build the engine feature that unblocks the most when one clearly leads, author every card the engine runs faithfully, record what blocks the rest, test, and ship the batch. Use when the user says to work on cards, author cards, do the next card batch, grow the pool, continue the card backlog, or runs this skill with no other instructions.
---

# Add the next card batch

The goal is **more real cards in the pool**, taken in EDHREC rank order
(most-played Commander cards first). One run = one batch, shipped. Nothing
else sets the order — not the precons' stand-ins, not the commander list —
though a card that happens to be one of those still counts.

**The tools, in the order a card uses them** (each prints what you'd
otherwise grep for — reach for them first):

- `npm run cards:needs -w engine -- --next 60` — the next 60 Commander-legal
  cards by EDHREC rank that are neither in the pool nor triaged.
- `npm run cards:needs -w engine -- --stale | --rank | --feature <key>` —
  what's been built since triage, what blocks the most triaged cards, one
  need's cards.
- `npm run card:brief -w engine -- "A" "B" …` — Oracle text and rulings, the
  card's triage records (each need flagged if built since), and per Oracle
  line the pool's closest authored abilities with their files. `--test`
  adds a test outline. Reads `dist/`: build first.
- `npm run card:vocab -w engine -- <term>` — whether the vocabulary can say
  something: usage with small example cards, declarations with docs, the
  guide's lines.
- `engine/src/test/harness.ts` — the shared test table.
- `npm run verify` — every check, the fuzzer with the batch's new cards in.

Edit files with the Edit tool (`game.ts` included — it keeps its CRLF and
NUL), not with scripts that rewrite text.

**Rule zero governs everything here** (`engine/src/cards/AUTHORING.md` §0):
never author a card the engine can't run *exactly* — no dropped clause, no
hardcoded number, no choice made for the player. A missing card costs
nothing; a wrong one lies at the table. When in doubt, it's blocked.

## 0. Orient (read, don't skim)

- `git status` clean enough to work on (the `sync-check` skill if on a
  different machine than last time). `npm run build -w engine`.
- `BACKLOG.md`, "Card backlog": the counts, the line marked **Next**,
  anything to merge first.
- `engine/src/cards/AUTHORING.md` §0-1 and §15 (what the engine can't
  express) if not already in context this session; §3-10 as each card needs.
- `engine/src/cards/neededCards-features.md`, "Open: the card backlog", for
  features already ranked.

If BACKLOG lists something to do *before* authoring (a branch to merge, a
broken build), do that first or tell the user.

## 1. Pick the batch

1. **`npm run cards:needs -w engine -- --stale`** first: cards whose recorded
   blockers have all been built since are the cheapest cards there are.
2. **`npm run cards:needs -w engine -- --next 60`**: the next untriaged cards
   by rank.
3. **`npm run cards:needs -w engine -- --rank`**: what blocks the most
   triaged cards. Every top-5000 card left is blocked by something, so
   building the leading feature is how the most-played cards get in.

For each candidate: `npm run card:brief -w engine -- "Name" …` (several names
per call). Sort into:

- **Authorable now** — every clause expressible with the existing
  vocabulary. The brief's analogs show how the pool already says each line;
  `card:vocab <term>` answers the rest (several "missing" mechanics have
  turned out to exist, unused). `npm run card:scaffold -w engine -- "Name" …`
  writes skeletons into `cards/scaffold/`; a card the parser reads whole goes
  to `cards/review/`.
- **Blocked** — name the missing feature with a key from the need vocabulary
  (`top-commanders-gaps.json`'s `features` or `engine/data/needs-vocabulary.json`'s;
  add a new one there, with its `family`, when none fits —
  `test/needs-vocabulary.test.ts` fails on an unknown key), with one line of
  why.

## 2. Build a feature, if one leads

If one missing feature blocks **five or more** cards of the batch, or leads
`cards:needs -- --rank` (the BACKLOG's **Next** line) and blocks at least
three of the batch, build it before authoring: engine change + its own test
file + the AUTHORING.md vocabulary entry, following `engine/CLAUDE.md`'s
rules (every decision is a dispatched action; `Game` is the only writer;
rules accuracy with rule numbers). Then author every card it unblocks —
`cards:needs -- --feature <key>` lists them, batch or not. A feature needing a
new player decision is also a client change — check it live in a 2- and a
4-player room (`dev-up`, `dev-down`) at ~768px tall. Otherwise, skip feature
work this run and note the leader for the next.

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

- `engine/src/test/top10000-batch-<N>.test.ts` (next N after the existing
  ones), written on `src/test/harness.ts` — `card:brief -- "Name" --test`
  prints an outline: one focused test per card whose behaviour is more than a
  stat line or a copy of a tested pattern — the clause most likely to be
  wrong. For a test that could pass by accident, break the card and watch it
  fail.
- `npm run card:text -w engine -- --offline` (no new MISSING/EXTRA lines from
  this batch).
- While authoring, run only the touched tests (`npx vitest run
  top10000-batch-<N> pool.test` from `engine/`).
- Then **`npm run verify`** (in the background): the build, typecheck (tests
  included), every suite, card:verify, both fuzzer table sizes, the
  fuzzer with every card the batch adds forced in, and the bot gate. It also
  re-marks the backlog lists and drops any sample-deck stand-in whose
  original is now in the pool.

## 5. Record

- The blocked cards: `engine/data/sweep-3/B<N>.json`, same shape as the
  others (`batch`, `status`, `ranks`, `authored: [{name, files, tested}]`,
  `blocked: [{name, needs, why}]`), so `--next` skips them from then on.
- A feature that landed: add its key to `top-commanders-gaps.json`'s `built`
  array (`cards:needs -- --stale` then flags every card that waited on it).
- `BACKLOG.md`: the implemented count, the next untriaged rank, and the
  **Next** line if the ranking of blockers changed; the batch's summary
  (authored headliners, what blocks the rest) goes in `docs/card-blockers.md`,
  not BACKLOG; `neededCards-features.md` if a feature landed or a new one now
  leads.
- A new player decision or a careful rules call: an entry in
  `docs/manual-checks.md` with its board in `client/src/builder/manualChecks.ts`.

## 6. Ship

Use the `ship` skill. Commit message in the history's style: `Cards: batch
<N> — <three or four headline cards> and <count> more` (or `Engine, Cards:
<the feature>, and <cards>` when one was built), the rank range, the cycles,
and any engine fix found on the way, each with why.

## 7. Report and offer the next

A few lines: how many authored (with the rank range), how many blocked and
the feature blocking the most of them, anything built or fixed. Then offer the
next batch — don't start it unasked.
