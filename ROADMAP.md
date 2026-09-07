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
- [x] **Phase 3** — Ability grammar breadth (triggers, statics, activated-ability costs)
- [x] **Phase 4** — Mana system depth (`{C}` / any-colour / multi-mana / Treasure / hybrid / twobrid / Phyrexian / snow / ability-granting to a group / fetchlands)
- [x] **Phase 5** — Planeswalkers
- [x] **Phase 6** — Alternate casting zones + the cast pipeline *(6a/6b done — flashback, Snapcaster, suspend, foretell, escape; 6c long tail deferred)*
- [x] **Phase 7** — Combat depth + turn-structure control *(core done — extra turns, additional combat, can't-be-blocked; first-strike window / trample-as-choice / must-be-blocked deferred)*
- [x] **Phase 8** — Cascade, storm, "cast" triggers, copy-a-spell
- [x] **Phase 9** — Commander-format completeness + deck validation *(core done — colour identity, deck validation, Partner, a 4th commander; Companion / legend-rule choice / simultaneous mulligans deferred)*
- [~] **Phase 10** — Tier 3 long tail (demand-driven) — **Sagas landed**; multi-face cards **10a modal/split + 10b transform**, day/night, battles, emblems, … still open

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
                         └─► Phase 10a (modal / split faces — a cast-time face choice)
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

## Phase 3 — Ability grammar breadth  *(core done — long tail deferred)*

Retire most `predicate` / `resolve` hatches now that Phases 1–2 exist.
Both imperative `resolve` cards were converted in 3a; no card uses `predicate`.

**Deferred long tail (add with the first card that needs it, Phase-10 style):**
conditional anthems (`when: <predicate over state>`), `must-be-blocked` (Lure),
`discard { n, filter? }` / `exileFromGraveyard` / `{X}` in an activated cost,
spell `additionalCost`, protection from a full `CardFilter` (only colours/types
today) / protection-from-everything / "hexproof from", land/artifact/planeswalker
`affects` scopes, and the rest of the trigger list — `end-step` /
`begin-combat` / `becomes-tapped` / `first-spell-each-turn` (needs a
`spellsCastThisTurn` counter — also Phase 8) / non-combat `deals-damage` /
`blocks` / `attacks {alone?}`.

- [x] **TriggerSpec breadth (3a).** `leaves-battlefield` (Phase 1c);
  `enters-battlefield` / `dies` gain `filter: CardFilter` + `otherOnly`, so
  one spec covers "another creature enters" (Soul Warden), landfall (`filter:
  { type: "land" }`, Rampaging Baloths), and "a creature you control dies"
  (Grave Pact, Zulaport). New `gains-life` / `loses-life { who }` (a *player*
  subject — `matchesWhoPlayer`; Ajani's Pridemate). Also generalized
  `gain-life` (`who?: PlayerScope`) + a new `lose-life` effect, retiring the
  last two imperative `resolve` cards. **Still to do:** `end-step` /
  `begin-combat`, `becomes-tapped`, `first-spell-each-turn`, non-combat
  `deals-damage`, `blocks`, `attacks {alone?}`.
- [x] **Static combat restrictions (3b).** `StaticAbility.restrictions:
  CombatRestriction[]` (`cant-attack` / `cant-block` / `must-attack`) folded
  into `Characteristics.restrictions`; wired into declare-attackers /
  declare-blockers validation (`must-attack` auto-appends). New `unblockable`
  keyword. Cards: Pacifism, Juggernaut, Invisible Stalker.
- [x] **AbilityCost variety (3d).** `payLife: number`, `removeCounter
  { kind, count }` — both automatic. Cards: Greed, Walking Ballista's real
  ping ability.
- [x] **Ward (part 4).** `StaticAbility.ward { mana?, payLife? }` — checked
  as a targeted spell/ability begins to resolve (`wardCheckPasses`),
  auto-paid if affordable else the spell/ability is countered. Card: Combat
  Thresher.
- [x] **Cost-modification statics (part 5).** `StaticAbility.costModification
  { applies: CardFilter, reduceGeneric?, increaseGeneric? }` folded into
  `castingCostOf` (rule 601.2f). Cards: Foundry Inspector, Thalia, Guardian
  of Thraben.
- [x] **Protection (part 6).** `StaticAbility.protection { colors?, types? }`
  → `Characteristics.protectionFrom`; all four DEBT clauses (targeting via a
  `TargetSource` threaded through `isLegalTarget`/`legalTargets`, damage,
  blocking, enchant/equip). Card: White Knight regains protection from black.

**Tests:** `triggers-wave2.test.ts`, `static-restrictions.test.ts`,
`ability-costs.test.ts`, `ward.test.ts`, `cost-modification.test.ts`,
`protection.test.ts`.

---

## Phase 4 — Mana system depth  *(4a done — any-colour / `{C}` / multi-mana / Treasure)*

- [x] **4a — `{C}` costs, any-colour & multi-mana sources, Treasure.**
  `parseManaCost` → `ManaCost.colorless` (`{C}` pips, colorless mana only);
  `manaSources` reports each source's flattened single-tap output
  (`{ fixed, anyColor, sacrificeSelf }`); `planManaPayment` rewritten as a
  greedy solver returning `{ source, mana, sacrifice }[]` that handles `{C}`
  needs, multi-mana sources (Sol Ring) and `"any-color"` sources;
  `useManaSource` (was `tapManaSource`) taps or sacrifices; `spendFromPool`
  pays `{C}` from colorless first; `maxAffordableX` updated; Phase 3's
  `costModification` was already folded into `castingCostOf`. `add-mana`
  effects take `mana: ManaType | "any-color"`; `addManaAbility` helper.
  Cards: Sol Ring, Arcane Signet, Command Tower (any colour — no
  colour-identity restriction), Treasure Token, Prosperous Innkeeper.
  Tests: `mana-depth.test.ts`.
- [x] **4b — hybrid / Phyrexian / snow symbols.** `parseManaCost` →
  `ManaCost.hybrid: HybridPip[]` (each pip a list of `HybridOption`s —
  `{ kind: "color" }` / `{ kind: "generic" }` / `{ kind: "phyrexian" }`);
  `{S}` folded into generic (no snow permanent exists to distinguish it).
  `manaValue` counts a hybrid pip as its greatest half (rule 202.3f). A new
  `Game.payMana` wraps `resolveHybridCost` (greedy: prefer an affordable
  coloured half, then the twobrid `{2}`, then 2 life — never below 1 life;
  each tentative choice re-checked with `planManaPayment`) → `planManaPayment`
  on the concrete cost → `executePayment` (taps sources, spends the resolved
  cost, pays Phyrexian life). Every caster / activator / ward check routes
  through `payMana` now. Auto-paid — no "mana or life?" decision (consistent
  with the rest of the engine's auto-payment). Cards: Gut Shot (`{R/P}`),
  Flame Javelin (`{2/R}{2/R}{2/R}`), Wilt-Leaf Cavaliers (`{2}{G/W}{G/W}`).
  Tests: `hybrid-mana.test.ts`; fuzzer clean at 2p/3p/4p; browser-checked
  (hybrid pip pills in cost line + rules text; Phyrexian auto-paid with `{R}`).
- [x] **4c — granting an activated ability to a group.**
  `StaticAbility.grantsActivated: ActivatedAbility[]` grants the listed
  abilities to every object its `affects` selects (new `lands-you-control`
  `AffectSpec` scope). `Game.grantedActivated(id)` / `effectiveActivated(id)`
  (printed abilities + granted, granted appended so printed indices are
  stable) are consulted by `legalActions` / `whyCannotActivateAbility` /
  `activateAbility` / `manaSources` / `stackAbilityOf`. `manaSources` now
  treats a permanent's multiple `{T}: Add` abilities as **alternatives** (one
  tap, one of them — the richest single option, an "any colour" one winning a
  tie) rather than additive. `staticAffects` is exported from
  `characteristics.ts`. Cards: Chromatic Lantern, Cryptolith Rite.
- [x] **Fetchlands** — Evolving Wilds (`{T}, Sacrifice: search-library
  { filter: basic land, destination: battlefield, enterTapped }`) — the
  `sacrifice: "self"` activated-ability cost + `search-library` effect already
  existed; nothing new engine-side. Tests: `granted-abilities.test.ts`.

---

## Phase 5 — Planeswalkers  *(done)*

- [x] **Permanents.** `CardDefinition.loyalty: number | null`; `defineCard`
  synthesizes an `enters-battlefield { counters: { loyalty } }` self-replacement
  from it (so `moveObject` / Doubling Season apply unchanged). SBA (rule 704.5i):
  a planeswalker with 0 loyalty → its owner's graveyard. The legend rule already
  keyed on `supertypes: ["legendary"]`, so it covers legendary planeswalkers with
  no change.
- [x] **Loyalty abilities.** `ActivatedAbility.loyaltyCost?: number` (negative
  removes). `whyCannotActivateAbility` enforces sorcery-speed,
  once-per-permanent-per-turn (`GameObject.loyaltyActivatedThisTurn`, reset in
  the untap step), and "enough counters for a minus". `activateAbility` adjusts
  `counters.loyalty` and mints on the stack (rule 606.3 — not a mana ability
  even if it adds mana). A targeted loyalty ability (Garruk +1: untap two target
  lands) reuses the normal ability targeting.
- [x] **Combat.** `AttackerDeclaration.defender` / `GameObject.attacking` /
  `attacker-declared` are `PlayerId | ObjectId`; `legalDefenders` adds opponents'
  planeswalkers; `defendingPlayerOf` / `attackTargetRef` route blocker-declaration
  and combat damage. `dealDamage` to a planeswalker removes loyalty counters
  (rule 120.3c) — combat *or* burn.
- [x] **Mass effects.** `modify-pt-all` / `grant-keyword-all` `EffectSpec`s
  (`{ filter: CardFilter, … }`, like `destroy-all` / `damage-all`) for Garruk's
  Overrun ult. New `loyalty-changed` event.
- [x] **Cards:** `Garruk Wildspeaker` (legendary; +1 untap 2 lands / -1 make a
  3/3 Beast / -4 Overrun), `Chandra, Acolyte of Flame`-lite (+0 deal 2 / -2 make
  two hasty 1/1 Elementals). Tokens: `3/3 Beast Token`, `Elemental Token`.
- [x] **Client:** loyalty badge on the tile; loyalty-ability menu (reuses the
  ability menu — the `[+1]` / `[-1]` text labels each button); an opponent's
  planeswalker highlights + click-redirects an attacker at it (same focus flow
  as the multi-opponent attack redirect); `board.ts` `planeswalker` bucket;
  `loyalty-changed` in both event-log formatters.

**Tests:** `planeswalker.test.ts` (11 cases).

---

## Phase 6 — Alternate casting zones + the cast pipeline  *(6a/6b done — 6c long tail deferred)*

**Progress (pick up here):**

- [x] **6a — flashback + the alt-cast plumbing.** `cast-spell` Action / LegalAction
  gain `via?: "flashback"`; `castSpell(player, card, targets, xValue, via?)` and
  `whyCannotCastSpell(player, card, via?)` take it, `castCostString` picks the
  flashback cost, `castingCostOf` / `maxAffordableX` take a `costString`
  override. `legalActions` enumerates a `via: "flashback"` cast for each
  instant/sorcery in the player's graveyard with `CardDefinition.flashback`.
  `GameObject.castVia` rides on the stack object; `moveObject` redirects a
  `castVia === "flashback"` spell's stack→graveyard move to exile (rule
  702.34) and clears the field on any zone change. `spell-cast` event carries
  `via`. New `discard { target: "you" }` (no target slot — Faithless Looting's
  "then discard two cards"). Card: Faithless Looting. `alt-cast.test.ts` (3
  cases); fuzz deck B gains 2x Faithless Looting; fuzzer clean at 2p/3p/4p;
  browser-checked (cast from hand → graveyard, "Cast (flashback)" button in
  the graveyard `ZoneViewer` → exile).
- [x] **6b — Snapcaster-lite, suspend, foretell, escape.** `CastVia` widened to
  `"flashback" | "escape" | "foretell" | "suspend"`. **Snapcaster:** a new
  `"instant-or-sorcery-in-your-graveyard"` `TargetSpec` (`legalTargets` gains a
  graveyard scan gated to it), a `grant-flashback` `EffectSpec` +
  `GameObject.grantedFlashback { cost, untilEndOfTurn }`, `flashbackCostOf`
  folding printed + granted; `finishCleanup` clears until-EOT grants (they ride
  on graveyard cards). **Suspend:** `CardDefinition.suspend { n, cost }`, a
  `suspend` Action/LegalAction (special action), `upkeepStep()` turn-based
  action removing a `counters.time` per suspended card and casting it free at
  zero (`castSuspendedCard`, `castVia "suspend"`, `hastyUntilItLeaves` →
  `hasSummoningSickness` false). **Foretell:** `CardDefinition.foretell { cost }`,
  a `foretell` Action (pay `{2}`, exile face-down; `foretold` / `foretoldOnTurn`),
  `view.ts` hides a foretold card's identity from opponents, cast from exile via
  `via: "foretell"` (not the turn it was foretold). **Escape:**
  `CardDefinition.escape { cost, exileCount }`, cast from graveyard via
  `via: "escape"` auto-exiling N other graveyard cards as an additional cost
  (resolves normally, re-escapable). New events: `flashback-granted` /
  `-grant-expired`, `card-suspended`, `time-counter-removed`, `card-foretold`,
  `escape-cost-paid`. Client: "Suspend {cost}" / "Foretell" buttons on hand
  cards, `Cast (via)` buttons in the graveyard/exile `ZoneViewer`, ⏳N /
  Foretold badges. Cards: Snapcaster Mage, Rift Bolt, Behold the Multiverse,
  Underworld Rage-Hound. `alt-cast.test.ts` 5→8 cases; fuzz deck B gains all
  four; fuzzer clean at 2p/3p/4p.
- [ ] **6c (deferred)** — `disturb` (needs a back face — Phase 10a); a
  `playableUntil` impulse-draw marker; a *characteristics-carrying*
  `spell-cast` event (the Phase 8 prerequisite); a real player choice for a
  targeted suspended spell's targets and Snapcaster's target (the
  `chooseTargets` gap); cast-time `face` selection (Phase 10a).

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
- The `cast-spell` / `play-land` **`face` field** and per-side `legalActions`
  enumeration belong here too (a cast-time choice like `{X}` / modes) — it's the
  hard half of Phase 10a (modal / split faces). Fold it in if a DFC deck is a
  priority; otherwise 10a stays deferred.
- **Cards:** `Faithless Looting` (flashback), an escape card, `Rift Bolt`
  (suspend), `Snapcaster Mage`-lite (grants a graveyard spell flashback).

**Tests:** `alt-cast.test.ts`.

---

## Phase 7 — Combat depth + turn-structure control  *(core done — long tail deferred)*

- [x] **Turn-structure control.** `GameState.extraTurns: PlayerId[]` (rule
  500.7) — `beginTurn` shifts the front instead of advancing the rotation and
  sets `TurnState.isExtra`; `take-extra-turn` effect pushes the caster (Time
  Warp). `GameState.extraCombats` (rule 500.8) — `additional-combat` effect
  bumps it; when the post-combat main phase ends with it > 0, `endStep` loops
  back to `begin-combat` (Aggravated Assault; its ability also `untap-all`s
  your creatures — a new mass effect). New events `extra-turn-queued` /
  `additional-combat-queued` / `additional-combat-phase`; `turn-began` gains
  `extra?`. Client: "(extra)" on the turn banner + the log lines.
- [x] **`can't-be-blocked` evasion.** Rogue's Passage — a `{5}, {T}: target
  creature` ability that `grant-keyword`s the existing `unblockable` keyword
  until end of turn. No new engine vocab.
- **Cards:** `Time Warp` (lite — goes to graveyard, doesn't self-exile),
  `Aggravated Assault`, `Rogue's Passage`. `extra-turns.test.ts` (3 cases);
  fuzz deck B gains all three; fuzzer clean at 2p/3p/4p.

**Deferred long tail (Phase-10 style — combat *works*, these refine it):**
- Split the first-strike and regular combat-damage steps so players get a
  priority window between them (currently folded into one step).
- Trample damage assignment as a **player choice** (`assign-trample` decision) —
  it's auto-assigned today (lethal to each blocker, rest to the defender).
- `must-be-blocked` (Lure); "assign combat damage as though it weren't
  blocked"; `attacks each combat if able` (`must-attack` is enforced today).
- Granular "prevent the next N combat damage" shields (Fog's turn-scoped
  "prevent all" flag exists).
- `end-the-turn` (`Time Stop`), skip-a-step effects.

**Tests:** `extra-turns.test.ts`.

---

## Phase 8 — Cascade, storm, "cast" triggers, copy-a-spell  *(done)*

- [x] **Spell counts.** `GameState.spellsCastThisTurn` (every player's spells —
  the Storm count, rule 702.40a) and `PlayerState.spellsCastThisTurn`
  (per-player — "your first spell each turn"). Both bumped in `castSpell` /
  `castCardWithoutPaying`, reset in `beginTurn`. `spell-cast` event gains
  `spellsThisTurn` (the caster's count). `GameObject.stormCount` captures the
  global count *before* the spell, read by `storm`.
- [x] **`cast-spell` TriggerSpec breadth.** `firstEachTurn?` narrows to the
  caster's first spell of the turn. New `on: "this-cast"` — a triggered ability
  that lives on the card *on the stack* (cascade / storm); `detectTriggers`
  adds `event.object` to the candidate set for a `spell-cast`.
- [x] **Spell copies (rule 707.10).** `GameObject.isCopy` — `copyStackSpell`
  mints a copy of an instant/sorcery on the stack (keeps targets + `{X}`);
  `resolveTopOfStack` deletes it instead of moving it off the stack (resolve
  *or* fizzle). Permanent-spell copies (token permanents) deferred to Phase 10.
- [x] **`storm` effect** — copies the spell `stormCount` times.
- [x] **`cascade` effect** — exile off the top of the library until a nonland
  card with lesser mana value, cast it free via `castCardWithoutPaying`
  (`via: "cascade"`), the rest to the bottom in random order. New
  `cascade-revealed` event.
- [x] **`copy-spell` effect** (Twincast) + `"instant-or-sorcery-spell"`
  TargetSpec. New `spell-copied` event.
- **Cards:** `Grapeshot` (storm), `Bloodbraid Elf` (cascade), `Twincast`.
  `cascade-storm.test.ts` (3 cases, incl. a cross-player Storm count); fuzz deck
  B gains all three; fuzzer clean at 2p/3p/4p. Client: "copy" badge + label on
  a stack copy; new log lines.

**Deferred:** the "you may choose new targets for the copies" clause (rule
702.40b — declining is always legal, so keeping the same targets is a valid
default; the engine just doesn't *offer* the re-target — same class as
targeted-modal / triggered-ability target choices). Cascade's free-cast targets
are auto-picked (the `chooseTargets` gap).

**Tests:** `cascade-storm.test.ts`.

---

## Phase 9 — Commander-format completeness + deck validation  *(core done)*

- [x] **Colour identity** (`engine/src/identity.ts` — `colorIdentityOf(def)`):
  a lexical scan of every `{…}` symbol in the mana cost + rules text + ability
  costs/text (rule 903.4), plus `withinIdentity` / `identityString`.
- [x] **Deck validation** (`server/src/deck-validation.ts` —
  `validateCommanderDeck`): singleton (basics exempt), colour identity within
  the commander(s)', size, "is a legendary creature". `formatCheck` runs it
  over the *implemented* cards of a pasted list (commander = first legendary
  creature), folded into the `/import-deck` response as a `format` block; the
  client renders a legal/illegal panel. Not enforced at room creation — the
  built-in `SEATS` decks are deliberately illegal "good stuff" piles.
- [x] **Partner** — `DeckList.commanders: readonly string[]` (1 or 2);
  `setup` mints each into the command zone. `PlayerState.commanderCastCount`
  → `commanderCastCounts: Record<string, number>` (per-commander tax, rule
  903.8); `commanderTax(player, cardId)` keys by name. View + client updated.
  Cards: `Bramblewing, the Untamed` / `Corvath, Ember Scribe` (a Partner
  pair). `partner.test.ts`.
- [x] **A fourth commander** — `Seraphine, Dawnherald` (a GW legendary — a
  self-excluding `grantPt` anthem + a "creature you control enters → gain 1
  life" trigger), wired as Dave's commander so all four seats have one.

**Deferred (Phase-9 long tail):** "Choose a Background" / "Friends forever"
(more partner-like variants), Companion (the `{3}` from a sideboard), a player
choice on which legendary permanent the legend rule keeps (deterministic —
oldest survives — today), simultaneous mulligan rounds (sequential today).

**Tests:** `engine/src/identity.test.ts`, `engine/src/partner.test.ts`,
`server/src/deck-validation.test.ts`.

---

## Phase 10 — Tier 3 long tail (demand-driven)  *(begun — Sagas landed)*

Each is small once Phases 1–3 exist. Pull them in as specific decks need them.

- [x] **Sagas** (rule 714). `CardDefinition.chapters: SagaChapter[] | null`
  (`{ at: number[], targets, effect, resolve, text }` — `at` is the lore
  counts that fire it, `[1,2]` for a shared "I, II"). `moveObject`'s
  battlefield branch calls `addLoreCounter` when a Saga enters (chapter I);
  a `sagaChapterStep` turn-based action at the active player's `precombat-main`
  adds one more. `addLoreCounter` bumps `counters.lore` and queues the matching
  chapter as a `PendingTrigger { chapter: true }` — `placeTriggerOnStack` /
  `mintAbilityObject` / `stackAbilityOf` learn a `"chapter"` `abilityKind`
  reading `def.chapters[index]`. SBA (704.5s): a Saga with `lore ≥ final
  chapter` and no chapter ability of its still on the stack / pending is
  sacrificed (`saga-completed` event). New `lore-counter-added` event; both log
  formatters + a lore-counter badge (the client already renders `counters`).
  Card: `History of Benalia` (+ a `Knight Token`). `saga.test.ts`.
- **10a — modal / split faces (a *cast-time* face choice).** The card is one
  object with two (or more) castable faces; you pick one as it leaves the hand
  and it's that face for the rest of its existence. Covers **MDFC** (`//` modal
  double-faced), **split**, **adventure**, and **rooms**.
  - `CardDefinition.faces: string[]` (each face registered under its own name in
    the `CardRegistry`, like any card) + a `faceGroup` marker so the two are
    known to be the same physical card.
  - `cast-spell` / `play-land` gain a `face` field; `legalActions` enumerates a
    playable face per side (respecting each side's own type / timing / cost —
    an MDFC land side is a land drop, the spell side is a cast).
  - `GameObject.face` (which side is "up"); `printedCardName(object)` resolves
    `copyOf ?? faceName(object)` — the same one-selector pattern Clone uses, so
    every `registry.get` site is unaffected.
  - Adventure adds an exile-with-"may cast the creature later" state (a small
    `playableUntil`-style marker, shared with Phase 6's impulse-draw work).
  - **Depends on Phase 6** — face selection is a cast-pipeline choice, same
    shape as `{X}` / modal-mode selection.
- **10b — transforming DFCs (an *in-place* face flip).** A permanent flips
  between its two printed faces while staying the same object (Innistrad
  werewolves, `//` transform cards, the Marvel Spider-Man hero/alter-ego
  cards).
  - `transform` `EffectSpec` + a `transformed` flag on `GameObject` (toggles
    `GameObject.face`); "enters transformed" / "you may cast the front face; it
    enters transformed" as ETB variants.
  - `transforms` / `becomes-transformed` `TriggerSpec`s; a card's back-face
    abilities only function while it's the up face (already free — they're on
    the resolved face's `CardDefinition`).
  - The **Day / Night** designation (below) drives the modern werewolf subset;
    other transform cards carry their own trigger.
  - A card can be **both 10a and 10b** — cast on either side *and* transformable
    once in play (the Marvel Spider-Man DFCs). `faces` + `face` cover both; 10b
    just adds the in-play toggle.
- **Day / Night** — a `GameState.dayNight` value + the "becomes day/night"
  turn-based check; werewolf transform triggers read it. Coupled with 10b.
- **Battles** (Siege subtype, defense counters, attack-a-battle).
- **The Monarch; the Initiative + Undercity; venture / dungeons; the Ring
  tempts you + Ring-bearer; energy.**
- **Emblems** — a player-owned continuous-effect object.
- **Rules-lawyer:** split second, "can't be countered", phasing, banding.

**Demand note:** the Marvel Spider-Man DFC deck needs **10a + 10b together**
(hero/alter-ego cards are castable on either side and transform in play). When
that deck becomes a priority, pull 10a forward next to Phase 6 and land 10b +
Day/Night right after.

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
