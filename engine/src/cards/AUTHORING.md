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
| `kicker` | `{ cost, targets?, effect? }` | **kicker** (rule 702.33 — Tear Asunder). `cost` is folded onto the printed cost; `targets` / `effect` replace the unkicked ones when kicked. `legalActions` offers the card twice, kicked and unkicked. |
| `overload` | `{ cost, effect }` | **Overload** (rule 702.126 — Cyclonic Rift). An alternative cost that *replaces* the mana cost entirely (unlike kicker's additive cost) and takes **no targets** — `effect` is the whole "each ..." version of the card (typically a `-all` `EffectSpec`, e.g. `return-to-hand-all`/`destroy-all`), applied with the printed `targets`/`effect` untouched for the ordinary cast. `legalActions` offers the card twice. |
| `alternativeCost` | `{ mana, tapCreatures: { count, filter } }` | an alternative cost that replaces the mana cost *and* taps permanents (rule 601.2b — Sephara's "pay {W} and tap four untapped creatures you control with flying rather than pay this spell's mana cost"). Offered as a second `cast-spell` variant (`altCost: true`), the same shape `kicked`/`overload`/`free` use. |
| `freeCastIf` | `{ condition: StaticCondition }` | a conditional free-cast permission printed on the spell itself (the CMM commander-precon cycle — Fierce Guardianship: "If you control a commander, you may cast this spell without paying its mana cost."). Unlike `overload`, targets/effect are completely unchanged — only the cost differs, and it's *in addition to* the normal cast, not instead of it. `legalActions` offers the card twice whenever the condition is currently met. |
| `convoke` | `boolean` | **Convoke** (rule 702.51 — Chord of Calling, Hour of Reckoning). A pure payment-*method* choice made as the spell is cast (`Action.convoke: ConvokePayment[]`, each `{ creature, pays: "generic" \| Color }`) — tap untapped creatures instead of mana for part of the cost. Doesn't change the printed cost, targets, or effect; not enumerated as a second `cast-spell` variant — the one `LegalAction` carries `convoke: { candidates, maxGeneric }` (every untapped creature the caster controls) instead. |
| `selfCostReduction` | `{ condition: StaticCondition, reduceGeneric }` | a reduction printed on the spell itself, gated on board state (rule 601.2f — Ferocious, Finale of Devastation: "if you control a creature with power 4 or greater, this spell costs {2} less"). Unlike a `StaticAbility.costModification` (a permanent reducing *other* spells) this is evaluated for the card being cast, from whatever zone — no permanent has to be on the battlefield granting it. `reduceGeneric` accepts a live count too (`{ countOf: CardFilter }` — Blasphemous Act: "{1} less for each creature on the battlefield", `{ type: "creature" }` with no `controlledBy` counts every player's). `condition` is mandatory; a reduction with no real "if" clause uses `{ kind: "controls", filter: {}, atLeast: 0 }` (trivially always true). needed-cards P10, P19. |
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
| `exileOnResolve` | `boolean` | "Exile ~" printed on a non-permanent spell's own resolution text (Genesis Ultimatum) — goes to exile instead of the graveyard after resolving, unconditionally (however it was cast). Distinct from flashback/disturb/adventure, which only redirect a spell cast *that way*. needed-cards P19. |
| `shuffleIntoLibraryOnResolve` | `boolean` | "Shuffle ~ into its owner's library" as the last part of resolving (White Sun's Zenith). Only on resolving: a *countered* one goes to the graveyard, because the shuffle is an instruction the spell never got to carry out. |
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

**Evasion:** `fear` (rule 702.36 — blockable only by artifact and/or black
creatures) and `intimidate` (702.13 — artifact creatures and/or creatures
sharing a colour with it; a colourless attacker with intimidate is blockable
only by artifact creatures).

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
`{ manaValueOf: ref }` — the mana value of whatever a target slot (or
`"source"` / `"trigger-object"`) points at, read off the printed card so it
still answers after that permanent has left the battlefield (rule 608.2h, last
known information — Feed the Swarm destroys the permanent and *then* reads it,
and `0` for a player target); or
`{ triggerValue: true }` — a number the firing event supplied to a **triggered
ability**: the entering / attacking creature's power (Terror of the Peaks:
`damage`), or the combat damage a creature dealt a player (Old Gnawbone:
`create-token` `count`). `0` outside a triggered-ability resolution. An
`EffectAmount` is accepted by `damage` / `damage-all` / `mill` / `discard` /
`draw` / `gain-life` / `lose-life` / `prevent-damage` `amount`, `modify-pt` /
`modify-pt-all` `power`/`toughness`, `add-mana` `amount`, and `create-token`
`count`.

The rest of the shapes: `{ countOf: CardFilter, times? }` (a battlefield
count, optionally multiplied — Shamanic Revelation's "4 life **for each**"),
`{ countInGraveyard }`, `{ manaValueOf }`, `{ powerOf }`, `{ toughnessOf }`
(Condemn), `{ lifeTotal: "you" }` (Storm Herd), `{ devotionTo: Color }` (rule
700.5 — Gray Merchant of Asphodel; a hybrid pip counts for each colour it
contains, `{X}` and generic for nothing), `{ creaturesDiedThisTurn: true }`
(per *player*, unlike `GameState`'s global counter — Liliana's Standard
Bearer), `{ countPlayers: PlayerScope }` (Inspired Sphinx; counts living
players, so it shrinks as a multiplayer game does),
`{ opponentsControllingFewer: CardFilter }` (Voice of Many — a comparison per
player, which no single filter can express), and `{ product: [...] }`, which
is how compound amounts compose without every other shape growing a
multiplier (Gray Merchant's "life equal to the life lost this way" is devotion
× opponents, and neither factor is static).

### Damage / life / cards

| kind | fields | example |
| --- | --- | --- |
| `damage` | `amount`, `target` \| `who` \| `toControllerOfTarget` | Lightning Bolt (`target`); Breath of Malfegor (`who: "each-opponent"`); Unlicensed Disintegration — "deals 3 damage to **that creature's** controller" (`toControllerOfTarget: 0`, mirroring `create-token`'s `who: "target-controller"`) |
| `damage-all` | `filter`, `amount`, `exceptSource?` | Pyroclasm. `exceptSource` spares the source itself — Harbinger of the Hunt's "each **other** creature with flying", which a `CardFilter` can't say (it describes the permanent matched, not its relationship to the damage source). |
| `creatures-damage-controllers` | `filter`, `amount` | Rakdos Charm — "each creature deals 1 damage to its controller"; the reverse direction from `damage-all` (each matching permanent is its own source, hitting its own controller, not the caster). needed-cards P20 |
| `gain-life` | `amount` (an `EffectAmount`), `who?` | Healing Salve; Shamanic Revelation's "4 life for each creature you control with power 4 or greater" is `{ countOf: …, times: 4 }` |
| `lose-life` | `amount`, `who?` \| `target?` | Zulaport Cutthroat (`who`); Ob Nixilis, the Fallen — "target player loses 3 life" (`target`, a target-slot index — mutually exclusive with `who`, needed-cards P19) |
| `draw` | `amount`, `who?`, `target?` | Divination (controller draws); Stormfist Crusader (`who: "each-player"`); Bloodgift Demon (`target`, a player slot). `target` wins if both are set. |
| `discard-hand` | `who` | Dragon Mage — "each player discards their hand". A whole hand at once with nothing to choose, so unlike `discard` it never raises a decision, which is what lets "discards their hand, **then** draws seven" resolve in one pass. |
| `discard` | `target` (slot \| `"you"`), `amount` | Mind Rot / Faithless Looting |
| `mill` | `target` (slot \| `"you"`), `amount` | Tome Scour / Aftermath Analyst (`"you"`) |

`who?` is a `PlayerScope`: `"each-player" \| "each-opponent" \| "you" \|
"active-player"` (default = the effect's controller). `"active-player"` is
"that player" in a trigger that fires on someone else's step.

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
| `put-onto-battlefield` | `target` (an `EffectTargetRef`, so `"trigger-object"` works — Undying returns *itself*), `underYourControl?`, `enterTapped?`, `withCounters?` | Reanimation that names one card, from anyone's graveyard — as opposed to `return-from-graveyard`'s filter over your own. `underYourControl` makes controller diverge from owner, so the card still goes back to its **owner's** graveyard when it dies. |
| `exile-graveyard` | `target` (a player slot, or `"you"`) | Bojuka Bog — exiles that player's whole graveyard at once (rule 406; the cards in it are never individually targeted) |
| `flicker` | `target` | Essence Flux — exiles `target`, then immediately returns it to the battlefield under its owner's control (rule 400.7 — a brand-new object; a token exiled this way never comes back) |
| `return-to-hand` | `target` | Unsummon |
| `return-to-hand-all` | `filter` | Cyclonic Rift, overloaded — mirrors `destroy-all` |
| `return-from-graveyard` | `filter`, `destination: "battlefield" \| "hand"`, `count: number \| "all"`, `enterTapped?` | Splendid Reclamation (from *your* graveyard; a `number` less than the match count raises a `choose-from-zone`) |
| `search-library` … `reveal?` | — | "…, **reveal it**, …" (Enlightened Tutor, Mystical Tutor): shows the find to every player, rule 701.16. Off by default — a plain "search your library for a card" (Vampiric Tutor) reveals nothing, and the difference is printed on the cards. |
| `put-on-library` | `target`, `position: "top" \| "bottom"` | Academy Ruins, Mortuary Mire — puts one **targeted** card on its owner's deck. Pair it with a `card-in-graveyard` target for the graveyard-recursion lands; unlike `return-from-graveyard` it is target-driven, so it reaches any graveyard. |
| `delayed-trigger` | `at`, `effect`, `text`, `controller?` | Whip of Erebos's "exile it at the beginning of the next end step", Arcane Denial's upkeep draws. Rule 603.7 — see below. |
| `counter` | `target` (a spell) | Counterspell |
| `sacrifice-all-but` | `who`, `keep`, `filter` | "chooses up to N they control, then sacrifices the rest" (Archfiend of Depravity) — the inverse of `sacrifice`, which names how many to give up. Raised only when they're over the limit. |
| `sacrifice` | `who`, `filter`, `count`, `exceptSource?` | Diabolic Edict (`who: "target"`), Fleshbag Marauder (`who: "each-player"`), Korvold (`who: "you"`, `exceptSource: true` = "another") |
| `sacrifice-source` | `then?` | Defense of the Heart — "Sacrifice ~. **If you do,** …"; no choice, and `then` only applies if the source was still there to sacrifice |
| `fight` | `a`, `b`, `oneSided?` | Prey Upon / Rabid Bite |
| `gain-control` | `target`, `untilEndOfTurn` | Act of Treason |

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
| `grant-triggered` | `target`, `ability`, `duration` | "gains 'Whenever this creature deals combat damage to a player, draw that many cards'" (Hunter's Prowess, Hunter's Insight). Rides on the target's own modifiers, so `"end-of-turn"` expires with every other until-end-of-turn modifier. The ongoing equivalent is `StaticAbility.grantsTriggered` (§10). |
| `grant-keyword-all` | `filter`, `keyword`, `duration` | Overrun's trample |
| `add-counter` | `target`, `counter` (string), `amount` | `counter: "+1/+1"` etc. |
| `add-counter-all` | `filter`, `counter`, `amount` | the untargeted mass form (Loyal Guardian: "a +1/+1 counter on each creature you control"). Routes through `add-counter` per permanent, so Doubling Season still composes. |
| `populate` | — | Populate (rule 701.32): create a token copying a creature token you control (Rootborn Defenses). Copies the largest by power rather than asking — see §15 "Partial". |
| `amass` | `amount`, `creatureType` | Amass N (rule 701.44). One effect rather than create-then-count, because "an Army you control" has to resolve to the **same** object each time — that's what makes repeated amassing grow one creature. Picks the first Army rather than asking; no precon makes two. |
| `grant-player-hexproof` | `who?` | "You gain hexproof until end of turn" (Lazotep Plating). A *player* can't be targeted by opponents; permanents gaining hexproof is `grant-keyword-all`. Turn-scoped on `GameState.hexproofPlayers`. |
| `double-counters-all` | `filter`, `counterKind` | Kalonian Hydra / Bristly Bill — doubles each matching permanent's own current count of that counter kind (routes through `add-counter`'s own logic, so Doubling Season's replacement still composes on top: 3x, not 4x) |
| `double-pt-all` | `filter`, `duration` | Unnatural Growth — doubles each matching permanent's own *current computed* power/toughness individually (a 2/2 and a 5/5 both matching become a 4/4 and a 10/10), unlike `modify-pt-all`'s single shared amount |
| `proliferate` | — | proliferates *everything* eligible (no "choose any number") |
| `animate` | `target`, `power`, `toughness`, `addTypes`, `addSubtypes`, `setSubtypes?`, `setColors?`, `loseAbilities?`, `keywords?`, `duration` | man-lands, Turn to Frog |

### Tokens / attach / transform

| kind | fields |
| --- | --- |
| `create-token` | `token` (a registry name), `count`, `who?: "you" \| "target-controller"` (Beast Within — under `targets[0]`'s controller), `tapped?` (Army of the Damned — "create thirteen **tapped** … tokens"; a tapped batch is never folded into a token stack, since a stack carries one `tapped` flag for all of it) |
| `create-token-copy` | `of: "source" \| "trigger-object" \| slot`, `count`, `gainsHaste?`, `exileAtEndStep?`, `notLegendary?`, `basePt?: [p, t]`, `who?: "you"` — a token that's a copy of a permanent, under *its* controller by default; `who: "you"` puts it under the effect's controller instead, which is what a card copying something an **opponent** controls means (Hate Mirage). `"trigger-object"` = the permanent whose entering/attacking fired the trigger (Miirym); a slot = a target (Saw in Half). |
| `attach` | `target` (Equip-style) |
| `transform` | `target` (`"source"` \| slot) |
| `day-night` | `value: "day" \| "night"` |

### Tutors / library manipulation

| kind | fields | example |
| --- | --- | --- |
| `search-library` | `who?: { controllerOfTarget }` (Path to Exile — *its controller* searches), `filter`, `destination: "hand" \| "battlefield"`, `min`, `max`, `enterTapped?`, `restDestination?` | Demonic Tutor, Rampant Growth. `max` is an `EffectAmount`, so "up to X basic lands, where X is the number of tapped creatures you control" is a `countOf` (Harvest Season). `restDestination` sends every *chosen* card after the first somewhere else — Cultivate's "put one onto the battlefield tapped and the other into your hand" (distinct from `leftover`, which is about cards **not** chosen). |
| `scry` | `amount`, `then?` | Preordain (`then: { kind: "draw", amount: 1 }`) |
| `surveil` | `amount`, `then?` | Consider |
| `look-and-choose` | `zone: "library" \| "graveyard" \| "hand"`, `count?`, `min`, `max`, `destination`, `leftover: "bottom-random" \| "stay" \| "hand"`, `filter?`, `enterTapped?` | Ureni of the Unwritten; Genesis Ultimatum uses `leftover: "hand"` — every non-chosen looked-at card goes to hand, regardless of `filter` (needed-cards P19). **`zone: "hand"`** is the "you may put a land card from your hand onto the battlefield" family (Growth Spiral, Ghalta, Terrain Generator): `min: 0` is the "you may", `leftover: "stay"` leaves the rest of the hand alone, and it bypasses the land-drop rule because putting a land onto the battlefield is not *playing* one. **`then`** is applied once the choice is answered, with the **chosen cards as its targets** — the only way to say anything about a card that was chosen rather than targeted (Sneak Attack's "that creature gains haste"). |

### Turn structure / cast-triggered

`take-extra-turn`, `additional-combat`, `untap-all { filter, controlledByTarget? }`, `storm`,
`cascade`, `copy-spell { target }`.

### Format extras

`become-monarch { who? }`, `get-energy { amount, who? }`,
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
- **`modal { minModes, maxModes, modes: ModeOption[] }`** — "choose one" /
  "choose one or both". Each `ModeOption` is `{ text, effect }`. **A mode
  can't introduce a *new* target choice of its own** — for a modal spell whose
  modes need their own targets, use the top-level `castModal` field instead
  (mode choice happens at cast time). A mode's effect *can* reference the
  enclosing ability's own already-chosen targets (`target: 0`, same as
  anywhere else) — needed-cards P19.
- **`may { effect, prompt, cost?, then?, else? }`** — "You may [effect]". One
  optional mode; same targeting rule as `modal`. `cost` is a mana cost to say
  yes ("you may pay {B}. If you do, draw a card" — Nihil Spellbomb): the
  choice is only *offered* when it's payable, so being unable to pay and
  declining both land on `else`, and the mana is spent as the choice is
  answered (re-checked then, since the board can move in between). `then`
  applies only when `effect` was chosen ("If you do, …" — Ob Nixilis, the
  Fallen); `else` only when it was declined ("If you didn't, …", or an
  "unless" cost framed as the decline branch — Springheart Nantuko, The
  Gitrog Monster's upkeep). needed-cards P19.
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
  end, so extra turns and multiplayer order stay exact) or `"while-source"`.
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
  target-slot index holding a player, or `"trigger-controller"` (the
  controller of the permanent whose event fired the trigger). Each
  `UnlessOption` is `{ pay }` (mana), `{ payLife }` or `{ sacrifice }` plus a
  `text` label; at most one mana option, since that payment rides on the
  decision itself. Options the chooser can't take aren't offered, so
  "couldn't" and "wouldn't" both land on `otherwise` — which is what the
  printed cards do too. This is the difference from `may`: the decision is
  raised for the chooser, not the effect's controller.
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

`modal` / `may` / `look-and-choose` must be the whole effect or the **last**
step of a `sequence`.

A `CardFilter` numeric clause may be written `{ op: "eq", n: "x" }` to compare
against the `{X}` of the spell or ability applying it (Steel Hellkite: "each
nonland permanent with mana value X"). `destroy-all` also takes
`onlyControllersDamagedBySource`, narrowing to permanents whose *controller*
this effect's source dealt combat damage to this turn — a fact about the
source, so it isn't a `CardFilter` clause.

`CardFilter` (used by the mass / tutor effects) is a predicate over an object's
*computed* characteristics — `{ type, types, notTypes, typesAnyOf, subtype,
subtypes, supertype, name, colors, notColors, colorless, manaValue, power,
toughness, counters, controlledBy, ownedBy, keyword, notKeyword, tapped, token,
isCommander }`, every present clause ANDed. `attacking` asks whether the permanent is currently attacking (Kangee's
Lieutenant). `subtypes`/`typesAnyOf` are an OR
within themselves (Farseek: "a Plains, Island, Swamp, or Mountain card";
Takenuma's Channel: "a creature or planeswalker card"). Numeric fields take
`{ op: "eq"|"ne"|"lt"|"lte"|"gt"|"gte", n }`.

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
for an optional one.

Two specs are **structured** rather than strings, for the shapes the literals
stopped covering:

- `{ kind: "permanent", whose?: "any" | "you" | "opponent", filter: CardFilter }`
  — a battlefield permanent matching an arbitrary filter. "Target creature
  with flying" / "without flying" (Clan Defiance), "target Dragon you
  control", "target creature with power 4 or greater". **Prefer a string
  literal when one fits** — it reads better and most of the pool uses them;
  reach for this when spelling the shape as a literal wouldn't be reused.
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
  engine taps the first eligible ones rather than asking — see §15.

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
that fit. **Still can't produce a genuine mix in one activation from a fixed
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
- `otherOnly: true` — "…**another** target X" (Manifold Key: "Untap another
  target artifact") excludes the source permanent itself from every target
  slot's legal options. Without it, a self-referential ability like an untap
  can target itself and become a repeatable no-net-cost loop — needed-cards
  P17 caught exactly this in the fuzzer. Mirrors `TriggeredAbility`'s
  `otherOnly` (§9); there is still no generic "not this object" exclusion
  for a *triggered* ability's or spell's targets, or for a `resolve`
  script's own target choices — see §15.
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
- `zone: "hand" | "graveyard"` — activatable only from that zone, never as a
  permanent's ability, with the card *leaving* that zone an implicit,
  unconditional part of the cost (no separate `sacrifice`/flag needed). The
  ability still goes on the stack like any other. `legalActions` scans both
  zones the same way it scans the battlefield.
  - `"hand"` is **Channel** (rule 702.51a — Boseiju, Who Endures), and
    **discards** the source.
  - `"graveyard"` is "Exile this card from your graveyard: …" (Runehorn
    Hellkite), and **exiles** it. Because it's a cost, the exile happens on
    activation and stands even if the ability is countered.

  Which zone-change pays the cost is fixed per zone rather than configurable,
  matching every printed card in the pool; a graveyard ability that doesn't
  exile itself would need a separate flag.
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
| `becomes-target` | `who`, `filter?`, `byOpponentOnly?` | a permanent was chosen as a target of a spell or ability (rule 115.7 — Thunderbreak Regent). Fires as the spell/ability goes on the stack, so it triggers even if that spell is countered or later fizzles. The *player* who targeted it auto-fills the first target slot, the way `deals-combat-damage-to-player` fills it with the damaged player. |
| `becomes-tapped` | `who`, `filter?` | a permanent became tapped (rule 701.21a — City of Brass). Fires for every tapping: a mana ability, a cost that taps it, an opponent's tap effect. Not the same as `add-mana`'s `painToController`, which only charges the mana-ability path. |
| `leaves-battlefield` | `who` | a permanent leaves for **any** zone |
| `gains-life` / `loses-life` | `who` | a player's life changes (`who` = whose) |
| `attacks` | `who`, `filter?`, `attackingYou?` | a creature is declared as an attacker (`filter` narrows which one — Utvara Hellkite / Atarka, World Render: "a Dragon you control"). `attackingYou` fires only when the attack is aimed at this permanent's controller (Kazuul's "if you're the defending player") — which also covers "a creature an opponent controls", since nobody can attack themselves. |
| `attacks-alone` | `who` | Exalted (needed-cards P15) — a creature you control attacked alone this combat; the lone attacker isn't a target, read it via `ResolutionContext.triggerObject` / `EffectTargetRef: "trigger-object"` |
| `sacrifice` | `who` | a player sacrifices a permanent (Korvold, Mayhem Devil — `who` = who sacrificed) |
| `deals-combat-damage-to-player` | `who` | auto-fills the first target slot with the damaged player |
| `transforms` | `who`, `intoFront?`, `filter?` | a DFC turns over |
| `step-begins` | `step`, `who` | the start of a step (`"upkeep"` etc.) |
| `discards` | `who` | "whenever an opponent discards a card" (Sangromancer). Fires once per *discard event*, not once per card — see §15. |
| `blocks` | `who`, `filter?` | the mirror of `attacks` (Kangee, Sky Warden) |
| `dealt-damage` | `who` | the receiving end — "whenever this creature **is dealt damage**" (Brash Taunter, Hornet Nest). Combat and non-combat alike; `{ triggerValue: true }` is how much. |
| `attack-with` | `who`, `atLeast`, `filter?`, `attackingYou?` | "whenever you attack with three or more creatures" (Overwhelming Instinct, Tide Skimmer). Fires once per declaration, off the whole attacker list — an `attacks` trigger fires per attacker and can't count them. |
| `deals-combat-damage-to-player` | `who`, `filter?` | `filter` narrows on the *damaging creature* — Sharding Sphinx's "whenever an **artifact** creature you control deals combat damage to a player". The first target slot is auto-filled with the damaged player, but only if that slot can hold one. |
| `cast-spell` | `who`, `noncreatureOnly?`, `firstEachTurn?`, `filter?` | a spell is cast. `who: "opponent"` is anyone but this permanent's controller (Kaervek the Merciless); `filter` narrows on the *spell* — `{ typesAnyOf: ["instant", "sorcery"] }` for Guttersnipe. `noncreatureOnly` predates `filter` and stays, because prowess is printed as its own word. `trigger-object` is the spell, so `{ manaValueOf: "trigger-object" }` reads its mana value. |
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

If the ability has `targets`, the controller chooses them via a dispatched
`choose-targets` decision when the trigger goes on the stack. A slot the event
determines (`deals-combat-damage-to-player`) is auto-filled.

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
  control"). The last two are flags rather than a `CardFilter` because
  `staticAffects` runs on every characteristics read and is deliberately given
  no `GameState` — both are answerable from the object alone.
- `"lands-you-control"` — Chromatic Lantern.
- `"all-creatures"` — **every** creature on the battlefield, whoever controls
  it (Gravitational Shift). Takes `excludeSelf`, `subtype`, `withKeyword` and
  `withoutKeyword`; like the `creatures-you-control` narrowings these are
  flags rather than a `CardFilter`, because `staticAffects` runs on every
  characteristics read and is given no `GameState`.
- `"attached"` — the permanent this Aura/Equipment is attached to (how Auras
  grant their effect).

**Continuous-effect fields:**

- `grantPt: [p, t]` — layer 7d P/T bonus.
- `grantPtPerCount: { filter?, commanderCasts?, pt, excludeSelf? }` — a layer 7d bonus that
  *scales* with a live count (Skycat Sovereign's "+1/+1 for each **other**
  creature you control with flying"). Distinct from `setBasePtFromCount`,
  which is a CDA in layer 7b that *replaces* the printed P/T; this adds on
  top, so counters and other anthems stack with it normally. `commanderCasts:
  true` counts the times its controller has cast a commander from the command
  zone this game instead of a battlefield filter (Commander's Insignia), summed
  across a Partner pair.
- `noMaxHandSize: true` — "You have no maximum hand size" (Thought Vessel).
- `castFromGraveyard: { filter, oncePerTurn?, yourTurnOnly? }` — a permission
  to cast spells from your graveyard for their normal cost (Gisa and Geralf:
  "Once during each of your turns, you may cast a Zombie creature spell from
  your graveyard" — both gates). Offered as `via: "graveyard-permission"`.
  Unlike flashback the permission belongs to the *grantor*, so it ends when
  that permanent leaves, and nothing exiles the spell afterwards: a countered
  one goes back to the graveyard.
- `cantAttackController: true` — with `affects: { scope: "attached" }`, the
  enchanted creature "can't attack you or planeswalkers you control" (Vow of
  Duty), where "you" is the *Aura's* controller. Checked in `whyCannotAttack`
  rather than as a `CombatRestriction`, because those are bare strings and
  can't say whose "you" is meant.
  A fact about the *controller* rather than about anything the ability
  affects, so it's read straight off the battlefield at cleanup instead of
  going through the layer system; pair it with `affects: { scope: "self" }`.
- `grantKeywords: [...]` — layer 6 keyword grant.
- `grantsActivated: [...]` — give the affected permanents these activated
  abilities (Chromatic Lantern, Cryptolith Rite).
- `grantsTriggered: [...]` — the same in layer 6 for *triggered* abilities
  (Tyrant's Familiar's Lieutenant clause). Appended after the permanent's
  printed `triggered`, so a printed ability's index — which the pending
  trigger and the stack object both carry — never shifts. The one-shot
  "gains '[trigger]' until end of turn" equivalent is the `grant-triggered`
  *effect* (§6).
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

**`condition?`** (`StaticCondition`) gates the *whole* static — when false it
contributes nothing. The same union is a triggered ability's intervening-if
clause (section 9):

- `{ kind: "controls", filter: CardFilter, atLeast: number }` — Kird Ape.
- `{ kind: "opponent-controls", filter: CardFilter, atLeast: number }` — *one*
  opponent must meet the count on their own (Defense of the Heart: "if an
  opponent controls three or more creatures").
- `{ kind: "opponents-control-total", filter: CardFilter, atLeast: number }` —
  a combined count summed across *every* opponent (Turbulent Fen: "unless your
  opponents control eight or more lands" — plural "opponents" sums, unlike
  `opponent-controls`'s singular "an opponent").
- `{ kind: "your-turn" }`
- `{ kind: "threshold" }` — 7+ cards in your graveyard.
- `{ kind: "metalcraft" }` — 3+ artifacts.
- `{ kind: "opponent-lost-life-this-turn" }` — Theater of Horrors. Reads the
  per-player `lostLifeThisTurn` flag, set in `changeLife` so it catches damage
  and drain alike.
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
  counters on every zone change (`GameObject.lastKnownCounters`).
- `{ kind: "target", index, filter }` — the object in target slot `index`
  matches `filter` (Scavenging Ooze: "Exile target card from a graveyard.
  **If it was a creature card**, …"). Same restriction as `trigger-object`
  below: only meaningful inside a `conditional` effect.
- `{ kind: "trigger-object", filter }` — the object whose event fired the
  *triggered ability* currently resolving matches `filter` (Akoum Hellkite:
  "If that land is a Mountain, it deals 2 damage instead"). Only meaningful
  inside a triggered ability's `conditional` effect; always false on a static,
  which has no triggering object.

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
- `{ event: "would-create-token", multiplier }` — Doubling Season.
- `{ event: "would-add-counter", multiplier, counterKind? }` — Doubling Season.
- `{ event: "would-be-put-into-graveyard", instead: "exile", filter? }` — Rest
  in Peace / Anafenza.
- `{ event: "would-draw", who: "opponent", instead: "you-draw" }` — Notion
  Thief.
- `{ event: "would-deal-damage", multiplier }` — Dictate of the Twin Gods.
  **Symmetric and global**, unlike every other replacement here: it doubles
  damage from any source to any recipient, including its own controller's, so
  `affects` is irrelevant. Applied before prevention shields, so a shield eats
  the doubled amount.

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

If a card needs something here, it can't be authored faithfully yet — pick a
different card, or extend the engine (see `ROADMAP.md`).

**No vocabulary for:**

- Returning a card from **another player's** graveyard to a hand.
  `return-from-graveyard` covers *your own* graveyard → battlefield / hand;
  `escape` / `flashback` / `disturb` cover self-recursion of the spell itself;
  `StaticAbility.playFromGraveyard` (Ramunap Excavator) lets you *play*
  matching cards from your graveyard. Reaching **any** graveyard is fine for a
  *targeted* effect — the `card-in-graveyard` target spec plus
  `put-onto-battlefield` (Reanimate's shape) or `put-on-library`.
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
- **Mana provenance / restricted spend.** No effect tracks what a specific unit
  of mana was later spent on — "if that mana is spent on a Dragon spell, it
  gains haste" (Carnelian Orb of Dragonkind) and "spend this mana only to cast
  a Dragon spell" (Haven of the Spirit Dragon, Temple of the Dragon Queen,
  Path of Ancestry) are both unmodeled (needed-cards P18). The related
  "**you don't lose this mana** as steps and phases end" (Savage Ventmaw) is
  unmodeled for the same reason. Note that the *identity* clause alone is not
  a blocker: "one mana of any color in your commander's color identity" is
  modelled as plain `"any-color"` (`arcane-signet.ts`, `commanders-sphere.ts`),
  which is exact for any deck that passes `validateCommanderDeck` — every card
  the mana could be spent on is already inside that identity.
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
- **No "put card(s) from hand onto the battlefield" effect** — every mass
  cheat-into-play effect (`search-library`, `look-and-choose`) sources from a
  library or graveyard, never a hand (Last March of the Ents, Spelunking,
  Broodcaller Scourge) (needed-cards P18).
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
- **"As this enters, choose …" only fires when the permanent is *cast*.**
  Both `chooseCreatureTypeOnEnter` and `chooseOnEnter` hang off the
  permanent-spell resolution path, so a copy, a reanimation or a
  `debugSpawn` never raises the choice and the permanent behaves as though
  nothing was chosen.
- **Bestow** (rule 702.103 — Springheart Nantuko), **Eternalize** (rule
  702.129 — Fanatic of Rhonas), **retrace** (rule 702.83 — Six), **riot**
  (rule 702.152 — Rhythm of the Wild), **Hideaway** (rule 702.104 — Mosswort
  Bridge), and **Station** (rule 702.171 — Exploration Broodship and others)
  are unmodeled alt-cast / ETB-choice mechanics (needed-cards P18).

**Partial:**

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
- **`proliferate`** always proliferates everything eligible (no "choose any
  number"), **`populate`** copies the largest creature token you control
  rather than letting you pick, and **`tapOthers` / `alternativeCost`** tap
  the first eligible permanents rather than asking which. All are *choice*
  simplifications rather than outcome ones, and each only bites when the
  candidates differ in some way the card itself doesn't care about.
- **`AffectSpec.withKeyword` matches printed keywords only.** `staticAffects`
  runs on every characteristics read and is deliberately given no
  `GameState`, so it can't do the layer fold — a creature that has the keyword
  only from another effect is missed (Sephara's "other creatures you control
  with flying").
- **Additional costs** are `sacrifice` (a `CardFilter`), `discard` (a count)
  and `payLife` (a count) — several may be set and all are paid. Not yet: a
  *choice* between two of them ("discard a card **or** pay 3 life" — Bitter
  Triumph), an "exile a card from your graveyard" form, or a cost whose
  amount the caster picks ("pay X life" — Toxic Deluge). **Kicker** is a
  single optional cost (no multikicker, no two different kickers on one card).

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
