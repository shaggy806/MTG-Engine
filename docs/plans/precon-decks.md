# Real precon decks for the bots

Status: **shipped, with substitutions** (2026-09-30) — `engine/src/sample-decks.ts` is the five
**Tarkir: Dragonstorm Commander** decks (MTGJSON set code `TDC`, 2025). 423 of the 495
non-commander slots are the printed cards; the other 72 are cards the engine doesn't implement
yet, played by stand-ins listed under [Substitutions](#substitutions) below (147 at the swap;
TDC batch 1 authored 41, batch 2 — casting a spell as another resolves — 8, Shiko and Narset, Unified 1, and Jeskai batch 3 — copies with new targets, storm on an Aura — 5, and batch 4 — countering an ability, a three-way look, "unless they discard a land", an attack count rechecked — 4, then Lier 1, and an attack tax for Ghostly Prison 1, split cards and divided damage 2, then delve and attacking despite defender 4, Hero of Bladehold 1, then the 2026-10-02 features pass 5 — Myriad Landscape, Chaos Warp, Curse of the Swine and two hideaway lands, then the 2026-10-03 mana-and-exile pass 2 — Thundermane Dragon's cast from the top and Grenzo, Havoc Raiser's any-colour spending). Authoring the rest is the current card priority (`BACKLOG.md`, "Card
backlog"); `engine/data/sweep-3/TDC*.json` and the earlier sweep records name what each needs.

From 2026-09-16 to 2026-09-30 the decks were the five 2022 Starter Commander Decks (`SCD`),
down to 40 stand-ins by then; their lists and substitution tables are in git history
(`git show e00312f6:engine/src/sample-decks.ts`, and this file at that commit).

## Why

`SAMPLE_DECKS` was built to exercise engine features, and says so: 60 cards instead of 100,
colour identity deliberately ignored, singleton ignored. That was fine when its only jobs
were "a fallback deck for a seat nobody brought one to" and "a starter deck in the deck
builder". It stops being fine the moment bot games become *training data* — tuning an
evaluation function against decks that aren't legal Commander optimises for a format that
doesn't exist (see `docs/plans/smarter-bots.md`). Legal, coherent decks are a prerequisite
for that work, not a follow-up.

The decks are WotC's own precons, one per colour wedge, all 100 cards and built to play
against each other — which is what makes a bot-vs-bot result mean something. The user chose the
Tarkir: Dragonstorm decks to replace the 2022 Starter Commander Decks as the bots' defaults on
2026-09-30.

| deck | commander | plan | cards left to author |
|---|---|---|---|
| Temur Roar | Ureni of the Unwritten | Dragons, dug out of the library by Ureni | 19 |
| Sultai Arisen | Teval, the Balanced Scale | self-mill, lands and creatures back from the graveyard | 25 |
| Abzan Armor | Felothar the Steadfast | walls and toughness, dealing damage by toughness | 15 |
| Mardu Surge | Zurgo Stormrender | attacking tokens, cashed in as they leave | 12 |
| Jeskai Striker | Shiko and Narset, Unified | instants and sorceries, prowess, Monk tokens, spells copied | 3 |

All five commanders are implemented, and no missing card is missing from more than one deck.
`server/src/decks.ts`'s `SEATS` takes the first four for its seats (and every bot's deck), so
Jeskai Striker plays only from the deck builder's starter decks and the bot tooling, which seats
from all five (`engine/scripts/bot-seating.mjs`). Bot benchmark numbers from before the swap
don't compare with ones after it.

## Order of work

1. **Author the 147 cards**, deck by deck, building the engine features they need, under the
   same rule zero as every other card (`cards/AUTHORING.md` §0). Each authored card's
   substitution is deleted as it lands; `sample-decks.test.ts` fails until it is.
2. A card that can't be run exactly stays a stand-in, recorded with the feature it needs.
3. **Re-benchmark the bots** on the new decks.

## Non-negotiable

Every card is a real Magic card with its real Oracle behaviour, or it isn't added. A card
that can't be authored faithfully keeps its stand-in, and its slot is left for the engine work
that unblocks it — never silently approximated. `card:verify` covers the
structural half; the behavioural half is on review.

## The other nine (2026-10-02)

`SAMPLE_DECKS` also holds nine more precons, as starter decks for players and bot seats, not
for the bot benchmarks (only decks flagged `bench`, the five above, are in `BENCH_DECKS`, which
the bot tooling seats). They were picked by ranking MTGJSON's 199 Commander decks (175 once
reprints are folded) by how many cards the pool already had: the five 2022 Starter Commander
Decks (Draconic Destruction 3 stand-ins, Token Triumph 1, First Flight 4, Grave Danger 6, Chaos
Incarnate 14 — their old stand-ins, from when they were the defaults) and the four nearest
complete after them (Tramplesaurus Rex 9, Family Matters 11, Reign of Dragons 11, World Shaper
12). The new decks' stand-ins were chosen by role, card type and mana value from cards a precon
would run, not the format's top staples (a Demonic Tutor or Rhystic Study would make a deck
stronger than it is), so a deck's win rate under identical bots says something about the
printed deck. The substitution tables are in `sample-decks.ts` itself; what blocks each
original is in `engine/data/sweep-3/PC-*.json`.

## Substitutions

**How it's recorded.** Each deck in `sample-decks.ts` keeps its `printed` list exactly as printed,
plus a `substitutions` table of `{ original, substitute, reason }`. `cards` — what's actually
played — is `printed` with those swaps applied. The printed list is never edited, so it stays the
record of what the real deck is. An Omen card is named by its creature face, as an Adventure card
is (Stormshriek Feral); a split card by both halves (Expansion // Explosion).

**How each stand-in was picked.** A first pass with the decklist import's replacer
(`assignReplacements` in `engine/src/card-replacer.ts`, over Scryfall oracle tags, inside the
commander's colour identity, never a card already in the deck, the whole deck assigned jointly),
then reviewed by hand, overriding it wherever the deck's plan needs something it can't see: a
Dragon for every Dragon in Temur Roar, since Ureni digs for them; walls, defenders and
toughness payoffs in Abzan Armor (Doran, the Siege Tower for Assault Formation); attacking
token makers in Mardu Surge; and a few role mismatches (a counterspell for Sublime Epiphany, a
removal spell for Lethal Scheme). Every substitute:

- is inside the commander's colour identity,
- isn't already in that deck (singleton), and
- fills the original's role at a similar mana value.

**Reverting one.** Once an original is implemented, delete its entry from that deck's
`substitutions` table — nothing else changes. `engine/src/test/sample-decks.test.ts` enforces this:
it fails for any substitution whose original is now registered, and checks every deck is a legal
100-card Commander deck of implemented cards with exactly its table's swaps applied.

The tables below mirror `sample-decks.ts` at the time of the swap; the code is authoritative.

### Temur Roar — Ureni of the Unwritten (20)

| printed card | plays as | why |
|---|---|---|
| Deceptive Frostkite | Sprite Dragon | Two-mana blue flying Dragon. |
| Dragonlord Atarka | Drakuseth, Maw of Flames | Seven-mana legendary Dragon that burns as it attacks. |
| Glorybringer | Terror of the Peaks | Five-mana red flying Dragon that removes creatures. |
| Hellkite Courser | Rorix Bladewing | Six-mana red flying Dragon with haste. |
| Leyline Tyrant | Archwing Dragon | Four-mana red flying Dragon. |
| Opportunistic Dragon | Skyship Stalker | Four-mana red flying Dragon. |
| Reality Shift | Resculpt | Two-mana instant: removal, creature removal. |
| Reflections of Littjara | Crucible of Fire | Enchantment that rewards a deck of Dragons. |
| Sarkhan, Soul Aflame | Goreclaw, Terror of Qal Sisma | Makes the deck's big creatures cheaper. |
| Scourge of the Throne | Savage Ventmaw | Six-mana red-green flying Dragon that rewards attacking. |
| Selvala's Stampede | Kodama of the East Tree | Six-mana sorcery: puts creatures onto the battlefield, ramp. |
| Skarrgan Hellkite | Scourge of Valkas | Five-mana red flying Dragon that deals damage as Dragons enter. |
| Stormbreath Dragon | Thundermaw Hellkite | Five-mana red flying Dragon with haste. |
| Stormshriek Feral | Demanding Dragon | Five-mana red flying Dragon. |
| Temple of the Dragon Queen | Game Trail | Land that makes the deck's colours. |
| Territorial Hellkite | Young Red Dragon | Four-mana red Dragon. |
| Whirlwing Stormbrood | Ganax, Astral Hunter | Five-mana red Dragon that makes Treasure as Dragons enter. |
| Zenith Festival | Reckless Impulse | Two-mana sorcery: impulse draw, card advantage. |

### Sultai Arisen — Teval, the Balanced Scale (25)

| printed card | plays as | why |
|---|---|---|
| Afterlife from the Loam | Reanimate | Reanimates a creature from any graveyard. |
| Colossal Grave-Reaver | Archon of Cruelty | Eight-mana creature: attack trigger, evasive creature. |
| Command Beacon | Path of Ancestry | Land: commander payoff, utility land. |
| Consuming Aberration | Umbris, Fear Manifest | Five-mana creature: mill. |
| Dauthi Voidwalker | Scavenging Ooze | Two-mana creature: graveyard hate. |
| Disciple of Bolas | Thallid Soothsayer | Turns a sacrificed creature into cards. |
| Essence Anchor | Rune-Sealed Wall | Three-mana artifact: self-mill, library manipulation. |
| Gravecrawler | Bloodghast | Cheap black creature that keeps coming back from the graveyard. |
| Jarad, Golgari Lich Lord | Nantuko Husk | Sacrifice outlet that turns creatures into damage. |
| Kotis, Sibsig Champion | Doomed Necromancer | Three-mana creature: reanimation, recursion. |
| Lethal Scheme | Hero's Downfall | Instant-speed creature or planeswalker removal. |
| Life from the Loam | Grim Discovery | Two-mana sorcery: land recursion, regrowth. |
| Living Death | Rise Again | Five-mana sorcery: reanimation, recursion. |
| Lord of the Forsaken | Mindscour Dragon | Six-mana creature: mill, self-mill. |
| Millikin | Hedron Crawler | Two-mana creature: mana creature, ramp. |
| Multani, Yavimaya's Avatar | Lumra, Bellow of the Woods | Six-mana creature: recursion. |
| Necromantic Selection | Blood Money | Seven-mana sorcery: sweeper, removal. |
| Necropolis Fiend | Black Dragon | Nine-mana creature: removal, evasive creature. |
| River Kelpie | Drelnoch | Five-mana creature: card draw, card advantage. |
| Shigeki, Jukai Visionary | Coiling Oracle | Two-mana creature: extra land, ramp. |
| Steward of the Harvest | Cemetery Reaper | Four-mana creature. |
| Tasigur, the Golden Fang | Barrow Witches | Six-mana creature: regrowth, recursion. |
| Teval's Judgment | Black Market Connections | Three-mana enchantment: Treasure maker, modal. |
| Welcome the Dead | Deep Analysis | Four-mana sorcery: card draw for life, card draw. |
| Wonder | Pixie Queen | Four-mana creature: gives flying, evasion. |

### Abzan Armor — Felothar the Steadfast (15)

| printed card | plays as | why |
|---|---|---|
| Baldin, Century Herdmaster | Syr Alin, the Lion's Claw | Six-mana creature: team pump, attack trigger. |
| Behind the Scenes | History of Benalia | Three-mana enchantment: team pump. |
| Canopy Gargantuan | Old Gnawbone | Seven-mana green Dragon. |
| Colfenor's Urn | Resurrection Orb | Three-mana artifact: protection. |
| Faeburrow Elder | Fyndhorn Elder | Three-mana creature: mana creature, ramp. |
| Protector of the Wastes | Angel of the Ruins | Six-mana creature: artifact and enchantment removal, removal. |
| Reunion of the House | Brilliant Restoration | Seven-mana sorcery: mass reanimation, reanimation. |
| Shadrix Silverquill | Archangel of Thune | Five-mana white flier that grows the team. |
| Sidar Kondo of Jamuraa | Delney, Streetwise Lookout | Four-mana creature: evasion. |
| Slaughter the Strong | Citywide Bust | Three-mana sorcery: sweeper, creature removal. |
| Tip the Scales | Toxic Deluge | Three-mana sorcery: removal, sweeper. |
| Tree of Redemption | Ancient Lumberknot | Four-mana creature that deals damage by toughness. |
| Wall of Roots | Vine Trellis | Two-mana creature: mana creature, ramp. |
| Weathered Sentinels | Guardians of Meletis | Three-mana artifact defender with high toughness. |
| Will of the Abzan | Breath of Life | Four-mana sorcery: reanimation, recursion. |

### Mardu Surge — Zurgo Stormrender (12)

| printed card | plays as | why |
|---|---|---|
| Ainok Strike Leader | Hanweir Garrison | Attacks and brings attacking tokens with it. |
| Divine Visitation | Anointed Procession | Five-mana enchantment: token payoff. |
| Eliminate the Competition | Lich's Caress | Five-mana sorcery: removal, creature removal. |
| Gix, Yawgmoth Praetor | Midnight Reaper | Three-mana creature: card draw for life, card draw. |
| Kaya, Geist Hunter | Ajani, Caller of the Pride | Three-mana planeswalker. |
| Legion Warboss | Krenko, Tin Street Kingpin | Three-mana creature: token maker, attack trigger. |
| Myr Battlesphere | Threefold Thunderhulk | Seven-mana artifact creature that makes an army. |
| Neriv, Crackling Vanguard | Bonehoard Dracosaur | Five-mana creature: impulse draw, card advantage. |
| Redoubled Stormsinger | Zurgo, Thunder's Decree | Three-mana creature: token payoff, token maker. |
| Will of the Mardu | Bombard | Three-mana instant: burn, removal. |
| Within Range | Dogged Pursuit | Four-mana enchantment: drains opponents. |

### Jeskai Striker — Shiko and Narset, Unified (3)

Shiko and Narset commands it, swapped with Elsha, Threefold Master, who plays in the 99 (the same
100 cards).

| printed card | plays as | why |
|---|---|---|
| Curse of Opulence | Sticky Fingers | One-mana enchantment: token maker, ramp. |
| Dismantling Wave | Solemn Offering | Three-mana sorcery: artifact and enchantment removal, removal. |
| Transforming Flourish | Stroke of Midnight | Three-mana instant: removal. |
