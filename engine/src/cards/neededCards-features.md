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

**Tier 1 is complete.** Work down Tier 2 opportunistically next, and treat Tier 3 as "revisit if the
card count grows," not a queue.

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
