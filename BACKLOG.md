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
- **Cards the scaffolder finishes on its own.** Of the snapshot's 30,710 unimplemented
  Commander-legal cards, the parser reads every line of 4,241 (`npm run card:scaffold -w engine
  -- --report --all`). Ranks 2001–16000 are reviewed and in the pool (1,276 cards). Continue
  down the ranks: `--auto-scan --ranks A-B` writes them to `review/`. Check each against its
  Oracle text and rulings, and each token it makes against its token file, then move it into
  `pool/`.
- **More Oracle-parser templates.** `npm run card:scaffold -w engine -- --report` lists the
  unparsed lines that recur most across the backlog; the parser reads about 42% of the
  abilities it finds there. Add a template, then keep `npm run card:parse-check -w engine` at
  zero disagreements.
- **Rydia, Summoner of Mist is missing its Summon ability** ("{X}, {T}: Return target Saga card
  with mana value X from your graveyard to the battlefield with a finality counter on it. It
  gains haste until end of turn."). Both reasons its file gives for dropping it are gone now
  (`card-in-graveyard` targets, finality counters), but a target filter on "mana value X"
  still needs checking. Its landfall loot also draws even when no card was discarded.
- **Card sweep 2 (2026-09-25).** Five cloud batches triaged the 189 best-ranked unimplemented
  top-500 commanders (C1–C3) and the 208 best-ranked unimplemented top-2000 cards (K1–K2). Those
  208 include most of card sweep 1's 227 skips. They authored 36 cards and recorded 361 as
  blocked, each with its missing features, in `engine/data/sweep-2/*.json`. The keys are those of
  `top-commanders-gaps.json`, or `new:*` described in the file.
  - The most-needed features: `decision:copy-new-targets` (16), `effect:copy-exceptions` (14),
    `effect:may-sacrifice-then` (12), `effect:cast-during-resolution` and
    `condition:filter-card-property-clauses` (11 each), `effect:attach-extensions`,
    `effect:add-mana-extensions` and `bug:as-enters-choices-any-entry` (10 each).
  - The rest of the backlog is untriaged: 62 commanders and 1,144 cards, the lists' unmarked
    entries past those batches.
- **The limitation ledger.** Protection from a filter (19 cards) is the largest remaining gap.
  Then regeneration, the "put into a graveyard from anywhere" trigger, "as this enters" on a
  non-cast permanent, and discard as an ability cost. See `neededCards-features.md`, "The
  limitation ledger", and `cards/AUTHORING.md` §15.
- **Pre-§0 debt.** Some cards in the pool lose or misplay a printed clause. Fix or delete each
  one. See `cards/AUTHORING.md` §15, "Known exceptions already in the pool", and
  `npm run card:text -w engine`.
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

- **Engine bugs card sweep 2 found** (repros in `engine/data/sweep-2/*.json`, `bugs`):
  - Dies-trigger doubling (Teysa Karlov) misses creatures that die alongside the doubler.
  - A mass destroy moves its victims one by one, so a "would die, exile instead" permanent
    among them (Vren) stops applying partway.
  - A commander its owner sends to the command zone never dies, so its own dies trigger is lost
    (Child of Alara).
  - `otherOnly` also strips the source from an ability's target check (Dina, Essence Brewer).
  - A negative amount isn't clamped to 0 (rule 107.1b): a negative power gains negative life.
  - A granted escape (Underworld Breach) is never offered for a card with its own escape.
  - A player who can't cast spells can still suspend (Silence).
  - A must-attack creature left out of a declaration is sent at the first legal defender, not
    its controller's choice.
  - `extort()` gains the life it *meant* to drain, not the life actually lost.
  - Two slots of one "two target" clause accept the same object (Ghostly Flicker).
  - Play-from-graveyard reads a double-faced card by its front face only (Ancient Greenwarden).
  - Performance: a per-creature enters trigger watching an opponent's token stack
    (Authority of the Consuls against Scute Swarm) puts hundreds of triggers on the stack.
- **Two small engine gaps the scaffolder review found:**
  - "Add N mana of any one color" (N > 1) is auto-paid as N independent colours
    (`bug:mana-any-one-color`). Gilded Lotus and Lotus Field are in the pool with it; the
    parser leaves new ones unfinished until it's fixed.
  - A "you may" around an action that can only partly happen is still offered. Daggerfang
    Duo's ruling: with one card left you can't choose to mill two, but the engine mills the one.

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
