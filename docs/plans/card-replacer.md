# Card replacer (import a decklist, auto-substitute what's missing)

Status: **implemented** — see `engine/src/card-replacer.ts`, `server/src/import-deck.ts`'s
`suggestedReplacement` field and commander-section-aware `parseDecklistText`, and the deck
builder's new import panel (`client/src/deck-builder/DeckBuilderPage.tsx`). This file is the
design record kept for future reference, not living documentation — see `CLAUDE.md` for current
architecture.

Last of the five long-term features from `docs/plans/basic-bots.md` (bots, the card-library page,
and the deck builder shipped first — see their own design docs). The user's framing: "basically
the deck builder but with the import feature implemented and an automatic replacer of any cards
that haven't yet been implemented."

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
