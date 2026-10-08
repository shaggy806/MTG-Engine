# Upgraded precons for the bots

Status: **shipped, first pass** (2026-10-07). `engine/src/sample-decks.ts`'s `UPGRADED_DECKS`:
the five Tarkir: Dragonstorm precons as players upgrade them. A room picks which pool its bots
are dealt from (`RoomSettings.botDecks`, "Bot decks" under Room settings); a blitz deals from
the upgraded pool; the deck builder and the deck pickers offer them as starter decks
(`STARTER_DECKS`). Temur Roar's upgrade measured far stronger; the other four within noise of
their precons, two of them a shade under (below).

## Why

The bots play the precons, whose mana bases are mostly tapped lands (Temples, gain lands,
Evolving Wilds, Path of Ancestry) with few untapped duals or fetches. The user asked for
stronger decks (2026-10-07), and chose: upgraded precons rather than EDHREC average decks or
tuned lists; a lobby choice rather than replacing the precons; five to start.

## Where the lists come from

**EDHREC's precon pages** (`json.edhrec.com/pages/precon/<name>.json`, fetched 2026-10-07)
list what players add to and cut from their copies, most-played first: "Cards to Add", "Lands to
Add", "Cards to Cut", "Lands to Cut". Each upgrade takes, in order:

- **18 spells**: the top adds the engine implements, for the top cuts (spell for spell).
- **13 lands**: EDHREC's lands to add, then the shocks, fetches, triomes and other untapped
  duals that the commander's own EDHREC page shows its decks running, for its lands to cut (land
  for land, so the land count holds).

Left out on purpose: the Reserved List duals and the costliest utility lands (Ancient Tomb,
Cavern of Souls, Gaea's Cradle, Cabal Coffers), which make it a tuned deck rather than an
upgraded precon, and modal lands the bots wouldn't use (Sink into Stupor, Boseiju).

**Moxfield was the other candidate** (the user's suggestion): its most viewed upgrade of each
precon, and one author's "Expensive Upgrade" series covering all five. Read through Moxfield's
own page (its API refuses scripts), they need 7-15 stand-ins each for cards the engine doesn't
run yet, and they mostly keep the precons' tapped lands, spending on tutors and fast mana
(Demonic Tutor, Smothering Tithe, Mana Drain, Ancient Tomb). They served as a cross-check: many
EDHREC adds appear there too (Miirym, Terror of the Peaks, Tree of Perdition, Betor, Caesar,
Hinata).

Every list is checked by `sample-decks.test.ts`: 100 legal cards, every card implemented, the
commander's colour identity, singleton, and each swap land for land or spell for spell.

## What it measured

`node engine/scripts/deck-winrates.mjs --pool upgraded --rounds 12 --bot v2` — the five precons
and their five upgrades, v2 in every seat, 4-player tables, 120 games, 48 per deck (95% intervals
about ±10 points):

| Deck | Upgraded | Precon |
|---|---|---|
| Temur Roar | **68.8%** | 35.4% |
| Abzan Armor | 22.9% | 18.8% |
| Mardu Surge | 20.8% | 16.7% |
| Sultai Arisen | 16.7% | 20.8% |
| Jeskai Striker | 8.3% | 14.6% |

The upgrades won 66 games to the precons' 51. Temur's gain is far outside the noise; the rest
overlap their precons, and Temur at 69% depresses every other deck's rate. One Jeskai (Upgraded)
loss read through `deck-autopsy.mjs` (seed 11) was a double mulligan and missed land drops, not
its cards.

## Open

- **Sultai and Jeskai (Upgraded) didn't measure stronger** (`BACKLOG.md`, Bots). Next: more
  rounds for tighter intervals, then autopsies of their losses for cards the bots misuse (Jeskai
  added three counterspells and cut both its sweepers; Sultai traded big bodies for graveyard
  engines: Reanimate, Dread Return, Tortured Existence, Insidious Roots), and revised swaps.
- **The bench decks** are still precons. Whether an upgraded deck joins `BENCH_DECKS` is a
  separate call, once a deck-against-deck run shows it holds its own.
