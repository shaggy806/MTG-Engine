# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**132 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Ready to author, no engine work** (each needs `card:lookup` first, so they wait for a
  session with Scryfall access): Ygra, Eater of All, Gev, Scaled Scorch and Maha, Its
  Feathers Night (ward, type grants, base P/T and other-permanent enters replacements are
  built); Betor, Kin to All (player scopes are built; its gaps entry still lists
  `effect:amount-aggregate`, whose condition form it needs is built); Thalia and The Gitrog
  Monster, Quintorius, History Chaser and Zimone and Dina (a `sequence` waits for a decision
  one of its steps raises); Leonardo, the Balance (`may`'s `oncePerTurn`); Fynn, the
  Fangbearer, Atreus, Impulsive Son and Kratos, Stoic Father (poison and experience counters);
  Sam, Loyal Attendant (`abilityCostModification`); Ovika, Enigma Goliath (`create-token`'s
  `gainUntilEndOfTurn`); Terra, Herald of Hope, Evereth, Viceroy of Plunder and Slinza, the
  Spiked Stampede (`reflexive-trigger`); Imotekh the Stormlord, Commodore Guff and Ezuri, Claw
  of Progress (the `other` target spec); Clavileño, First of the Blessed and Jenova, Ancient
  Calamity (`add-types`); Zoraline, Cosmos Caller (`may`'s `costLife`); Szarel, Genesis
  Shepherd (the sacrifice trigger's `filter`); Arahbo, Roar of the World, Ikra Shidiqi, the
  Usurper and Millicent, Restless Revenant (`otherOnly` on the attack and combat-damage
  triggers, whose creature is the trigger object); Toph, the First Metalbender (`earthbend`);
  Kelsien, the Plague (a delayed trigger keyed to a permanent dying — its gaps entry still
  lists `effect:delayed-trigger-extensions`, whose leave-keyed part it needs is built);
  Betor, Ancestor's Voice, Clement, the Worrywort and Minn, Wily Illusionist (a filter's
  `{ amount }` operand); Doran, Besieged by Time (the `difference` amount and an `own`
  compare); Sisay, Weatherlight Captain (`colorsAmong`); Toxrill, the Corrosive
  (`grantPtPerCount.countersOnAffected`); Katara, the Fearless and Cloud, Midgar Mercenary
  (`doubleTriggersOf`); Wayta, Trainer Prodigy (`doubleTriggers`' `"dealt-damage"` cause).
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The first
  ten, engine-only, with the commanders each fully unblocks:
  `effect:this-way-results` (+3), `effect:amount-aggregate` (+1),
  `effect:look-and-choose-leftover` (+1), `effect:put-onto-battlefield-options` (+1),
  `effect:choices-by-other-players` (+3), `trigger:put-into-graveyard` (+3),
  `effect:missing-tokens` (+1), `trigger:combat-damage-batch` (+3),
  `condition:filter-this-turn-history` (+2), `replacement:damage-modification` (+3).
- **Most-needed features overall.** `effect:this-way-results` (18),
  `static:grant-to-cards-outside-battlefield` (14), `zone:visibility-extensions`,
  `static:grant-abilities-to-spells` and `bug:zone-change-object-identity` (13 each). Live
  numbers come from `cmdrs:gaps`.
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
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
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
