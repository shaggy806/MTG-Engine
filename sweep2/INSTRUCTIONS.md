# Card sweep 2 — instructions for one batch

You are one of several cloud agents in an overnight **card sweep**. Your prompt names your
batch id (C1–C4 are top-500 commanders, K1–K13 are top-2000 Commander staples). The goal is
to measure how many real cards the engine supports **in its current state**:

- author every card in your batch that the engine can already run faithfully, and
- for every card it can't, record exactly what is missing.

Both halves matter equally. A well-recorded skip is as valuable as an authored card. Don't
stretch to author something the engine can't really do.

## Setup

1. The SessionStart hook installs dependencies and builds engine, protocol and server.
2. Read `CLAUDE.md` (the architecture map). Then read `engine/src/cards/AUTHORING.md`:
   §0 (faithful, or not at all), §1 (quick start and the scaffolder), §15 (current
   limitations) and §16 (testing) in full. Use the rest (effects §6, targets §7, activated
   §8, triggered §9, static §10, multi-face §12) as the vocabulary reference, and grep it
   whenever you're unsure.
3. Your batch's card names are in `sweep2/batches.json` on this data branch. Read it without
   merging:
   `git fetch origin claude/sweep2-input && git show FETCH_HEAD:sweep2/batches.json > /tmp/batches.json`
4. **`git fetch origin main` first.** The sandbox's copy of `origin/main` can be a day
   stale, without the scaffolder or hundreds of recent cards. Then branch
   **`claude/sweep2-<batch>`** (e.g. `claude/sweep2-K3`) from that fresh `origin/main`,
   **not** from the data branch. If `engine/scripts/card-scaffold.mjs` doesn't exist, you're
   on a stale base: fetch again. Push to your branch as you go. Never push to `main`.

## The tools

- The Oracle snapshot (`engine/data/oracle/cards.jsonl`) holds every Commander-legal card
  with its rulings. It works offline; this sandbox can't reach api.scryfall.com, so don't run
  `card:verify` / `card:text`, which call Scryfall. The integrator runs those locally.
- `npm run card:lookup -w engine -- "Name"` prints the Oracle text, cost, types, P/T, faces,
  the tokens it makes, and its rulings.
- **Scaffold the whole batch up front** (one build, one run):
  `npm run build -w engine && (cd engine && node scripts/card-scaffold.mjs "Name 1" "Name 2" …)`
  - Each card gets a file in `engine/src/cards/scaffold/`. Its stat block, text, keywords,
    tokens and rulings are filled in. Whatever of the rules text the parser could read is
    filled in too, and each line it couldn't is a `// TODO(scaffold):` comment.
  - A card whose every line was read is written, finished, to `engine/src/cards/review/`
    instead.
  - Neither folder is registered.
  - The scaffolder's reading is checked against the whole pool with zero disagreements, but
    it can still misread a new card. **Check every line of what it filled in against the
    Oracle text and rulings, review/ cards included.**
- Existing cards in `engine/src/cards/pool/` are your best reference. Grep them for any
  similar clause before deciding something can't be done.

## Per card

1. Read its scaffold (or review/) file, its Oracle text and **its rulings**. Rulings often
   decide whether the engine's version is faithful.
2. Decide whether the engine can run **every** printed clause faithfully with its existing
   vocabulary:
   - `EffectSpec` in `effects.ts`;
   - the triggers and costs in `abilities.ts`;
   - `StaticAbility` and `replacements.ts`;
   - `CardFilter` in `filter.ts`;
   - `TargetSpec` in `target.ts`;
   - the alternative-cast fields on `CardDefinition` in `cards/define.ts`.
   Look at similar pool cards first.
3. **If it can:**
   - Author it: fill in every TODO, delete the SCAFFOLD/REVIEW header and every TODO line,
     and keep the rulings you relied on as short comments where they explain a choice.
   - Move the file into `engine/src/cards/pool/`. A new token goes into
     `engine/src/cards/tokens/`, but first grep `tokens/` for an existing token with the same
     characteristics; the scaffolder matches most, and two batches making the same token
     collide.
   - Run `npm run gen:cards -w engine`.
4. **If it can't,** add it to your results file (below) with what's missing. Don't author it,
   and don't leave its scaffold file in any commit.

### What counts as faithful

- **No** dropped or approximated clause, and no clause faked with the imperative `resolve`
  hatch. Don't author a card that relies on a mechanic §15 lists as not modeled: phasing,
  dungeons/Initiative/the Ring, banding, Companion, Battles, and so on. Also out: cards whose
  layout the scaffolder flags as not modeled (split, aftermath, flip, meld, class, leveler).
- Targets vs. choices matter:
  - "Target" is a target (`targets`), chosen as the spell or ability goes on the stack.
  - "Choose"/"a card" is picked on resolution.
  - "Return target card from your graveyard" is a `card-in-graveyard` target with
    `return-to-hand`, **not** `return-from-graveyard` (see AUTHORING's `return-from-graveyard`
    row).
- "You may X. If you do, Y" needs Y to happen only if X did. Check that the vocabulary
  really gates it (e.g. `sacrifice-source`'s `then`, `may` with a cost, the `this-way`
  condition), rather than doing Y regardless.
- "Up to one" is an optional target, "another" is an `other` target, and "for each" is a
  counted amount. Read the vocabulary rather than guessing.
- **Keywords the engine models are in `Keyword` (`cards/define.ts`).** A keyword not in that
  union isn't modeled.

## Engine source is off-limits

Do **not** edit anything under `engine/src/` outside `cards/pool/`, `cards/tokens/`,
`cards/generated.ts` (regenerated by `gen:cards`) and your own new test file. Also leave
these alone:

- `helpers.ts`
- `random-demo.mjs` (the fuzzer builds its decks from the whole pool now)
- the `top-*.txt` and `top-commanders-gaps.json` files
- `BACKLOG.md`, `neededCards-features.md`, `AUTHORING.md` and `CLAUDE.md`

Several batches run at once and the integrator merges them; engine edits would collide. If
the engine is missing a piece, or has a bug, **record it**; don't fix it.

## Tests

- Put every test in **one file per batch**: `engine/src/test/sweep2-<batch>.test.ts`.
  Model it on `engine/src/test/commanders-ready-4.test.ts` (its `setUp`, `spawn`,
  `activate` and `quiet` helpers).
- Give every authored card a test **unless** it's pure data: a vanilla or keyword-only
  creature, or a land that only enters tapped and taps for mana. The test drives the card
  through real play (cast, activate, trigger, combat) and asserts the printed outcome.
- A test must be able to fail. For any card with a non-obvious clause, briefly break the card
  (or delete the clause) and confirm the test fails, then restore it.
- While working, run just your file plus the pool guard:
  `(cd engine && npx vitest run sweep2-<batch> pool.test)`.
- **Fuzz each card with abilities:**
  `npm run build -w engine && node engine/scripts/random-demo.mjs --games 6 --with "Name"`.
  That puts the card in every seat's deck. If `legalActions` ever offers something
  `dispatch` refuses, it crashes naming the seed. A crash means the card, or the engine
  behind it, doesn't work: either fix the card, or skip it and record the bug.

## Results file

Keep **`engine/data/sweep-2/<batch>.json`** up to date as you go, and commit it with your
cards:

```json
{
  "batch": "K3",
  "status": "in-progress",
  "authored": [
    { "name": "Card Name", "files": ["engine/src/cards/pool/card-name.ts"], "tested": true }
  ],
  "blocked": [
    {
      "name": "Other Card",
      "needs": ["effect:copy-spell-extensions", "new:choose-a-player"],
      "why": "One sentence: the clause the engine can't run, and what it lacks."
    }
  ],
  "newFeatures": {
    "new:choose-a-player": "What's missing, described generally enough to cover every card that lists it."
  },
  "bugs": [
    { "card": "Name", "what": "an engine bug you hit, with the seed or a minimal repro" }
  ],
  "unprocessed": []
}
```

- `status` is `"in-progress"` while you work, then `"complete"`. If you must stop before the
  end, use `"partial"` and list what you didn't reach in `unprocessed`.
- For `needs`, **reuse the feature keys in `engine/src/cards/top-commanders-gaps.json`**
  (`features`, less anything in its `built` array) whenever one fits. Only when none fits,
  coin a `new:<kebab-case>` key named for the **capability**, not the card, describe it once
  in `newFeatures`, and reuse it for every card that needs it. Good keys are what turn this
  sweep into a ranked build order, so spend a moment on them.
- For commanders, `top-commanders-gaps.json`'s `commanders` entry has an earlier triage of
  what each one needs. Treat it as a hint only: features have landed since, so check against
  today's engine.

## Committing

- Commit in logical groups of about 10–20 cards. Push after every commit:
  `git push -u origin claude/sweep2-<batch>`.
- A title like `Cards: 14 top-2000 staples (sweep 2, K3, part 2)`, and a body listing the
  cards.
- Stage only `engine/src/cards/pool/`, `engine/src/cards/tokens/`,
  `engine/src/cards/generated.ts`, your test file and your results file. **Never commit
  anything under `engine/src/cards/scaffold/` or `engine/src/cards/review/`.**

## Before you finish

1. `npm test -w engine` (the whole engine suite) and `npm run typecheck -w engine`, both
   clean.
2. `npm run build -w engine && node engine/scripts/random-demo.mjs --games 40` and
   `--games 8 --players 4`, both clean.
3. **Adversarial self-review.** Spawn one Task subagent. Give it the list of cards you
   authored and tell it to try to *refute* each one: compare each file line by line with
   `npm run card:lookup -w engine -- "Name"` (Oracle text and rulings) and report every
   clause that's missing, wrong or approximated. Fix what it finds, or move the card to
   `blocked`.
4. Set `status` to `"complete"`, commit and push. Your final message should give the
   authored/blocked counts and the top few `needs` keys by count.
