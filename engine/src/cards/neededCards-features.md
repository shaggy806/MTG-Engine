# Features needed to finish `neededCards.txt`

Status:

| bucket | count |
| --- | --- |
| already in pool | 8 (+ 4 basics) |
| **added — first pass** | 8 (Birds of Paradise, Nature's Lore, Infernal Grasp, Heroic Intervention, Dragonspeaker Shaman, Lathliss + Dragon Token, Temur Ascendancy, Terramorphic Expanse) |
| **added — P0 (multi-color mana + check/fetch/pain/shock/trikeland + cycling)** | 24 — the 16 below + **Cinder Glade**, **Rockfall Vale**, **Blood Crypt**, **Overgrown Tomb**, **Stomping Ground**, **Cabaretti Courtyard**, **Riveteers Overlook**, **Sheltered Thicket** (+ Tranquil Thicket now faithful) |
| **added — P2 (`return-from-graveyard` + self-`mill` + `playFromGraveyard`)** | 4 — **Splendid Reclamation**, **Aftermath Analyst**, **World Shaper**, **Ramunap Excavator** |
| blocked on an engine feature | ~90 |

† Rootbound Crag isn't on the list (Rockfall Vale is the list's R/G land) — added as the check-land cycle-mate.

The two decks are a **fixed-dual-land manabase** deck and a **lands-in-graveyard** deck,
so the two biggest unlocks (below) each clear ~30 and ~10 cards respectively. Everything
here is ordered by how many list cards it unblocks.

---

## P0 — Fixed multi-color mana sources  (~30 cards)

**DONE (core).** `ManaSource` now carries `options: ManaOption[]` — the alternative
single-activation outputs — and `planManaPayment` picks one per cost (`chooseOption`
in game.ts). `manaSources` reports every `{T}: Add` ability as an option instead of
collapsing to the richest one. Chromatic Lantern / Cryptolith Rite / Sol Ring behaviour
is unchanged (one dominating option). Tests: `dual-lands.test.ts`.

- Shipped taplands: **Frontier Bivouac**, **Temple of Abandon**, **Temple of Mystery**,
  **Commercial District**, **Raucous Theater**, **Underground Mortuary** (unconditional
  enters-tapped via `entersTappedStatic` helper + ETB `scry`/`surveil` trigger).
- **DONE — conditional enters-tapped (check lands + count-lands).**
  `EntersBattlefieldReplacement` gained `tappedUnless?: StaticCondition`; `CardFilter`
  gained `subtypes?: string[]` (any-of). Helpers `checkLandStatic(name, [typeA, typeB])`
  / `enterTappedUnlessLands(name, atLeast, "basic"|"any")`. Shipped: **Sulfur Falls**,
  **Hinterland Harbor**, Rootbound Crag, **Cinder Glade** ("two or more basic lands").
- **DONE — pain lands + `painIfUntapped`.** `add-mana` effect gained
  `painToController?: number`; `EntersBattlefieldReplacement` gained `painIfUntapped?`
  (Rockfall Vale — "deals 1 damage when it enters untapped"); `ManaOption`/`ManaPlanStep`
  carry `pain`/`lifeCost`; `chooseOption` prefers a free option; `manaSources` sorts a
  costly source after a free one of the same flexibility; `planManaPayment` won't spend
  life it can't afford. Helper `painLand(name, [colorA, colorB])`. Shipped **Karplusan
  Forest**, **Shivan Reef**, **Yavimaya Coast**, **Rockfall Vale**.
- **DONE — trikelands.** `isManaAbility` now permits a `payLife` cost (rule 605.1a — a
  mana ability may cost life); the mana planner auto-pays it via the `lifeCost` field.
  Helper `trikeland(name, [c1, c2, c3])`. Shipped **Cabaretti Courtyard**, **Riveteers
  Overlook**.
- **DONE — shock lands (a real decision).** `EntersBattlefieldReplacement.mayPayLife?`
  → a new `pay-life-for-untapped` `AwaitingDecision` (raised inside `moveObject`, like
  the 903.9a commander choice): the land enters tapped, its controller answers
  `{ type: "pay-life-for-untapped", pay }` — yes untaps it and deducts the life.
  `PlayerController.payLifeForUntapped` (Automatic declines; Random 70% pays; Scripted
  `payLifeForUntappedFn`). Client: a `pay-life-for-untapped` controls mode with
  **[Pay N life] / [Enter tapped]** — verified live. Helper `shockLand(name, [typeA,
  typeB])`. Shipped **Blood Crypt**, **Overgrown Tomb**, **Stomping Ground**.
- **DONE — cycling.** `CardDefinition.cycling { cost }` → a `cycle` special action
  (pay, discard, draw — an immediate action, no stack / no "when you cycle" window).
  `card-cycled` event. Client: a "Cycle {cost}" button on hand cards (like Suspend /
  Foretell) — verified live. Shipped **Sheltered Thicket**, **Combat Thresher**,
  fixed **Tranquil Thicket** (now `{T}, Sac: Add {G}` + cycling `{G}`).

### P0 — remaining (a thin long tail, ~5 cards)

| sub-feature | cards | note |
| --- | --- | --- |
| filter lands — "{G/U}{G/U}, {T}: Add {G}{G}/{G}{U}/{U}{U}" | Flooded Grove, Mossfire Valley | Hybrid mana in an **activation cost** + a multi-mana fixed option; the greedy planner would need to *fund* a filter land. |
| restricted mana — "spend only to cast a Dragon" | Temple of the Dragon Queen, Carnelian Orb, Path of Ancestry | `ManaType` has no "restricted" tag; `spendFromPool` doesn't track provenance. Would thread a spell-context into `payMana`. |
| commander-identity mana + "used to cast a creature → scry 1" | Path of Ancestry | on top of restricted mana |
| "a color a land an opponent controls could produce" | Exotic Orchard | |

**P0 verdict:** effectively complete — 24 cards, the whole manabase toolkit
(dual/check/fetch/pain/shock/trikeland + cycling). Only filter lands, restricted-mana
lands, and Exotic Orchard remain, all niche and needing a planner/pool change out of
proportion to the ~5 cards.

## P1 — Fetch lands  (~6 cards)

**DONE.** OR-of-subtypes `CardFilter` (`subtypes?: string[]`) + `payLife` on an ability
cost (already existed). Helper `fetchLand(name, [typeA, typeB])`. Shipped: **Farseek**,
**Wooded Foothills**, **Bloodstained Mire**, **Verdant Catacombs**. `dual-lands.test.ts`.

- **Fabled Passage** — still needs "if you control 4+ lands, untap it" (a conditional
  post-fetch untap).
- **Myriad Landscape** — "two basics that share a land type" (the "share a type" nuance).

## P2 — Land recursion from the graveyard  (~9 cards)

- **DONE — `return-from-graveyard { filter, destination, count: number | "all",
  enterTapped? }`.** Returns matching cards from the effect's controller's
  graveyard; `count: "all"` (or fewer matches than a numeric `count`) moves
  every match with no decision, otherwise a `choose-from-zone` decision, the
  rest staying in the graveyard. Also added a self form to `mill`
  (`target: number | "you"`) for the ETB/attacks self-mill on these cards, and
  `applyChooseFromZone` / the direct path now emit `permanent-entered-battlefield`
  for a battlefield destination (landfall off Splendid Reclamation, and off
  Rampant Growth's fetch, now fires). Shipped **Splendid Reclamation**,
  **Aftermath Analyst** (`{3}{G}, Sacrifice this` ability), **World Shaper**
  (dies trigger + `may`-mill on attack). `graveyard-recursion.test.ts`.
  - Still TBD for this sub-feature: **Hearthhull** (random — needs a "random
    permanent card" pick; it's also a Spacecraft/Station), Nahiri's Lithoforming.
- **DONE — `StaticAbility.playFromGraveyard: CardFilter`** — while the
  permanent is on the battlefield its controller may play matching cards from
  their graveyard (rule 118.9). `Game.mayPlayFromGraveyard` scans battlefield
  statics; `landPlayableReason` (was `landInHandReason`) accepts a graveyard
  source; `legalActions` enumerates the graveyard land-plays; the client's
  graveyard `ZoneViewer` grew a **"Play land"** button (reuses the Phase-6
  `castable` slot) — verified live. Shipped **Ramunap Excavator**.
  - Still TBD: **Conduit of Worlds** (also needs "cast a nonland from your
    graveyard once per turn"), **Six**, **Lord Windgrace** (-3) — all
    multi-clause.

## P3 — Landfall payloads  (~8 cards)

Landfall *triggers* already work (`enters-battlefield`, `filter: { type: "land" }`,
`who: "you-control"` — Rampaging Baloths does exactly this). Missing payloads:

| payload | cards | note |
| --- | --- | --- |
| `create-token` from a landfall trigger | **Tireless Provisioner** (Treasure), Traveling Chocobo | **likely already works — try authoring it** |
| damage to a chosen opponent from the trigger | **Iridescent Vinelasher** | likely works; the +1/+1-counter rider needs "if you paid" |
| `add-mana` from a trigger (into the pool) | **Lotus Cobra**, Ganax | works mechanically; "mana doesn't empty as steps end" is the nuance |
| `additional-combat` from the trigger | **Moraug, Fury of Akoum** | `additional-combat` effect exists; needs "only in your main phase" gating |
| "create a token that's a copy of this" | **Scute Swarm** | needs token-copy (see P5) |
| impulse draw + delayed end-step damage | **Valakut Exploration** | needs impulse-draw marker + conditional end-step trigger |
| "may have target opponent lose 3 life, then counters" | **Ob Nixilis, the Fallen** | needs `may` with a target (currently non-targeted only) |

## P4 — Count-scaled effect amounts  (~7 cards)

`EffectAmount` is `number | "x"`. Add `{ countOf: CardFilter | "power-of-target" }`.

- number of Dragons you control → **Scourge of Valkas**, Dragon Tempest, Dragonhawk.
- the entering/target creature's power → **Terror of the Peaks**, **Old Gnawbone**
  (X Treasures = power), Craterhoof Behemoth.
- creatures you control → Craterhoof (+X/+X), **Last March of the Ents** (draw X).

## P5 — Tokens for another player / token copies  (~6 cards)

- `create-token` minted under **the target's controller** — **Beast Within**,
  **Rapid Hybridization**, **An Offer You Can't Refuse**.
- "a token that's a copy of [permanent]" — **Miirym**, **Scute Swarm**, **Saw in Half**
  ("copies, except 1/1"). The Clone machinery (`copyOf`) exists on `GameObject`; needs a
  `create-token-copy` effect that mints one carrying `copyOf`.

## P6 — Sacrifice a filtered permanent as a cost  (~5 cards)

`AbilityCost.sacrifice` is `"self" | "creature-you-control"`. Add a filter form
(`"land-you-control"`, `{ filter }`).

- **Zuran Orb** ("Sacrifice a land: gain 2 life"), **Sylvan Safekeeper**, **Orcish
  Lumberjack** ("Sacrifice a Forest"), **Greater Gargadon** ("Sacrifice an artifact,
  creature, or land: +1 time counter" — suspend itself is supported).
- Companion feature: a **"whenever you sacrifice a permanent" trigger** — **Korvold**
  (both halves), Mayhem-Devil-style cards. `permanent-sacrificed` events already exist;
  needs a `TriggerSpec` case + `who`.

## P7 — Intervening-if / conditional triggered abilities  (~6 cards)

"When ~ enters, **if** you control a creature with power 4+, draw." No conditional
trigger. Add `TriggeredAbility.condition?: StaticCondition` (reuse the EG-3 union, extend
with `opponent-controls`).

- **Garruk's Uprising** (the anthem + the power>=4-ETB-draw trigger are already
  authorable — only the ETB "if" clause blocks it), **Defense of the Heart**,
  **Hellkite Tyrant** (win-con), Ob Nixilis.
- Related: a generic **"at the beginning of your end step" step trigger with a
  condition** (documented gap).

## P8 — Additional costs & kicker  (~4 cards)

- "As an additional cost to cast this, sacrifice a land." — **Harrow**, **Crop Rotation**.
- **Kicker** (optional cast-time extra cost that changes the effect) — **Tear Asunder**.
- **Bojuka Bog** needs an "exile target player's graveyard" effect (small, standalone).

## P9 — Flicker / blink  (2+ cards)

`exile` then `return-to-battlefield-under-your-control` as one effect. **Essence Flux**,
and a very common Commander primitive.

## P10 — `{X}` in more effect positions  (~3 cards)

- `{X}` in `modify-pt` → **Kessig Wolf Run**.
- `{X}` in a `destroy-all`/filter mana-value comparison → **Gaze of Granite**.
- `{X}` tutor-to-battlefield + threshold-gated team pump → **Finale of Devastation**.

## P11 — `attacks` trigger `filter`  (~3 cards)

`triggerMatches`'s `"attacks"` case (game.ts ~4322) checks `who` but **not** a `filter`.
Add `triggerFilterOk(spec.filter, event.attacker, self)`.

- **Utvara Hellkite** ("a Dragon you control attacks" → 6/6 Dragon token; bake haste into
  the token — functionally identical), Old Gnawbone, Miirym.
- **Atarka, World Render** additionally needs the trigger to **auto-target the attacked
  player/planeswalker** (like `deals-combat-damage-to-player` auto-fills its slot).

## P12 — Planeswalker / conditional-static gaps  (~4 cards)

- static keyword grant **conditioned on a creature's power** ("creatures you control with
  power 4+ have trample/vigilance") — **Kiora, Behemoth Beckoner** (its "untap target
  permanent" +1 is already an `untap` effect); Garruk's Uprising is the anthem-only
  version.
- **Lord Windgrace**, **Sarkhan, Soul Aflame** — multi-clause planeswalkers, each needs
  several of the above.

## P13 — Divided damage  (~2 cards)

"N damage divided as you choose among any number of targets" — **Dragonlord Atarka**,
Dragonhawk, Magmaquake (also needs `damage-all` to exclude a keyword and hit
planeswalkers).

## P14 — Choose-a-type-on-ETB  (~2 cards)

"As ~ enters, choose a creature type" + type-scoped cost reduction — **Urza's Incubator**.
(Dragonspeaker Shaman shipped this pass because its type is fixed.)

## P15 — Keyword mechanics, 1–2 cards each

Exalted (Ignoble Hierarch), Riot / "your creature spells can't be countered"
(Rhythm of the Wild), Constellation + "your-turn hexproof anthem" (Starfield Vocalist),
Bestow (Springheart Nantuko), Hideaway (Mosswort Bridge), Cycling (Sheltered Thicket),
Room cards (Mirror Room // Fractured Realm, Walk-In Closet // Forgotten Cellar),
"Summon" saga-creatures (Summon: Titan), spacecraft/crew (Exploration Broodship),
"triggered abilities trigger an additional time" (Virtue of Knowledge),
shroud (Lightning Greaves — equip {0} + haste already fine).

## P16 — Newer sets, text unverified

TDM (Tarkir: Dragonstorm) dragons and various UB / Final Fantasy / Avatar / Marvel /
Edge of Eternities cards in the list whose exact templating I didn't want to guess:
Broodcaller Scourge, Deceptive Frostkite, Dracogenesis, Dragonhawk Fate's Tempest,
Encroaching Dragonstorm, Frontier Siege, Frostcliff Siege, Incinerator of the Guilty,
Ureni the Song Unending, World War Hulk, Earthbender Ascension, Evendo Waking Haven,
Famished Worldsire, Horizon Explorer, Icetill Explorer, Kavaron Memorial World,
Mole Man Moloid Master, Princess Sarah, Rydia Summoner of Mist, Sabotender,
Tannuk Memorial Ensign, Toph Hardheaded Teacher, Will of the Sultai, Temur Battlecrier.
Pull the Oracle text (the `/import-deck` Scryfall lookup already does this) before authoring.

---

## Note on the existing Korvold stub

`engine/src/cards/pool/korvold-fae-cursed-king.ts` is an **incomplete stub**
(`text: "Flying\nWhenever"`, no `keywords`, no behaviour) and is already wired into
`generated.ts`. It needs P6 (the "whenever you sacrifice" trigger + "sacrifice another
permanent" effect) to be authored faithfully — until then it's a vanilla 4/4 with a
misleading text box. Recommend either finishing it once P6 lands or removing it from the
pool.
