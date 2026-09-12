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
| blocked on an engine feature | ~61 |

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
  **Miirym, Sentinel Wyrm** (fully faithful — haste + not-legendary + end-step exile),
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

## Note on the former Korvold stub

`engine/src/cards/pool/korvold-fae-cursed-king.ts` was an incomplete stub; **P6
finished it** — both triggered halves are now authored (enters/attacks → sacrifice
another permanent; whenever you sacrifice → +1/+1 counter + draw).
