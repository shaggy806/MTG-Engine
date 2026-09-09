# Authoring cards

How to turn a Magic card into a TypeScript file the engine can run, and where
the engine's coverage currently stops.

Audience: someone adding files by hand under `engine/src/cards/pool/`. Every
card is one file, one `defineCard({...})` call, one `export default`.

- [1. Quick start](#1-quick-start)
- [2. The `art` field](#2-the-art-field)
- [3. Card anatomy — every field](#3-card-anatomy--every-field)
- [4. Mana cost strings](#4-mana-cost-strings)
- [5. Keywords](#5-keywords)
- [6. Effects (`effect`)](#6-effects-effect)
- [7. Targets (`targets`)](#7-targets-targets)
- [8. Activated abilities](#8-activated-abilities)
- [9. Triggered abilities](#9-triggered-abilities)
- [10. Static abilities](#10-static-abilities)
- [11. The `resolve` escape hatch](#11-the-resolve-escape-hatch)
- [12. Multi-face, transform, adventure, Saga, commander](#12-multi-face-transform-adventure-saga-commander)
- [13. Worked examples](#13-worked-examples)
- [14. Preview your card (`npm run lab`)](#14-preview-your-card-npm-run-lab)
- [15. Current engine limitations](#15-current-engine-limitations)
- [16. Testing a new card](#16-testing-a-new-card)

---

## 1. Quick start

Create `engine/src/cards/pool/grizzly-bears.ts`:

```ts
import { defineCard } from "../define.js";

export default defineCard({
  name: "Grizzly Bears",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 2,
  toughness: 2,
});
```

Then wire it into the generated barrel:

```
npm run gen:cards -w engine
```

Rules:

- **`name`** is the registry key — it must match the card's real name exactly
  (that's how `/import-deck` and decklists resolve it). The **filename** only
  has to be unique; kebab-case of the name is the convention.
- The import is `../define.js` even though the file is `define.ts` — the engine
  is ESM + NodeNext, so relative imports carry the `.js` extension.
- `npm run gen:cards -w engine` regenerates `cards/generated.ts` (the barrel
  that collects every `pool/` and `tokens/` file into `BUILTIN_CARDS`). It also
  runs automatically as a `prebuild` / `pretypecheck` step, so `npm run build
  -w engine` or `npm run typecheck -w engine` picks a new file up too. If you
  forget, `cards/pool.test.ts` fails with a pointer to run it.
- **A token** is just a card with no `manaCost` (see `tokens/soldier-token.ts`).
  Put it in `tokens/` instead of `pool/`. It's minted by a `create-token`
  effect, never cast.

Config knobs that never appear on a card file — `startingLife`,
`openingHandSize`, `maxHandSize`, `maxLandsPerTurn`, `skipFirstDraw` — live in
`GameRules` (`state.ts`) and are set per-game, not per-card.

---

## 2. The `art` field

By default the client fetches art from Scryfall **by card name**. That fails
for made-up cards and is unreliable for tokens. Override it with a Scryfall
link:

```ts
export default defineCard({
  name: "Knight Token",
  art: "https://scryfall.com/card/tdom/1/knight",
  // ...
});
```

Any of these forms work (`client/src/ui/art.ts` resolves them, no lookup
needed):

| form | example |
| --- | --- |
| card page URL | `https://scryfall.com/card/dmu/120/sheoldred-the-apocalypse` |
| API URL | `https://api.scryfall.com/cards/dmu/120` |
| direct image URL | `https://cards.scryfall.io/art_crop/front/1/4/….jpg` |
| bare card UUID | `145dcac4-2c53-4ae9-9ede-24dc07474b01` |

The lab's **Tile** tab has a "full card image" toggle that pulls the whole card
from the same link.

---

## 3. Card anatomy — every field

`defineCard` takes a partial draft and fills defaults. Fields:

### Identity & characteristics

| field | type | notes |
| --- | --- | --- |
| `name` | `string` | **required**, the registry key |
| `art` | `string` | Scryfall link — see §2 |
| `manaCost` | `string` | `"{1}{G}"`, `"{X}{R}"`, … — see §4. Omit for a land / token. |
| `colors` | `Color[]` | `"W" \| "U" \| "B" \| "R" \| "G"`. Set it explicitly; the engine does **not** infer colour from the cost here (it *does* for colour identity — see `identity.ts`). |
| `supertypes` | `("basic" \| "legendary" \| "snow" \| "world")[]` | |
| `types` | `CardType[]` | **required**. `"land" \| "creature" \| "artifact" \| "enchantment" \| "instant" \| "sorcery" \| "planeswalker" \| "battle"` |
| `subtypes` | `string[]` | creature types, land types, `"Aura"`, `"Equipment"`, … free-form strings |
| `power` / `toughness` | `number` | creatures only; omit for everything else |
| `keywords` | `Keyword[]` | see §5 |
| `text` | `string` | Oracle text. Purely cosmetic (rendered in the UI, scanned for colour identity) — **behaviour comes from the structured fields**, not this. Keep it in sync anyway. |

### Behaviour

| field | shape | section |
| --- | --- | --- |
| `targets` | `TargetSpec[]` | §7 — a spell's target slots, chosen at cast time |
| `effect` | `EffectSpec` | §6 — what the spell/permanent-spell does on resolution |
| `resolve` | `(ctx) => void` | §11 — imperative fallback, takes precedence over `effect` |
| `activated` | `ActivatedAbility[]` | §8 |
| `triggered` | `TriggeredAbility[]` | §9 |
| `static` | `StaticAbility[]` | §10 |

### Specialised (leave unset unless the card needs it)

| field | shape | what it does |
| --- | --- | --- |
| `loyalty` | `number` | planeswalker starting loyalty — §8, §12 |
| `castModal` | `{ minModes, maxModes, modes: ModeOption[] }` | a **targeted** modal spell (choose modes at cast time). Non-targeted modes use the `modal` *effect* instead — §6. |
| `flashback` | `{ cost }` | cast from graveyard, then exiled (rule 702.34) |
| `foretell` | `{ cost }` | pay `{2}` to exile face-down, cast later for `cost` |
| `escape` | `{ cost, exileCount }` | cast from graveyard + exile N other graveyard cards |
| `suspend` | `{ n, cost }` | exile with N time counters; cast free at 0 with haste |
| `chapters` | `SagaChapter[]` | a Saga — §12 |
| `faces` | `string[]` | a multi-face card (front first) — §12 |
| `transform` | `boolean` | a *transforming* DFC (set on both faces) — §12 |
| `disturb` | `{ cost }` | cast the back face from the graveyard (front face's def) |
| `adventure` | `boolean` | an Adventure card (with `faces: [creature, adventure]`) |
| `copyOnEnter` | `{ filter: "creature" }` | Clone — enters as a copy of a chosen creature |
| `controlEnchanted` | `boolean` | an Aura whose controller controls the enchanted permanent (Mind Control) |
| `cantBeCountered` | `boolean` | "This spell can't be countered." |
| `revealsOwnLibraryTop` | `boolean` | play with your top card revealed (Oracle of Mul Daya) |

---

## 4. Mana cost strings

Parsed by `parseManaCost` (`mana.ts`). Symbols, in `{…}`:

| symbol | meaning |
| --- | --- |
| `{1}` `{2}` … | generic |
| `{W}` `{U}` `{B}` `{R}` `{G}` | coloured |
| `{C}` | colourless (paid only with colourless mana) |
| `{X}` | see below |
| `{W/U}` | hybrid — either half |
| `{2/W}` | twobrid — `{2}` or `{W}` |
| `{W/P}` | Phyrexian — `{W}` or 2 life |
| `{S}` | snow — treated as generic (no snow sources exist yet) |

`{X}` in a **spell's** cost: the caster chooses X as the spell is cast
(`cast-spell.xValue`), it's folded into generic, and effects read it via
`amount: "x"` / `ctx.x`. `{X}` in an **activated ability's** cost works the same
way (`activate-ability.xValue`). See `Fireball`, `Cinder Elemental`.

`manaValue` counts `{C}` as 1, a hybrid pip as its greatest half, `{X}` as 0.

---

## 5. Keywords

`keywords: [...]` — the supported `Keyword` union (`define.ts`):

**Wired into combat / SBAs:** `flying`, `reach`, `haste`, `vigilance`,
`defender`, `first-strike`, `double-strike`, `trample`, `deathtouch`,
`lifelink`, `menace`, `indestructible` (SBAs skip it — but 0 toughness still
kills), `unblockable` (evasion — Invisible Stalker).

**Casting:** `flash` (cast at instant speed).

**Targeting:** `hexproof` (can't be targeted by opponents).

**Day/Night:** `daybound` / `nightbound` — the two faces of a modern werewolf;
`Game.setDayNight` transforms them with the cycle.

Anything not in that list (protection wording, ward, prowess, …) is **not** a
keyword string — it's a static or triggered ability. See §9–10.

---

## 6. Effects (`effect`)

`EffectSpec` (`effects.ts`) is the declarative vocabulary for what a spell or
ability does on resolution. A `target:` field is an **index into `targets[]`**
(0-based), or the literal `"source"` where allowed. An `EffectAmount` is a
number, `"x"` (the cast `{X}`), `{ countOf: CardFilter }` — a live count of
battlefield permanents matching the filter, from the effect's controller's
view (Scourge of Valkas: `{ countOf: { subtype: "Dragon", controlledBy: "you" } }`;
Craterhoof: `{ countOf: { type: "creature", controlledBy: "you" } }`) — or
`{ triggerValue: true }` — a number the firing event supplied to a **triggered
ability**: the entering / attacking creature's power (Terror of the Peaks:
`damage`), or the combat damage a creature dealt a player (Old Gnawbone:
`create-token` `count`). `0` outside a triggered-ability resolution. An
`EffectAmount` is accepted by `damage` / `damage-all` / `mill` / `discard` /
`draw` / `prevent-damage` `amount`, `modify-pt` / `modify-pt-all`
`power`/`toughness`, and `create-token` `count`.

### Damage / life / cards

| kind | fields | example |
| --- | --- | --- |
| `damage` | `amount`, `target` | Lightning Bolt |
| `damage-all` | `filter`, `amount` | Pyroclasm |
| `gain-life` | `amount`, `who?` | Healing Salve |
| `lose-life` | `amount`, `who?` | Zulaport Cutthroat |
| `draw` | `amount` | Divination (controller draws) |
| `discard` | `target` (slot \| `"you"`), `amount` | Mind Rot / Faithless Looting |
| `mill` | `target` (slot \| `"you"`), `amount` | Tome Scour / Aftermath Analyst (`"you"`) |

`who?` is a `PlayerScope`: `"each-player" \| "each-opponent" \| "you"` (default
= the effect's controller).

### Movement / removal

| kind | fields | example |
| --- | --- | --- |
| `destroy` | `target` | Doom Blade |
| `destroy-all` | `filter` | Wrath of God |
| `exile` | `target` | Angelic Edict |
| `return-to-hand` | `target` | Unsummon |
| `return-from-graveyard` | `filter`, `destination: "battlefield" \| "hand"`, `count: number \| "all"`, `enterTapped?` | Splendid Reclamation (from *your* graveyard; a `number` less than the match count raises a `choose-from-zone`) |
| `counter` | `target` (a spell) | Counterspell |
| `sacrifice` | `who`, `filter`, `count` | Diabolic Edict (`who: "target"`), Fleshbag Marauder (`who: "each-player"`) |
| `fight` | `a`, `b`, `oneSided?` | Prey Upon / Rabid Bite |
| `gain-control` | `target`, `untilEndOfTurn` | Act of Treason |

### P/T, counters, keywords

| kind | fields | notes |
| --- | --- | --- |
| `modify-pt` | `target`, `power`, `toughness`, `duration` | `duration: "end-of-turn" \| "permanent"` |
| `modify-pt-all` | `filter`, `power`, `toughness`, `duration` | Overrun |
| `grant-keyword` | `target`, `keyword`, `duration` | |
| `grant-keyword-all` | `filter`, `keyword`, `duration` | Overrun's trample |
| `add-counter` | `target`, `counter` (string), `amount` | `counter: "+1/+1"` etc. |
| `proliferate` | — | proliferates *everything* eligible (no "choose any number") |
| `animate` | `target`, `power`, `toughness`, `addTypes`, `addSubtypes`, `setSubtypes?`, `setColors?`, `loseAbilities?`, `keywords?`, `duration` | man-lands, Turn to Frog |

### Tokens / attach / transform

| kind | fields |
| --- | --- |
| `create-token` | `token` (a registry name), `count` |
| `attach` | `target` (Equip-style) |
| `transform` | `target` (`"source"` \| slot) |
| `day-night` | `value: "day" \| "night"` |

### Tutors / library manipulation

| kind | fields | example |
| --- | --- | --- |
| `search-library` | `filter`, `destination: "hand" \| "battlefield"`, `min`, `max`, `enterTapped?` | Demonic Tutor, Rampant Growth |
| `scry` | `amount`, `then?` | Preordain (`then: { kind: "draw", amount: 1 }`) |
| `surveil` | `amount`, `then?` | Consider |
| `look-and-choose` | `zone`, `count?`, `min`, `max`, `destination`, `leftover: "bottom-random" \| "stay"`, `filter?` | Ureni of the Unwritten |

### Turn structure / cast-triggered

`take-extra-turn`, `additional-combat`, `untap-all { filter }`, `storm`,
`cascade`, `copy-spell { target }`.

### Format extras

`become-monarch { who? }`, `get-energy { amount, who? }`,
`create-emblem { text, static? }`, `prevent-all-combat-damage` (Fog),
`prevent-damage { target, amount, combatOnly? }` (Healing Salve).

### Combinators

- **`sequence { effects: [...] }`** — apply several effects in order, sharing
  the same `targets` and `x` (Blightning: damage a player *and* they discard).
- **`modal { minModes, maxModes, modes: ModeOption[] }`** — "choose one" /
  "choose one or both". Each `ModeOption` is `{ text, effect }`. **The modes
  must be non-targeted.** For a modal spell whose modes have targets, use the
  top-level `castModal` field instead (mode choice happens at cast time).
- **`may { effect, prompt }`** — "You may [effect]". One optional mode. Same
  non-targeted restriction.

`modal` / `may` / `look-and-choose` must be the whole effect or the **last**
step of a `sequence`.

`CardFilter` (used by the mass / tutor effects) is a predicate over an object's
*computed* characteristics — `{ type, types, notTypes, subtype, supertype,
name, colors, notColors, colorless, manaValue, power, toughness, controlledBy,
ownedBy, keyword, tapped, token }`, every present clause ANDed. Numeric fields
take `{ op: "eq"|"ne"|"lt"|"lte"|"gt"|"gte", n }`.

---

## 7. Targets (`targets`)

`targets: [...]` on a card is the spell's target slots, chosen when it's cast.
Abilities (`activated` / `triggered`) carry their own `targets`. `TargetSpec`
values (`target.ts`):

`"any-target"`, `"creature"`, `"nonblack-creature"`, `"creature-you-control"`,
`"creature-an-opponent-controls"`, `"player"`, `"opponent"` (a player other
than the chooser), `"creature-or-player"`,
`"permanent"`, `"nonland-permanent"`, `"land"`, `"artifact-or-enchantment"`,
`"creature-or-enchantment"`, `"spell"`, `"creature-spell"`,
`"noncreature-spell"`, `"instant-or-sorcery-spell"`,
`"instant-or-sorcery-in-your-graveyard"`.

Legality is checked at cast **and** again on resolution; a spell whose targets
have all become illegal is countered by the game (fizzles).

An Aura uses `targets: ["creature"]` (or whatever it enchants) — it attaches to
its target on resolution automatically because it has the `"Aura"` subtype.

---

## 8. Activated abilities

```ts
activated: [
  {
    cost: { mana: "{2}", tap: true },
    targets: ["any-target"],
    effect: { kind: "damage", amount: 1, target: 0 },
    resolve: null,
    text: "{2}, {T}: deal 1 damage to any target.",
  },
]
```

**`AbilityCost`** (`abilities.ts`): `{ mana?, tap?, sacrifice?, payLife?,
removeCounter?, payEnergy? }`.

- `mana`: a cost string (`"{2}"`) or `null`. May contain `{X}`.
- `tap: true` adds `{T}`.
- `sacrifice: "self"` ("Sacrifice this: …") or `"creature-you-control"` (the
  player picks).
- `payLife: 2`, `payEnergy: 3`, `removeCounter: { kind: "+1/+1", count: 1 }` —
  all paid automatically (no decision).

**Mana abilities** (`isManaAbility`): a `{T}: Add …` ability with no targets,
no `resolve`, an `add-mana` effect, and no life/counter/energy/non-self
sacrifice cost. These resolve immediately without using the stack. Use the
`manaTapAbility(color)` / `addManaAbility({...})` helpers from
`cards/helpers.js`.

- `sorcerySpeed: true` — the ability works only when you could cast a sorcery
  (Equip). An Equipment is `types: ["artifact"], subtypes: ["Equipment"]` with
  an `activated` ability `{ effect: { kind: "attach", target: 0 }, targets:
  ["creature-you-control"], sorcerySpeed: true }`.
- `loyaltyCost: 1` (or `-3`) — marks a **loyalty ability**: `cost.mana` /
  `cost.tap` are ignored, it's sorcery-speed, once per planeswalker per turn,
  and paid by adding/removing loyalty counters. Requires `loyalty` on the card.

---

## 9. Triggered abilities

```ts
triggered: [
  {
    trigger: { on: "enters-battlefield", who: "self" },
    targets: [],
    effect: { kind: "draw", amount: 1 },
    resolve: null,
    text: "When ~ enters the battlefield, draw a card.",
  },
]
```

**`TriggerSpec.on`** values (`abilities.ts`):

| `on` | extra fields | fires when |
| --- | --- | --- |
| `enters-battlefield` | `who`, `filter?`, `otherOnly?` | a permanent enters |
| `dies` | `who`, `filter?`, `otherOnly?` | a permanent → graveyard from the battlefield |
| `leaves-battlefield` | `who` | a permanent leaves for **any** zone |
| `gains-life` / `loses-life` | `who` | a player's life changes (`who` = whose) |
| `attacks` | `who` | a creature is declared as an attacker |
| `deals-combat-damage-to-player` | `who` | auto-fills the first target slot with the damaged player |
| `transforms` | `who`, `intoFront?`, `filter?` | a DFC turns over |
| `step-begins` | `step`, `who` | the start of a step (`"upkeep"` etc.) |
| `cast-spell` | `who`, `noncreatureOnly?`, `firstEachTurn?` | a spell is cast (prowess) |
| `this-cast` | — | the spell carrying this ability is cast (cascade, storm) |
| `predicate` | `match: (event) => boolean` | escape hatch — match the raw `GameEvent` |

**`who: TriggerWho`** = `"self"` (this permanent) / `"you-control"` / `"you"`
(this permanent's controller did it) / `"any"`.

`otherOnly: true` — "another …", i.e. the source permanent doesn't count.

`filter` is a `CardFilter` narrowing which permanent counts (Soul Warden:
`{ type: "creature" }`; landfall: `{ type: "land" }`).

If the ability has `targets`, the controller chooses them via a dispatched
`choose-targets` decision when the trigger goes on the stack. A slot the event
determines (`deals-combat-damage-to-player`) is auto-filled.

---

## 10. Static abilities

```ts
static: [
  {
    affects: { scope: "creatures-you-control" },
    grantPt: [1, 1],
    text: "Creatures you control get +1/+1.",
  },
]
```

**`affects.scope`**:

- `"self"` — this permanent (CDAs, "~ has …", enters-tapped replacements).
- `"creatures-you-control"` — `+ excludeSelf?`, `+ subtype?` (a lord clause).
- `"lands-you-control"` — Chromatic Lantern.
- `"attached"` — the permanent this Aura/Equipment is attached to (how Auras
  grant their effect).

**Continuous-effect fields:**

- `grantPt: [p, t]` — layer 7d P/T bonus.
- `grantKeywords: [...]` — layer 6 keyword grant.
- `grantsActivated: [...]` — give the affected permanents these activated
  abilities (Chromatic Lantern, Cryptolith Rite).
- `setBasePtFromCount: { countOf, plusPower, plusToughness }` — a layer-7b CDA
  (`"self"` only). `countOf`: `"cards-in-all-graveyards" \|
  "creature-cards-in-all-graveyards" \| "lands-you-control"`. (Mortivore.)
- `restrictions: [...]` — `"cant-attack" \| "cant-block" \| "must-attack" \|
  "must-be-blocked"` (Pacifism, Juggernaut, Lure).
- `protection: { colors?, types? }` — rule 702.16 (White Knight: `{ colors:
  ["B"] }`).
- `ward: { mana?, payLife? }` — `"self"` only; an opponent targeting this must
  pay or their spell/ability is countered (auto-paid if affordable).
- `costModification: { applies: CardFilter, reduceGeneric?, increaseGeneric? }`
  — Foundry Inspector, Thalia. `affects` is ignored — `applies` says what it
  hits.
- `playFromGraveyard: CardFilter` — while this permanent is on the battlefield
  its controller may *play* matching cards from their graveyard (Ramunap
  Excavator: `{ type: "land" }`). `affects` is ignored. Still costs the land
  drop / sorcery timing; `legalActions` enumerates the play.

**`condition?`** (`StaticCondition`) gates the *whole* static — when false it
contributes nothing:

- `{ kind: "controls", filter: CardFilter, atLeast: number }` — Kird Ape.
- `{ kind: "your-turn" }`
- `{ kind: "threshold" }` — 7+ cards in your graveyard.
- `{ kind: "metalcraft" }` — 3+ artifacts.

**`replacement?`** (`ReplacementSpec`, `replacements.ts`) — a replacement effect
*is* a static ability:

- `{ event: "enters-battlefield", tapped?, counters?: { kind, amount },
  transformed? }` — a self-replacement (enters tapped / with counters).
- `{ event: "would-create-token", multiplier }` — Doubling Season.
- `{ event: "would-add-counter", multiplier, counterKind? }` — Doubling Season.
- `{ event: "would-be-put-into-graveyard", instead: "exile", filter? }` — Rest
  in Peace / Anafenza.
- `{ event: "would-draw", who: "opponent", instead: "you-draw" }` — Notion
  Thief.

---

## 11. The `resolve` escape hatch

When the declarative vocab can't express a card, write an imperative
`resolve(ctx)`. It takes precedence over `effect`. `ctx` is a
`ResolutionContext`: `{ controller, source, targets, x }` plus every `EffectApi`
method (`ctx.dealDamage(ref, n)`, `ctx.draw(player, n)`,
`ctx.createToken(name, n)`, `ctx.searchLibrary(...)`, …). See `effects.ts` for
the full `EffectApi`.

Prefer `effect` — the declarative form is what the fuzzer, the layer system,
and future features understand. Reach for `resolve` only for genuine one-offs.
Grep the pool for `resolve:` — there are very few.

---

## 12. Multi-face, transform, adventure, Saga, commander

- **Modal DFC / split / MDFC** — each face is its **own registered card file**.
  All faces share `faces: ["Front Name", "Back Name"]` (front first). The
  player picks a face when casting/playing. Example: `grovewatch-elder.ts` //
  `grovewatch-hollow.ts`. Run `gen:cards` after adding each face file.
- **Transforming DFC** — same `faces`, plus `transform: true` on **both**
  faces. Only ever cast/played as the front; a `transform` effect / day-night
  cycle flips it in place. `nightfall-cultist.ts`.
- **Adventure** — `adventure: true` on both faces + `faces: [creatureName,
  adventureName]`. `emberclaw-scout.ts`.
- **Saga** — `chapters: [{ at: number[], targets, effect, resolve, text }]`.
  `at` lists the lore counts that fire the chapter (`[1]`, `[2]`, `[1, 2]` for
  a shared "I, II"). `history-of-benalia.ts`.
- **Commander** — nothing on the card marks it; it's whichever card a
  `DeckList.commander` names. `supertypes: ["legendary"]` is conventional. The
  engine adds the `{2}` tax and the 903.9a replacement automatically.

---

## 13. Worked examples

**ETB draw** (`elvish-visionary.ts`):

```ts
triggered: [{
  trigger: { on: "enters-battlefield", who: "self" },
  targets: [], effect: { kind: "draw", amount: 1 }, resolve: null,
  text: "When Elvish Visionary enters the battlefield, draw a card.",
}]
```

**Tap pinger** (`prodigal-sorcerer.ts`):

```ts
activated: [{
  cost: { mana: null, tap: true },
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
  resolve: null,
  text: "{T}: Prodigal Sorcerer deals 1 damage to any target.",
}]
```

**Mana dork** (`llanowar-elves.ts`): `activated: [manaTapAbility("G")]`.

**{X} burn** (`fireball.ts` / `blaze.ts`): `manaCost: "{X}{R}"`, `targets:
["any-target"]`, `effect: { kind: "damage", amount: "x", target: 0 }`.

**Anthem** (`glorious-anthem.ts`):

```ts
static: [{ affects: { scope: "creatures-you-control" }, grantPt: [1, 1],
           text: "Creatures you control get +1/+1." }]
```

**Aura** (`pacifism.ts`): `subtypes: ["Aura"]`, `targets: ["creature"]`,
`static: [{ affects: { scope: "attached" }, restrictions: ["cant-attack",
"cant-block"], text: "…" }]`.

**Token maker** (`raise-the-alarm.ts`): `effect: { kind: "create-token", token:
"Soldier Token", count: 2 }`.

**Modal instant** — non-targeted modes via the `modal` effect:

```ts
effect: {
  kind: "modal", minModes: 1, maxModes: 1,
  modes: [
    { text: "You gain 3 life.", effect: { kind: "gain-life", amount: 3 } },
    { text: "Draw a card.",     effect: { kind: "draw", amount: 1 } },
  ],
}
```

Targeted modes → use `castModal` (see `duskwood-verdict.ts`,
`sunder-charm.ts`).

**Planeswalker** (`chandra-acolyte-of-flame.ts`): `loyalty: 4`, `activated`
abilities each with a `loyaltyCost` and `cost: { mana: null, tap: false }`.

---

## 14. Preview your card (`npm run lab`)

```
npm run build -w engine     # once, so the lab's types resolve
npm run lab -w client        # → http://localhost:5174/card-lab.html
```

- **left** — every card, searchable / type-filterable.
- **Tile** tab — the engine's own render (printed values) + a full-card-image
  toggle. This is where an `art` override shows up.
- **Structure** tab — the parsed effect / ability tree, plus chips for every
  engine feature the card uses (good for sanity-checking against §15).
- **Sandbox** tab — a solo game with the card in hand (and on the battlefield
  if it's a permanent), 25 lands, and an opponent with a creature, a
  deathtouch creature, and a planeswalker to target. Cast it, activate it,
  watch the stack and log. **Reset** rebuilds.

Editing an **existing** card file hot-reloads the lab instantly. A **new** file
still needs `npm run gen:cards -w engine` first.

---

## 15. Current engine limitations

If a card needs something here, it can't be authored faithfully yet — pick a
different card, or extend the engine (see `ROADMAP.md`).

**No vocabulary for:**

- Returning a card from **another player's** graveyard, or to the library, as
  an effect. `return-from-graveyard` covers *your own* graveyard → battlefield
  / hand; `escape` / `flashback` / `disturb` cover self-recursion of the spell
  itself; `StaticAbility.playFromGraveyard` (Ramunap Excavator) lets you *play*
  matching cards from your graveyard.
- `modify-pt` / `draw` / `discard` / `tap` targeting **another player** by
  scope — `draw` is always the controller; `discard`/`mill` take a
  target-player slot (or `"you"`) but there's no "each opponent draws/mills"
  form.
- Reordering the cards you keep on top after a scry.
- Multi-destination or sacrifice-on-death tutors (Cultivate's "one to
  battlefield, one to hand"; Sakura-Tribe Elder).
- `discard` as part of an **activated ability cost**.
- `spellsCastThisTurn` triggers beyond `cast-spell` / `this-cast`; no generic
  "at the beginning of your end step" trigger with a condition.

**Partial:**

- **Text-change** only swaps one creature-type word (Artificial Evolution). No
  full "the words X become Y".
- **Protection** is `{ colors, types }` only — not "protection from
  [full filter]" (e.g. "from Dragons", "from everything").
- **Conditional statics** are limited to the four `StaticCondition` kinds
  (`controls` / `your-turn` / `threshold` / `metalcraft`). Other "as long as
  …" clauses aren't expressible.
- **Replacement ordering** — if two replacements would apply to one event
  there's no `choose-replacement-order`; the pool has no such case. No damage
  **redirection** to a third object (Harm's Way).
- **Modal** resolution-time modes must be non-targeted (targeted → `castModal`,
  cast-time only).
- **Snow** mana is treated as generic — no snow permanents / snow-mana
  requirements.
- **`proliferate`** always proliferates everything eligible (no "choose any
  number").

**Not modeled at all:** phasing, Battles, dungeons / the Initiative / the Ring,
banding, "day/night"-independent double-faced tokens, a static ability that
makes a planeswalker a creature (Gideon), ability-dependency ordering (rule
613.8), companions / backgrounds.

---

## 16. Testing a new card

- **Fuzz it.** Add the name to one of the decks in
  `engine/scripts/random-demo.mjs`, then `npm run play:random -w engine --
  --games 300`. If `legalActions` ever offers something `dispatch` refuses,
  this crashes.
- **Write a focused test** if the card exercises new-ish behaviour — one
  `engine/src/<card-or-feature>.test.ts` that builds a `Game` (or uses
  `createSandbox` from `sandbox.ts`), dispatches through the interaction, and
  asserts the outcome. See `engine/src/clone.test.ts` for the white-box
  `spawn` pattern, or `engine/src/sandbox.test.ts` for the sandbox helper.
- **Run the suite:** `npm run test -w engine`.
- **Eyeball it:** `npm run lab -w client`, Sandbox tab.
