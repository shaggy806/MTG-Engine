# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**259 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Ready to author, no engine work: none left.** Every commander the gaps JSON marked
  ready was authored on 2026-09-24 (`test/commanders-ready-*.test.ts`). Each one left needs at
  least one feature; start from the greedy order below.
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The first
  ten, engine-only, with the commanders each fully unblocks:
  `bug:as-enters-choices-any-entry` (+2), `keyword:changeling` (+1),
  `condition:filter-card-property-clauses` (+2), `effect:create-token-with-counters` (+1),
  `mechanic:goad-extensions` (+3), `effect:target-spec-additions` (+1), `mechanic:suspect` (+1),
  `effect:mana-ability-dynamic-amount` (+2), `stat:spells-cast-this-turn-record` (+2),
  `effect:amount-fields-dynamic` (+2).
- **Most-needed features overall.** `zone:visibility-extensions` (13),
  `effect:copy-spell-extensions`, `effect:copy-exceptions` and
  `condition:filter-card-property-clauses` (11 each). Live numbers come from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:may-sacrifice-then` (13), `decision:copy-new-targets` (12), `decision:choose-permanent`
  (11), `effect:enter-attacking`, `effect:attach-extensions`, `effect:cast-during-resolution`
  (10 each), `decision:free-cast-choices` (9), `decision:choose-tap-costs` (7).
- **Commanders authored and then dropped by their reviews.** Tifa Lockhart and Yarok need the
  player to order simultaneous triggers (`decision:trigger-order`). Aragorn, the Uniter needs
  scry to let the player order the kept cards (`decision:library-ordering`).

## Card backlog (top-2000 staples and the precons)

- **EDH-popularity feature tiers.** Tier 2 is Spree, Class and Changeling. Tier 3 is Station,
  Discover, Evoke and Reconfigure. Also open:
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
- **Rydia, Summoner of Mist is missing its Summon ability** ("{X}, {T}: Return target Saga card
  with mana value X from your graveyard to the battlefield with a finality counter on it. It
  gains haste until end of turn."). Both reasons its file gives for dropping it are gone now
  (`card-in-graveyard` targets, finality counters), but a target filter on "mana value X"
  still needs checking.
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
  one-off requests. 48 of its cards are still missing, and 23 of those aren't in the top-2000
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
  - Power-up (37 cards): once only, and cheaper by the card's mana cost the turn it entered.
    It is small: a flag beside `exhaust` plus that cost reduction.
  - Max speed (34): needs `mechanic:speed`.
  - A Case's To solve and Solved (13 each).
  - Forecast (11).
  - Companion (10).
  Exhaust and Boast are read, as the ability flags the engine already has.
- **Replacement ordering.** There is no `choose-replacement-order` (rule 616.1) and no damage
  redirection to a third object. When a commander with a finality counter dies, it is exiled
  first and then its owner gets the 903.9a choice; that result is sane, but nobody chose the order.
- **Static-effect dependency ordering** (rule 613.8) is not implemented. Statics apply in
  timestamp order only.
- **Legend rule.** The oldest permanent survives. The player gets no choice.
- **Unbounded targeting** ("any number of target …") is deliberately not built. The reasons,
  and when to revisit, are in `neededCards-features.md`, "Unbounded targeting".
- **Zone-change identity** (rule 400.7). A spell's or ability's targets and source, and a
  delayed trigger's source, are now checked as the objects they were (`targetStints`,
  `sourceZoneChangeCount`, `DelayedTrigger.sourceStint` — `bug:zone-change-object-identity`,
  built). Two pieces are left. A delayed trigger's *carried targets* aren't checked: a
  creature returned by Whip of Erebos, then flickered, is still exiled at end step as a new
  object. And a permanent that left, came back and left again before an ability referring to
  its first departure resolved has only the second departure's last-known information (the
  first is read as the card now is).
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **An Aura entering other than as a spell** is attached to nothing. Only a resolving Aura
  spell attaches (`resolveTopObject`); one reanimated, returned by a flicker or put onto the
  battlefield from a library or hand floats unattached for good. Rule 303.4f has its
  controller choose what it enchants as it enters (303.4g: with nothing to choose, it stays
  where it was), and the SBA sweep (`stateBasedGraveyardMoves`) skips an Aura attached to
  nothing, where rule 704.5m puts it into the graveyard. The choice is UI-bound; fixing the
  sweep alone would only trade a floating Aura for a lost one. It keeps Rise to Glory out of
  the pool: the scaffolder leaves a "return target Aura card" to a person.
- **Token stacks in combat.** Splitting one stack across attackers or blockers is not built,
  and neither is choosing which of a stack proliferate touches. See
  `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.

- **Engine bugs card sweep 2 found** (repros in `engine/data/sweep-2/*.json`, `bugs`):
  - A commander its owner sends to the command zone never dies, so its own dies trigger is lost
    (Child of Alara).
  - Performance: a per-creature enters trigger watching an opponent's token stack
    (Authority of the Consuls against Scute Swarm) puts hundreds of triggers on the stack. They
    are right by the rules: a stack of N tokens entering is N creatures entering, and "gain 1
    life" can't be scaled to one "gain N" (a "whenever you gain life" trigger would fire once,
    not N times), so `isCountScalableEffect` rightly refuses it and `queueTrigger` makes one
    trigger per token, up to 1,000. A faithful fix needs a stack object that stands for N
    identical triggers and resolves one at a time, with priority between each, which a Stifle
    splits one off of, as a token stack does. Otherwise it's only slow.

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
- **Poison is invisible to the evaluation.** `bot/features.ts` reads energy but not
  `PlayerState.counters`, so a bot sees nothing coming until ten poison counters end the game,
  and proliferate's search candidates ("mine", "everything", "nothing") never single out an
  opponent's poison. The default proliferate answer (`ownedProliferateTargets`) does.

## Client / UI

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
