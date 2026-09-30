# Real precon decks for the bots

Status: **shipped, with substitutions** (2026-09-30) — `engine/src/sample-decks.ts` is the five
**Tarkir: Dragonstorm Commander** decks (MTGJSON set code `TDC`, 2025). 348 of the 495
non-commander slots are the printed cards; the other 147 are cards the engine doesn't implement
yet, played by stand-ins listed under [Substitutions](#substitutions) below. Authoring those 147
is the current card priority (`BACKLOG.md`, "Card backlog").

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

| deck | commander | plan | cards to author |
|---|---|---|---|
| Temur Roar | Ureni of the Unwritten | Dragons, dug out of the library by Ureni | 31 |
| Sultai Arisen | Teval, the Balanced Scale | self-mill, lands and creatures back from the graveyard | 34 |
| Abzan Armor | Felothar the Steadfast | walls and toughness, dealing damage by toughness | 31 |
| Mardu Surge | Zurgo Stormrender | attacking tokens, cashed in as they leave | 23 |
| Jeskai Striker | Elsha, Threefold Master | instants and sorceries, prowess, Monk tokens | 28 |

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

### Temur Roar — Ureni of the Unwritten (31)

| printed card | plays as | why |
|---|---|---|
| Become the Avalanche | Boon of the Wish-Giver | Six-mana sorcery: card draw, card advantage. |
| Breaching Dragonstorm | Fateful Discovery | Five-mana enchantment: card advantage. |
| Broodcaller Scourge | Old Gnawbone | Seven-mana green Dragon. |
| Chaos Warp | Regress | Three-mana instant: removal. |
| Deceptive Frostkite | Sprite Dragon | Two-mana blue flying Dragon. |
| Draconic Lore | Opportunity | Six-mana instant: card draw, card advantage. |
| Dragonlord Atarka | Drakuseth, Maw of Flames | Seven-mana legendary Dragon that burns as it attacks. |
| Gadrak, the Crown-Scourge | Bhaal's Invoker | Three-mana red Dragon. |
| Glorybringer | Terror of the Peaks | Five-mana red flying Dragon that removes creatures. |
| Hammerhead Tyrant | Archive Dragon | Six-mana blue flying Dragon. |
| Hellkite Courser | Rorix Bladewing | Six-mana red flying Dragon with haste. |
| Keiga, the Tide Star | Mindscour Dragon | Six-mana blue flying Dragon. |
| Leyline Tyrant | Archwing Dragon | Four-mana red flying Dragon. |
| Mosswort Bridge | Khalni Garden | Land: tapped land, utility land. |
| Nesting Dragon | Goldlust Triad | Five-mana red Dragon. |
| Nogi, Draco-Zealot | Dragonspeaker Shaman | Three-mana creature: cost reducer. |
| Opportunistic Dragon | Skyship Stalker | Four-mana red flying Dragon. |
| Reality Shift | Resculpt | Two-mana instant: removal, creature removal. |
| Reflections of Littjara | Crucible of Fire | Enchantment that rewards a deck of Dragons. |
| Sarkhan, Soul Aflame | Goreclaw, Terror of Qal Sisma | Makes the deck's big creatures cheaper. |
| Scourge of the Throne | Savage Ventmaw | Six-mana red-green flying Dragon that rewards attacking. |
| Selvala's Stampede | Kodama of the East Tree | Six-mana sorcery: puts creatures onto the battlefield, ramp. |
| Skarrgan Hellkite | Scourge of Valkas | Five-mana red flying Dragon that deals damage as Dragons enter. |
| Storm's Wrath | Chain Reaction | Four-mana red sweeper. |
| Stormbreath Dragon | Thundermaw Hellkite | Five-mana red flying Dragon with haste. |
| Stormshriek Feral | Demanding Dragon | Five-mana red flying Dragon. |
| Temple of the Dragon Queen | Game Trail | Land that makes the deck's colours. |
| Territorial Hellkite | Young Red Dragon | Four-mana red Dragon. |
| Thundermane Dragon | Draconic Muralists | Four-mana green Dragon. |
| Whirlwing Stormbrood | Ganax, Astral Hunter | Five-mana red Dragon that makes Treasure as Dragons enter. |
| Zenith Festival | Reckless Impulse | Two-mana sorcery: impulse draw, card advantage. |

### Sultai Arisen — Teval, the Balanced Scale (34)

| printed card | plays as | why |
|---|---|---|
| Afterlife from the Loam | Reanimate | Reanimates a creature from any graveyard. |
| Amphin Mutineer | Ravenous Chupacabra | Four-mana creature that removes a creature as it enters. |
| Colossal Grave-Reaver | Archon of Cruelty | Eight-mana creature: attack trigger, evasive creature. |
| Command Beacon | Path of Ancestry | Land: commander payoff, utility land. |
| Conduit of Worlds | Crucible of Worlds | Four-mana artifact: land recursion, reanimation. |
| Consuming Aberration | Umbris, Fear Manifest | Five-mana creature: mill. |
| Crawling Sensation | Dying to Serve | Three-mana enchantment: token maker. |
| Dauthi Voidwalker | Scavenging Ooze | Two-mana creature: graveyard hate. |
| Disciple of Bolas | Thallid Soothsayer | Turns a sacrificed creature into cards. |
| Diviner of Mist | Mindeye Drake | Five-mana blue flier that mills. |
| Essence Anchor | Rune-Sealed Wall | Three-mana artifact: self-mill, library manipulation. |
| Floral Evoker | Ramunap Excavator | Three-mana creature: land recursion, reanimation. |
| Forbidden Alchemy | Curate | Instant that digs and fills the graveyard. |
| Gravecrawler | Bloodghast | Cheap black creature that keeps coming back from the graveyard. |
| Jarad, Golgari Lich Lord | Nantuko Husk | Sacrifice outlet that turns creatures into damage. |
| Kishla Skimmer | Faerie Mastermind | Two-mana creature: card draw, card advantage. |
| Kotis, Sibsig Champion | Doomed Necromancer | Three-mana creature: reanimation, recursion. |
| Lethal Scheme | Hero's Downfall | Instant-speed creature or planeswalker removal. |
| Life from the Loam | Grim Discovery | Two-mana sorcery: land recursion, regrowth. |
| Living Death | Rise Again | Five-mana sorcery: reanimation, recursion. |
| Lord of the Forsaken | Mindscour Dragon | Six-mana creature: mill, self-mill. |
| Millikin | Hedron Crawler | Two-mana creature: mana creature, ramp. |
| Multani, Yavimaya's Avatar | Lumra, Bellow of the Woods | Six-mana creature: recursion. |
| Myriad Landscape | Blighted Woodland | Land: land fetcher. |
| Necromantic Selection | Blood Money | Seven-mana sorcery: sweeper, removal. |
| Necropolis Fiend | Black Dragon | Nine-mana creature: removal, evasive creature. |
| River Kelpie | Drelnoch | Five-mana creature: card draw, card advantage. |
| Shigeki, Jukai Visionary | Coiling Oracle | Two-mana creature: extra land, ramp. |
| Steward of the Harvest | Cemetery Reaper | Four-mana creature. |
| Tasigur, the Golden Fang | Barrow Witches | Six-mana creature: regrowth, recursion. |
| Teval's Judgment | Black Market Connections | Three-mana enchantment: Treasure maker, modal. |
| Treasure Cruise | Last March of the Ents | Eight-mana sorcery: card draw, card advantage. |
| Welcome the Dead | Deep Analysis | Four-mana sorcery: card draw for life, card draw. |
| Wonder | Pixie Queen | Four-mana creature: gives flying, evasion. |

### Abzan Armor — Felothar the Steadfast (31)

| printed card | plays as | why |
|---|---|---|
| Arbor Adherent | Skyshroud Troopers | Four-mana creature: mana creature, ramp. |
| Assault Formation | Doran, the Siege Tower | Creatures deal combat damage equal to their toughness. |
| Axebane Guardian | Circle of Dreams Druid | Three-mana creature: mana creature. |
| Baldin, Century Herdmaster | Syr Alin, the Lion's Claw | Six-mana creature: team pump, attack trigger. |
| Behind the Scenes | History of Benalia | Three-mana enchantment: team pump. |
| Blight Pile | Archers' Parapet | Two-mana creature: drains opponents. |
| Canopy Gargantuan | Old Gnawbone | Seven-mana green Dragon. |
| Colfenor's Urn | Resurrection Orb | Three-mana artifact: protection. |
| Expel the Interlopers | Fell the Mighty | Five-mana sorcery: sweeper. |
| Faeburrow Elder | Fyndhorn Elder | Three-mana creature: mana creature, ramp. |
| Indulging Patrician | Marauding Blight-Priest | Three-mana creature: lifegain payoff, drains opponents. |
| Jaws of Defeat | Dogged Pursuit | Four-mana enchantment: drains opponents. |
| Overgrown Battlement | Gleaming Barrier | Two-mana wall. |
| Protector of the Wastes | Angel of the Ruins | Six-mana creature: artifact and enchantment removal, removal. |
| Rampart Architect | Ondu Giant | Four-mana creature: land fetcher, ramp. |
| Reunion of the House | Brilliant Restoration | Seven-mana sorcery: mass reanimation, reanimation. |
| Shadrix Silverquill | Archangel of Thune | Five-mana white flier that grows the team. |
| Sidar Kondo of Jamuraa | Delney, Streetwise Lookout | Four-mana creature: evasion. |
| Slaughter the Strong | Citywide Bust | Three-mana sorcery: sweeper, creature removal. |
| Tip the Scales | Toxic Deluge | Three-mana sorcery: removal, sweeper. |
| Tower Defense | Shield Wall | Two-mana instant: team pump, combat trick. |
| Towering Titan | Betor, Kin to All | Big creature that rewards total toughness. |
| Tree of Redemption | Ancient Lumberknot | Four-mana creature that deals damage by toughness. |
| Wakestone Gargoyle | Wall of Swords | Four-mana creature: evasive creature. |
| Walking Bulwark | Steel Wall | One-mana artifact wall. |
| Wall of Limbs | Moaning Wall | Three-mana black wall. |
| Wall of Reverence | Wall of Faith | Four-mana white wall. |
| Wall of Roots | Vine Trellis | Two-mana creature: mana creature, ramp. |
| Weathered Sentinels | Guardians of Meletis | Three-mana artifact defender with high toughness. |
| Will of the Abzan | Breath of Life | Four-mana sorcery: reanimation, recursion. |
| Wingmantle Chaplain | Clarion Cathars | Four-mana creature: tokens. |

### Mardu Surge — Zurgo Stormrender (23)

| printed card | plays as | why |
|---|---|---|
| Ainok Strike Leader | Hanweir Garrison | Attacks and brings attacking tokens with it. |
| Angel of Invention | Lyra Dawnbringer | Five-mana creature: anthem, team pump. |
| Bone Devourer | Exemplar of Light | Four-mana creature: card draw. |
| Chittering Witch | Disciple of Tevesh Szat | Four-mana creature: protection, removal. |
| Divine Visitation | Anointed Procession | Five-mana enchantment: token payoff. |
| Eliminate the Competition | Lich's Caress | Five-mana sorcery: removal, creature removal. |
| Gix, Yawgmoth Praetor | Midnight Reaper | Three-mana creature: card draw for life, card draw. |
| Grenzo, Havoc Raiser | Killian, Decisive Mentor | Two-mana creature: card advantage. |
| Hero of Bladehold | Leonin Warleader | Four-mana white creature that makes attacking tokens. |
| Ironwill Forger | Kratos, Stoic Father | Four-mana creature: attack trigger. |
| Kaya, Geist Hunter | Ajani, Caller of the Pride | Three-mana planeswalker. |
| Legion Warboss | Krenko, Tin Street Kingpin | Three-mana creature: token maker, attack trigger. |
| Mindblade Render | Undead Augur | Two-mana creature: card draw for life, card draw. |
| Myr Battlesphere | Threefold Thunderhulk | Seven-mana artifact creature that makes an army. |
| Neriv, Crackling Vanguard | Bonehoard Dracosaur | Five-mana creature: impulse draw, card advantage. |
| Ogre Battledriver | Tannuk, Steadfast Second | Gives the team haste. |
| Redoubled Stormsinger | Zurgo, Thunder's Decree | Three-mana creature: token payoff, token maker. |
| Tempt with Vengeance | Secure the Wastes | One-mana sorcery: tokens. |
| Thalisse, Reverent Medium | Thorin, King of Durin's Folk | Five-mana creature: token payoff, token maker. |
| Twilight Drover | Anim Pakal, Thousandth Moon | Three-mana creature: token maker. |
| Will of the Mardu | Bombard | Three-mana instant: burn, removal. |
| Windbrisk Heights | Memorial to Glory | Land: tapped land, utility land. |
| Within Range | Dogged Pursuit | Four-mana enchantment: drains opponents. |

### Jeskai Striker — Elsha, Threefold Master (28)

| printed card | plays as | why |
|---|---|---|
| Adaptive Training Post | Unruly Catapult | Three-mana artifact: spell payoff. |
| Aligned Heart | Contemplation | Three-mana enchantment: spell payoff. |
| Ancestral Vision | Braingeyser | Cheap spell that draws several cards. |
| Baral and Kari Zev | Lorehold Pledgemage | Three-mana creature: spell payoff. |
| Baral's Expertise | Raise the Palisade | Five-mana sorcery: bounce, creature removal. |
| Caldera Pyremaw | Sunscorch Regent | Five-mana flying Dragon. |
| Compulsive Research | Catalog | Three-mana sorcery: looting, card draw. |
| Curse of Opulence | Sticky Fingers | One-mana enchantment: token maker, ramp. |
| Curse of the Swine | Resculpt | Two-mana sorcery: removal, creature removal. |
| Dismantling Wave | Solemn Offering | Three-mana sorcery: artifact and enchantment removal, removal. |
| Electrodominance | Lightning Strike | Two-mana instant: burn. |
| Expansion // Explosion | Fireball | X-damage spell. |
| Expressive Iteration | Reckless Impulse | Two-mana sorcery: impulse draw, card advantage. |
| Ghostly Prison | Aura of Silence | Three-mana white enchantment that taxes opponents. |
| Haughty Djinn | Aven Wind Mage | Three-mana creature: spell payoff, evasive creature. |
| Lier, Disciple of the Drowned | Archmage of Runes | Five-mana creature: spell payoff. |
| Magma Opus | Searing Wind | Eight-mana instant: burn. |
| Manaform Hellkite | Whispering Wizard | Four-mana creature: spell payoff. |
| Mangara, the Diplomat | Aragorn, King of Gondor | Four-mana creature: card draw, lifegain. |
| Narset's Reversal | Twincast | Two-mana instant: spell copy. |
| Ponder | Serum Visions | One-mana sorcery: cantrip, library manipulation. |
| Shiko and Narset, Unified | Palace Sentinels | Four-mana creature: card draw, card advantage. |
| Sublime Epiphany | Contradict | Counterspell that draws a card. |
| Tempest Technique | Efficient Construction | Four-mana enchantment: spell payoff. |
| Transcendent Dragon | Scion of Ugin | Six-mana creature: evasive creature. |
| Transforming Flourish | Stroke of Midnight | Three-mana instant: removal. |
| Velomachus Lorehold | Tyrant's Familiar | Seven-mana creature: attack trigger, evasive creature. |
| Voracious Bibliophile | Storyteller Pixie | Four-mana creature: spell payoff, card draw. |
