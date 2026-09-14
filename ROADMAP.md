# ROADMAP.md

The plan that grew MTG-Engine from a ~80-card demo pool to a **baseline cardpool** —
enough engine coverage to run ordinary Commander decks / precons.

**Status: all 11 phases are done**, and so is the follow-on "needed-cards" P0–P20
card-driven bulk-authoring series. The engine now expresses the mechanics an ordinary
Commander deck needs. **The plan of record for new work lives in
`engine/src/cards/neededCards-features.md`**, not here — see [Where next](#where-next).

**What this file is for now.** Two things, both still live:

1. **[Architecture constraints](#architecture-constraints-read-before-touching-the-engine)** —
   read this section before touching the engine. It's the one part of this file that is
   guidance rather than history.
2. **The phase index** — roughly 180 comments across `engine/`, `server/` and `client/`
   cite "ROADMAP Phase N" (or "Phase 11 EG-*") to explain why a field or code path exists.
   The per-phase summaries below keep those references resolvable.

The blow-by-blow narrative each phase used to carry here (what landed in which increment,
which cards exercised it, what got deferred and why) is in `git log` — that's the
authoritative record, and it doesn't need a second copy. `git log --oneline ROADMAP.md`
walks the phases in order.

## Status

- [x] **Phase 1** — Replacement-effects engine (+ modal / "you may" primitives)
- [x] **Phase 2** — Effect vocabulary: `CardFilter`, effect scopes, mass effects, tutors, scry/surveil
- [x] **Phase 3** — Ability grammar breadth (triggers, statics, activated-ability costs)
- [x] **Phase 4** — Mana system depth (`{C}` / any-colour / multi-mana / Treasure / hybrid / twobrid / Phyrexian / snow / ability-granting to a group / fetchlands)
- [x] **Phase 5** — Planeswalkers
- [x] **Phase 6** — Alternate casting zones + the cast pipeline *(6a/6b done — flashback, Snapcaster, suspend, foretell, escape; 6c long tail deferred)*
- [x] **Phase 7** — Combat depth + turn-structure control *(core done — extra turns, additional combat, can't-be-blocked; first-strike window / trample-as-choice / must-be-blocked deferred)*
- [x] **Phase 8** — Cascade, storm, "cast" triggers, copy-a-spell
- [x] **Phase 9** — Commander-format completeness + deck validation *(core done — colour identity, deck validation, Partner, a 4th commander, simultaneous mulligans; Companion / legend-rule choice deferred)*
- [~] **Phase 10** — Tier 3 long tail (demand-driven) — **Sagas, 10a (MDFC), 10b (transform) + Day/Night, Monarch, Energy, Emblems, can't-be-countered, disturb, adventure all landed**; battles, phasing, dungeons/Initiative/Ring, banding deferred as large/niche
- [x] **Phase 11** — Engine-fidelity gaps — **all six increments done**: EG-1 uniform targeting decisions, EG-2 targeted modal spells, EG-3 `{X}` activated costs + conditional statics, EG-4 combat depth, EG-5 planeswalker ability coverage audit, EG-6 replacement pipeline v2 *(deferred: `choose-replacement-order`, damage redirection)*

## Dependency spine

```
Phase 1 (replacements) ─┬─► Phase 5 (planeswalkers: 0-loyalty SBA, enters-with-loyalty)
                        ├─► Phase 7 (combat / damage-prevention shields)
                        └─► Phase 9 (903.9a as a true replacement — actually done in Phase 1)

Phase 2 (CardFilter + effect scope) ─┬─► Phase 3 (trigger / static / cost vocab all take filters)
                                     ├─► Phase 6 (alt-cast "a land card from exile", etc.)
                                     └─► Phase 8 (cascade needs "a lower-mv nonland card")

Phase 4 (mana) ──► Phase 3's cost-modification statics actually land here
Phase 6 (cast pipeline) ─┬─► Phase 8 (cascade / storm / copy-spell)
                         └─► Phase 10a (modal / split faces — a cast-time face choice) ✓
```

## Architecture constraints (read before touching the engine)

- `GameState` is one plain `structuredClone`-able tree: **no class instances,
  `Map`/`Set`, or functions inside it.** New per-object or per-game state goes on
  `GameObject` / `GameState` / `PlayerState` as plain fields. Sets become arrays;
  registries of functions (replacement transforms, trigger predicates) live in
  the environment (`CardRegistry`), never in `state`.
- **Every player decision is a dispatched `Action`** gated by a discriminated
  `AwaitingDecision` on `state.awaiting`. Each new decision needs: a `state.ts`
  `AwaitingDecision` variant, an `actions.ts` `Action` + `LegalAction` variant,
  `game.ts` dispatch/`canDispatch`/`legalActions` cases, a `controller.ts`
  method (+ `AutomaticController` default, `ScriptedController` `*Fn`,
  `RandomController` branch), and a `client/src/App.tsx` `mode` + controls
  branch + `AWAITING_LABEL` entry.
- The engine is driven **synchronously** — `Game.dispatch()` fully resolves the
  stack and turn-based actions before returning. No async, no controller
  callback in the human path (`chooseTargets` is the last synchronous callback
  and only test/fuzz code hits it).
- `prepareForPriority(player)` is the pre-priority fixpoint loop:
  `{ SBAs; promptCommanderChoice; placePendingTriggers }` until stable. New
  interception loops (replacements) either nest inside this or wrap the specific
  mutators — see Phase 1.
- Continuous effects are computed in `characteristics.ts` via the layer fold;
  layers 1 & 2 are modeled as **stored fields** (`copyOf`, `controller`) rather
  than a computed characteristic, and `PtModifier` carries layers 3–7. Keep new
  continuous effects in this shape.
- Card behaviour is **declarative** (`EffectSpec` / `StaticAbility` /
  `TriggeredAbility` / `ActivatedAbility`) with an imperative `resolve(ctx)`
  hatch. Prefer growing the declarative vocab; migrate `resolve` cards to
  declarative once the vocab covers them.
- One file per card under `engine/src/cards/pool/` (or `tokens/`), then
  `npm run gen:cards -w engine`. `cards/pool.test.ts` guards registration.
- ESM + NodeNext: relative imports need explicit `.js`. `erasableSyntaxOnly`: no
  `enum`/`namespace`/param-properties — use string-literal unions +
  `as const satisfies`. `verbatimModuleSyntax`: split `import type`.
- Windows CRLF drift: before committing an edited file, check
  `git show ":<path>" | grep -acU $'\r'` equals its line count (consistent CRLF
  is fine; *mixed* is the bug). `sed -i 's/\r$//'` to fix.
- Regression net: `npm run play:random -w engine -- --games 300` (+ `--players 3`
  / `--players 4`). Every phase adds its cards to `random-demo.mjs`'s decks and a
  dedicated `*.test.ts`.

---

## Phase index

What each phase number means, for the code comments that cite it. Details in `git log`.

### Phase 1 — Replacement-effects engine

The keystone. `replacements.ts`: `ReplacementSpec` as a discriminated union on
`StaticAbility.replacement`, applied per-mutator rather than through one generic event
router (the cases are heterogeneous enough that per-mutator helpers read cleaner).
Covers `enters-battlefield` self-replacements (tapped / with-N-counters), token, counter
and graveyard→exile replacements, and Fog as a turn-scoped `preventAllCombatDamage` flag.
Multipliers stack as a product, so no `choose-replacement-order` decision was needed.
Also delivered the `modal` / `may` `EffectSpec` primitives and the `choose-modes`
decision, and reworked 903.9a so `moveObject` raises `commander-replacement` *before*
the move.

### Phase 2 — Effect vocabulary

`filter.ts`'s `CardFilter` + `matchesFilter` — the shared "which objects" vocabulary
over an object's *computed* characteristics, degrading to printed values off the
battlefield. Effect scopes (`destroy-all`, `damage-all`, `sacrifice { who, filter,
count }`, with mass destroys draining via `pendingDestruction`), plus tutors,
`scry`/`surveil` and the `choose-from-zone` decision.

### Phase 3 — Ability grammar breadth *(core done)*

Broadened the trigger / static / activated-cost vocabulary enough to retire the
`predicate` and most `resolve` hatches now that Phases 1–2 existed. The deferred long
tail was absorbed card-by-card by later phases and the needed-cards passes.

### Phase 4 — Mana system depth

`{C}` colorless pips, any-colour and multi-mana sources, Treasure, then hybrid /
twobrid / Phyrexian / snow. `manaSources` reports each source's flattened single-tap
output; `planManaPayment` is a greedy solver over those; `resolveHybridCost` turns a
hybrid/Phyrexian cost into a concrete cost + life before payment. Also the land toolkit
(check/pain/shock/trikelands, fetchlands) and ability-granting to a group.

### Phase 5 — Planeswalkers

`CardDefinition.loyalty`, with `defineCard` synthesizing an enters-with-loyalty-counters
self-replacement from it (so `moveObject` and Doubling Season apply unchanged).
`ActivatedAbility.loyaltyCost`, the sorcery-speed + once-per-permanent-per-turn gate via
`GameObject.loyaltyActivatedThisTurn`, and the 0-loyalty SBA (rule 704.5i).

### Phase 6 — Alternate casting zones + the cast pipeline *(6a/6b done)*

The `via?: CastVia` plumbing threaded through `cast-spell` / `castSpell` /
`whyCannotCastSpell` / `castCostString` / `castingCostOf`, with `GameObject.castVia`
riding on the stack object and `moveObject` redirecting the spell's stack→graveyard move
to exile where the rule says to. Flashback, Snapcaster-style granted flashback, suspend,
foretell and escape all ride this one seam; disturb, adventure and MDFCs joined it in
Phase 10.

### Phase 7 — Combat depth + turn-structure control *(core done)*

`GameState.extraTurns` (rule 500.7 — `beginTurn` shifts the front instead of advancing
the rotation) and `extraCombats` (rule 500.8 — the post-combat main phase loops back to
`begin-combat`), plus `can't-be-blocked` evasion. The first-strike priority window,
trample-as-a-choice and must-be-blocked landed later, in Phase 11 EG-4.

### Phase 8 — Cascade, storm, "cast" triggers, copy-a-spell

`GameState.spellsCastThisTurn` (the global Storm count) and
`PlayerState.spellsCastThisTurn` (per-player "your first spell each turn"), with
`GameObject.stormCount` capturing the global count *before* the spell. A new
`on: "this-cast"` trigger that lives on the card *on the stack* — what cascade and storm
hang off. `castCardWithoutPaying` is the shared free-cast core.

### Phase 9 — Commander-format completeness + deck validation *(core done)*

`identity.ts`'s `colorIdentityOf` (rule 903.4 — a lexical `{…}`-symbol scan of the mana
cost plus all rules/ability text) and `validateCommanderDeck`. Partner, a 4th commander,
per-commander tax, commander damage, and the opt-in simultaneous-mulligan phase.
*(`deck-validation.ts` has since moved from `server/` into the engine, so the client's
deck builder can run the same rules with no round-trip.)*

### Phase 10 — Tier 3 long tail (demand-driven)

Pulled in as specific decks needed them: **Sagas** (rule 714 — `chapters`, lore counters,
a `"chapter"` `abilityKind`), **10a MDFCs** and **10b transforming DFCs** + Day/Night
(`faces`/`face`, with `printedCardName` as the single read path for every characteristic),
the Monarch, Energy, Emblems, can't-be-countered, disturb and adventure. Battles, phasing,
dungeons/Initiative/Ring and banding stayed deferred as large and niche.

### Phase 11 — Engine-fidelity gaps

Six increments closing gaps that made real cards inexpressible:

- **EG-1 — uniform targeting decisions.** Retired the synchronous `chooseTargets`
  callback from the human path: a triggered ability (or Saga chapter) needing a real
  target choice parks in `pendingTargetedTrigger`, a suspended spell in
  `pendingTargetedCast`, and a dispatched `choose-targets` decision is raised instead.
- **EG-2 — targeted modal spells.** `CardDefinition.castModal`, where each `ModeOption`
  carries its own `targets`; modes are chosen *at cast time* (`GameObject.chosenModes`),
  and resolution applies each chosen mode with its own target slice, skipping an illegal
  mode and fizzling only if all are illegal.
- **EG-3 — `{X}` in activated costs + conditional statics.** `AbilityCost.mana` may
  contain `{X}`; `StaticAbility.condition?: StaticCondition` (`controls` / `your-turn` /
  `threshold` / `metalcraft`) gated in `staticConditionMet` *after* `staticAffects`
  confirms reachability.
- **EG-4 — combat depth.** The `assign-combat-damage` decision when an attacker's
  controller has a real choice (2+ live blockers, or trample with slack), the
  first-strike sub-pass with its own SBAs and priority window, and must-be-blocked.
- **EG-5 — planeswalker ability coverage audit.** Confirmed a planeswalker is scanned by
  `collectStaticEffects` and `detectTriggers` like any other permanent — statics and
  triggers on one already worked with **no engine change**.
- **EG-6 — replacement pipeline v2.** Prevention shields (`GameState.preventionShields`,
  run inside `dealDamage`), a filtered `would-be-put-into-graveyard`, and a `would-draw`
  redirect. `choose-replacement-order` and damage redirection to a third object stayed
  deferred.

---

## Cross-cutting, every phase

- **Fuzz + tests:** add the phase's cards to `random-demo.mjs`'s decks and write
  a dedicated `*.test.ts`. The fuzzer is the regression net — if `legalActions`
  offers something `dispatch` refuses, it crashes.
- **Client:** every new `AwaitingDecision` = a `Table` `mode` + controls branch
  + `AWAITING_LABEL` entry + a browser check. Budget ~20% of each phase for this.
- **CLAUDE.md:** update the engine-header "Implemented / Not yet" paragraph and
  the affected file bullets in the same commit as the code.
- **Perf:** replacement + trigger + SBA loops nest; each needs a guard against
  non-termination (see `prepareForPriority`'s `guard > 1000`).

---

## Where next

All 11 phases are done, and so is the bulk card-authoring pass this section
originally pointed at (needed-cards P0–P20 — two curated precon decks, ~170
cards, effectively complete; see `engine/src/cards/neededCards-features.md`).

**The plan of record for what to build next now lives in
`engine/src/cards/neededCards-features.md`**, not here: an EDH-popularity-driven
backlog (the top 2000 Commander cards by EDHREC rank, cross-referenced against
the pool and screened for likely-unsupported mechanics) ranking engine features
by how many real cards each would unblock, with a "Tier 1/2/3" prioritization
and a recommended build order. That file is kept current as each feature
ships; this section isn't. Candidate directions that don't fit that
card-driven framing, roughly by payoff:

1. **`resolve`-hatch sweep** — convert the remaining bespoke imperative
   `resolve` cards to declarative `effect` form now that the vocab is broad.
2. **Phase 10 deferred (large/niche)** — Battles (a card type + attack target),
   phasing (a state dimension), dungeons / Initiative + Undercity / Ring, banding.
   Demand-driven; none blocks ordinary Commander play. (These also show up with
   low EDH-popularity card counts in the backlog doc above, which is further
   evidence they're not worth a scope change yet.)
3. **Engine long tail** — see CLAUDE.md's "Not modeled" paragraph and
   `cards/AUTHORING.md` §15 for the current, maintained list of specific
   unmodeled vocabulary and partial features.

Client/server feature work is tracked separately, in `docs/plans/` — four of the five
long-term features there have shipped; server-side deck save/share is still unscoped.
