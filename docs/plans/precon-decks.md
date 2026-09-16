# Real precon decks for the bots

Status: **in progress** — replacing `engine/src/sample-decks.ts`'s four hand-curated 60-card
lists with the five 2022 **Starter Commander Decks** (MTGJSON set code `SCD`), faithfully.

## Why

`SAMPLE_DECKS` was built to exercise engine features, and says so: 60 cards instead of 100,
colour identity deliberately ignored, singleton ignored. That was fine when its only jobs
were "a fallback deck for a seat nobody brought one to" and "a starter deck in the deck
builder". It stops being fine the moment bot games become *training data* — tuning an
evaluation function against decks that aren't legal Commander optimises for a format that
doesn't exist (see `docs/plans/smarter-bots.md`). Legal, coherent decks are a prerequisite
for that work, not a follow-up.

The 2022 Starter Commander Decks are the right target: they are WotC's own
deliberately-simple beginner precons, one per colour pair/wedge, all 100 cards, and their
power level is even across the five — which is what makes a bot-vs-bot result mean
something.

| deck | commander | new cards needed |
|---|---|---|
| Draconic Destruction | Atarka, World Render | 53 |
| Chaos Incarnate | Kardur, Doomscourge | 57 |
| First Flight | Isperia, Supreme Judge | 60 |
| Token Triumph | Emmara, Soul of the Accord | 60 |
| Grave Danger | Gisa and Geralf | 61 |

## Scale

**286 unique cards**, and they barely overlap — only two cards appear in more than one deck.
For scale, the entire existing pool is 384. Decklists come from MTGJSON
(`https://mtgjson.com/api/v5/decks/<Name>_SCD.json`), which carries `manaCost`, `colors`,
`supertypes`/`types`/`subtypes`, `power`/`toughness`/`loyalty`, `keywords`, `text` and a
`scryfallId` per card — so the structural half of every card file can be generated exactly
rather than transcribed, and `card:verify` should pass on the first run.

## Triage

Every one of the 286 was checked against §15 of `cards/AUTHORING.md` before any authoring
started, because the alternative — discovering the gaps one card at a time — ends in a pile
of quietly-approximated cards, which is the one outcome worth avoiding here.

| | count |
|---|---|
| authorable with today's vocabulary | **208** |
| needs one of ten named mechanics | **18** |
| blocked on a documented engine limitation | **60** |

### Named mechanics (18 cards)

`Amass` (6), `Lieutenant` (3), damage doubling (2), and one card each for `Goad`, `Boast`,
landcycling/typecycling, `Undying`, Fear/Intimidate, `Undergrowth`, `Populate`.

`Lieutenant` may already be expressible — `CardFilter` has an `isCommander` clause, so
"as long as you control your commander" is a `{ kind: "controls", filter: { isCommander:
true, controlledBy: "you" }, atLeast: 1 }` static condition. The blocker for *Tyrant's
Familiar* specifically is the other half of its ability (granting a triggered ability),
which is in the table below.

### Engine limitations hit (60 cards)

Ordered by how many cards each unblocks — the first two are worth doing on their own.

| gap | cards | notes |
|---|---|---|
| optional / "up to N" targets | 17 | AUTHORING §15, needed-cards P18. A declared target slot can't be left empty today. Single biggest unlock. |
| targets a card in a graveyard | 12 | P18. Needs a `TargetSpec` family beyond `"instant-or-sorcery-in-your-graveyard"`. |
| "you may pay {X}" inside a trigger | 7 | An optional cost during resolution. |
| reads a target's mana value | 4 | `EffectAmount` can't say "that permanent's mana value". |
| reveal-a-card-from-hand land | 4 | `tappedUnless` is a board check; these read the hand. |
| ability usable from the graveyard | 3 | `zone: "hand"` exists (Channel); `"graveyard"` doesn't. |
| "unless that player …" | 3 | No punisher/either-or vocabulary. |
| cast from exile / impulse draw | 3 | |
| each player draws / discards | 3 | §15: no "each opponent draws" scope. |
| "draw that many cards" from damage | 3 | |
| "becomes the target of a spell" trigger | 2 | |
| choose a mode as it enters | 2 | §15, explicitly unmodeled (Frontier Siege). |
| mana provenance / restricted spend | 2 | §15, explicitly unmodeled (Path of Ancestry). |
| conditional on the trigger object's type | 1 | Akoum Hellkite's "if that land is a Mountain". |
| grants a triggered ability | 1 | Tyrant's Familiar. |
| "activate only once each turn" | 1 | Steel Hellkite. |
| multi-destination tutor | 1 | §15, Cultivate. |

Doing just **optional targets** and **graveyard-card targets** unblocks 29 of the 60.

**Refined in `docs/plans/engine-gaps.md`**, which is the implementation plan for these and
corrects two over-broad rows above: "up to N" inside a *search* is already expressible
(`search-library` takes `min`/`max`), and Lieutenant is already expressible
(`CardFilter.isCommander`). That moves four cards out of "blocked" before any code.

## Order of work

1. **Engine features**, biggest-unlock first, each with its own test — optional targets,
   graveyard-card targets, then down the table. Some at the bottom (mana provenance,
   choose-a-mode-on-enter) may be judged not worth it; a card that stays blocked is
   recorded here rather than approximated.
2. **The ten named mechanics.**
3. **Card authoring, one deck at a time**, cheapest first (Draconic Destruction), each deck
   landing as its own commit with `gen:cards` + `card:verify` + the fuzzer run over it.
4. **Swap `SAMPLE_DECKS`**, replacing all four old lists. Both consumers (`server/src/decks.ts`'s
   `SEATS`, the deck builder's starter decks) pick the change up for free.
5. **Re-benchmark the bots** on legal decks, which is the point of the exercise.

## Non-negotiable

Every card is a real Magic card with its real Oracle behaviour, or it isn't added. A card
that can't be authored faithfully stays on the blocked list above and its slot is left for
the engine work that unblocks it — never silently approximated. `card:verify` covers the
structural half; the behavioural half is on review.
