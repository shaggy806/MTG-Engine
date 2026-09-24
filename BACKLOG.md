# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**108 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The first
  ten, engine-only, with the commanders each fully unblocks:
  `stat:per-ability-turn-counters` (+1), `mechanic:player-counters` (+3),
  `cost:ability-cost-modification` (+1), `condition:filter-dynamic-compare` (+1),
  `effect:amount-aggregate` (+1), `effect:target-other-than-source` (+3),
  `effect:add-subtype` (+2), `trigger:combat-trigger-extensions` (+3),
  `trigger:sacrifice-filter` (+1), `effect:amount-new-variants` (+1).
- **Most-needed features overall.** `static:affect-scope-by-filter` (22),
  `effect:target-other-than-source` (19), `effect:player-scope-extensions` and
  `effect:this-way-results` (18 each), `condition:filter-dynamic-compare` (17; what's left is an
  "N plus an amount" operand), `static:grant-to-cards-outside-battlefield` (14). Live numbers
  come from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `decision:ward-payment` (18), `effect:may-sacrifice-then` (13), `decision:copy-new-targets` (12),
  `decision:choose-permanent` (11), `effect:enter-attacking`, `decision:free-cast-choices`,
  `effect:attach-extensions`, `effect:cast-during-resolution`, `decision:choose-tap-costs` (10 each).
- **Commanders authored and then dropped by their reviews.** Tifa Lockhart and Yarok need the
  player to order simultaneous triggers (`decision:trigger-order`). Aragorn, the Uniter needs
  scry to let the player order the kept cards (`decision:library-ordering`). Kilo needs
  `decision:choose-tap-costs`; a fixed-count tap cost is a player choice now, so re-check Kilo
  first.

## Card backlog (top-2000 staples and the precons)

- **EDH-popularity feature tiers.** Tier 2 is Spree, Class, Changeling, Magecraft and a
  "defending player" scope. Tier 3 is Station, Discover, Evoke and Reconfigure. Also open:
  damage doubling as a replacement, the rest of the Overload/free-cast/convoke families, and the
  items listed under each "still open". See `neededCards-features.md`, "Open: the card backlog".
- **The limitation ledger.** Protection from a filter (19 cards) is the largest remaining gap.
  Then regeneration, the "put into a graveyard from anywhere" trigger, "as this enters" on a
  non-cast permanent, and discard as an ability cost. See `neededCards-features.md`, "The
  limitation ledger", and `cards/AUTHORING.md` §15.
- **Pre-§0 debt.** Some cards in the pool lose or misplay a printed clause. Fix or delete each
  one. See `cards/AUTHORING.md` §15, "Known exceptions already in the pool", and
  `npm run card:text -w engine`.
- **Precon stand-ins.** 43 cards in the five starter decks still play as substitutes. The
  engine plan for them is paused. See `docs/plans/precon-decks.md` (the substitution list) and
  `docs/plans/engine-gaps.md`. Deleting a substitution is the whole revert.

## Engine rules gaps

- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring, banding, Companion,
  snow *sources* (snow mana is generic), and full text-change beyond one creature-type word.
  ROADMAP's Phase 10 deferred these as large or niche. None of them blocks ordinary Commander
  play. The alt-cast long tail left by Phase 6 (retrace, Warp, Bestow, Prototype, …) is in
  AUTHORING §15 and the limitation ledger.
- **Replacement ordering.** There is no `choose-replacement-order` (rule 616.1) and no damage
  redirection to a third object. When a commander with a finality counter dies, it is exiled
  first and then its owner gets the 903.9a choice; that result is sane, but nobody chose the order.
- **Static-effect dependency ordering** (rule 613.8) is not implemented. Statics apply in
  timestamp order only.
- **Legend rule.** The oldest permanent survives. The player gets no choice.
- **Unbounded targeting** ("any number of target …") is deliberately not built. The reasons,
  and when to revisit, are in `neededCards-features.md`, "Unbounded targeting".
- **Zone-change identity** (rule 400.7). A delayed trigger still follows a card that left and
  came back: a creature returned by Whip of Erebos, then flickered, is still exiled at end step.
  Likewise an effect naming "it" or a target acts on the new object, and a permanent that left,
  came back and left again before an ability referring to its first departure resolved has
  only the second departure's last-known information (the first is read as the card now is).
  Tracked as `bug:zone-change-object-identity`.
- **Entering together.** Permanents put onto the battlefield by one instruction still enter
  one at a time, so a "whenever another creature enters" ability among them misses the ones
  that entered before it (the Elas il-Kor ruling). Leaving together is one event already.
  Tracked as `bug:simultaneous-zone-moves`.
- **Triggered abilities never announce their targets.** Nothing sees an `object-targeted` event
  for them, so Thunderbreak Regent's "spell or ability" misses a triggered ability. The
  spell-only cards (Gargos, Tectonic Giant) are unaffected.
- **Free casts skip cost increases.** `castCardWithoutPaying` (cascade, suspend) ignores
  Thalia and Hinata. Rule 601.2f says those still apply.
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **Token stacks in combat.** Splitting one stack across attackers or blockers is not built,
  and neither is choosing which of a stack proliferate touches. See
  `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.
- **Missing log event.** A spell exiled by a graveyard permission's `exileAfterwards` (Kess), or
  by flashback, emits no `graveyard-replaced-with-exile` event. Only the log is affected.

## Bots

- **v3 is built but not seated.** Its evaluation hasn't been re-fitted for a search that
  actually casts things, and it benches six points behind v2 at four players. The
  "Sequencing" steps from "Re-run `bot:audit`" onward are still outstanding. See
  `docs/plans/bot-v3-search.md`.
- **v2's Phase 7 feature list is superseded.** Don't build it. See `docs/plans/smarter-bots.md`.

## Client / UI

- **Card tiles are tinted by mana cost.** A costless card (a token, a DFC back face, Ancestral
  Vision) renders colourless, although the view sends each object's `colors`.
- **The target count is ignored.** `client/src/App.tsx` doesn't read `LegalAction.targetCount`,
  the affordable range under Hinata-style per-target costs. A player who picks an unaffordable
  number of targets gets the server's rejection banner.
- **Reduced costs display wrong.** `displayCostOf` rewrites only the generic number, so a
  coloured-pip or twobrid reduction isn't shown.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.

## Tooling / docs

- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
