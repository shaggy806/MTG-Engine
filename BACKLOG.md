# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Questions for the user

Each waits on a decision only the user can make. Once one is answered, move the work it
decides into its section below.

- **Where should a bot's fallback deck come from?** A bot seat with no deck falls back to the
  first four `SAMPLE_DECKS` by seat (`server/src/decks.ts`): Temur Roar, Sultai Arisen, Abzan
  Armor, Mardu Surge. So bob's bot brings Sultai Arisen, which the deck run found the bots
  can't pilot (it's been off the bench since 2026-10-02). Should a fallback come from the four
  `bench` decks (Abzan Armor, Jeskai Striker, Token Triumph, Reign of Dragons) instead?
- **How should we say which turn it is, and for whom?** A turn number counts every player's
  turns, so at a four-player table "turn 37" is the first player's 10th turn, which reads as a
  much longer game than it is. Where should the more specific form apply (the client, bench
  output, docs, commit messages), and what should it look like?
- **What should the engine-test audit look for, and what should it produce?** The idea (raised
  2026-09-27) is to go through the engine suite and check what it actually guards. The suite is
  now 559 files and about 5,550 tests.
- **Build text changing properly, or remove it?** `change-text` / `choose-text` have no card
  since Artificial Evolution was removed (2026-09-28): it swapped one creature type on the
  type line from a fixed 12-type menu, not "all instances" across the card's text. Either
  build real layer-3 text changing (every creature-type word in a card's abilities, every
  creature type offered, spells as targets) or remove the effect and the decision kind.

## Commander gap (the current priority)

**389 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists. Live numbers for everything below come from
`npm run cmdrs:gaps -w engine`.

- **Ready to author, no engine work: none.** Jasmine Boreal of the Seven was listed as ready,
  but her real blocker is the mana-restriction gap under Engine rules gaps, now recorded in her
  gaps record as `cost:mana-restriction-at-cast`.
- **Build down the greedy order.** `cmdrs:gaps` ranks every missing engine feature over
  `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to that file's
  `built` array and author the commanders it unblocks in the same commit. The next ones,
  engine-only, with the commanders each fully unblocks: `effect:missing-tokens`,
  `keyword:decayed`, `trigger:activates-ability`, `trigger:you-tap-opponent-creature` and
  `effect:amount-aggregate` (+1 each).
- **Most-needed features overall.** `effect:cast-during-resolution` (10),
  `effect:attach-extensions` (7), `zone:visibility-extensions` and `effect:missing-tokens` (6
  each). Orvar needs `decision:choose-permanent` and `trigger:discards-extensions`. Ulalek needs
  `cost:colorless-hybrid-mana` and `keyword:devoid`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:cast-during-resolution` (10; partly built on 2026-09-30 as the `cast-now` effect, and
  what's left is in its `top-commanders-gaps.json` description), `effect:attach-extensions` (7),
  `cost:sacrifice-multiple`, `decision:choose-permanent` and
  `decision:choose-from-zone-extensions` (5 each). Sen Triplets also needs
  `zone:cast-from-opponents-hand` (playing cards from the target's revealed hand), on top of
  the revealed hand itself.
- **Speed waits on the client** (AUTHORING §15). Speed (`mechanic:speed`) blocks Mendicant
  Core, Vnwxt, the four Raceways and Howlsquad Heavy, and Max speed's 34 cards. It needs the
  player panel to show a player's speed and the stack to draw its inherent trigger, which has
  no source (rule 702.179d).

## Card backlog (top-5000 staples and the precons)

What blocks each unimplemented card, and which cards a built feature may have unblocked, is in
**`docs/card-blockers.md`** ("Open leads" first, then batch by batch and family by family, over
the per-card JSON records in `engine/data/sweep-2/` and `sweep-3/`). Card lists go there; this
section keeps only what to do next.

- **Now (priority since 2026-09-30): the TDC precons' 7 missing cards** (`SAMPLE_DECKS`, so every
  bot plays them): Temur Roar 2, Sultai Arisen 1, Abzan Armor 2, Jeskai Striker 2, each behind a
  feature of its own. Delete a card's substitution in `sample-decks.ts` as it lands. Which
  feature each needs: `docs/card-blockers.md`, "Open leads".
- **The nine other starter precons' 48 stand-ins** (`engine/data/sweep-3/PC-*.json`), behind the
  TDC decks.
- **Next: the top 5000 cards, then past them.** `top-commander-cards.txt` (3,347 of 5,000
  implemented) is fully triaged, and past it Oracle EDHREC ranks 5011–6428 (batches 30–35);
  rank 6429 is next. Every card left needs engine work: build the features that block the most
  of them (`neededCards-features.md`, "Open: the card backlog"; the cheap recurring blockers
  are in `docs/card-blockers.md`, "Open leads").
- **Cards a built feature may have unblocked** — recheck each against its Oracle text:
  `docs/card-blockers.md`, "Open leads".
- **"You may search" isn't optional on about 35 cards.** Their `search-library` has `min: 0` and
  no `may` around it (Primal Druid), so declining still searches and shuffles, which a library
  ordering (a scry, a Brainstorm) loses. Fierce Empath has the right shape; sweep the rest. Not
  to be confused with the tutors under Engine rules gaps ("Search your library for a card"),
  whose `min: 0` is wrong the other way: they need `min: 1`, not a `may`.
- **Enter the God-Eternals gains a fixed 4 life**, not "life equal to the damage dealt this way":
  wrong beside Torbran, Gratuitous Violence or prevention. It needs the damage actually dealt as an
  amount (`new:damage-dealt-this-way`).
- **Features with a family of cards behind them**, each detailed where it points:
  Ninjutsu and the rest of "enters tapped and attacking" (`docs/card-blockers.md`); modal
  activated abilities with targeted modes, host triggers (28 cards), the EDH-popularity tiers
  (Class; Discover, Reconfigure) and the limitation ledger (`neededCards-features.md`); the
  Incarnations' evoke by exiling a card, and the labelled abilities (Case, Forecast, Max speed)
  (`docs/card-blockers.md`, "Open leads").
- **More Oracle-parser templates.** The unread lines that recur most are the next templates
  ("Choose one —" on an ability, Crew, "Regenerate ~", "You may pay {…}", "Transform ~"):
  `npm run card:scaffold -w engine -- --report --all` for today's figures; keep
  `npm run card:parse-check -w engine` at zero disagreements.

## Engine rules gaps

- **Blitz is offered only from the hand and the command zone.** `Game.blitzCostOf` gates on
  those two zones, so a blitz card another permission lets you cast (an impulse exile, a
  graveyard grant, the top of a library) isn't offered its blitz cost there, though rule
  702.152a allows it. Henzie's discount also moves only a cost's generic number, never an `{X}`
  (no blitz cost in the pool has one yet).
- **A mana restriction reads the spell before it's cast.** `ManaRestriction.spell` is matched
  against the card in its pre-cast zone, so an ability a static grants a spell as it's cast
  (Abaddon the Despoiler's cascade) is missed: Jasmine Boreal of the Seven's "only to cast
  creature spells with no abilities" (her ruling) would wrongly pay for it. She waits on it
  (`cost:mana-restriction-at-cast` in the gaps JSON).
- **Suspend's time-counter triggers don't use the stack.** Rule 702.62a makes "remove a time
  counter" and "when the last is removed, you may play it" triggered abilities; `upkeepStep` does
  both as the upkeep begins (`castSuspendedCard`), so nobody can respond between them.
- **"Search your library for a card" may fail to find.** Rule 701.23d: a search for a quantity
  ("a card", no quality) must find that many while the library has them. Twelve tutors author it
  `search-library` with `filter: {}` and `min: 0` (Demonic Tutor, Vampiric Tutor, Imperial Seal,
  Grim Tutor, Razaketh …); it's `min: 1`, as Entomb and Insatiable Avarice have it — the search
  already clamps `min` to what's there. Don't sweep these together with the card backlog's
  "You may search" cards, which need a `may` instead.
- **704.5h reads "dealt deathtouch damage this turn", not "since the last state-based check".**
  `markedByDeathtouch` lasts until cleanup (`recordDamage`'s excess-damage reading uses it too),
  so a creature that survived deathtouch damage while indestructible is destroyed if it loses
  indestructible later that turn. Needs a flag the SBA check clears after each pass.
- **Changing a spell or ability's target** (rule 115.7 — Return the Favor's "change the target
  of target spell or ability with a single target"), and a target slot that takes an instant or
  sorcery spell *or* an activated or triggered ability (its first mode). Return the Favor waits
  on both.
- **"Whenever a creature you control deals combat damage to that player this turn"** — a
  delayed trigger lasting the turn, keyed on a target player (Great Train Heist's third mode),
  and "if it's your combat phase" as a condition (its first). `DelayedCombatDamage` watches one
  creature only.
- **"Whenever this Equipment becomes unattached from a permanent"** (Grafted Exoskeleton): no
  unattach event or trigger — an equip elsewhere, the Equipment leaving, the creature ceasing to
  be a creature.
- **A card's own "if this would be put into a graveyard from anywhere, reveal it and shuffle it
  into its owner's library instead"** (Blightsteel Colossus, the Darksteel Colossus family) — a
  self-replacement working from every zone, which beside Rest in Peace also needs its owner to
  choose the order (rule 616.1).
- **A set rule on a graveyard choice**: "up to two creature cards with total mana value 4 or
  less" (Lively Dirge's second mode). `together` exists only on a library search
  (`zone-choice-together.ts` takes a new rule cheaply, and the clients already read it).
- **No state-based actions after a mana ability activated by hand.** Rule 117.3c gives its
  player priority again, so 117.5 checks SBAs; `activateAbility` returns without
  `afterPlayerAction` for a mana ability, and a pass to the next player doesn't check them
  either. Wall of Roots taken to 0 toughness by its own -0/-1 counter sits on the battlefield
  until the next cast or resolution (`tdc-precons-features.test.ts`); a Treasure's "whenever you
  sacrifice" trigger likewise waits to be put on the stack.
- **Counters put as a cost skip counter replacements and prohibitions.** `putCostCounters`
  (Wall of Roots' -0/-1, Devoted Druid's -1/-1) puts them straight on. Right for "if an effect
  would put counters" (Doubling Season), wrong for one that isn't worded so (Vizier of Remedies)
  and for "counters can't be put on" (Solemnity, top 5000), which makes the cost unpayable
  (Devoted Druid's rulings). Nothing in the pool reaches those kinds yet; authoring one needs it.
- **Delve and convoke together on an {X} spell.** `xCost.maxX` is the better of the two alone
  (`xPlanFor`), so Chord of Calling under Teval, Arbiter of Virtue can't reach the X both would
  pay together, and its offer's convoke proof and delve ranges are each worked out without the
  other. Needs a joint plan: convoke the creatures, delve the rest of the generic.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **The least X a top-of-library cast allows is searched only up to the mana a player can make**
  (`libraryTopMinX`, ceiling `manaCapacity`): an {X} spell that convoke or delve could pay up to
  Glarb, Calamity's Augur's mana value 4 isn't offered from the top.
- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring (Lord of the Nazgûl's
  "protection from Ring-bearers" is authored as inert on the strength of this: revisit it when
  the Ring lands), banding, Companion, snow *sources* (snow mana is generic), face-down
  permanents (morph, manifest, cloak; face-down exile is built), and full text-change beyond
  one creature-type word. ROADMAP's Phase 10 deferred these as large or niche. None of them
  blocks ordinary Commander play. The alt-cast long tail left by Phase 6 (retrace, Warp,
  Bestow, Prototype, …) is in AUTHORING §15 and the limitation ledger.
- **"Whenever you activate an ability" (Rings of Brighthearth).** `activates-ability` offers
  only `who: "attached"`. Cycling's draw is on the stack now (an ability object sourced from the
  cycled card), so a cycling activation would be one more for it to see.
- **An O-Ring's return is a triggered ability, not rule 610.3's one-shot effect.** "Exile …
  until ~ leaves the battlefield" returns the card "immediately after" (610.3; Grasp of Fate's
  ruling: "Nothing happens between the two events, including state-based actions"), but the
  engine's O-Rings (Banishing Light and kin, AUTHORING's "An O-Ring") return it with a
  `leaves-battlefield` trigger that uses the stack and can be responded to. Grasp of Fate stays
  out on it (its per-opponent targets are built — `{ seat }`).
- **End-step token removal resolves without the stack.** "Exile it (sacrifice it) at the
  beginning of the next end step" is a delayed triggered ability (rule 603.7), but
  `create-token` / `create-token-copy`'s `exileAtEndStep` and `sacrificeAtEndStep` (Flameshadow
  Conjuring, Molten Echoes, Twinflame, Kiki-Jiki, mobilize, encore …) are a flag on the token
  that `Game.endStepActions` acts on as the step begins. So nobody can respond to it, counter it
  (Sublime Epiphany — Flameshadow Conjuring's ruling: a countered one leaves the token for good)
  or copy it (Strionic Resonator). `exileAtEndOfCombat` (myriad) already sets up a real delayed
  trigger over the tokens it made; these need the same, kept out of token stacks, and the
  sacrifice made by the token's controller then (rule 701.21a).
- **Replacement ordering.** There is no general `choose-replacement-order` (rule 616.1) — only
  Feather's exile beside another exiling replacement asks — and no damage redirection to a
  third object.
- **Two opponents' Notion Thieves aren't ordered by the drawing player.** At a table of three
  or more, when Thieves controlled by different opponents could each take a draw, the drawing
  player chooses which applies first (the ruling), which decides who ends up drawing;
  `Game.drawRedirectFor` takes the opponent first in turn order. Asking needs a draw that can
  stop mid-effect for a decision (`drawCard` is synchronous at every call site).
- **Toxic's last two shapes.** "Gains toxic N until end of turn" (no modifier carries toxic —
  Skrelv, Defector Mite, which also needs hexproof from a colour) and a static scoped to
  "creatures with toxic" (Skrelv's Hive: toxic is folded in the layer such a scope would have
  to wait for).
- **A Siege's chosen side as it leaves.** `chosenOnEnter` isn't in `LastKnownInfo`, so a
  `chosen-on-enter`-gated leaves-the-battlefield trigger (Outpost Siege's "Dragons") doesn't
  look back at a Siege dying with the creatures.
- **A look at nothing still asks.** `look-and-choose` over an empty library (Thassa's Oracle
  at devotion 2 with no cards left) raises a `choose-from-zone` with no cards in it; it should
  skip straight to what follows.
- **Revealing a card "of a type" from hand reads printed subtypes.** `Game.revealableFromHand`
  (`tappedUnlessRevealFromHand`) checks each card's printed `subtypes`, so a changeling card in
  hand isn't offered as a Treefolk or Dragon to reveal (rule 702.73a: it has every creature type
  in every zone). Temple of the Dragon Queen has it today; Murmuring Bosk waits on it.
- **Disturb's "exile it instead" is the cast path's, not the card's.** A back face's "if this
  would be put into a graveyard from anywhere, exile it instead" is applied only to a card cast
  with disturb (`castVia === "disturb"` in `game.ts`), so a copy of it (Clone) goes to the
  graveyard and a disturbed one that lost its abilities (Humility) is still exiled (rule 707.2).
  Hook-Haunt Drifter has it today; Lunarch Veteran waits on it.
- **An additional-cost option is offered without checking its mana.** "As an additional cost,
  sacrifice a creature or pay {3}{B}" (`additionalCost.options` with a mana branch) is listed as
  castable when the total can't be paid, and taking it throws in `castSpell` — the fuzzer's
  random players found it (Eaten Alive, pulled from the pool for it).
- **A milled card is looked for only in the graveyard.** An effect that finds "the milled cards"
  (`look-and-choose` over `zone: "graveyard"`) misses those a replacement sent to exile (Rest in
  Peace, Dauthi Voidwalker), though rule 701.17c says it finds them in whatever public zone they
  went to. Smuggler's Surprise and Ripples of Undeath have it today; Bramble Familiar waits on it.
- **"Return it transformed" brings back a card that can't transform.** Rule 712.14a: a card
  that isn't double-faced, told to enter transformed, stays where it is; `flicker` with
  `transformed` returns it normally. Clive, Ifrit's Dominant has it today; Dion, Bahamut's
  Dominant and The Legend of Roku wait on it (found in the no-engine-work pass, not re-run).
- **Damage modifiers apply in a fixed order.** When a doubler (Dictate of the Twin Gods,
  Torbran, Gratuitous Violence) meets prevention or another modifier, the affected player (or
  controller of the affected object) chooses the order (rule 616.1); the engine fixes it. The
  pool's doublers have it today; Furnace of Rath, Collective Inferno and Mechanized Warfare wait
  on it.
- **"You sacrifice it" at end step is done by its controller.** `sacrifice-target` makes the
  current controller sacrifice the permanent; if control changed, a card that says *you* sacrifice
  it should do nothing (rule 701.21a). Sneak Attack has it today; Come Back Wrong and Apprentice
  Necromancer wait on it.
- **Pool cards the no-engine-work pass (2026-10-04) found sharing a blocked shape.** Each reviewer
  flagged these while blocking a new card for the same reason; none was re-run, so check each:
  - "This or another X" as one trigger, which misses its own entry when it isn't an X (a copy,
    Conspiracy): Ayara, First of Locthwain and Bloomvine Regent (Théoden and Pashalik Mons are
    split now).
  - `each-player-may` asks one player at a time where the ruling has every player choose first,
    then all act at once: Will of the Jeskai's wheel mode, Kwain, Itinerant Meddler.
  - `trigger-controller` for "that player" on a spell-cast trigger reads the spell's controller as
    the trigger resolves, so a stolen-library spell countered first points at its owner: Forced
    Fruition, Ruric Thar, Spellshock, Magebane Lizard.
  - `attach` to a "created" token picks one when a doubler makes two (Black Mage's Rod).
  - Comments cite rule 610.3c for "exile nothing if the source already left"; it's 610.3a/b
    (`game.ts`'s `exileObject`, `effects.ts`'s `untilSourceLeaves`). The behaviour is right.
- **Static-effect dependency ordering** (rule 613.8) is implemented only for layer 4's additive
  type grants (Kudo beside Mishra's Factory, `characteristics.ts`). Every other layer applies
  its statics in timestamp order only.
- **The rest of leaving the game** (rule 800.4). 800.4a is modeled (`leaveGame`), and so is
  800.4m (a duration tied to a departed player's next turn lasts until it would have begun).
  Not yet: a decision a departed player would have made (800.4g–h: another player makes it),
  and an effect ending that hands a permanent back to a departed default controller (800.4c:
  it's exiled instead).
- **Dividing among targets: what's left.** A spell's and an ability's fixed "N damage divided as
  you choose" are built (`divided`, the `division` answer). Not yet: an X total (Fire Covenant),
  and "distribute N counters among" in general (Lathiel; Earth Crystal's "two counters among
  one or two" runs through a `target-chosen` conditional). See `neededCards-features.md`,
  "Unbounded targeting".
- **A token copy isn't asked its "as this enters" choice** (a token copy of Clone, Morophon or
  Urza's Incubator), though the gaps list marks `bug:as-enters-choices-any-entry` built. See
  AUTHORING §15.
- **`sacrifice-all-but` always keeps the most it may.** "Choose up to N, then sacrifice the rest"
  never lets the player keep fewer (to sacrifice more for death triggers). The `choose-permanents`
  decision could ask it.
- **Proliferate over a token stack.** A stack is one proliferate entry and every member gets the
  counter; choosing some of them isn't built. See `docs/plans/token-stack-choices.md`.
- **Distinct targets in one token stack.** An "another target" relation (`distinctTargets`, an
  `any-number` group) names a stack once (`otherSlotConflict`, `slotOptions`), so "two target
  creatures", Terastodon's three, Curse of the Swine's X or Pest Infestation's up to X can't take
  two tokens of one stack (five Treasures in one stack are one target). Needs the relation checks
  to allow a repeat up to `stackCount` and a client control for picking a stack more than once.
  See `docs/plans/token-stack-choices.md`.
- **A commander put into a library from a graveyard, exile or the stack isn't offered the
  command zone** (rule 903.9b: "from anywhere"). `moveObject`'s 903.9b deferral covers a move
  to a hand from elsewhere and a move off the battlefield; a `choose-from-zone` putting one
  from a hand into a library asks first (`finishZoneChoice` — Brainstorm, Valakut Awakening,
  Teferi's Puzzle Box). Noxious Revival on a commander left in a graveyard puts it on top of
  the library without asking.
- **A token stack tapping fires `becomes-tapped` once.** `permanent-untapped` scales a
  trigger by the stack's `stackCount` (Mesmeric Orb); `permanent-tapped` doesn't, so a tap-all
  over a stack of Dwarf tokens makes one Treasure under Magda, not one per token.
- **Creatures leave combat as the end of combat step begins, not as it ends** (rule 511.3: "As
  soon as the end of combat step ends, all creatures … are removed from combat"). `enterStep`
  runs `endCombatStep` as that step's turn-based action, so in its priority window nothing is
  attacking or blocking any more: an "at end of combat" trigger (511.2) that asks whether its
  creature is attacking finds it isn't (`token-stacking.test.ts`).

## Bots

Every step of `docs/plans/bot-effect-knowledge.md` (keep v2, give it an effect-aware base,
retire v3) has landed. What's open is tuning: the items below, and the ones waiting on a live
game to show a problem, listed in that plan's "Watching live games for" (wraths since
`threat`, pumping an opponent's attacker, the `"acting"` rollout, big boards and deep stacks
under count budgets).

- **The autopsies' open bot items** (`docs/plans/deck-autopsies.md`, "Left"): chained spells
  invisible to the search; token payoffs beyond engines (sacrifice outlets, leaves-the-battlefield);
  premium removal fired at weak targets.
- **More training scenarios.** 102 hand-built scenarios, 99 of them gating
  (`bot/scenarios.ts`). Not yet covered: mulligans (`mulligan-policy.test.ts`). More come from
  live games: the in-game Capture button (`--capture`) saves a position to `captures/`, which
  `bot:scenarios` and `bot:fit-scenarios` read as training scenarios, as does each blunder
  `bot:behaviour` shows. `npm run bot:captures -w engine` lists them with v2's answer today;
  once one is fixed, `-- resolve` moves it to `captures/resolved/`, where it gates.
- **Counterspells, beyond `answers`.** The reserve (`answers` 3) is a constant: the bot holds a
  Counterspell as firmly when every opponent's hand is empty as at full grip, and counters a
  Grizzly Bears (worth 4.6 to counter, largely `threat`). If live games show it holding one
  into a loss, or spending one on a small creature, capture the position: a reserve scaled by
  opponents' cards in hand is the obvious next shape.
- **A wider pool of bot decks (later — raised 2026-09-26).** `SAMPLE_DECKS` is fourteen precons
  since 2026-10-02 (the five Tarkir: Dragonstorm decks, the five 2022 starter decks and four more —
  `docs/plans/precon-decks.md`), four flagged `bench`. Still unscoped: decks across a range of
  power levels for bots to bring, and how a host picks one. (Where a bot's fallback comes from
  is a question at the top.)
- **More deck biases.** `engine/src/deck-bias.ts` (`docs/plans/deck-biases.md`) lets a
  commander's deck aim effects the other way and value its own board differently; Teval is the
  one entry. Add one when a live game shows a deck's bot playing against its plan, with a gate
  scenario that fails without it. Kinds not built: cards to cast first or hold, attack
  eagerness, and opponents' biases (milling an opponent's Teval still reads as neutral to us).
- **Skullclamp and Deadly Dispute on a 1/1 token.** v2 passes on both (training scenario
  "Skullclamps a 1/1 token for two cards"; Deadly Dispute probed 2026-10-03, cast on a Treasure
  but not a Soldier token, `docs/plans/deck-autopsies.md`): two cards score just under a 1/1 body
  and its point of attack, since every creature counts `creatures` 2.5 whatever its size.
  `bot:fit-scenarios` finds `creatures` 2.5 → 2 breaks no gate scenario. Tried 2026-10-02:
  `bot:diff` over six four-player games changed 12 of 11,553 decisions, mostly more token blocks
  and removal ahead of creatures, Sakura-Tribe Elder's land taken (right) and a 1/1 Rat token
  chump-blocking a 3/3 at 25 life (wrong) — not shipped. Deadly Dispute makes it more than
  Skullclamp: a small creature's flat value is the question, weighed against the chump blocks it
  would bring back.
- **Picking a card for an opponent.** A `choose-from-zone` with `forPlayer` (Tasigur, the Golden
  Fang's "a nonland card of an opponent's choice") goes through the bots' ordinary
  `chooseFromZone`, which takes what it would want for itself — so a bot hands Tasigur's
  controller its best card rather than its worst.
- **A smarter default trigger order.** A player who orders their own triggers is asked (the
  `order-triggers` decision, opt-in like MTG Arena's "auto order" switch); everyone else, bots
  included, gets the engine's order: `stackFirst` (evoke's sacrifice), then detection order
  (`triggerPlacement` in `game.ts`). That order is legal; a heuristic could play better — card
  draw before a discard, pumps before the attack they matter for — built from cases that come up
  in real games.

## Client / UI

- **A gift's opponent is asked one opponent at a time** (rule 702.174a): with two or more
  opponents the caster answers a yes-or-no `choose-modes` `about` each in turn, the last one
  left taking it. One prompt naming every opponent (picked on their panels) would read better;
  the engine side is `promptNextGift`.
- **What the scenario builder can't say yet** (`docs/plans/scenario-builder.md`). A
  `ScenarioSpec` has no controller apart from the owner (a stolen permanent), no transformed or
  face-down card, no damage marked, no effects lasting a turn, nothing on the stack, and no turn
  number (play starts on turn 1, though `active`/`step` set whose turn and which step) — so
  "Edit from here" leaves all of those behind. A commander placed in a library goes to its
  bottom, whatever its place in the list. Each is a field on `ScenarioCard`/`ScenarioSpec` and a
  step in `server/src/builder.ts`'s `buildScenario` and `snapshotScenario`.
- **A creature's total toxic value isn't in the player view.** `Characteristics.toxic` (rule
  702.164b) isn't a `Keyword`, so `VisibleObject.keywords` leaves it out: a Rat that
  Karumonix, the Rat King gives toxic 1 shows nothing, and only a printed "Toxic N" is readable,
  in the card's text. The view needs a `toxic` field and the board a badge for it.
- **"Choose an opponent" names seats, not players.** `choose-opponent` (Tasigur, the Golden
  Fang) asks with a `choose-modes` whose texts are "Choose Bob" — the capitalised seat id — and
  the popup prints mode texts as they are, so a player with a display name is offered by the
  wrong one. The modes need to say which player each is, for the client to label with
  `playerLabel`.
- **Face-down permanents should sit on their controller's board, and turning one face up should
  work like any other activated ability** (the user's ask): a click on the card opens the same
  little menu another permanent's activated abilities use, with "turn face up" in it when the
  card can be turned face up. Blocked on the engine: there are no face-down permanents yet
  (morph, manifest and cloak are "Not modeled").
- **One art-crop primitive (from the 2026-09-28 rendering audit).** The client draws a card
  eleven ways: `CardTile` in two layouts (title: stack, zone viewer, every hover card;
  art-first: hand, library top, cast spotlight, reveals), `MiniTile` (battlefield),
  `CommanderTile` (command zone), `CommanderDamageChip`, the card back, `CardImage` (library,
  replacement review), the lobby's `CommanderArt`, `PrintingPicker`'s thumbnails, the deck
  builder's text rows and the landing hero. Each shape answers a size the others can't, so
  merging them isn't worth it. What is duplicated is the art lookup:
  `queueArtLookup` / `isArtPending` / `resolveArtUrl` / `recordArtFailure` and the tint
  fallback, repeated in `CardTile`, `MiniTile`, `CommanderTile`, `CommanderDamageChip`,
  `CardImage` and `deck-builder/ReplacementReview.tsx` (`CommanderArt` only resolves a URL).
  Extract one `ArtCrop` component; and `PrintingPicker`'s raw `<img>` could be a `CardImage`.
- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Quality-of-life room options (house rules).** Options the room creator can turn on before a
  game that are technically against the rules but make play smoother. The user's example: mana
  that, when tapped, doesn't have its colour decided until it's spent on a specific coloured
  cost. Each would be an opt-in room setting (the lobby, `server/src/room.ts`), off by default,
  since the engine otherwise follows the Comprehensive Rules exactly.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): about 3.1 MB, 610 kB gzipped, at 5,400 cards, and
  growing with the pool. They read only printed fields, each ability's text (colour identity)
  and the tokens a card makes. A generated catalog of just those, sharded the same way, would be
  a fraction of the size. The game page loads no definitions up front.
- **Long rules text is hidden behind the creature stat line** (the user, 2026-10-03). The
  art-first layout fits its text to the box (hand, cast spotlight); the title layout
  (`CardTile.tsx`'s fit returns early for it: hover cards, the stack) doesn't fit at all, so
  Abdel Adrian's text still runs under its 4/4 box there. Long text should fit or shrink so the
  P/T box never covers it, in every layout.
- **"Same for all" covers only a trigger's yes-or-no "you may"**
  (`GameState.standingModeAnswers`). Not yet: a resolving trigger's choice among several modes, a
  "you may" asked after another decision in the same resolution (it parks, and loses
  `Game.resolvingTrigger`), the second player of an "each player may", and a trigger an effect
  granted (`grantedAbility` kind `modifier`, which has no signature).
- **A new attack arrow's head lands before its line.** An attack arrow draws itself in along
  its length (`arrow-draw`, `client/src/ui/ArrowLayer.tsx`), but its head is a marker on the
  same path, drawn whole from the first frame, so it sits on the defender before the line gets
  there. Resolving arrows put the head on a sliver path of its own that waits for the line
  (`.arrow-tip`); attack arrows could do the same.

### Legibility of play: animation and pacing (the user's list, 2026-09-30)

The design is in `docs/plans/legibility-of-play.md`; what's left here is follow-ups. The problem
is that a bot turn can't be followed by eye, even at the slow bot speed. The kinds of event that
hold the game up for their animation are `PACED` in `client/src/game/animationSchedule.ts`
(cards played, combat hits, deaths and other leaves, taps and untaps, the stack, triggers'
sources, arrivals, counters, buffs, transforms, life and damage, mills, discards, moves and the
crown). Draws and the turn and phase banners animate without holding anything up, and other
events land with the next board without animation. The pipeline is in
`docs/architecture/client.md` (`usePlayback`/`animationBus`/`AnimationLayer`). Each item below is
a small follow-up: a `slotFor` entry (which half of the frame, paced or not, shared beat or
not), then an effect in `AnimationLayer` — an `.animate()` on the tile for an `after` cue, or
`flyGhost` for a move — and each must honour `motionPrefs` (speed and reduced motion).

- **Re-measure the bot speeds.** Most events now hold the game for their animation, and the host
  can pause or step the bots, so `BOT_LINGER_MS` (`server/src/room.ts`: slow 1.6s, normal 0.7s,
  after each frame) may now make "slow" too slow; the library peel has since grown to 1.1s a
  step, too. Watch a 4-player bot game at each speed before changing it.
- **A static buff has no animation.** Anthems and lords (Lord of Lineage's "other Vampires get
  +2/+2") change P/T through the layers without an event, so the tiles just show new numbers.
  `pt-modified` is only a one-shot pump.
- **Cards exiled from a library and put back in the same resolution aren't animated going back**:
  cascade's and discover's misses (and an "exile until" whose rest go to the bottom) peel off the
  pile and the counts run down, then jump back when the board lands. A reverse peel onto the pile
  would close it, once the move back announces itself: `finishCascade` and `placeRevealed` move
  the cards with no event (`cards-put-on-bottom` is only a hand's).
- **A permanent exiled from the battlefield animates filters that don't interpolate**: `runDeath`'s
  exile keyframes go `brightness blur` → `brightness saturate drop-shadow` → `brightness saturate
  blur`, lists that differ, so the filter steps discretely. The mill peel's did the same and
  Chromium painted its last filter from the start (black cards); give every keyframe one list, as
  `peelCards` now does, and look at it live.
- **The crown has only been seen popping in**, not flying between players: that needs one
  player taking the monarchy from another (combat damage), which no dev room sets up. It uses
  the same captured flight as a change of control, which was checked.

Follow-on ideas, approved by the user on 2026-09-30:

- **Tokens merged into an engine stack arrive unanimated**: a second Raise the Alarm's Soldiers
  are folded by the engine into the first two's stack (`stackCount`), so the object their
  `permanent-entered-battlefield` names is gone from the view and nothing plays. The stack's tile
  could glow and say "+2", as a tile the board folded them into already does (`runEnters`).
  Likewise counters put on tokens peeled off a stack and folded back before the frame is drawn
  (`refoldSplitTokens`, Tribute to the World Tree): only the `counter-added` naming the
  surviving stack floats its "+1/+1 ×2"; the rest name objects gone from the view.
- **The board folds identical tokens only when they carry no counters** (`board.ts`'s
  `stackable` needs empty `counters`, though `tileKey` already compares them). Tokens that were
  never one engine stack — three Warriors made below the stacking threshold, then grown alike by
  Cathars' Crusade — stay a tile each. Dropping the condition needs every decision that picks
  from a folded tile to take a fresh member per click first: proliferate's toggle acts on
  `ids[0]` (`pickIdForClick` has no proliferate case), so a folded tile of three could only ever
  give one of them a counter. Found 2026-10-03 (`docs/plans/token-stack-choices.md`).
- **A dies trigger's source can't pulse**: `runPulse` lights the source's tile on the new board,
  and a creature whose own death triggered is gone from it. It would need a pulse in the frame's
  first half, over the old board, for a source that isn't on the new one.
- **A history entry whose cards have left the board highlights nothing**: `highlightEvent` finds
  only what's still drawn (a permanent, a stack entry, your hand, a player's panel). It could
  open the zone the card went to instead.
- **The sounds are synthesised placeholders** (`game/sound.ts`, Web Audio tones): licence-free
  and download-free, but plain. Real samples could replace them cue for cue.

## Tooling / docs

- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
- **CI's fuzzer reaches three quarters of the pool.** CI's 38 fixed seeds put 3,904 of the
  5,369 deckable cards in some deck. The other quarter is never fuzzed in CI, only locally,
  where 150 two-player seeds reach all but 46. Either raise CI's game counts (about 60
  two-player seeds for 87%, roughly double the fuzz time), or start each run at a different
  seed so that successive runs sweep the whole pool.
- **Eminence is cited as rule 702.106**, which is Hidden Agenda: `abilities.ts`
  (`fromCommandZone`), `cards/define.ts`, `game.ts` and `eminence.test.ts`. Eminence is an
  ability word (rule 207.2c), with no rule of its own; the cards' text is what works. Likewise
  "a delayed ability chooses no new targets" is cited as 603.7d, which is about its source and
  controller: its captured objects aren't targets because its text doesn't say "target". That
  citation is in AUTHORING §6, `effects.ts`'s `delayed-trigger`, `game.ts` (three places),
  `state.ts` and `target-polarity.ts`.

## Code health

- **Saved-deck migrations.** `client/src/deck-builder/decks.ts` rewrites two old shapes every
  time it reads saved decks: a lone `commander` (from before Partner pairs) and a card held under
  its flavor name (Princess Sarah, renamed 2026-09-16; `nameForFlavorName`). Neither rewrite is
  saved, so an old deck needs them until it's next edited. Write each migrated deck back once,
  then drop both.
- **Vocabulary built ahead of any card.** Effect, trigger, condition, filter and replacement
  pieces, plus optional fields, built before any card used them. Keep them for the cards they
  were built for, but review the first card that uses each. The list is in
  `neededCards-features.md`, "Built ahead", measured 2026-09-25 and now stale: about ten of its
  pieces have cards since (`day-night`, `gain-control-all`, `notColors`, `sharesCardTypeWith`,
  `xInManaCost`, `cardTypeCount`, `goadedForGame`, the `player-counters` condition, `{ sum }`,
  …), so recount it. `painIfUntapped` is the one no real card can use.
- **Prohibition scans are quadratic.** `abilitiesProhibited`/`prohibitionsOn` rescan the whole
  battlefield on every call, per permanent, and `recomputeControl` rescans for control Auras per
  permanent once anything has a control effect. On a land-heavy board they were 31% of a
  profile, and turns slow down steadily. Not a hang, but the fuzzer now meets it: four-player
  seed 27 (as the pool stood on 2026-09-29) is a 182-turn game of land-heavy boards that ends
  in deck-outs and takes ~32 s, past the local 30 s default (CI's four-player pass allows
  120 s), with `abilitiesProhibited`/`prohibitionsOn` ~10% of its profile and registry lookups
  another 10%. Four-player seed 10 (2026-09-30) is another: 176 turns, ~31 s. The bots' big
  boards are the same cost seen from the search (`bot-effect-knowledge.md`, "Watching live
  games for").
- **Resolve-hatch sweep.** Convert the four remaining imperative `resolve` cards (Atarka, World
  Render; Gaze of Granite; Green Sun's Zenith; Toxic Deluge) to a declarative `effect`.
- **Tokens that attacked stay split off their stack until cleanup**, even when they come out of
  combat identical, or all get the same counter from an attack trigger: ten such Warriors are
  ten objects (and, with counters, ten board tiles) through the second main phase.
  `refoldSplitTokens` skips them because `turnHistory.attackers` counts each creature once by
  object, and a stack folded mid-turn would attack in a second combat as itself plus fresh
  tokens split off it, counted again (Windbrisk Heights, `token-stack-refold.test.ts`). Folding
  them needs the history to know a split-off token's stack already attacked — say, count only
  attackers that hadn't attacked yet this turn (`attackedThisTurn` before the declaration).
  Nothing plays differently.
