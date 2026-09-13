# Features needed to finish `neededCards.txt`

Status:

| bucket | count |
| --- | --- |
| already in pool | 8 (+ 4 basics) |
| **added — first pass** | 8 (Birds of Paradise, Nature's Lore, Infernal Grasp, Heroic Intervention, Dragonspeaker Shaman, Lathliss + Dragon Token, Temur Ascendancy, Terramorphic Expanse) |
| **added — P0 (multi-color mana + check/fetch/pain/shock/trikeland + cycling)** | 24 — the 16 below + **Cinder Glade**, **Rockfall Vale**, **Blood Crypt**, **Overgrown Tomb**, **Stomping Ground**, **Cabaretti Courtyard**, **Riveteers Overlook**, **Sheltered Thicket** (+ Tranquil Thicket now faithful) |
| **added — P2 (`return-from-graveyard` + self-`mill` + `playFromGraveyard`)** | 4 — **Splendid Reclamation**, **Aftermath Analyst**, **World Shaper**, **Ramunap Excavator** |
| **added — P3 (landfall payloads: modal token / colour, `"opponent"` target)** | 3 — **Tireless Provisioner**, **Lotus Cobra**, **Iridescent Vinelasher** |
| **added — P4a (`EffectAmount.countOf`)** | 2 — **Scourge of Valkas**, **Craterhoof Behemoth** |
| **added — P4b (`EffectAmount.triggerValue`)** | 2 — **Terror of the Peaks**, **Old Gnawbone** |
| **added — P5a (`create-token` `who: "target-controller"`)** | 3 — **Beast Within**, **Rapid Hybridization**, **An Offer You Can't Refuse** |
| **added — P5b (`create-token-copy` + `conditional` effect + `triggerObject`)** | 3 — **Miirym, Sentinel Wyrm**, **Scute Swarm** (+ Insect Token), **Saw in Half** |
| **added — P6 (`AbilityCost.sacrifice: { filter }` + `on: "sacrifice"` trigger)** | 3 — **Zuran Orb**, **Sylvan Safekeeper**, **Korvold, Fae-Cursed King** (stub finished) |
| **added — P7 (`TriggeredAbility.condition` — intervening-if)** | 2 — **Garruk's Uprising**, **Defense of the Heart** |
| **added — P8 (`additionalCost` + `kicker` + `exile-graveyard`)** | 4 — **Harrow**, **Crop Rotation**, **Tear Asunder**, **Bojuka Bog** |
| **added — P9 (`flicker` effect)** | 1 — **Essence Flux** |
| **added — P10 (`{X}` in more effect positions + `selfCostReduction`)** | 3 — **Kessig Wolf Run**, **Gaze of Granite**, **Finale of Devastation** (partial) |
| **added — P11 (`attacks` `TriggerSpec.filter`)** | 2 — **Utvara Hellkite**, **Atarka, World Render** |
| **added — P12 (no new vocab — the guessed static was wrong)** | 1 — **Kiora, Behemoth Beckoner** |
| **added — P13 (`CardFilter.notKeyword`)** | 1 — **Magmaquake** |
| **added — P14 (`choose-creature-type` decision + `costModification.matchesChosenCreatureType`)** | 1 — **Urza's Incubator** |
| **added — P15 (shroud, Exalted, ETB-trigger doubling, + a creature-Saga needing no new vocab)** | 4 — **Lightning Greaves**, **Ignoble Hierarch**, **Starfield Vocalist**, **Summon: Titan** |
| **added — P16 (extra land drops, scoped damage, return-to-hand-source, countOf cost/counter amounts)** | 9 — **Princess Sarah**, **Icetill Explorer**, **Sabotender**, **Tannuk, Memorial Ensign**, **Encroaching Dragonstorm**, **Temur Battlecrier**, **Mole Man, Moloid Master**, **Rydia, Summoner of Mist**, **Will of the Sultai** |
| **added — P17 (untap-trigger-object, a new "artifact" target, a combined-opponents static condition)** | 7 — **Amulet of Vigor**, **Sakura-Tribe Elder**, **Bountiful Landscape**, **Festering Thicket**, **Vernal Fen**, **Turbulent Fen**, **Manifold Key** |
| blocked on an engine feature | ~39 |

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
`who: "you-control"` — Rampaging Baloths does exactly this). Payload status:

| payload | cards | status |
| --- | --- | --- |
| `create-token` from a landfall trigger | **Tireless Provisioner** | **DONE** — a landfall `modal` ["create a Food", "create a Treasure"] + a new `Food Token` (`{2},{T},Sac: gain 3`). No new engine vocab. |
| damage to a chosen opponent from the trigger | **Iridescent Vinelasher** | **DONE** — new `"opponent"` `TargetSpec` (a player ≠ the chooser); the landfall ping flows through the Phase-11-EG-1 `choose-targets` decision (forced, no prompt, with one opponent). Offspring not modeled. |
| `add-mana` from a trigger (into the pool) | **Lotus Cobra** | **DONE** — a landfall `modal` over the 5 colours (a real colour choice; a standalone `add-mana: "any-color"` would just make white). Mana still empties at step/phase end. |
| `additional-combat` from the trigger | **Moraug, Fury of Akoum** | TBD — `additional-combat` effect exists; needs "if it's your main phase" gating on the trigger. |
| Ganax, Traveling Chocobo, Tireless Tracker | — | TBD — Ganax also has Choose-a-Background; Chocobo has "play from top of library" + "triggers an additional time"; Tracker needs a sacrifice trigger (P6). |
| "create a token that's a copy of this" | **Scute Swarm** | needs token-copy (see P5) |
| impulse draw + delayed end-step damage | **Valakut Exploration** | needs impulse-draw marker + conditional end-step trigger |
| "may have target opponent lose 3 life, then counters" | **Ob Nixilis, the Fallen** | needs `may` with a target (currently non-targeted only) |

`landfall-payloads.test.ts`.

## P4 — Count-scaled effect amounts  (~7 cards)

- **DONE — `EffectAmount` gains `{ countOf: CardFilter }`** — a live count of battlefield
  permanents matching the filter, evaluated with the effect's controller as "you"
  (`amountValue` → `ResolutionContext.countMatching`). Wired into `damage` (already),
  `draw`, `modify-pt`, `modify-pt-all`, `create-token` `count`. `replacements.ts`'s
  enters-with-counters `amount` was narrowed to `number | "x"` (it never needed the count).
  Shipped **Scourge of Valkas** (damage = your Dragons, incl. itself) and **Craterhoof
  Behemoth** (creatures you control gain trample + `modify-pt-all` `{ countOf: creatures
  you control }`). `count-scaled.test.ts`.
  - Also fixed a latent bug found by the fuzz: a `castModal` instant/sorcery cast from an
    alternative zone (Snapcaster grants flashback to Duskwood Verdict) was offered without
    its `castModal` descriptor and with the RandomController dropping `via` — now
    `Game.castModalDescriptor` is spread into every `cast-spell` `LegalAction` and the
    RandomController / client `confirmModes` forward `via`/`face`.
- **DONE — `EffectAmount` gains `{ triggerValue: true }`** — a numeric quantity the triggering
  event supplies, snapshotted at trigger time and threaded onto the stack ability
  (`PendingTrigger.triggerValue` → `GameObject.triggerValue` → `ResolutionContext.triggerValue`,
  the same plumbing as `autoTargets`): the entering / attacking creature's *power*, or the
  *combat damage* a creature dealt a player. Shipped **Terror of the Peaks** (damage = the
  entering creature's power; `ward { payLife: 3 }` approximates its "costs 3 life to target it"
  clause) and **Old Gnawbone** (Treasures = combat damage dealt — its real text, not the
  "X = power" the note guessed). `trigger-value.test.ts`.
  - Still TBD: Dragon Tempest's "it gains haste / deals X damage" (aims `grant-keyword` /
    `damage` at *the triggerer* — a target-slot, not an amount).
- **Not this shape:** **Last March of the Ents** — "draw = greatest toughness among your
  creatures" + "put any number of creature cards from hand onto the battlefield" (a
  max-of, plus a cheat-into-play effect); the neededCards note had an older templating.

## P5 — Tokens for another player / token copies  (~6 cards)

- **DONE — `create-token` gains `who?: "you" | "target-controller"`** — the tokens are minted
  under the controller of `targets[0]` (a permanent or a spell on the stack), reading its
  *current* `controller` at that point (rule 111.11 — for a destroyed/countered target that's
  its last-known controller, which `moveObject` has already reverted to owner; the stolen-target
  corner is imperfect). Shipped **Beast Within**, **Rapid Hybridization** (+ a `Frog Lizard
  Token`), **An Offer You Can't Refuse**. `token-for-target.test.ts`.
- **DONE — `create-token-copy { of, count, gainsHaste?, exileAtEndStep?, notLegendary?,
  basePt? }`** (P5b). `of` is `"source"` (Scute Swarm), `"trigger-object"` (Miirym — the
  permanent whose entering fired the trigger, threaded from `detectTriggers` onto the
  stacked ability via `GameObject.triggerObject` → `ResolutionContext.triggerObject`,
  mirroring `triggerValue`), or a target-slot index (Saw in Half). Mints a token whose
  `copyOf` is the copied permanent's name (every characteristic read already resolves
  through `printedCardName = copyOf ?? faceName`), under *that permanent's* controller.
  `gainsHaste` / `basePt` push modifiers (layer 6 / 7b); `notLegendary` (a new intrinsic
  `GameObject` flag the legend-rule SBA skips); `exileAtEndStep` (a flag swept in
  `endStepActions`). Also added a general **`conditional { condition: StaticCondition,
  then, else? }`** effect (Scute Swarm's "if you control six or more lands … Otherwise …")
  and hardened `permanentSource` against a vanished ability source (rule 608.2b — pre-existing
  latent crash the fuzz surfaced once Miirym copies could self-exile mid-trigger). Shipped
  **Miirym, Sentinel Wyrm** (originally shipped with an invented haste + end-step-exile
  clause neither Miirym nor any card on the list actually has — corrected in the
  needed-cards verification pass to a permanent, non-legendary copy, its real text; the
  `gainsHaste`/`exileAtEndStep` flags remain implemented for a future Reflection-of-
  Kiki-Jiki-shaped card, just unexercised by any pool card right now),
  **Scute Swarm** (+ `Insect Token`), **Saw in Half** (drops only the "if it had a printed
  power" gate — every real creature card has one). `token-copy.test.ts`.
  - Still TBD: **Scute Swarm**'s copies snowball correctly, but a very land-heavy fuzz game
    could in principle balloon the object count (accepted — it's real MTG behaviour);
    **Miirym**'s copy of a card that was itself a Clone degrades to a 0/0 (we copy the name,
    not last-known copyable values).

## P6 — Sacrifice a filtered permanent as a cost  (~5 cards)

- **DONE — `AbilityCost.sacrifice` gains a `{ filter: CardFilter }` form** — the player
  picks a matching permanent they control (the `activate-ability` LegalAction carries the
  usual `sacrifice: { choices }`; `sacrificeCandidates` / `isManaAbility` / `legalActions`
  handle it generically). Shipped **Zuran Orb** ("Sacrifice a land: gain 2 life") and
  **Sylvan Safekeeper** ("Sacrifice a land: target creature you control gains hexproof" —
  Oracle text; the original said shroud, which the engine doesn't model).
- **DONE — `on: "sacrifice"` `TriggerSpec`** (`who` relative to the sacrificing player)
  + the `sacrifice` effect's `exceptSource?: boolean` ("sacrifice **another** permanent").
  Finished the former **Korvold, Fae-Cursed King** stub — both halves (enters/attacks →
  sac another; whenever you sacrifice → +1/+1 counter + draw). `sacrifice-cost.test.ts`.
- **Still TBD:** **Orcish Lumberjack** ("{T}, Sacrifice a Forest: Add {R}{R}{R}") — a
  *mana* ability with a filtered sacrifice cost; the auto-mana-payment machinery can't pick
  which Forest, so it'd have to go on the stack (a timing deviation) or need a "choose the
  sacrifice as part of the mana payment" hook. **Greater Gargadon** — its ability is on a
  *suspended card in exile* ("Activate only if suspended"), not a battlefield permanent.
  Mayhem-Devil-style "whenever a player sacrifices" is now authorable (`who: "any"`) but no
  such card was on the list.

## P7 — Intervening-if / conditional triggered abilities  (~6 cards)

- **DONE — `TriggeredAbility.condition?: StaticCondition`** (rule 603.4). The
  condition is checked **twice**: in `detectTriggers` as the event happens (false ⇒
  the ability never triggers at all — no stack object, nothing to fizzle) and again
  at the top of `resolveAbility` (false by then ⇒ removed from the stack with no
  effect, logged as a `spell-fizzled` with an "intervening-if" reason). Evaluated by
  the same `staticConditionMet` the EG-3 statics use, via a new `ConditionOptions
  { includeSelf }` — a *static*'s condition leaves its own permanent out of the board
  scan (the `conditionInProgress` recursion guard), an intervening-if runs outside
  the layer fold and **must** count it. Once on the stack, the source permanent may
  be gone; the recheck then evaluates against the stack ability object, whose
  `controller` is the same.
- **DONE — `StaticCondition` gains `opponent-controls { filter, atLeast }`** — *one*
  opponent must meet the count on their own ("if an opponent controls three or more
  creatures" isn't satisfied by two creatures each across two opponents). `filter` is
  evaluated with that opponent as its "you".
- **DONE — a `sacrifice-source { then? }` effect** — "Sacrifice ~. **If you do,** …".
  No choice and no `sacrifice` decision (rule 701.17): `Game.sacrificeSourceByEffect`
  moves the source straight to the graveyard and returns whether it happened, which
  gates `then`. A source that already left the battlefield in response does nothing
  at all.
- Shipped **Garruk's Uprising** (all three clauses: the intervening-if ETB draw, the
  unconditional "a creature with power 4+ enters" draw, the trample anthem) and
  **Defense of the Heart** (upkeep intervening-if → sacrifice itself → search up to
  two creature cards onto the battlefield). `intervening-if.test.ts`.
- **Still TBD:** **Hellkite Tyrant** (its intervening-if upkeep clause is now
  authorable, but it also needs "gain control of *all* artifacts a player controls"
  and an alternate **win condition** — neither exists); **Ob Nixilis, the Fallen**
  (needs a `may` with a *target*, currently non-targeted only — see P3).
- Related and now unblocked: a generic **"at the beginning of your end step" step
  trigger with a condition** is just `step-begins { step: "end" }` + `condition`.
- **Fuzz finding (pre-existing, not P7) — since fixed.** Adding these two to
  `random-demo.mjs`'s deck A reshuffled it into a **Scute Swarm hang** at 2p seed 109:
  the token-stacking work bounded the *object* count, but `materializeStack` still
  expanded a whole compacted stack into N real objects the moment it attacked, and N
  doubles every land drop. It reproduced at HEAD too (same deck without these cards:
  seeds 251-500 contain games taking 2-6 s against a ~100 ms norm — the same curve just
  short of the cliff) and vanished entirely with Scute Swarm removed (250/250 clean with
  these two cards in). Fixed in the next commit by capping the wake-up at 100 members
  (attacking is optional, so a subset is a legal declaration) and folding the woken-up
  individuals back together in cleanup (`recompactTokens`). `random-demo.mjs` gained a
  **`--progress`** flag out of this — it announces each seed on stderr *before* playing
  it, so a stalled seed names itself instead of a long run just printing nothing.

## P8 — Additional costs & kicker  (~4 cards)

**DONE — all four.**

- **`CardDefinition.additionalCost: { sacrifice: CardFilter }`** (rule 601.2f/h) — a
  *mandatory* extra cost paid as the spell is cast. `cast-spell` Action gains
  `sacrifice?: ObjectId` and its `LegalAction` a `sacrifice: { choices }` (the same
  shape P6 gave an activated ability's filtered sacrifice cost, so the RandomController
  and the client's `choose-sacrifice` controls step both route through unchanged —
  `pendingSac` just widened to `AbilityAction | CastAction`). The cost is paid *after*
  mana (rule 601.2g — mana abilities are activated before costs are paid), so Crop
  Rotation off a single Forest works: tap it for {G}, then sacrifice it. It stands even
  if the spell is countered. `whyCannotCastSpell` refuses the cast outright when there's
  nothing to sacrifice. Shipped **Harrow**, **Crop Rotation**.
- **`CardDefinition.kicker: { cost, targets?, effect? }`** (rule 702.33). Kicker is
  announced as the spell is cast (601.2b), *before* targets — which matters, because
  Tear Asunder's kicked target spec is different (`"permanent"` vs
  `"artifact-or-enchantment"`). Rather than a new cast-time decision step,
  `legalActions` enumerates the card **twice** — unkicked and `kicked: true` with the
  kicker folded onto the cost — the same "one entry per playable variant" shape `via`
  and `face` already use, so the client just renders both buttons ("Cast Tear Asunder"
  / "Cast Tear Asunder (kicked {2})"). `GameObject.kicked` rides on the stack object;
  `resolveTopOfStack` applies `def.kicker.effect` "instead" when set, and the fizzle
  check uses the specs it was actually cast with. Shipped **Tear Asunder**.
  - Along the way the six duplicated `cast-spell` `LegalAction` builders (hand /
    foretell / flashback / disturb / adventure / escape) collapsed into one
    `Game.castSpellActions` helper — they only ever differed in `via` / `face` / cost
    string, and the kicker fan-out would otherwise have had to be written six times.
- **`exile-graveyard { target }` effect** — exiles a target *player's* whole graveyard
  in one action (rule 406; the cards are never individually targeted). Shipped
  **Bojuka Bog**. `additional-costs.test.ts`.
- **Still TBD:** additional costs other than a sacrifice ("discard a card", "pay N
  life", "exile a creature from your graveyard"), more than one per card, multikicker,
  and two different kickers on one card.

## P9 — Flicker / blink  (2+ cards)

**DONE.** A new `flicker` effect: exiles `target`, then immediately returns it to the
battlefield under its owner's control (rule 400.7 — a brand-new object, so counters/
Auras/tapped-status/stolen-control all fall off, same as `moveObject` already does for
any other zone change). A token exiled this way ceases to exist and is never brought
back (rule 111.7); a commander's 903.9a command-zone choice, raised as it leaves,
pre-empts the return. Shipped **Essence Flux**. `flicker.test.ts`.

## P10 — `{X}` in more effect positions  (~3 cards)

**DONE — all three, no `EffectAmount`/`CardFilter` change needed.** `modify-pt`'s
`power`/`toughness` were already `EffectAmount`, and an activated ability's `{X}`
cost already stamps `ctx.x` (Phase 11 EG-3 / Cinder Elemental) — so a land whose
pump ability keys off its own `{X}` cost just works. A `destroy-all` filter's
`manaValue` is a fixed `NumCompare`, not an `EffectAmount`, but a card's
imperative `resolve` hatch can build one with a literal `n: ctx.x` and call
`ctx.destroyAll`/`ctx.searchLibrary` directly — no framework change there either.

- Shipped **Kessig Wolf Run**: `{X}{1}{R}, {T}: …+X/+0…` (approximates "X is the
  amount of red mana spent" as an ordinary `{X}` cost — the engine has no notion
  of which color paid which part of a cost).
- Shipped **Gaze of Granite**: `resolve: (ctx) => ctx.destroyAll({ type:
  "creature", manaValue: { op: "lte", n: ctx.x } })`. Awaken isn't modeled — the
  alternate-cost land-animation clause is dropped.
- Shipped **Finale of Devastation**'s tutor (`resolve` + `ctx.searchLibrary`
  with a `manaValue <= x` filter) and its Ferocious cost reduction — a genuinely
  new mechanism, **`CardDefinition.selfCostReduction: { condition:
  StaticCondition, reduceGeneric }`**: a discount printed on the spell itself,
  gated on board state, evaluated for the card being cast from whatever zone
  it's in (rule 601.2f). Unlike `StaticAbility.costModification` (a battlefield
  permanent discounting *other* spells — Foundry Inspector, Thalia) this needs
  no permanent on the battlefield granting it, since the spell being reduced
  *is* the source; wired into `Game.castingCostOf` alongside the existing
  battlefield-static check.
  - **Still TBD:** "if X is 10 or more, that creature gains haste and you may
    have it fight target creature an opponent controls" — hooking a follow-up
    effect onto whichever permanent a `choose-from-zone` decision resolves to
    isn't something the engine can do yet (the decision is answered
    asynchronously, after the spell has already left the stack).

`x-effects.test.ts`.

## P11 — `attacks` trigger `filter`  (~3 cards)

**DONE.** `TriggerSpec`'s `"attacks"` variant gained an optional `filter?: CardFilter`,
checked in `triggerMatches` via the existing `triggerFilterOk` helper (the same one
`enters-battlefield`/`dies`/`transforms` already use).

- Shipped **Utvara Hellkite**: "Whenever a Dragon you control attacks, create a 6/6 red
  Dragon creature token with flying" (`filter: { subtype: "Dragon" }`) — its real Oracle
  text (pulled from Gatherer) has no haste and no "tapped and attacking" clause; the
  original planning note here had guessed both, faithfully corrected once checked.
- Shipped **Atarka, World Render**: "Whenever a Dragon you control attacks, it gains
  double strike until end of turn" — also simpler than this doc originally guessed (no
  targeting at all, on either the real card or Atarka's own text). The keyword goes on
  `ctx.triggerObject` (the attacking Dragon, which may not be Atarka itself), via the
  `resolve` hatch — no new `EffectApi` needed, `grantKeyword` already exists.
  Old Gnawbone and Miirym, Sentinel Wyrm (both cited here originally) turned out to
  already be correctly implemented on `deals-combat-damage-to-player` /
  `enters-battlefield`, not `attacks` — no changes needed for either.

`attacks-filter.test.ts`.

## P12 — Planeswalker / conditional-static gaps  (~4 cards)

**Reassessed against real Oracle text (pulled from Scryfall) — the original guess's whole
premise (a static keyword grant conditioned on power) doesn't actually apply to any of the
three cards below.** Same "reality corrected the plan" pattern as P9/P11.

- **DONE — Kiora, Behemoth Beckoner.** Real text (War of the Spark, `{2}{G/U}`, loyalty 7):
  "Whenever a creature you control with power 4 or greater enters, draw a card. −1: Untap
  target permanent." No static at all — the trigger is the exact `enters-battlefield` +
  `filter: { type: "creature", power: { op: "gte", n: 4 } }` + `who: "you-control"` shape
  Garruk's Uprising already shipped (P7), and −1 is an ordinary single-target loyalty
  ability (`untap`, `targets: ["permanent"]`). Zero new vocab. `planeswalker.test.ts`.
  - Caught along the way: `Game.debugSpawn`'s doc comment claims a move to the battlefield
    fires triggers "as usual", but `moveObject` itself never emits
    `permanent-entered-battlefield` — every real call site (casting, tokens,
    `return-from-graveyard`, …) emits it *after* calling `moveObject`, and `debugSpawn`
    doesn't. No test anywhere actually relies on a debugSpawned permanent's entry firing
    *another* permanent's trigger (every ETB-trigger test casts/plays the entering card for
    real — see `trigger-value.test.ts`'s Terror of the Peaks); the Kiora draw test follows
    that same convention. Left as-is rather than patched — fixing a sandbox-only helper's
    doc/behavior mismatch head-on risks reshaping trigger counts across every other test
    file that debugSpawns multiple permanents, for a helper the doc comment overpromises on
    but nothing actually depends on.
- **Still blocked — Sarkhan, Soul Aflame.** Not a planeswalker — a **creature** (TDC 2025,
  `{1}{U}{R}`, 2/4 Human Shaman): "Dragon spells you cast cost {1} less to cast. Whenever a
  Dragon you control enters, you may have Sarkhan become a copy of it until end of turn,
  except its name is Sarkhan, Soul Aflame and it's legendary in addition to its other
  types." The cost reduction alone is already-shipped vocab (`costModification`, a
  `subtype: "Dragon"` filter). The copy clause needs a real new primitive: today
  `GameObject.copyOf` (Clone, P5b's `create-token-copy`) makes *every* characteristic
  read — including `printedCardName`, so the name too — resolve through the copied
  card, permanently until the object changes zones. Sarkhan's version keeps its *own*
  name (and stacks an added supertype) on top of the copied P/T/types/abilities, and
  reverts at end of turn rather than on a zone change — a name-override exception (rule
  707.9) the current model has no room for. Building it just for this one card is
  disproportionate (the P0-tail verdict); worth a proper pass if another "become a copy,
  except …" card shows up. Not shipped even the partial cost-reduction-only form, since
  the copy clause is the card's whole point.
- **Still blocked — Lord Windgrace.** A genuine planeswalker (C18, `{2}{B}{R}{G}`,
  loyalty 5): "+2: Discard a card, then draw a card. If a land card is discarded this
  way, draw an additional card. −3: Return up to two target land cards from your
  graveyard to the battlefield. −11: Destroy up to six target nonland permanents, then
  create six 2/2 green Cat Warrior creature tokens with forestwalk. Lord Windgrace can be
  your commander." No land destruction and no emblem, unlike the original guess. Three
  separate new primitives, all disproportionate for one card alone:
  - `+2` needs the discard resolution (today asynchronous — it parks an
    `AwaitingDecision` and waits for a dispatched `discard` action) to branch on *what
    was actually discarded* once that decision resolves — nothing else in the engine
    resumes a follow-on effect off a decision's outcome this way (`sacrifice-source`'s
    `then` is the closest precedent, but it's a synchronous yes/no, not "inspect the
    chosen object's type").
  - `−3`/`−11` need "up to N" targeting — every `TargetSpec` slot today is mandatory;
    there's no optional/"any number up to N" target arity anywhere in `target.ts` /
    `targeting.ts` / `legalActions`. (`−3` could degrade to the existing non-targeted
    `return-from-graveyard { filter: { type: "land" }, count: 2 }` — functionally close,
    just not "target" cards — but `−11`'s "up to six target nonland permanents" has no
    reasonable non-targeted stand-in.)
  - "Can be your commander" is a new `CardDefinition` flag with no representation at all
    in `identity.ts` / `server/src/deck-validation.ts` today (commander legality assumes
    a legendary *creature*).

## P13 — Divided damage  (~2 cards)

**Reassessed against real Oracle text — only one of the two candidate cards actually
needs "divided damage"; the other's guess was wrong (same P9/P11/P12 pattern).**

- **DONE — Magmaquake.** Real text (`{X}{R}{R}` instant): "Magmaquake deals X damage to
  each creature without flying and each planeswalker." Not divided damage at all — a
  plain `damage-all`, twice, needing only a new `CardFilter.notKeyword` (mirrors the
  existing `keyword` clause) for "each creature *without* flying"; the planeswalker half
  reuses the existing `damage-all` unchanged (`dealDamage` already reduces loyalty for a
  planeswalker target, per the EG-5 audit). `{X}` as the amount already worked
  (`EffectAmount = "x"`). No card in the pool is both a creature and a planeswalker, so
  running the two sweeps back-to-back in a `sequence` never double-hits anything.
  `x-effects.test.ts`.
- **Still blocked — Dragonlord Atarka.** Real text (TDC 2025, `{5}{R}{G}`, 8/8 flying
  trample Elder Dragon): "When Dragonlord Atarka enters, it deals 5 damage divided as
  you choose among any number of target creatures and/or planeswalkers your opponents
  control." This *is* the genuine "divided damage" mechanic (rule 601.2d — the split is
  chosen as targets are announced, one to five targets, each getting at least 1 of the
  5). It needs a new targeting shape the engine has never had: every `TargetSpec` slot
  today is a fixed, mandatory arity (`targets: readonly TargetSpec[]`, one slot per
  index); there's nothing for "choose *any number* of targets, then divide N among them."
  This is the same missing primitive P12 flagged for Lord Windgrace's −3/−11 ("up to N"
  targeting) — Atarka is the only card on the list that would need the *division*
  half on top of the arity half, so it's a good future candidate to build both pieces
  against at once, but doing it for this card alone right now is disproportionate (the
  P0-tail verdict, again).
- **Still blocked — Dragonhawk, Fate's Tempest.** Not divided damage either — real text
  (Bloomburrow, `{3}{R}{R}`, 5/5 flying): "Whenever Dragonhawk enters or attacks, exile
  the top X cards of your library, where X is the number of creatures you control with
  power 4 or greater. You may play those cards until your next end step. At the
  beginning of your next end step, Dragonhawk deals 2 damage to each opponent for each
  of those cards that are still exiled." An impulse-draw-then-delayed-conditional-damage
  shape — exactly the gap already noted against **Valakut Exploration** in P3 ("impulse
  draw + delayed end-step damage"), now with a second candidate card. Worth building
  once, for both.

## P13 — Divided damage  (~2 cards)

"N damage divided as you choose among any number of targets" — **Dragonlord Atarka**,
Dragonhawk, Magmaquake (also needs `damage-all` to exclude a keyword and hit
planeswalkers).

## P14 — Choose-a-type-on-ETB  (~2 cards)

**DONE — Urza's Incubator.** Real text confirmed the guess this time: "As Urza's
Incubator enters, choose a creature type. Creature spells of the chosen type cost {2}
less to cast." Two additions:

- **`CardDefinition.chooseCreatureTypeOnEnter: boolean`** → a new **`choose-creature-type`**
  `AwaitingDecision`, mirroring Clone's `choose-copy` exactly (an ETB choice, not a cast-time
  one — raised from the same `resolveTopOfStack` hook, right where `copyOnEnter` is checked).
  `Game.beginCreatureTypeChoice` offers a short curated menu (`INCUBATOR_CREATURE_TYPES` —
  weighted toward subtypes the pool actually casts as creature spells, so the fuzzer
  exercises the discount); `applyCreatureTypeChoice` stores the answer on the permanent's new
  `GameObject.chosenCreatureType`, cleared on any zone change like `copyOf` (a fresh entry
  chooses again). Full stack: `Action`/`LegalAction` variant, `PlayerController.chooseCreatureType`
  (Automatic/Scripted/Random all implemented — Random picks uniformly), a client `choose-creature-type`
  `Table` mode (one button per option), `AWAITING_LABEL` entry, both event-log formatters. Browser-verified live.
- **`StaticAbility.costModification.matchesChosenCreatureType?: boolean`** — `costModificationFor`
  folds the source's own `chosenCreatureType` into the `applies` filter's `subtype` clause at
  read time (nothing matches before the choice is made), rather than the filter being fixed on
  the card the way Foundry Inspector's is. No change needed to `EffectSpec`/`EffectApi` — this
  is a static, not a resolving effect.

Shipped as one card (Dragonspeaker Shaman, shipped in an earlier pass, has a *fixed* type —
no ETB choice needed, hence excluded from this feature's count). `choose-creature-type` is
now a reusable primitive for any future "choose a creature type" card, independent of what
the choice is used for. `cost-modification.test.ts`.

## P15 — Keyword mechanics, 1–2 cards each

**Reassessed against real Oracle text — three of the eight remaining cards needed no new
vocab or a much smaller primitive than guessed (P9/P11/P12/P13/P15's own Starfield Vocalist
all show this pattern); shipped those plus Exalted. Cycling (Sheltered Thicket) had already
shipped in P0, so it's dropped from this bucket's count.**

- **DONE — Lightning Greaves.** A new **`"shroud"`** `Keyword` (rule 702.18) — stronger than
  hexproof: `isLegalTarget` now blocks *every* targeting attempt on a shrouded permanent, not
  just an opponent's. Equip `{0}` and haste were already expressible. `attachments.test.ts`.
- **DONE — Ignoble Hierarch.** Exalted (rule 702.111a: "whenever a creature you control
  attacks alone, that creature gets +1/+1 until end of turn") needed two additions: a new
  **`TriggerSpec.on: "attacks-alone"`**, matched against a new **`attacked-alone`** `GameEvent`
  emitted once per `declare-attackers` action (only when it declared exactly one attacker
  total — *not* checked per `attacker-declared` event, which would wrongly read "alone" for
  the first of several attackers declared together) — and a new **`EffectTargetRef`**
  case, `"trigger-object"`, so a `modify-pt` can pump the lone attacker itself rather than a
  target or the ability's own source. Its mana ability ({T}: Add {B}, {R}, or {G}) needed no
  new vocab — three `manaTapAbility` alternatives, same as any dual/tri-land. Multiple Exalted
  sources stack correctly (each is an independent triggered ability). `exalted.test.ts`.
- **DONE — Starfield Vocalist.** Real text has no Constellation and no turn-based hexproof
  anthem — the guess was wrong. It's actually a **Panharmonicon effect**: "If a permanent
  entering the battlefield causes a triggered ability of a permanent you control to trigger,
  that ability triggers an additional time." New **`StaticAbility.doubleEntryTriggers: {
  filter?: CardFilter }`** (`filter` narrows the *entering* permanent — omitted here, matching
  its unrestricted text; Panharmonicon itself would use `{ type: "artifact" }` unioned with
  `{ type: "creature" }`... no such card is on the list, so an OR-of-types filter shape wasn't
  needed). `Game.entryTriggerDoublers` counts how many active doublers the ability's
  controller has and folds `1 + that count` into the same `multiplier` the `stackCount` /
  batch-`count` machinery already uses — so it composes for free with a stacked token's ETB
  trigger, a batch of tokens entering at once, *and* multiple doublers, without touching any
  of that existing logic. Warp (its actual alt-cast mechanic) isn't modeled — dropped, same as
  other cards' unimplemented alt-cast clauses elsewhere in the pool. `entry-trigger-doubling.test.ts`.
- **DONE — Summon: Titan.** Real text needed *zero* new vocab — the guessed feature ("chapter
  counters on a creature" as something new) was wrong: an enchantment creature with
  `CardDefinition.chapters` already works exactly like any other Saga, because the SBA that
  sacrifices a completed Saga (`704.5s`) never checked for "enchantment only" to begin with —
  it just is one, generically, alongside being a 7/7 Reach/Trample creature. Every chapter
  effect was already-shipped vocab too: `mill`, `return-from-graveyard` (Splendid Reclamation's
  exact shape), and a `countOf`-scaled `modify-pt` + `grant-keyword` (Craterhoof's shape).
  Chapter III's "**another** target creature you control" drops the "another" the same way
  Anafenza, the Foremost's attack trigger already does — no generic "not this object"
  targeting exclusion exists. `saga.test.ts`.
- **Still blocked — Rhythm of the Wild.** Confirmed real text: "Creature spells you control
  can't be countered. Nontoken creatures you control have riot." Two gaps: (1) riot (rule
  702.157) is itself an ETB choice (+1/+1 counter or haste) — but unlike Urza's Incubator's
  choice (P14, made once as *that* permanent enters), riot has to fire for *any* creature that
  *has* the keyword, printed **or granted** by a static like this one, meaning the check has to
  run generically in the entering-a-creature path against its post-layer-6 characteristics,
  not be wired to one specific `CardDefinition` flag; (2) "spells you control can't be
  countered" is a new kind of static — a battlefield permanent granting *other* spells
  protection from countering, as opposed to `CardDefinition.cantBeCountered` (a fixed
  per-card flag, Carnage Tyrant) or `costModification` (adjusts cost, not counterability).
- **Still blocked — Mosswort Bridge.** Confirmed real text: Hideaway 4 (look at top four,
  exile one face down, rest to the bottom) + a conditional "you may play the exiled card
  without paying its cost if creatures you control have total power 10+." Hideaway itself
  (an ETB look-and-exile) is close to the existing `look-and-choose` effect but exiling
  face-down with a *separate*, later, condition-gated "cast for free" permission is new
  shape — `look-and-choose`'s destinations are hand/battlefield, not "sitting in exile until a
  later condition is met."
- **Still blocked — Springheart Nantuko.** Confirmed real text: Bestow `{1}{G}` (rule
  702.103 — a spell cast as an Aura that can also just be a creature spell, and stops being
  an Aura if what it enchants leaves) + a landfall trigger that conditionally creates either a
  copy of the enchanted creature or a 1/1 Insect. Bestow is a real, structural gap — no
  "spell that's optionally an Aura" concept exists (`copyOnEnter`/`castModal` don't cover a
  card that's a creature *or* an Aura depending how it's cast); the landfall payload itself
  (a `conditional` between `create-token-copy` and `create-token`) is already expressible.
- **Still blocked — Room cards (Mirror Room // Fractured Realm, Walk-In Closet // Forgotten
  Cellar).** Confirmed real text for both. Rooms (Duskmourn, rule 715-adjacent) are a genuinely
  new card shape: two enchantment halves ("doors"), either castable, each door unlocking
  independently onto the *same* permanent (not a `faces` MDFC/adventure choice — both doors
  can eventually be unlocked on one Room). Needs real card-shape work before any individual
  door's own ability matters. Once Rooms exist: Mirror Room's door is an ordinary
  `create-token-copy`; Fractured Realm's door is a **broader** version of this pass's
  `doubleEntryTriggers` (rule text: "if a triggered ability of a permanent you control
  triggers" — no restriction to an entering permanent at all, so it'd need its own, wider
  static rather than reusing this pass's `filter`-on-the-entering-permanent shape as-is);
  Walk-In Closet's door reuses the already-shipped `playFromGraveyard` permission; Forgotten
  Cellar's door needs "cast spells from your graveyard this turn" (a temporary zone-wide
  casting permission) plus an exile-instead-of-graveyard replacement, both new.
- **Still blocked — Exploration Broodship.** Confirmed real text: Station (rule
  702.171 — not crew), an activated ability that piles charge counters onto this Spacecraft
  equal to a tapped creature's power, with count-gated ("3+", "8+") text abilities and an
  animation into a creature at 8+. A new permanent sub-type (Spacecraft) plus the Station
  activation/threshold machinery — no existing vocab covers "an activated ability's magnitude
  scales with what it taps, accumulated across multiple activations as counters, gating
  later text by counter thresholds."
- **Still blocked — Virtue of Knowledge.** Its enchantment front half is now *un*blocked —
  it's the exact same `doubleEntryTriggers` primitive Starfield Vocalist just shipped, with no
  filter. Its Adventure instant half ("Copy target activated or triggered ability you control.
  You may choose new targets for the copy") is the actual gap: a new "copy an ability
  currently on the stack" effect — `copy-spell` only copies a *spell* object on the stack, and
  an activated/triggered ability's stack object (`GameObject.abilityKind`) has no `isCopy`/
  duplication path at all today.

`exalted.test.ts`, `entry-trigger-doubling.test.ts`, `attachments.test.ts`, `saga.test.ts`.

## P16 — Newer sets, verified

**All 20 cards' real Oracle text pulled from Scryfall and cross-checked against the guesses
below.** 9 shipped — most needing no new vocab at all, or a small, reusable generalization of
something already shipped; the rest documented precisely, several sharing a gap with a card
from an earlier pass (or with each other) rather than needing something bespoke.

- **DONE — Princess Sarah.** "You may play two additional lands on each of your turns." New
  **`StaticAbility.extraLandsPerTurn: number`**, folded into a new `Game.maxLandsFor(player)`
  on top of the global `GameRules.maxLandsPerTurn` (previously a flat rule with no per-player
  override at all). `extra-land-drops.test.ts`.
- **DONE — Icetill Explorer.** "You may play an additional land… / play lands from your
  graveyard. / Landfall — mill a card." Only the first clause is new (`extraLandsPerTurn: 1`);
  `playFromGraveyard` and a filtered landfall `mill` were already shipped. `extra-land-drops.test.ts`.
- **DONE — Sabotender.** "Landfall — deals 1 damage to each opponent." New: the `damage`
  `EffectSpec` gains an optional **`who?: PlayerScope`** (mirroring `lose-life`) for untargeted
  damage to a whole scope, plus `EffectApi.dealDamageScoped`. `landfall-payloads.test.ts`.
- **DONE — Tannuk, Memorial Ensign.** Reuses Sabotender's `who`-scoped damage exactly. Drops
  "if this is the second time this ability has resolved this turn, draw a card" — counting a
  *specific ability's* own resolutions this turn (reset next turn) isn't tracked anywhere;
  approximated the same way other cards drop a clause. `landfall-payloads.test.ts`.
- **DONE — Encroaching Dragonstorm.** ETB search (already-shipped `search-library`) + "when a
  Dragon you control enters, return this enchantment to its owner's hand." New:
  **`return-to-hand`'s `target` widened from `number` to `EffectTargetRef`**, so `"source"`
  bounces the effect's own permanent with no target at all (previously every `return-to-hand`
  needed a chosen target). `landfall-payloads.test.ts`.
- **DONE — Temur Battlecrier.** "During your turn, spells you cast cost {1} less… for each
  creature you control with power 4+." New: **`costModification.reduceGeneric` widened to
  `number | { countOf: CardFilter }`** — a live count, evaluated the same way `EffectAmount`'s
  `countOf` is. "During your turn" was already expressible (`StaticCondition` `"your-turn"`).
  **Caught and fixed along the way:** `costModificationFor` evaluated a filter's
  `controlledBy: "you"` from the *casting* player's perspective, which a spell always
  trivially satisfies (it's controlled by whoever casts it) — so an opponent's Foundry
  Inspector / Dragonspeaker Shaman / Urza's Incubator could incorrectly discount *your* spells
  too, a latent bug in all three already-shipped cards. Fixed to evaluate from the static's own
  controller's perspective, which is what `controlledBy: "you"` actually means on every one of
  those cards' printed text. `cost-modification.test.ts` (a regression test + Temur Battlecrier
  coverage).
- **DONE — Mole Man, Moloid Master.** "You may play lands from your graveyard. / Landfall —
  create a 1/1 green Minion token named Moloid with 'whenever this token attacks, you may mill
  a card.'" Zero new vocab — `playFromGraveyard`, a landfall `create-token`, and the token's own
  `may` + `mill` attack trigger (World Shaper's exact shape) were all already shipped.
  `landfall-payloads.test.ts`.
- **DONE — Rydia, Summoner of Mist.** Ships the landfall loot half only ("may discard a card,
  if you do draw a card" — a `may` wrapping a `sequence` of `discard`+`draw`, no new vocab).
  Drops the "Summon" activated ability ("return target Saga card with mana value X from your
  graveyard… with a finality counter on it") — no `TargetSpec` for "a Saga card in your
  graveyard" exists, and finality counters (rule 122.3e — exile instead of any further zone
  change) aren't modeled as a replacement at all; this is the only card on the list needing
  either. `landfall-payloads.test.ts`.
- **DONE — Will of the Sultai.** A `castModal` "choose one" (mode 1: mill + `return-from-
  graveyard`, already-shipped shapes; mode 2: `add-counter` + `grant-keyword`). New: **the
  `add-counter` `EffectSpec`'s `amount` widened from `number` to `EffectAmount`** (mirrors
  `modify-pt`'s power/toughness already being one), for "X counters where X is the number of
  lands you control." Drops "if you control a commander, you may choose both instead" —
  `castModal`'s `minModes`/`maxModes` are fixed per `CardDefinition`, not conditional on board
  state at cast time; approximated as a plain "choose one," the common case. `modal-cast.test.ts`.

**Still blocked**, each with a specific, now-verified reason:

- **Broodcaller Scourge** — `deals-combat-damage-to-player` needs a `filter` (today it only
  supports `who`) for "one or more Dragons you control," and "put a permanent card with mana
  value ≤ X from your hand onto the battlefield" is a new cheat-into-play effect gated by a
  live amount.
- **Deceptive Frostkite** — `copyOnEnter` needs an "except gains an extra type/keyword" option
  on top of the copy. Notably *simpler* than Sarkhan's P12 gap: Frostkite's copy keeps the
  *copied* thing's name (ordinary copy semantics), it just also gains Dragon + flying: a
  reasonable, self-contained extension, just not built yet.
- **Dracogenesis** — "you may cast Dragon spells without paying their mana costs" (an
  Omniscience-style free-cast permission covering the *whole* cost, colored pips included) —
  `costModification` only ever adjusts the generic portion.
- **Incinerator of the Guilty** — "collect evidence X" (rule 725, Duskmourn) is a real new
  sub-system: an at-resolution cost paid by exiling graveyard cards totaling mana value ≥ a
  player-chosen X, unlike anything currently modeled (every existing cost is paid at cast/
  activation time, not mid-resolution).
- **World War Hulk** — a Saga; chapter II ("three +1/+1 counters") is already-shipped
  `add-counter`. Chapter I ("cast the next red or green creature spell this turn for free")
  needs a delayed, one-shot free-cast permission applied to whatever the player casts next.
  Chapter III ("double its power and toughness") needs a new effect that reads a permanent's
  *current* computed P/T and doubles it — every existing P/T effect adds an independent
  amount, none reads and transforms the current value.
- **Earthbender Ascension** / **Toph, Hardheaded Teacher** — both need "earthbend N" (Avatar):
  animate a land as a 0/0 haste creature with N counters, returning it tapped when it next
  dies or is exiled (its own small replacement-on-a-specific-object rule). Two cards would
  share the primitive if built. Toph also references a "Lesson" card type/subtype that isn't
  in the pool.
- **Famished Worldsire** — Ward `{3}` already works. "Devour land 3" (sacrifice lands as it
  enters, get 3× that many counters) is a new ETB replacement; its own ETB effect then needs
  X = *this creature's current power* (post-devour), which no `resolve` script can read today
  — `EffectApi` has no characteristics-reading call at all.
- **Horizon Explorer** — "lands you control enter untapped" is the *inverse* of the existing
  enters-tapped replacement machinery (an override, not another tapped-condition). "Whenever
  you attack a player, create a Lander" fires once per *attacked player* per combat — a
  different granularity than the existing `"attacks"` `TriggerSpec`, which fires once per
  *attacking creature*.
- **Ureni, the Song Unending** — the same "divided damage among any number of targets"
  primitive blocking Dragonlord Atarka (P13) and Lord Windgrace's −3/−11 (P12). A third card
  now wants it.
- **Evendo, Waking Haven** / **Kavaron, Memorial World** — Station (rule 702.171), the same
  unbuilt mechanic blocking Exploration Broodship (P15). Two more cards would share it.
- **Frontier Siege / Frostcliff Siege** ("Siege" cycle) — "as this enters, choose [A] or [B]"
  then carry a *different* static/triggered ability set for the rest of the game depending on
  the choice. Structurally close to P14's `choose-creature-type` (an ETB choice), but the
  choice has to gate which of two whole ability sets apply — needs a new `StaticCondition`
  kind reading back a stored per-permanent choice, not just a filter completion. Both Sieges
  would share the primitive; deferred rather than folded into this already-large pass.
- **Dragonhawk, Fate's Tempest** — already assessed in P13 (impulse-draw + delayed
  conditional damage — see there), unrelated to anything else in this bucket.

`extra-land-drops.test.ts`, `landfall-payloads.test.ts`, `cost-modification.test.ts`,
`modal-cast.test.ts`.

## P17 — A small grab-bag pass, verified

**All seven cards' real Oracle text pulled from Scryfall (`npm run card:lookup -w engine`) and
cross-checked against the guesses below — two more "the guess was wrong" cases (Bountiful
Landscape, Sakura-Tribe Elder), the rest needing one small, reusable primitive each.**

- **DONE — Amulet of Vigor.** "Whenever a permanent you control enters tapped, untap it." No
  target — the `untap` `EffectSpec`'s `target` field was `number`-only (an index into a chosen
  target), so it widened to **`EffectTargetRef`** (mirroring `return-to-hand`'s P16 widening),
  letting `target: "trigger-object"` untap the permanent whose entering fired the trigger with no
  target slot at all. The trigger itself needed no new vocab: `on: "enters-battlefield", who:
  "you-control", filter: { tapped: true }` — `CardFilter.tapped` already existed, and the
  `permanent-entered-battlefield` event already stamps `triggerObject` on every `enters-battlefield`
  trigger (P5b/P15's plumbing). `needed-cards-p17.test.ts`.
- **DONE — Sakura-Tribe Elder.** Real text: "Sacrifice Sakura-Tribe Elder: Search your library for
  a basic land card, put that card onto the battlefield tapped, then shuffle." The neededCards
  guess ("sacrifice-on-death tutor") was wrong — it's not a dies-trigger tutor at all, just an
  **activated ability whose cost is a bare sacrifice** (`cost: { mana: null, tap: false, sacrifice:
  "self" }`) plus Rampant Growth's exact `search-library` effect. Zero new vocab.
  `needed-cards-p17.test.ts`.
- **DONE — Bountiful Landscape.** Real text: `{T}: Add {C}.` / `{T}, Sacrifice this land: Search
  your library for a basic Forest, Island, or Mountain card, put it onto the battlefield tapped,
  then shuffle.` / `Cycling {G}{U}{R}`. The neededCards guess ("a DFT reveal-a-basic-or-enters-
  tapped land") was wrong — the real card never enters tapped at all; it's an always-untapped
  colourless tapland with a sac-fetch (the OR-of-3-subtypes `CardFilter.subtypes` P1 already
  supports) and already-shipped cycling (P0). Zero new vocab.
- **DONE — Festering Thicket.** Real text: an unconditional-enters-tapped B/G dual + `Cycling
  {2}` — Sheltered Thicket's exact shape (P0), just a different colour pair. Zero new vocab.
- **DONE — Vernal Fen.** Real text: "enters the battlefield tapped unless you control two or
  more basic lands" — a count-check land, `enterTappedUnlessLands("Vernal Fen", 2, "basic")`,
  Cinder Glade's exact shape (P0). Zero new vocab.
- **DONE — Turbulent Fen.** Real text: "enters the battlefield tapped unless your opponents
  control eight or more lands." The plural "your opponents" sums the count **across every
  opponent combined**, unlike `opponent-controls`'s per-opponent-on-their-own semantics (P7,
  Defense of the Heart's singular "an opponent"). New **`StaticCondition` kind
  `opponents-control-total { filter, atLeast }`** (`characteristics.ts`'s `evalStaticCondition`)
  sums a filter match across every non-source, non-eliminated opponent's battlefield. A one-off
  static (`tappedUnless`) rather than a new helper, since no other card on the list needs it yet.
  `needed-cards-p17.test.ts`.
- **DONE — Manifold Key.** "{1}, {T}: Untap another target artifact. {3}, {T}: Target creature
  can't be blocked this turn." The unblockable half needed no new vocab (`grant-keyword`,
  keyword `"unblockable"`, `duration: "end-of-turn"` — already shipped). The untap half needed a
  new **`"artifact"`** `TargetSpec`, since only `"artifact-or-enchantment"` existed (which would
  incorrectly also allow enchantments) — matched in `targeting.ts` the same way
  `"artifact-or-enchantment"` is. **Caught by the 4-player fuzzer:** dropping "another" (the
  usual precedent for a missing exclusion — Anafenza, the Foremost's attack trigger) isn't
  harmless here — a self-untap ability is a *repeatable, no-net-cost loop* (tap self as the
  cost, untap self as the effect), and `RandomController` spamming it long enough tripped the
  200k-tick `Game.advance` safety budget. Fixed properly instead of dropped: new
  **`ActivatedAbility.otherOnly?: boolean`** (mirrors `TriggeredAbility.otherOnly`) excludes the
  source from every target slot's legal options, threaded through `targetOptionsFor` (the
  `legalActions` builder), `whyCannotActivateAbility`'s per-spec legality check, and
  `activateAbility`'s dispatch-time validation. Still no such exclusion for a *triggered*
  ability's or spell's targets. `needed-cards-p17.test.ts`.

`needed-cards-p17.test.ts`; all seven added to `random-demo.mjs`'s deck A/C for fuzz coverage
(Amulet of Vigor pairs directly with deck A's existing tapland suite — Frontier Bivouac, Temple
of Abandon, Rootbound Crag, Hinterland Harbor, Sheltered Thicket, Cinder Glade).

## Full-pool Scryfall verification pass

**Every already-implemented card in `cards/pool/` (not just newly-authored ones) checked
against real Scryfall data, prompted by a user-found bug (Ureni of the Unwritten was
mono-green `{4}{G}{G}` instead of Temur `{4}{G}{U}{R}`) — the first time this project
audited its *existing* pool rather than a card being newly authored.**

Built `engine/scripts/verify-cards.mjs`: resolves every pool card's real mana cost,
colors, supertypes/types/subtypes, and power/toughness/loyalty via Scryfall's batch
`/cards/collection` endpoint (up to 75 names per request — ~250 cards in 4 requests
instead of one-per-card), with a fuzzy-search fallback for the names it can't
exact-match (typically one face of a DFC/split/adventure card) and a
[`namesOf`/`actuallyNamed`] guard against the fuzzy fallback returning a real but
*unrelated* card for a homebrew name that merely contains a real card's words (caught
live: "Rendwin, Warden of the Grove" fuzzy-matched the real, unrelated "Warden of the
Grove"). Every HTTP call has a hard timeout and a bounded retry count (never an
unbounded loop) — 429s and 5xx (Scryfall/Cloudflare hiccups, observed in practice after
a day of heavy lookups) are retried; a real 404 is not. `flavor_name` is checked
alongside `name` (Universes Beyond crossovers print a card under a different name —
"Princess Sarah" *is* "Azusa, Lost but Seeking").

**Result: 220 checked, 27 confirmed not real Magic cards (this project's own homebrew —
commanders like Sarova/Ashmark/Bramblewing built for multiplayer/fuzz coverage, and the
worked examples AUTHORING.md names for DFC/adventure/modal cards), 31 real mismatches,
all fixed:**

- **Pure stat/cost/type corrections (25 cards)** — Angelic Edict, Cinder Elemental,
  Darksteel Myr, Defense of the Heart, Dragonspeaker Shaman, Fume Spitter, Goblin Raider
  (also restored a missing "can't block" static — the ability was dropped entirely, not
  just mistyped), Grapeshot, Levitation, Lord of Extinction, Mortivore (+ a documented
  dropped Regenerate — rule 701.16, unmodeled), Oracle of Mul Daya (+ restored a missing
  `extraLandsPerTurn` and a documented dropped "play lands from the top of your library"
  permission — a distinct capability from `playFromGraveyard` the engine doesn't have),
  Prodigal Sorcerer, Prosperous Innkeeper, Rumbling Baloth, Scute Swarm, Thieving Magpie,
  Thorn of the Black Rose, Wurmcoil Engine, Zulaport Cutthroat, and the three MKM
  surveil-land reskins (Commercial District, Raucous Theater, Underground Mortuary —
  missing only their land-type subtypes; the surveil trigger itself was already correct).
- **Boggart Brute** — an entirely wrong card: implemented as `{1}{B}` black instead of
  the real `{2}{R}` red (Menace was already correct).
- **Essence Flux** — wrong color/cost (`{1}{W}` white instead of `{U}` blue). Drops "if
  it's a Spirit, put a +1/+1 counter on it" — `EffectApi.flicker` returns `void`, with no
  way for a `resolve` script to read back the new object it just created.
- **Gaze of Granite** — wrong color/cost (`{X}{R}{R}` instead of `{X}{B}{B}{G}`) *and* a
  wrong filter: destroyed only creatures, when the real card hits every nonland permanent
  (`CardFilter.notTypes: ["land"]`, a generalization already available, just unused here).
- **Tear Asunder** — the unkicked cost/color was wrong (`{B}{G}` instead of `{1}{G}` —
  black should only ever enter via the `{1}{B}` kicker, not `{2}`), and the kicked target
  spec loosened to the real "target nonland permanent" (was `"permanent"`, which would
  also have allowed targeting a land).
- **Wilt-Leaf Cavaliers** — wrong cost/stats (`{2}{G/W}{G/W}` 5/5 instead of
  `{G/W}{G/W}{G/W}` 3/4) and a wrong keyword: **vigilance**, not trample (the real card
  has no trample at all).
- **Combat Thresher** — wrong cost/stats (`{6}` 4/4 instead of the real `{7}` 3/3), an
  invented Ward {2} and Cycling {2} neither exist on the real card, and a missing Double
  strike. Prototype (rule 702.163 — the alternate {2}{W} 1/1 casting mode) isn't
  modeled; only the base printing is authored. Its Ward {2} had specifically been chosen
  as `ward.test.ts`'s worked example — since the real card has none, that test now uses
  **Miirym, Sentinel Wyrm** instead (see below), which genuinely has it.
- **Miirym, Sentinel Wyrm** — wrong cost/stats/subtype (`{2}{G}{U}{R}` 3/7 Dragon instead
  of `{3}{G}{U}{R}` 6/6 Dragon Spirit), the wrong keyword (vigilance instead of flying +
  ward {2}), *and* the token-copy ability had an entirely invented clause — "that token
  gains haste, exile it at the beginning of the next end step" — that doesn't exist on
  the real card at all (a permanent, ordinary non-legendary copy, full stop). This was
  the P5b pass's own worked example for `create-token-copy`'s `gainsHaste`/
  `exileAtEndStep` flags, checked in as "fully faithful" without the text ever having
  been checked against Scryfall; `token-copy.test.ts` rewritten to match the real card
  (the two flags stay implemented, now unexercised by any pool card, pending a real
  future card shaped like Reflection of Kiki-Jiki).
- **Ureni of the Unwritten** — the bug that started this pass: `{4}{G}{G}` mono-green
  Elf Shaman 5/5 instead of the real `{4}{G}{U}{R}` Temur Spirit Dragon 7/7 with flying
  and trample (neither keyword was present at all). Also missing half the ability — real
  text triggers on **enters or attacks**; only the ETB half existed. All of deck A
  (`random-demo.mjs`) and the server's Ureni precon (`server/src/decks.ts`) were already
  built assuming the correct Temur manabase, so the fix is a strict improvement, not a
  deck rework.

`needed-cards-p17.test.ts` gained coverage incidentally via the Combat Thresher →
Miirym swap in `ward.test.ts`; `additional-costs.test.ts`, `x-effects.test.ts`,
`hybrid-mana.test.ts`, `bounce.test.ts`, `fight-and-keywords.test.ts`, and
`zone-choice.test.ts` all needed mana-base/assertion updates to match the corrected
costs. Full suite (589 tests) green; both the 2-player (300 games) and 4-player (150
games) fuzzer runs clean afterward.

---

## Client Scryfall image batching

Separately from the verification pass above, `client/src/ui/art.ts` was doing a
per-card-tile `api.scryfall.com/cards/named?...&format=image` lookup — a real card-name
lookup **plus** a 302 redirect to the actual CDN file, two round trips per rendered
card, against the same 10 req/sec budget the JSON API shares. `CardTile.tsx` now queues
each card's name (`queueArtLookup`) in a `useEffect` rather than fetching inline; every
name queued in the same ~30ms window is folded into one `POST /cards/collection` call
(batched, ≤75 identifiers per request), and the returned `image_uris` are cached so
`resolveArtUrl` returns a direct CDN URL — no redirect — once resolved. A
`useSyncExternalStore` subscription re-renders `CardTile` when the cache updates; until
then (or if the batch fetch fails) the old by-name URL still renders, so nothing
regresses. Verified live via a scratch room with ten distinct real cards on the
battlefield: every image request went straight to `cards.scryfall.io`, zero requests to
`api.scryfall.com/cards/named` at all.

---

## P18 — A `neededCards.txt` re-audit against real Scryfall text + current vocab

Prompted by: "get the number of `neededCards.txt` entries that can be implemented
without adding new features much higher, and verify the FEATURE notes are actually
accurate." Batch-fetched real Oracle text for every `[ ]` entry (one `/cards/collection`
call, 70 identifiers) and re-checked each FEATURE note against both that text and the
engine's *current* vocabulary — grown substantially since several of these notes were
first written (P14–P17 added `extraLandsPerTurn`, `doubleEntryTriggers`, `otherOnly`,
`opponents-control-total`, `EffectTargetRef: "trigger-object"`, `castModal`,
`additionalCost`, `kicker`, `selfCostReduction`, the "artifact" TargetSpec, and more).

**Three stale duplicate lines**, where Deck 1's copy of a card had been implemented but
Deck 2's `(dup — see Deck 1)` line was never flipped to match: Amulet of Vigor, Cinder
Glade, Stomping Ground — all now `[+]` in both decks.

**Three cards needed zero new vocab and are now implemented** (`needed-cards-p18.test.ts`,
added to `random-demo.mjs` deck A, `card:verify` clean):

- **Ganax, Astral Hunter** — the file's old FEATURE note ("mana on a trigger that
  doesn't empty between steps") described a mechanic the real card doesn't have at all.
  Real text is a plain Dragon-ETB Treasure trigger (`trigger: { on:
  "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } }` — no
  `otherOnly`, since "Ganax or another Dragon" counts its own entry too). "Choose a
  Background" (a Commander deckbuilding option) isn't modeled and isn't needed for the
  creature to function as an ordinary card.
- **Dragon Tempest** — both triggers turned out to be already-shipped vocab: "a flying
  creature gains haste" is `grant-keyword` with `target: "trigger-object"` (Amulet of
  Vigor's P17 addition); "deals X damage where X = Dragons you control" is `damage` with
  `amount: { countOf: { subtype: "Dragon", controlledBy: "you" } }` (Scourge of Valkas's
  exact shape). The old FEATURE note predated both additions.
- **Lotus Field** — "sacrifice two lands" is a plain `sacrifice` effect (`who: "you"`,
  `filter: { type: "land" }`, `count: 2`) — `sacrificeByEffect` already auto-resolves
  with no decision when the eligible count doesn't exceed what's owed, which correctly
  covers the real rules interaction where playing it with no other land sacrifices it
  too. "Add three mana of any one color" is `add-mana` with `mana: "any-color", amount:
  3` — the existing "any-color" plumbing already commits to one chosen color for the
  *whole* activation (confirmed by reading `Game.addMana` — the color is picked once per
  ability activation, not once per mana unit), so a multi-unit any-color ability was
  already correctly supported, just never exercised by a pool card before.

**Two "half-free" finds** — not fully authored (the rest of the card is still blocked),
but worth knowing about since the blocked half isn't what the note used to say:

- **Conduit of Worlds** — "you may play lands from your graveyard" is already
  `playFromGraveyard: { type: "land" }` (Ramunap Excavator's exact shape). Only the
  second ability (target a nonland permanent card in your graveyard, cast it once per
  turn) needs new vocab.
- **Dryad of the Ilysian Grove** — the extra land drop is already `extraLandsPerTurn: 1`
  (P16). Only "lands you control are every basic land type" needs new vocab (a
  continuous "grant subtypes" static — nothing like `grantKeywords` exists for
  subtypes).

**Several FEATURE notes described the wrong mechanic entirely** (written from memory
without checking Scryfall — exactly the failure mode this pass exists to catch) and were
rewritten to match the real card:

- **Last March of the Ents** — no counters at all on the real card (draw = greatest
  toughness among your creatures, a max-stat aggregate `EffectAmount` doesn't have; then
  put creature cards from hand onto the battlefield, an effect that doesn't exist).
- **Marang River Regent** — no unblockable clause; it's an Omen MDFC needing optional
  "up to N" targeting (see below) and an Omen-specific "shuffle into library instead of
  graveyard" alt-zone rule.
- **Hellkite Courser** — no "attacking" clause; it cheats a commander out of the command
  zone (not a graveyard/library/hand zone any existing effect reads from).
- **Temple of the Dragon Queen** — not restricted mana like Haven of the Spirit Dragon;
  it locks in one fixed color on ETB and needs an OR-combined `tappedUnless` condition.
- **Six** — no forests-matter, graveyard-land-play, or regeneration text anywhere on the
  real card; it's Reach + a mill-then-take-a-land attack trigger + retrace.
- **Traveling Chocobo** — no Food, landfall, or counters at all; it's a play/cast-from-
  library-top permission (Bird-restricted) plus an already-free (P15) trigger-doubler.
- **Orcish Lumberjack** — its FEATURE note named an already-solved blocker (sacrificing a
  filtered permanent as a cost, P6); the real remaining gap is `add-mana`'s output shape.
- **Rakdos Charm** — two of its three modes are already expressible via `castModal`
  (P17's "artifact" TargetSpec); the third mode isn't "damage = power" as the note said,
  it's a mass reflexive "each creature deals 1 damage to its own controller" effect.
- **The Gitrog Monster** — no discard alternative on the real upkeep clause, just
  "sacrifice unless you sacrifice a land" (needs a `may`-with-`else` combinator).

**A recurring small gap worth flagging on its own**: `may` (the "You may [effect]"
EffectSpec) has no "if you do" tail — only `sacrifice-source` has a `then`. Widening
`may` to take an optional `then`/`else` (mirroring `sacrifice-source.then` and
`conditional.else`) would be a single, cheap change that unblocks pieces of Ob Nixilis,
the Fallen; Springheart Nantuko; and The Gitrog Monster at once.

**Two engine limitations, previously true but undocumented anywhere**, added to
`AUTHORING.md` §15: every declared target slot is mandatory (no "up to N" / optional
targeting — `game.ts`'s `targets.length !== targetSpecs.length` check throws), and
`ActivatedAbility` has no `condition` gate (`StaticAbility`/`TriggeredAbility` both have
one) — so "Activate only if …" printed on an activated ability can't be expressed yet
(Fanatic of Rhonas's Ferocious mana ability, Shifting Woodland's Delirium ability).

Full suite green after the 3 new cards (590 tests engine + 54 server); 2-player
(300 games) and 4-player (150 games) fuzzer runs clean; `card:verify` clean (223
checked, 0 mismatched).

---

## Note on the former Korvold stub

`engine/src/cards/pool/korvold-fae-cursed-king.ts` was an incomplete stub; **P6
finished it** — both triggered halves are now authored (enters/attacks → sacrifice
another permanent; whenever you sacrifice → +1/+1 counter + draw).
