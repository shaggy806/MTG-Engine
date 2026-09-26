# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**306 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Ready to author, no engine work: none left.** Every commander the gaps JSON marked
  ready was authored on 2026-09-24 (`test/commanders-ready-*.test.ts`). Each one left needs at
  least one feature; start from the greedy order below.
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The next
  ten, engine-only, with the commanders each fully unblocks:
  `zone:visibility-extensions` (+1), `zone:cast-cards-you-dont-own` (+3), `keyword:toxic` (+1),
  `cost:mana-spending-rules` (+3), `effect:amount-aggregate` (+1),
  `zone:cast-from-library-top` (+2), `zone:play-from-exile-with-counter` (+2),
  `trigger:discards-extensions` (+1), `effect:token-copy-options` (+1), `keyword:connive` (+2).
- **Most-needed features overall.** `zone:visibility-extensions` (13),
  `effect:copy-spell-extensions` (11) and `effect:copy-permanent-spell` (10). Live numbers come
  from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:may-sacrifice-then` (13), `decision:copy-new-targets` (12), `decision:choose-permanent`
  (11), `effect:enter-attacking` and `effect:cast-during-resolution` (10 each),
  `decision:free-cast-choices` (9), `effect:attach-extensions` and
  `effect:modal-ability-targeted-modes` (7 each).
- **Commanders authored and then dropped by their reviews.** Tifa Lockhart and Yarok need the
  player to order simultaneous triggers (`decision:trigger-order`). Aragorn, the Uniter needs
  scry to let the player order the kept cards (`decision:library-ordering`).

## Card backlog (top-5000 staples and the precons)

- **The current priority (2026-09-26): the top 5000 cards, most-played first.**
  `top-commander-cards.txt` now lists the top 5000 by EDHREC rank (1,316 implemented). Work
  down its unmarked entries in rank order: author each card the engine runs faithfully, and
  build the engine features that block the most of the rest. `engine/data/sweep-2/K*.json`
  holds per-card blocker notes for the first 179 skipped; past those, nothing is triaged.

- **EDH-popularity feature tiers.** Tier 2 is Spree and Class. Tier 3 is Discover, Evoke and
  Reconfigure. Also open:
  damage doubling as a replacement, the rest of the Overload/free-cast/convoke families, and the
  items listed under each "still open". See `neededCards-features.md`, "Open: the card backlog".
- **More Oracle-parser templates.** Every card the parser reads whole is in the pool: 4,205 of
  them, each reviewed against its Oracle text, rulings and tokens (card sweep 3, 2026-09-25).
  `npm run card:scaffold -w engine -- --report --all` now finds none left: 26,469
  Commander-legal cards remain, each with a line the parser can't read. It reads the cost or
  trigger of 16,853 of their abilities and the effect of 22% of those. The unread lines that
  recur most are the next templates: an ability's "Choose one —" (266), Crew (180),
  "Regenerate ~" (151), "You may pay {…}" (142), "Transform ~" (138). Add one, keep
  `npm run card:parse-check -w engine` at zero disagreements, then `--auto-scan --all` writes
  what it unlocks to `review/` for checking.
- **Card sweep 2 (2026-09-25).** Five cloud batches triaged the 189 best-ranked unimplemented
  top-500 commanders (C1–C3) and the 208 best-ranked unimplemented top-2000 cards (K1–K2). Those
  208 include most of card sweep 1's 227 skips. They authored 36 cards and recorded 361 as
  blocked, each with its missing features, in `engine/data/sweep-2/*.json`. The keys are those of
  `top-commanders-gaps.json`, or `new:*` described in the file.
  - The most-needed features: `decision:copy-new-targets` (16), `effect:copy-exceptions` (14),
    `effect:may-sacrifice-then` (12), `effect:cast-during-resolution` and
    `condition:filter-card-property-clauses` (11 each), `effect:attach-extensions`,
    `effect:add-mana-extensions` and `bug:as-enters-choices-any-entry` (10 each).
  - The rest of the backlog is untriaged: 62 commanders and 1,006 cards, the lists' unmarked
    entries past those batches. The scaffolder can't finish any of them on its own.
- **The limitation ledger.** Protection from a filter (19 cards) is the largest remaining gap.
  Then regeneration, the "put into a graveyard from anywhere" trigger, "as this enters" on a
  non-cast permanent, and discard as an ability cost. See `neededCards-features.md`, "The
  limitation ledger", and `cards/AUTHORING.md` §15.
- **Pre-§0 debt.** Some cards in the pool lose or misplay a printed clause. Fix or delete each
  one. See `cards/AUTHORING.md` §15, "Known exceptions already in the pool", and
  `npm run card:text -w engine`.
- **The original deck lists.** `engine/src/cards/neededCards.txt` holds the first two decks
  the pool was built for (Ureni's Temur dragons, Korvold and Lord Windgrace's lands) and some
  one-off requests. 48 of its cards are still missing, and 7 of those aren't in the top-5000
  list, so nothing else tracks them. Their `FEATURE:` notes date from the P0–P20 passes, so
  re-check each one against the engine before building for it.
- **Precon stand-ins.** 42 cards in the five starter decks still play as substitutes. The
  engine plan for them is paused. See `docs/plans/precon-decks.md` (the substitution list) and
  `docs/plans/engine-gaps.md`. Deleting a substitution is the whole revert.

## Engine rules gaps

- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring (Lord of the Nazgûl's
  "protection from Ring-bearers" is authored as inert on the strength of this: revisit it when
  the Ring lands), banding, Companion,
  snow *sources* (snow mana is generic), and full text-change beyond one creature-type word.
  ROADMAP's Phase 10 deferred these as large or niche. None of them blocks ordinary Commander
  play. The alt-cast long tail left by Phase 6 (retrace, Warp, Bestow, Prototype, …) is in
  AUTHORING §15 and the limitation ledger.
- **Labelled abilities the engine can't run.** Card sweep 3 found these dash labels, each of
  which changes how its line works. The scaffolder leaves them to author:
  - Power-up is built, and 21 of its 37 cards are authored. Blocked: Hulk, Gamma Goliath and
    Wonder Man (effects on other power-up abilities), Kang the Conqueror (no power-up during
    its extra turn), Thanos, the Mad Titan (an odd-or-even choice), Iron Fist (divided damage),
    Loki Laufeyson (a copy's new targets), Nick Fury (transforming a card it finds),
    Quicksilver (starting in play), Immortus, Donald Blake (a creature-type change that sets
    no P/T) and White Tiger (the Tiger God's blocking restriction). Not yet checked: Black
    Panther, Most Dangerous, Human Torch, Jack of Hearts, Shang-Chi and Stature.
  - Max speed (34): needs `mechanic:speed`.
  - A Case's To solve and Solved (13 each).
  - Forecast (11).
  - Companion (10).
  Exhaust and Boast are read, as the ability flags the engine already has.
- **Replacement ordering.** There is no `choose-replacement-order` (rule 616.1) and no damage
  redirection to a third object.
- **Static-effect dependency ordering** (rule 613.8) is not implemented. Statics apply in
  timestamp order only.
- **The rest of leaving the game** (rule 800.4). 800.4a is modeled (`leaveGame`), and so is
  800.4m (a duration tied to a departed player's next turn lasts until it would have begun).
  Not yet: a decision a departed player would have made (800.4g–h: another player makes it),
  and an effect ending that hands a permanent back to a departed default controller (800.4c:
  it's exiled instead).
- **Unbounded targeting** ("any number of target …") is deliberately not built. The reasons,
  and when to revisit, are in `neededCards-features.md`, "Unbounded targeting". Re-measured
  against the top 5000 (2026-09-26): 36 cards, up from 9 in the top 2000 — past the revisit line.
- **Frantic Search targets its lands.** "Untap up to three lands" doesn't target, but the card
  is authored as three optional target slots: the lands are picked as it's cast, a hexproof
  land can't be picked, and three chosen lands all leaving in response fizzle the whole spell
  (no draw). Needs a choice made on resolution — the same `decision:choose-permanent` Amass
  and `sacrifice-all-but` want — which also unblocks Snap, Peregrine Drake, Rewind, Unwind and
  Cloud of Faeries.
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **Amass grows the first Army creature.** Rule 701.47a lets the player choose, and a changeling
  is an Army too (Morophon beside Orcish Bowmasters' Army). Needs `decision:choose-permanent`,
  which is UI-bound. See AUTHORING §15, "Partial".
- **A token copy isn't asked its "as this enters" choice** (a token copy of Clone, Morophon or
  Urza's Incubator), though the gaps list marks `bug:as-enters-choices-any-entry` built. See
  AUTHORING §15.
- **`sacrifice-all-but` always keeps the most it may.** "Choose up to N, then sacrifice the rest"
  never lets the player keep fewer (to sacrifice more for death triggers).
- **Token stacks in combat.** Splitting one stack across attackers or blockers is not built,
  and neither is choosing which of a stack proliferate touches. See
  `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.

## Bots

- **v3 is built but not seated.** Its evaluation hasn't been re-fitted for a search that
  actually casts things, and it benches six points behind v2 at four players. The
  "Sequencing" steps from "Re-run `bot:audit`" onward are still outstanding. See
  `docs/plans/bot-v3-search.md`. Nothing live runs it, and it hasn't changed since
  2026-09-19, so decide: re-fit it, or retire it. Retiring means `bot/plan.ts`,
  `plan-bot.ts` and `determinize.ts`, `test/bot-plan.test.ts`, the `bot:plan`, `bot:census` and
  `bot:rollout-cost` scripts, `BOT_PLAN_BUDGET_MS` in `server/src/room.ts`, and the `v3` paths
  in the scenario, harvest and tune workers and in `room-pacing.test.ts`.
- **v2's Phase 7 feature list is superseded.** Don't build it. See `docs/plans/smarter-bots.md`.

## Client / UI

- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Goaded and suspected aren't shown.** A goaded or suspected creature looks like any other;
  only the menace and can't-block that suspect gives appear. Both are designations the view could
  carry as a badge.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Player designations as a viewable zone.** Emblems are listed as text lines under the
  player panel today. Give them (and, once modeled, the Ring and the Initiative/dungeon) a zone
  button on the player banner that opens a viewer, the way graveyard and exile do. The monarch
  keeps its 👑 beside the player's name (`PlayerPanel`'s `pp-monarch`, checked in 2- and
  4-player rooms).
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): 2.5 MB, 450 kB gzipped at 5,400 cards, and growing
  with the pool. They read only printed fields, each ability's text (colour identity) and the
  tokens a card makes. A generated catalog of just those, sharded the same way, would be a
  fraction of the size. The game page loads no definitions up front.

## Tooling / docs

- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
- **In dev, the library and the deck builder load every card as its own module.** Vite's dev
  server doesn't bundle, so their 32 card shards arrive as ~5,600 requests and take 20-40 s to
  open. The game and the lobby touch no card module. Emitting each shard as one bundled file in
  the engine's build would fix it.
- **CI's fuzzer reaches three quarters of the pool.** CI's 38 fixed seeds put 3,904 of the
  5,369 deckable cards in some deck. The other quarter is never fuzzed in CI, only locally,
  where 150 two-player seeds reach all but 46. Either raise CI's game counts (about 60
  two-player seeds for 87%, roughly double the fuzz time), or start each run at a different
  seed so that successive runs sweep the whole pool.

## Code health

- **Two ways to name a deck's commanders.** `DeckList` and `WireDeck` carry a lone
  `commander` beside `commanders`, and `commandersOf` reads either. `WireDeck`'s doc calls the
  lone field a shim for clients from before Partner pairs, but `SAMPLE_DECKS`, the server's
  `SEATS` and `PendingRoom`'s fallback deck still use it, as do ten test files. Move them all
  onto `commanders`, then drop the lone field.
- **Saved-deck migrations.** `client/src/deck-builder/decks.ts` rewrites two old shapes every
  time it reads saved decks: a lone `commander` (from before Partner pairs) and Princess Sarah's
  old name (renamed on 2026-09-16). Neither rewrite is saved, so an old deck needs them until
  it's next edited. Write each migrated deck back once, then drop both.
- **Vocabulary built ahead of any card.** About twenty effect, trigger, condition, filter and
  replacement pieces, plus a few dozen optional fields, have no card using them yet, and five
  have no test either. Keep them for the cards they were built for, but review the first card
  that uses each. The list is in `neededCards-features.md`, "Built ahead". `painIfUntapped` is
  the one no real card can use.
- **Prohibition scans are quadratic.** `abilitiesProhibited`/`prohibitionsOn` rescan the whole
  battlefield on every call, per permanent, and `recomputeControl` rescans for control Auras per
  permanent once anything has a control effect. On a land-heavy board they were 31% of a
  profile, and turns slow down steadily. Not a hang, and the fuzzer's decks don't hit it.
- **Small known slips.** Geode Rager targets an opponent where its text says "target player".
  `effects.ts` cites Encore as 702.140 (it's 702.141). Rin and Seri's and Urtet's `otherOnly`
  flags are redundant now, and their comments out of date. `TriggerWho` `"opponent"` is always
  false on a trigger about an object (no pool card uses it). `card:parse-check` reports four
  keyword disagreements (Harvesttide Assailant and Infiltrator, Sokka, Stonecoil Serpent).
