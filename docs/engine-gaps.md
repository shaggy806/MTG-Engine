# Engine rules gaps

The detail behind `BACKLOG.md`'s "Engine rules gaps": where the engine departs from the
Comprehensive Rules (`docs/rules/`), or can't yet express something real cards need, with the
rule number, the code that does it today and the cards it blocks. `BACKLOG.md` keeps one line
per gap under the same bold title; when a gap closes, delete it in both.

- **At most 100 tokens of one stack can block.** Rule 509.1a lets the defending player block
  with any of their untapped creatures; `Game.materializeStack` wakes at most `MAX_MATERIALIZED`
  (100) tokens of a blocking stack, and the rest stay out of the combat whatever was declared (the
  client's `MEMBER_CAP` caps the block bar to match). Attacking had the same cap until 2026-10-07
  (a bug report: 336 Scute Swarms, 103 offered), fixed by a counted attacking stack
  (`attackingStackPart`: past the cap a stack attacks as one object with its count, blockers
  split off the tokens they block, and its damage is one event from that many sources).
  **Fix (outline):** a blocking stack can be counted the same way when its tokens block one-to-one
  — k tokens of one stack each blocking a token of one attacking stack is a stack of k blockers
  against a stack of k attackers, and their combat damage is damage to each stack, which the
  engine already deals to every token in it. Anything other than one-to-one (two blockers on one
  attacker) still wakes tokens up. Risk: the damage assignment and "blocked by" checks that
  assume one blocker is one object.
- **A mandatory loop throws instead of drawing the game.** Rule 104.4b (and 732.4): a loop of
  mandatory actions with no way to stop is a draw; one with an optional action isn't, and its
  player says how many times to repeat it (732.2, shortcuts). The engine has neither, only crash
  guards: `Game.runUntil` throws after `ADVANCE_BUDGET` (200,000) ticks, `prepareForPriority`
  after 1,000 settling rounds, and the server's `Room.settle` stops after `SETTLE_BUDGET`
  (10,000) hops. The bots cap a non-mana ability at `MAX_ACTIVATIONS_PER_TURN` (4, in
  `controller.ts`), so they don't run an optional loop forever; a human repeats one a click at a
  time. The server's safety net is in: `Room.settle` catches a throw from the engine (a bot's
  move runs from a timer, where it would otherwise have taken every room down) and `Room.stop`
  ends that room's game alone, publishing why (`state.stopped`, a lasting toast for every
  seat). What's left is the rules: detecting the loop (the same state and stack recurring with
  only mandatory choices) and declaring the draw, rather than stopping on an error.
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
- **Delve and convoke together on an {X} spell.** `xCost.maxX` is the better of the two alone
  (`xPlanFor`), so Chord of Calling under Teval, Arbiter of Virtue can't reach the X both would
  pay together, and its offer's convoke proof and delve ranges are each worked out without the
  other. Needs a joint plan: convoke the creatures, delve the rest of the generic.
- **The least X a top-of-library cast allows is searched only up to the mana a player can make**
  (`libraryTopMinX`, ceiling `manaCapacity`): an {X} spell that convoke or delve could pay up to
  Glarb, Calamity's Augur's mana value 4 isn't offered from the top.
- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring (Lord of the Nazgûl's
  "protection from Ring-bearers" is authored as inert on the strength of this: revisit it when
  the Ring lands), banding, Companion, snow *sources* (snow mana is generic), face-down
  permanents (morph, manifest, cloak; face-down exile is built), and text change that
  replaces words (612.2: Artificial Evolution, Mind Bend, Magical Hack, New Blood — a rework
  of the card format the user ruled not worth one cycle of cards, 2026-10-09; exchanging text
  boxes, 612.5, is built). ROADMAP's Phase 10 deferred these as large or niche. None of them
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
- **A sacrifice trigger misses its own sacrifice.** Rule 603.10a: an ability that triggers on a
  permanent being sacrificed "looks back in time", so it triggers when its own source is the one
  sacrificed. `detectTriggers` (`game.ts`) scans a departed object's own abilities only for
  `permanent-destroyed` and `permanent-left-battlefield`, not `permanent-sacrificed`, so
  Korvold, Fae-Cursed King sacrificing himself doesn't trigger his own ability today. Esoteric
  Duplicator ("whenever you sacrifice this artifact or another artifact") waits on it (batch 36).
- **A tapped-for-mana trigger adds only a fixed amount.** `Game.tappedForManaExtras` skips a
  `tapped-for-mana` trigger whose `add-mana` amount isn't a number, so a card authored with a
  count there silently adds nothing and `pool.test` doesn't catch it. Elvish Guidance ("an
  additional {G} for each Elf you control") waits on it (batch 36).
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
    then all act at once: Will of the Jeskai's wheel mode, Kwain, Itinerant Meddler. Perforating
    Artist (batch 36) is blocked on it.
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

## Latent

The engine departs from the rules here, but no pool card reaches it yet: fix each when a card
that needs it is authored.

- **Counters put as a cost skip counter replacements and prohibitions.** `putCostCounters`
  (Wall of Roots' -0/-1, Devoted Druid's -1/-1) puts them straight on. Right for "if an effect
  would put counters" (Doubling Season), wrong for one that isn't worded so (Vizier of Remedies)
  and for "counters can't be put on" (Solemnity, top 5000), which makes the cost unpayable
  (Devoted Druid's rulings).
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range.
