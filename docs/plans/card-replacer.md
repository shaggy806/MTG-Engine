# Card replacer (import a decklist, auto-substitute what's missing)

Status: **implemented, reworked 2026-09-16** to match on Scryfall Tagger oracle tags and the destination deck (see the last section) — see `engine/src/card-replacer.ts`, `server/src/import-deck.ts`'s
`suggestedReplacement` field and commander-section-aware `parseDecklistText`, and the deck
builder's new import panel (`client/src/deck-builder/DeckBuilderPage.tsx`). This file is the
design record kept for future reference, not living documentation — see `CLAUDE.md` for current
architecture.

Last of the five long-term features from `docs/plans/basic-bots.md` (bots, the card-library page,
and the deck builder shipped first — see their own design docs). The user's framing: "basically
the deck builder but with the import feature implemented and an automatic replacer of any cards
that haven't yet been implemented."

## Stand-ins are chosen jointly, not one at a time

Singleton means a card can only stand in once, so when two missing cards suit the same
replacement they are competing for it. The original implementation walked the decklist and let
each card claim its own favourite, marking it used — which makes the result depend on **decklist
order**, and picks the wrong winner whenever the contested card matters more to the loser.

The case, with one stand-in that suits two missing cards:

| | best | second best |
|---|---|---|
| missing A | shared card, 0.55 | 0.25 |
| missing B | shared card, 0.60 | 0.40 |

First-come-first-served gives the shared card to whoever appears earlier. Giving it to **B** — the
card that scores it higher — totals 0.60 + 0.25 = 0.85. Giving it to **A** totals 0.55 + 0.40 =
**0.95**, because B had somewhere decent to go and A did not. *The card that should win a
contested stand-in is the one with the most to lose, not the one with the highest score.*

`assignReplacements` in `engine/src/card-replacer.ts` solves this as what it is — the assignment
problem — with the Hungarian algorithm over a cost matrix of every target against every candidate
anyone suggested. Exact rather than the regret heuristic the example above suggests, because
regret-greedy gets this two-card case right and still loses on longer chains, where taking a card
from A pushes B onto C's choice and so on. At deck sizes it is free: a hundred missing cards
against a few hundred candidates is microseconds, and `suggestReplacements` already scores every
implemented card and throws all but the top few away, so the deeper candidate lists the assignment
needs cost nothing.

Commanders are assigned as a separate group, since their candidates are restricted to cards that
can legally be one and the two pools barely overlap.

Each target keeps its own ranked alternatives for the deck builder to offer, with the *chosen*
stand-in moved to the front — it is deliberately not always the highest-scoring one, which is the
entire point, so it cannot be assumed to be there already.

## Key architectural finding

`/import-deck` (`server/src/import-deck.ts`) was explicitly a **feasibility report only** — paste
a decklist, see which cards the engine already implements, get Scryfall data for the rest. Its
own copy said "This doesn't start a game." There was no path from an imported list to a playable
deck. Confirmed with the user: the old standalone, report-only "Import a decklist" lobby screen
(`ImportDeckScreen`) is retired outright — importing now only happens inside the deck builder,
where it produces a real, saved, immediately-playable deck instead of just a report.

The other finding: every unimplemented card `evaluateDecklist` already looks up on Scryfall comes
back with a real mana cost and type line in exactly the notation the engine's own
`parseManaCost`/`manaValue` already parse (`{2}{G}{G}`-style) — so matching an unimplemented card
against the pool needed no new data source, just a scoring function over data already on hand.

## 1. Engine: `card-replacer.ts`

Pure, synchronous, alongside `deck-validation.ts` for the same reason (no I/O, needed by both a
future client-side use and the server). `parseTypeLine` turns a plain type line ("Legendary
Creature — Elf Warrior") into supertypes/types/subtypes — the mirror image of `import-deck.ts`'s
existing `localTypeLine`, which goes the other way for a card the engine already has.
`suggestReplacement` scores every `BUILTIN_CARDS` entry against an unimplemented card's type line
and mana cost: **sharing at least one primary type is a hard filter** (never suggest a spell for
a permanent or vice versa), then ranks by mana-value closeness, a penalty for extra/missing types
on either side (so a plain artifact target prefers a plain artifact over an artifact creature at
the same cost), colour overlap, and a subtype-match tiebreaker bonus.

Deliberately not a rules computation — "colour" here is read off the target's own mana-cost pips
only, not a full rule-903.4 colour-identity fold (which needs a `CardDefinition` to walk rules
text an unimplemented card doesn't have). A suggestion that ends up outside some deck's commander
identity still surfaces as an ordinary violation in the deck builder's existing legality panel —
nothing is silently wrong, it just isn't pre-filtered per-deck. Verified live: a Fellwar-Stone
import correctly suggested Arcane Signet (both 2-mana artifacts that tap for coloured mana).

## 2. Server: suggestions + commander-section awareness

`evaluateDecklist` calls `suggestReplacement` for every unimplemented, Scryfall-found card and
adds it to `CardReportEntry.suggestedReplacement`. Separately, `parseDecklistText` became
section-aware: real exports (Moxfield included) mark the commander with an explicit "Commander"
header rather than leaving it to be guessed, so the parser now also returns which card name(s)
followed one. `formatCheck` prefers this explicit commander over its old "first implemented
legendary creature/planeswalker" guess, falling back to the guess only when the pasted text had
no such section. An explicit commander that isn't implemented is still reported *as* the
commander (an honest "not implemented" violation) rather than silently guessing a different
card — the deck builder's import flow is what actually repairs it, by substituting the same
`suggestedReplacement` mechanism onto the commander slot too.

## 3. Client: import lives in the deck builder

A new "Import" action next to "+ New" in the deck builder's "My decks" list opens a paste panel
(`ImportPanel`, reusing the retired `ImportDeckScreen`'s textarea/POST pattern moved here). On
success it resolves the final card list client-side — an implemented entry keeps its name, an
unimplemented one with a suggestion uses that name instead, anything with no match (or not found
on Scryfall — a typo, say) is dropped — calls `decks.ts`'s new `createDeckFromImport`, and opens
the result in the ordinary editor with a one-time, dismissible report banner above it (N as-is, M
substituted with the before → after list, K dropped). From there it's just an ordinary saved
deck, indistinguishable from a manually-built one, including being playable through a real room
exactly the same way (verified live end to end: import → substitutions applied → deck active →
room created → waiting room → promoted → opening hand matches the imported/substituted list).

## Non-goals for v1 (explicitly deferred)

- Suggestions aren't filtered against the importing deck's own commander colour identity (see
  above) — a resulting off-colour pick surfaces as an ordinary legality violation instead.
- No manual "pick a different suggestion" control in the report — the substitution is applied
  automatically; swapping it for something else means editing the resulting deck normally.
- Multiple commanders (Partner) are parsed from the section header, but the deck builder's own
  editor only supports one commander slot (same limitation the deck builder itself already has).

## Weaknesses found in use (2026-09-16) — input for a future rework

The user intends to substantially improve the replacer later; not scheduled yet. Recorded here
because they surfaced concretely while choosing substitutions for the five Starter Commander
Decks, and the second one is **not** covered by the non-goals above.

1. **Colour identity is ignored** (a known v1 non-goal, now with a live example):
   `Sarkhan, the Dragonspeaker` (mono-red, in a Gruul deck) → `Elspeth, Sun's Champion`
   (white). The suggestion is off-identity for the deck it would land in.
2. **Singleton is ignored, and it's not a listed non-goal.** `Trostani Discordant` →
   `Maja, Bretagard Protector` — a card *already in the same decklist*. The suggester scores
   against the whole pool with no notion of what the destination deck already holds, so it can
   propose a duplicate that `validateCommanderDeck` then rejects.

Both stem from the same design choice: `suggestReplacement({ manaCost, typeLine })` sees only the
missing card, never the deck. A rework would most naturally take the destination deck (its
commander's identity and its current contents) as input and filter before scoring, rather than
leaving both to surface afterwards as legality violations.

Because of this, the precon substitutions were hand-picked rather than generated.

## Exploration: Scryfall Tagger oracle tags (2026-09-16)

Goal from the user: stand-ins that **mimic the original's role**, not just its type line and cost —
using Scryfall Tagger's community "oracle tags" (`removal-creature`, `sweeper`, `tutor-land-basic`,
`repeatable-card-advantage`, …) as the functional signal. Prototype scripts live in the git-ignored
`.scratch/tagger/` (`fetch-tags.mjs`, `score.mjs`); nothing here is shipped.

### Getting the data

- **The official API can search *by* tag but can't list a card's tags.** `q=otag:removal` (alias
  `oracletag:`) works on `api.scryfall.com/cards/search`; card objects carry no tag field, and bulk
  data has none.
- **A card's tags are only exposed by Tagger's own GraphQL endpoint** (`tagger.scryfall.com/graphql`,
  `cardBySet(set, number) { taggings { tag { slug type ancestorTags } } }`), which needs a CSRF token
  scraped from a Tagger page. It is undocumented and not part of Scryfall's API. The prototype used it
  once, politely (~660 requests at ~1/s, cached), and a shipped feature should not depend on it.
- **Tags form a hierarchy**: each tag lists its ancestors (`sweeper-one-sided` → `sweeper`,
  `removal`). The public catalog (`scryfall.com/docs/tagger-tags`) is a flat list of **5,361** oracle
  tags, **1,762** of them `cycle-*` bookkeeping. Tagger's `category` flag only marks umbrella tags; it
  does not separate functional tags from trivia.
- Across the 658 cards fetched (the whole pool plus the 44 precon originals): **6.3 oracle tags per
  card** on average, **1,017** distinct tags, **442** of them on a single card.

### Prototype and result

For each of the 44 precon substitutions: candidates are pool cards inside the commander's identity
and not already in the deck. Score = 0.6 × tag similarity (IDF-weighted cosine; a tag implied only by
an ancestor counts half) + 0.25 × primary-type match + 0.15 × mana-value closeness. Compared against
the hand picks in `sample-decks.ts`:

| | hand pick ranked #1 | top 3 | top 10 |
|---|---|---|---|
| raw tags | 11/44 | 18/44 | 33/44 |
| non-functional tags filtered | 11/44 | 17/44 | 31/44 |

Agreement with the hand picks is only a rough yardstick (several tag picks are arguably better — Bident
of Thassa → Thieving Magpie over Behold the Multiverse). What the per-card output shows:

- **Strong where the tags name the job.** Myriad Landscape → Evolving Wilds / Terramorphic Expanse
  (tag similarity 0.77); Scythe Specter → Hypnotic Specter; Soul Shatter and Syphon Flesh → Diabolic
  Edict; Combustible Gearhulk → Demanding Dragon (both `punisher` + `opponent-chooses`); Coveted Jewel →
  Hedron Archive; Dredge the Mire → Victimize; Deadly Tempest → Chain Reaction / Damnation.
- **Trivia tags pollute it.** `alliteration`, `hellbending`, `fun-ruling`, `personal-text`,
  `eponymous-planeswalker`, `cycle-*`, `typal-*`, and their ancestors (`card-names`, `type-errata`) are
  rare, so IDF weights them heavily. A hand-built denylist of ~60 such roots removed the obvious false
  matches but didn't move the numbers much — the remaining misses are structural.
- **Shared mechanic, different role.** Scourge of Nel Toth (7-mana 6/6 flier) → Baithook Angler
  (2-mana 2/1), because both are `castable-from-graveyard`; Savage Ventmaw (6-mana Dragon) → Lotus Cobra
  (both add mana). Tags describe *what a card does*, not *what slot it fills* — a big evasive finisher
  isn't tagged as one.
- **Sparse tagging.** Angler Turtle has one functional tag (`force-attacker`); Jubilant Skybonder's are
  mostly trivia. With no tag overlap the score falls back to type and cost, i.e. today's replacer.
- **No close match in the pool.** Sunbird's Invocation, Wild Ricochet, Wildfire Devils, Diluvian
  Primordial: every candidate's tag similarity is under ~0.2. That low score is itself useful — it is
  exactly when a person should be shown options rather than a silent pick.
- **Power level is invisible** to all of it (Reign of the Pit → Necrotic Hex).

### Recommended design, if pursued

1. **Take the destination deck as input** — commander identity and current contents — and filter
   before scoring. Needed regardless of tags; it's the two weaknesses above.
2. **Curate a tag allowlist rather than a denylist.** A few hundred functional tags (removal, sweeper,
   edict, counterspell, tutor, ramp, draw engine, recursion, reanimation, tokens, anthem, evasion,
   protection, sacrifice outlet, punisher, …), each also covering its descendants. That's the "which
   tags" question, answered once, and it keeps trivia out by construction.
3. **Build the index from the official API only, offline.** For each allowlisted tag, page through
   `oracletag:<tag>` and record which cards carry it. That yields tags for *every* card — including
   whatever someone imports — without the undocumented endpoint. Checked in (or cached server-side) and
   regenerated occasionally, like `creature-types.ts`. Cost scales with the allowlist; broad tags like
   `removal` run to many pages, so it's a minutes-long one-off job, not a per-import call.
4. **Score function and slot together.** Tags for function; for creatures, add body (P/T, evasion
   keywords) and a steeper mana-value penalty so a finisher stays a finisher.
5. **Report confidence and alternatives.** Offer the top 3 with their shared tags ("both: sweeper,
   removal-destroy"), and flag low tag similarity instead of silently substituting.

## Implemented: tag-aware, deck-aware replacer (2026-09-16)

The recommended design above, built:

- **Allowlist** — `server/data/oracle-tags/allowlist.txt`, 261 functional tags grouped by role
  (removal, interaction, protection, card advantage, mana, lands, graveyard, tokens, combat,
  sacrifice/life, copying/stealing). Editable; the generator refuses a slug that isn't on Scryfall's
  public tag list, since search answers an unknown tag exactly like an empty one (and some tags shown on
  Tagger — `create-token`, `token-generator` — aren't searchable at all).
- **Index** — `server/data/oracle-tags/index.json` (~200 KB), built by
  `npm run gen:oracle-tags -w server` from one paged `oracletag:<slug> legal:commander` search per tag:
  29,534 of 31,830 Commander-legal cards carry at least one allowlisted tag. Official API only.
  Slow — ~2 s a page, 1,102 requests, most of an hour — so it's checked in and regenerated when the
  allowlist changes, not per import. A parent tag's search includes its children, so listing both a
  broad tag and its specific children gives graded credit without storing the hierarchy.
- **Scoring** (`engine/src/card-replacer.ts`, `suggestReplacements`) — IDF-weighted cosine over shared
  tags; type, mana value and (creatures) P/T plus combat keywords. When the original has tags they
  lead (0.6 of a noncreature's score, 0.5 of a creature's). Mana value also scales the whole score
  (×0.7 at three or more apart), and a card of a different primary type needs tag similarity ≥ 0.5
  and ranks ×0.8 — both set from the evaluation below, where their absence let a 7-mana flier be
  replaced by a 2-drop sharing a graveyard mechanic, and sorceries by creatures and trinkets.
- **Deck-aware** (`server/src/import-deck.ts`) — suggestions stay inside the commander's identity
  (from Scryfall's `color_identity` when the commander itself is unimplemented), never repeat a card
  the list has or another card's first choice, and a commander's stand-in is a legal commander.
- **Client** — each substitution in the import report has a picker over the top three (a card already
  in the deck is disabled, and the swap handler refuses it too), a match-strength badge
  (Close / Partial / Loose from tag similarity ≥ 0.45 / ≥ 0.2 / less, or Loose when the original has
  no tags) and the tags the two share.

### Result on the five precons

The 44 substitutions again, now through the shipped code with the real index, deck-aware:

| | hand pick is #1 | hand pick in top 3 | first choice confidence (high / medium / low) |
|---|---|---|---|
| shipped scoring | 10/44 | 18/44 | 14 / 15 / 14 |

Agreement with the hand picks stays a weak yardstick; reading the picks is the real check. Clear role
matches: Myriad Landscape → Evolving Wilds (0.88), Sepulchral Primordial → Gravespawn Sovereign, Soul
Shatter → Diabolic Edict, Coveted Jewel → Hedron Archive, Syphon Mind → Mind Rot, Haven of the Spirit
Dragon → Buried Ruin, Scourge of Nel Toth → Inspired Sphinx, Savage Ventmaw → Lathliss, Foe-Razer
Regent → Old Gnawbone. The low-confidence first choices are the cards nothing in the pool does
(Sunbird's Invocation, Wild Ricochet, Curse of Bounty, Angler Turtle, Havengul Lich) — which is what
the badge is for. Remaining judgement calls rather than errors: Necromantic Selection → Rakshasa
Debaser (both put opponents' creatures onto your battlefield) over Damnation; Ob Nixilis Reignited →
Greed (the draw half) with no black-red planeswalker to offer.
