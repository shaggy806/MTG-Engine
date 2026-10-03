# Card blockers

What blocks the cards that aren't in the pool yet, batch by batch and family by family — kept
for reference when picking the next engine feature. `BACKLOG.md` carries only the open work and
the current **Next**; this file carries the detail behind it. The per-card records themselves
are JSON, one file per batch (`batch`, `status`, `authored: [{name, files, tested}]`,
`blocked: [{name, needs, why}]`), with `needs` keyed by `top-commanders-gaps.json`'s vocabulary
or a `new:*` key described in the file:

- `engine/data/sweep-2/` — card sweep 2 (2026-09-25): C1–C3 (commanders), K1–K2 (top-2000 cards).
- `engine/data/sweep-3/` — the top-5000 batches since (B4–B18) and the TDC precons (TDC1–TDC5).

The counts below are as each batch measured them. Features have landed since, so recheck a
card's Oracle text and the engine before trusting a "blocked" — in particular
`decision:copy-new-targets` and `effect:copy-permanent-spell` (2026-09-30), discard as an
activation cost (2026-09-29), split cards and a spell's divided damage (2026-10-01) and attack
taxes (2026-10-01) are built, so lines below that rank them as next are history. When a batch
lands, add its summary here, not to `BACKLOG.md`.

## The Tarkir: Dragonstorm precons (TDC1–TDC5)

147 were missing at the swap to the TDC decks (2026-09-30). TDC batch 1 authored 41
(`precon-tdc-batch-1.test.ts`) and batch 2 the 8 that casting a spell as another resolves
unblocked (`precon-tdc-batch-2.test.ts`: the `cast-now` effect from a hand, graveyard or library
top, free, with "if you do / don't"). Shiko and Narset, Unified commands Jeskai Striker since
2026-09-30 (swapped with Elsha), and a copy's new targets is built, storm included (TDC3: 5
Jeskai cards; TDC4: 8 more, split cards and divided damage among them). TDC5 (2026-10-02) built
delve (Treasure Cruise) and, until end of turn, "can attack as though it didn't have defender" and
"assigns combat damage equal to its toughness" (Assault Formation, Wakestone Gargoyle, Walking
Bulwark).

Jeskai's last 3 each need something different (Curse of the Swine's X targets were built on
2026-10-02): Curses (Curse of Opulence), a target per opponent and a cycling trigger (Dismantling Wave) and demonstrate
(Transforming Flourish). Across all five decks no feature blocks more than two: divided damage
(a triggered ability's), hideaway, Omen and "the creature it sacrificed". The other three delve
cards each need one more thing: a target in each player's graveyard (Afterlife from the Loam),
"exile X cards from your graveyard" as a cost (Necropolis Fiend), and a card an opponent
chooses (Tasigur, the Golden Fang).

## Other precons and shared staples (PC-*, 2026-10-02)

The precon ranking (MTGJSON's 199 Commander decks, 175 once reprints are folded) picked four
near-complete 2022 Starter Commander decks (SCD), four new decks about 25 cards short
(Tramplesaurus Rex and Reign of Dragons from FDC, Family Matters from BLC, World Shaper from EOC)
and the cards missing from 8+ precons. Six slices, 160 cards: 54 authored (`precon-<slice>-batch-1`
tests), the rest recorded in `engine/data/sweep-3/PC-{scd,rex,family,dragons,shaper,shared}.json`.
SCD's last stand-ins are mostly hard (curses, a planeswalker that becomes a creature, a target in
each opponent's graveyard, emblems with triggers). Hit the Mother Lode showed discover 10 is
expressible from `reveal-until` and `cast-now`; Return to Dust's main-phase rider from a
`conditional` on the step.

## Top-5000 batches (sweep 3)

- **Batch 4 (2026-09-28)** took the cards the debt fixes unblocked: 15 authored (regeneration,
  Strive's Twinflame, Will of the Temur, …); 10 blocked (`B4.json`). The two cheapest wins
  there: a count of a *targeted* player's permanents (Will of the Mardu, Call the Coppercoats)
  and a "when you cycle this card" trigger (Decree of Pain). Still blocked among the Warp /
  Offspring / Eternalize cards: Loading Zone (counters a permanent *enters* with doubled too),
  Anticausal Vestige (a hand filter reading your land count), Warren Warleader (a token entering
  tapped and attacking) and Vizier of Many Faces (Embalm through its Clone ability).
- **Batch 5 (2026-09-29)** triaged every open entry through rank 981: 51 authored — the Enduring
  cycle, the Urza's lands, Mystic Sanctuary's cycle (its other members down to rank 4293), The
  Earth Crystal, Elspeth, Storm Slayer, Last March of the Ents and 36 more — with six small
  engine pieces (`neededCards-features.md`, "Top-5000 batch 5"); 79 blocked (`B5.json`). By what
  blocks most: a free cast during resolution (`effect:cast-during-resolution`, 4 — Isochron
  Scepter, Mizzix's Mastery, Beseech the Mirror, Buster Sword); then 3 each for "Sacrifice N
  [things]" as a cost (`cost:sacrifice-multiple` — Sai, Peregrin Took, Grim Hireling, and
  Mondrak and Magda before them), improvise (Kappa Cannoneer, Inspiring Statuary, Archway of
  Innovation) and a copy's new targets. Cheaper, and wider than this batch: an Aura's static
  that sets what the enchanted creature is (Kenrith's Transformation, Imprisoned in the Moon,
  then Darksteel Mutation, Song of the Dryads, Frogify) and a life-gain multiplier (The Wind
  Crystal, Alhammarret's Archive, Rhox Faithmender, Boon Reflection — partly built in batch 9).
- **Batch 6 (2026-09-29)** triaged ranks 982–1210 and the three double-faced cards batch 5's list
  reader skipped: 53 authored — 49 from the batch (Torbran, Annie Joins Up, Mirror Entity,
  Stoneforge Mystic, Bloodghast, Luminous Broodmoth, Archon of Cruelty and 42 more) and 4
  further down that its new engine pieces unblocked (Prowling Serpopard, Allosaurus Shepherd,
  Hexing Squelcher, Batterskull — `neededCards-features.md`, "Top-5000 batch 6"); 64 blocked
  (`B6.json`). By what blocks most: "you win the game" (`new:win-game`, 4 here — Approach of the
  Second Sun, Mechanized Production, Jace, Wielder of Mysteries, Revel in Riches — and 7 across
  every record, with Thassa's Oracle, Laboratory Maniac and Hellkite Tyrant); then 3 each for a
  variable number of targets (`decision:variable-target-count` — Agadeem's Awakening, Pest
  Infestation, Crackle with Power), ascend (Wayward Swordtooth, Ocelot Pride, Twilight Prophet)
  and looking at the top card of a library (`zone:visibility-extensions` — The Reality Chip,
  Mishra's Bauble, Augur of Autumn). Ojer Taq needs only two small pieces: a token multiplier
  limited to creature tokens, and a count of the creatures attacked with this turn.
- **Batch 7 (2026-09-29)** triaged ranks 1211–1356: 61 authored — 60 from the batch (Dark
  Confidant, Past in Flames, Valakut, Ulamog, the Ceaseless Hunger, Courser of Kruphix, Akroma's
  Memorial and 54 more) and Will of the Jeskai, which Past in Flames' mass flashback unblocked
  (`neededCards-features.md`, "Top-5000 batch 7"); 50 blocked (`B7.json`). By what blocks most:
  ordering cards put back on a library (`decision:library-ordering`, 3 here — Stock Up, Halimar
  Depths, Experimental Augury — and 8 across every record, with Ponder, Sensei's Divining Top and
  Dig Through Time); then improvise (Whir of Invention, Organic Extinction; 5 across records) and
  an Aura or static that sets what a creature is (Amphibian Downpour, Vraska, Betrayal's Sting).
  Across every record then: mana-ability extensions (`effect:add-mana-extensions`, 10) and
  "sacrifice N" costs (`cost:sacrifice-multiple`, 9). Cascading Cataracts waits on a way to
  choose "five mana in any combination of colors" unit by unit
  (`new:mana-any-combination-choice`): activated by hand, that's 126 splits.
- **Batch 8 (2026-09-29)** triaged ranks 1357–1505: 57 authored — 56 from the batch
  (Embercleave, Restoration Angel, Martial Coup, Rankle, Genesis Wave, Terastodon, Guide of Souls
  and 49 more) and Training Grounds, which the new one-mana floor on activation-cost reductions
  unblocked (`neededCards-features.md`, "Top-5000 batch 8"); 54 blocked (`B8.json`). By what
  blocks most: a copy's new targets (4 here — Thousand-Year Storm, Reverberate, Rings of
  Brighthearth, Echoes of Eternity; since built); then 2 each for shuffling a graveyard into a
  library (Ulamog, the Infinite Gyre, Elixir of Immortality), "sacrifice N" costs, a land with an
  Adventure, a card chosen as a cost, damage prevented to a filter, and a variable number of
  targets. Across every record then: a free cast during resolution (16) and "sacrifice N" costs
  (15). Grab the Prize needs only the card discarded as its cost remembered, as a sacrificed one
  already is (`new:cost-discarded-reference`).
- **Batch 9 (2026-09-29)** triaged ranks 1507–1632: 46 authored (Uro, Cryptic Command, Natural
  Order, Hangarback Walker, Monastery Mentor, Hydroid Krasis, It That Betrays and 39 more, with
  Boon Reflection and The Wind Crystal from further down, which the new life-gain doubler
  unblocked — `neededCards-features.md`, "Top-5000 batch 9"); 57 blocked (`B9.json`). By what
  blocks most: discard (or exile cards) as an activation cost (`cost:choose-cards-as-cost` —
  the discard half since built, below); then "you win / lose the game" (`new:win-game`, 11
  across records with Final Fortune, Felidar Sovereign and Twenty-Toed Toad). Cheap single-card
  pieces it found: stun counters (Unstoppable Slasher), a batched leaves-battlefield trigger
  (Dour Port-Mage), a damage replacement filtered by recipient (Losheel), the Kindred card type
  (Eldrazi Conscription).
- **Batch 10 (2026-09-29)** triaged ranks 1645–1722: 31 authored (Nissa, Who Shakes the World,
  Glen Elendra Archmage, Blast Zone, Murderous Rider, Court of Grace, Jin-Gitaxias and 25 more —
  `neededCards-features.md`, "Top-5000 batch 10"); 29 blocked (`B10.json`), almost all by
  features no other card here needs. Two measured surprises: a static can't choose what it
  affects by power or toughness (Tetsuko Umezawa — an `affects` filter reading P/T matches
  nothing inside the layer fold), and "whenever a counter is put on" is once per counter for
  Fathom Mage (its ruling) where `counters-put` fires per event.
- **Batch 11 (2026-09-29)** triaged ranks 1723–1801: 31 authored with no new engine vocabulary
  (Mana Leak, Archmage's Charm, Death Baron, Alesha, Vaultborn Tyrant, Aurelia, the Law Above,
  Urabrask the Hidden and 24 more — `top5000-batch-11.test.ts`); 29 blocked (`B11.json`). Rooms,
  rebound, d20 rolls and "choose one that hasn't been chosen this turn" (Teval's Judgment, Gala
  Greeters) each block two or more.
- **Batch 12 (2026-09-29)** triaged ranks 1802–1877: 34 authored (Casualties of War, Zacama,
  Orim's Chant, Lyra Dawnbringer, Arwen, Springleaf Parade, Insurrection and 27 more —
  `top5000-batch-12.test.ts`); 26 blocked (`B12.json`). Two small pieces lead what's left here
  and in B11: "doesn't untap during its controller's next untap step" (Junk Winder, Vorinclex)
  and countering an activated or triggered ability (Disallow; Sublime Epiphany since authored).
- **Batch 13 (2026-09-29)** triaged ranks 1880–1956: 25 authored (Day of Judgment, Dragonlord
  Dromoka, Sword of Forge and Frontier, Black Sun's Zenith, Teshar, Nighthawk Scavenger and 19
  more — `top5000-batch-13.test.ts`); 35 blocked (`B13.json`), nearly all by one-card features.
  Cheap ones: `create-token-copy` with an amount for its count (For the Common Good), crew
  (Smuggler's Copter), a free cast "once each turn" (As Foretold, One with the Multiverse).
- **Batch 14 (2026-09-29)** triaged ranks 1957–2035: 26 authored (Nevinyrral's Disk, The Eldest
  Reborn, Warping Wail, Cryptbreaker, Resplendent Angel, Grazilaxx and 20 more —
  `top5000-batch-14.test.ts`); 34 blocked (`B14.json`). Across B9–B14 the "look at the top card
  of your library any time" family (`zone:visibility-extensions`) and a damage replacement
  filtered by recipient (`new:damage-prevented-to-filter` — Losheel, Crystal Barricade,
  Mutational Advantage) come up most among the one-feature blockers.
- **Batch 15 (2026-09-29)** triaged ranks 2036–2111: 25 authored (Birthing Pod, Garruk, Primal
  Hunter, Paradise Druid, Goblin Warchief, Trinket Mage and 16 more, plus Vengeful Ancestor,
  Sowing Mycospawn, Nissa, Resurgent Animist and Liesa from a recheck of its blockers —
  `top5000-batch-15.test.ts`); 35 blocked (`B15.json`). Generous Plunderer was rechecked and
  waits only on a count of the defending player's permanents
  (`new:count-of-trigger-players-permanents`), the same count Will of the Mardu and Carpet of
  Flowers need for a target player.
- **Batch 16 (2026-09-29)** triaged ranks 2112–2184: 25 authored (Koma, World-Eater, Master of
  Etherium, Mana Tithe, Trading Post, Aerith Gainsborough, Bone Miser and 19 more —
  `top5000-batch-16.test.ts`); 35 blocked (`B16.json`). Recurring across B9–B16 and cheap:
  "can't cast more than one spell each turn" (Archon of Emeria, Deafening Silence), infect
  (Plague Myr, Inkmoth Nexus) and the d20 (Delina, both Ancient Dragons).
- **Batch 17 (2026-09-29)** was a short, time-boxed pass over ranks 2185–2243: 9 authored (Ondu
  Inversion, Scourge of Fleets, Assemble the Legion, Summon: Knights of Round, Slip Through
  Space, and — on a recheck of its blockers — Swarmyard Massacre, Forge of Heroes, Triplicate
  Titan, Earthbender Ascension; `top5000-batch-17.test.ts`); 31 blocked (`B17.json`), every one
  checked closely.
- **Batch 18 (2026-09-30)** triaged ranks 2245–2346: 41 authored (Flickerwisp, Kokusho, Survival
  of the Fittest, Royal Assassin, Court of Garenbrig, Manamorphose, Tome of Legends and 34 more
  — `top5000-batch-18.test.ts`); 34 blocked (`B18.json`). One engine change: a flicker can return
  a permanent *with* its counters (Planar Incision). The blockers that recur across batches and
  are cheap to build: infect (Grafted Exoskeleton, Tainted Strike, plus B16's Plague Myr and
  Inkmoth Nexus), a card's own permission to be cast from its graveyard (Squee, Quilled
  Greatwurm, Gravecrawler), the legendary sorcery restriction (rule 205.4e — Jaya's Immolating
  Inferno, Urza's Ruinous Blast), "shuffle it into its owner's library instead" (Nexus of Fate,
  Darksteel Colossus at rank 2408), and offering every alternative cost that applies rather than
  the first found (Dracogenesis, Rooftop Storm — Jodah shows the gap today).

Past rank 2346, nothing is triaged.

## Card sweep 2 (2026-09-25)

Five cloud batches triaged the 189 best-ranked unimplemented top-500 commanders (C1–C3) and the
208 best-ranked unimplemented top-2000 cards (K1–K2), which include most of card sweep 1's 227
skips. They authored 36 cards and recorded 361 as blocked. The most-needed features then:
`decision:copy-new-targets` (16, since built), `effect:copy-exceptions` (14),
`effect:may-sacrifice-then` (12), `effect:cast-during-resolution` and
`condition:filter-card-property-clauses` (11 each), `effect:attach-extensions`,
`effect:add-mana-extensions` and `bug:as-enters-choices-any-entry` (10 each). The rest of that
backlog — 62 commanders and 1,006 cards then — was untriaged, and the scaffolder can't finish
any of them on its own.

## Families

### Discard as an activation cost — what it didn't unblock

Built 2026-09-29 (`ability-discard-cost.test.ts`): `AbilityCost.discard: { count, filter? }`,
paid with the `discard` decision (dev-rooms `DISCD`/`DISC4`). It unblocked Tortured Existence,
Fomori Vault, Yawgmoth, Fauna Shaman and Solphim. Still waiting on other pieces: Nezahal (a
flicker returning tapped), Key to the City and Ghostly Pilferer ("whenever this becomes
untapped"), Kozilek (a discard matching the target's mana value), Jaxis (blitz), Chainer (a
one-shot graveyard cast permission); and the other half of `cost:choose-cards-as-cost`, exiling
cards from your graveyard as a cost (Mines of Moria, Varina).

### "Enters tapped and attacking" (rule 508.4) — what's left

Built 2026-09-28: tokens, cards (`look-and-choose`, `reveal-until`) and token copies (myriad,
`myriad()` helper) can enter attacking, with the `enter-attacking` decision where there's a
choice, and delayed triggers "at end of combat". 19 cards use it (dev-rooms `ENTAT`, `MYRAD`).
Still blocked, by family:

- **Ninjutsu** (17 cards): an activated ability from hand (`ActivatedAbility.zone`) whose cost
  returns an unblocked attacker. The ninja attacks what that creature attacked (702.49c).
- **Other myriad cards:** Scion of Calamity and Hammers of Moradin need a target "that player
  controls" for the damaged or each opponent; Elturel Survivors a count of the defending
  player's lands; Scurry of Squirrels, Battle Angels of Tyr, The Master, Multiplied and Auton
  Soldier their other text.
- **Other token copies entering attacking:** Delina (a d20), Flamerush Rider (Dash), Redoubled
  Stormsinger ("tokens that entered this turn"), Echoing Assault (a copy "except it's 1/1"
  attacking a named player).
- **Ilharg, the Raze-Boar**: "when it dies or is put into exile, put it into its owner's library
  third from the top". **Zara**: a creature from an opponent's hand under your control.
  **Senu**: a trigger while it's in exile. **Doors of Durin**: grants "until your next turn"
  conditioned on a Dwarf / an Elf.
- Blocked by other text as well: Otharri, Ghalta and Mavren, Caesar, Ainok Strike Leader,
  Endless Foot Assault, Andúril, Dalkovan Encampment, Zurgo Stormrender.

### Power-up (a labelled ability)

Built, and 21 of its 37 cards are authored. Blocked: Hulk, Gamma Goliath and Wonder Man
(effects on other power-up abilities), Kang the Conqueror (no power-up during its extra turn),
Thanos, the Mad Titan (an odd-or-even choice), Iron Fist (divided damage from an ability), Nick
Fury (transforming a card it finds), Quicksilver (starting in play), Immortus, Donald Blake (a
creature-type change that sets no P/T) and White Tiger (the Tiger God's blocking restriction).
Loki Laufeyson waited on a copy's new targets, since built. Not yet checked: Black Panther, Most
Dangerous, Human Torch, Jack of Hearts, Shang-Chi and Stature.

### Elsewhere

- **Modal activated abilities with targeted modes** (Breya, Etherium Shaper; Koma, Cosmos
  Serpent; Umezawa's Jitte) and the rest of that family: `neededCards-features.md`, "Modal
  triggers with targeted modes".
- **Host-trigger cards** (34 left): `neededCards-features.md`, "Host triggers".
- **The limitation ledger**: `neededCards-features.md`, "The limitation ledger", and
  `cards/AUTHORING.md` §15.
