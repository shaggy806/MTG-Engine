# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**310 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
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

- **Fix the pre-§0 debt ASAP, ahead of the top 5000 (2026-09-28).** Some cards in the pool lose
  or misplay a printed clause. Give each its proper, faithful implementation, building whatever
  feature blocks it; don't just delete them. Left, each with what it needs: Iridescent
  Vinelasher (Offspring — 7 top-5000 cards), Starfield Vocalist (Warp — 10), Fanatic of Rhonas
  (Eternalize; Embalm is its sibling — 3), Chandra, Acolyte of Flame (casting a target card from
  a graveyard during resolution — 4, Torrential Gearhulk among them), Terror of the Peaks (a
  cast-time additional cost imposed by the target), Combat Thresher (Prototype) and Artificial
  Evolution (layer-3 text changing across a card's abilities, not just its type line; neither is
  in the top 5000). Each card's blocker is in `cards/AUTHORING.md` §15, "Known exceptions
  already in the pool"; `npm run card:text -w engine` is the live ledger. Fixed so far: Saw in
  Half, Finale of Devastation, Fireball, Mortivore, Will of the Sultai (and Rydia, earlier).
- **Unblocked by those fixes, for the next top-5000 batch:** the rest of the Will cycle (Jeskai
  #2169, Mardu #2236, Abzan #2579, Temur #4037 — `castModal.maxModesIf`), Strive (Twinflame
  #1260, Call the Coppercoats #1627 — `costPerExtraTarget`), and regeneration (Nightscape
  Familiar #1150, Asceticism #1329, Golgari Charm, Swarmyard, Golgari Grave-Troll, Snuff Out,
  Decree of Pain, … — about 20). Check each for anything else it needs.
- **Then (priority since 2026-09-26): the top 5000 cards, most-played first.**
  `top-commander-cards.txt` now lists the top 5000 by EDHREC rank (1,436 implemented). Work
  down its unmarked entries in rank order: author each card the engine runs faithfully, and
  build the engine features that block the most of the rest. `engine/data/sweep-2/K*.json`
  holds per-card blocker notes for the first 179 skipped; past those, nothing is triaged.
- **Next: creatures that enter tapped and attacking (measured 2026-09-26: 58 missing top-5000
  cards).** Adeline (#491), Hero of Bladehold, Anim Pakal, Mobilize (6), Myriad (10), Ninjutsu (17),
  Ilharg, Kaalia, Winota. The core is rule 508.4: a permanent put onto the battlefield attacking,
  never declared (no attack triggers), its controller choosing which defending player or
  planeswalker each one attacks — in Commander every opponent is a defending player (802.2), so
  that needs a new decision, and attacking tokens must not fold into a token stack (combat deals
  one object's damage). Combat already reads attackers off `GameObject.attacking`. Ninjutsu attacks
  whatever the returned creature was attacking (702.49c), so needs no choice.
- **Modal activated abilities with targeted modes** (Breya, Etherium Shaper; Koma, Cosmos
  Serpent; Umezawa's Jitte): modes chosen as it's activated (rule 700.2b), each with its targets —
  the triggered half is built. See `neededCards-features.md`, "Modal triggers with targeted
  modes", for the rest of that family's blockers.
- **Host-trigger cards, 34 left** (the equipped/enchanted-creature triggers are built): each is
  blocked by something shared with other cards — a static "is goaded", "return this card" after
  its host died, per-event "deals damage", per-mode targets on a modal trigger, free casts during
  resolution, tokens entering tapped and attacking, living weapon. See `neededCards-features.md`,
  "Host triggers".

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
  Then the "put into a graveyard from anywhere" trigger, "as this enters" on a non-cast
  permanent, and discard as an ability cost (regeneration is built, 2026-09-28). See `neededCards-features.md`, "The
  limitation ledger", and `cards/AUTHORING.md` §15.
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
- **Dividing among targets.** "Any number of target …" is built (the `any-number` group), and
  so are Fireball's "divided evenly" and Strive's cost per extra target (2026-09-28), but "N
  damage divided as you choose among" them (Fury, Magma Opus, Dragonlord Atarka) and "distribute
  N counters among" (Lathiel) aren't. See `neededCards-features.md`, "Unbounded targeting".
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **Amass grows the first Army creature.** Rule 701.47a lets the player choose, and a changeling
  is an Army too (Morophon beside Orcish Bowmasters' Army). The `choose-permanents` decision
  (built 2026-09-26 for "untap up to N lands") is the piece it needs. See AUTHORING §15, "Partial".
- **A token copy isn't asked its "as this enters" choice** (a token copy of Clone, Morophon or
  Urza's Incubator), though the gaps list marks `bug:as-enters-choices-any-entry` built. See
  AUTHORING §15.
- **`sacrifice-all-but` always keeps the most it may.** "Choose up to N, then sacrifice the rest"
  never lets the player keep fewer (to sacrifice more for death triggers). The `choose-permanents`
  decision could ask it.
- **Token stacks in combat.** Splitting one stack across attackers or blockers is not built,
  and neither is choosing which of a stack proliferate touches. See
  `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.
- **Kardur, Doomscourge forces attacks at players only.** The rulings say the affected creatures
  can attack planeswalkers too; the engine currently requires
  a player. Check the rulings before fixing. The requirement lives in the `attack-requirement`
  effect, `engine/src/combat/eligibility.ts` (~line 417).

## Bots

The plan of record is `docs/plans/bot-effect-knowledge.md`: keep v2, give it an effect-aware
base, retire v3. One line per step still open:

- **More training scenarios.** Every hand-built scenario the weights got wrong has since been
  fixed and moved into the gate (41 there, none left in training — `kind: "training"` in
  `bot/scenarios.ts`), so there is nothing to fit against. New ones come from live games: the
  in-game Capture button (`--capture`) saves a position to `captures/`, which `bot:scenarios`
  and `bot:fit-scenarios` read as training scenarios, as does each blunder `bot:behaviour`
  shows.

Beyond that plan:

- **Counterspells, beyond `answers`.** The reserve (`answers` 3) is a constant: the bot holds a
  Counterspell as firmly when every opponent's hand is empty as at full grip, and counters a
  Grizzly Bears (worth 4.6 to counter, largely `threat`). If live games show it holding one
  into a loss, or spending one on a small creature, capture the position: a reserve scaled by
  opponents' cards in hand is the obvious next shape.
- **Watch the wraths since `threat`.** With the threat term (2026-09-27) v2 casts more
  sweepers: in six four-player games, Cleansing Nova three times (at 33, 19 and 5 life) and
  Blasphemous Act over recasting its commander, and a turn-7 Magmaquake over Thunderbreak
  Regent. At low life that's right; at 33 it's a judgment call. The gate's "wraths when far
  behind" and "keeps its own winning board" hold. If a live game shows a wasted wrath, capture
  it: the scenario is what would say whether `threat` needs a cap or a sweeper needs pricing.
  Since `drawEngines` 4 (same day) Cleansing Nova's artifact-and-enchantment mode and removal
  go after opponents' draw engines too, and one edict took the bot's own commander (Emmara)
  over Mentor of the Meek, a judgment call worth capturing if it recurs.
- **Pumping an opponent's attacker: how often, now that it's ruled.** The user's rule
  (2026-09-27, `EvalBotController.opponentPump`): help an opponent's creature only while it
  attacks someone else, and then with help that ends at end of turn, on a creature goaded by
  us, or — lasting help — only when it kills the player attacked. Temporary pumps on someone
  else's attacker (Kessig Wolf Run, Unleash Fury) remain allowed and still cost mana the
  evaluation can't see (`untappedMana` is 0): if they come up too often in live games, capture
  one — the scenario says whether they need a price.
- **The rollout still can't see our own later spells — tried, level.** Pumps wait for combat
  and the upkeep's mana waits for the main phase (`wastedNow`, `holdsManaForMain`), but inside a
  main phase or combat the default rollout passes at every window, so v2 can't see what a spell
  it hasn't cast yet would have done with mana it spends now. The `"acting"` rollout policy
  (2026-09-28, `simulate.ts`) lets our own seat play the rest of its turn as v1, with ties
  against passing going to acting (without that the bot put its plays off — tested). It sees two
  Grizzly Bears over one Rumbling Baloth with four mana, but benched **level**: 26.0%
  [21.8, 30.6] against three default v2s over 400 four-player games (`bot:bench
  --candidate-options '{"rollout":"acting"}' --opponent shipped-2026-09-27c`), with 23 games
  timing out at 300 s. Opt-in, not the default. Worth another look only with a cheaper v1 in the
  rollout or a reason to expect a different result.
- **Big boards under count budgets.** Seed 50's turn 40 (73 permanents, `bot:replay --from`)
  takes 258 s (705 before 2026-09-27's fixes), and an ordinary four-player game's first 40
  turns 10.5 s (13.1 before the last two). Profiled after them, what's left is the engine's real
  work: state-based actions folding every permanent's characteristics each check
  (`stateBasedGraveyardMoves`, ~13%), the characteristics fold itself, and cloning states for
  the search (~9%). Tried and dropped, each measured at nothing: a per-region cache of condition
  answers (116 hits in 58,000 — a region lasts one event), deferring conditional trigger grants
  in the scan (under 2% once filters read types lazily), and a shared mana scan for casting
  (0.3% of an ordinary game). Live rooms stop at 300 ms, so this is the bench's time limit and a
  thinner search, not a hang.
- **A wider pool of bot decks (later — raised 2026-09-26).** A bot seat falls back to one of the
  five 2022 starter precons (`SAMPLE_DECKS`, via `server/src/decks.ts`), which the user finds too
  simple to play against. Add decks across a range of power levels for bots to bring. The same
  decks should widen the bench, which today measures every bot on those five midrange precons
  only — a result there isn't a result about the decks people bring. None of the five plays a
  counterspell, so `bot:diff` and the bench can't see the `answers` reserve at all. Unscoped: where the decks
  come from (curated lists, or built from the pool around a commander), how a host picks a power
  level, and how the bench samples them.

## Client / UI

- **Picking creatures out of a token stack (raised 2026-09-28).** Attacked by a stack of
  tokens, the user could visually block only one of them. The flow for choosing some number of
  a stack (blocking, and wherever else a stack's members are picked) needs work. A first idea,
  not settled: a small box with − / + buttons and a number field you can also type into.
- **Saga creatures' art at full height in the cast spotlight (raised 2026-09-28).** A Saga
  creature (Summon: Titan) shown at the center of the screen as it's cast displays the full
  height of its (tall, Saga-frame) art instead of the usual crop.
- **Show counters on card tiles (raised 2026-09-28).** A creature's counters have no visual on
  the board, only a line of text on hover. Check whether the mana font the client already uses
  has a symbol for each counter kind that a tile could show.
- **The lobby looks very different at two seats than at four (raised 2026-09-28).** Evaluate
  the visual disparity between a 2-player and a 4-player room lobby and decrease it. Also add a
  button to remove a seat (today a seat can be added — "Add seat" — but not taken away).
- **Audit how many ways a card is rendered (raised 2026-09-28).** Count the distinct card
  renderings across the client (`CardTile`, `MiniTile`, hand, stack, previews, pickers, …) and
  see whether they can reasonably be condensed into fewer.

- **Show regeneration shields on the card.** A permanent's shields (`GameObject
  .regenerationShields`) are public, but the view doesn't carry them and a tile shows nothing;
  only the log line says one was made. Add them to `VisibleObject` and a small badge beside
  the damage marker; check it live.

- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): 2.5 MB, 450 kB gzipped at 5,400 cards, and growing
  with the pool. They read only printed fields, each ability's text (colour identity) and the
  tokens a card makes. A generated catalog of just those, sharded the same way, would be a
  fraction of the size. The game page loads no definitions up front.

## Tooling / docs

- **Say which turn it is for whom (raised 2026-09-27).** A turn number counts every player's
  turns, so at a four-player table "turn 37" is the first player's 10th turn — which reads as a
  much longer game than it is. Talk about turns with that extra specificity. To be discussed
  before anything is built: where it applies and what form it takes.
- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
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
- **Audit the engine tests (raised 2026-09-27).** Go through the engine suite we've been running
  (430 files, 3,979 tests, about 100 s) and check what it actually guards. Unscoped: what the
  audit looks for and what it produces.
