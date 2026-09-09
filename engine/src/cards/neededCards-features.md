# Features needed to finish `neededCards.txt`

Status:

| bucket | count |
| --- | --- |
| already in pool | 8 (+ 4 basics) |
| **added — first pass** | 8 (Birds of Paradise, Nature's Lore, Infernal Grasp, Heroic Intervention, Dragonspeaker Shaman, Lathliss + Dragon Token, Temur Ascendancy, Terramorphic Expanse) |
| **added — P0 (multi-color mana + check/fetch lands)** | 13 (Frontier Bivouac, Temple of Abandon, Temple of Mystery, Commercial District, Raucous Theater, Underground Mortuary, Sulfur Falls, Hinterland Harbor, Rootbound Crag†, Farseek, Wooded Foothills, Bloodstained Mire, Verdant Catacombs) |
| blocked on an engine feature | ~105 |

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
- **DONE — conditional enters-tapped (check lands).** `EntersBattlefieldReplacement`
  gained `tappedUnless?: StaticCondition`; `CardFilter` gained `subtypes?: string[]`
  (any-of). Helper `checkLandStatic(name, [typeA, typeB])`. Shipped: **Sulfur Falls**,
  **Hinterland Harbor**, + Rootbound Crag (cycle-mate). Cinder Glade uses "two or more
  basic lands" (a count, not a type — `{ kind: "controls", filter: { supertype: "basic",
  type: "land" }, atLeast: 2 }` — try it); Rockfall Vale additionally needs the "deals 1
  damage when it enters untapped" clause (an enters-untapped trigger).
- Still to layer on for the rest of the ~30:

| sub-feature | cards |
| --- | --- |
| "pay 2 life or it enters tapped" (shock) — a real cast/ETB **choice** (an `awaiting` decision + a client step; auto-payer heuristic otherwise) | Blood Crypt, Stomping Ground, Overgrown Tomb |
| painland "{T}: Add {R} or {G}. ~ deals 1 damage to you" (a mana ability with a side effect / life loss) | Karplusan Forest, Shivan Reef, Yavimaya Coast |
| pay-life multicolor mana (trikelands) | Cabaretti Courtyard, Riveteers Overlook |
| filter lands ("{G/U}{G/U}, {T}: Add {G}{G}/{G}{U}/{U}{U}") — hybrid mana in an **activation cost** + multi-mana fixed output | Flooded Grove, Mossfire Valley |
| cycling `{2}` | Sheltered Thicket |
| restricted mana ("spend only to cast a Dragon / creature") | Temple of the Dragon Queen, Carnelian Orb of Dragonkind, Path of Ancestry |
| mana "of any color in your commander's color identity" (+ "when used to cast a creature, scry 1") | Path of Ancestry |
| mana "a color a land an opponent controls could produce" | Exotic Orchard |

## P1 — Fetch lands  (~6 cards)

**DONE.** OR-of-subtypes `CardFilter` (`subtypes?: string[]`) + `payLife` on an ability
cost (already existed). Helper `fetchLand(name, [typeA, typeB])`. Shipped: **Farseek**,
**Wooded Foothills**, **Bloodstained Mire**, **Verdant Catacombs**. `dual-lands.test.ts`.

- **Fabled Passage** — still needs "if you control 4+ lands, untap it" (a conditional
  post-fetch untap).
- **Myriad Landscape** — "two basics that share a land type" (the "share a type" nuance).

## P2 — Land recursion from the graveyard  (~9 cards)

No `return-from-graveyard` effect of any kind exists (documented limitation in
`AUTHORING.md §15`). Need at least:

- `return-from-graveyard { filter, destination, count | "all" }` — **Splendid Reclamation**,
  **Aftermath Analyst**, **World Shaper** (on death), **Hearthhull** (random), Nahiri's
  Lithoforming.
- a static "you may play lands from your graveyard" permission — **Ramunap Excavator**,
  **Conduit of Worlds**, **Six**, **Lord Windgrace** (-3).

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
