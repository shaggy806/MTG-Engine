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
  (`doubleTriggersOf`); Wayta, Trainer Prodigy (`doubleTriggers`' `"dealt-damage"` cause);
  Kefka, Court Mage, Lord Windgrace and Mr. Foxglove (the `thisWay` amount and `this-way`
  condition — their gaps entries still list `effect:this-way-results`, whose discard/draw part
  they need is built); Kratos, God of War (the `attackedThisTurn` filter clause); Malcolm,
  Keen-Eyed Navigator and Goro-Goro and Satoru (the batched `deals-damage-batch` trigger);
  Sidisi, Brood Tyrant, Syr Konrad, the Grim and Disa the Restless (`put-into-graveyard`, and
  `leaves-graveyard`'s `perCard`); Kuja, Genome Sorcerer, The Mindskinner and Neriv, Heart of
  the Storm (the scoped `would-deal-damage` replacement); Tymna the Weaver, Éowyn,
  Shieldmaiden and The Mycotyrant (`PlayerState.turnHistory` and the new turn stats — "the
  number of times you descended this turn" is `{ turnHistory: "descended" }`); Michelangelo,
  the Heart (the same, plus `turn-structure` — check at `card:lookup` that its tally is one
  `turnHistory` records); Karlach, Fury of Avernus (`additional-combat`'s `afterThisPhase` and
  the `turn-structure` condition); Clive, Ifrit's Dominant (`flicker`'s `transformed`); Ojer
  Axonil, Deepest Might (`put-onto-battlefield`'s `transformed`, `would-deal-damage`'s
  `atLeast: "this-power"` with `combat: false`, and the `damage-dealt-this-turn` condition on
  Temple of Power's transform ability); The Gitrog Monster (`unless` with `chooser: "you"`);
  Kynaios and Tiro of Meletis, Kwain, Itinerant Meddler and Wernog, Rider's Chaplain
  (`each-player-may` and its `ifDid`/`ifDidnt` — the "this way" parts their gaps entries list
  are those follow-ups, and Wernog's investigate is built); Dr. Eggman (its gaps entry lists
  only `effect:choices-by-other-players` — confirm at `card:lookup` that `each-player-may`,
  `unless` or a villainous choice covers it); Eriette of the Charmed Apple
  (`cantAttackController` over a `filter` scope with `enchantedBy: "you"`), Delney, Streetwise
  Lookout (`cantBeBlockedBy`, and `doubleTriggersOf` with a power filter) and Anzrag, the
  Quake-Mole (the `restrict` effect's `"must-be-blocked-if-able"`, and `becomes-blocked` with
  `additional-combat`'s `afterThisPhase`); Anowon, the Ruin Thief (`deals-damage-batch` and
  `{ thisWay: "milled", who: "trigger-player" }` — its gaps entry lists
  `effect:this-way-results`, whose milled part it needs is built); Anti-Venom, Horrifying
  Healer and Rocco, Cabaretti Caterer (an enters trigger filtered `{ cast: true, castBy:
  "you" }` for "if you cast it" — an enters trigger reads the X its permanent was cast with);
  Kodama of the East Tree (`putThereBySource: false`, with a `{ amount }` mana-value operand on
  its hand search); Fire Lord Zuko (`firebending({ powerOf: "source" })`, `enteredFrom:
  "exile"`, and the `cast-spell` trigger's `from: "exile"`); Rakdos, Lord of Riots
  (`castOnlyIf`, and a `{ turnStat: "life-lost", who: "opponent" }` cost reduction), Myrel,
  Shield of Argive (a `prohibits` static timed by `your-turn` — its 1/1 colorless Soldier
  artifact token isn't in `cards/tokens/` yet) and Marisi, Breaker of the Coil (`prohibits`
  timed by `turn-structure`'s `duringCombat`, and `goad`'s `who: "trigger-player"`); Veyran,
  Voice of Duality (`cast-spell`'s `orCopy` and `doubleTriggers`' `"cast-or-copy"` cause);
  Azlask, the Swelling Scourge (the `annihilator` helper — confirm at `card:lookup` that it
  covers the rest); Ketramose, the New Dawn (the batched `put-into-exile` trigger, and
  `cards-in-exile` under a `not` on its attack/block restriction); Bruce Banner (a modal DFC
  that transforms) and Aragorn, King of Gondor (the `life-total` condition) — each gaps entry
  lists only what this batch built, so confirm the text at `card:lookup`; Bruvac the
  Grandiloquent (`would-mill`), The Lord of Pain (`would-gain-life`'s `prevent`, a `cast-spell`
  trigger's `firstEachTurn` and an `other` player target) and Bilbo, Birthday Celebrant
  (`would-gain-life`'s `plus`, and a `life-total` activation condition); Okaun, Eye of Chaos
  and Zndrsplt, Eye of Wisdom (`flip-coin`'s `untilLose` and the `wins-coin-flip` trigger);
  Mirko, Obsessive Theorist (the `surveils` trigger), Winter, Misanthropic Guide (a
  `maxHandSize` static) and Tifa, Martial Artist (the `melee` helper) — confirm each at
  `card:lookup`; Rowan, Scion of War (`player-effect`'s `reduceSpells`), Lightning, Army of
  One (its `damageTo`, if its text is the doubling it's remembered as) and Yusri, Fortune's
  Flame (`castFromHandFree` and `flip-coin` — its "choose a number between 1 and 5" may still
  need `decision:choose-number`).
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The first
  ten, engine-only, with the commanders each fully unblocks:
  `effect:this-way-results` (+6), `effect:missing-tokens` (+1),
  `static:grant-to-cards-outside-battlefield` (+3), `effect:amount-aggregate` (+1),
  `effect:look-and-choose-leftover` (+1), `effect:reveal-until` (+2),
  `bug:color-identity-back-face` (+1), `trigger:saga-final-chapter` (+1),
  `bug:saga-completion-sacrifice` (+1), `cost:mana-ability-complex-costs` (+2).
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
