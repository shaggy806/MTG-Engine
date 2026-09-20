# Engine feature backlog

This file tracks engine-feature gaps found by cross-referencing real card text
against the current vocabulary. Two workstreams have fed it:

1. **`neededCards.txt`** (P0-P20, below) — two curated precon decks, ~170
   cards. **Effectively done.** Full narrative detail for each pass lives in
   git history (`git log --oneline -- engine/src/cards/neededCards-features.md`)
   and in the commits themselves — this file only keeps the compact record.
2. **The EDH-popularity backlog** (current focus) — `top-commander-cards.txt`
   (top 2000 Commander cards by EDHREC rank, cross-referenced against
   `cards/pool/`) and `top-commander-cards-flagged.txt` (a heuristic screen
   over that list — see `engine/scripts/top-commander-cards.mjs` and
   `flag-problematic-cards.mjs`) flag cards that likely need a feature this
   engine doesn't have yet. This section ranks those features by how many
   flagged cards each would unblock.

   **Refresh the `[x]` marks with `npm run cards:mark -w engine`** after
   authoring. That re-marks in place against the current pool and leaves the
   EDHREC ranking snapshot alone, so this file's correspondence with it holds;
   a full re-fetch would move the roster underneath it.

Read `cards/AUTHORING.md` before authoring any card; it's the field-by-field
reference. This file is a priority list, not a how-to.

---

## Next: EDH-popularity feature backlog

Derived from `top-commander-cards-flagged.txt` (264/2000 not-yet-implemented
cards flagged, regenerate with `node scripts/top-commander-cards.mjs --count
2000 --cache-json <path>` then `node scripts/flag-problematic-cards.mjs
<path>`). Ranked by cards unblocked; a feature that unblocks another is noted.

### Tier 1 — build these first (highest rank-weighted impact)

| # | feature | cards | headline examples | what it needs |
| --- | --- | --- | --- | --- |
| 1 | **Channel** — DONE | 4 shipped | **Boseiju** (#76), **Otawara** (#88), **Takenuma** (#244), **Eiganjo** (#382) | `ActivatedAbility.zone: "hand"` (activatable only from hand; discarding the source is an implicit, unconditional part of the cost — it still goes on the stack like any other activated ability, rule 702.51a) + `ActivatedAbility.costReduction` (a live-count discount printed on the ability itself, mirroring `selfCostReduction`). Reused the existing activated-ability/stack machinery almost entirely — `stackAbilityOf`'s existing "source vanished, fall back to `def.activated[index]`" path (rule 608.2b) already covers a discarded source with zero changes. Also needed two new `TargetSpec`s (`attacking-or-blocking-creature`, `artifact-enchantment-or-nonbasic-land-an-opponent-controls`) and `CardFilter.typesAnyOf` (an OR of card types, mirroring `subtypes`). Boseiju's "that player may search their library..." clause was dropped — it needs a `may`/`search-library` decision made by a *different* player than the effect's controller, a real gap no other card needs yet. `channel.test.ts`. |
| 2 | **Overload** — DONE (3 of the 6 shipped) | 3 shipped | **Cyclonic Rift** (#54), **Vandalblast** (#101), **Damn** (#346) — **Mizzix's Mastery**, **Eldritch Immunity**, **Winds of Abandon** still TBD (a different effect shape each, not just more overload plumbing) | `CardDefinition.overload: { cost, effect }` — a `cast-spell` variant enumerated alongside the base cast (mirrors kicker's fan-out, but *replaces* the mana cost instead of adding to it, and always takes zero targets, rule 702.126a). New `return-to-hand-all` `EffectSpec` (mirrors `destroy-all`) for Cyclonic Rift; Vandalblast/Damn reused `destroy-all` as-is. Also needed two new `TargetSpec`s for the *unkicked* modes to stay faithful to real text ("target artifact/nonland permanent **you don't control**"): `artifact-an-opponent-controls`, `nonland-permanent-an-opponent-controls`. **Fuzzer caught a real bug**: `RandomController`'s `castExtras` forwarded `kicked` but not `overload`, so it built a targetless overload cast without the `overload` flag — `whyCannotCastSpell` then validated it against the *unkicked* target specs and threw. Fixed in `controller.ts`; client `App.tsx` wired the same way as the kicker fan-out (an "(overload {cost})" button alongside "Cast"). `overload.test.ts`. |
| 3 | **Conditional free-cast** — DONE (3 of the cycle shipped) | 3 shipped | **Fierce Guardianship** (#83), **Deadly Rollick** (#107), **Flawless Maneuver** (#181) — **Deflecting Swat** still TBD; **Etali, Primal Storm** is a *different* mechanic (see below) | `CardDefinition.freeCastIf: { condition: StaticCondition }` — reuses the exact `StaticCondition` union `StaticAbility`/`TriggeredAbility`/`ActivatedAbility.condition` already read (its fourth consumer), gated the same way `selfCostReduction` gates a cost discount, just zeroing the cost instead of reducing it. Unlike `overload`, targets/effect are completely unchanged — only the cost differs — so no target-spec or resolution-branch change was needed at all, just cost-string + affordability-check + enumeration plumbing (mirrors `overload`'s "extra `cast-spell` variant" shape). New `CardFilter.isCommander` for "if you control a commander" (fed into the existing `"controls"` condition kind). **Deflecting Swat** ("choose new targets for target spell or ability") needs two real, unbuilt primitives — a `TargetSpec` that can target a stack *ability* object, not just a spell, and a "change the target of a spell/ability on the stack" effect (no redirect/retarget effect exists) — dropped, documented in the card file. **Etali, Primal Storm**'s "exile the top card of each player's library, then cast any number of them without paying their mana costs" is a bigger, different primitive (multi-card, multi-player impulse + free-cast-any-number, an extension of the cascade-family `castCardWithoutPaying` core) — separate future work. `free-cast.test.ts`. |
| 4 | **"Double"** — DONE (3 of the 6 shipped) | 3 shipped | **Kalonian Hydra** (#1119, errata'd off Double Strike onto this), **Bristly Bill** (#921), **Unnatural Growth** (#444) — **Twinflame Tyrant**, **Solphim, Mayhem Dominus**, **Gisela, Blade of Goldnight** are a *different* mechanic (see below) | Real Oracle text split Scryfall's single "Double" keyword tag into two genuinely different mechanics. **Shipped**: two new one-shot mass `EffectSpec`s — `double-counters-all { filter, counterKind }` (reads each matching permanent's own current count of that counter kind and adds that many again, routed through the existing `addCounter` so Doubling Season's *replacement* multiplier still composes on top — ruling-correct 3x, not 4x, per real Magic rulings) and `double-pt-all { filter, duration }` (reads each matching permanent's own current *computed* power/toughness individually — a 2/2 and a 5/5 both matching become a 4/4 and a 10/10, not a shared amount like `modify-pt-all` — filling a gap this doc had flagged since P16's dropped World War Hulk chapter III). **Not this feature — a different, unbuilt mechanism**: Twinflame Tyrant / Solphim / Gisela's "if a source you control would deal damage to an opponent, it deals double that damage instead" is a *continuous replacement* on damage events (rule 615-adjacent, the Furnace-of-Rath/Fiery-Emancipation family), not a one-shot effect — `replacements.ts` has no damage-multiplier `ReplacementSpec` kind at all today. Real future work, likely higher-value than the one-shot pass just shipped given how common damage-doublers are in the format, but a separate build. `double.test.ts`. |
| 5 | **Convoke** — DONE (1 of the 4 shipped) | 1 shipped | **Hour of Reckoning** (#1030) — **Chord of Calling** (#521, has `{X}`), **Clever Concealment** (phasing), **City on Fire** (damage-tripling replacement) still TBD | `CardDefinition.convoke: boolean` — a pure payment-*method* choice made as the spell is cast (`Action.convoke: ConvokePayment[]`, each `{creature, pays: "generic" | Color}`), left orthogonal to the existing `payMana`/`planManaPayment` mana-source machinery entirely rather than folded into it: the chosen convoke payments reduce the computed `ManaCost` directly (`reduceCostByConvoke`) *before* `payMana` runs on the remainder, so no `ManaSource`/`ManaOption` change was needed at all. Validated by a new `whyCannotConvoke` (untapped, a creature, one of its own colors or generic, and never more payers of a kind than the cost has left of it). Unlike `overload`/`free`, a convokable spell is **not** enumerated as a second `cast-spell` variant — `LegalAction` just carries `convoke: { candidates, maxGeneric }` (every untapped creature the caster controls, plus the cost's generic amount as a safe upper bound for an all-generic allocation) on its one entry, and `castSpellActions` falls back to a greedy `maxConvokeFor` proof (colored pips first, then generic) to decide whether an otherwise-unaffordable spell becomes castable at all before listing it. `RandomController` always convokes for `"generic"` (it has no registry access to read a candidate's colors) — colored-payment is only exercised directly in `convoke.test.ts`, not by the fuzzer. **Not wired into the client**: `Chord of Calling`'s `{X}` interacts with `maxAffordableX` (mana-only, convoke-unaware) in a way that would need real rework to get right, and no card without an `{X}` cost needed it, so it and any client convoke UI (a multi-select of creatures + per-creature color choice — a bigger UI investment than the kicker/overload/free button pattern) are left as follow-up work; a convokable spell today is castable only by the engine's own controllers (`ScriptedController`/`RandomController`), not through the web client. `convoke.test.ts`. |

### Tier 2 — solid value, smaller or more speculative

- **Spree** (7 cards: Return the Favor, Three Steps Ahead, Great Train Heist) — a modal spell where each chosen mode carries its own *additional* cost, unlike `castModal`'s single shared cost. Extend `CardDefinition.castModal` with a per-mode `additionalCost?`.
- **Class enchantments** (6 cards, `layout:class`: Wizard Class, Cleric Class, Druid Class) — a leveling permanent with rank-gated ability tiers, paid up incrementally. New card shape, closer to a Saga than anything else, but with a pay-to-advance cost per rank instead of a free per-turn chapter.
- **Changeling** ("this card is every creature type," 6 cards: Realmwalker, Morophon, Mirror Entity) — a continuous "has all creature types" characteristic, checked by every `subtype`/`subtypes` `CardFilter` clause. Layer 4/6 addition to `characteristics.ts`.
- **Magecraft** (4 cards: Storm-Kiln Artist, Archmage Emeritus, Veyran) — a `cast-spell` trigger narrowed to instant-or-sorcery *and* firing again on a copy, not just a cast. `TriggeredAbility.trigger.cast-spell` needs an `instantOrSorceryOnly?` flag and a `copy-spell` hookup.
- **"Defending player" scope** (unblocks Annihilator's real gap, 4 cards: Kozilek, Ulamog, Artisan of Kozilek) — `PlayerScope` only has `each-player`/`each-opponent`/`you`; an `attacks` trigger's payload needs to target *the specific player being attacked*, which matters once 3-4 player tables are in play (an `each-opponent` sacrifice would incorrectly hit every opponent, not just the one being attacked).

### Tier 3 — real but niche, or a big lift for a small current payoff

- **Station** (7 cards, mostly newest-set/low-rank: Exploration Broodship, Evendo, Uthros) — a whole new subsystem (a permanent sub-type + counter-threshold-gated text tiers, keyed off what's tapped to fund it). Large build, currently low return — revisit once more Station cards enter the format.
- **Discover** (4), **Evoke** (4), **Reconfigure** (3) — each a distinct, self-contained alt-cast/alt-ability shape; none shares much with the others or with Tier 1/2. Cherry-pick opportunistically.
- **Phasing** (8 cards, headlined by **Teferi's Protection** at #109) — explicitly out of scope per this file's parent (CLAUDE.md's "Not modeled" list). High-profile but a genuinely large state-machine addition (a whole not-really-a-zone permanent status); revisit only as a deliberate scope change, not opportunistically.
- **Dungeons/Initiative** (3), **Backgrounds** (3), **Vehicles/crew** (2), **split/aftermath layout** (4), **Battle cards** (2) — each explicitly out of scope already; low card counts in the top 2000 confirm they're not worth a scope change yet.

### False positives in the flagged screen — no engine work needed

**Partner**, **Affinity**, and **Constellation**-style ability words were
flagged only because Scryfall tags them as a named "keyword," not because the
underlying mechanic is missing — Partner is a shipped Commander feature,
Affinity is exactly `selfCostReduction.reduceGeneric: { countOf }` (P19), and
Constellation is an ordinary filtered `enters-battlefield` trigger. Fixed in
`flag-problematic-cards.mjs`'s allowlist so they no longer appear in
`top-commander-cards-flagged.txt`. Expect more of these among the one-off
"ability word" keywords still in the file's raw output (Alliance, Addendum,
Raid, Spectacle, Morbid, Coven, Delirium, ...) — most describe a
`StaticCondition`-gated trigger; a few (Delirium's 4+ card types, Coven's 3+
distinct powers, Morbid/Raid/Spectacle's "did X happen this turn") need a new
`StaticCondition` *kind* (cheap per-condition, no framework change), which
is worth doing as a batch once a few concrete cards call for it rather than
one at a time.

### Recommended build order

1. ~~**Channel**~~ — **done** (Boseiju, Otawara, Takenuma, Eiganjo).
2. ~~**Overload**~~ — **done** (Cyclonic Rift, Vandalblast, Damn).
3. ~~**Conditional free-cast**~~ — **done** (Fierce Guardianship, Deadly Rollick,
   Flawless Maneuver).
4. ~~**"Double"**~~ — **done** (Kalonian Hydra, Bristly Bill, Unnatural
   Growth). Damage-doubling (Twinflame Tyrant / Solphim / Gisela) is a
   separate, unbuilt replacement-effect mechanism — see the table above.
5. ~~**Convoke**~~ — **done** (Hour of Reckoning). Turned out not to need
   `payMana`/`planManaPayment` changes at all — convoke payments reduce the
   `ManaCost` directly before the mana-source machinery ever sees it, so the
   "biggest lift of the five" framing above didn't hold up against real
   Oracle text. Chord of Calling (`{X}` + convoke) and client UI are follow-up
   work — see the table above.

**Tier 1 is complete.**

---

## Tier 1b — the primitives the keyword screen missed

Re-measured against a fresh top-2000 pull once the `[x]` marks were fixed
(they had been badly stale — 111 reported, 329 real). The result overturned
this file's Tier 2 ordering: the biggest blockers are not named keywords at
all, they are small, unglamorous *primitives* that a keyword screen can't see
because no keyword names them. Counting unimplemented top-2000 cards whose
Oracle text needs each:

| feature | cards blocked | status |
| --- | --- | --- |
| **delayed triggered abilities** (rule 603.7) | 31 | **DONE** |
| **put a card on top of a library** | 18 | **DONE** |
| **put a card from your hand onto the battlefield** | 20 | **DONE** |
| **additional cost that isn't a sacrifice** (discard / pay life / pay X life) | 11 | **DONE**; "A **or** B" (Bitter Triumph #840) still open |
| more `StaticCondition` kinds | 10 | **Mostly done** — `delirium` added; morbid and threshold turned out to exist already. Coven and Raid still open, and neither has a card the rest of whose text is expressible |
| unbounded targeting ("any number of target …") | 11 | **Deliberately deferred** — see below |

For comparison, the Tier 2 keywords below block 4-9 cards each. Measure before
picking the next one: `node scripts/top-commander-cards.mjs --count 2000 --out
<throwaway> --cache-json <path>` gives current Oracle text for the whole list
without touching the checked-in snapshot.

### Delayed triggered abilities — DONE (31 cards unblocked)

`GameState.delayedTriggers` + a `delayed-trigger` effect. A delayed ability
belongs to no permanent, which is exactly why `detectTriggers` (a scan over
battlefield permanents) can't see it — `enterStep` fires them instead, minting
a stack object that carries the whole `DelayedTrigger` record because there is
no card ability for `stackAbilityOf` to find by index.

It chooses no new targets (rule 603.7d), so it carries forward the targets the
creating effect had and refers to them by slot exactly like any other effect —
which is what let `delayed-trigger` reuse the entire effect vocabulary for
free. `controller: { controllerOfTarget }` hands the ability to someone else
(Arcane Denial's "**its controller** may draw up to two cards"), which is the
only part that needed anything new.

Separately, `create-token` / `create-token-copy` gained `sacrificeAtEndStep`
alongside the existing `exileAtEndStep`: a delayed ability can't name a token
that didn't exist when it was set up, and "sacrifice them at the beginning of
the next end step" is a whole family of its own (Kiki-Jiki, Chandra, The Fire
Crystal, Voice of Victory). It reuses Encore's per-object flag.

Shipped: **Whip of Erebos** (#713), **Arcane Denial** (#53), **Kiki-Jiki,
Mirror Breaker** (#1247), and the clause Chandra, Acolyte of Flame had been
dropping. `delayed-triggers.test.ts`.

### Unbounded targeting — scoped, and deliberately not built

The headline count is misleading. Of the 11 cards, only four are unblocked by
variable-arity targeting *alone* — Mindbreak Trap (#544), Eerie Interlude
(#971), Priest of Forgotten Gods (#1396), Deepglow Skate (#1829). The rest are
blocked on something else regardless: phasing (Clever Concealment), a d20 roll
(Ancient Brass Dragon), Strive (Twinflame, Call the Coppercoats), divided
damage (Shatterskull Smashing), or a constraint *relating chosen cards to each
other* (Agadeem's Awakening — explicitly unsupported, see the limitations list).

Against that, it is the most invasive change available. Every effect addresses
targets by fixed slot index (`target: 0`), `ResolvedTargets` is a flat array
with one entry per declared spec, and `effectiveTargetSpecs` is re-derived **at
resolution** for the fizzle check — so a slot count that depends on the board
would desynchronise between cast and resolution, which is precisely when the
board has changed. Expanding "any number" into N optional slots at enumeration
time has the same problem from the other end.

Four cards is not worth that. Revisit if the count grows, or alongside Strive
(which needs a per-target cost and would want the same machinery).

The same effort instead bought twelve cards, six of them in the top 80 — see
below.

### The top-80 cluster — DONE

Measured after the marks were fixed, by reading the highest-ranked
unimplemented cards rather than bucketing by keyword. Three needed **no engine
work at all**, which is the recurring lesson of this whole exercise:

- **Reliquary Tower** (#10) — `noMaxHandSize` shipped with Thought Vessel.
- **Reanimate** (#54) — `manaValueOf` already reads a target's printed mana
  value as last-known information, which is exactly what "lose life equal to
  that card's mana value" needs after the card has moved.
- **Rhystic Study** (#44) — the `unless` punisher effect and its
  `chooser: "trigger-controller"` already existed; a `cast-spell` trigger
  carries the spell, whose controller is the caster.

Three small features covered the rest:

- **`add-mana`'s `{ producedBy: "opponents-lands" }`** — a `oneOf` whose list
  is read off the board rather than printed, resolved in all three places a
  mana spec is read (the payment planner, the standalone-activation menu, and
  `addMana`). **Exotic Orchard** (#9), **Fellwar Stone** (#17).
- **`look-and-choose` destination `"library-top"`** — **Brainstorm** (#72).
- **A `enchantment-instant-or-sorcery-spell` target spec** — **Swan Song**
  (#68), plus a 2/2 blue Bird token, since the existing Bird is a 1/1 white one.

**Urborg, Tomb of Yawgmoth** (#73) and **Yavimaya, Cradle of Growth** (#77)
were scoped and dropped: "each land is a Swamp" needs a *static from another
permanent* to add a subtype, but `effectiveSubtypes` is deliberately given no
`GameState` so that `staticAffects` can call it without recursing. Making land
subtypes board-dependent touches check-lands, `landProduces` and every
`subtype` filter clause. Real work, not a quick win.

### Additional costs beyond a sacrifice — DONE for fixed amounts

`CardDefinition.additionalCost` went from `{ sacrifice }` to
`{ sacrifice?, discard?, payLife? }`, any combination of which is paid as the
spell is cast. Both new forms gate *castability* rather than fizzling on
resolution, which is the whole difference between a cost and an effect: too
small a hand, or too little life, and the spell simply isn't offered.

Two details worth keeping: the discard is raised after the spell is already on
the stack, so it can't be discarded to pay for its own cost (rule 601.2h), and
it happens at cast time, so it stands even if the spell is later countered.

Shipped: **Thrill of Possibility** (#211), **Big Score** (#138), **Seize the
Spoils** (#762), **Cathartic Reunion** (#1099), plus **Culling the Weak**
(#524) and **Corrupted Conviction** (#599), whose sacrifice cost had been
expressible all along and simply wasn't authored. `additional-costs.test.ts`.

**`payLifeX`** then covered **Toxic Deluge** (#66): an `{X}` spell whose mana
cost contains no `{X}` at all. `xCost.maxX` becomes the caster's life total
rather than what their lands can pay, and `ctx.x` reads the chosen value like
any other X — so the only genuinely new part was where the ceiling comes from.

Still open, and each a different shape: **Bitter Triumph** (#840) and **Demand
Answers** (#414) need a *choice* between two costs; **Plumb the Forbidden**
needs an optional, repeatable one.

### Put a card from your hand onto the battlefield — DONE (20 cards unblocked)

`look-and-choose`'s `zone` gained `"hand"`, which turned out to be the whole
feature — the decision, the filter, the optional-ness (`min: 0`) and the
"leave the rest alone" (`leftover: "stay"`) were all already there, and
`enterTapped` came along for Terrain Generator. It bypasses the land-drop
rule for free, which is correct: putting a land onto the battlefield is not
playing one.

Shipped: **Growth Spiral** (#234), **Ghalta, Stampede Tyrant** (#1072),
**Terrain Generator** (#1887), **Eureka Moment** (#1992).
`put-from-hand.test.ts`.

That missing piece — a `then` on `look-and-choose`, applied with the *chosen*
cards as its targets — is now built, along with a `sacrifice-target` effect
for naming one permanent rather than raising an edict. Together with delayed
triggers they make **Sneak Attack** (#1498) exact: put a creature from hand
onto the battlefield, give *that* creature haste, sacrifice *it* at the next
end step. Three features that were each useless alone.

**Last March of the Ents** (#980) still needs an `EffectAmount` for "the
greatest toughness among creatures you control" (a max, not a count), and
**Spelunking** a replacement making your lands enter untapped.

### Put a card on top of a library — DONE (18 cards unblocked)

Two shapes, one primitive. `search-library`'s `destination` gained
`"library-top"` for the tutor-to-top family, and a new `put-on-library
{ target, position }` effect covers the targeted graveyard-to-deck lands.

The ordering is the whole trick and is easy to get backwards: the find is put
on top *after* the search's own shuffle (rule 701.19j), so `applyZoneChoice`
deliberately skips the move in its per-card loop and places the chosen cards
once the shuffle has run.

Shipped: **Vampiric Tutor** (#113), **Enlightened Tutor** (#123), **Mystical
Tutor** (#160), **Imperial Seal** (#526), **Academy Ruins** (#462), **Mortuary
Mire** (#694), **Hall of Heliod's Generosity** (#422). `library-top.test.ts`.

Note `card-in-graveyard` + `put-onto-battlefield` already covered targeted
reanimation from *any* graveyard (Gravespawn Sovereign's shape) — the 36 cards
that look blocked on it are merely unauthored, not blocked. Reanimate itself
needs only an `EffectAmount` that reads a target's mana value.

---

Work down Tier 1b next, then Tier 2 opportunistically; treat Tier 3 as
"revisit if the card count grows," not a queue.

### E1 — the first bulk-authoring pass (53 cards, no new feature needed)

Tier 1 finished the *features* the popularity list demanded; this pass took the
other half of the same list — the top-200 staples that need **no** new
vocabulary — and authored them in bulk. 53 cards, all verified against Scryfall
by `card:verify`.

**A tooling correction first.** `top-commander-cards.txt`'s `[x]`/`[ ]` marks
were produced by regexing `name: "…"` out of each `pool/` file, so every card
built by a `helpers.ts` constructor (`shockLand("Blood Crypt", …)` — the whole
file) was falsely reported missing. Ten already-implemented lands were listed as
unauthored. *(Fixed since: the script reads `POOL_CARDS` out of the built
`dist/`, and `--refresh` re-marks the file in place.)*

Shipped:

- **Five land cycles completed** (32 cards) — shock (Watery Grave, Breeding
  Pool, Godless Shrine, Hallowed Fountain, Steam Vents, Sacred Foundry, Temple
  Garden), fetch (Polluted Delta, Flooded Strand, Misty Rainforest, Windswept
  Heath, Scalding Tarn, Marsh Flats, Arid Mesa), check (Clifftop Retreat,
  Dragonskull Summit, Isolated Chapel, Glacial Fortress, Drowned Catacomb,
  Woodland Cemetery, Sunpetal Grove), pain (Battlefield Forge, Caves of Koilos,
  Llanowar Wastes, Underground River, Adarkar Wastes, Sulfurous Springs,
  Brushland), BFZ duals (Sunken Hollow, Smoldering Marsh, Canopy Vista, Prairie
  Stream). Every one is a single `helpers.ts` call — the P0/P1 land toolkit had
  already paid for all of them, and each cycle now has all ten members, which
  is what a real imported decklist actually asks for.
- **The Talisman cycle** (10) — a new `talisman()` helper: a pain land's exact
  ability set on a `{2}` artifact.
- **Rocks and utility lands** — Mind Stone, Lotus Petal, Ashnod's Altar,
  Wayfarer's Bauble, Swiftfoot Boots, Ancient Tomb, Mana Confluence, City of
  Brass.
- **Spells and creatures** — Dark Ritual, Three Visits, Elvish Mystic, Abrade,
  Deadly Dispute, Generous Gift (+ an Elephant token), Blood Artist, Solemn
  Simulacrum, Eternal Witness.

Two engine changes came out of it, both rules bugs rather than new vocabulary:

1. **`TriggerSpec.on: "becomes-tapped"`** (rule 701.21a) — City of Brass. A
   `predicate` trigger can't express it: the predicate sees only the raw event,
   never which permanent carries the ability, so two Cities would each fire for
   the other's tapping. `painToController` doesn't fit either — the City hurts
   however it got tapped, including when tapped to pay a cost.
2. **`dies` now matches any battlefield → graveyard move**, not just
   `permanent-destroyed` (rule 700.4). It had missed **every sacrifice**, so
   Zulaport Cutthroat — in the pool since P-era — silently did nothing when you
   sacrificed a creature, and the whole aristocrats interaction was dead.
   Keyed off `permanent-left-battlefield`'s `toZone`, which also gets the
   903.9a case right for free: a commander redirected to the command zone
   never reaches a graveyard, so it doesn't die.

`edh-staples.test.ts`. Both bugs were found by authoring a card and testing it,
not by reading the engine — worth repeating for the next bulk pass.

### E2 — every made-up card replaced with a real one

The pool had carried 27 invented cards since the ROADMAP phases — placeholders
written to exercise a mechanic when no real card had been looked up for it
(`Grovewatch Elder // Grovewatch Hollow` for MDFCs, `Nightfall Cultist //
Voidfall Horror` for a transform ability and a `transforms` trigger, `Rendwin,
Warden of the Grove` for a planeswalker, four seat commanders, and so on). They
were invisible to `card:verify` (a name Scryfall has never heard of is reported
as `NOT FOUND`, not as a mismatch), so nothing flagged them, and a deck built in
the deck builder could contain cards that don't exist.

All 27 are gone, replaced by real cards carrying the same mechanic, and
`card:verify` now reports **327 checked, 0 mismatched, 0 not found**. The
substitutions, by what each was covering:

| mechanic | was | now |
| --- | --- | --- |
| MDFC (creature // land) | Grovewatch Elder // Hollow | **Kazandu Mammoth // Kazandu Valley** |
| Adventure | Emberclaw Scout // Ember Dart | **Beanstalk Giant // Fertile Footsteps** |
| Disturb | Gravebound Squire // Spectral Squire | **Baithook Angler // Hook-Haunt Drifter** |
| daybound / nightbound | Moonrise Cultivator // Marauder | **Harvesttide Infiltrator // Harvesttide Assailant** |
| activated transform | Nightfall Cultist | **Bloodline Keeper // Lord of Lineage** |
| `transforms` trigger | Voidfall Horror | **Sidequest: Raise a Chocobo // Black Chocobo** |
| planeswalker | Rendwin / Yulra | **Garruk Wildspeaker**, **Elspeth, Sun's Champion** |
| emblem | Coronation Rite | **Elspeth, Sun's Champion**'s −7 |
| resolution-time `modal` | Deliberate Course | **Austere Command** (choose two) |
| cast-time `castModal` | Sunder Charm / Duskwood Verdict | **Simic Charm** / **Kolaghan's Command** |
| Partner pair | Bramblewing / Corvath | **Tana, the Bloodsower** / **Bruse Tarl, Boorish Herder** |
| seat commanders | Ashmark / Sarova / Seraphine | **Atraxa, Praetors' Voice** / **Ayara, First of Locthwain** / **Emmara, Soul of the Accord** |
| `prevent-damage` shield | Sunlit Bastion | **Mending Hands** |
| dies → damage | Vengeful Ghoul | **Mudbutton Torchrunner** |
| graveyard `look-and-choose` | Grave Recall | **Regrowth** |
| library `look-and-choose` | Explorer's Insight | **Ureni of the Unwritten** (already in the pool) |
| counter-pump creature | Wildwood Sentinel | **Walking Ballista** (already in the pool) |
| big body | Mossback Dragon | **Colossal Dreadmaw** |

Two more rules bugs fell out of the swap, both found the same way as E1's — by
making a real card work:

1. **An activated ability's "Activate only if …" condition skipped its own
   source.** Rule 602.5 checks the game state, and the permanent is part of it:
   Bloodline Keeper is one of the five Vampires its own transform ability
   counts. (A *static* ability's condition is the one that skips itself, so
   "as long as you control another …" can't read itself.) Fixed in both the
   `whyCannotActivateAbility` gate and `manaSources`' auto-payment scan.
2. **`ActivatedAbility.otherOnly` now also excludes the source from a
   sacrifice cost** — Ayara's "Sacrifice **another** black creature" could
   otherwise eat Ayara herself.

Three things the real cards could not carry over, each because the engine
can't express the real card faithfully and inventing one is no longer allowed:

- **A static anthem on a planeswalker.** Domri, Anarch of Bolas is the only
  real printing, and its +1 grants "creature spells you cast this turn can't be
  countered", which has no vocabulary. The layer path itself is unchanged —
  `collectStaticEffects` never special-cased planeswalkers.
- **A triggered ability on a planeswalker** — same story; no real planeswalker
  in the pool has one.
- **An *unfiltered* library `look-and-choose`.** Every real card of that shape
  filters what you may take (Ureni: a Dragon). The filtered path is covered.

### E3 — five more cycles and the text-structure audit (57 cards)

Another no-new-feature bulk pass, same shape as E1: **five complete cycles**
behind new `helpers.ts` constructors — the original dual lands (`dualLand`),
the Theros scry lands (`scryLand`, which the two already-authored Temples were
refactored onto), the Innistrad slow lands (`slowLand`), the artifact lands
(`artifactLand`) and the Medallions (`medallion`) — plus 19 hand-authored
staples: Fyndhorn Elves, Harmonize, Night's Whisper, Thran Dynamo, Ornithopter
of Paradise, Reclamation Sage, Viscera Seer, Village Rites, Terminate, Diabolic
Intent, Skyshroud Claim, Pongify, Stroke of Midnight, Anguished Unmaking,
Basilisk Collar, Karn's Bastion, Phyrexian Tower, Buried Ruin, Temple of the
False God, Darksteel Citadel. Pool is 384 cards, all verified.

**The display half.** A card's `text` is rendered verbatim, so its "\n"s are
what separate one ability from the next on screen — except nothing was
checking them and `.ct-rules` had no `white-space` rule, so every newline
collapsed to a space and abilities ran together. `card:verify --text` now
audits each card's line structure against Scryfall's `oracle_text`; it found
15 cards genuinely missing a break. The flag is opt-in because ~34 remaining
differences are correct by design (the keyword line comes from `keywords`, a
typed dual needs an explicit "{T}: Add" line Scryfall leaves implicit, an
unmodeled ability's line is missing on purpose).

**The fuzzer caught a real priority bug**, unrelated to any of these cards but
newly reachable once the decks changed: `tick()` runs state-based actions and
*then* asks the priority holder to act, but an SBA sweep can raise a decision
mid-tick — a wrath killing a commander owes its owner the 903.9a choice.
`prepareForPriority` hands that player priority; `tick` didn't, so whoever
already held priority was asked to act with a declaration pending and threw on
passing. Needed a commander, a mass destroy and Rest in Peace (redirecting the
commander's move to exile) on the board at once, which is why it survived this
long.

**Deliberately skipped** (each needs a primitive the engine doesn't have, all
in the top 125): Exotic Orchard / Fellwar Stone / Path of Ancestry (mana
provenance — "a color a land an opponent controls could produce"), Reliquary
Tower / Thought Vessel (no `maxHandSize` static), Cultivate / Kodama's Reach
(multi-destination tutor), Swords to Plowshares / Path to Exile (life or a
search for *another* player, scaled off the target), Rhystic Study / Smothering
Tithe / Esper Sentinel (an "unless that player pays" clause), Reanimate
(another player's graveyard), Brainstorm / Ponder (put cards back on top in any
order), Toxic Deluge (pay-X-life as an additional cost), Urborg / Yavimaya (a
global type-change static), Skullclamp ("equipped creature dies"), Chaos Warp
(shuffle a permanent into a library), Cavern of Souls, The One Ring, Urza's
Saga.

---

## The limitation ledger — every §15 gap, ranked by blocked cards

Measured 2026-09-20, the day AUTHORING §0 ("faithful, or not at all") landed.
One Scryfall oracle-text search per limitation in AUTHORING §15, joined
against the *unimplemented* entries of `top-commander-cards.txt`. Read each
number as an **upper bound on what that one gap gates**: a hit may be blocked
on something else as well, and the searches are textual.

The point of the table is that §15 is not a flat list. Two entries gate 40
cards between them and the bottom half gates one or none — so "is this
limitation reasonable to keep?" has a different answer per row, and until now
nothing in the repo distinguished them.

| limitation | blocked | best rank | ≤100 | ≤500 |
| --- | ---: | ---: | ---: | ---: |
| **mana provenance** (all three shapes) | 21 | **14** | 1 | 7 |
| **protection from [filter]** | 19 | **92** | 1 | 4 |
| unbounded targeting *(scoped out on purpose — see above)* | 9 | 544 | 0 | 0 |
| regeneration | 7 | 705 | 0 | 0 |
| Station | 7 | 951 | 0 | 0 |
| "put into a graveyard from anywhere" trigger | 5 | 259 | 0 | 1 |
| "as this enters" on a non-cast permanent | 5 | 132 | 0 | 1 |
| discard-a-card as an ability cost | 5 | 834 | 0 | 0 |
| damage doubling (a replacement) | 4 | 794 | 0 | 0 |
| another player's graveyard → hand | 4 | 620 | 0 | 0 |
| Hideaway | 3 | 195 | 0 | 1 |
| Offspring | 3 | 793 | 0 | 0 |
| Warp | 3 | 1387 | 0 | 0 |
| phasing | 3 | 575 | 0 | 0 |
| snow sources | 3 | 445 | 0 | 1 |
| multikicker | 2 | 254 | 0 | 1 |
| plays-a-land trigger | 1 | 899 | 0 | 0 |
| Bestow / Eternalize / Coven / Raid | 1 each | 697+ | 0 | 0 |
| retrace / riot / Prototype | **0** | — | 0 | 0 |

Retrace, riot and Prototype gate **nothing** in the top 2000 — they are in §15
because a card in the pool wanted them, not because the backlog does. Leave
them.

### Mana provenance — DONE (21 cards unblocked, four of them top-250)

Built as designed below, in one pass. Shipped: **Path of Ancestry** (#14),
**Cavern of Souls** (#111), **Secluded Courtyard** (#219), **Unclaimed
Territory** (#247), **Ancient Ziggurat**. `mana-provenance.test.ts`, and the
authoring vocabulary is AUTHORING §15's "Mana provenance" entry.

Three things the plan didn't anticipate, all found by writing the tests and
running the fuzzer rather than by reading the code:

1. **"As this enters, choose a creature type" never fired for a land.** It
   hung off the permanent-*spell* resolution path, and a land is played, not
   cast — so all three chosen-type lands entered with no type named and their
   restricted mana could pay for nothing. `applyEnterChoices` is now shared by
   both paths.
2. **A hand-activated mana ability didn't tag its mana.** The payment planner
   tagged what it produced, but `applyEffectSpec`'s `add-mana` didn't — and
   floating mana is precisely the case the tagged pool exists for.
3. **The generic-spend type choice underflowed** when a restricted unit this
   payment couldn't touch was floating: picking the pip's colour by "is there
   a unit of this type" selected that unit's colour and then failed to take
   it. It has to choose over what is actually spendable. The fuzzer hit this
   on 115 of 150 seeds; there is now a regression test.

The original scoping follows, unchanged.

### The design: mana provenance (21 cards, four of them top-250)

The single highest-value gap, and three printed shapes over one underlying
change:

- **restricted spend** — "Spend this mana only to cast a creature spell of the
  chosen type" (Cavern of Souls #111, Secluded Courtyard #219, Unclaimed
  Territory #247, Plaza of Heroes #485, Castle Garenbrig #722, Haven of the
  Spirit Dragon #1149, Eldrazi Temple #1718, Delighted Halfling #151, …)
- **a rider on spend** — "When that mana is spent to cast a creature spell
  that shares a creature type with your commander, scry 1" (**Path of Ancestry
  #14**, Arena of Glory #371)
- **pool persistence** — "You don't lose this mana as steps and phases end"
  (Savage Ventmaw #1670, Ashling #1552, Electro #1314)

All three need the same thing: **the mana pool stops being a count and becomes
a list of tagged units.** `PlayerState.manaPool: Record<ManaType, number>`
becomes `readonly ManaUnit[]`, where a unit is `{ type, restriction?,
onSpend?, persists? }` — still plain `structuredClone`-able data, and the
count form is reconstructed by a selector for the view and the planner. That
is the whole feature; the three shapes are three optional fields on the unit.

The work, in dependency order:

1. **Represent it.** `manaPool` → a list; a `poolCounts()` selector for the
   ~8 read sites (`game.ts` ×6, `view.ts`, the client's mana display).
   `poolTotal` becomes `length`.
2. **Spend it correctly.** `spendFromPool` stops being a subtraction and
   becomes a small matching: each pip must be paid by a unit legal for *this*
   spell, and restricted units go first (use-it-or-lose-it) so an unrestricted
   one isn't wasted on a pip the restricted one could have covered. Greedy is
   provably enough here — legality is a per-unit predicate against a single
   spell, and same-type pips are interchangeable.
3. **Thread the context.** `payMana` → `planManaPayment` → `chooseOption`
   need to know what is being paid for, so the planner doesn't tap Haven for a
   non-Dragon. A `ManaLegality` argument (`{kind:"cast", def} | {kind:"ability",
   source} | null`) through ~10 call sites, mechanical. **Watch `canAfford` /
   `isDeadForMana` (`game.ts:4513`, `:4553`)** — they estimate capacity for
   the bot and the auto-passer, and ignoring restrictions there over-estimates,
   which shows up as a bot trying to cast what it can't pay for.
4. **Persistence** is then one line: the step/phase `emptyPool()` at
   `game.ts:2576` drops only units without `persists`, and cleanup drops all.
5. **The rider** falls out of step 2: `spendFromPool` now knows which unit
   paid for what, so it emits a `mana-spent` event carrying the tag and the
   spell, and `detectTriggers` handles it like any other. Path of Ancestry's
   scry goes on the stack above the spell, which is correct (rule 603.2).

Roughly a day, most of it in steps 1–3, and it is the kind of change that is
much cheaper now than after another thousand cards. **Protection-from-filter
(19 cards) is the cheaper second pick** — `protection: {colors, types}`
widening to a `CardFilter` reaches Mother of Runes, Giver of Runes, Spirit
Mantle and the whole Sword cycle without new machinery. Note its top two,
The One Ring (#92) and Teferi's Protection (#109), are *not* in that discount:
both give protection to a **player**, and Teferi's also needs phasing.

---

## Completed: `neededCards.txt` passes (P0-P20)

Two curated precon decks (a fixed-dual-land manabase deck, a
lands-in-graveyard deck), ~170 cards, effectively done. `git log` has the full
reasoning per pass; this table is a compact index only.

| pass | shipped | headline addition |
| --- | --- | --- |
| first pass | 8 cards | baseline pool (Birds of Paradise, Nature's Lore, ...) |
| P0 | 24 cards | full manabase toolkit — `ManaOption` alternatives, check/pain/shock/trikelands, `pay-life-for-untapped` decision, cycling |
| P1 | 4 cards | fetch lands (OR-of-subtypes `CardFilter` + `payLife` cost) |
| P2 | 4 cards | `return-from-graveyard`, self-`mill`, `playFromGraveyard` (rule 118.9) |
| P3 | 3 cards | landfall payloads (modal token/color, `"opponent"` target) |
| P4 | 4 cards | `EffectAmount.countOf` and `.triggerValue` |
| P5 | 6 cards | `create-token` `who: target-controller`, `create-token-copy`, `conditional` effect |
| P6 | 3 cards | `AbilityCost.sacrifice: { filter }`, `on: "sacrifice"` trigger |
| P7 | 2 cards | `TriggeredAbility.condition` (intervening-if), `opponent-controls`, `sacrifice-source { then }` |
| P8 | 4 cards | `additionalCost`, `kicker`, `exile-graveyard` |
| P9 | 1 card | `flicker` effect |
| P10 | 3 cards | `{X}` in more effect positions, `selfCostReduction` |
| P11 | 2 cards | `attacks` `TriggerSpec.filter` |
| P12 | 1 card | (real text needed no new vocab) |
| P13 | 1 card | `CardFilter.notKeyword` |
| P14 | 1 card | `choose-creature-type` decision, `costModification.matchesChosenCreatureType` |
| P15 | 4 cards | `"shroud"` keyword, Exalted, `doubleEntryTriggers` (Panharmonicon effect), Saga-as-enchantment-creature |
| P16 | 9 cards | `extraLandsPerTurn`, scoped damage (`who`), `return-to-hand`/`untap` target widened to `EffectTargetRef`, live-count `costModification` |
| full-pool verify | 31 fixes | `verify-cards.mjs` — batch Scryfall diff of every pool card's stats/cost/keywords, not just new ones |
| P17 | 7 cards | untap-trigger-object, `"artifact"` target, `opponents-control-total`, `ActivatedAbility.otherOnly` |
| P18 | 3 cards + audit | re-verified every remaining `neededCards.txt` FEATURE note against real Oracle text; several were stale/wrong |
| P19 | 4 cards | live-count `selfCostReduction`, `look-and-choose` `leftover: "hand"`, `may` `then`/`else`, `ActivatedAbility.condition` |
| P20 | 1 card | `"creatures-damage-controllers"` effect, `add-mana` `{ oneOf }` form |

**Known still-blocked items from this list** (each needs a real new
primitive, not yet built, all low-count-per-item): "up to N" optional
targeting and divided damage among any number of targets (Lord Windgrace,
Dragonlord Atarka, Ureni — shared with the popularity backlog's `Tier 3`),
Rooms (a two-door card shape), Siege cycle's choose-an-ability-set-on-ETB,
Bestow (a spell that's optionally an Aura), "collect evidence" (Duskmourn's
mid-resolution cost), Station (shared with the popularity backlog above),
and a name-preserving copy exception (Sarkhan, Soul Aflame). None of these
are worth a dedicated pass alone; fold them into whichever popularity-backlog
feature above happens to unblock the same primitive.
