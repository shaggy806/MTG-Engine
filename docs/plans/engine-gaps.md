# Engine gaps blocking the precon decks

Status: **paused (2026-09-16)** — phases A–M are done; the 44 precon cards still unauthored play as
hand-picked stand-ins instead (see `precon-decks.md`'s Substitutions section, which is also the list
of what's left). Resume from there, deleting each substitution as its card lands. This was the
implementation plan for the engine work that
`docs/plans/precon-decks.md` found blocking 60 of the 286 cards in the five 2022 Starter
Commander Decks. Each phase ends with the cards it unblocks being authorable, so progress
is measurable in cards rather than in features.

Nothing here is speculative engine-building: every item exists because named real cards
need it, and each is listed with those cards. A gap nobody's decklist needs is out of scope.

## Correction to the first triage

The pass recorded in `precon-decks.md` was a text scan, and it was conservative in two
directions worth fixing before any code gets written:

- **"Up to N" in a *search* is already expressible.** `search-library` takes `min`/`max`, so
  "search your library for up to two basic land cards" is `min: 0, max: 2`. **Burnished
  Hart**, **Myriad Landscape** and **Nissa's Expedition** are authorable today and were
  never blocked. Only "up to N **target**" is a real gap.
- **Lieutenant is already expressible.** `CardFilter.isCommander` exists, so "as long as you
  control your commander" is `{ kind: "controls", filter: { isCommander: true,
  controlledBy: "you" }, atLeast: 1 }`. Of the three Lieutenant cards only **Tyrant's
  Familiar** is blocked, and on the *other* half of its text (it grants a triggered
  ability).

That moves 4 cards out of "blocked" before starting, and splits the 17-card "optional
targets" bucket into ~8 real ones plus a handful that were miscounted.

## Phases

Ordered by cards unblocked per unit of work, and by dependency — the target-system work in
phase B is the largest single change and several phase-D mechanics lean on it.

### Phase A — small self-contained primitives — **done**

Each of these was a narrow addition to an existing vocabulary, independently testable, and
none touched the target system. Fifteen cards authored: Bloodgift Demon, Stormfist
Crusader, Dragon Mage, Feed the Swarm, Aura Mutation, Hoard-Smelter Dragon, Port Town,
Game Trail, Foreboding Ruins, Fortified Village, Runehorn Hellkite, Steel Hellkite,
Cultivate, Harvest Season, Akoum Hellkite — plus Burnished Hart and Nissa's Expedition,
which the triage had wrongly listed as blocked.

| gap | shape | cards |
|---|---|---|
| a player other than you draws / discards their hand | `draw` gains `who?: PlayerScope` \| `target?`; new `discard-hand` effect | Deep Analysis, Stormfist Crusader, Dragon Mage, Runehorn Hellkite, Bloodgift Demon |
| read a target's mana value | `EffectAmount` gains `{ manaValueOf: slot }` | Feed the Swarm, Hoard-Smelter Dragon, Aura Mutation, Sunbird's Invocation |
| reveal-a-land-from-hand check land | `ReplacementSpec` gains `tappedUnlessReveal: { subtypes }` | Foreboding Ruins, Game Trail, Port Town, Fortified Village |
| ability activatable from the graveyard | `ActivatedAbility.zone` accepts `"graveyard"` (mirrors the existing `"hand"`/Channel) | Runehorn Hellkite (+ phase D's Encore) |
| "activate only once each turn" | per-object activation counter, like `loyaltyActivatedThisTurn` | Steel Hellkite |
| conditional on the trigger object's characteristics | `conditional` condition gains a trigger-object `CardFilter` | Akoum Hellkite |
| multi-destination tutor | `search-library` gains a second destination for the remainder | Cultivate |
| `search-library.max` as a live count | `max` accepts an `EffectAmount` | Harvest Season |

Three things surfaced during the work that the text-scan triage had missed, and they are
the reason this doc exists rather than a checklist:

- **Deep Analysis** needs `flashback` to carry a life cost ("Flashback—{1}{U}, Pay 3
  life"); `flashback: { cost: string }` is mana only. Still blocked, now on a named cause.
- **Myriad Landscape** needs a tutor whose finds share a characteristic *with each other*
  ("two basic land cards that share a land type"). A `CardFilter` constrains each card
  independently. Still blocked.
- **Steel Hellkite** needed three separate pieces, not one: `oncePerTurn`, per-source
  combat-damage tracking, and `{ n: "x" }` in a `CardFilter` numeric clause. Expect more
  cards to be like this — a one-line rules sentence is not one engine feature.

Also fixed along the way, found by the 4-player fuzzer rather than by any card: an
activated ability's advertised `maxX` didn't match what it could actually pay.

The reveal-from-hand land is the one with a rules wrinkle: the card says "you **may**
reveal", and declining is never beneficial except as hidden-information management, which
the engine doesn't model anywhere. It reveals automatically when it can, and that is
recorded as a deliberate simplification rather than left to look like an oversight.

### Phase B — the target system — **done**

The two biggest unlocks, and the reason this phase was its own thing: both touch
`target.ts` / `targeting.ts` / `castSpell` / `activateAbility` / `legalActions`, and doing
them together avoided threading the same call sites twice.

Cards authored: Withered Wretch, Scavenging Ooze, Cemetery Reaper, Return to Nature,
Primal Might, Hate Mirage, Ajani Caller of the Pride.

Two engine bugs surfaced that no card asked for, both of the same "`legalActions` offers
what `dispatch` refuses" family the fuzzer exists to catch:

- **Convoke.** A convoke-only-affordable spell is proved castable with a greedy allocation
  that may pay *coloured* pips with matching creatures, but the `LegalAction` carried only
  `{ candidates, maxGeneric }` — so a driver tapping those same creatures for `"generic"`
  could fail to cover the cost. The action now carries the proven allocation as
  `convoke.proof`.
- **Unfillable required slots.** `legalActions` never checked target availability, so it
  offered spells that couldn't be cast. Now it checks, and skips optional slots while doing
  it.

Three cards remain blocked on named causes rather than being approximated: Gravespawn
Sovereign (tapping *other* permanents as an ability cost), Rishkar (a `CardFilter` can't
ask "has a counter on it"), Haven of the Spirit Dragon (mana provenance, phase F).

**B1 — target a card in a graveyard.** Today's only graveyard-targeting spec is the narrow
`"instant-or-sorcery-in-your-graveyard"`. Needs a general family (`"card-in-a-graveyard"`,
`"creature-card-in-a-graveyard"`, `"creature-card-in-your-graveyard"`, and a filtered
variant), plus the effects that consume them — exile a targeted graveyard card, and put one
onto the battlefield under *your* control (which is also the first time anything reaches
into another player's graveyard, called out in AUTHORING §15).

Unblocks: Withered Wretch, Scavenging Ooze, Cemetery Reaper, Return to Nature,
Gravespawn Sovereign, Rakshasa Debaser, Haven of the Spirit Dragon, Cruel Revival,
Loaming Shaman.

**B2 — optional target slots.** A declared slot can't be left empty: `castSpell` /
`activateAbility` throw unless the chosen count exactly matches the `TargetSpec[]` length.
The plan is to let a spec be marked optional and let `Action.targets` carry a hole for it,
with `legalActions` offering the skip explicitly so a driver (and the bot's
`candidateActions`) can see it. Rule 608.2b matters here: a spell with *some* legal targets
still resolves, doing as much as it can.

Unblocks: Hate Mirage, Drakuseth, Primal Might, Cruel Revival, Ajani Caller of the Pride,
Rishkar, Sylvan Reclamation, Profane Command.

Touches the client too — the targeting UI in `App.tsx` needs a "done / skip" affordance —
so it is the one phase with a browser-verification step at both table sizes.

### Phase C — granted and new triggers — **done**

| gap | cards |
|---|---|
| grant a triggered ability (statically, and until end of turn) | Tyrant's Familiar, Hunter's Prowess, Hunter's Insight |
| "becomes the target of a spell/ability an opponent controls" trigger | Thunderbreak Regent, ~~Tectonic Giant~~ |

Four of the five authored. **Tectonic Giant** stays blocked on its *other* half
(impulse draw, phase E) — the trigger it needed now exists.

Two things worth carrying forward:

- **Indexing is the hard part of granting a triggered ability**, not the grant.
  `PendingTrigger.abilityIndex` and the stack object both carry an index into the ability
  list, so granted abilities append *after* printed ones and all four by-index readers
  (`detectTriggers`, `stackAbilityOf`, the intervening-if recheck, `placeTrigger`) had to
  move onto one `effectiveTriggered` list. Missing one fires a granted ability and resolves
  a different one.
- **"Defending player" is not "an opponent"** at a 3-4 player table, which is the format
  these decks are for. Tyrant's Familiar got a real
  `"creature-defending-player-controls"` spec rather than the two-player-only
  approximation, which meant giving `TargetSource` the source's own id.

Lieutenant needed no feature at all, as the triage predicted.

### Phase D — the ten named mechanics — **mostly done** (19 cards)

Landed across three passes: **Lieutenant** (3 cards — needed no feature at all,
`CardFilter.isCommander` already said it), **Amass** (6), **Fear/Intimidate**, **Undying**,
**Boast**, **Undergrowth**, **landcycling**, **Populate**, and **damage doubling** (2).
Rishkar came along for free once `CardFilter.counters` existed.

Findings worth keeping:

- **"Double" was two unrelated mechanisms.** Unleash Fury is a one-shot `modify-pt` adding
  the creature's own power; Dictate of the Twin Gods is the engine's first *symmetric,
  global* replacement, doubling damage from anyone to anyone.
- **Undying can only be answered from last-known information.** Its "if it had no +1/+1
  counters on it" is checked once the card is already in a graveyard, and `moveObject`
  clears counters on every zone change — hence `GameObject.lastKnownCounters`.
- **Amass is one effect, not a sequence.** "An Army you control" has to resolve to the
  *same* object every time or repeated amassing wouldn't grow one creature.
- **Two choice-simplifications** are recorded rather than hidden: populate copies the
  largest creature token instead of asking, matching `proliferate`'s existing compromise.

**Deferred to phase E: Encore and Goad.**

*Encore* (Rakshasa Debaser, Kangee's Lieutenant) needs roughly five new mechanisms for two
cards — a token copy per opponent, an attack requirement aimed at a *specific* player,
sacrifice-at-next-end-step (not the existing exile-at-end-step), plus each card's other
blocked half: "defending player's graveyard" as a target scope, and a `CardFilter.attacking`
clause. That is a phase-E-shaped job, not a mechanic bolt-on.

*Goad* (Geode Rager) is the same story in miniature: it needs per-object "goaded by X until
X's next turn" state plus a must-attack-but-not-the-goader requirement, which is the same
player-directed attack requirement Encore wants. The two should land together.

### Phase E — the awkward ones — **done** (21 cards)

Left late because each is a genuinely new *shape*, not an extension of one. Done in full
rather than cherry-picked: these mechanics are common in real Commander well beyond this
handful of decks, which the precon card-counts badly undersell.

Landed across seven passes: optional costs during resolution (5 cards), punisher clauses
(3), **impulse draw** (3), **Goad + Encore** (3), inverse sacrifice and flashback-with-life
(2), "as this enters, choose …" (2), and tapping permanents as a cost plus `{X}` in a
`may` cost (3).

Bugs this phase surfaced that predated it, all found by tests rather than by cards:

- `"any-target"` falls through to `"creature-or-player"` in the target switch; a new case
  landed between them and broke 42 tests at once.
- A non-Aura **permanent control change didn't stick** — layer 2 reverted it to the owner
  every state-based-action pass, so `gain-control` with `untilEndOfTurn: false` silently
  undid itself. Now `GameObject.controlledByEffect`.
- `whyCannotCastSpell` computed the cost without the cast-variant flag, so an alternative
  cost was checked against the full mana cost and never offered.

### Phase E — original scope

| gap | cards |
|---|---|
| "you may pay {cost}. If you do, …" during resolution | Nihil Spellbomb, Flameblast Dragon, Spit Flame, Liliana's Devotee, Dawn of Hope, Mentor of the Meek, Sephara |
| "unless that player sacrifices / pays" (punisher) | Kazuul, Indulgent Tormentor, Demanding Dragon |
| cast from exile / impulse draw | Theater of Horrors, Dream Pillager, Tectonic Giant |
| choose a mode or colour as it enters, then behave as it | Frontier Siege, Heraldic Banner |
| "chooses up to N, sacrifices the rest" | Archfiend of Depravity |
| alternative cost that taps creatures | Sephara, Sky's Blade |

`may { effect, prompt }` already exists for a free optional effect; phase E's first row is
that with a cost attached, which is why those seven cluster.

### Still blocked — four cards, recorded rather than approximated

| card | why |
|---|---|
| Loaming Shaman | "any number of target cards" — a genuinely variable target *count*, not a fixed number of skippable slots |
| Myriad Landscape | two finds that must **share a land type with each other**; a `CardFilter` constrains each card independently |
| Sunbird's Invocation | cast free from among revealed cards |
| Haven of the Spirit Dragon | mana provenance — phase F |

None of these recurs the way impulse draw or Goad does, and each needs a mechanism of its
own. They stay unauthored and their deck slots get an explicit substitution.

### Phase F — decide, don't assume (2 cards)

**Mana provenance** ("spend this mana only to cast a Dragon spell", "you don't lose this
mana as steps end") is called out in AUTHORING §15 as unmodeled and would mean tracking
provenance on individual units of mana through `ManaPool` and the auto-payer — a
disproportionate change for **Haven of the Spirit Dragon** and **Savage Ventmaw**.

The intended outcome is that these two stay unauthored and their deck slots get an
explicit, recorded substitution, rather than the engine growing a feature two cards need.
That is a decision to take when the phase is reached, not now.

## Ground rules

- Every phase lands as its own commit with tests, and the cards it unblocks are authored in
  the same pass so the feature is exercised by real cards immediately rather than only by
  its own test.
- `AUTHORING.md` §15 is updated in the same commit that closes a gap — that section is the
  authoring contract and a stale entry there costs more than the feature saves.
- A card that can't be done faithfully stays unauthored and is recorded here. No silent
  approximations; `precon-decks.md` says why.

---

## Phase G — Draconic Destruction (done)

The first precon authored end to end: **33 missing cards down to 5**. 26 went in on today's
vocabulary plus five small additions, and Mordant Dragon fell out of two genuine engine bugs
rather than a missing feature.

| addition | card | note |
|---|---|---|
| `tap-all { filter }` | Thundermaw Hellkite | the mirror of `untap-all`; `tap` only takes one chosen target |
| `damage-all { exceptSource }` | Harbinger of the Hunt | "each **other** creature with flying" — a `CardFilter` describes the permanent matched, not its relationship to the damage source |
| `EffectAmount` `{ countOf, times }`, and `gain-life.amount` widened to an `EffectAmount` | Shamanic Revelation | "4 life **for each** creature … with power 4 or greater" |
| `TargetSpec` `{ kind: "permanent", whose?, filter }` and `"player-or-planeswalker"` | Clan Defiance | "creature with/without flying" is the shape the string literals stopped covering; "target player or planeswalker" includes *you*, which `"opponent-or-planeswalker"` does not |
| `StaticCondition` `self-kicked` (+ `GameObject.enteredKicked`) | Verix Bladewing | a permanent spell's kicker rider is an ETB trigger, so it fires after `kicked` has died with the stack object |
| `tapLand` helper | Shivan Oasis, Timber Gorge, Kazandu Refuge, Rugged Highlands | the enters-tapped / gain-1-life common-land cycle |

### Two pre-existing bugs Mordant Dragon exposed

Both were latent: no card in the pool combined these features, so nothing had failed yet.

1. **A `deals-combat-damage-to-player` trigger auto-filled target slot 0 with the damaged
   player unconditionally.** Mordant Dragon targets "**target creature** that player
   controls", so the auto-fill was illegal and the whole trigger was dropped for "no legal
   targets". Now the auto is only supplied when slot 0 would accept it — a slot that takes
   it today still gets it, so nothing that works changes.
2. **`may` inside a triggered ability lost the trigger's context.** The decision suspends
   resolution and the modes are applied later from `AwaitingDecision`, which carried `x` and
   `targets` but not `triggerValue`/`triggerObject`. "Deal **that much** damage" read 0 and
   silently did nothing. Both now ride on the decision.

### Still blocked — five cards

| card | why |
|---|---|
| Haven of the Spirit Dragon | mana provenance ("spend this mana only to cast a Dragon") |
| Savage Ventmaw | mana provenance ("you don't lose this mana as steps and phases end") |
| Path of Ancestry | mana provenance — scry when *that mana* is spent on a matching creature spell |
| Loaming Shaman | "any number of target cards" — a variable target *count* |
| Foe-Razer Regent | a `fights` trigger, plus a delayed "at the beginning of the next end step" |

Path of Ancestry joins the phase-F mana-provenance group, which is now three cards rather
than two — still short of justifying provenance tracking through `ManaPool` and the
auto-payer. Note that the *identity* half of its mana ability is not the blocker: `arcane-signet.ts`
already models "any color in your commander's color identity" as plain `"any-color"`, which
is exact for any deck that passes `validateCommanderDeck`. The scry rider is the blocker.

**Sarkhan, the Dragonspeaker** is two-thirds authorable today (the +1 is an `animate` on
self, the −3 a plain damage effect) but its ultimate makes an emblem with two *triggered*
abilities, and `create-emblem` carries only a `StaticAbility`. Emblems live in
`GameState.emblems` rather than as `GameObject`s, so `detectTriggers` cannot see them.
That is a real, recurring gap — planeswalker ultimates are the main source of emblems and
most of them trigger — but it is a feature, not a card, and is not in this phase.

---

## Phase H — Chaos Incarnate, first pass

41 missing down to 23. This deck is markedly harder than Draconic Destruction:
where that one was mostly Dragons with clean triggers, this one is full of
"greatest mana value among", "chosen at random" and per-opponent choices.

| addition | card |
|---|---|
| `cast-spell` trigger: a `filter` on the spell, and `who: "opponent"` (which the matcher never handled — see below) | Guttersnipe, Thermo-Alchemist, Kaervek the Merciless |
| `add-mana.amount` widened to an `EffectAmount` | Mana Geyser |
| `StaticCondition` `{ kind: "not", of }` | Titan Hunter |
| `damage { toControllerOfTarget }` + `EffectApi.controllerOf` | Unlicensed Disintegration |
| `goad { who }` (a `PlayerScope` instead of one target) | Kardur, Doomscourge |
| `CardFilter.attacking` falls back to `GameObject.wasAttacking` off the battlefield | Kardur, Doomscourge |

### Three more latent bugs

1. **`cast-spell` with `who: "opponent"` never matched.** The caster check
   handled `"any"` and `"you"` only, so the spec type-checked and silently
   never fired. No card in the pool used it.
2. **`spell-cast` didn't set `triggerObject`.** So `{ manaValueOf: "trigger-object" }`
   on a cast trigger read 0 — Kaervek dealt no damage.
3. **`StaticCondition` `not` read inverted through the re-entrancy guard.**
   `staticConditionMet` keys its guard on `source.id`; a `not` recursing back
   through it hit the guard, got `false`, and negated to `true` — so every
   `not` was unconditionally satisfied. It now calls `evalStaticCondition`
   directly, since the guard exists for mutually-conditional *permanents*, not
   for a composite condition on one of them.

### Still missing from this deck — 23 cards

Grouped by what they actually need, since several share a cause:

| cause | cards |
|---|---|
| "greatest mana value among …" — a superlative over a set, not a filter | Soul Shatter, Scythe Specter |
| a count of what an effect *just did*, per player | Deadly Tempest, Reign of the Pit, Syphon Mind |
| per-opponent choices from their own graveyard | Dredge the Mire, Sepulchral Primordial |
| "chosen at random" | Explosion of Riches, Wildfire Devils |
| a repeatable mode ("choose three, you may choose the same mode more than once") | Fiery Confluence |
| variable target count | Profane Command, Loaming Shaman |
| a triggered emblem | Ob Nixilis Reignited |
| a "whenever a player draws a card" trigger | Spiteful Visions |
| a "whenever this is dealt damage" trigger | Brash Taunter |
| an "opponent discards" trigger | Sangromancer |
| mana in a *mana ability's* own cost (`manaSources` excludes these) | Rakdos Signet, Molten Slagheap |
| mana provenance | Sunbird's Invocation |
| shuffle-into-library + reveal-and-maybe-play | Chaos Warp |
| copy a spell and re-choose its targets | Wild Ricochet |
| one-off compound texts | Combustible Gearhulk, Coveted Jewel, Myriad Landscape |

**Signets are the highest-value item there.** All ten are staples, they will
recur in the remaining three decks, and the blocker is one known limitation:
`manaSources()` drops any mana ability whose activation cost contains mana, to
avoid circular payment planning. A Signet is net-neutral in count but converts
colour, so the planner would have to consider spending generic to gain
coloured. That is a real change to `planManaPayment`, not a vocabulary
addition, and it deserves its own phase.

---

## Phase I — the bulk pass (52 cards)

Triaged all four remaining decks in one go rather than deck by deck (the
`.scratch/triage.mjs` dump), which made the shape of the work obvious: a large
fraction of what was left is ordinary Magic that today's vocabulary already
covers, and the genuinely-blocked cards cluster into a dozen named causes.

Authored 52 cards for three additions:

| addition | card |
|---|---|
| `toControllerOfTarget` on `gain-life` and `lose-life`, matching the field `damage` already had | Swords to Plowshares, Undermine |
| `EffectAmount` `{ countPlayers: PlayerScope }` | Inspired Sphinx |
| (no engine change) `AffectSpec.withKeyword`, added in phase E for Sephara, turns out to be the shape most of First Flight is built on | Favorable Winds, Empyrean Eagle, Thunderclap Wyvern |

Thirteen of the 52 are the enters-tapped land cycle, one line each on
`tapLand` / `revealLand`.

### Where the five decks stand

| deck | missing |
|---|---|
| Draconic Destruction | 6 |
| Grave Danger | 22 |
| Chaos Incarnate | 23 |
| Token Triumph | 34 |
| First Flight | 37 |

122 left, from 286 at the start. What remains is concentrated in the causes
listed under phase H plus a few more the wider triage surfaced:

- **"Exile until this leaves the battlefield"** (Banishing Light, Conclave
  Tribunal) — an O-Ring, which needs a linked pair of one-shot effects.
- **"Whenever this is dealt damage"** (Brash Taunter, Hornet Nest).
- **"Whenever you attack with N or more creatures"** (Overwhelming Instinct,
  Tide Skimmer).
- **Curses** — an Aura that enchants a *player* (Curse of Bounty, Curse of
  Disturbance).
- **Devotion** (Gray Merchant of Asphodel).
- **"Creatures that died under your control this turn"** (Liliana's Standard
  Bearer) — a per-player turn counter; `creaturesDiedThisTurn` is global.
- **An `AffectSpec` scope covering *all* creatures**, not just yours
  (Gravitational Shift).
- **"Choose a creature type" on a spell's resolution** (Crippling Fear,
  Distant Melody) — `chooseOnEnter` only covers permanents entering.

The Signets remain the single highest-value item, for the reason given under
phase H.

---

## Phase J — mana converters (the Signets)

The item phase H flagged as highest-value. `manaSources()` dropped any mana
ability whose own activation cost contained mana, which made all ten Signets,
the filter lands and Molten Slagheap unauthorable. Three of the five precons
want a Signet.

A "converter" is now admitted on three conditions, all checked in
`manaSources`:

1. **The activation cost is purely generic.** A coloured one is genuinely
   circular — you'd need the colour to make the colour — and `{X}` is out
   because nothing is resolving during payment planning, so there's no X.
2. **It produces more than it costs.** A net-zero converter is never worth
   offering and would let the planner loop.
3. **It's ordered last.** `planManaPayment` sorts converters behind every
   ordinary source, so a board with none of them takes exactly the path it
   took before this existed — which is why all 857 existing tests passed
   unchanged.

Funding is the interesting half. `openFunded` opens a converter tentatively
and covers its cost from other sources; on failure it rolls the entry back
and the caller moves on, so an unfundable Signet leaves no trace. The funding
draw (`coverGenericFrom`) excludes the converter itself and every other
converter — that's what bounds the recursion — and prefers a source whose
colour the cost doesn't want. That last preference is not a nicety: two
Islands, two Swamps and an Azorius Signet pay `{3}{W}{U}` only if the Signet's
`{1}` comes from a Swamp. Funding it from an Island strands the `{U}` and the
whole plan fails.

The plan emits converters last and `useManaSource` spends the converter's own
cost from the pool before adding its output, so the ordering guarantee is what
makes the payment work at execution time, not just at planning time.

**What the fuzzer caught here**, and the reason a `ManaPlanStep` records
`spends: ManaType[]` rather than a bare count: paying a converter's `{1}` as
"one generic" is colour-blind, and it can eat a colour the spell still needs.
Two Islands, two Swamps and an Azorius Signet paying `{3}{W}{U}` underflowed —
the plan promised the `{U}`, then the Signet's own payment took it back out of
the pool. Each converter now records the exact unit every funding source gave
it and spends that back verbatim. Unit tests missed it; 200 random games found
it in under a minute.

Still unmodeled: a *coloured* activation cost, and Selvala, Heart of the Wilds
(blocked on its output, not its cost).

Shipped alongside: the three Signets the precons want (Azorius, Dimir, Rakdos,
via a `signet` helper) and ~25 more cards, plus `modify-pt-all { exceptSource }`
— the same clause `damage-all` already had, for Steel-Plume Marshal's "**other**
attacking creatures you control with flying", which is itself one.

101 of the original 286 cards remain.

---

## Phase K — the third pass (44 cards)

286 → 66. Additions, each tied to the cards that wanted it:

| addition | cards |
|---|---|
| `create-token { tapped }` | Army of the Damned, Necrotic Hex, Overseer of the Damned |
| `CardFilter.notSubtypes` | Cruel Revival |
| `filter` on a `deals-combat-damage-to-player` trigger | Sharding Sphinx |
| `TargetSpec` `"creature-attacking-you"` | Soul Snare |
| `dealt-damage` trigger (the receiving end, with `triggerValue` = the amount) | Brash Taunter, Hornet Nest |
| `attack-with { atLeast, filter? }` trigger, off a new `attackers-declared` event | Overwhelming Instinct, Tide Skimmer |
| `exile { untilSourceLeaves }` + `return-exiled-by-source` + `GameObject.exiledBy` | Banishing Light, Conclave Tribunal |
| `discards { who }` trigger | Sangromancer |

Three things worth recording about *how* these landed:

**Tapped tokens are never stacked.** A token stack carries one `tapped` flag
for the whole stack and `findMergeableStack` has no notion of tapped-ness, so
a tapped batch would fold into an untapped stack and come out untapped.
Army of the Damned makes thirteen real objects, which is well inside what the
battlefield handles.

**`attack-with` needed a new event.** "Whenever you attack with three or more
creatures" can't be read off `attacker-declared`, which fires per attacker —
the same reason `attacked-alone` exists. `attackers-declared` is emitted once,
with the whole list, after the declaration is known.

**The O-Ring is rule 720.2's two halves, not one bespoke effect.** The card
carries an `enters-battlefield` trigger that exiles with `untilSourceLeaves`
and a `leaves-battlefield` trigger that returns what it took. `moveObject`
clears `exiledBy` on any zone change, so a card that leaves exile some other
way is no longer linked, and a token never comes back (rule 111.7).

### One limitation this pass added rather than removed

A **mana ability with a `tapOthers` cost** (Jaspera Sentinel, Holdout
Settlement) is excluded from `manaSources()`. `useManaSource` taps only the
source, so offering these to the auto-payer would hand out the mana without
paying for it — strictly better than the printed card. They stay activatable by
hand, which floats the mana; the card is inert during auto-payment rather than
wrong. Fixing it properly is the same shape as the converter work in phase J,
with creatures instead of mana.

A second, smaller divergence: a `discards` trigger fires once per discard
*event* rather than once per card, because `cards-discarded` carries the whole
batch. It only shows on a multi-card discard, and it undercounts rather than
over.

Also dropped: **Distant Melody** and **Crippling Fear** want "choose a creature
type" as a *spell* resolves. `chooseOnEnter` only covers permanents entering.

---

## Phase L — the fourth pass

286 → 59. Six more additions:

| addition | card |
|---|---|
| `search-library { who: { controllerOfTarget } }` | Path to Exile |
| `EffectAmount` `{ devotionTo }` (rule 700.5) and `{ product }` | Gray Merchant of Asphodel |
| `PlayerState.creaturesDiedThisTurn` — the per-player counterpart of the global one | Liliana's Standard Bearer |
| `AbilityCost.discardHand` | Slate of Ancestry |
| `modify-pt-all` / `untap-all` `{ controlledByTarget }` | Great Oak Guardian |
| `EffectAmount` `{ opponentsControllingFewer }` | Voice of Many |

Two of these are worth naming as *shapes* rather than one-offs:

- **`{ product: [...] }`** is how compound amounts compose without every
  individual amount growing a multiplier. Gray Merchant's "life equal to the
  life lost this way" is devotion × opponents, and neither factor is static.
- **`controlledByTarget`** names a *seat*. A `CardFilter`'s `controlledBy`
  only distinguishes "you" from "opponent", which is enough in a duel and not
  enough at a four-player table — "creatures **target player** controls" has
  to point at one of three opponents.

### What the 59 still want

Unchanged from the phase-H/K lists, minus what's been done. The largest
remaining groups:

- **Choose a creature type as a spell resolves** — Crippling Fear, Distant
  Melody. `chooseOnEnter` only covers permanents entering.
- **Curses** — an Aura that enchants a *player* (Curse of Bounty, Curse of
  Disturbance).
- **Cast-from-a-graveyard permissions** — Gisa and Geralf, Havengul Lich,
  Liliana Untouched by Death, Scourge of Nel Toth.
- **Superlatives over a set** ("greatest mana value among …") — Soul Shatter,
  Scythe Specter.
- **Counting what an effect just did, per player** — Deadly Tempest, Syphon
  Flesh, Syphon Mind, Reign of the Pit.
- **Randomness** — Explosion of Riches, Wildfire Devils.
- **Triggered emblems** — Ob Nixilis Reignited (and Sarkhan, from phase G).

---

## Phase M — the fifth pass (mostly First Flight)

286 → 52. Eight additions, again one card each:

| addition | card |
|---|---|
| `AffectSpec` scope `"all-creatures"` (+ `withKeyword` / `withoutKeyword`) | Gravitational Shift |
| `StaticAbility.grantPtPerCount` | Skycat Sovereign |
| `StaticAbility.noMaxHandSize` | Thought Vessel |
| `put-on-bottom-of-library` and `EffectAmount` `{ toughnessOf }` | Condemn |
| `AbilityCost.exileSelf` | Hanged Executioner |
| a `blocks` trigger (the mirror of `attacks`) and `CardFilter.blocking` | Kangee, Sky Warden |
| `attack-with { attackingYou }` | Ever-Watching Threshold |

Two notes on getting these *right* rather than merely working:

**Ever-Watching Threshold nearly shipped over-triggering.** Written as an
`attacks` trigger with `attackingYou`, it would have drawn one card per
attacking creature; the card draws one per *attack*. `attack-with` already
fires once per declaration, so it only needed an `attackingYou` clause of its
own — which is exact.

**`put-on-bottom-of-library` needed no index arithmetic.** Index 0 is the
library *top* (that's what `drawCard` takes) and `moveObject` pushes onto the
end, so a plain move already lands on the bottom — the same thing
`applyPutOnBottom` relies on for mulligans. The first draft spliced the card
to index 0, i.e. exactly the wrong end.

**Skipped: Moorland Haunt.** "Exile a creature card from your graveyard" as an
activation cost needs a real *choice* of which card, and which one you keep
matters for the rest of the deck. Auto-picking would be an unchosen decision,
so it stays unauthored.
