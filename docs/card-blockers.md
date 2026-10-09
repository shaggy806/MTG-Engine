# Card blockers

What blocks the cards that aren't in the pool yet, batch by batch and family by family — kept
for reference when picking the next engine feature. `BACKLOG.md` carries only the open work and
the current **Next**; this file carries the detail behind it. The per-card records themselves
are JSON, one file per batch (`batch`, `status`, `authored: [{name, files, tested}]`,
`blocked: [{name, needs, why}]`), with `needs` keyed by `top-commanders-gaps.json`'s vocabulary
or a `new:*` key described in the file:

- `engine/data/sweep-2/` — card sweep 2 (2026-09-25): C1–C3 (commanders), K1–K2 (top-2000 cards).
- `engine/data/sweep-3/` — the top-5000 batches since (B4–B36) and the TDC precons (TDC1–TDC5).

The counts below are as each batch measured them. Features have landed since, so recheck a
card's Oracle text and the engine before trusting a "blocked" — in particular
`decision:copy-new-targets` and `effect:copy-permanent-spell` (2026-09-30), discard as an
activation cost (2026-09-29), split cards and a spell's divided damage (2026-10-01) and attack
taxes (2026-10-01) are built, so lines below that rank them as next are history. When a batch
lands, add its summary here, not to `BACKLOG.md`.

## Open leads

Card-level detail behind `BACKLOG.md`'s card items, moved here from it on 2026-10-04. Delete a
lead when its cards land or turn out blocked on something else (record that in the batch JSON).

- **The TDC precons' last missing card**: Reality Shift, behind manifest (`mechanic:face-down`) —
  face-down permanents aren't modeled at all: a 2/2 with no name, cost, types or abilities in the
  layers, hidden from opponents in every view, turned face up as a special action, revealed as it
  leaves. The other four landed 2026-10-07 (`engine/data/sweep-3/TDC8.json`), each on a feature
  built for it: dredge (Life from the Loam — `CardDefinition.dredge`, asked before each draw),
  `keep-total-power` (Slaughter the Strong), a modal's `optional` and `eachTargetsDifferentPlayer`
  (Shadrix Silverquill), and `keepsUnspentMana` with a `may`'s `xColor` (Leyline Tyrant). The
  pool's other dredge cards landed 2026-10-09 (open-leads-recheck.test.ts).
- **The cheap recurring blockers the top-5000 batches found:** "can't cast more than one spell
  each turn", the legendary sorcery restriction (205.4e), "sacrifice any number" as a spell's
  additional cost (`cost:sacrifice-multiple`'s remainder: Dargo, Plumb the Forbidden),
  improvise, and a card's own permission to be cast from its graveyard where
  `castFromGraveyardIf` doesn't reach (recheck each record against it).
- **The win-game cards still blocked** (`win-game.test.ts`): Mechanized Production and Liliana's
  Contract count artifacts or Demons "with the same name" / "with different names", but tokens
  are keyed by disambiguated registry names, not their rule-111.4 names (two Golem tokens from
  different cards share a name), and Mechanized Production also copies "enchanted artifact" as it
  last existed; Final Fortune and Last Chance lose at "that turn's end step" (a delayed trigger
  tied to one extra turn); Halo Fountain untaps creatures as a cost; Darksteel Reactor is a state
  trigger (603.8); The Golden Throne replaces losing the game; Out of the Tombs replaces an
  empty-library draw with a choice from the graveyard; Maze's End returns itself to hand as a
  cost.
- **Rechecked 2026-10-09 and still blocked** (the open-leads recheck, which authored the dredge
  cards, God-Eternal Rhonas, Ilharg, Buster Sword, Venser and Flusterstorm): God-Eternal Bontu
  ("sacrifice any number of other permanents, then draw that many"), Riptide Gearhulk (the owner
  orders two cards put into one library position at once, 401.4), Teferi, Hero of Dominaria (an
  emblem with a triggered ability — `create-emblem` carries only a `static`), Long-Term Plans
  (`search-library` can't put the card Nth from the top), Necrodominance ("skip your draw step",
  "pay any amount of life"), Descendants' Path (`sharesCreatureTypeWith` a creature you control —
  only `"trigger-object"` today), Loki Laufeyson (a delayed `nextSpell` filter's "mana value ≤
  Loki's power" read as the spell is cast, 603.2, not at activation), Magus Lucea Kane (a delayed
  trigger on the next spell *or activated ability* with {X}), Flare of Duplication (a sacrifice
  alternative cost), Wyll's Reversal (dice and changing a target), Plumb the Forbidden
  (sacrifice-multiple). Rings of Brighthearth, Twinning Staff and Echoes of Eternity are under
  "Ready now", below.
- **The Incarnations' evoke: "Evoke—Exile a [color] card from your hand."** Evoke is built for
  mana costs (2026-09-29, Ashling); Endurance, Solitude, Fury and Subtlety (and Grief) pay theirs
  by exiling a card of their color from hand, a non-mana cost choice the evoke variant can't
  carry yet (`evokeCostsOf` in `game.ts`).
- **The damage actually dealt as an amount** (`new:damage-dealt-this-way`): Creeping Bloodsucker
  (B9), and the fix for Enter the God-Eternals (BACKLOG).
- **Labelled abilities the engine can't run.** Card sweep 3 found these dash labels, each of
  which changes how its line works; the scaffolder leaves them to author: a Case's To solve and
  Solved (13 each), Forecast (11), Companion (10; not modeled) and Max speed (34). Power-up is
  built (its 16 left are under "Power-up", below). Exhaust and Boast are read, as the ability
  flags the engine already has.
- **Library-ordering and cost leftovers:** Kozilek, the Great Distortion needs an ability's X
  announced with no `{X}` in its cost, read by both a discard filter ("a card with mana value
  X") and its target ("spell with mana value X"); Scroll Rack needs "put that many cards from
  the top of your library into your hand" (not a draw) and an effect that puts several targeted
  cards on top in an order the player picks (`beginLibraryOrder` would ask it); a spell's
  additional "exile a card from your graveyard" cost isn't built (an activated ability's is
  `exileFromGraveyard`).
- **The original deck lists.** `engine/src/cards/neededCards.txt` holds the first two decks the
  pool was built for (Ureni's Temur dragons, Korvold and Lord Windgrace's lands) and some
  one-off requests. 22 of its cards are still missing, and 7 of those aren't in the top-5000
  list, so nothing else tracks them: Incinerator of the Guilty, Mirror Room, Walk-In Closet,
  Ureni, the Song Unending, World War Hulk, Greater Gargadon and Kavaron, Memorial World. Their
  `FEATURE:` notes date from the P0–P20 passes, so re-check each one against the engine before
  building for it.
- **Oracle-parser figures** as of card sweep 3 (2026-09-25): 4,205 parser-read cards in the
  pool, 26,469 Commander-legal cards left with a line the parser can't read; the parser read the
  cost or trigger of 16,853 of their abilities and the effect of 22% of those. The unread lines
  that recurred most: an ability's "Choose one —" (266), Crew (180), "Regenerate ~" (151), "You
  may pay {…}" (142), "Transform ~" (138).

## The Tarkir: Dragonstorm precons (TDC1–TDC7)

147 were missing at the swap to the TDC decks (2026-09-30). TDC batch 1 authored 41
(`precon-tdc-batch-1.test.ts`) and batch 2 the 8 that casting a spell as another resolves
unblocked (`precon-tdc-batch-2.test.ts`: the `cast-now` effect from a hand, graveyard or library
top, free, with "if you do / don't"). Shiko and Narset, Unified commands Jeskai Striker since
2026-09-30 (swapped with Elsha), and a copy's new targets is built, storm included (TDC3: 5
Jeskai cards; TDC4: 8 more, split cards and divided damage among them). TDC5 (2026-10-02) built
delve (Treasure Cruise) and, until end of turn, "can attack as though it didn't have defender" and
"assigns combat damage equal to its toughness" (Assault Formation, Wakestone Gargoyle, Walking
Bulwark).

Since round three's precons pass (2026-10-03, below) 8 are left across the five decks, each
behind a feature of its own: harmonize (Zenith Festival), demonstrate (Transforming Flourish),
dredge (Life from the Loam), Curses (Curse of Opulence), manifest (Reality Shift), modes that each
target a different player (Shadrix Silverquill), keeping creatures of total power 4 or less
(Slaughter the Strong), and unspent red mana with "pay any amount" (Leyline Tyrant).

TDC6 (2026-10-05) built Curses — an Aura that enchants a player (rule 303.4), its 303.4f choice
of player, "whenever enchanted player is attacked … each opponent attacking that player does the
same" and "a creature enchanted player controls" — for Curse of Opulence, and with it Curse of
Bounty and Curse of Disturbance (stand-ins in Token Triumph and Grave Danger), Curse of
Verbosity and Trespasser's Curse (`curses.test.ts`). The other Curses each need one thing more
(`TDC6.json`): Tenuous Truce an attack trigger that counts planeswalkers, Fraying Sanity a count
of cards put into a graveyard this turn, Grievous Wound a static over the enchanted player,
Paradox Haze an added upkeep, Curse of the Restless Dead decayed, Maddening Hex dice, and Ardenn
an attach to a player.

TDC7 (2026-10-05) built demonstrate (rule 702.144a — `demonstrate()`: a copy for you, then one for
the opponent you choose, under their control with their new targets) and a cast offered to a
player other than the effect's controller (`cast-now`'s `by`), for Transforming Flourish, which
leaves Jeskai Striker with no stand-ins, and the Strixhaven Techniques: Creative, Incarnation and
Replication (`demonstrate.test.ts`).

### The one-off keywords pass (2026-10-03)

Fourteen TDC cards, each behind a small keyword or one-off of its own
(`tdc-oneoffs-features.test.ts`): monstrosity and "becomes monstrous" (Stormbreath Dragon,
Protector of the Wastes), Omen (Stormshriek Feral, Whirlwing Stormbrood), exert as it attacks
with its linked "when you do" (Glorybringer), riot and an activated ability's divided damage
(Skarrgan Hellkite), a triggered ability's (Dragonlord Atarka), skulk (Behind the Scenes),
flanking and a block restriction by power (Sidar Kondo of Jamuraa), milling as a cost (Millikin),
entering from a graveyard — `enteredFrom` was there already (River Kelpie) — a graveyard
permission that exiles three other cards (Kotis, Sibsig Champion), a `look-and-choose` over every
graveyard returning under your control as a black Zombie (Necromantic Selection), and targets
capped by total power (Reunion of the House); "exile ~" as it resolves was built already
(`exileOnResolve`). Targets controlled by different players came with Protector. Off the
top-5000 list the same features took Giggling Skitterspike, Rise of the Eldrazi, Combat
Celebrant and Inferno Titan (their recorded blockers), and Marang River Regent, Bloomvine Regent,
Run Away Together and Hydra Broodmaster. Still blocked: Zenith Festival and Nature's Rhythm
(harmonize — see `BACKLOG.md`), Rhythm of the Wild and Spider-Punk (riot *granted* as a creature
enters, rule 614.12), Fury (an evoke cost that exiles a card from hand), Arena of Glory (exerting a
land as a mana cost, and haste for a creature spell its mana paid for).

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

### The features pass (2026-10-02)

Five engine features in parallel, each with the cards it unblocked (33): rules over a search's
finds as a set (Myriad Landscape's shared land type, Krosan Verge's one-each) and `ofChosenType`
in a look-and-choose (Herald's Horn); amounts and conditions (commander casts, converge, the
greatest per player, a sum of power, "controls the greatest", a block filter reading its source,
ravenous: Study Hall, Painful Truths, Windfall, Reign of the Pit, Thickest in the Thicket, Champion
of Lambholt, Jacked Rabbit, Cartographer's Hawk, Heirloom Blade); costs and X targets (a life
cost from commander colours, multikicker, escalate, a graveyard cast that sacrifices a land,
spells whose target count or filter reads X: War Room, Everflowing Chalice, Collective
Resistance, Exploration Broodship, Curse of the Swine, Pest Infestation, Stolen by the Fae);
effects (shuffle into a library, remove a counter, a static that sets creature types, an
attacking-that-player target: Chaos Warp, Unbreathing Horde, Braids, Goddric, Echoing Assault);
and hideaway (rule 702.75: Mosswort Bridge, Spinerock Knoll, Windbrisk Heights and six more).
What still blocks the PC slices is in their records: SCD's leftovers are mostly hard (curses, a
planeswalker that becomes a creature, a target per opponent's graveyard, emblems with triggers).

### The engine passes (2026-10-03)

Four engine passes built in parallel worktrees, each reviewed adversarially before it merged —
79 cards:

- **What a spell targets, copies aimed by their effect, a spell exiled as it resolves** (16):
  Zada, Hedron Grinder; Feather, the Redeemed; Krark, the Thumbless; Alania, Divergent Storm;
  Kalamax, the Stormsire; Imodane, the Pyrohammer; Ivy, Gleeful Spellthief; Volo, Guide to
  Monsters; Stella Lee, Wild Card; Fire Lord Azula; Season of Growth; Rebuff the Wicked; Dawn
  Charm; Pearl-Ear, Imperial Advisor; Sevinne's Reclamation; Reflections of Littjara. Still
  blocked: Orvar, the All-Form (a choice among the spell's targets, a discard's cause), Mendicant
  Core (speed), Ulalek (copying abilities, colourless hybrid), Vesuvan Duplimancy (a token copy
  of the trigger spell's target from last-known information).
- **Mana spent as any colour, playing from exile, casting from the top** (21): the family below.
- **Toxic, casualty, additional upkeep steps** (16): Karumonix, the Rat King; Obeka, Splitter of
  Seconds; Silverquill, the Disputant; Anhelo, the Painter; Bilious Skulldweller; Bloated
  Contaminator; Blightbelly Rat; Myr Convert; Tyrranax Rex; Venerated Rotpriest; White Sun's
  Twilight; Mirrex; Contaminant Grafter; Bloodroot Apothecary; Cut Your Losses. Still blocked:
  blitz (Henzie "Toolbox" Torre — UI), speed (Mendicant Core, Vnwxt, the Raceways), toxic gained
  until end of turn or read by a static's scope (Skrelv, Defector Mite; Skrelv's Hive), and Ixhel,
  Jaxis, Star Athlete, Howlsquad Heavy and Paradox Haze for other features.
- **Copy-on-enter options, legend-rule exemptions, mana-value aggregates** (26): Sakashima of a
  Thousand Faces; Aeve, Progenitor Ooze; Spark Double; Phyrexian Metamorph; Sculpting Steel;
  Mockingbird; Mirrormade; Clever Impersonator; Phantasmal Image; Masterwork of Ingenuity; Copy
  Enchantment; Copy Artifact; Stunt Double; Altered Ego; Malleable Impostor; Vesuva; Auton
  Soldier; Sakashima the Impostor; Estrid's Invocation; Glasspool Mimic; Ghalta and Mavren;
  Prime Speaker Zegana; One with the Machine; and three precon stand-ins' originals, Deceptive
  Frostkite, Cursed Mirror and Tangleweave Armor. Still blocked: The Mimeoplasm and Echoing
  Deeps (a copy of a card in a graveyard), and Karn, Legacy Reforged, Aloy, Coram, Selvala,
  Mirror Box, Machine God's Effigy, Imposter Mech, Sakashima's Student, Flesh Duplicate,
  Chameleon, Vizier of Many Faces and Naga Fleshcrafter for other features.

A second round the same morning, 74 more:

- **Sacrifice costs of several permanents** (12): Sai, Master Thopterist; Jarad, Golgari Lich
  Lord; Westvale Abbey // Ormendahl, Profane Prince; Eliminate the Competition; Magda, Brazen
  Outlaw; Metalwork Colossus; Mondrak, Glory Dominus; Priest of Forgotten Gods; Ruthless
  Technomancer; Zopandrel, Hunger Dominus; Grim Hireling; Dread Return. Partly built — "sacrifice
  any number" isn't (Plumb the Forbidden, Dargo, Extus). Still blocked for other features: Breya
  (modal activated abilities with targeted modes), Chatterfang and Peregrin Took (an additive token
  replacement), Magda, the Hoardmaster (crime), Bolas's Citadel (paying life for a top-of-library
  cast), Shilgengar, Valgavoth, Scourge of Nel Toth.
- **The TDC one-offs** (22): monstrosity, Omen, exert, riot, skulk, flanking, a mill cost, entering
  from a graveyard, a spell exiling itself, an ability's divided damage — Stormbreath Dragon,
  Protector of the Wastes, Stormshriek Feral, Whirlwing Stormbrood, Glorybringer, Skarrgan
  Hellkite, Dragonlord Atarka, Behind the Scenes, Sidar Kondo of Jamuraa, Millikin, River Kelpie,
  Kotis, Sibsig Champion, Necromantic Selection, Reunion of the House and eight more. Still
  blocked: harmonize (Zenith Festival, Nature's Rhythm), riot granted as a permanent enters (Rhythm
  of the Wild, Spider-Punk), evoke with a non-mana cost (Fury), Arena of Glory.
- **Copying abilities and the "ready now" cards** (18): Lithoform Engine, Illusionist's Bracers,
  Thousand-Year Storm, Reverberate, Dualcaster Mage, Inalla, Jin-Gitaxias, Progress Tyrant, Kitsa,
  Electroduplicate, Brain Freeze, Chain of Vapor, Sword of Wealth and Power, Thunderclap Drake,
  Weaver of Harmony, Primal Amulet, Virtue of Knowledge, Wandering Archaic and Sink into Stupor.
  Still blocked: Rings of Brighthearth (cycling isn't an ability on the stack), Twinning Staff,
  Echoes of Eternity (Kindred), Koma, Maskwood Nexus, Throne of Eldraine, Adagia, Hostage Taker,
  Gonti, Lord of Luxury and Brainstealer Dragon. A parallel pass on an older base also authored
  Strionic Resonator, Peter Parker's Camera, Molten Echoes, Flameshadow Conjuring and Increasing
  Vengeance on its own copy-ability feature; that branch wasn't merged, and those five are
  re-authorable on the one that was.
- **Winning and losing the game** (22, merged after the others): "you win the game", "you lose
  the game", "can't lose / can't win" (a static and a turn's effect), Laboratory Maniac's draw
  replacement, a damage life floor, "can't lose life" (rule 119.8 — every life payment refused),
  hand-size effects in timestamp order (613.11), "Nth from the top" and a game-long record of
  spells cast by name — Thassa's Oracle, Laboratory Maniac, Jace, Wielder of Mysteries, Platinum
  Angel, Herald of Eternal Dawn, Angel's Grace, Everybody Lives!, Felidar Sovereign, Test of
  Endurance, Revel in Riches, Triskaidekaphile, Knuckles the Echidna, Simic Ascendancy, Helix
  Pinnacle, Hellkite Tyrant, Twenty-Toed Toad, Approach of the Second Sun, Pact of Negation,
  Summoner's Pact, Vorpal Sword, Summon: Primal Odin, Mirrodin Besieged. Still blocked: Mechanized
  Production and Liliana's Contract (tokens' rule-111.4 names), Final Fortune and Last Chance (a
  trigger tied to one extra turn), Halo Fountain (untapping as a cost), Darksteel Reactor (a state
  trigger), The Golden Throne (a would-lose replacement), Out of the Tombs, Maze's End.

### Round three (2026-10-03, afternoon)

Five more passes, all merged (156 cards):

- **Mana abilities** (28): a colour chosen as it resolves keyed to an amount, "any type a land you
  control could produce", colours among permanents or graveyard cards, mana doubling, imprint —
  Nykthos, Nyx Lotus, Reflecting Pool, Horizon of Progress, Mox Amber, Bloom Tender, The Grey
  Havens, Mana Reflection, Mana Flare, Heartbeat of Spring, Zendikar Resurgent, Mirari's Wake,
  Kinnan, Culling Ritual, Deathrite Shaman, Chrome Mox, Three Tree City, Faeburrow Elder and
  more. Still blocked: Selvala, Heart of the Wilds and Cascading Cataracts (a colour-split
  picker), Omnath, Locus of All and Yurlok (mana that doesn't empty), Jasmine Boreal (a
  restriction read as the spell is cast), Pit of Offerings (a linked targeted exile), Outcaster
  Trailblazer (plot), Extraplanar Lens, Vorinclex, Voice of Hunger.
- **Library ordering and choosing cards as a cost** (18): Sensei's Divining Top, Dig Through
  Time, Stock Up, Experimental Augury, Halimar Depths, Teferi's Puzzle Box, Aragorn, Valakut
  Awakening, Growing Rites of Itlimoc, Varina, Drivnod, Psychic Frog, Mines of Moria, Nezahal,
  Key to the City, Ghostly Pilferer, Moorland Haunt, Mesmeric Orb. Still blocked: Scroll Rack,
  Kozilek, the Great Distortion, Satoru Umezawa (ninjutsu), Aminatou (miracle), Birgi (boast),
  Jaxis (blitz — client), Chainer, Shilgengar.
- **Infect, wither, spree and gift** (30): Inkmoth Nexus, Plague Myr, Blighted Agent, Skithiryx,
  Tainted Strike, Triumph of the Hordes, Phyresis, Three Steps Ahead, Final Showdown, Requisition
  Raid, Smuggler's Surprise, Dawn's Truce, Into the Flood Maw, Parting Gust, Starfall Invocation,
  Scrapshooter and more. Still blocked: Return the Favor (changing a target), Great Train Heist,
  Lively Dirge, Grafted Exoskeleton (an unattach trigger), Blightsteel Colossus (a self-shuffle
  replacement from any zone), Perch Protection (phasing).
- **Leftovers** (7, and a fix): Notion Thief made exact (it spares an opponent's first draw in
  each of their draw steps); Strionic Resonator, Peter Parker's Camera, Molten Echoes,
  Flameshadow Conjuring and Increasing Vengeance on main's copy-ability vocabulary; Ixhel, Scion
  of Atraxa; Battlemage's Bracers. Still blocked: Koma (modal activated abilities with targeted
  modes), Maskwood Nexus, Twinning Staff, Rings of Brighthearth, Echoes of Eternity, Adagia,
  Throne of Eldraine.
- **The TDC precons** (73; stopped at the user's call with 15 commits in, then reviewed in four
  parts — a dozen fixes, no card pulled): a counter as a cost (Wall of Roots), exchanging life and
  toughness (Tree of Redemption, Tree of Perdition), cards exiled with a source (Colfenor's Urn),
  Canopy Gargantuan, Baldin, Weathered Sentinels, Essence Anchor, Welcome the Dead, Tip the
  Scales; cycling as an ability on the stack with "when you cycle this card" (Dismantling Wave,
  Decree of Pain) and targets bound to a seat (Afterlife from the Loam); the command zone
  (Command Beacon), graveyard statics (Wonder, Anger, Brawn, Filth), per-player edicts (Will of
  the Abzan, Will of the Mardu); Temple of the Dragon Queen; tokens attacking this combat, Angels
  instead, becoming a copy and bounce costs (Legion Warboss, Divine Visitation, Sarkhan, Soul
  Aflame, Myr Battlesphere, Quirion Ranger, Multani, Mina and Denn); first attacks, random
  opponents and convokers (Scourge of the Throne, Territorial Hellkite, Living Death, Lethal
  Scheme); shadow, void counters and an opponent's choice (Dauthi Voidwalker, Tasigur,
  Colossal Grave-Reaver); Neriv; "exile X cards from your graveyard" and self-bounce costs
  (Necropolis Fiend, Shigeki); Gix; Selvala's Stampede; Steward of the Harvest; Opportunistic
  Dragon; Sepulchral Primordial, Chandra's Ignition, Baloth Prime and more from the other
  precons. Two pieces it built again were on main already, and main's were kept: Faeburrow
  Elder's mana and "exile N cards from your graveyard" as a cost (now with an X). TDC stand-ins
  left: 8 (above).

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

- **Batch 19 (2026-10-04)** triaged ranks 2347–2428: 36 authored (God-Eternal Oketra, Halvar, God
  of Battle, Dowsing Dagger, Samwise Gamgee, Orthion, Hero of Lavabrink, Zealous Conscripts and 30
  more — `top5000-batch-19a`–`19d.test.ts`); 26 blocked (`B19.json`). No engine change.
  Nothing blocks more than two of them; the pairs are a modal activated ability with targeted
  modes (Bow of Nylea, Aetheric Amplifier — Breya's and Koma's gap) and an alternative cost with
  a once-a-turn limit (Darksteel Monolith; Bruenor's free first equip is its activated-ability
  twin). Small and single: "can't be blocked except by N or more" (Pathrazer), a triggered mana
  ability's "while" condition (Regal Behemoth), counters from an amount on a return (Nine-Lives
  Familiar), "combat damage can't be prevented" (Frenzied Baloth), an additive counter
  replacement (Conclave Mentor) and moving a counter (graft — Llanowar Reborn). Professor Onyx
  was dropped on its ruling: its −8 has every opponent choose a card hidden, then discard them
  all at once, which `each-player-may` can't do.

- **Batch 20 (2026-10-04, the no-engine-work pass)** triaged ranks 2429–2703: 103 authored (Master Transmuter, Primordial Hydra, Mycosynth Wellspring, Consuming Corruption, Cranial Plating and 98 more — `top5000-batch-20a`–`h.test.ts`); 97 blocked (`B20.json`), each skipped at the first sign of engine work. Most-cited blockers: `static:combat-restriction-extensions` (3), `new:meld` (2), `effect:cast-during-resolution` (2), `trigger:activates-ability` (2), `mechanic:rooms` (2).

- **Batch 21 (2026-10-04, the no-engine-work pass)** triaged ranks 2704–2972: 102 authored (Vega, the Watcher, Blade Historian, Step Through, Vein Ripper, Master of Dark Rites and 97 more — `top5000-batch-21a`–`h.test.ts`); 98 blocked (`B21.json`), each skipped at the first sign of engine work. Most-cited blockers: `mechanic:rooms` (3), `keyword:ninjutsu` (3), `keyword:crew` (2), `effect:target-spec-additions` (2), `mechanic:the-ring` (2).

- **Batch 22 (2026-10-04, the no-engine-work pass)** triaged ranks 2973–3255: 98 authored (Jumbo Cactuar, Galvanic Iteration, Abraded Bluffs, Repercussion, Regal Caracal and 93 more — `top5000-batch-22a`–`h.test.ts`); 102 blocked (`B22.json`), each skipped at the first sign of engine work. Most-cited blockers: `effect:choices-by-other-players` (3), `condition:devotion` (3), `keyword:crew` (3), `effect:delayed-trigger-extensions` (2), `new:prevent-and-reflect-damage` (2).

- **Batch 23 (2026-10-04, the no-engine-work pass)** triaged ranks 3256–3511: 94 authored (Angel of Indemnity, Savvy Hunter, Manaweft Sliver, Keeper of Secrets, Celestial Armor and 89 more — `top5000-batch-23a`–`h.test.ts`); 106 blocked (`B23.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (4), `effect:choices-by-other-players` (3), `cost:cost-modification-extensions` (3), `mechanic:curses` (2), `new:rebound` (2).

- **Batch 24 (2026-10-04, the no-engine-work pass)** triaged ranks 3512–3786: 95 authored (Steel of the Godhead, Agent Frank Horrigan, Good-Fortune Unicorn, Shadow in the Warp, Storm the Vault and 90 more — `top5000-batch-24a`–`h.test.ts`); 105 blocked (`B24.json`), each skipped at the first sign of engine work. Most-cited blockers: `effect:choices-by-other-players` (3), `keyword:ninjutsu` (3), `keyword:crew` (3), `new:static-set-color` (2), `mechanic:dice-rolling` (2).

- **Batch 25 (2026-10-04, the no-engine-work pass)** triaged ranks 3787–4054: 91 authored (Tempered Steel, White Auracite, Sanctum of Stone Fangs, Garruk, Cursed Huntsman, Animal Sanctuary and 86 more — `top5000-batch-25a`–`h.test.ts`); 109 blocked (`B25.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (9), `mechanic:dice-rolling` (4), `new:static-lose-all-abilities` (3), `mechanic:curses` (2), `effect:attach-extensions` (2).

- **Batch 26 (2026-10-04, the no-engine-work pass)** triaged ranks 4055–4313: 90 authored (Anara, Wolvid Familiar, Sower of Temptation, Creosote Heath, Viridian Revel, Quicksilver Amulet and 85 more — `top5000-batch-26a`–`h.test.ts`); 110 blocked (`B26.json`), each skipped at the first sign of engine work. Most-cited blockers: `effect:emblem-triggered-abilities` (6), `keyword:crew` (4), `mechanic:the-ring` (3), `mechanic:rad-counters` (3), `new:class-levels` (2).

- **Batch 27 (2026-10-04, the no-engine-work pass)** triaged ranks 4314–4581: 86 authored (Kaya's Wrath, Crystalline Sliver, Phyrexian Rebirth, Boomerang Basics, Shifting Sliver and 81 more — `top5000-batch-27a`–`h.test.ts`); 114 blocked (`B27.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (3), `effect:cast-and-activate-restrictions` (2), `new:return-transformed-non-dfc-stays-exiled` (2), `mechanic:face-down` (2), `effect:modal-activated-targeted-modes` (2).

- **Batch 28 (2026-10-04, the no-engine-work pass)** triaged ranks 4582–4836: 92 authored (Master of the Feast, Boon of the Spirit Realm, Strixhaven Stadium, Electrickery, Grim Affliction and 87 more — `top5000-batch-28a`–`h.test.ts`); 108 blocked (`B28.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (6), `keyword:crew` (4), `replacement:damage-modification` (3), `effect:token-copy-options` (3), `effect:delayed-trigger-extensions` (3).

- **Batch 29 (2026-10-04, the no-engine-work pass)** triaged ranks 4837–5011: 58 authored (Sporocyst, Braids, Cabal Minion, On the Trail, Barbarian Ring, Deliberate and 53 more — `top5000-batch-29a`–`h.test.ts`); 76 blocked (`B29.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (4), `effect:choices-by-other-players` (2), `static:combat-restriction-extensions` (2), `mechanic:face-down` (2), `mechanic:the-ring` (2).

- **Batch 30 (2026-10-04, the no-engine-work pass)** triaged ranks 5011–5251: 92 authored (Sweet-Gum Recluse, Lord of Atlantis, Soul Snuffers, Carnifex Demon, Horn of Valhalla and 87 more — `top10000-batch-30a`–`h.test.ts`); 107 blocked (`B30.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (11), `condition:devotion` (3), `keyword:miracle` (2), `mechanic:dice-rolling` (2), `mechanic:the-ring` (2).

- **Batch 31 (2026-10-04, the no-engine-work pass)** triaged ranks 5252–5490: 98 authored (March from the Black Gate, Sanctum of Fruitful Harvest, Rile, Astrologian's Planisphere, Combat Tutorial and 93 more — `top10000-batch-31a`–`h.test.ts`); 102 blocked (`B31.json`), each skipped at the first sign of engine work. Most-cited blockers: `keyword:discover` (3), `mechanic:rad-counters` (3), `mechanic:suspend-and-time-counters` (3), `new:unverified-in-mass-pass` (3), `mechanic:rooms` (2).

- **Batch 32 (2026-10-04, the no-engine-work pass)** triaged ranks 5491–5728: 95 authored (Earthbending Student, Serah Farron, Squirming Emergence, Honden of Cleansing Fire, United Front and 90 more — `top10000-batch-32a`–`h.test.ts`); 105 blocked (`B32.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (5), `effect:choices-by-other-players` (2), `mechanic:mutate` (2), `effect:put-onto-battlefield-options` (2), `mechanic:the-ring` (2).

- **Batch 33 (2026-10-04, the no-engine-work pass)** triaged ranks 5729–5968: 109 authored (Steel Seraph, Angelic Chorus, The Seedcore, Rite of Passage, Legolas Greenleaf and 104 more — `top10000-batch-33a`–`h.test.ts`); 91 blocked (`B33.json`), each skipped at the first sign of engine work. Most-cited blockers: `mechanic:dungeon` (4), `replacement:damage-modification` (3), `mechanic:face-down` (3), `new:unverified-in-mass-pass` (3), `effect:choices-by-other-players` (2).

- **Batch 34 (2026-10-04, the no-engine-work pass)** triaged ranks 5969–6199: 101 authored (Pillar of Origins, G'raha Tia, Scion Reborn, Ryusei, the Falling Star, Charisma Bobblehead, Winged Sliver and 96 more — `top10000-batch-34a`–`h.test.ts`); 99 blocked (`B34.json`), each skipped at the first sign of engine work. Most-cited blockers: `new:unverified-in-mass-pass` (7), `mechanic:dice-rolling` (3), `condition:cast-spell-targets` (2), `effect:control-change-extensions` (2), `zone:graveyard-cast-permissions` (2).

- **Batch 35 (2026-10-04, the no-engine-work pass)** triaged ranks 6200–6428: 86 authored (Incremental Blight, Whisper, Blood Liturgist, Sarkhan's Unsealing, Oni-Cult Anvil, SP//dr, Piloted by Peni and 81 more — `top10000-batch-35a`–`h.test.ts`); 113 blocked (`B35.json`), each skipped at the first sign of engine work. Most-cited blockers: `effect:copy-exceptions` (3), `new:unverified-in-mass-pass` (3), `new:plot` (2), `mechanic:role-tokens` (2), `effect:reflexive-trigger` (2).

- **Batch 36 (2026-10-06, the no-engine-work pass)** triaged ranks 6429–6671: 103 authored (Dream Trawler, Pestilent Syphoner, Thing in the Ice, Teysa, Opulent Oligarch, Court of Bounty, Akroma's Vengeance and 97 more — `top10000-batch-36a`–`h.test.ts`); 97 blocked (`B36.json`), each skipped at the first sign of engine work. Most-cited blockers: `effect:emblem-triggered-abilities` (5), `mechanic:face-down` (4), and two each for suspend, saddle, dice, waterbend, retrace and random choice. Two engine gaps found on the way (`docs/engine-gaps.md`): a sacrifice trigger misses its own sacrifice (Esoteric Duplicator), and a tapped-for-mana trigger adds only a fixed amount (Elvish Guidance). One engine fix: "each player who lost life this turn" now counts a player who has since lost the game (Tymna's, Teysa's rulings), which unblocked Teysa, Opulent Oligarch.

Past rank 6671, nothing is triaged.

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
Loki Laufeyson waits on a live amount in a delayed `nextSpell` filter ("Open leads"). Not yet checked: Black Panther, Most
Dangerous, Human Torch, Jack of Hearts, Shang-Chi and Stature.

### Mana spent as any colour, playing from exile, casting from the top (2026-10-03)

`cost:mana-spending-rules` (`spendManaAs`, a permission's `spendAs`, deny-list mana),
`zone:play-from-exile-with-counter` (`playFromExile`) and `zone:cast-from-library-top`
(`castFromLibraryTop`, `looksAtOwnLibraryTop`) are built, with 21 cards: Gonti, Canny
Acquisitor; Laughing Jasper Flint; Grolnok, the Omnivore; Haldan, Avid Arcanist; Tinybones,
Bauble Burglar; Glarb, Calamity's Augur; Sigarda, Font of Blessings; Thundermane Dragon; Grenzo,
Havoc Raiser; Korlessa, Scale Singer; Vizier of the Menagerie; Elven Chorus; Mystic Forge; Crystal
Skull, Isu Spyglass; Emperor Mihail II; Hakoda, Selfless Commander; Realmwalker; Stolen Strategy;
Outrageous Robbery; Chromatic Orrery; You Find Some Prisoners. Still blocked, with what else each
needs:

- **Another player's library in a look-and-choose** (look at the top N of an opponent's library,
  exile one face down): Gonti, Lord of Luxury; Thief of Sanity; Siphon Insight.
- **An O-Ring that lets you cast what it took** (Hostage Taker): the engine returns an O-Ring's
  card with a trigger, so the cast permission would still be live in that window — rule 610.3
  returns it at once.
- **"Its owner" as a player** (Brainstealer Dragon's "they lose life"), **an attack on your
  planeswalkers** as well as on you (Cunning Rhetoric), **"if that spell would be put into a
  graveyard, exile it instead" on an impulse cast** (Dire Fleet Daredevil), **"tap it" on its own
  source** (Rakdos, the Muscle), **a once-each-turn top-of-library cast** (Assemble the Players),
  **"a spell from anywhere other than your hand" as a mana restriction** (Mm'menon, the Right
  Hand), a free cast from among an enchantment's exiled cards (Court of Locthwain), a cast-now
  with any-type spending (Tinybones, the Pickpocket), a hand-or-top reveal (Eladamri, Korvecdal),
  a CDA aggregate (Karn, Legacy Reforged), toxic (Ixhel, Scion of Atraxa), coven (Augur of
  Autumn), trigger doubling (Traveling Chocobo), a Case or Class (Case of the Locked Hothouse,
  Fortune Teller's Talent) and reconfigure (The Reality Chip).

### Ready now: the cards the 10-03 passes unblocked (2026-10-03)

28 cards whose every recorded blocker those passes had built (a copy's new targets above all),
rechecked against their Oracle text and rulings. Built for them: `copy-spell`'s `count` with a
cast trigger's `countCastBefore` and the `{ commanderCasts: "you" }` amount; a mana rider's "that
spell" as a `"trigger-spell"`; copying an activated or triggered ability (`copy-ability`, the
`{ kind: "ability" }` target, the `activates-ability` trigger); a `spell-or-permanent` target;
`look-and-choose`'s `player: "that-player"`; `each-player-may`'s `who: { controllerOfTarget }`;
and trigger doublers reaching only permanents' abilities (a commander's eminence from the
command zone isn't one). 18 authored: Reverberate;
Dualcaster Mage; Brain Freeze; Kitsa, Otterball Elite; Jin-Gitaxias, Progress Tyrant; Sword of
Wealth and Power; Electroduplicate; Inalla, Archmage Ritualist; Thousand-Year Storm; Thunderclap
Drake; Primal Amulet; Lithoform Engine; Weaver of Harmony; Virtue of Knowledge; Illusionist's
Bracers; Wandering Archaic; Sink into Stupor; Chain of Vapor. Hate Mirage's "those tokens gain haste" was made
non-copiable on the way, as Inalla's is. Still blocked, each by more than its record said:

- **Rings of Brighthearth**: "whenever you activate an ability" must see cycling, which the
  engine resolves without the stack (BACKLOG, "Engine rules gaps").
- **Twinning Staff**: a replacement on copying a spell, and its controller choosing where the
  additional copy goes among the others (its ruling) — no order decision for copies.
- **Echoes of Eternity**: the Kindred card type, and doubling a colourless *spell's* triggers
  (`doubleTriggersOf` reaches permanents only).
- **Koma, Cosmos Serpent**: a modal *activated* ability with a targeted mode, and "its
  activated abilities can't be activated this turn".
- **Maskwood Nexus**: creature spells and creature cards outside the battlefield being every
  creature type — a static's types reach only the battlefield.
- **Throne of Eldraine**: "spend this mana only to cast monocolored spells of that color" (no
  monocoloured or chosen-colour clause in a mana restriction) and "spend only mana of the
  chosen color to activate this ability" (no spending rule on an activation cost).
- **Adagia, Windswept Bastion**: a token copy of an Aura must be told what it enchants as it
  enters (rule 303.4f, its ruling); `create-token-copy` doesn't ask.
- **Hostage Taker, Gonti, Lord of Luxury, Brainstealer Dragon**: as the mana-and-exile pass
  recorded (the O-Ring's return by trigger; another player's library in a look-and-choose; "its
  owner" as a player).

Leads the new pieces open outside this list: Strionic Resonator ("copy target **triggered** ability you control" — needs only an
`abilityKind` clause on the `ability` target); Battlemage's Bracers (`activates-ability`, with
haste); Ulalek, Fused Atrocity still waits on colourless hybrid mana.

### Elsewhere

- **Modal activated abilities with targeted modes** (Breya, Etherium Shaper; Koma, Cosmos
  Serpent; Umezawa's Jitte) and the rest of that family: `neededCards-features.md`, "Modal
  triggers with targeted modes".
- **Host-trigger cards** (34 left): `neededCards-features.md`, "Host triggers".
- **The limitation ledger**: `neededCards-features.md`, "The limitation ledger", and
  `cards/AUTHORING.md` §15.
