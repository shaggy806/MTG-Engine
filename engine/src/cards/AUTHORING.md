# Authoring cards

How to turn a Magic card into a TypeScript file the engine can run, and where
the engine's coverage currently stops.

Audience: someone adding files by hand under `engine/src/cards/pool/`. Every
card is one file, one `defineCard({...})` call, one `export default`.

- [0. Rule zero: faithful, or not at all](#0-rule-zero-faithful-or-not-at-all)
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

## 0. Rule zero: faithful, or not at all

**Never add a card the engine cannot run faithfully.** If any part of the
printed card can't be expressed — an ability that would have to be dropped, a
mode that would have to be cut, a number that would have to be hardcoded, a
choice that would have to be made *for* the player in a way that can change
the outcome — then **don't author the card at all**.

A missing card costs nothing. The deck importer offers a stand-in for it, the
report names it, and the player knows exactly what they did and didn't get. A
card that is *present but weaker than its printing* is a lie the game tells at
the table, and nothing downstream catches it: `card:verify` checks the stat
block and not the text, the fuzzer checks for crashes and not for fidelity,
and `card:text` (§16) only catches a whole clause going missing — never a
clause that's present but wrong. The player finds out when the card doesn't do
what it says, and by then they don't know which of the other 700 to trust.

There is no "close enough" tier and no scale of importance. A dropped
graveyard half on a tutor and a dropped keyword on a vanilla creature are the
same defect.

When the card you want is blocked, the options are, in order:

1. **Author a different card.** The backlog is over 1,500 deep; something else
   is unblocked right now.
2. **Build the missing primitive, then the card.** This is how most of the
   pool got here. `neededCards-features.md` ranks features by how many real
   cards each unblocks — add yours to that ranking rather than working around
   it.
3. **Leave it out**, and note what blocked it. Not shipping a card costs
   nothing but the card.

Three things are **not** fidelity violations, and the rest of this guide leans
on the distinction:

- **Paraphrasing the `text` field** while the behaviour is exact. `text` is
  what the client prints; what the engine runs is the structured fields. Keep
  `text` close to Oracle anyway — `card:text` reads it, so a paraphrase costs
  you that check.
- **Reminder text**, and a keyword line the client already renders from
  `keywords`.
- **A choice the card itself cannot distinguish** — picking between two
  candidates that are identical in every respect the card cares about. The
  moment they differ in a way a player could reasonably have a view on, it is
  a violation, whatever the field is called. (This is a much narrower licence
  than it sounds: see `proliferate` in §15, which hid a real one for a long
  time behind exactly this wording.)

If you are unsure whether something counts, it counts. §15 is the list of what
the engine can't yet express; §16 is the checks, none of which is a substitute
for reading the Oracle text next to your card file.

---

## 1. Quick start

**Look the card up on Scryfall first.** Don't author from memory — mana
costs, P/T, and especially Oracle text wording are easy to misremember and
the engine's behaviour is only as correct as the printed card. Run:

```
npm run card:lookup -w engine -- "Card Name"
```

(`engine/scripts/scryfall-lookup.mjs`, a thin wrapper over the [Scryfall
card API](https://scryfall.com/docs/api/cards/named)). It prints the
authoritative mana cost, type line, P/T or loyalty, colors, keywords, and
full Oracle text — every face separately for a DFC/split/adventure card,
plus any related token names under "Related parts". Add `--rulings` to also
pull official rulings (useful when a card's exact interaction is unclear —
e.g. how an intervening-if or a replacement effect is worded), or `--json`
for the raw Scryfall payload. It accepts multiple names in one call and
does its own rate-limit throttling/retry, so batch-lookup a set of cards
before authoring all of them.

Then create `engine/src/cards/pool/grizzly-bears.ts`:

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
| `additionalCost` | `{ sacrifice: CardFilter }` | a **mandatory** extra cost to cast (rule 601.2f — Harrow: "sacrifice a land"). Paid as the spell is cast, so it stands even if the spell is countered, and the spell isn't castable at all without it. The caster picks which permanent. |
| `additionalCost.options` | `AdditionalCostOption[]` | a **choice** of whole costs, exactly one paid (Bitter Triumph: "discard a card or pay 3 life"; Demand Answers: "sacrifice an artifact or discard a card"). Each option takes a `text` label plus any of `discard` / `payLife` / `sacrifice` / `mana`, and is enumerated as its own castable variant — so the caster chooses by picking a `cast-spell`, not by answering a decision. **Not for a cost whose *filter* spans two types**: Deadly Dispute's "sacrifice an artifact or creature" is one cost with `typesAnyOf` and needs none of this. |
| `kicker` | `{ cost, targets?, effect? }` | **kicker** (rule 702.33 — Tear Asunder). `cost` is folded onto the printed cost; `targets` / `effect` replace the unkicked ones when kicked. `legalActions` offers the card twice, kicked and unkicked. |
| `overload` | `{ cost, effect }` | **Overload** (rule 702.126 — Cyclonic Rift). An alternative cost that *replaces* the mana cost entirely (unlike kicker's additive cost) and takes **no targets** — `effect` is the whole "each ..." version of the card (typically a `-all` `EffectSpec`, e.g. `return-to-hand-all`/`destroy-all`), applied with the printed `targets`/`effect` untouched for the ordinary cast. `legalActions` offers the card twice. |
| `alternativeCost` | `{ mana, tapCreatures: { count, filter } }` | an alternative cost that replaces the mana cost *and* taps permanents (rule 601.2b — Sephara's "pay {W} and tap four untapped creatures you control with flying rather than pay this spell's mana cost"). Offered as a second `cast-spell` variant (`altCost: true`), the same shape `kicked`/`overload`/`free` use; the caster picks what it taps, as for `tapOthers`. |
| `castOnlyIf` | `StaticCondition` | "You can't cast this spell unless …" — checked from whatever zone it's cast, the command zone included (Rakdos, Lord of Riots' "unless an opponent lost life this turn" is `{ kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 1 }`). An instruction to cast it doesn't get past it. |
| `splitSecond` | `boolean` | Split second (rule 702.61): while this spell is on the stack, nobody can cast other spells or activate abilities that aren't mana abilities. Put "Split second" in `text`; triggered abilities still trigger. |
| `freeCastIf` | `{ condition: StaticCondition }` | a conditional free-cast permission printed on the spell itself (the CMM commander-precon cycle — Fierce Guardianship: "If you control a commander, you may cast this spell without paying its mana cost."). Unlike `overload`, targets/effect are completely unchanged — only the cost differs, and it's *in addition to* the normal cast, not instead of it. `legalActions` offers the card twice whenever the condition is currently met. |
| `convoke` | `boolean` | **Convoke** (rule 702.51 — Chord of Calling, Hour of Reckoning). A pure payment-*method* choice made as the spell is cast (`Action.convoke: ConvokePayment[]`, each `{ creature, pays?: "generic" \| Color }` — omit `pays` and the engine puts the creature where it helps most; a token stack is named once per token) — tap untapped creatures instead of mana for part of the cost. A convoking creature can't also tap for mana. Doesn't change the printed cost, targets, or effect; not enumerated as a second `cast-spell` variant — the one `LegalAction` carries `convoke: { candidates, maxGeneric, proof, manaAffordable, maxCreatures, xProof?, copies? }` (every untapped creature the caster controls) instead. Convoke pays for `{X}` too (Chord of Calling): `xCost.maxX` counts the creatures that could convoke, the cast is checked at the X chosen, and `xProof` is a payment proved at that largest X — `convokeProofFor(offer, x)` trims it to any smaller one. |
| `selfCostReduction` | `{ condition: StaticCondition, reduceGeneric }` | a reduction printed on the spell itself, gated on board state (rule 601.2f — Ferocious, Finale of Devastation: "if you control a creature with power 4 or greater, this spell costs {2} less"). Unlike a `StaticAbility.costModification` (a permanent reducing *other* spells) this is evaluated for the card being cast, from whatever zone — no permanent has to be on the battlefield granting it. `reduceGeneric` accepts a live count too (`{ countOf: CardFilter }` — Blasphemous Act: "{1} less for each creature on the battlefield", `{ type: "creature" }` with no `controlledBy` counts every player's) and an aggregate (`{ aggregate: "sum", of: "power", filter: { type: "creature", controlledBy: "you" } }` — Ghalta, Primal Hunger's "{X} less, where X is the total power of creatures you control"; clamped at 0) and `{ playerCounters: "experience" }` (Mizzix of the Izmagnus's "{1} less for each experience counter you have") and `{ turnStat, who }` (a turn stat summed over players — Rakdos, Lord of Riots' "{1} less for each 1 life your opponents have lost this turn" is `{ turnStat: "life-lost", who: "opponent" }`; a `costModification`'s `reduceGeneric` takes the same amounts). `condition` is mandatory; a reduction with no real "if" clause uses `{ kind: "controls", filter: {}, atLeast: 0 }` (trivially always true). needed-cards P10, P19. |
| `flashback` | `{ cost, payLife? }` | cast from graveyard, then exiled (rule 702.34). `payLife` is part of the cost (Deep Analysis's "Flashback—{1}{U}, Pay 3 life"), so it gates castability and is paid as the spell is cast. |
| `foretell` | `{ cost }` | pay `{2}` to exile face-down, cast later for `cost` |
| `escape` | `{ cost, exileCount }` | cast from graveyard + exile N other graveyard cards |
| `suspend` | `{ n, cost }` | exile with N time counters; cast free at 0 with haste |
| `cycling` | `{ cost, search? }` | pay `cost`, discard this card, draw a card (rule 702.29). With `search` it's **landcycling / typecycling** (702.29f — Migratory Route's "Basic landcycling {2}"): the same special action, but a library search into your hand instead of the draw. |
| `chapters` | `SagaChapter[]` | a Saga — §12 |
| `faces` | `string[]` | a multi-face card (front first) — §12 |
| `transform` | `boolean` | a *transforming* DFC (set on both faces) — §12 |
| `disturb` | `{ cost }` | cast the back face from the graveyard (front face's def) |
| `adventure` | `boolean` | an Adventure card (with `faces: [creature, adventure]`) |
| `copyOnEnter` | `{ filter: "creature" }` | Clone — enters as a copy of a chosen creature |
| `controlEnchanted` | `boolean` | an Aura whose controller controls the enchanted permanent (Mind Control) |
| `cantBeCountered` | `boolean` | "This spell can't be countered." |
| `commanderTaxAsLife` | `boolean` | the commander tax is paid in life instead of mana (Liesa, Shroud of Dusk: "Rather than pay {2} for each previous time you've cast this spell from the command zone this game, pay 2 life that many times"). A cast from the command zone costs the printed cost plus 2 life per previous cast; a cast from anywhere else owes no tax at all. The life is part of the cost, so it gates castability (rule 119.4 — payable down to exactly 0, never from below) and leaves that much less life for a painland or Phyrexian pip in the same payment. The client's "+N" tax badge still reads it as mana. |
| `exileOnResolve` | `boolean` | "Exile ~" printed on a non-permanent spell's own resolution text (Genesis Ultimatum) — goes to exile instead of the graveyard after resolving, unconditionally (however it was cast). Distinct from flashback/disturb/adventure, which only redirect a spell cast *that way*. needed-cards P19. |
| `shuffleIntoLibraryOnResolve` | `boolean` | "Shuffle ~ into its owner's library" as the last part of resolving (White Sun's Zenith). Only on resolving: a *countered* one goes to the graveyard, because the shuffle is an instruction the spell never got to carry out. |
| `countersPersistAcrossZones` | `boolean` | "Counters remain on ~ as it moves to any zone other than a player's hand or library" (Skullbriar, the Walking Grave). `moveObject` keeps `counters` on every other move (graveyard, exile, command zone, stack, and back onto the battlefield, where enters-with-counters adds to them); everything else rule 400.7 resets still resets. Read off the object as it leaves, so a copy of the card keeps them and a permanent that has lost its abilities doesn't. Counters apply to P/T in every zone (layer 7c), so a grown card is that size in the graveyard too. |
| `revealsOwnLibraryTop` | `boolean` | play with your top card revealed (Oracle of Mul Daya) |
| `pairing` | `CommanderPairing` | the partner-family ability that lets this card be one of **two** commanders (rule 702.124) — §12. Never inferred from `text`. |

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

A **permanent** spell's X carries onto the battlefield for its own
enters-the-battlefield abilities only (rule 107.3m): an "enters with X
counters" replacement (`counters.amount: "x"`, `walking-ballista.ts`) and a
`trigger: { on: "enters-battlefield", who: "self" }` ability whose effect says
`"x"` both see the X it was cast with — the trigger snapshots it as it
triggers, so flickering the permanent in response doesn't change it. Any other
ability of the permanent sees X = 0, as does a permanent that entered without
being cast, and the card after it leaves and returns (a new object). A
"whenever *another* creature enters" trigger is not this permanent's ETB and
reads 0 too.

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

**Evasion:** `fear` (rule 702.36 — blockable only by artifact and/or black
creatures) and `intimidate` (702.13 — artifact creatures and/or creatures
sharing a colour with it; a colourless attacker with intimidate is blockable
only by artifact creatures).

**Landwalk** (rule 702.14): `plainswalk`, `islandwalk`, `swampwalk`,
`mountainwalk`, `forestwalk`, `desertwalk` — can't be blocked as long as the
defending player controls a land of that *type* (a Breeding Pool is a Forest).
One keyword per land type a card prints; a new type is a new keyword, added to
`LANDWALK` in `combat/eligibility.ts` and to the client's `KEYWORD_GLYPH`.

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
Craterhoof: `{ countOf: { type: "creature", controlledBy: "you" } }`);
`{ countInGraveyard: CardFilter }` — how many cards in *graveyards* match
(Undergrowth — Lotleth Giant's "for each creature card in your graveyard";
`ownedBy: "you"` is what narrows it to your own);
`{ lifeTotal: "you" }` — the controller's life total (Ajani's ultimate);
`{ lifeTotal: "each" }` — the life of **each player a scoped effect is
applied to**, read once per player ("each opponent loses half **their**
life" is a `lose-life` with `who: "each-opponent"` and this inside `half`;
works for scoped `damage` / `draw` / `mill` / `discard` / `gain-life` /
`lose-life`; outside a scope it reads the controller's);
`{ half: EffectAmount, round: "up" | "down" }` — half of an amount, rounded
the way the card says (rule 107.1a);
`{ manaSpentOf: ref }` — how much mana was actually spent to cast the source
or trigger object (Prossh: "X is the amount of mana spent to cast it";
commander tax and {X} count, a free cast is 0, convoked creatures aren't
mana);
`{ manaValueOf: ref }` — the mana value of whatever a target slot (or
`"source"` / `"trigger-object"` / `"sacrificed"`) points at, as it last
existed on the battlefield if it has left since (rule 608.2h, last known
information — Feed the Swarm destroys the permanent and *then* reads it,
and `0` for a player target). A spell **on the stack** counts its chosen {X}
(rule 202.3e — Kaervek reading a Fireball cast for 3 sees 4), and a target
that was a spell and has since left the stack is read as it last existed
there, X included (Mana Drain's "that spell's mana value" after countering
it). Anything else reads X as 0, so Reanimate on a Stonecoil Serpent costs no
life; or
`{ triggerValue: true }` — a number the firing event supplied to a **triggered
ability**: the entering / attacking creature's power (Terror of the Peaks:
`damage`), or the combat damage a creature dealt a player (Old Gnawbone:
`create-token` `count`). `0` outside a triggered-ability resolution. An
`EffectAmount` is accepted by `damage` / `damage-all` / `mill` / `discard` /
`draw` / `gain-life` / `lose-life` / `prevent-damage` `amount`, `modify-pt` /
`modify-pt-all` `power`/`toughness`, `add-mana` `amount`, and `create-token`
`count`.

The rest of the shapes: `{ countOf: CardFilter, times?, excludeSelf?,
excludeTarget? }` (a battlefield count, optionally multiplied — Shamanic
Revelation's "4 life **for each**"; `excludeSelf` is "for each **other**
creature you control", `excludeTarget: i` is "other than **that** creature",
leaving out whatever target slot `i` names. Both leave out one *permanent*:
a source that is a member of a token stack leaves the rest of its stack
counted), `{ aggregate: "sum" | "max", of: "power" | "toughness" |
"mana-value", filter, excludeSelf? }` (an `AggregateSpec`, `filter.ts` — "X is
the **total power** of creatures you control", "the **greatest mana value**
among permanents you control". Computed values, so anthems and counters
count; mana value off the printed cost with `{X}` as 0. A **sum counts a
token stack once per token** — twenty 1/1 Goblins in one stack are 20 power.
A max over no permanents is 0, and the amount is clamped at 0, rule 107.1b),
`{ countersOn: ref, counter }` (how many counters of one kind are on it —
Black Market's charge counters; from a dies trigger, the counters it died
with, Chasm Skulker), `{ countInGraveyard }`, `{ manaValueOf }`, `{ powerOf }`, `{ toughnessOf }`
(Condemn; each takes a target slot, `"source"`, `"trigger-object"` or
`"sacrificed"` — see "Last-known information" below), `{ lifeTotal: "you" }`
(Storm Herd), `{ devotionTo: Color }` (rule 700.5 — Gray Merchant of
Asphodel; a hybrid pip counts for each colour it contains, `{X}` and generic
for nothing), `{ creaturesDiedThisTurn: true }`
(per *player*, unlike `GameState`'s global counter — Liliana's Standard
Bearer), `{ countPlayers: PlayerScope }` (Inspired Sphinx; counts living
players, so it shrinks as a multiplayer game does),
`{ turnStat: TurnStat, who?: PlayerScope }` (a per-turn running total —
`"life-lost"`, `"life-gained"`, `"cards-drawn"`, `"spells-cast"`,
`"damage-taken"`, `"combat-damage-taken"` or `"attacked"` (1 once they've
declared an attacker — raid) — summed over the scope,
default `"you"`: Kydele's "for each card you've drawn this turn", or the life
your opponents lost this turn as `who: "each-opponent"`; Aetherflux Reservoir's
"1 life for each spell you've cast this turn" as `"spells-cast"`, which counts
countered spells too),
`{ playersWithTurnStat: TurnStat, who: PlayerScope }` (how many players in the
scope have a nonzero total — "for each opponent who lost life this turn";
Tymna the Weaver's "the number of opponents that were dealt combat damage this
turn" is `"combat-damage-taken"`),
`{ turnHistory: "entered" | "died" | "sacrificed" | "exiled" | "descended", who?, filter? }`
(how many permanents entered under the scope's control, creatures died under
it, permanents they sacrificed, permanents were exiled from under their
control (Vren, the Relentless: `{ turnHistory: "exiled", who:
"each-opponent", filter: { type: "creature" } }`), or permanent cards were put
into their graveyards — "you descended" — this turn; a token stack counts every token.
`filter` narrows them: a permanent that has left as it last existed, a card in
a graveyard as it is now. See `PlayerState.turnHistory`),
`{ damageDealtThisTurn: true, who?, combat?, colors? }` (how much damage
sources the scope's players controlled dealt this turn, to anything — only
combat or only noncombat damage if `combat` says, only from sources that were
one of `colors` as they dealt it; see the `damage-dealt-this-turn` condition),
`{ playerCounters: "poison" | "experience", who?: PlayerScope }` (the counters
of that kind the scope's players have, summed, default `"you"` — Ezuri, Claw
of Progress's "where X is the number of experience counters you have"),
`{ opponentsControllingFewer: CardFilter }` (Voice of Many — a comparison per
player, which no single filter can express),
`{ cardsInHand: PlayerScope }` (the hand sizes of the scope's players, summed —
"the number of cards in **defending player's** hand" is `"trigger-player"` in
an attack trigger), `{ colorsOf: ref }` (how many colours one object has —
Ramos, Dragon Engine's "for each of **that spell's** colors"; as it last
existed if it has left, colourless 0), `{ colorsAmong: CardFilter,
excludeSelf? }` (colours among battlefield permanents, each once — Sisay's
"each color among other legendary permanents you control"),
`{ cardTypesInGraveyard: CardFilter }` (card types among cards in graveyards,
each type once and a two-typed card giving both — Tarmogoyf is `{}`, delirium's
"in your graveyard" `{ ownedBy: "you" }`), and the arithmetic that composes
the rest without every shape growing a modifier: `{ product: [...] }` (Gray
Merchant's "life equal to the life lost this way" is devotion × opponents, and
neither factor is static), `{ sum: [...] }` ("N plus an amount" — "mana value 1
greater than the sacrificed creature's" is `{ sum: [{ manaValueOf: "sacrificed"
}, 1] }`, in a filter's `{ amount }` operand as well as an effect) and
`{ difference: [a, b], absolute? }` (`a` minus `b`, never below 0 — Mr.
Foxglove's "cards in defending player's hand minus the number of cards in your
hand"; `absolute` is the larger minus the smaller, Doran, Besieged by Time's
"the difference between its power and toughness").

**"This way."** `{ thisWay: "discarded" | "drawn" | "milled" | "sacrificed",
who?, filter?, cardTypes? }` counts what the resolving spell or ability has
made players discard, draw or mill, or sacrifice, **so far** — "draw a card for
each card discarded this way", Celes's "draw that many cards plus one" (`{
sum: [{ thisWay: "discarded" }, 1] }`). It's read off the resolution's own
events (`GameState.resolutionSince`), so a step that waited on a player's
choice — the discard itself, usually — counts once it has happened; put it in
a *later* step of a `sequence`. `who` narrows whose cards (default everyone's:
"each player discards a card, then you draw a card for each card discarded
this way"); `filter` narrows the cards as they are now — in the graveyard a
discard put them in — and a sacrificed permanent as it last existed;
`cardTypes: true` counts the card types among them instead (Kefka, Court
Mage). Cards exiled or otherwise moved "this way" aren't covered yet. The
`this-way` condition (§10) asks the same question as an "if".

### Damage / life / cards

| kind | fields | example |
| --- | --- | --- |
| `damage` | `amount`, `target` \| `who` \| `toControllerOfTarget` \| `toTriggerRecipient`, `from?` | Lightning Bolt (`target`); Breath of Malfegor (`who: "each-opponent"`); Unlicensed Disintegration — "deals 3 damage to **that creature's** controller" (`toControllerOfTarget: 0`, mirroring `create-token`'s `who: "target-controller"`). `toTriggerRecipient: true` is "deals 2 damage to **that permanent or player**" in a damage trigger (Ghyrson Starn) — whatever the triggering damage hit, not a target, and nothing once a permanent recipient has left the battlefield. `from: "trigger-object"` makes the *triggering object* the source — "**it** deals damage equal to its power" (Be'lakor's entering Demon), "**it** deals that much damage to each other opponent" (Kediss's commander): its lifelink, deathtouch and colours apply, read as it last existed on the battlefield if it has left. |
| `damage-all` | `filter`, `amount`, `exceptSource?` | Pyroclasm. `exceptSource` spares the source itself — Harbinger of the Hunt's "each **other** creature with flying", which a `CardFilter` can't say (it describes the permanent matched, not its relationship to the damage source). |
| `creatures-damage-controllers` | `filter`, `amount` | Rakdos Charm — "each creature deals 1 damage to its controller"; the reverse direction from `damage-all` (each matching permanent is its own source, hitting its own controller, not the caster). needed-cards P20 |
| `gain-life` | `amount` (an `EffectAmount`), `who?` | Healing Salve; Shamanic Revelation's "4 life for each creature you control with power 4 or greater" is `{ countOf: …, times: 4 }` |
| `lose-life` | `amount`, `who?` \| `target?` | Zulaport Cutthroat (`who`); Ob Nixilis, the Fallen — "target player loses 3 life" (`target`, a target-slot index — mutually exclusive with `who`, needed-cards P19) |
| `draw` | `amount`, `who?`, `target?` | Divination (controller draws); Stormfist Crusader (`who: "each-player"`); Bloodgift Demon (`target`, a player slot). `target` wins if both are set. |
| `discard-hand` | `who` | Dragon Mage — "each player discards their hand". A whole hand at once with nothing to choose, so unlike `discard` it never raises a decision, which is what lets "discards their hand, **then** draws seven" resolve in one pass. |
| `discard` | `target` (slot \| a `PlayerScope`), `amount` | Mind Rot / Faithless Looting (`"you"`) / "each opponent discards a card" (`"each-opponent"`). A scope asks each player with a real choice **in turn**, APNAP (`GameState.pendingDiscards`); a player whose hand is no bigger than the count discards it at once. |
| `mill` | `target` (slot \| a `PlayerScope`), `amount` | Tome Scour / Aftermath Analyst (`"you"`) / Hope Estheim (`"each-opponent"`) |

`who?` is a `PlayerScope`: `"each-player" \| "each-opponent" \| "you" \|
"active-player" \| "trigger-controller" \| "trigger-player" \|
"each-other-opponent" \| "that-player"` (default = the effect's controller). `"active-player"`
is "that player" in a trigger that fires on someone else's step.
`"trigger-controller"` is the controller of the triggering object (the player
who drew the card, cast the spell). `"trigger-player"` is **the player the
triggering event names** — the player dealt damage (or the controller of the
permanent dealt damage), the defending player of an attack (a planeswalker's
controller when the attack was at it); nobody outside such a trigger.
`"each-other-opponent"` is each of your opponents **but** that one (Kediss:
"it deals that much damage to each other opponent"). `"that-player"` is the
player an `each-player-may`'s follow-up is about (and otherwise the same as
`"trigger-player"`). None of these is a target, so hexproof doesn't stop
them.

### Movement / removal

| kind | fields | example |
| --- | --- | --- |
| `tap` | `target` (index only) | |
| `tap-all` | `filter` | Thundermaw Hellkite's "Tap those creatures" — the mirror of `untap-all`. `tap` only ever takes one chosen target. |
| `untap` | `target: EffectTargetRef` — an index, `"source"`, or `"trigger-object"` | Amulet of Vigor: `target: "trigger-object"` untaps the permanent whose entering fired the trigger, with no target slot at all |
| `destroy` | `target` | Doom Blade |
| `put-on-bottom-of-library` | `target` | Condemn — buries a permanent under its **owner's** library. Not a shuffle and not a bounce, which is why it isn't a `return-to-hand` variant. |
| `destroy-all` | `filter` | Wrath of God |
| `exile` | `target`, `untilSourceLeaves?` | Angelic Edict. Works on a card in a **graveyard** as well as a permanent (Withered Wretch). `untilSourceLeaves` is an "O-Ring" (Banishing Light, Conclave Tribunal) — see below. |
| `return-exiled-by-source` | — | The other half of an O-Ring: returns everything this source exiled, to the battlefield under its **owner's** control. |
| `put-onto-battlefield` | `target` (an `EffectTargetRef`, so `"trigger-object"` works — Undying returns *itself*), `underYourControl?`, `enterTapped?`, `withCounters?`, `exileIfItWouldLeave?`, `transformed?` | Reanimation that names one card, from anyone's graveyard — as opposed to `return-from-graveyard`'s filter over your own. `underYourControl` makes controller diverge from owner, so the card still goes back to its **owner's** graveyard when it dies. `transformed` is "…onto the battlefield transformed" (Ojer Axonil's "return it to the battlefield tapped and transformed"): a transforming double-faced card enters back face up; anything else just enters. |
| `exile-graveyard` | `target` (a player slot, or `"you"`) | Bojuka Bog — exiles that player's whole graveyard at once (rule 406; the cards in it are never individually targeted) |
| `flicker` | `target`, `thenCounters?`, `underYourControl?`, `transformed?`, `returnAt?`, `returnText?` | Essence Flux — exiles `target`, then immediately returns it to the battlefield under its owner's control (rule 400.7 — a brand-new object; a token exiled this way never comes back). `target` is a slot, `"source"` (the ability's own permanent *as it was when the ability triggered* — one that has blinked since is left alone) or an array of slots, all exiled first and returned together so each one's enters triggers see the others. `underYourControl` returns them under the effect's controller. `transformed` is "…return it to the battlefield **transformed**" (Clive, Ifrit's Dominant), now or at a delayed return. `returnAt` (a `DelayedTriggerTiming`) makes the return a delayed trigger instead — Norin the Wary's "exile Norin. Return it … at the beginning of the next end step" — linked to the exile (rule 610.3): a card that left exile in between stays where it is, and nothing is set up when nothing was exiled, so a second trigger in one turn does nothing. Don't build that with `exile` + `delayed-trigger`: the delayed effect can't tell the exiled card from a new object. (`return-flickered` is the delayed half it builds; never author it.) |
| `return-to-hand` | `target: EffectTargetRef`, `from?: "battlefield" \| "graveyard" \| "exile" \| "stack"` | Unsummon (a bounce — `from` omitted). With `from`, it takes a card out of that zone instead, to its **owner's** hand: `"graveyard"` + a `card-in-graveyard` target is "return target creature card from your graveyard to your hand" (Golbez, Crystal Collector); `"source"` / `"trigger-object"` with `"graveyard"` or `"exile"` is "return it to its owner's hand" off a dies / leaves trigger, and works inside a `delayed-trigger` too. `"stack"` + a `"spell"` target is Unsubstantiate or Venser, Shaper Savant — **not a counter**: a spell that can't be countered still goes back, a copy of a spell ceases to exist (rule 707.10c), and an ability or the resolving spell itself is left alone. The object has to be in the `from` zone when the effect applies, or nothing happens. A commander returned this way offers the command zone (rule 903.9b), like a bounced one. |
| `return-to-hand-all` | `filter` | Cyclonic Rift, overloaded — mirrors `destroy-all` |
| `exile-all` | `filter` | Farewell's "Exile all artifacts" — the mass `exile`, one event (each one's leaves trigger sees the rest go), a token stack exiled whole |
| `return-from-graveyard` | `filter`, `destination: "battlefield" \| "hand"`, `count: number \| "all"`, `enterTapped?`, `withCounters?` | Splendid Reclamation (from *your* graveyard; a `number` less than the match count raises a `choose-from-zone`). `withCounters: { kind: "finality", amount: 1 }` is "…with a finality counter on it" (Shilgengar, Sire of Famine) — put on each card that enters, before its entry is announced, whether everything returns at once or the player chooses. |
| `search-library` … `reveal?` | — | "…, **reveal it**, …" (Enlightened Tutor, Mystical Tutor): shows the find to every player, rule 701.16. Off by default — a plain "search your library for a card" (Vampiric Tutor) reveals nothing, and the difference is printed on the cards. |
| `put-on-library` | `target`, `position: "top" \| "bottom"` | Academy Ruins, Mortuary Mire — puts one **targeted** card on its owner's deck. Pair it with a `card-in-graveyard` target for the graveyard-recursion lands; unlike `return-from-graveyard` it is target-driven, so it reaches any graveyard. |
| `delayed-trigger` | `at`, `effect`, `text`, `controller?` | Whip of Erebos's "exile it at the beginning of the next end step", Arcane Denial's upkeep draws; with `at: { leaves, to, thisTurn? }`, Kelsien, the Plague's "when that creature dies this turn". Rule 603.7 — see below. |
| `reflexive-trigger` | `targets: TargetSpec[]`, `effect`, `text` | "**When you do**, …" — a reflexive triggered ability (rule 603.12): Terra, Herald of Hope's "you may pay {2}. When you do, return target creature card with power 3 or less from your graveyard to the battlefield tapped" is a `may` with `cost: "{2}"` and this as its `effect`. Applying it triggers an ability that goes on the stack once the creating spell or ability has finished resolving, choosing `targets` then — so it *can* target, unlike a `may`'s `then`, and players can respond to it. `effect` reads its own targets by slot; `"source"`, X (including an X paid for the `may`) and the triggering event are the creator's. With no legal target it's removed as it would go on the stack. Put it only where the action has certainly happened: a `may`'s `effect`, a `sacrifice-source`'s `then`. |
| `counter` | `target` (a spell), `into?: "hand"` | Counterspell. A spell that can't be countered stays on the stack and resolves (`counter-failed`); a countered copy of a spell ceases to exist (rule 707.10c). `into: "hand"` is Remand's "if that spell is countered this way, put it into its owner's hand instead" — still a counter, so it does nothing to a spell that can't be countered, unlike `return-to-hand` with `from: "stack"`. |
| `sacrifice-all-but` | `who`, `keep`, `filter` | "chooses up to N they control, then sacrifices the rest" (Archfiend of Depravity) — the inverse of `sacrifice`, which names how many to give up. Raised only when they're over the limit. |
| `sacrifice` | `who`, `filter`, `count`, `exceptSource?` | Diabolic Edict (`who: "target"`), Fleshbag Marauder (`who: "each-player"`), Korvold (`who: "you"`, `exceptSource: true` = "another") |
| `sacrifice-source` | `then?` | Defense of the Heart — "Sacrifice ~. **If you do,** …"; no choice, and `then` only applies if the source was still there to sacrifice |
| `fight` | `a`, `b`, `oneSided?` | Prey Upon / Rabid Bite |
| `gain-control` | `target`, `untilEndOfTurn` | Act of Treason; `untilEndOfTurn: false` is "lasts indefinitely" (Sliver Overlord). A timestamped layer-2 effect: the latest control effect on a permanent wins, Aura or not (rule 613.7), and when one ends the next-latest takes over |

#### Delayed triggered abilities (`delayed-trigger`)

"At the beginning of the next end step, exile it" is not part of the effect
that says it — it is a separate ability that fires later (rule 603.7). Set one
up with a `delayed-trigger` effect:

```ts
{
  kind: "delayed-trigger",
  at: "next-end-step",
  effect: { kind: "exile", target: 0 },
  text: "Exile the creature Whip of Erebos returned.",
}
```

`at` is one of `next-end-step`, `your-next-end-step`, `next-upkeep`,
`your-next-upkeep`, `your-next-main-phase`. "Next" never means a step already
in progress: an ability created *during* an end step waits for the following
turn's.

The delayed ability chooses no new targets (rule 603.7d) — it carries forward
the targets the creating effect had, so `target: 0` inside it means the same
object the spell or ability was already pointed at, and `"source"` still means
the card that set it up. Neither has to still be around when it fires.

`controller` (`{ controllerOfTarget: n }`) hands the ability to someone else —
Arcane Denial's "**its controller** may draw up to two cards".

**When a permanent leaves.** `at` can instead wait on one permanent leaving
the battlefield — "when that creature dies this turn, you get an experience
counter" (Kelsien, the Plague):

```ts
{
  kind: "delayed-trigger",
  at: { leaves: 0, to: ["graveyard"], thisTurn: true },
  effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
  text: "When that creature dies this turn, you get an experience counter.",
}
```

`leaves` is a slot, `"source"` or `"trigger-object"`, and has to be a
permanent on the battlefield as the effect applies — otherwise nothing is set
up. `to` lists the destinations that fire it (`["graveyard"]` is "dies",
`["graveyard", "exile"]` "dies or is exiled"); `thisTurn` makes it lapse as the
next turn begins. It watches that permanent's current stint only: it is used up
the first time the permanent leaves for anywhere, so one bounced to hand and
replayed is a new object it never fires for (rule 400.7). When it fires, the
permanent is its trigger object, wherever it went — "return it to the
battlefield" is `{ kind: "put-onto-battlefield", target: "trigger-object" }`
(under its owner's control unless it says otherwise), and finds the card only
in the zone it went to: exiled from the graveyard in response, it stays in
exile. The same is true of every leave-triggered ability's "it" — undying's
return included.

Earthbend is built on this — use the `earthbend` effect rather than spelling
it out (§ P/T, counters, keywords).

For the common "create a token, then get rid of it at end of turn" shape, use
`create-token` / `create-token-copy`'s `sacrificeAtEndStep` (Kiki-Jiki,
Chandra, Acolyte of Flame) or `exileAtEndStep` (Miirym) instead — the delayed
ability would have no way to name a token that didn't exist when it was set up.

### P/T, counters, keywords

| kind | fields | notes |
| --- | --- | --- |
| `modify-pt` | `target`, `power`, `toughness`, `duration` | `duration: "end-of-turn" \| "permanent"` |
| `modify-pt-all` | `filter`, `power`, `toughness`, `duration`, `exceptSource?`, `controlledByTarget?` | Overrun. `exceptSource` spares the source ("**other** attacking creatures you control with flying" — Steel-Plume Marshal, itself one). `controlledByTarget` scopes to a *targeted seat* (Great Oak Guardian), which a `CardFilter`'s `controlledBy` can't name — it only knows "you" and "opponent". |
| `grant-keyword` | `target`, `keyword`, `duration` | |
| `flip-coin` | `won?`, `lost?`, `untilLose?` | "Flip a coin. If you win the flip, …; if you lose the flip, …" (rule 705): the controller flips on the game's seeded random stream (so a seed replays), then `won` or `lost` applies as their effect. `untilLose: true` is "flip a coin until you lose a flip" (Okaun, Eye of Chaos; Zndrsplt, Eye of Wisdom) — `won` once per win. Each flip is a `coin-flipped` event, which the `wins-coin-flip` trigger reads. |
| `prohibit` | `who` (a target slot or a `PlayerScope`, default you) with `spells` / `abilities`, or `target` (a permanent) | Prohibitions until end of turn: Sen Triplets' "this turn, that player can't cast spells or activate abilities" (`who: 0, spells: true, abilities: true`), Koma, Cosmos Serpent's "its activated abilities can't be activated this turn" (`target: 0` — that permanent this stint; flickered, it's a new object). Mana abilities are activated abilities, so they're barred too. `GameState.turnProhibitions`. |
| `restrict` | `target` or `filter`, `restrictions` | Combat restrictions (§5's `CombatRestriction`s) until end of turn: "target creature can't block this turn" (`restrictions: ["cant-block"]`), Anzrag, the Quake-Mole's "~ must be blocked each combat this turn if able" (`target: "source"`, `["must-be-blocked-if-able"]`). On `target` it's a modifier, like a keyword grant; with `filter` instead it's a rule for the rest of the turn over everything matching it from your side — "creatures your opponents control can't block this turn" binds a creature that enters later too (rule 611.2c; `GameState.turnRestrictions`). |
| `grant-graveyard-cast` | `target` | "Choose target artifact card in your graveyard. You may cast that card this turn" (Silas Renn, Emry) — pair with a `card-in-graveyard` target. A one-shot permission on the *card* (`GameObject.graveyardCastPermission`) for the effect's controller, for its normal cost, until end of turn: it outlives whatever granted it and ends if the card leaves the graveyard. Casts only, never a land. Offered as `via: "graveyard-permission"` with `graveyardGrant.source` = the card itself. |
| `grant-triggered` | `target`, `ability`, `duration` | "gains 'Whenever this creature deals combat damage to a player, draw that many cards'" (Hunter's Prowess, Hunter's Insight). Rides on the target's own modifiers, so `"end-of-turn"` expires with every other until-end-of-turn modifier. The ongoing equivalent is `StaticAbility.grantsTriggered` (§10). |
| `grant-keyword-all` | `filter`, `keyword`, `duration`, `exceptSource?` | Overrun's trample. `exceptSource` is "**other** Spiders you control gain …" (Cosmic Spider-Man). Hits what matches as it resolves (rule 611.2c) — a creature arriving later doesn't gain it. |
| `add-counter` | `target`, `counter` (string), `amount` | `counter: "+1/+1"` etc. |
| `earthbend` | `target`, `amount` | Earthbend N — "target land you control becomes a 0/0 creature with haste that's still a land. Put N +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped." (Toph, the First Metalbender's end-step earthbend 2 is a `step-begins` trigger with a land-you-control target slot and `{ kind: "earthbend", target: 0, amount: 2 }`). Permanent, not until end of turn. The return is a delayed trigger keyed to the land leaving (see *Delayed triggered abilities*), so it survives the land losing its abilities, returns it under its owner's control, and only from the graveyard or exile it went to. |
| `add-counter-all` | `filter`, `counter`, `amount`, `exceptSource?` | the untargeted mass form (Loyal Guardian: "a +1/+1 counter on each creature you control"). Routes through `add-counter` per permanent, so Doubling Season still composes. `exceptSource` is "each **other** creature you control" (Finneas, Ace Archer). |
| `populate` | — | Populate (rule 701.32): create a token copying a creature token you control (Rootborn Defenses). Copies the largest by power rather than asking — see §15 "Partial". |
| `amass` | `amount`, `creatureType` | Amass N (rule 701.44). One effect rather than create-then-count, because "an Army you control" has to resolve to the **same** object each time — that's what makes repeated amassing grow one creature. Picks the first Army rather than asking; no precon makes two. |
| `grant-player-hexproof` | `who?` | "You gain hexproof until end of turn" (Lazotep Plating). A *player* can't be targeted by opponents; permanents gaining hexproof is `grant-keyword-all`. Turn-scoped on `GameState.hexproofPlayers`. |
| `double-counters-all` | `filter`, `counterKind` | Kalonian Hydra / Bristly Bill — doubles each matching permanent's own current count of that counter kind (routes through `add-counter`'s own logic, so Doubling Season's replacement still composes on top: 3x, not 4x) |
| `double-pt-all` | `filter`, `duration` | Unnatural Growth — doubles each matching permanent's own *current computed* power/toughness individually (a 2/2 and a 5/5 both matching become a 4/4 and a 10/10), unlike `modify-pt-all`'s single shared amount |
| `proliferate` | — | proliferates *everything* eligible (no "choose any number") |
| `animate` | `target`, `power`, `toughness`, `addTypes`, `addSubtypes`, `setSubtypes?`, `setColors?`, `loseAbilities?`, `keywords?`, `duration` | man-lands, Turn to Frog |
| `animate-all` | `filter`, `power`, `toughness`, `addTypes?`, `addSubtypes?`, `keywords?`, `duration` | the mass form: every match becomes an N/N at once (Vihaan: "have Treasures you control become 3/3 Construct Assassin artifact creatures … until end of turn"). With no `addTypes` it only sets base P/T. Matches are fixed as it begins, and a token stack is animated whole. |
| `add-types` | `target: EffectTargetRef`, `addTypes?`, `addSubtypes?`, `duration` | "It becomes a Demon **in addition to its other types**" (Clavileño, First of the Blessed; Jenova, Ancient Calamity's "that creature becomes a Mutant"): layer 4 only — P/T, colours and abilities are untouched, unlike `animate` — until end of turn or for as long as it stays on the battlefield. A lord of the new type reaches it. After a `put-onto-battlefield` in the same `sequence`, the same slot reaches the returned permanent ("…return it to the battlefield. It's a Zombie in addition to its other types"). |

### Tokens / attach / transform

| kind | fields |
| --- | --- |
| `create-token` | `token` (a registry name), `count`, `who?: "target-controller" \| PlayerScope` (Beast Within — under `targets[0]`'s controller; a scope has each of its players create `count` — "each opponent creates a Treasure token"), `tapped?` (Army of the Damned — "create thirteen **tapped** … tokens"; a tapped batch is never folded into a token stack, since a stack carries one `tapped` flag for all of it) `gainUntilEndOfTurn?: Keyword[]` is "they gain haste until end of turn" (Ovika, Enigma Goliath): the keywords go on the tokens this makes as they're made, never on ones already there, and such a batch only folds into a token stack made the same way. |
| `create-token-copy` | `of: "source" \| "trigger-object" \| slot`, `count`, `gainsHaste?`, `exileAtEndStep?`, `notLegendary?`, `basePt?: [p, t]`, `who?: "you"` — a token that's a copy of a permanent, under *its* controller by default; `who: "you"` puts it under the effect's controller instead, which is what a card copying something an **opponent** controls means (Hate Mirage). `"trigger-object"` = the permanent whose entering/attacking fired the trigger (Miirym); a slot = a target (Saw in Half). `gainsHaste` is the copy exception "except it has haste" (Kiki-Jiki), which lasts; `gainUntilEndOfTurn?: Keyword[]` is "it gains haste until end of turn" (Mishra, Eminent One). |
| melee | `melee()` from `helpers.ts` — rule 702.121, "Whenever this creature attacks, it gets +1/+1 until end of turn for each opponent you attacked with a creature this combat", as the attack trigger it is, reading the `{ opponentsAttacked: true }` amount (a planeswalker attacked isn't its controller). |
| annihilator | `annihilator(n)` from `helpers.ts` — rule 702.86, "Whenever this creature attacks, defending player sacrifices N permanents", as the attack trigger it is (a `sacrifice` of `"trigger-player"`, who is the player attacked or the attacked planeswalker's controller). Put it in `triggered` or grant it with `grantsTriggered`, and the printed line in `text`. |
| firebending | `firebending(amount, text?)` from `helpers.ts` — "Firebending N (Whenever this creature attacks, add N {R}. This mana lasts until end of combat.)" as the triggered ability it is: put it in `triggered` (or grant it with `grantsTriggered`), and the printed line in `text`. `amount` takes any `EffectAmount` — Fire Lord Zuko's "firebending X, where X is Fire Lord Zuko's power" is `firebending({ powerOf: "source" })`, read as the trigger resolves. |
| investigate | `investigate(times?)` from `helpers.ts` — rule 701.36a, "create a Clue token", written as the `create-token` of `"Clue Token"` it is ("investigate twice" is `investigate(2)`; `times` takes any `EffectAmount`). The Clue (`{2}, Sacrifice this token: Draw a card.`) has an activated ability, so Clues are never folded into a token stack. |
| `attach` | `target` (Equip-style) |
| `transform` | `target` (`"source"` \| slot) | A transforming DFC turns over; since the 2025 rules change so does a modal DFC, to a face that's a permanent (Kazandu Mammoth to Kazandu Valley, never Fell Mire to Fell the Profane). |
| `day-night` | `value: "day" \| "night"` |

### Tutors / library manipulation

| kind | fields | example |
| --- | --- | --- |
| `search-library` | `who?: { controllerOfTarget }` (Path to Exile — *its controller* searches), `filter`, `destination: "hand" \| "battlefield"`, `min`, `max`, `enterTapped?`, `restDestination?` | Demonic Tutor, Rampant Growth. `max` is an `EffectAmount`, so "up to X basic lands, where X is the number of tapped creatures you control" is a `countOf` (Harvest Season). `restDestination` sends every *chosen* card after the first somewhere else — Cultivate's "put one onto the battlefield tapped and the other into your hand" (distinct from `leftover`, which is about cards **not** chosen). |
| `scry` | `amount`, `then?` | Preordain (`then: { kind: "draw", amount: 1 }`) |
| `reveal-top` | `then` | "Reveal the top card of your library. If it's a land card, put it onto the battlefield tapped. Otherwise, draw a card" (Thrasios). Reveals to every player, then applies `then` with **that card as target 0**, so a `{ kind: "target", index: 0, filter }` condition and a `put-onto-battlefield { target: 0 }` both reach it. The card doesn't move unless `then` moves it. |
| `surveil` | `amount`, `then?` | Consider |
| `look-and-choose` | `zone: "library" \| "graveyard" \| "hand"`, `count?`, `min`, `max`, `destination`, `leftover: "bottom-random" \| "stay" \| "hand" \| "graveyard"`, `filter?`, `enterTapped?` | Ureni of the Unwritten; Genesis Ultimatum uses `leftover: "hand"` — every non-chosen looked-at card goes to hand, regardless of `filter` (needed-cards P19); `"graveyard"` is "…and the rest into your graveyard", in the same move as the chosen cards. **`zone: "hand"`** is the "you may put a land card from your hand onto the battlefield" family (Growth Spiral, Ghalta, Terrain Generator): `min: 0` is the "you may", `leftover: "stay"` leaves the rest of the hand alone, and it bypasses the land-drop rule because putting a land onto the battlefield is not *playing* one. **`then`** is applied once the choice is answered, with the **chosen cards as its targets** — the only way to say anything about a card that was chosen rather than targeted (Sneak Attack's "that creature gains haste"). |

### Turn structure / cast-triggered

`take-extra-turn`, `additional-combat { afterThisPhase?, withMain? }`, `additional-land-drop { amount }` (Explore's "You may
play an additional land this turn"), `untap-all { filter, controlledByTarget? }`, `storm`,
`cascade`, `copy-spell { target }`.

`additional-combat` alone is Aggravated Assault's "after this main phase,
there is an additional combat phase followed by an additional main phase":
both come after the postcombat main phase. `afterThisPhase: true` puts the
combat phase **straight after the combat phase under way** instead (Karlach,
Fury of Avernus; Anzrag: "after this phase, there is an additional combat
phase"), and `withMain: true` adds "followed by an additional main phase"
(Najeela, the Blade-Blossom) — one more main phase before the rest of the
turn. Use it from a combat trigger; the `turn-structure` condition's
`combatPhase: 1` is "if it's the first combat phase of the turn", which is
what stops Karlach's trigger adding a third.

### Format extras

`become-monarch { who? }`, `get-energy { amount, who? }`,
`add-player-counters { counter: "poison" | "experience", amount, who?, target? }`
("you get an experience counter"; Fynn, the Fangbearer's "that player gets two
poison counters" is `who: "trigger-player"`; ten poison counters lose the game,
rule 704.5c — energy keeps its own `get-energy`),
`create-emblem { text, static? }`, `prevent-all-combat-damage` (Fog),
`prevent-damage { target, amount, combatOnly? }` (Healing Salve).

**An O-Ring** ("exile target … until ~ leaves the battlefield") is rule 720.2:
*one* printed ability that exiles and sets up a linked delayed trigger. Author
it as the two halves the rule describes — an `enters-battlefield` trigger with
`exile { untilSourceLeaves: true }`, and a `leaves-battlefield` trigger with
`return-exiled-by-source`. The link rides on `GameObject.exiledBy`, which
`moveObject` clears on any zone change: a card that leaves exile some other way
is no longer the one this permanent took, and a token that was exiled ceased to
exist (rule 111.7), so neither comes back.

### Combinators

- **`sequence { effects: [...] }`** — apply several effects in order, sharing
  the same `targets` and `x` (Blightning: damage a player *and* they discard).
  `simultaneous: true` marks the steps as **one instruction** written one step
  per target slot — Victimize's "return the chosen cards to the battlefield
  tapped" — so what they move moves at once: cards taken out of a graveyard
  leave together (one `leaves-graveyard` trigger, not one per card), and
  permanents taken off the battlefield leave together (rule 603.10a). Leave
  it off a sequence of separate sentences, which really are separate events
  (rule 608.2c). A step that stops to ask someone something — a discard, an
  edict, a search, a `may`, a mode — is answered, by everyone it asks, before
  the next step happens: the rest of the sequence waits in
  `GameState.suspendedResolutions`, and the spell is still resolving
  meanwhile (no state-based actions, no triggers put on the stack). So
  "each player sacrifices six creatures. You create six Zombies" is just two
  steps, and the Zombies can't be sacrificed.
- **`modal { minModes, maxModes, modes: ModeOption[] }`** — "choose one" /
  "choose one or both". Each `ModeOption` is `{ text, effect }`. **A mode
  can't introduce a *new* target choice of its own** — for a modal spell whose
  modes need their own targets, use the top-level `castModal` field instead
  (mode choice happens at cast time). A mode's effect *can* reference the
  enclosing ability's own already-chosen targets (`target: 0`, same as
  anywhere else) — needed-cards P19. `notChosenThisTurn: true` is "choose
  one **that hasn't been chosen this turn**" (Galadriel, Light of Valinor):
  only the modes this ability of this object hasn't had chosen yet this turn
  are offered, and with none left nothing happens. Counted per ability, like
  `resolved-this-turn` (a permanent that leaves and returns starts again),
  and reset as each turn begins.
- **`may { effect, prompt, cost?, costLife?, costEnergy?, then?, else?, oncePerTurn? }`** — "You may [effect]". One
  optional mode; same targeting rule as `modal`. `cost` is a mana cost to say
  yes ("you may pay {B}. If you do, draw a card" — Nihil Spellbomb): the
  choice is only *offered* when it's payable, so being unable to pay and
  declining both land on `else`, and the mana is spent as the choice is
  answered (re-checked then, since the board can move in between).
  `costLife` / `costEnergy` are the rest of that cost, as amounts read when
  the `may` applies — Zoraline, Cosmos Caller's "you may pay {W}{B} and 2
  life", Tymna the Weaver's "you may pay X life", "you may pay {E}{E}": the
  choice is offered only when every part can be paid (life: at least that
  much, rule 119.4), and all of it is paid together as it's answered. Say
  the whole cost in `prompt`, which is what the player sees. `then`
  applies only when `effect` was chosen ("If you do, …" — Ob Nixilis, the
  Fallen); `else` only when it was declined ("If you didn't, …", or an
  "unless" cost framed as the decline branch — Springheart Nantuko, The
  Gitrog Monster's upkeep). needed-cards P19. `oncePerTurn: true` is "**Do
  this only once each turn.**" (Pantlaza, Sun-Favored): the ability still
  triggers every time, but once it has done it this turn it isn't offered
  again (`else` applies instead); a resolution where it was declined doesn't
  count. Same per-ability count as `modal`'s `notChosenThisTurn` — a `may` is
  a choice of one mode. Not "This ability triggers only once each turn", which
  is the trigger's own `oncePerTurn` (§9).
- **`goad { target }`** / **`goad { who }`** — goad every creature a target
  player controls (rule 701.38 — Geode Rager), or every creature a whole
  `PlayerScope` controls (Kardur, Doomscourge's `who: "each-opponent"`).
  Marks `GameObject.goadedBy`; those creatures then attack each combat if able
  and must attack someone *other* than the goader when another defender is
  legal. The goad lapses as the goader's own next turn begins — which is why
  a card printed as "until your next turn, creatures your opponents control
  attack each combat if able" is a `goad` rather than a bespoke effect.
- **`encore {}`** — Encore (rule 702.140 — Rakshasa Debaser, Kangee's
  Lieutenant): one hasty token copy per opponent, each with
  `mustAttackPlayer` set to *that* opponent, all sacrificed at the next end
  step. One effect because the loop, the per-opponent attack requirement and
  the sacrifice are one instruction — and it copies a card in **exile**, which
  the Encore cost put there (`zone: "graveyard"`).
- **`impulse-exile { amount, duration, castOnly?, choose?, yourTurnOnly?, gate? }`**
  — "impulse draw": exile the top N cards face-up and let yourself play them
  (Dream Pillager, Tectonic Giant, Theater of Horrors). `duration` is
  `"end-of-turn"`, `"your-next-turn"` (counted down as *that player's* turns
  end, so extra turns and multiplayer order stay exact — granted during one of
  their own turns it lasts through the rest of it and all of the next, as
  Prosper, Tome-Bound's end-step exile does; granted on an opponent's turn it
  lasts through their very next one) or `"while-source"`.
  `castOnly` is "cast **spells** from among them" (no lands) rather than "play
  them". `choose` grants the permission to only that many of the exiled cards,
  via a `choose-from-zone` decision whose `destination` is `"exile-playable"`
  — the cards never move. `yourTurnOnly` / `gate` are checked live every time
  the permission is *used*, as opposed to `duration`, which is when it lapses.
  The mark rides on `GameObject.impulse`, so it survives cloning and the
  source leaving.
- **`unless { chooser, options, otherwise }`** — a *punisher* clause, where
  **someone else** decides whether to pay and `otherwise` happens only if they
  don't (Demanding Dragon, Indulgent Tormentor, Kazuul). `chooser` is a
  target-slot index holding a player, `"trigger-controller"` (the
  controller of the permanent whose event fired the trigger),
  `"trigger-player"` (the player that event names), `"active-player"`, or
  `"you"` — The Gitrog Monster's "sacrifice ~ unless **you** sacrifice a
  land" (`otherwise: { kind: "sacrifice-source" }`), which unlike a `may`
  with an `else` isn't offered without a land to sacrifice. Each
  `UnlessOption` is `{ pay }` (mana), `{ payLife }`, `{ sacrifice }`,
  `{ discard }` (a count — Tergrid's Lantern's "…unless they sacrifice a
  nonland permanent **or discard a card**") or `{ putFromHand }` (a filter —
  "put a land card from your hand onto the battlefield") plus a `text` label;
  a mana option has to be the only one, since that payment rides on the
  decision itself and would be owed whichever option was taken. Options the
  chooser can't take in full aren't offered (rule 118.3; life needs at least
  that much, rule 119.4), so "couldn't" and "wouldn't" both land on
  `otherwise` — which is what the printed cards do too. This is the difference from `may`: the decision is
  raised for the chooser, not the effect's controller. What happens when they
  don't pay is still the **controller's** effect — an opponent who declines
  Rhystic Study's {1} lets *you* draw, and Smothering Tithe's Treasure is
  yours — so an `otherwise` that is itself a `may` asks the controller.
- **`each-player-may { who, prompt?, effect?, options?, choices?, ifDid?, ifDidnt?, resultsFor? }`**
  — a choice that belongs to other players, or to several: "each player
  may …", "each opponent may …", "its controller may …" (`who:
  "trigger-controller"` — Selvala, Heart of the Wilds), "the player whose
  turn it is may …" (`"active-player"` — Obeka). Everyone in `who` is asked
  **in turn**, from the active player (rule 101.4), with a `choose-modes`
  decision of their own, and what one of them chose is done before the next
  is asked. They may do `effect` (asked with `prompt` — Kwain, Itinerant
  Meddler's "each player may draw a card"), or one of `options`
  (`UnlessOption`s, as for `unless`, each offered only to a player who can
  take it — Kynaios and Tiro's `{ putFromHand: { type: "land" } }`; a
  punisher asked of each opponent, "each opponent loses 3 life unless that
  player sacrifices a nonland permanent or discards a card", is `options`
  and an `ifDidnt`). Either way it's **their own** effect: "you" in it is
  them. Then `ifDid` / `ifDidnt` apply once for each player who did /
  didn't, in turn order, as the **effect's controller's** effect, with
  `"that-player"` naming that player — Kwain's "each player who drew a card
  this way gains 1 life" (`ifDid: { kind: "gain-life", amount: 1, who:
  "that-player" }`), Wernog, Rider's Chaplain's "each opponent who doesn't
  loses 1 life. You investigate for each opponent who investigated this
  way" (an `ifDidnt` `lose-life` of `"that-player"`, an `ifDid`
  investigate), a tempting offer's "for each opponent who does, you …".
  `resultsFor` keeps the follow-ups to a scope: Kynaios and Tiro's "then each
  **opponent** who didn't draws a card" asks `"each-player"` with
  `resultsFor: "each-opponent"`. A player with nothing they could take isn't
  asked, and didn't. `choices` (two or more `{ text, effect }`) is a
  **villainous choice** (rule 701.56 — "each opponent faces a villainous
  choice — …, or …"): each of them must pick one, and the one picked is the
  **controller's** effect about them ("you draw a card"; "that player
  discards a card" is `who: "that-player"`).
- **`choose-creature-type { then }`** — "Choose a creature type. [then …]"
  as a spell resolves (rule 205.3m — Crippling Fear, Distant Melody). The
  controller picks from the full catalog (`engine/src/creature-types.ts`,
  regenerated from Scryfall by `npm run gen:creature-types -w engine`), and
  every string exactly equal to `CHOSEN_CREATURE_TYPE` (from `helpers.ts`)
  anywhere inside `then` is replaced by the chosen type before `then` applies
  with the spell's own targets and `x` — so write
  `filter: { type: "creature", notSubtypes: [CHOSEN_CREATURE_TYPE] }` or
  `count: { countOf: { controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } }`.
  The decision carries `catalog: true`, which the client renders as a search
  popup with the chooser's most common creature types as suggestions. A
  *permanent* that remembers its type is `chooseCreatureTypeOnEnter` instead
  (Urza's Incubator), not this.
- **`conditional { condition: StaticCondition, then, else? }`** — apply `then`
  if `condition` holds at resolution (evaluated from the source's controller's
  view — same `{ controls, your-turn, threshold, metalcraft }` union as a
  static's `condition`), otherwise `else`. Scute Swarm ("if you control six or
  more lands …").

A `CardFilter` numeric clause may be written `{ op: "eq", n: "x" }` to compare
against the `{X}` of the spell or ability applying it (Steel Hellkite: "each
nonland permanent with mana value X"; Chord of Calling's `search-library`: "a creature card
with mana value X or less"). `destroy-all` also takes
`onlyControllersDamagedBySource`, narrowing to permanents whose *controller*
this effect's source dealt combat damage to this turn — a fact about the
source, so it isn't a `CardFilter` clause.

`CardFilter` (used by the mass / tutor effects) is a predicate over an object's
*computed* characteristics — `{ type, types, notTypes, typesAnyOf, subtype,
subtypes, supertype, notSupertype, name, notName, colors, notColors, colorless,
manaValue, power, toughness, counters, controlledBy, ownedBy, keyword,
notKeyword, tapped, token, isCommander, equipped, enchanted, modified, anyOf,
manaSpent, putIntoGraveyardFromLibraryThisTurn, enteredThisTurn,
attackedThisTurn, cast, castBy, castFrom, enteredFrom, putThereBySource,
sharesCardTypeWith }`,
every present clause ANDed. `controlledBy` is `"you"`, `"opponent"` or
`"active-player"` (whoever's turn it is, whoever is asking). `anyOf: CardFilter[]` is the "or": at least one of
them has to match as well (historic is `anyOf: [{ type: "artifact" },
{ supertype: "legendary" }, { subtype: "Saga" }]`; Dogmeat's "enchanted or
equipped" is two). `equipped` / `enchanted` ask whether an Equipment / Aura is
attached, whoever controls it (`enchantedBy: "you"` — an Aura *you* control); `modified` is rule 700.9 — a counter, an
Equipment, or an Aura controlled by the permanent's *own* controller.
`manaSpent` compares the mana spent to cast it (The Emperor of Palamecia's
cast trigger filters on `{ manaSpent: { op: "gte", n: 4 } }`). `putIntoGraveyardFromLibraryThisTurn` is a
graveyard card that got there from a library this turn — milled, surveilled,
or any other library-to-graveyard move, never discarded or destroyed (Captain
N'ghathrod's end-step target is `{ kind: "card-in-graveyard", whose:
"opponent", filter: { typesAnyOf: ["artifact", "creature"],
putIntoGraveyardFromLibraryThisTurn: true } }`). A card that leaves the
graveyard and returns loses it (rule 400.7). `sharesCardTypeWith: "sacrificed"`
is "a permanent that **shares a card type with it**" — the permanent the
spell or ability sacrificed, as it last existed (Braids, Arisen Nightmare);
an effect's filter is bound to its types as the effect applies, and anywhere
nothing was sacrificed it matches nothing. `enteredThisTurn` /
`attackedThisTurn` are a permanent's history this turn — "creatures that
entered this turn", Kratos, God of War's "creatures that player controls that
**didn't attack** this turn" (`attackedThisTurn: false`). A permanent that
changes zones is a new object that did neither; one that has left is asked as
it last was. `cast` / `castBy: "you"` / `castFrom` / `enteredFrom` /
`putThereBySource` read how a permanent came onto the battlefield, this stint
(`GameObject.entry`): as a spell that was cast and resolved ("if you cast it"
— Anti-Venom's enters trigger is `{ on: "enters-battlefield", who: "self",
filter: { cast: true, castBy: "you" } }`, since whether it was cast never
changes; a copy of a spell was never cast), cast from which zone, from which
zone it entered (Fire Lord Zuko's "whenever a permanent you control enters
from exile" — a spell comes from the stack, so a creature cast from exile
doesn't), and whether an ability of the permanent applying the filter put it
there — Kodama of the East Tree's "if it wasn't put onto the battlefield
with this ability" is `putThereBySource: false` on its enters trigger, which
is what keeps it from triggering off its own lands. A permanent that has left
is asked as it last was. `attacking` asks whether the permanent is currently attacking
(Kangee's Lieutenant). `subtypes`/`typesAnyOf` are an OR
within themselves (Farseek: "a Plains, Island, Swamp, or Mountain card";
Takenuma's Channel: "a creature or planeswalker card"). Numeric fields take
`{ op: "eq"|"ne"|"lt"|"lte"|"gt"|"gte", n }`.

#### A number read off the game (`DynamicOperand`)

`n` needn't be printed. Two object shapes read it when the filter is
evaluated:

- `n: { amount: EffectAmount }` — any `EffectAmount` (§6), evaluated in the
  context of whatever applies the filter: its source, controller, `{X}`,
  targets, and for a triggered ability the trigger object and value. Clement,
  the Worrywort's "return up to one target creature you control **with lesser
  mana value**" (lesser than the creature that entered) is

  ```ts
  { kind: "permanent", whose: "you", filter: {
      type: "creature",
      manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } } } }
  ```

  "Power less than this creature's" is `{ amount: { powerOf: "source" } }`.
  There is no "plus one" amount yet, so "mana value equal to 1 plus the
  sacrificed creature's" can't be written.
- `n: { own: "power" | "toughness" | "manaValue" }` — a characteristic of the
  object being matched itself: "each creature spell with toughness greater
  than its power" is `toughness: { op: "gt", n: { own: "power" } }`. Needs no
  context, so it works everywhere a filter does.

Where `{ amount }` is answered, and when:

- **Target filters** (a `{ kind: "permanent" }` / `card-in-graveyard` slot):
  when the targets are offered, when the answer is validated, and **again on
  resolution** (rule 608.2b) — nothing is frozen, so a triggering creature
  that has changed by then changes the answer, and a target that no longer
  qualifies is illegal.
- **Trigger filters** (`TriggerSpec.filter`): as the event happens, with the
  would-be trigger object as `"trigger-object"` and this permanent as
  `"source"`.
- **An effect's own filters** (a sweep's, a search's, a count's, a
  `conditional`'s): bound to plain numbers as that effect applies, step by
  step through a `sequence`, so a later step sees what an earlier one did.
  A nested effect (`then`, `else`, a delayed trigger's `effect`, a mode) is
  bound when *it* applies.
- **Anywhere else** — a static ability's `condition`, a mana restriction, an
  imperative `resolve` building its own filter — nothing can answer it and the
  comparison **fails closed** (the object doesn't match). Use `{ own }` or a
  printed number there.

#### Last-known information (rule 608.2h)

An object an amount reads that was a **permanent** when the spell or ability
referred to it, and has left the battlefield since, is read **as it last
existed there** — its computed power and toughness (counters, anthems,
pumps), mana value (what a copy effect made it), controller, types, colours
and keywords (`GameObject.lastKnown`, taken as it left). "When Juri dies, it
deals damage equal to its power to any target" is just `{ powerOf: "source" }`
(Juri, Master of the Revue; Elenda's `create-token` count), and it counts the
counters Juri died with even if Juri has been exiled from the graveyard — or
returned to the battlefield — in response. A token that has ceased to exist
is read the same way for the rest of the turn (`GameState.ceasedTokens`).
Which objects qualify:

- `"source"` and `"trigger-object"` — when the ability triggered or was
  activated while they were on the battlefield, or for a permanent's own
  leaves-the-battlefield ability (`GameObject.lastKnownRefs`).
- a target slot — when the target was on the battlefield as it was targeted
  (`targetZones`). A card targeted in a graveyard is read as it is now.
- `"sacrificed"` — the permanent sacrificed to pay the spell's or ability's
  cost (Dina, Soul Steeper's "{1}, Sacrifice another creature: Dina gets +X/+0
  until end of turn, where X is the sacrificed creature's power" is a
  `modify-pt` on `"source"` with `power: { powerOf: "sacrificed" }`), or by a
  `sacrifice-source` step before the one reading it ("Sacrifice ~. If you
  do, …"). Nothing sacrificed reads 0. A sacrifice *chosen* by an earlier
  step isn't this yet, optional ("you may sacrifice a creature. When you do,
  …") or not (Minsc & Boo's "Sacrifice a creature. When you do, …"): a
  `sacrifice` step only queues its decision, so a step after it runs before
  anything is sacrificed (`effect:may-sacrifice-then` in the gaps JSON).

The same references answer "**that creature's** controller" (`controllerOf`
— `toControllerOfTarget`, `create-token`'s `who: "target-controller"`, the
`"trigger-controller"` scope), a `trigger-object` / `target` condition's
filter, and the damage a departed source deals: its colours for
protection, its lifelink and deathtouch, and its controller for the life.

One gap: a permanent that left, came back and left *again* before an ability
referring to its first departure resolved keeps only the later snapshot, and
the earlier reference reads the card as it now is.

---

## 7. Targets (`targets`)

`targets: [...]` on a card is the spell's target slots, chosen when it's cast.
Abilities (`activated` / `triggered`) carry their own `targets`. `TargetSpec`
values (`target.ts`):

`"any-target"`, `"creature"`, `"nonblack-creature"`, `"creature-you-control"`,
`"creature-an-opponent-controls"`, `"player"`, `"opponent"` (a player other
than the chooser), `"creature-or-player"`, `"opponent-or-planeswalker"`,
`"permanent"`, `"nonland-permanent"`, `"nonland-permanent-an-opponent-controls"`,
`"land"`, `"artifact"`, `"artifact-an-opponent-controls"`, `"artifact-or-enchantment"`,
`"artifact-enchantment-or-nonbasic-land-an-opponent-controls"`,
`"creature-or-enchantment"`, `"enchantment"`,
`"creature-or-enchantment-an-opponent-controls"`, `"attacking-or-blocking-creature"`, `"creature-defending-player-controls"`,
`"spell"`,
`"creature-spell"`, `"noncreature-spell"`, `"instant-or-sorcery-spell"`,
`"instant-or-sorcery-in-your-graveyard"`, `"player-or-planeswalker"`,
`"creature-attacking-you"`.

`"creature-attacking-you"` is "attacking **you** or a planeswalker you control"
(Soul Snare) — narrower than `"attacking-or-blocking-creature"`, and the
difference only shows at a 3-4 player table, where someone else's attacker
isn't your problem.

`"player-or-planeswalker"` reaches **any** player, yourself included (Clan
Defiance); `"opponent-or-planeswalker"` is the narrower printed wording
(Theater of Horrors). They are not synonyms — don't reach for the opponent-only
one just because it's there.

A slot may be made **optional** by wrapping it:
`{ kind: "optional", of: TargetSpec }` — "up to one target creature" (Ajani,
Caller of the Pride), "up to two target creatures you don't control" (Hate
Mirage). "Up to N" is spelled as N optional slots rather than a variable
count, so `targets` always mirrors the spec list and each effect's `target:`
index stays a fixed position. A skipped slot travels as `null` in the
dispatched action and arrives at resolution as a hole, which every effect
already guards for (that's how an out-of-range index reads). Only *required*
slots gate castability (rule 601.2c), and the client offers a **Skip** button
for an optional one. An optional slot is never "forced": even with exactly one
legal option the player is asked, since leaving it empty is the other choice
(Displacer Kitten needn't blink itself).

"**Another** target …" wraps a slot the same way: `{ kind: "other", of:
TargetSpec, than? }` accepts what `of` does, less one thing. `than` is
`"source"` by default — the spell's or ability's own source (Ezuri, Claw of
Progress's "another target creature you control"; Manifold Key's "untap
another target artifact") — or `"trigger-object"` ("target creature other
than that creature" — the one whose event fired the trigger),
`"trigger-player"` (The Lord of Pain's "another target player" — other than
the player the event names), or `{ slot: n }` ("target creature you control
fights **another** target creature": different from what slot `n` took). The
first three narrow the slot's own options; `{ slot }` relates two slots, so
each still lists everything and the pair is checked together (the client and
the bots narrow a later slot by what they picked — `slotOptions`). It nests
either way round with `optional` ("up to one other target creature"). An
"other" slot is never filled in by the triggering event the way a saboteur's
"that player" is, and `{ slot }` isn't for a trigger whose slots the event
fills.

Two specs are **structured** rather than strings, for the shapes the literals
stopped covering:

- `{ kind: "permanent", whose?: "any" | "you" | "opponent", filter: CardFilter }`
  — a battlefield permanent matching an arbitrary filter. "Target creature
  with flying" / "without flying" (Clan Defiance), "target Dragon you
  control", "target creature with power 4 or greater". **Prefer a string
  literal when one fits** — it reads better and most of the pool uses them;
  reach for this when spelling the shape as a literal wouldn't be reused.
- `{ kind: "spell", filter: CardFilter }` — a spell on the stack matching a
  filter: Red Elemental Blast's "target **blue** spell" (`{ colors: ["U"] }`),
  Mental Misstep's "target spell **with mana value 1**". Read as the spell is
  on the stack — printed colours and types, and a mana value that counts its
  chosen {X} (rule 202.3e). The unfiltered shapes stay string literals
  (`"spell"`, `"creature-spell"`, …).
- `{ kind: "card-in-graveyard", whose?: "any" | "you" | "opponent" | "defending-player", filter?: CardFilter }`
  — a card in a graveyard (Withered Wretch, Cemetery Reaper, Return to
  Nature's third mode). Graveyard targeting varies on both *whose* graveyard
  and an arbitrary card filter, which wouldn't converge as literals. `whose` defaults to `"any"`, and
`filter` matches printed characteristics (layer effects don't reach a
graveyard). `describeTargetSpec(spec)` renders any spec as a UI label.

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
removeCounter?, payEnergy?, discardHand?, tapOthers? }`.

- `mana`: a cost string (`"{2}"`) or `null`. May contain `{X}`.
- `tap: true` adds `{T}`.
- `sacrifice: "self"` ("Sacrifice this: …"), `"creature-you-control"`, or
  `{ filter: CardFilter }` (Zuran Orb — "Sacrifice a land"). The last two make
  the player pick (a `sacrifice` choice on the `activate-ability` LegalAction).
  The effect reads what was sacrificed as `"sacrificed"` — "where X is the
  sacrificed creature's power" is `{ powerOf: "sacrificed" }` (§6,
  "Last-known information"). A spell's `additionalCost.sacrifice` works the
  same way.
- `payLife: 2`, `payEnergy: 3`, `removeCounter: { kind: "+1/+1", count: 1 }`,
  `discardHand: true`, `exileSelf: true` — all paid automatically (no
  decision). `exileSelf` is Hanged Executioner's "Exile this creature",
  distinct from `sacrifice: "self"`: the source never reaches a graveyard, so
  nothing watching for a death sees one. `discardHand` is
  Slate of Ancestry's "Discard your hand"; being a *cost* is what makes its
  "draw a card for each creature you control" a refill rather than a wash, and
  an empty hand is a legal payment, so it never gates activation.
- `tapOthers: { count, filter, includeSelf? }` — tap *other* permanents you
  control (Gravespawn Sovereign's "Tap five untapped Zombies you control"), as
  opposed to `tap`, which taps the source. `includeSelf` lets the source be
  one of them, which it can be when the ability has no `{T}` of its own. The
  player picks which (`tapCost` on the offer, `tap` on the action), a token
  stack paying token by token; one creature never pays both this and the
  mana half of the same cost.

**Mana abilities** (`isManaAbility`): a `{T}: Add …` ability with no targets,
no `resolve`, an `add-mana` effect, and no life/counter/energy/non-self
sacrifice cost. These resolve immediately without using the stack. Use the
`manaTapAbility(color)` / `addManaAbility({...})` helpers from
`cards/helpers.js`. **A *filtered* sacrifice cost (`{ filter }`, not `"self"`)
disqualifies an ability from `isManaAbility`** even if it's otherwise
mana-shaped (Orcish Lumberjack: "{T}, Sacrifice a Forest: Add …") — it needs a
real choice the auto-payment scan doesn't make, so it resolves on the stack
like an ordinary activated ability instead. needed-cards P20.

`add-mana`'s `mana` field: a fixed `ManaType` (`"W"`/`"U"`/`"B"`/`"R"`/`"G"`/
`"C"`), `"any-color"` (one of the five, the payer's choice — Arcane Signet), or
`{ oneOf: ManaType[] }` (`amount` mana in any combination of the listed
colours, each unit independently chosen — Orcish Lumberjack: `{ oneOf: ["R",
"G"] }`, `amount: 3`, needed-cards P20). A standalone activation (not part of
paying a cost) defaults to white for `"any-color"`, or `oneOf[0]` repeated for
`{ oneOf }` — during actual cost payment the auto-payer resolves the colour(s)
that fit.

**A mana ability's `amount` may be a live `EffectAmount`** (Marwyn, the
Nurturer: `{ powerOf: "source" }`; Kydele: `{ turnStat: "cards-drawn" }`).
`manaSources()` sizes it against the board as it stands, through an ordinary
resolution context, so it means exactly what it will when the ability
resolves; `"x"` and `triggerValue` read 0 there, and 0 or less makes the
permanent no source at all. `{ oneOf }` with a live amount is planned as one
compressed option — X units, each any of the listed types (`ManaOption.
anyColorOf`) — rather than X+1 enumerated splits, so a huge X costs nothing;
by hand, every split is offered while all of them together come to at most
`MAX_STANDALONE_UNITS` (512) units — for two colours, X up to 22 — and past
that one "all of this type" option per type. A mana ability **without `{T}`** is an auto-payer source only
with `oncePerTurn: true` (Vivi Ornitier's "{0}: Add … Activate only once each
turn"): the planner uses each source at most once per payment, which is only
true of an untapped ability that can't be activated again. Such a source
works while tapped or summoning sick, isn't tapped by a payment, survives
being tapped to convoke, and has its once-a-turn use recorded when a payment
draws on it. A `{0}` cost is written `mana: "{0}"`. **Still can't produce a genuine mix in one activation from a fixed
list of *different* amounts per colour**, and an ability whose activation
*cost* itself contains mana (a filter land's `{G/U}, {T}: …`) is excluded from
`manaSources()`'s auto-payment scan entirely, to avoid circular payment
planning — see §15.

- `sorcerySpeed: true` — the ability works only when you could cast a sorcery
  (Equip). An Equipment is `types: ["artifact"], subtypes: ["Equipment"]` with
  an `activated` ability `{ effect: { kind: "attach", target: 0 }, targets:
  ["creature-you-control"], sorcerySpeed: true }`.
- `loyaltyCost: 1` (or `-3`) — marks a **loyalty ability**: `cost.mana` /
  `cost.tap` are ignored, it's sorcery-speed, once per planeswalker per turn,
  and paid by adding/removing loyalty counters. Requires `loyalty` on the card.
- `otherOnly: true` — "Sacrifice **another** …": keeps the source out of its
  own sacrifice cost (Ayara, First of Locthwain; Dina, Soul Steeper). It says
  nothing about targets any more — "untap **another** target artifact"
  (Manifold Key) is an `other` slot (§7), which works for triggered
  abilities and spells too. Without it, a self-referential ability like an
  untap could target itself and become a repeatable no-net-cost loop —
  needed-cards P17 caught exactly this in the fuzzer.
- `boast: true` — **Boast** (rule 702.135 — Dragonkin Berserker): activatable
  only if this creature attacked this turn (`GameObject.attackedThisTurn`),
  and only once each turn. Implies `oncePerTurn`.
- `oncePerTurn: true` — "Activate only once each turn" (rule 602.5g — Steel
  Hellkite). Recorded per ability index on `GameObject.abilitiesUsedThisTurn`,
  so a permanent with two such abilities limits each separately, and reset in
  the controller's untap step.
- `condition: StaticCondition` — "Activate only if …" (rule 602.5, Fanatic of
  Rhonas's Ferocious: "{T}: Add {G}{G}{G}{G}. Activate only if you control a
  creature with power 4 or greater"). Mirrors `StaticAbility`/
  `TriggeredAbility`'s `condition`, checked live from the source's
  controller's perspective. A gated *mana* ability is also excluded from
  `manaSources()`'s auto-payment scan while the condition is false, not just
  from manual activation. needed-cards P19.
- `zone: "hand" | "graveyard" | "command"` — activatable only from that zone,
  never as a permanent's ability, and only by the card's **owner**. The
  ability still goes on the stack like any other (a zone ability is never a
  mana ability — those stay battlefield-only). `legalActions` scans those
  zones the same way it scans the battlefield (the shared command zone for
  the cards the player owns).
  - `"hand"` is **Channel** (rule 702.51a — Boseiju, Who Endures), and
    **discards** the source as an implicit, unconditional part of the cost.
  - `"graveyard"` is "Exile this card from your graveyard: …" (Runehorn
    Hellkite), and **exiles** it. Because it's a cost, the exile happens on
    activation and stands even if the ability is countered. Add
    **`staysInZone: true`** for a graveyard ability whose cost doesn't move
    the card (Reassembling Skeleton: "{1}{B}: Return this card from your
    graveyard to the battlefield tapped." — `put-onto-battlefield` on
    `"source"` with `enterTapped`).
  - `"command"` has no zone-change cost (Derevi, Empyrial Tactician:
    "{1}{G}{W}{U}: Put Derevi onto the battlefield from the command zone." —
    `put-onto-battlefield` on `"source"`). Putting a commander onto the
    battlefield this way isn't casting it: no commander tax, no cast
    triggers, but its enters triggers fire.

  When the source stays put (`"command"`, or `staysInZone`), the ability
  remembers *which object* it was activated from: if the card changes zones
  before the ability resolves — cast in response, or returned and killed
  again — it's a new object (rule 400.7) and `"source"` names nothing, so
  the effect does nothing (`GameObject.zoneChangeCount`). That check is made
  as the ability starts resolving; an effect that pauses for a decision and
  names `"source"` afterwards isn't re-checked.
- `costReduction: { reduceGeneric }` — a live-count discount printed on the
  ability itself (mirrors `CardDefinition.selfCostReduction`, but for an
  activated ability's own cost) — the Kamigawa Channel lands' "This ability
  costs {1} less to activate for each legendary creature you control."

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
| `dies` | `who`, `filter?`, `otherOnly?` | a permanent → graveyard from the battlefield, **however it got there** (rule 700.4) — destroyed, sacrificed, the legend rule, a Saga completing. A commander redirected to the command zone by 903.9a doesn't die. |
| `becomes-target` | `who`, `filter?`, `byOpponentOnly?`, `spellOnly?` | a permanent was chosen as a target of a spell or ability (rule 115.7 — Thunderbreak Regent); `spellOnly` narrows it to "becomes the target of a **spell**" (Gargos, Vicious Watcher; Tectonic Giant). Fires as the spell/ability goes on the stack, so it triggers even if that spell is countered or later fizzles, and once per targeted object — a spell naming the same creature in two slots triggers it once, one naming two of your creatures triggers a `you-control` watcher twice. The *player* who targeted it auto-fills the first target slot, the way `deals-combat-damage-to-player` fills it with the damaged player. |
| `becomes-tapped` | `who`, `filter?` | a permanent became tapped (rule 701.21a — City of Brass). Fires for every tapping: a mana ability, a cost that taps it, an opponent's tap effect. Not the same as `add-mana`'s `painToController`, which only charges the mana-ability path. |
| `leaves-battlefield` | `who` | a permanent leaves for **any** zone |
| `gains-life` / `loses-life` | `who`, `firstDuringTheirTurn?` (`loses-life` only) | a player's life changes (`who` = whose). `firstDuringTheirTurn` is "loses life **for the first time during each of their turns**" (Valgavoth, Harrower of Souls): only while that player is active, and only the loss that took their life lost this turn from zero — a loss earlier in the turn, even before this permanent arrived, uses it up. `{ triggerValue: true }` is how much ("loses that much life" — Sanguine Bond). Once per life-gain *event*, which is once per source (rule 119.9): lifelink damage one source deals to several things at once is **one** gain, so it triggers once; two lifelinkers dealing combat damage together are two (Oloro, Blech). |
| `attacks` | `who`, `filter?`, `otherOnly?`, `attackingYou?`, `defender?`, `aloneAgainstDefender?` | a creature is declared as an attacker, once per attacker (`filter` narrows which one — Utvara Hellkite / Atarka, World Render: "a Dragon you control"; `otherOnly` is Arahbo's "whenever **another** Cat you control attacks"). The attacker is the trigger object ("it gets +X/+X" — `target: "trigger-object"`) and the player it attacks, or the controller of the planeswalker it attacks, is the `"trigger-player"` ("defending player"). `attackingYou` fires only when the attack is aimed at this permanent's controller (Kazuul's "if you're the defending player") — which also covers "a creature an opponent controls", since nobody can attack themselves. `defender: "player"` is "attacks **a player**" / "attacks **an opponent**" (Kaalia of the Vast): a creature attacking a planeswalker attacks the planeswalker, not its controller (rule 508.3a), so it doesn't count. `aloneAgainstDefender` is "…, **if no other creatures are attacking that player**": an intervening-if, checked against the whole declaration and again on resolution. Every attacker is attacking before the first of these fires, so a trigger always sees the complete declaration. A creature put onto the battlefield attacking was never declared and fires none of this. |
| `attacks-player` | `who`, `defender` | "whenever a player attacks one of your opponents" (Breena, the Demagogue: `{ who: "any", defender: "opponent" }`), "whenever an opponent attacks you" (`{ who: "opponent", defender: "you" }`). Once **per player attacked**, however many creatures attack them; creatures attacking only a planeswalker attack nobody here. The attacked player is the `"trigger-player"` ("that opponent"), the attacking player is always the active player (`"active-player"` — "that attacking player draws a card"), and `{ triggerValue: true }` is how many creatures attack that player. |
| `attacks-alone` | `who` | Exalted (needed-cards P15) — a creature you control attacked alone this combat; the lone attacker isn't a target, read it via `ResolutionContext.triggerObject` / `EffectTargetRef: "trigger-object"` |
| `sacrifice` | `who`, `filter?`, `otherOnly?` | a player sacrifices a permanent (Korvold, Mayhem Devil — `who` = who sacrificed: its controller, not its owner, rule 701.21a, so a stolen permanent counts for the thief). `filter` is matched against the permanent as it last existed on the battlefield ("a **nontoken** permanent" is `{ token: false }`; a sacrificed token is still a token), `otherOnly` is "another", and the sacrificed permanent is the trigger object ("its power" — `{ powerOf: "trigger-object" }`, its power as it left). |
| `transforms` | `who`, `intoFront?`, `filter?` | a DFC turns over |
| `step-begins` | `step`, `who` | the start of a step (`"upkeep"` etc.) |
| `surveils` | `who` | "whenever you surveil" (Mirko, Obsessive Theorist): once per surveil, however many cards. A scry isn't one. |
| `wins-coin-flip` | `who` | "whenever a player wins a coin flip" (Okaun, Zndrsplt — `who: "any"`), "whenever you win a coin flip" (`"you"`): once per flip won. |
| `put-into-exile` | `who`, `filter?`, `from?: ZoneType[]` | **batched** — "whenever one or more cards are put into exile from graveyards and/or the battlefield" (Ketramose, the New Dawn: `from: ["graveyard", "battlefield"]`, with a `your-turn` condition for "during your turn"): once per simultaneous move (a whole graveyard exiled is one), `{ triggerValue: true }` being how many counted. `who` is whose cards, `filter` is asked of them in exile. Tokens aren't cards. |
| `put-into-graveyard` | `who`, `filter?`, `from?`, `notFrom?`, `batched?` | cards put into a graveyard, from anywhere — dying, milled, discarded, surveilled, a spell resolving or countered. `batched` is "whenever **one or more** land cards are put into your graveyard" (The Gitrog Monster; Sidisi, Brood Tyrant with `from: "library"`): once per simultaneous move — a wrath or state-based sweep, one mill, discard or surveil — `{ triggerValue: true }` being how many counted. Without it, once per card, that card the trigger object: Syr Konrad's "a creature card is put into a graveyard from anywhere other than the battlefield" (`notFrom: "battlefield"`, `who: "any"`), Disa the Restless's "…put it onto the battlefield" (`put-onto-battlefield` with `"trigger-object"`, which finds the card only in that graveyard). `who` is whose graveyard, `filter` is matched against the card as it is there, `from` / `notFrom` the zone it came from. Tokens aren't cards and never count. |
| `discards` | `who` | "whenever an opponent discards a card" (Sangromancer). Fires once per *discard event*, not once per card — see §15. |
| `leaves-graveyard` | `who`, `filter?`, `perCard?` | **batched** — "whenever one or more cards leave your graveyard" (Teval, the Balanced Scale; Insidious Roots: `filter: { type: "creature" }`). Fires **once per simultaneous move**, however many cards: a whole graveyard exiled, a "return all", the cards one choice takes, an escape cost's exile, a `simultaneous` sequence. A move of its own — a card cast or played from the graveyard, one card returned, a graveyard ability exiling its card as a cost — is its own trigger, so an escape cast is two (the card to the stack, then the cost). `who` is whose graveyard; `filter` is matched against each card as it was **in the graveyard** (rule 603.10a) — a multi-face card by its front face, even when it left as its back (rule 712.8a) — and a move with nothing matching doesn't fire. `{ triggerValue: true }` is how many cards counted. A permanent that was itself one of the cards (a reanimated Teval) doesn't see them leave. Tokens aren't cards and never count. `perCard: true` is the per-card form — "whenever a creature card leaves your graveyard" (Syr Konrad, the Grim): once per matching card, however many left together, each card the trigger object. |
| `deals-damage-batch` | `who`, `filter?`, `to?`, `combat?`, `once?` | **batched** — "whenever one or more creatures you control deal combat damage to a player" (Goro-Goro and Satoru, Alela, Anowon): **once per player** dealt damage by at least one matching source in one simultaneous damage event, however many dealt it, settled with that event like enrage. First-strike and regular damage are two events. `who` / `filter` are about the sources (Goro-Goro's "creatures you control that entered this turn" is `{ who: "you-control", filter: { enteredThisTurn: true } }`), `to: "opponent"` narrows the players, `combat: true` is "combat damage" (leave it off for any damage). The player is the `"trigger-player"` ("that player") and `{ triggerValue: true }` the total those sources dealt them. `once: "per-event"` fires once for the whole event instead, `{ triggerValue: true }` then being how many players were dealt damage and there being no trigger player — Malcolm, Keen-Eyed Navigator's "you create a Treasure token for each opponent dealt damage". The per-creature form is `deals-combat-damage-to-player`. |
| `blocks` | `who`, `filter?`, `otherOnly?` | the mirror of `attacks` (Kangee, Sky Warden), once per blocker, which is the trigger object — Doran, Besieged by Time's "whenever a creature you control attacks or blocks, **it** gets +X/+X" is an `attacks` and a `blocks` trigger reading `"trigger-object"`. |
| `becomes-blocked` | `who`, `filter?`, `otherOnly?` | an attacking creature became blocked (rules 509.1h, 509.3c — Anzrag, the Quake-Mole). **Once per attacker**, however many creatures block it, as its defending player's blocks are declared; an unblocked attacker never fires it. The attacker is the trigger object and its defending player (who blocked it) the `"trigger-player"`. |
| `dealt-damage` | `who`, `filter?`, `combat?` | the receiving end — "whenever this creature **is dealt damage**" (Brash Taunter, Hornet Nest, enrage). Combat and non-combat alike unless `combat` says which; `filter` narrows the permanent dealt damage (Sonic the Hedgehog: "a creature you control **with flash or haste**" — read as the damage is dealt, before SBAs). `{ triggerValue: true }` is how much; the permanent is the trigger object and the `"trigger-player"` is its controller. Damage dealt all at once is one event however many sources dealt it — a creature blocked by two is dealt its combat damage once — so it triggers once, for the total; a token stack dealt damage is that many permanents, so a watcher of *other* permanents fires once per token. |
| `deals-damage` | `who`, `filter?`, `otherOnly?`, `to?`, `toFilter?`, `combat?`, `exactly?`, `toItsTarget?` | the dealing end, for any recipient — Niv-Mizzet, Visionary's "whenever a source you control deals noncombat damage to an opponent" (`{ who: "you-control", to: "opponent", combat: false }`), Ghyrson Starn's "another source you control deals **exactly 1** damage to a permanent or player" (`otherOnly`, `exactly: 1`), Kediss's "a commander you control deals combat damage to an opponent" (`filter: { isCommander: true }`). `who` / `filter` are about the **source** — a spell, a permanent, an ability's source — judged as it last existed on the battlefield if it had left; `to` is `"player" \| "opponent" \| "permanent" \| "creature" \| "planeswalker"` and `toFilter` narrows a permanent recipient; `toItsTarget` is "a spell deals damage to a permanent or player **it targets**". Once **per recipient** per damage event (a `damage-all` for 1 fires it once per creature, and a token stack counts once per token — each firing that hits "that permanent" peels one token off it), for the amount actually **dealt** — after doubling and prevention, so fully prevented damage fires nothing and 2 prevented to 1 is "exactly 1". `{ triggerValue: true }` is the amount, the source is the trigger object (`damage.from: "trigger-object"`), the recipient is `damage.toTriggerRecipient`, and a player recipient (or a permanent's controller) is the `"trigger-player"`. |
| `attack-with` | `who`, `atLeast`, `filter?`, `attackingYou?` | "whenever you attack with three or more creatures" (Overwhelming Instinct, Tide Skimmer). Fires once per declaration, off the whole attacker list — an `attacks` trigger fires per attacker and can't count them. |
| `deals-combat-damage-to-player` | `who`, `filter?`, `otherOnly?` | `filter` narrows on the *damaging creature* — Sharding Sphinx's "whenever an **artifact** creature you control deals combat damage to a player"; `otherOnly` is "**another** creature you control". The first target slot is auto-filled with the damaged player, but only if that slot can hold one. The creature is the trigger object — Ikra Shidiqi's "you gain life equal to **that creature's** toughness" is `{ toughnessOf: "trigger-object" }`, read as it last existed on the battlefield if the same combat damage killed it — the damaged player is the `"trigger-player"`, and `{ triggerValue: true }` is the damage dealt. |
| `cast-spell` | `who`, `noncreatureOnly?`, `firstEachTurn?`, `nthEachTurn?`, `filter?`, `from?`, `notFrom?` | a spell is cast. `who: "opponent"` is anyone but this permanent's controller (Kaervek the Merciless); `filter` narrows on the *spell* — `{ typesAnyOf: ["instant", "sorcery"] }` for Guttersnipe. `noncreatureOnly` predates `filter` and stays, because prowess is printed as its own word. `trigger-object` is the spell, so `{ manaValueOf: "trigger-object" }` reads its mana value. `firstEachTurn` / `nthEachTurn: N` is the caster's first / Nth spell this turn — and **with a `filter`, their first / Nth *matching* spell** (Tuvasa's "your first enchantment spell each turn", which can be your third spell). `from` / `notFrom` are the **zone it was cast from** (the `spell-cast` event records it before the spell moves to the stack): `from: "exile"` is "whenever you cast a spell from exile", `notFrom: "hand"` is "from anywhere other than your hand". A spell cast via foretell, suspend, cascade, an adventure or an impulse exile comes from `"exile"`; flashback / escape from `"graveyard"`; a commander from `"command"`. |
| `cast-spell` + `orCopy: true` | | Magecraft — "whenever you cast **or copy** an instant or sorcery spell" (Archmage Emeritus). A copy isn't cast (rule 707.10), so plain `cast-spell` never sees one; with `orCopy` a `spell-copied` event matches too, `who` being the copy's controller, `filter` asking about the copy, the copy the trigger object. The cast-only narrowings (`from`, `firstEachTurn`, …) never match a copy. `copyOnly: true` matches **only** the copies — Kalamax, the Stormsire's "whenever you copy an instant spell". |
| `counters-put` | `who`, `counter?`, `filter?`, `byYou?` | one or more counters were put on a permanent — including the ones it **entered with** (rule 122.6). Once per permanent per event, so two creatures at once is two triggers; `{ triggerValue: true }` is how many, and the permanent is the trigger object. `who` / `filter` are about the permanent; `byYou` is "whenever **you** put …" (Hapatra). Shalai and Hallar: `{ who: "you-control", counter: "+1/+1", filter: { type: "creature" } }`. |
| `draws` | `who`, `nthEachTurn?`, `exceptFirstInDrawStep?` | a player draws a card, once per card (Nekusar). `nthEachTurn: 2` is "your second card each turn"; `exceptFirstInDrawStep` is Xyris's "except the first one they draw in each of their draw steps" (only their own draw step's first card is exempt). |
| `plays-card` | `who`, `from?` | a player **plays a card** — plays a land *or* casts a spell, since "play" covers both (Prosper, Tome-Bound's "whenever you play a card **from exile**" is `{ on: "plays-card", who: "you", from: "exile" }`, which a land played off an impulse exile fires as well as a foretold card cast from there). `from` is the zone recorded on the `land-played` / `spell-cast` event. For lands alone, `plays-land`. |
| `this-cast` | — | the spell carrying this ability is cast (cascade, storm) |
| `predicate` | `match: (event) => boolean` | escape hatch — match the raw `GameEvent` |

**`who: TriggerWho`** = `"self"` (this permanent) / `"you-control"` / `"you"`
(this permanent's controller did it) / `"opponent"` / `"any"`. `"opponent"`
is only meaningful where the subject is a *player* — a `step-begins`
trigger's "each opponent's end step" (Archfiend of Depravity), which fires
once per opponent's **turn**, not once per opponent.

`otherOnly: true` — "another …", i.e. the source permanent doesn't count.

`filter` is a `CardFilter` narrowing which permanent counts (Soul Warden:
`{ type: "creature" }`; landfall: `{ type: "land" }`).

**Leaving together.** `dies`, `leaves-battlefield` and `sacrifice` are
leaves-the-battlefield abilities, which look back in time (rule 603.10a):
permanents that leave in one event — a wrath, one sweep of state-based
actions, an edict once every player has chosen, an overloaded bounce — each
see every other one leave, their own source included. Zulaport Cutthroat and
two Bears under one Wrath of God drain three times, and nothing about the card
has to say so. A permanent that left is matched as it last existed on the
battlefield (its `GameObject.lastKnown` snapshot, rule 603.10a): `who:
"you-control"`, the whole `filter` (types and subtypes an effect gave it — an
animated land dying is a creature dying — counters, keywords, power, token,
controller) and whose ability it is. A stolen creature dying is the thief's.
Its own abilities are the ones it had then: none if it had lost them (Turn to
Frog), a copied card's rather than the Clone's, and a dies trigger an Aura, a
lord or a one-shot `grant-triggered` gave it, even though that grant ended
with the move. The victims of one event are all snapshotted before the first
of them moves, so a creature and the lord it dies beside keep each other's
bonuses.

If the ability has `targets`, the controller chooses them via a dispatched
`choose-targets` decision when the trigger goes on the stack. A slot the event
determines (`deals-combat-damage-to-player`) is auto-filled.

**`oncePerTurn: true`** is "This ability triggers only once each turn"
(Morbid Opportunist, Welcoming Vampire): after it has triggered once this
turn, further events don't trigger it — which also makes "whenever **one or
more** …" exact on a per-object trigger, since the first of a batch triggers
it and the rest can't. Per ability of one object: a permanent that leaves
and returns may trigger again.

**`condition?`** (`StaticCondition`, the same union section 10 documents) is an
**intervening-if** clause — rule 603.4, "When ~ enters, **if** you control a
creature with power 4 or greater, draw a card":

```ts
{
  trigger: { on: "enters-battlefield", who: "self" },
  condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 },
  ...
}
```

It's checked **twice** — as the event happens (false ⇒ it never triggers at
all) and again as the ability resolves (false by then ⇒ it leaves the stack and
does nothing, logged as a fizzle). Unlike a static's condition it counts the
source permanent itself. Put the "if" clause here, never inside the effect: a
`conditional` effect would still trigger and still resolve, which is a
different (and wrong) thing.

---

**Ward** (rule 702.21) — `ward(cost)` from `helpers.ts` builds the whole
triggered ability: a `becomes-target` trigger (`who: "self"`,
`byOpponentOnly`) whose effect is `{ kind: "ward", cost }`. Put it in
`triggered` (and the printed line in `text`); each instance is its own
ability, so two `ward(...)`s trigger twice (702.21b), and a static grants it
to others with `grantsTriggered: [ward(...)]`. `cost` is a `WardCost` —
**one** compound cost, every part paid together:
`{ mana: "{2}" }` (Ward {2}), `{ payLife: 2 }` (Ward—Pay 2 life.),
`{ mana: "{2}", payLife: 2 }` (Ward—{2}, Pay 2 life.),
`{ sacrifice: { filter, count?, text: "Sacrifice a Food" } }`,
`{ discard: 1 }`. `blight` is reserved and the helper refuses it (the blight
keyword isn't built). When the trigger resolves, the player whose spell or
ability targeted the permanent (`GameObject.targetedBy`) is asked a
`choose-modes` "pay or not" — offered only if they can pay all of it; a
sacrifice or discard part then asks which. Declining or being unable to pay
counters that spell or ability (a spell that can't be countered still
resolves). Triggered abilities announce their targets too, so ward sees
them.

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
- `"creatures-you-control"` — `+ excludeSelf?`, `+ subtype?` (a lord clause),
  `+ withCounter?: { kind? }` (Rishkar: "each creature you control **with a
  counter on it**"), `+ tokenOnly?` (Eternal Skylord: "Zombie **tokens** you
  control").
- `"lands-you-control"` — Chromatic Lantern.
- `"all-creatures"` — **every** creature on the battlefield, whoever controls
  it (Gravitational Shift). Takes `excludeSelf`, `subtype`, `withKeyword` and
  `withoutKeyword`.
- `"filter"` — `{ scope: "filter", filter: CardFilter, excludeSelf? }`: every
  battlefield permanent matching the filter, from the source's controller's
  perspective. The general form of the fixed scopes, for anything they can't
  say: "artifacts you control" (`{ type: "artifact", controlledBy: "you" }`),
  "other outlaws you control" (`subtypes: [...]`), "commander creatures you
  own" (`{ type: "creature", isCommander: true, ownedBy: "you" }`), "each
  creature you control but don't own" (`controlledBy: "you", ownedBy:
  "opponent"`), "non-Equipment artifact and non-Aura enchantment" (`anyOf`),
  "creatures you don't control", counters on any permanent. Type and subtype
  clauses read current (layer-4) types; a `keyword` clause waits for layer 6
  like `withKeyword`. A `power` / `toughness` clause can't be answered from
  inside the layer fold that computes it and **fails closed** — don't author
  a scope that needs one. Prefer this over adding another flag to the fixed
  scopes.

`withKeyword` (either creature scope) and `withoutKeyword` read the target's
**current** keywords (rule 613.8a — the anthem depends on whatever grants or
removes the keyword): a creature flying because of an Aura, Equipment, an
anthem or a `grant-keyword` spell counts, and one that lost its abilities
(Turn to Frog) doesn't. `collectStaticEffects` gets there without recursing:
it applies every other static first, then matches the keyword-scoped ones
against the keywords that produced (Alela, Artful Provocateur; Empyrean
Eagle; Gravitational Shift).
- `"attached"` — the permanent this Aura/Equipment is attached to (how Auras
  grant their effect).

The creature scopes ask whether a permanent is a creature *now* (its layer-4
types), so an animated land or an artifact that became a creature gets the
anthem, the keyword grant and the granted trigger like any other creature.
`lands-you-control` reads current types the same way.

**Continuous-effect fields:**

- `grantPt: [p, t]` — layer 7d P/T bonus.
- `grantPtPerCount: { filter?, commanderCasts?, playerCounters?, countersOnAffected?, exiled?, colorsAmong?, pt, excludeSelf? }` — a layer 7d bonus that
  *scales* with a live count (Skycat Sovereign's "+1/+1 for each **other**
  creature you control with flying"). Distinct from `setBasePtFromCount`,
  which is a CDA in layer 7b that *replaces* the printed P/T; this adds on
  top, so counters and other anthems stack with it normally. `commanderCasts:
  true` counts the times its controller has cast a commander from the command
  zone this game instead of a battlefield filter (Commander's Insignia), summed
  across a Partner pair; `playerCounters: "experience"` counts the counters of
  that kind its controller has ("gets +1/+1 for each experience counter you
  have" — Kalemne, Disciple of Iroas); `countersOnAffected: "slime"` counts
  the counters on **each affected permanent itself** (Toxrill, the
  Corrosive's "creatures your opponents control get -1/-1 for each slime
  counter on them"); `exiled: CardFilter` counts cards in exile (Umbris, Fear
  Manifest's "each card your opponents own in exile" is `{ ownedBy:
  "opponent" }`); `colorsAmong: CardFilter` counts the colours among matching
  battlefield permanents, each once (Sisay, Weatherlight Captain, with
  `excludeSelf` for "other").
- `maxHandSize: { who, set?, minus?, adjust? }` — a maximum hand size, read
  at cleanup (`noMaxHandSize` wins over it): "your maximum hand size is
  eleven" is `{ who: "you", set: 11 }`; Winter, Misanthropic Guide's "each
  opponent's maximum hand size is equal to seven minus the number of those
  card types" is `{ who: "opponents", set: 7, minus: { cardTypesInGraveyard:
  { ownedBy: "you" } } }` (a `CountSpec`) behind its delirium `condition`;
  `adjust` adds to it. Never below 0.
- `noMaxHandSize: true` — "You have no maximum hand size" (Thought Vessel).
  A fact about the *controller* rather than about anything the ability
  affects, so it's read straight off the battlefield at cleanup instead of
  going through the layer system; pair it with `affects: { scope: "self" }`.
- `doesntUntap: true` — "This artifact doesn't untap during your untap step"
  (Mana Vault, Basalt Monolith). Only its controller's own untap step.
- `untapsDuringOthersUntap: "self" | CardFilter` — untap during each **other**
  player's untap step too: `"self"` is Bender's Waterskin, a filter is every
  permanent you control matching it (Seedborn Muse `{}`, Unwinding Clock
  `{ type: "artifact" }`).
- `castFromGraveyard: { filter, oncePerTurn?, yourTurnOnly?, perType?,
  exileAfterwards?, payLife? }` — a permission to cast spells from your
  graveyard for their normal cost (Gisa and Geralf: "Once during each of your
  turns, you may cast a Zombie creature spell from your graveyard" — both
  gates). Offered as `via: "graveyard-permission"`, **one variant per
  permission that applies**, each carrying a `graveyardGrant: { source,
  asType? }` the driver echoes back — so with two grantors (Gisa and Karador
  on a Zombie) which one is spent is the player's choice. Unlike flashback
  the permission belongs to the *grantor*, so it ends when that permanent
  leaves, and by default nothing exiles the spell afterwards: a countered one
  goes back to the graveyard.
  - `perType: CardType[]` — Muldrotha's once-per-turn allowance **per
    permanent type** instead of a single use. A multi-typed card is offered
    once per type it could spend (`graveyardGrant.asType`); listing `"land"`
    also lets the permission *play* a land (as a `play-land` variant, still
    taking the land drop). Spent allowances ride on the grantor
    (`graveyardCastTypesUsedThisTurn`), so a new Muldrotha has a fresh set.
  - `exileAfterwards: true` — Kess, Dissident Mage's "if a spell cast this
    way would be put into your graveyard, exile it instead".
  - `payLife: N` — an extra cost on top of the spell's own ("by paying 3 life
    in addition to paying their other costs"); it also gates the offer.
- `cantAttackController: true` — the affected creatures "can't attack you or
  planeswalkers you control", where "you" is *this permanent's* controller:
  the enchanted creature with `affects: { scope: "attached" }` (Vow of Duty),
  or everything any scope reaches — Eriette of the Charmed Apple's "each
  creature that's enchanted by an Aura you control" is a `filter` scope with
  `{ type: "creature", enchantedBy: "you" }`. Checked in `whyCannotAttack`
  rather than as a `CombatRestriction`, because those are bare strings and
  can't say whose "you" is meant.
- `cantBeBlockedBy: CardFilter` / `canBlockOnly: CardFilter` — the affected
  creatures "can't be blocked by [filter]" (Delney, Streetwise Lookout's
  "creatures you control with power 2 or less can't be blocked by creatures
  with power 3 or greater": a `filter` scope with `power: { op: "lte", n: 2
  }` and `cantBeBlockedBy: { power: { op: "gte", n: 3 } }`) / "can block only
  [filter]" ("can block only creatures with flying" — `{ keyword: "flying" }`;
  the creature still needs flying or reach to block a flyer at all). The
  other creature is matched from this permanent's controller's side. Read
  when a block is checked rather than folded into characteristics, so the
  scope may ask about power and toughness.
- `attackOnlyNearestOpponent: true` — with `chooseOnEnter: ["left",
  "right"]`, Pramikon, Sky Rampart's "each player may attack only the nearest
  opponent in the last chosen direction and planeswalkers controlled by that
  player": a rule for every player (whatever `affects` says), left being
  onward in turn order and right back, skipping players who have lost; the
  latest such permanent's choice is in force.
- `prohibits: { who, spells?, abilitiesOf? }` — a "can't" about casting and
  activating (rule 101.2 — it beats any "can"): `who` (`"opponents"`,
  `"you"`, `"each-player"`, from this permanent's controller's side) can't
  cast `spells` (`true` for all, or a filter — Codie, Vociferous Codex's "you
  can't cast permanent spells" is `{ typesAnyOf: [the permanent types] }`)
  and can't activate abilities of permanents matching `abilitiesOf` — Myrel,
  Shield of Argive's "artifacts, creatures, enchantments, or planeswalkers".
  That includes mana abilities, which the auto-payer then leaves alone too.
  Time it with `condition`: Myrel's "during your turn" is `{ kind:
  "your-turn" }`, Marisi, Breaker of the Coil's "your opponents can't cast
  spells during combat" `{ kind: "turn-structure", duringCombat: true }`. An
  instruction to cast (cascade, suspend) doesn't get past it either.
- `castAsThoughFlash: true | CardFilter` — "you may cast spells as though
  they had flash" (Heliod, the Warped Eclipse), for this permanent's
  controller; a filter narrows it to matching spells.
- `addTypes: CardType[]` / `addSubtypes: string[]` — layer 4: the affected
  permanents have these "in addition to their other types" (Kudo: "are Bears";
  Ragost: "Artifacts you control are Foods"; Bello: "is a … creature"). Every
  type read sees them — filters, targeting, sacrifice costs, other statics'
  scopes — and they apply in timestamp order with the permanent's own
  type-changing modifiers (an `animate`, Turn to Frog), except that a grant
  whose scope depends on another effect's added types applies after it (rule
  613.8: Kudo's "other creatures" reaches a land animated after Kudo arrived). A static with a
  layer-4 part fixes its reach there (rule 613.6): its keywords, granted
  abilities and P/T go to exactly the permanents it gave the type to.
- `setBasePt: { power?, toughness? }` — layer 7b: the affected permanents
  *have base* power and/or toughness N ("have base power and toughness 10/10";
  a lone `toughness` is "have base toughness 1"). In timestamp order with
  `animate`'s set P/T, under counters (7c) and bonuses (7d). Distinct from the
  `"self"`-only `setBasePtFromCount` CDA, which applies first.
- `grantKeywords: [...]` — layer 6 keyword grant.
- `grantsActivated: [...]` — give the affected permanents these activated
  abilities (Chromatic Lantern, Cryptolith Rite).
- `grantsTriggered: [...]` — the same in layer 6 for *triggered* abilities
  (Tyrant's Familiar's Lieutenant clause). Appended after the permanent's
  printed `triggered`, so a printed ability's index — which the pending
  trigger and the stack object both carry — never shifts. The one-shot
  "gains '[trigger]' until end of turn" equivalent is the `grant-triggered`
  *effect* (§6).
- `setBasePtFromCount: { countOf, plusPower, plusToughness, only? }` — a layer-7b CDA
  (`"self"` only). `only: "power"` defines just the power, the toughness
  staying as printed (Eluge, the Shoreless Sea's "*/5"); `"toughness"` the
  reverse. `countOf` is a `CountSpec`:
  - `{ countOf: CardFilter }` — battlefield permanents matching the filter, a
    token stack counting as every token in it. "The number of lands you
    control" (Beanstalk Giant, Lumra, Bellow of the Woods) is `{ countOf: {
    type: "land", controlledBy: "you" } }`; the CDA's own object counts when
    it matches ("creatures you control" includes itself).
  - `{ countInGraveyard: CardFilter }` — cards in **all** graveyards matching
    the filter (Mortivore: `{ type: "creature" }`); add `ownedBy: "you"` for
    "in your graveyard".
  - `"cards-in-all-graveyards"` (Lord of Extinction), `"cards-in-your-hand"`
    (Psychosis Crawler).
  - `{ playerCounters: "experience" }` — the counters of that kind its
    controller has (Daxos the Returned's Spirit: "power and toughness are each
    equal to the number of experience counters you have").
  - `{ cardTypesInGraveyard: CardFilter }` — card types among cards in
    graveyards, each once (Tarmogoyf: `{ cardTypesInGraveyard: {} }` with
    `plusToughness: 1`).

  It applies in every zone (rule 604.3), so the card has that size in a
  library, hand, graveyard or the command zone too; "you" is its controller,
  i.e. its owner off the battlefield. A filter may read computed
  characteristics (a `keyword`, `power`); if that asks about the CDA's own
  object, the nested read uses its printed P/T rather than recursing.
- `restrictions: [...]` — `"cant-attack" \| "cant-block" \| "must-attack" \|
  "must-be-blocked" \| "must-be-blocked-if-able" \| "cant-attack-owner"`
  (Pacifism, Juggernaut, Lure). `"must-be-blocked"` is Lure's "all creatures
  able to block it do so"; on an attacker with menace it forces blocks only in
  pairs, as many as can be made (rule 509.1c — `combat/blocking.ts`'s
  `lurePlan`). `"must-be-blocked-if-able"` asks only for **one** blocker (two
  with menace) whenever the defender has one to spare — also a rule 509.1c
  requirement, weighed as the declaration is checked (`ifAblePlan`; the
  creatures Lure needs stay with Lure). `"cant-attack-owner"` keeps a stolen
  creature off its owner and their planeswalkers. The same list, until end of
  turn, is what the `restrict` effect imposes (§6).
- `combatDamageByToughness: "always" | "if-toughness-greater"` — the affected
  creatures assign combat damage equal to their **toughness** rather than
  their power (Doran, the Siege Tower with `affects: { scope: "all-creatures"
  }`; Felothar the Steadfast and High Alert over `creatures-you-control`;
  Arcades, the Strategist narrowed by `withKeyword: "defender"`).
  `"if-toughness-greater"` is the "with toughness greater than its power"
  form (Ancient Lumberknot), judged on the creature's computed P/T when its
  damage is sized; an `"always"` from any source wins over it. It changes no
  creature's power — every card's ruling says so — and the engine resizes
  combat damage alone: unblocked, blocking, split across blockers, trampling
  over, and the `assign-combat-damage` offer (`combatDamageOf` in
  `characteristics.ts`). A fight, "damage equal to its power" and a power
  condition all still read the real power.
- `canAttackAsThoughNoDefender: true` — the affected creatures "can attack as
  though they didn't have defender" (Arcades, Felothar, High Alert). Lifts
  defender's "can't attack" and nothing else: summoning sickness and
  `"cant-attack"` still apply, and the creature still *has* defender. Only
  asked when attackers are declared, so a defender already attacking stays
  attacking if the permission goes away mid-combat (Arcades' ruling). The
  one-shot "can attack this turn as though it didn't have defender" (Assault
  Formation's `{G}`, Wakestone Gargoyle) has no effect form yet.
- `protection: { colors?, types? }` — rule 702.16 (White Knight: `{ colors:
  ["B"] }`).
- Ward is **not** a static — it's a triggered ability; see `ward(...)` in §9.
- `costModification: { applies: CardFilter, reduceGeneric?, increaseGeneric? }`
  — Foundry Inspector, Thalia. `affects` is ignored — `applies` says what it
  hits. Optional refinements:
  - `caster: "you" | "opponent"` — "spells you cast" / "spells your
    opponents cast", judged against whoever is actually casting it (not the
    card's controller, so a card cast out of someone else's graveyard is the
    caster's spell). Prefer this over `applies.controlledBy` for new cards.
  - `perTarget: true` — the amounts are "for each target" (Hinata,
    Dawn-Crowned): multiplied by the number of *distinct* players and objects
    the spell is cast targeting (the card's ruling — one creature named by two
    "target creature"s counts once). The cost is worked out from the targets
    actually chosen; `legalActions` offers such a spell with a `targetCount`
    range it's affordable at.
  - `firstEachTurn: true` — "the first creature spell you cast each turn
    costs {1} less": skipped once the caster has cast any spell matching
    `applies` this turn.
  - `reduceColored: "{W}{B}"` (+ `coloredOnly?`) — takes coloured pips off
    (Edgewalker's "Cleric spells you cast cost {W}{B} less"): each symbol
    takes a pip of its colour, else a hybrid pip containing it (rule 118.7e),
    else one generic (118.7b/c) — unless `coloredOnly: true`, the printed
    "this effect reduces only the amount of colored mana you pay".

  A generic reduction bigger than the generic part carries on to the `{2}`
  half of twobrid pips (`{2/W}`), but only the ones actually paid with
  generic mana — the Spectral Procession ruling. Reaper King under Foundry
  Inspector is `{W}{U}{B}{R}` plus one mana without a Forest.
- `abilityCostModification: { applies: CardFilter, reduceGeneric?, increaseGeneric? }`
  — the same for *activation* costs (rule 602.2b): "Activated abilities of
  Foods you control cost {1} less to activate" (Sam, Loyal Attendant) is
  `{ applies: { subtype: "Food", controlledBy: "you" }, reduceGeneric: 1 }`,
  matched against the ability's source from this static's controller's view.
  Generic only, never below `{0}`, and an increase puts a cost on an ability
  with no mana in it (Suppression Field's shape, `applies: {}`). Mana
  abilities are left alone, which is what "unless they're mana abilities"
  says and what the payment planner needs; a card that changes a *mana*
  ability's cost can't be authored. `legalActions`, activation and the
  `{X}` ceiling all read the modified cost.
- `playFromGraveyard: CardFilter` — while this permanent is on the battlefield
  its controller may *play* matching cards from their graveyard (Ramunap
  Excavator: `{ type: "land" }`). `affects` is ignored. Still costs the land
  drop / sorcery timing; `legalActions` enumerates the play.
- `playFromLibraryTop: CardFilter` — while this permanent is on the
  battlefield its controller may *play* the top card of their library if it
  matches (Oracle of Mul Daya: `{ type: "land" }`). `affects` is ignored.
  Still costs the land drop / sorcery timing; `legalActions` enumerates the
  play. Distinct from `revealsOwnLibraryTop` (the "play with the top card
  revealed" half, which only affects `viewFor`).
- `extraLandsPerTurn: number` — additional land drops per turn for this
  permanent's controller (Oracle of Mul Daya, Azusa, Lost but Seeking — needed-cards
  P16). `affects` is ignored.
- `doubleEntryTriggers: { filter? }` — Panharmonicon-style doubling (needed-cards
  P15 — Starfield Vocalist): if a permanent entering causes a triggered ability
  of this permanent's controller to trigger, it triggers an additional time.
  `filter`, when present, narrows which *entering* permanent counts. `affects`
  is ignored — this only ever doubles its own controller's triggers.
- `doubleTriggers: { cause, filter? }` — "if [something] causes a triggered
  ability of a permanent you control to trigger, that ability triggers an
  additional time", for **any** trigger that event causes. `cause` is
  `"enters"` (Elesh Norn, Mother of Machines), `"attacks"` (Isshin — a
  per-attacker or a whole-declaration trigger; leave `filter` off for it),
  `"combat-damage-to-player"` (Felix Five-Boots), `"cast-or-copy"` (Veyran,
  Voice of Duality: `filter: { typesAnyOf: ["instant", "sorcery"],
  controlledBy: "you" }` is "you casting or copying an instant or sorcery
  spell"), `"dealt-damage"` ("a creature you control being dealt damage" —
  either end of that damage's triggers) or `"dies"` (Teysa Karlov: "a
  creature dying" — dies and leaves-the-battlefield triggers, `filter`
  matched as it last existed). `filter` narrows the permanent, spell or copy
  the event is about.
- `doubleTriggersOf: { filter?, selfAndEquipment? }` — the same, keyed on
  **whose** ability it is: "if a triggered ability of an Ally you control
  triggers" (Katara, the Fearless: `filter: { subtype: "Ally", controlledBy:
  "you" }`), "…of a creature you control with power 2 or less" (Delney).
  `selfAndEquipment` is "…of ~ or an Equipment attached to it" (Cloud, Midgar
  Mercenary, with `condition: { kind: "source", filter: { equipped: true } }`
  for "as long as ~ is equipped"). Only permanents' abilities — a spell's
  "when you cast this" and a command-zone card's aren't — and a
  leaves-the-battlefield ability's source is matched as it last existed. All
  the doublers add up: an Ally's attack trigger under Katara and Isshin fires
  three times.

**`condition?`** (`StaticCondition`) gates the *whole* static — when false it
contributes nothing. The same union is a triggered ability's intervening-if
clause (section 9):

- `{ kind: "controls", filter: CardFilter, atLeast: number, excludeSelf?,
  excludeTarget? }` — Kird Ape. A **static**'s condition never counts its own
  permanent (the scan would recurse into the characteristics being computed),
  but a triggered ability's intervening-if and a `conditional` effect's
  condition do (resolution is outside the layer fold): `excludeSelf` is "if
  you control **another** Wizard" there. `excludeTarget: i` leaves out target
  slot `i` ("a creature other than that creature") and only means anything
  inside a `conditional` effect, where there are targets. The opposite switch,
  `countsSelf: true`, puts a static's own permanent back into the count when the
  printed count includes it — Jetmir, Nexus of Revels: "as long as you control
  three or more creatures", Jetmir being one — and keep that `filter` to
  type/subtype/colour clauses, which are answered without a characteristics
  fold.
- `{ kind: "aggregate", value: AggregateSpec, compare: NumCompare }` — a sum
  or maximum compared against a number (Finneas, Ace Archer: "if creatures
  you control have **total power 10 or greater**" is `{ value: { aggregate:
  "sum", of: "power", filter: { type: "creature", controlledBy: "you" } },
  compare: { op: "gte", n: 10 } }`). A token stack counts once per token.
  Same self rule as `controls`: a static leaves its own permanent out of the
  total; a trigger or `conditional` counts it unless `value.excludeSelf`.
- `{ kind: "source-greatest", of, filter, strict? }` — the source's own
  power / toughness / mana value is the greatest among permanents matching
  `filter` (from its controller's view — `{ type: "creature" }` is every
  creature). `strict: true` is "greater than **each other** creature's
  power", where a tie fails; without it, "has the greatest power among …",
  where a tie still has the greatest. Vacuously true with nothing else
  matching; another member of the source's own token stack is another
  creature with the same value. On a static, the source's own value is read
  with that static switched off, so a static whose own P/T bonus changes the
  answer isn't modeled.
- `{ kind: "opponent-controls", filter: CardFilter, atLeast: number }` — *one*
  opponent must meet the count on their own (Defense of the Heart: "if an
  opponent controls three or more creatures").
- `{ kind: "opponent-controls-more", filter: CardFilter }` — *one* opponent
  controls more matching permanents than you (Land Tax, Knight of the White
  Orchid: "if an opponent controls more lands than you"). Your side counts
  every matching permanent you control, the source included.
- `{ kind: "opponents-control-total", filter: CardFilter, atLeast: number }` —
  a combined count summed across *every* opponent (Turbulent Fen: "unless your
  opponents control eight or more lands" — plural "opponents" sums, unlike
  `opponent-controls`'s singular "an opponent").
- `{ kind: "your-turn" }`
- `{ kind: "player-counters", counter, who: "you" | "opponent", atLeast }` —
  a player has at least that many counters of a kind; `"opponent"` is *one*
  opponent on their own. Corrupted ("as long as an opponent has three or more
  poison counters") is `{ counter: "poison", who: "opponent", atLeast: 3 }`.
- `{ kind: "threshold" }` — 7+ cards in your graveyard.
- `{ kind: "life-total", who?, atLeast?, atMost? }` — a life total, inclusive:
  Bilbo, Birthday Celebrant's "activate only if you have 111 or more life"
  is `atLeast: 111`; "at most half your starting life total" is `atMost:
  "half-starting"` (rounded down). `who` is `"you"` (default), `"opponent"`
  (some opponent) or `"each-opponent"` (every opponent).
- `{ kind: "cards-in-exile", atLeast, filter? }` — cards in exile, every
  player's (face-down ones too; tokens aren't cards): Ketramose, the New
  Dawn's "can't attack or block unless there are seven or more cards in
  exile" is a `restrictions: ["cant-attack", "cant-block"]` static gated by
  `{ kind: "not", of: { kind: "cards-in-exile", atLeast: 7 } }`.
- `{ kind: "metalcraft" }` — 3+ artifacts.
- `{ kind: "opponent-lost-life-this-turn" }` — Theater of Horrors. Reads the
  per-player `lostLifeThisTurn` flag, set in `changeLife` so it catches damage
  and drain alike.
- `{ kind: "turn-structure", steps?, duringCombat?, combatPhase?, mainPhase? }`
  — where the turn is: during one of `steps`, during a combat phase, during
  the Nth combat phase of the turn (Karlach's "if it's the first combat phase
  of the turn" is `combatPhase: 1`), or the Nth main phase ("your second main
  phase" is `mainPhase: 2`, which is the first postcombat main unless an
  additional one came before it). Every clause given has to hold; pair it
  with `your-turn` for "your". The counts are `TurnState.combatPhases` /
  `mainPhases`, the phase under way included.
- `{ kind: "turn-history", what, who?, filter?, atLeast?, excludeSelf? }` —
  one of the `turnHistory` lists (§6) holds at least `atLeast` (default 1)
  this turn: Éowyn, Shieldmaiden's "if another Human entered the battlefield
  under your control this turn" is `{ what: "entered", filter: { subtype:
  "Human" }, excludeSelf: true }` (a Human that entered and left since still
  counts); "if a creature died under your control this turn" is `{ what:
  "died" }`; "if you descended this turn" `{ what: "descended" }`. `who` is
  `"you"` (default), `"opponent"` or `"any-player"`. The `turn-stat`
  condition covers the running totals, raid (`stat: "attacked"`) and
  `"combat-damage-taken"` among them.
- `{ kind: "damage-dealt-this-turn", who?, combat?, colors?, atLeast }` —
  sources `who` (`"you"` by default, `"opponent"`, `"any-player"`)
  controlled dealt at least `atLeast` damage this turn: Ojer Axonil's Temple
  of Power's "activate only if red sources you controlled dealt 4 or more
  noncombat damage this turn" (an activated ability's `condition`) is
  `{ colors: ["R"], combat: false, atLeast: 4 }`. Each damage event is
  recorded against its source's controller with the source's colours as it
  dealt it — a departed source's as it last existed.
- `{ kind: "creature-died-this-turn" }` — Liliana's Devotee. Reads the
  turn-scoped `GameState.creaturesDiedThisTurn`, counted in `moveObject`
  while the dying permanent's types are still readable.
- `{ kind: "created-token-this-turn" }` — the source's controller made a token
  this turn (Idol of Oblivion). Set in `mintTokenBatch`, the funnel every
  token-making path goes through, so a token *copy* counts too.
- `{ kind: "used-graveyard-this-turn" }` — the source's controller cast a spell
  from a graveyard (flashback, escape, disturb, a graveyard permission) or
  activated an ability of a card in one this turn (Laboratory Drudge).
- `{ kind: "not", of }` — the negation of any other condition (Titan Hunter's
  "**if no creatures died this turn**"). Composes, so it's cheaper than a
  `no-` variant of each condition.
- `{ kind: "self-kicked" }` — the ability's own source was cast **kicked**
  (Verix Bladewing: "When this enters, *if it was kicked*, …"). A permanent
  spell's kicker rider can't live in `CardDefinition.kicker` the way an
  instant's does, because it resolves once the permanent is already on the
  battlefield; it's an ETB trigger with this as its intervening-if (rule
  603.4). `GameObject.kicked` dies with the stack object, so `moveObject`
  carries the one bit across to `enteredKicked`, cleared like any other
  zone-scoped flag on the *next* move — a Verix that dies and returns is
  unkicked.
- `{ kind: "self-counters", counter?, compare }` — how many counters the
  ability's **own source** has. Reads last-known information once the source
  has left the battlefield (rule 603.10), which is the only way Undying's "if
  it had no +1/+1 counters on it" can be asked at all: a dies-trigger is
  checked after the card is already in a graveyard, and `moveObject` clears
  counters on every zone change (`GameObject.lastKnown`).
- `{ kind: "target", index, filter }` — the object in target slot `index`
  matches `filter` (Scavenging Ooze: "Exile target card from a graveyard.
  **If it was a creature card**, …"). Same restriction as `trigger-object`
  below: only meaningful inside a `conditional` effect.
  A target that was a permanent and has left the battlefield since is matched
  as it last existed there.
- `{ kind: "sacrificed", filter }` — the permanent the spell or ability
  sacrificed (its cost, or a `sacrifice-source` step before this one)
  matched `filter` as it last existed on the battlefield: "if the sacrificed
  creature was a commander" (`{ isCommander: true }`), "if it was a Hamster".
  False when nothing was sacrificed. Only meaningful inside a `conditional`
  effect.
- `{ kind: "trigger-object", filter }` — the object whose event fired the
  *triggered ability* currently resolving matches `filter` (Akoum Hellkite:
  "If that land is a Mountain, it deals 2 damage instead"). Only meaningful
  inside a triggered ability's `conditional` effect; always false on a static,
  which has no triggering object.
- `{ kind: "source", filter }` — the ability's own source matches `filter`:
  "as long as ~ is equipped" (`{ equipped: true }`), "if ~ is attacking",
  "if ~ is tapped". A triggered ability whose source has left the
  battlefield since it triggered (its own dies trigger) reads it as it last
  existed there; otherwise wherever the source is now.
- `{ kind: "source-zone", zones, sameObject? }` — **where** the ability's own
  source is, as an intervening-if: Eminence's "if ~ is in the command zone or
  on the battlefield" (`zones: ["command", "battlefield"]`, Edgar Markov) or
  "if ~ is still on the battlefield" (`zones: ["battlefield"]`). Add
  `sameObject: true` whenever the clause names the card itself, which is
  nearly always: then a permanent that left and came back, or a commander
  cast from the command zone since, no longer counts (rule 400.7), checked
  against the timestamp the ability recorded when it triggered.
- `{ kind: "resolved-this-turn", n }` — "if this is the **Nth time this
  ability has resolved this turn**" (Omnath, Locus of Creation; Tannuk; Ms.
  Bumbleflower). `n` counts the resolution in progress, so the first is `1`.
  The count is per ability of one object and restarts each turn; a permanent
  that leaves and returns is a new object with a fresh count, and an ability
  that fizzled never resolved, so it doesn't count. Only meaningful inside the
  ability's own `conditional` effect (a `not` around it works too).
- `{ kind: "this-way", what, who?, filter?, atLeast?, atMost? }` — a question
  about what the resolving spell or ability has done so far: "if a land card
  is discarded **this way**" (Lord Windgrace: `{ what: "discarded", filter: {
  type: "land" } }`), "if you **didn't draw** cards this way" (Mr. Foxglove:
  `{ what: "drawn", who: "you", atMost: 0 }`). Over the same cards the
  `thisWay` amount counts (§6); `atLeast` defaults to 1, or to 0 when `atMost`
  is given. Only meaningful inside a `conditional` effect.

**`replacement?`** (`ReplacementSpec`, `replacements.ts`) — a replacement effect
*is* a static ability:

- `{ event: "enters-battlefield", tapped?, tappedUnless?,
  tappedUnlessRevealFromHand?, painIfUntapped?, mayPayLife?,
  counters?: { kind, amount }, transformed? }` — a self-replacement.
  `tapped` is unconditional; `tappedUnless: StaticCondition` is the check-land
  cycle (Rootbound Crag: `{ kind: "controls", filter: { subtypes: [...] },
  atLeast: 1 }`, via the `checkLandStatic`/`enterTappedUnlessLands` helpers);
  `tappedUnlessRevealFromHand: [type, type]` is the reveal-land cycle (Port
  Town, via the `revealLand` helper) — the one enters-tapped check that reads
  your **hand** rather than the battlefield, which is why it isn't a
  `StaticCondition`. The card says "you *may* reveal" and the engine always
  does: declining only ever hides information, which nothing here models.
  `mayPayLife: N` is a shock land (a `pay-life-for-untapped` decision, via the
  `shockLand` helper); `painIfUntapped: N` deals damage if it *did* end up
  entering untapped (Rockfall Vale).
- `{ event: "others-enter-battlefield", filter, tapped?, untapped?,
  counters?: { kind, amount } }` — how **other** permanents enter. `filter`
  picks which, read from this permanent's controller's side against each one
  as it will exist on the battlefield, including the player it's entering
  under: Thalia, Heretic Cathar's "creatures and nonbasic lands your
  opponents control enter tapped" is `{ controlledBy: "opponent", anyOf:
  [{ type: "creature" }, { type: "land", notSupertype: "basic" }] }` with
  `tapped: true`. `untapped: true` is "lands you control enter untapped" (The
  Wandering Minstrel, Spelunking) and beats every enters-tapped — the land's
  own, another permanent's `tapped`, an effect's "put it onto the battlefield
  tapped" — and a shock land isn't asked for its life. `counters.amount` is an
  `EffectAmount` read as the permanent enters, and never counts it or
  anything entering beside it: Giada's "an additional +1/+1 counter on it for
  each Angel you **already** control" is `{ countOf: { subtype: "Angel",
  controlledBy: "you" } }`; a fixed "an additional +1/+1 counter" is `1`.
  Leave "other" out of the filter: rule 614.12 already keeps a permanent's
  replacement off itself, and off anything entering at the same time as it
  (a token batch, a mass reanimation, a flicker's return, a tutor's finds are
  each one simultaneous entry).
- `{ event: "would-create-token", multiplier }` — Doubling Season.
- `{ event: "would-add-counter", multiplier, counterKind?, filter? }` — Doubling
  Season. `filter` narrows which of your permanents it covers (Branching
  Evolution: `{ type: "creature" }`). Only multipliers: "that many **plus
  one**" (Hardened Scales) would need replacement ordering.
- `{ event: "would-be-put-into-graveyard", instead: "exile", filter?, from? }`
  — Rest in Peace / Anafenza. `from: "battlefield"` is the **dies-only** form
  ("if a creature an opponent controls would die, exile it instead"): it lets
  a discard, a mill or a countered spell through, and its `filter` reads the
  permanent's computed characteristics and current controller, since it's
  still on the battlefield when the replacement is asked.
- **Finality counters** (rule 122) need no spec: any permanent with a
  `finality` counter that would go to a graveyard from the battlefield is
  exiled instead, by `moveObject` itself. Put one on with
  `put-onto-battlefield { withCounters: { kind: "finality", amount: 1 } }`
  (Admiral Brass, Unsinkable) or `add-counter`.
- "If it would leave the battlefield, exile it instead of putting it anywhere
  else" follows one object, not a static — `put-onto-battlefield
  { exileIfItWouldLeave: true }` (Whip of Erebos). It catches a bounce or a
  tuck as well as a death, and ends when the permanent leaves.
- `{ event: "would-draw", who: "opponent", instead: "you-draw" }` — Notion
  Thief. `{ event: "would-draw", who: "you", instead: { draws: N } }` is "if
  you would draw a card, draw N cards instead" (gate it with the static's
  `condition`); neither applies again to the draws it makes (rule 614.5).
- `{ event: "would-mill", who, multiplier }` — Bruvac the Grandiloquent's "if
  an opponent would mill one or more cards, they mill twice that many cards
  instead" (`who: "opponent"`, `multiplier: 2`); several multiply.
- `{ event: "would-gain-life", who, plus?, prevent? }` — Bilbo, Birthday
  Celebrant's "if you would gain life, you gain that much life plus 1
  instead" (`who: "you"`, `plus: 1`), or "your opponents can't gain life"
  (The Lord of Pain — `who: "opponent"`, `prevent: true`). Applied to every
  life gain, lifelink's included; one `prevent` beats every `plus`.
- `{ event: "would-deal-damage", multiplier?, plus?, atLeast?, combat?, prevent?, then?, source?, to? }`
  — damage about to be dealt, changed. With neither `source` nor `to` it is
  **symmetric and global** (Dictate of the Twin Gods' `multiplier: 2` doubles
  damage from any source to any recipient, its own controller's included), so
  `affects` is irrelevant. `source` filters the source of the damage from this
  permanent's controller's side (Neriv: `{ type: "creature", controlledBy:
  "you", enteredThisTurn: true }`; Kuja's Flare Star: a Wizard you control; a
  departed source as it last existed); `to` narrows the recipient —
  `"opponent"`, `"opponent-side"` (an opponent or a permanent an opponent
  controls — Torbran's `plus: 2`), `"you"` or `"self"`. `prevent: true`
  prevents it instead, then applies `then` as this permanent's controller's
  effect with `"x"` the damage prevented: The Mindskinner's "prevent that
  damage and each opponent mills that many cards" (`to: "opponent"`, `source:
  { controlledBy: "you" }`, `then: { kind: "mill", target: "each-opponent",
  amount: "x" }`), "prevent that damage and put that many +1/+1 counters on
  it" (`to: "self"`). `combat` narrows it to combat (`true`) or noncombat
  (`false`) damage, and `atLeast: "this-power"` raises the damage to this
  permanent's power when it's less — Ojer Axonil, Deepest Might's "if a red
  source you control would deal an amount of noncombat damage less than Ojer
  Axonil's power to an opponent, that source deals damage equal to Ojer
  Axonil's power instead" (`atLeast: "this-power", combat: false, source:
  { colors: ["R"], controlledBy: "you" }, to: "opponent"`). Applied in a fixed
  order — every multiplier, then every `plus`, then every `atLeast`, then the
  first `prevent`, then prevention shields — where rule 616.1 would let the
  affected player choose.

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
  engine adds the `{2}` tax and the 903.9a replacement automatically — for a
  non-creature commander (a Background) too.
- **Partner and its variants** (rule 702.124) — a deckbuilding ability, set as
  `pairing` and read only by the deck validator (`canPairCommanders`). The
  printed line still goes in `text`, but the validator never reads `text`, so
  a card without `pairing` can't pair however its text reads
  (`commander-pairing.test.ts` checks the two agree across the pool). Each
  kind pairs only with its own:
  - `{ kind: "partner" }` — plain "Partner". `thrasios-triton-hero.ts`.
  - `{ kind: "partner-with", name }` — "Partner with [name]": only with that
    card, whose own `partner-with` must name this one. The keyword also prints
    an enters trigger; add it as `triggered: [partnerWithTrigger(name)]` from
    `helpers.ts` (target player may search for the named card, reveal it, put
    it in hand).
  - `{ kind: "partner-group", group }` — "Partner—[text]" (`"Father & son"`,
    `"Survivors"`) and the older "Friends forever" / "Character select",
    which pair the same way: only with the identical `group` string.
  - `{ kind: "choose-a-background" }` — "Choose a Background": pairs with a
    legendary enchantment with subtype `Background`. The Background itself
    needs **no** `pairing` — its type line is what makes it one — and it can
    only be a commander as that second half. `ganax-astral-hunter.ts`.
  - `{ kind: "doctors-companion" }` — "Doctor's companion": pairs with a
    legendary creature whose subtypes are exactly `Time Lord` and `Doctor`,
    which needs no `pairing` of its own.

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

**A whole land/rock cycle** — `cards/helpers.ts` has a one-line constructor for
each of the big repeating shapes, and a new member of a cycle should use it
rather than being spelled out: `shockLand`, `fetchLand`, `checkLandStatic`,
`enterTappedUnlessLands`, `painLand`, `sacrificeFetchLand`, `talisman` (a pain land's
ability set on a `{2}` artifact), `signet` (a `{2}` artifact with "{1}, {T}:
Add [two colours]" — see the converter note in §15), `tapLand` (enters tapped,
taps for two colours — Timber Gorge; pass `true` for the gain-1-life variant,
Kazandu Refuge), `revealLand`, `basicLand`. `blood-crypt.ts` is the whole
file: `export default shockLand("Blood Crypt", ["Swamp", "Mountain"]);`

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

If a card needs something here, it can't be authored faithfully yet, so by
**rule zero (§0) it isn't authored at all** — pick a different card, or build
the primitive first (`neededCards-features.md` ranks them by blocked-card
count; `ROADMAP.md` has the architecture constraints).

Keep this list honest in both directions. A **stale** entry is worse than a
real one: it makes authors skip cards that have been authorable for months.
Delete an entry in the same commit as the feature that retires it.

**No vocabulary for:**

- **Aggregates in the layer fold**: a sum or maximum (`AggregateSpec`) is an
  `EffectAmount`, a `StaticCondition` and a cost reduction, but not yet a
  characteristic-defining ability ("power equal to the greatest power among
  other creatures you control") or a static P/T bonus ("gets +X/+0, where X is
  the total power of …"). Reading other creatures' power inside one
  creature's own layer fold needs dependency ordering the engine doesn't
  have. An **attack batch** ("the greatest power among attacking creatures")
  can only be approximated by an `attacking: true` filter at resolution,
  which drifts from the batch if an attacker leaves or another starts
  attacking — don't author a card on that approximation.
- Putting a card from **another player's** graveyard into **your** hand
  ("put it into your hand" — a steal, not a return). `return-to-hand` with
  `from: "graveyard"` returns a targeted card to its **owner's** hand, which
  is the same thing for your own graveyard and for "return target card from a
  graveyard to its owner's hand";
  `return-from-graveyard` covers *your own* graveyard → battlefield / hand by
  filter; `escape` / `flashback` / `disturb` cover self-recursion of the spell itself;
  `StaticAbility.playFromGraveyard` (Ramunap Excavator) lets you *play*
  matching cards from your graveyard. Reaching **any** graveyard is fine for a
  *targeted* effect — the `card-in-graveyard` target spec plus
  `return-to-hand`, `put-onto-battlefield` (Reanimate's shape) or `put-on-library`.
  Putting a card **on top of / on the bottom of a library** is the
  `put-on-library` effect (Academy Ruins) and `search-library`'s
  `destination: "library-top"` (Vampiric Tutor).
- `modify-pt` / `tap` targeting **another player** by scope, and `mill` by
  scope — `discard`/`mill` take a target-player slot (or `"you"`) but there's
  no "each opponent mills" form. (`draw` *does* now take both a `who` scope
  and a `target` slot, and `discard-hand` takes a scope — see §6.)
- Reordering the cards you keep on top after a scry.
- Tutors whose finds must **share a characteristic with each other** (Myriad
  Landscape: "up to two basic land cards that share a land type"). A
  `CardFilter` constrains each card independently; nothing relates one chosen
  card to another. (A plain two-destination split — Cultivate — *is* now
  expressible, via `search-library.restDestination`.)
- `discard` as part of an **activated ability cost**.
- `spellsCastThisTurn` triggers beyond `cast-spell` / `this-cast`.
- **Unbounded targeting** — "any number of target …", and "divide N damage
  among any number of targets". The slot *count* is still fixed by the
  declared `TargetSpec[]`. ("Up to N" *is* expressible — N slots marked
  `{ kind: "optional", of: spec }`, see §7.)
- ~~**Mana provenance / restricted spend.**~~ **Built.** The mana pool is a
  list of tagged `ManaUnit`s, so a unit remembers where it came from. An
  `add-mana` effect stamps three optional things on what it produces:
  - `spendOnly: { spell?, abilityOf?, chosenType?, uncounterable?, text }` —
    "Spend this mana only to cast a creature spell of the chosen type"
    (Cavern of Souls, Unclaimed Territory, Secluded Courtyard, Ancient
    Ziggurat). `chosenType` folds in the type named as the permanent entered;
    `abilityOf` adds the "…or activate an ability of" half;
    `uncounterable` is Cavern's "and that spell can't be countered", which
    is a property of the spell the mana paid for rather than of the land.
  - `whenSpent: { spell?, effect, text }` — "When that mana is spent to cast
    …" (Path of Ancestry). `spell: "shares-type-with-commander"` resolves
    against the controller's commanders at activation time. It fires as a
    real triggered ability, so it resolves *above* the spell it paid for.
    Only a *cast* fires it — mana spent on an ability never does — and it
    still fires if the permanent that made the mana has left since. A
    `manaValue` clause in `spell` reads the spell on the stack, so its chosen
    `{X}` counts (Gilanra, Caller of Wirewood: `{ manaValue: { op: "gte", n: 6 } }`).
  - `persists: true` — "you don't lose this mana as steps and phases end"
    (Savage Ventmaw). Still emptied at cleanup.
  - `untilEndOfCombat: true` — "this mana lasts until end of combat": kept
    through the combat phase's steps, lost as it ends (and not carried into
    an additional combat phase). Firebending's — see the `firebending`
    helper (§6).

  Note the *identity* clause alone was never a blocker: "one mana of any
  color in your commander's color identity" is modelled as plain
  `"any-color"` (`arcane-signet.ts`, `commanders-sphere.ts`, and now
  `path-of-ancestry.ts`), which is exact for any deck that passes
  `validateCommanderDeck` — every card the mana could be spent on is already
  inside that identity. `mana-provenance.test.ts`.
- **An emblem can only carry a `StaticAbility`.** `create-emblem` takes
  `static?`, and emblems live in `GameState.emblems` rather than as
  `GameObject`s, so `detectTriggers` — which scans battlefield permanents —
  can't see them. An emblem with a *triggered* ability (Sarkhan, the
  Dragonspeaker's ultimate: "At the beginning of your draw step, draw two
  additional cards") is therefore unauthorable. This is the common shape for
  planeswalker ultimates, so it's a real gap rather than a one-card one.
- **A mana ability whose activation cost contains a *coloured* pip is still
  unmodeled.** `manaSources()` now admits a "converter" — a mana ability whose
  own cost is purely **generic** and which produces more than it costs (the ten
  Signets via the `signet` helper, filter lands like Flooded Grove). The
  planner reaches for one only after the ordinary sources are spent, funds its
  cost from those (never from another converter, and preferring a source whose
  colour the cost doesn't want), and orders it last so the mana is in the pool
  when it activates. A *coloured* activation cost stays out, because it is
  genuinely circular — you'd need the colour to make the colour — and so does
  an `{X}` one, since nothing is resolving during payment planning. Selvala,
  Heart of the Wilds is still blocked, on its output rather than its cost.
- **A `discards` trigger fires once per discard *event*, not once per card.**
  `cards-discarded` carries the whole batch, and the engine matches the event.
  A card printed as "whenever an opponent discards a card, you may gain 3 life"
  (Sangromancer) should trigger once per card; the divergence only shows on a
  multi-card discard (Mind Rot), and it undercounts rather than over.
- **A *mana* ability with a `tapOthers` cost is invisible to the auto-payer**
  (Jaspera Sentinel, Holdout Settlement: "{T}, Tap an untapped creature you
  control: Add one mana of any color"). `useManaSource` taps only the source,
  so offering these to `manaSources()` would hand out the mana without paying
  for it — strictly better than the printed card. They're excluded there and
  stay activatable by hand, which floats the mana; the effect is that the card
  is inert during auto-payment rather than wrong.
- **Regeneration** (rule 701.15) — no shield, no `"{B}: Regenerate"` cost, no
  replacement of a destruction. Mortivore is in the pool without its
  regeneration ability and shouldn't be (see "Known exceptions" below).
- **`EffectSpec.sacrifice.count` is a fixed `number`**, not an `EffectAmount` —
  can't sacrifice "X" of something where X is the spell's own chosen value
  (Nahiri's Lithoforming) (needed-cards P18).
- No **"a player plays a land"** trigger distinct from "a land enters the
  battlefield" generally (Burgeoning) — the latter also fires for a land
  fetched by an effect, which the former shouldn't (needed-cards P18).
- No **"a card was put into a graveyard from anywhere"** trigger — `dies` only
  covers a permanent's battlefield → graveyard move (The Gitrog Monster's "a
  land card goes to a graveyard from anywhere, draw a card") (needed-cards P18).
- No **temporary, this-turn-only *activated*-ability grant** to a filtered
  class of permanents (Rain of Filth: "lands you control gain 'Sacrifice: Add
  {B}' until end of turn") — `grantsActivated` is a permanent static's ongoing
  grant, not a one-shot resolution effect (needed-cards P18). The *triggered*
  equivalent does exist, for a single target: the `grant-triggered` effect
  (§6).
- **"As this enters, choose …" only fires when the permanent is *cast or
  played*.** `chooseCreatureTypeOnEnter` / `chooseOnEnter` hang off those two
  paths, so a copy, a reanimation or a `debugSpawn` never raises the choice
  and the permanent behaves as though nothing was chosen. (The *played* half
  was added for Cavern of Souls and friends — a land is played, not cast, so
  every one of them used to enter with no type named and its restricted mana
  could pay for nothing.)
- **"As this enters" choices are made after the replacements are read.** A
  Clone's copy choice (`copyOnEnter`) and a chosen creature type are asked
  once the permanent is on the battlefield, so an `others-enter-battlefield`
  replacement judges it as it was printed: a Clone copying an Angel doesn't
  get Giada's counters, where rule 614.12 says it should. Metallic Mimic ("each
  other creature you control **of the chosen type** enters with an additional
  +1/+1 counter") is blocked on the same ordering, and on a filter for the
  chosen type.
- **Bestow** (rule 702.103 — Springheart Nantuko), **Eternalize** (rule
  702.129 — Fanatic of Rhonas), **retrace** (rule 702.83 — Six), **riot**
  (rule 702.152 — Rhythm of the Wild), **Hideaway** (rule 702.104 — Mosswort
  Bridge), and **Station** (rule 702.171 — Exploration Broodship and others)
  are unmodeled alt-cast / ETB-choice mechanics (needed-cards P18).

**Partial:**

- **Only mass moves are one event.** A single instruction with several
  targets ("destroy two target creatures", "return this card and up to one
  other target creature card") still moves them one after another, so a
  leaves-the-battlefield trigger among them misses the ones moved before it —
  and of two permanents put onto the battlefield that way, only the first
  sees the second enter, and the second is treated as entering after the
  first by an `others-enter-battlefield` replacement (Giada counts the first
  Angel). Mass entries — a token batch, `return-from-graveyard` of every
  match, a flicker's return, a tutor's finds, an O-Ring's exiles coming back
  — are one simultaneous entry (`Game.withEnterBatch`).

- **"You may reveal a card from your hand"** on the reveal-land cycle is taken
  automatically rather than offered as a choice — see
  `tappedUnlessRevealFromHand` above.

- **Text-change** only swaps one creature-type word (Artificial Evolution). No
  full "the words X become Y".
- **Protection** is `{ colors, types }` only — not "protection from
  [full filter]" (e.g. "from Dragons", "from everything").
- **Conditional statics / intervening-ifs** are limited to the
  `StaticCondition` kinds the union lists (`controls` / `opponent-controls` /
  `your-turn` / `threshold` / `delirium` / `metalcraft` / … — read the type).
  Other "as long as …" / "if …" clauses aren't expressible; Coven (three or
  more creatures with different powers) and Raid (you attacked this turn) are
  the two the EDH backlog currently wants.
- **Replacement ordering** — if two replacements would apply to one event
  there's no `choose-replacement-order`; the pool has no such case. No damage
  **redirection** to a third object (Harm's Way).
- **Modal** resolution-time modes must be non-targeted (targeted → `castModal`,
  cast-time only).
- **Snow** mana is treated as generic — no snow permanents / snow-mana
  requirements.
- **`populate`** copies the largest creature token you control rather than
  letting you pick. That *is* a choice simplification: it bites only when the
  candidates differ in some way the card itself doesn't care about. Under §0
  that licence is narrow — check the claim against the actual pool rather
  than assuming it. `proliferate` sat in this bullet until it was checked, and
  it did not belong: it added a counter to *every* permanent on the
  battlefield, opponents' included, so Atraxa grew their creatures and topped
  up their planeswalkers every end step. It now raises a real "choose any
  number" decision (`proliferate.test.ts`). Nor did **`tapOthers` /
  `alternativeCost`**, which tapped the first eligible permanents: which
  creatures a cost taps decides which can attack or block this turn. The
  player picks them now (`tap-cost-choices.test.ts`).
- **A keyword-scoped static sees only one level of keyword grants.**
  `withKeyword`/`withoutKeyword` match the target's *current* keywords, but
  those are folded from every static *not* itself scoped by keyword (plus
  emblems and the target's own modifiers). So Sephara's indestructible,
  granted to fliers, is invisible to another keyword-scoped static — a
  "creatures with indestructible get …" anthem wouldn't see it. No pool card
  needs that yet.
- **Additional costs** are `sacrifice` (a `CardFilter`), `discard` (a count)
  and `payLife` (a count) — several may be set and all are paid. Not yet: a
  *choice* between two of them ("discard a card **or** pay 3 life" — Bitter
  Triumph), an "exile a card from your graveyard" form, or a cost whose
  amount the caster picks ("pay X life" — Toxic Deluge). **Kicker** is a
  single optional cost (no multikicker, no two different kickers on one card).

**Not modeled at all:** phasing, Battles, dungeons / the Initiative / the Ring,
banding, "day/night"-independent double-faced tokens, a static ability that
makes a planeswalker a creature (Gideon), ability-dependency ordering (rule
613.8), companions.

### Known exceptions already in the pool

Rule zero (§0) was written on **2026-09-20**, after 739 cards were already in.
These are the cards that predate it and don't meet it — every one either loses
a printed ability or runs a wrong one. They are **debt, not precedent**: each
is a card to fix or to delete, and no new card joins this list.

`npm run card:text -w engine` is the live ledger for the first kind (a whole
clause gone missing). It found 13 of 739 on the day the rule landed:

| card | what's missing | blocked on |
| --- | --- | --- |
| **Saw in Half** | tokens are hardcoded `1/1` instead of **half the destroyed creature's P/T, rounded up**; the file's own `text` invents a clause the card doesn't have | an `EffectAmount` reading a target's power/toughness |
| **Finale of Devastation** | the "and/or **graveyard**" half of the search | `search-library` searching two zones |
| **Fireball** | "costs {1} more for each target beyond the first" — authored as single-target | unbounded targeting (deliberately scoped out) |
| **Mortivore** | `{B}: Regenerate this creature` | regeneration |
| **Chandra, Acolyte of Flame** | the whole −2 loyalty ability | cast-from-graveyard as a targeted effect |
| **Rydia, Summoner of Mist** | the whole Summon activated ability | Saga reanimation + `{X}` in an activated cost's target filter |
| **Will of the Sultai** | "if you control a commander … choose both instead" | a commander-conditional mode count |
| **Combat Thresher** | Prototype | Prototype |
| **Fanatic of Rhonas** | Eternalize | Eternalize |
| **Iridescent Vinelasher** | Offspring | Offspring |
| **Starfield Vocalist** | Warp | Warp |
| **Terror of the Peaks** | "spells your opponents cast that target this creature **cost an additional 3 life**" runs as `ward({ payLife: 3 })`: paid or countered after the cast, and it also reaches abilities | a cast-time additional cost imposed by the target |

The five `proliferate` cards were a fourteenth entry of exactly the kind
`card:text` cannot see — their text was right and their *behaviour* wasn't —
and have since been fixed rather than listed.

That last point is the ledger's limit, and Saw in Half is the proof: the audit
flagged four trailing words of it ("Round up each time") while the substantive
error — two 1/1s where the card makes two half-size copies — sat inside a
clause the matcher scored as close enough. **`card:text` catches a dropped
clause; nothing catches a wrong one but reading the card.**

---

## 16. Testing a new card

- **Read the Oracle text beside the finished file**, clause by clause, and
  confirm each one is expressed. This is the only check that catches a clause
  that's present but *wrong* (§0, §15) — every tool below is blind to it.
- **Fuzz it.** Add the name to one of the decks in
  `engine/scripts/random-demo.mjs`, then `npm run play:random -w engine --
  --games 300`. If `legalActions` ever offers something `dispatch` refuses,
  this crashes.
- **Write a focused test** if the card exercises new-ish behaviour — one
  `engine/src/test/<card-or-feature>.test.ts` that builds a `Game` (or uses
  `createSandbox` from `sandbox.ts`), dispatches through the interaction, and
  asserts the outcome. See `engine/src/test/clone.test.ts` for the white-box
  `spawn` pattern, or `engine/src/test/sandbox.test.ts` for the sandbox helper.
- **Run the suite:** `npm run test -w engine`.
- **Eyeball it:** `npm run lab -w client`, Sandbox tab.

Periodically re-verify the *whole* pool, not just new cards — `npm run card:verify -w
engine` (`engine/scripts/verify-cards.mjs`) diffs every `cards/pool/` card's mana cost,
colors, supertypes/types/subtypes, and power/toughness/loyalty against real Scryfall
data (batched, ~4 requests for the whole pool). A prior pass had shipped several cards
with a plainly wrong cost/color/stat block that no test caught, because nothing was
checking a card's characteristics against the real thing once it was in the pool — see
"Full-pool Scryfall verification pass" in `neededCards-features.md`. It only checks
structural fields, not ability text/behaviour, and skips `cards/tokens/` (token names
aren't unique on Scryfall).
