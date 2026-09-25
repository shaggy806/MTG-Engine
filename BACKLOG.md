# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**249 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
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
  `condition:filter-card-property-clauses` (+2), `mechanic:goad-extensions` (+3),
  `effect:target-spec-additions` (+1), `mechanic:suspect` (+1),
  `stat:spells-cast-this-turn-record` (+2), `effect:amount-fields-dynamic` (+2),
  `effect:look-and-choose-second-pick` (+1), `effect:control-change-extensions` (+2).
- **Most-needed features overall.** `zone:visibility-extensions` (13),
  `effect:copy-spell-extensions`, `effect:copy-exceptions` and
  `condition:filter-card-property-clauses` (11 each). Live numbers come from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:may-sacrifice-then` (13), `decision:copy-new-targets` (12), `decision:choose-permanent`
  (11), `effect:enter-attacking`, `decision:free-cast-choices`, `effect:attach-extensions`,
  `effect:cast-during-resolution` (10 each), `decision:choose-tap-costs` (9).
- **Commanders authored and then dropped by their reviews.** Tifa Lockhart and Yarok need the
  player to order simultaneous triggers (`decision:trigger-order`). Aragorn, the Uniter needs
  scry to let the player order the kept cards (`decision:library-ordering`).

## Card backlog (top-2000 staples and the precons)

- **EDH-popularity feature tiers.** Tier 2 is Spree, Class, Changeling, Magecraft and a
  "defending player" scope. Tier 3 is Station, Discover, Evoke and Reconfigure. Also open:
  damage doubling as a replacement, the rest of the Overload/free-cast/convoke families, and the
  items listed under each "still open". See `neededCards-features.md`, "Open: the card backlog".
- **Cards waiting in `engine/src/cards/review/`.** Auto-finished by `card:scaffold` and
  unregistered until checked: Ornithopter, Zetalpa, Primal Dawn. Check each
  (`npm run card:verify -w engine -- --dir review`, then against its Oracle text) and move it
  into `pool/`. `--auto-scan` over both backlog lists auto-finishes about 160 more (mostly
  lands, pathways and simple spells), not yet written. `--auto-scan --all` finds far more across
  the whole snapshot: decide whether the pool wants them (they bloat the client's card bundle
  with mostly unplayed cards).
- **More Oracle-parser templates.** `npm run card:scaffold -w engine -- --report` lists the
  unparsed lines that recur most across the backlog; the parser reads about 42% of the
  abilities it finds there. Add a template, then keep `npm run card:parse-check -w engine` at
  zero disagreements.
- **Pool bugs the parser check found.** Signets and the Karoo-style "Add {W}{U}" lands are
  authored as `{oneOf: [W, U]}` × 2, which also makes {W}{W}. The fix needs the mana auto-payer
  (`Game.manaSources`) to take a sequence of fixed `add-mana` steps. Eternal Witness and
  Kolaghan's Command return a card from a graveyard with no target; audit the other untargeted
  `return-from-graveyard` cards the same way (Buried Ruin and Ravos are fixed). Craw Wurm has
  trample, but the real card is vanilla. `combat.test`, `combat-depth.test` and
  `combat-damage-by-toughness.test` use it as a trampler, so give them a real trampler first.
- **Card sweep 1's skipped staples.** 227 of the 300 highest-ranked unauthored top-2000
  cards need engine work; listed by rank in `neededCards-features.md`, "Card sweep 1: the
  staples it skipped". Triage them by missing feature before choosing the next card-side work.
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
- **Zone-change identity** (rule 400.7). A spell's or ability's targets and source, and a
  delayed trigger's source, are now checked as the objects they were (`targetStints`,
  `sourceZoneChangeCount`, `DelayedTrigger.sourceStint` — `bug:zone-change-object-identity`,
  built). Two pieces are left. A delayed trigger's *carried targets* aren't checked: a
  creature returned by Whip of Erebos, then flickered, is still exiled at end step as a new
  object. And a permanent that left, came back and left again before an ability referring to
  its first departure resolved has only the second departure's last-known information (the
  first is read as the card now is).
- **Entering together.** Permanents put onto the battlefield by one instruction still enter
  one at a time, so a "whenever another creature enters" ability among them misses the ones
  that entered before it (the Elas il-Kor ruling). Leaving together is one event already.
  Tracked as `bug:simultaneous-zone-moves`.
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **An Aura entering other than as a spell** is attached to nothing. Only a resolving Aura
  spell attaches (`resolveTopObject`); one reanimated, returned by a flicker or put onto the
  battlefield from a library or hand floats unattached for good. Rule 303.4f has its
  controller choose what it enchants as it enters (303.4g: with nothing to choose, it stays
  where it was), and the SBA sweep (`stateBasedGraveyardMoves`) skips an Aura attached to
  nothing, where rule 704.5m puts it into the graveyard. The choice is UI-bound; fixing the
  sweep alone would only trade a floating Aura for a lost one.
- **Token stacks in combat.** Splitting one stack across attackers or blockers is not built,
  and neither is choosing which of a stack proliferate touches. See
  `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.

## Bots

- **v3 is built but not seated.** Its evaluation hasn't been re-fitted for a search that
  actually casts things, and it benches six points behind v2 at four players. The
  "Sequencing" steps from "Re-run `bot:audit`" onward are still outstanding. See
  `docs/plans/bot-v3-search.md`.
- **v2's Phase 7 feature list is superseded.** Don't build it. See `docs/plans/smarter-bots.md`.
- **Poison is invisible to the evaluation.** `bot/features.ts` reads energy but not
  `PlayerState.counters`, so a bot sees nothing coming until ten poison counters end the game,
  and proliferate's search candidates ("mine", "everything", "nothing") never single out an
  opponent's poison. The default proliferate answer (`ownedProliferateTargets`) does.

## Client / UI

- **The target count is ignored.** `client/src/App.tsx` doesn't read `LegalAction.targetCount`,
  the affordable range under Hinata-style per-target costs. A player who picks an unaffordable
  number of targets gets the server's rejection banner.
- **Reduced costs display wrong.** `displayCostOf` rewrites only the generic number, so a
  coloured-pip or twobrid reduction isn't shown.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Player designations as a viewable zone.** Emblems are listed as text lines under the
  player panel today. Give them (and, once modeled, the Ring and the Initiative/dungeon) a zone
  button on the player banner that opens a viewer, the way graveyard and exile do. The monarch
  keeps its 👑 beside the player's name (`PlayerPanel`'s `pp-monarch`, checked in 2- and
  4-player rooms).
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.

## Tooling / docs

- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
