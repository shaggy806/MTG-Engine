# Engine gaps blocking the precon decks

Status: **in progress** — the implementation plan for the engine work that
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

### Phase A — small self-contained primitives (15 cards)

Each of these is a narrow addition to an existing vocabulary, independently testable, and
none touches the target system.

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

The reveal-from-hand land is the one with a rules wrinkle: the card says "you **may**
reveal", and declining is never beneficial except as hidden-information management, which
the engine doesn't model anywhere. It reveals automatically when it can, and that is
recorded as a deliberate simplification rather than left to look like an oversight.

### Phase B — the target system (~17 cards)

The two biggest unlocks, and the reason this phase is its own thing: both touch
`target.ts` / `targeting.ts` / `castSpell` / `activateAbility` / `legalActions`, and doing
them together avoids threading the same call sites twice.

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

### Phase C — granted and new triggers (5 cards)

| gap | cards |
|---|---|
| grant a triggered ability (statically, and until end of turn) | Tyrant's Familiar, Hunter's Prowess, Hunter's Insight |
| "becomes the target of a spell/ability an opponent controls" trigger | Thunderbreak Regent, Tectonic Giant |

### Phase D — the ten named mechanics (18 cards)

Amass (6), damage doubling (2), and one each of Goad, Boast, Undying, Populate,
Undergrowth, Fear/Intimidate, landcycling/typecycling, Encore. Encore depends on phase A's
`zone: "graveyard"`; Populate and Amass are both token work and should land together.

Fear and Intimidate are evasion keywords and go in the `Keyword` union next to `menace`;
Goad is a `CombatRestriction` (it already has `must-attack`, so this is mostly "and not
you").

### Phase E — the awkward ones (17 cards)

Left late because each is a genuinely new *shape*, not an extension of one.

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
