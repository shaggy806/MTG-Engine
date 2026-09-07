# ROADMAP.md

The plan to grow MTG-Engine from its current ~80-card demo pool to a **baseline
cardpool** — enough engine coverage to run ordinary Commander decks / precons.
Supersedes the ad-hoc "Wave 1/2/3" cadence noted in CLAUDE.md's engine header
(Waves 1–3 are done: casting/combat/keywords, the LIFO stack, SBAs, tokens,
Auras & Equipment, Commander, mulligans, 2–4 players, and the full continuous-
effects layer system — layers 1–7).

**How to use this file:** each phase is a shippable increment. Land it fully
(build + lint + typecheck + `npm test` clean; fuzzer clean at 2p/3p/4p; anything
UI-visible checked live in the browser), commit in logically-scoped pieces the
way `git log` does, update CLAUDE.md's engine header + the relevant bullets, then
tick the box here. Don't start a later phase before its spine dependencies (see
the diagram) are in.

## Status

- [x] **Phase 1** — Replacement-effects engine (+ modal / "you may" primitives)
- [x] **Phase 2** — Effect vocabulary: `CardFilter`, effect scopes, mass effects, tutors, scry/surveil
- [ ] **Phase 3** — Ability grammar breadth (triggers, statics, activated-ability costs)
- [ ] **Phase 4** — Mana system depth (hybrid / Phyrexian / `{C}` / any-colour / cost modification / Treasure)
- [ ] **Phase 5** — Planeswalkers
- [ ] **Phase 6** — Alternate casting zones + the cast pipeline
- [ ] **Phase 7** — Combat depth + turn-structure control
- [ ] **Phase 8** — Cascade, storm, "cast" triggers, copy-a-spell
- [ ] **Phase 9** — Commander-format completeness + deck validation
- [ ] **Phase 10** — Tier 3 long tail (demand-driven)

## Dependency spine

```
Phase 1 (replacements) ─┬─► Phase 5 (planeswalkers: 0-loyalty SBA, enters-with-loyalty)
                        ├─► Phase 7 (combat / damage-prevention shields)
                        └─► Phase 9 (903.9a as a true replacement — actually done in Phase 1)

Phase 2 (CardFilter + effect scope) ─┬─► Phase 3 (trigger / static / cost vocab all take filters)
                                     ├─► Phase 6 (alt-cast "a land card from exile", etc.)
                                     └─► Phase 8 (cascade needs "a lower-mv nonland card")

Phase 4 (mana) ──► Phase 3's cost-modification statics actually land here
Phase 6 (cast pipeline) ──► Phase 8 (cascade / storm / copy-spell)
```

Phases 2, 4, 6, 7 are otherwise independent and can be reordered by demand.

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

## Phase 1 — Replacement-effects engine

**Goal:** a replacement pipeline (rule 614/616), plus modal / "you may"
primitives. This is the keystone — it unblocks enters-tapped, enters-with-N-
counters, "if it would die/be exiled, instead …", damage prevention &
redirection, token/counter/damage **doublers**, "if you would draw, instead …",
and `{X}` creatures.

**Progress (pick up here):**

- [x] **1a — `enters-battlefield` self-replacements.** `replacements.ts`
  (`ReplacementSpec`, a `StaticAbility.replacement` field);
  `Game.entersBattlefieldReplacement(id)` applies `tapped` / `counters`
  (`amount: "x"` = the cast `{X}`) inside `moveObject`'s battlefield branch,
  and `createTokens`. `moveObject`'s leave-branch now nulls `xValue`. Cards:
  Tranquil Thicket, Walking Ballista. `replacement.test.ts`. Also fixed a
  pre-existing Clone + "Sacrifice this" cost crash (mint the ability object
  with `def.name`, not `printedCardName(source)`).
- [x] **1b — damage / token / counter / graveyard replacements.** Done
  pragmatically (not the fully generic `applyReplacements(event)` router —
  the 1b cases are heterogeneous enough that per-mutator helpers read
  cleaner). `ReplacementSpec` is now a discriminated union.
  `Game.tokenCreationMultiplier` / `counterMultiplier` /
  `graveyardIsReplacedWithExile` scan battlefield statics and are folded
  into `createTokens`, `addCounter` (+ the enters-with-counters path), and
  `moveObject`'s graveyard branch respectively. Fog is a turn-scoped
  `GameState.preventAllCombatDamage` flag (no permanent to hang a static on)
  set by a `prevent-all-combat-damage` effect, checked in `dealDamage`
  (which now returns the amount actually dealt so prevented hits don't grow
  `commanderDamageTaken`). Multipliers stack as a product (order-independent)
  so no `choose-replacement-order` decision was needed. Cards: Fog,
  Doubling Season, Rest in Peace. Added to the fuzz decks; 8 new
  `replacement.test.ts` cases; fuzzer clean at 2p/3p/4p. **Deferred to 1c's
  consolidated browser check:** no UI changes here (no new `AwaitingDecision`
  / `Table` mode), only the two log formatters gained the new events.
- [x] **1c — modal / "you may" + 903.9a.** `EffectSpec` `modal { minModes,
  maxModes, modes }` + `may { effect, prompt }` (sugar for a 0-or-1 modal);
  `choose-modes` decision, fully wired (state / actions / game / controller
  ×3 / App.tsx mode + controls + `AWAITING_LABEL`). **Modes are
  non-targeted only** — targeted modal spells (most real charms) need
  cast-time mode selection, deferred to a later cast-pipeline phase (~6).
  903.9a reworked: `moveObject` raises `commander-replacement` *before* the
  move (rule 614 replacement), `applyCommanderChoice` completes it;
  `pendingCommanderChoices` / `promptCommanderChoice` deleted for a single
  `deferredCommanderMove` slot. New `permanent-left-battlefield` event +
  `leaves-battlefield` `TriggerSpec` (pulled forward from Phase 3 — needed
  to test the rework). Cards: Deliberate Course (modal instant), Sarova,
  the Undying Current (Carol's commander — a leaves-battlefield + a dies
  trigger, so the → command zone vs → graveyard trigger matrix is
  covered). `modal.test.ts` + 2 `commander.test.ts` cases; fuzzer clean
  at 2p/3p/4p; browser-checked (modal picker, reworked commander prompt,
  leaves-battlefield draw with no dies gain).

**Engine:**

- A `ReplacementEffect` shape. Model it as a `StaticAbility` variant
  (`{ replaces: ReplacementPattern; with: ReplacementTransform }`) plus a
  one-shot / shield form for `Fog`-style effects (a `PlayerState.shields` or
  per-object `replacementShields` array of plain descriptors — a "prevent the
  next N combat damage" counter, "prevent all combat damage this turn" flag).
- `ReplacementPattern` = a small discriminated union keyed to the events a
  replacement can catch: `enters-battlefield {filter}`, `would-deal-damage
  {source?, target?}`, `would-draw {player}`, `would-create-token`,
  `would-add-counter {kind}`, `would-be-destroyed`, `would-leave-battlefield
  {toZone}`.
- `applyReplacements(event) -> event | null`: the interception routine. Route
  the concrete mutators through it — the moment a permanent would enter the
  battlefield (inside `moveObject`), `dealDamage`/`dealCombatDamage`, `draw`,
  `createTokens`, `addCounter`. Rule 616 ordering: **self-replacement first**
  (a replacement modifying the object it's on / the event it's part of), then
  the affected player (controller of the object entering; the damaged player;
  the drawing player) picks the order among the rest. Each replacement applies
  to a given event **at most once** (616.1) — carry a "seen" set of replacement
  ids on the in-flight event.
- When 616's order matters and >1 replacement is applicable, raise a
  `choose-replacement-order` decision (rare — an `AutomaticController` picks
  registration order; don't over-invest in the UI).
- Redo the **903.9a commander redirect as a real replacement** now — remove the
  `pendingCommanderChoices` "land then ask" machinery and make
  `commander-replacement` fire from `applyReplacements` on
  `would-leave-battlefield` for a commander, *before* the move. Kills the
  documented "a death trigger sees the graveyard" wart.

**Modal / optional primitives:**

- `EffectSpec` += `{ kind: "modal"; choose: number; modes: readonly EffectSpec[] }`
  and `{ kind: "may"; effect: EffectSpec }`.
- `choose-modes` `AwaitingDecision` (+ Action `{ modes: number[] }` + LegalAction
  `{ source, choose, modeTexts }` + `PlayerController.chooseModes` + client).
- `may` resolves via a yes/no `choose-modes`-style decision, or reuse a simple
  `confirm` decision.

**Cards:** an enters-tapped land (`Rimewood Falls` / a Guildgate — a
`types:["land"]` card with an `enters-battlefield` replacement setting `tapped`),
`Fog` (one-shot "prevent all combat damage this turn" shield), a token doubler
(`Parallel Lives`-lite — a `would-create-token` replacement doubling `count`),
`Rest in Peace`-lite ("if a card would go to a graveyard, exile it instead" —
`would-leave-battlefield` / a graveyard-move replacement), a modal instant
(`Kolaghan's Command`-lite, 2 of 3 modes).

**Tests:** `replacement.test.ts`. **Client:** `choose-modes` controls branch;
browser-check the enters-tapped land + the token doubler + a modal spell.

**Size:** large. Split into ≥3 commits (pipeline + enters-tapped; damage/token/
counter replacements + cards; modal primitives + 903.9a rework).

---

## Phase 2 — Effect vocabulary: filters, scopes, mass effects, selection

- [x] **`CardFilter`** (`filter.ts`) — `matchesFilter` over a `GameObject` +
  its *computed* characteristics: `type`/`types`/`notTypes` / `subtype` /
  `supertype` / `name` / `colors` / `notColors` / `colorless` / `manaValue` /
  `power` / `toughness` (via a `NumCompare` op) / `controlledBy` / `ownedBy` /
  `keyword` / `tapped` / `token`. `ZoneChoiceFilter` is now an alias.
  Degrades to printed values off the battlefield.
- [x] **`EffectScope`** — delivered where cards needed it: `destroy-all
  { filter }`, `damage-all { filter, amount }`, and `sacrifice { who:
  "each-player"|"each-opponent"|"you"|"target", filter, count }`. The mass
  destroy drains via `GameState.pendingDestruction`, the sacrifice via
  `pendingSacrifices` / `pendingSacrificeVictims` (APNAP), so a commander's
  903.9a choice mid-effect pauses and resumes. **Deferred (no card needs
  them yet, Phase-10-style):** `modify-pt` / `draw` / `discard` / `mill` /
  `tap` scopes, and generalizing `draw` to `{ player | "each", amount }`.
- [x] **Board wipes & edicts:** Wrath of God, Damnation, Pyroclasm (`damage-
  all`), Diabolic Edict, Fleshbag Marauder. (Blasphemous Act's identity is
  its cost reduction — a Phase 3/4 static — so it's deferred.)
- [x] **`sacrifice` as an effect** — a `sacrifice` `AwaitingDecision` per
  affected player who has a real choice; auto-resolves otherwise.
- [x] **`search-library { filter, destination, min, max, enterTapped? }`** →
  Demonic Tutor, Rampant Growth. Reuses `choose-from-zone` +
  `leftover: "shuffle"`. (Cultivate / Sakura-Tribe Elder want a two-
  destination search or a sac-death trigger — later.)
- [x] **`scry n` / `surveil n`** (with an optional `then` for the trailing
  draw): a `scry` `AwaitingDecision`; Preordain, Opt, Consider. The
  "reorder the ones you keep on top" clause isn't modeled.

**Tests:** `filters-and-scopes.test.ts`, `tutors.test.ts`.

---

## Phase 3 — Ability grammar breadth

Retire most `predicate` / `resolve` hatches now that Phases 1–2 exist.

- **TriggerSpec** += ~~`leaves-battlefield {who}`~~ (done in Phase 1c),
  `permanent-enters {who, filter}`
  (broad ETB — "whenever another creature enters"), `upkeep` / `end-step` /
  `begin-combat {who}`, `landfall`, `gains-life` / `loses-life {who}`,
  `creature-dies {filter}` (broad), `becomes-tapped {who}`,
  `first-spell-each-turn {who}`, non-combat `deals-damage`, `blocks {who}`,
  `attacks {who, alone?}`.
- **StaticAbility** += `costModification { applies: CardFilter | "self";
  reduce?: ManaCost; increase?: ManaCost }`, `restriction` (`can't-attack` /
  `can't-block` / `must-attack` / `can't-be-blocked` / `must-be-blocked`),
  `ward { cost }`, `protection { from: CardFilter }`, land/artifact/planeswalker
  `affects` scopes, conditional anthems (`when: <predicate over state>`).
- **AbilityCost** += `payLife: number`, `discard { n, filter? }`,
  `exileFromGraveyard { n, filter? }`, `removeCounter { kind, n }`,
  `xInCost: true` (`{X}` in an activated cost), spell `additionalCost`.
- Protection uses Phase 1's damage-prevention hook for its "prevent damage from"
  clause and Phase 3's targeting/combat hooks for the rest.
- Ward is a triggered-on-being-targeted check in `castSpell` / `activateAbility`.

**Tests:** `triggers-wave2.test.ts`, `static-restrictions.test.ts`,
`ability-costs.test.ts`.

---

## Phase 4 — Mana system depth

- `parseManaCost`: hybrid `{W/U}`, twobrid `{2/W}`, Phyrexian `{W/P}`, `{C}` in
  a cost, snow `{S}`.
- `planManaPayment` / `castingCostOf`: hybrid resolution, Phyrexian (pay 2 life
  instead of the pip), "mana of any colour" sources, `{C}` requirement; fold in
  Phase 3's `costModification` statics; update `maxAffordableX`.
- Treasure tokens (a token with `{T}, Sacrifice this: Add one mana of any
  colour` — needs "any colour" + the sac-as-cost that already exists) and
  any-colour rocks.
- **Cards:** `Sol Ring`, `Arcane Signet`, `Chromatic Lantern`, a hybrid-cost
  card, a Phyrexian-cost card, `Prosperous Innkeeper` / a Treasure maker.
- **Fetchlands** become expressible here (search + shuffle + pay-life + sac-cost
  all now exist).

**Tests:** `mana-hybrid.test.ts`, `cost-modification.test.ts`.

---

## Phase 5 — Planeswalkers

- `CardType` `"planeswalker"` (already in the union); `loyalty: number` on
  `CardDefinition`; enters with that many loyalty counters (Phase 1
  replacement-style or a dedicated ETB routine).
- Loyalty abilities: `ActivatedAbility` += `loyaltyCost: number` (may be
  negative); once per turn per permanent (`GameObject.loyaltyActivatedThisTurn`),
  sorcery-speed, paid by ±loyalty counters. `whyCannotActivateAbility` enforces.
- Combat: `AttackerDeclaration.defender: PlayerId | ObjectId`; `legalDefenders`
  extends to opponents' planeswalkers; combat damage to a planeswalker removes
  loyalty; SBA: ≤0 loyalty → graveyard; extend the legend rule.
- **Cards:** `Garruk Wildspeaker`, `Chandra, Acolyte of Flame`-lite.
- **Client:** planeswalker tiles as attack targets (extend the existing
  click-a-panel redirect flow), loyalty-ability menu.

**Tests:** `planeswalker.test.ts`.

---

## Phase 6 — Alternate casting zones + the cast pipeline

- `castSpell(card, fromZone, permission)`: cast from graveyard / exile / anywhere
  via a static grant. A per-object `playableUntil` marker (turn number) for
  impulse draw ("you may play it this turn").
- `CardDefinition` += `flashback { cost }`, `escape { cost, exileN }`,
  `foretell` (exile face-down for `{2}` — a `foretell` action; cast later for
  the foretell cost), `suspend { n, cost }` (exile with time counters; a
  begin-of-upkeep trigger removes one; cast for free when the last comes off),
  `disturb { cost }`.
- Defines a **clean `spell-cast` event** carrying the spell's characteristics —
  the prerequisite for Phase 8.
- **Cards:** `Faithless Looting` (flashback), an escape card, `Rift Bolt`
  (suspend), `Snapcaster Mage`-lite (grants a graveyard spell flashback).

**Tests:** `alt-cast.test.ts`.

---

## Phase 7 — Combat depth + turn-structure control

- Split the first-strike and regular combat-damage steps so players get a
  priority window between them (currently folded into one step).
- Trample damage assignment as a **player choice** (`assign-trample` decision) —
  it's auto-assigned today.
- Enforce `must-attack` / `attacks each combat if able` / `must-be-blocked` in
  declare validation; `can't-be-blocked` evasion; "assign combat damage as
  though it weren't blocked".
- Combat-damage prevention shields (Phase 1 pipeline).
- Turn control: `take-extra-turn` (a `GameState.extraTurns` queue),
  `additional-combat` (phase re-insertion after combat), `end-the-turn`
  (`Time Stop` — empty the stack, jump to cleanup), skip-a-step effects.
- **Cards:** `Rogue's Passage`, `Time Warp`-lite, `Aggravated Assault`.

**Tests:** `combat-wave2.test.ts`, `extra-turns.test.ts`.

---

## Phase 8 — Cascade, storm, "cast" triggers, copy-a-spell

- `PlayerState.spellsCastThisTurn` (storm count); `storm` keyword → copy the
  spell that many times (no target re-choice for a copy unless it targets).
- Cascade → on cast, exile from top of library until a nonland card with lesser
  mana value, may cast it without paying (uses Phase 6 cast-from-exile).
- Generalize the `cast-spell` TriggerSpec ("when you cast your first spell each
  turn", "whenever you cast an instant or sorcery").
- `copy-spell` EffectSpec — clone a stack object, offer a re-target decision.
- **Cards:** `Bloodbraid Elf` (cascade), `Grapeshot`-lite (storm), `Twincast`.

**Tests:** `cascade-storm.test.ts`.

---

## Phase 9 — Commander-format completeness + deck validation

- Colour-identity computation for a card (mana cost + rules-text mana symbols +
  colour indicator) → **server-side deck validation** (identity within the
  commander's; singleton; 100 cards). Reject at room creation / deck import.
- Partner / "Choose a Background" / "Friends forever" — two commanders in the
  command zone (`DeckList.commanders: string[]`).
- Companion (the `{3}` from the sideboard to hand).
- Player choice on which legendary permanent the legend rule keeps (deterministic
  today).
- Simultaneous mulligan rounds (all players decide, then all bottom) instead of
  the current sequential order.
- Design **two more legendary creatures** so Carol/Dave get real commanders.

**Tests:** `server/src/deck-validation.test.ts`, `partner.test.ts`.

---

## Phase 10 — Tier 3 long tail (demand-driven)

Each is small once Phases 1–3 exist. Pull them in as specific decks need them.

- **Sagas** (chapter counters + `chapter` triggers + a saga-specific SBA).
- **Multi-face cards** — `CardDefinition.faces: CardDefinition[]` + a chosen
  face on cast/play → MDFC, adventure, split, rooms.
- **Battles** (Siege subtype, defense counters, attack-a-battle).
- **Day / Night; the Monarch; the Initiative + Undercity; venture / dungeons;
  the Ring tempts you + Ring-bearer; energy.**
- **Emblems** — a player-owned continuous-effect object.
- **Rules-lawyer:** split second, "can't be countered", phasing, banding.

---

## Cross-cutting, every phase

- **Fuzz + tests:** add the phase's cards to `random-demo.mjs`'s decks and write
  a dedicated `*.test.ts`. The fuzzer is the regression net — if `legalActions`
  offers something `dispatch` refuses, it crashes.
- **Client:** every new `AwaitingDecision` = a `Table` `mode` + controls branch
  + `AWAITING_LABEL` entry + a browser check. Budget ~20% of each phase for this.
- **CLAUDE.md:** update the engine-header "Implemented / Not yet" paragraph and
  the affected file bullets in the same commit as the code (its own CLAUDE.md
  commit, per existing history).
- **`resolve` hatch:** after Phase 3, sweep bespoke `resolve` cards to
  declarative form where the vocab now covers them.
- **Perf:** replacement + trigger + SBA loops nest; each needs a guard against
  non-termination (see `prepareForPriority`'s `guard > 1000`).
- **Card volume:** the actual baseline pool is hundreds of cards. Engine phases
  make mechanics *expressible*; the payoff is a bulk authoring pass after Phases
  1–4 land, targeting one or two real precons end-to-end.
