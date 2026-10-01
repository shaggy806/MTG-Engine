# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**331 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Ready to author, no engine work: none left** (2026-09-28: Astarion, Wolverine, Tannuk,
  both Zurgos, and Zinnia with `static:grant-offspring-to-spells`, were the last).
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The next
  ten, engine-only, with the commanders each fully unblocks:
  `cost:mana-spending-rules` (+2), `effect:amount-aggregate` (+1), `keyword:toxic` (+1),
  `zone:play-from-exile-with-counter` (+2), `trigger:discards-extensions` (+1),
  `zone:visibility-extensions` (+1), `zone:cast-from-library-top` (+2), `keyword:blitz` (+1),
  `keyword:mayhem` (+1), `effect:additional-upkeep-steps` (+1).
- **Most-needed features overall.** `effect:may-sacrifice-then` (13),
  `decision:copy-new-targets` (12), `effect:copy-spell-extensions` and
  `decision:choose-permanent` (11 each). `zone:exile-face-down` (Edward Kenway) was split
  out of `zone:visibility-extensions` and built; Gonti and Ixhel still need
  `cost:mana-spending-rules`. Live numbers come
  from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:may-sacrifice-then` (13), `decision:copy-new-targets` (12), `decision:choose-permanent`
  (11) and `effect:cast-during-resolution` (10 — partly built on 2026-09-30 as the `cast-now`
  effect; what's left is in its `top-commanders-gaps.json` description),
  `decision:free-cast-choices` (9), `effect:attach-extensions` (7). Sen Triplets also needs
  `zone:cast-from-opponents-hand` (playing cards from the target's revealed hand), on top of
  the revealed hand itself.
- **Commanders authored and then dropped by their reviews.** Tifa Lockhart and Yarok need the
  player to order simultaneous triggers (`decision:trigger-order`), and so does Hero of Bladehold. Aragorn, the Uniter needs
  scry to let the player order the kept cards (`decision:library-ordering`).

## Card backlog (top-5000 staples and the precons)

- **Now (priority since 2026-09-30): the missing cards of the Tarkir: Dragonstorm precons.**
  The five TDC decks are `SAMPLE_DECKS`, so every bot and every unclaimed seat plays them, with
  stand-ins for what the engine can't run yet (`engine/src/sample-decks.ts`'s substitution
  tables; `docs/plans/precon-decks.md`). Author those cards deck by deck, ahead of the top-5000
  list; delete each one's substitution as it lands (`sample-decks.test.ts` insists). 147 were
  missing at the swap; TDC batch 1 authored 41 (`precon-tdc-batch-1.test.ts`) and batch 2 the 8
  that casting a spell as another resolves unblocked (`precon-tdc-batch-2.test.ts`: the `cast-now`
  effect from a hand, graveyard or library top, free, with "if you do / don't"). Missing now:
  Temur Roar 21, Sultai Arisen 27, Abzan Armor 18, Mardu Surge 14, Jeskai Striker 18 — 98, every
  one recorded with what it needs (`engine/data/sweep-3/TDC1.json`, `TDC2.json` and the earlier
  sweeps). No one feature leads any more. **Next:** a copy with new targets
  (`decision:copy-new-targets`, 4 — Adaptive Training Post and Expansion // Explosion need
  nothing else), delve (4, only Treasure Cruise needing nothing else), "can attack as though it
  didn't have defender" until end of turn (3: Assault Formation, Wakestone Gargoyle, Walking
  Bulwark), then two each for divided damage, hideaway, Omen and "the creature it sacrificed".
- **Cards `cast-now` may have unblocked, outside the precons.** The feature stays out of the
  gaps JSON's `built` list (it's only partly built), so the top-5000 and commander batches would
  still skip these, each recorded as blocked on it: Rishkar's Expertise, Jodah, the Unifier (a
  `reveal-until` whose `then` is a free `cast-now`), Kellan, the Kid, Descendants' Path and
  Buster Sword. Recheck each against its Oracle text before authoring it.
- **The Incarnations' evoke: "Evoke—Exile a [color] card from your hand."** Evoke is built for
  mana costs (2026-09-29, Ashling); Endurance, Solitude, Fury and Subtlety (and Grief) pay theirs
  by exiling a card of their color from hand, a non-mana cost choice the evoke variant can't
  carry yet (`evokeCostsOf` in `game.ts`). Fury needs damage divided among targets as well.
- **Top-5000 batch 4 (2026-09-28) took the cards the debt fixes unblocked:** 15 authored
  (regeneration, Strive's Twinflame, Will of the Temur, …); 10 still blocked, each named in
  `engine/data/sweep-3/B4.json`. The two cheapest wins there: a count of a *targeted* player's
  permanents (Will of the Mardu, Call the Coppercoats) and a "when you cycle this card" trigger
  (Decree of Pain). Still blocked among the Warp / Offspring / Eternalize cards: Loading Zone
  (counters a permanent *enters* with doubled too), Anticausal Vestige (a hand filter reading
  your land count), Warren Warleader (a token entering tapped and attacking) and Vizier of Many
  Faces (Embalm through its Clone ability).
- **Top-5000 batch 5 (2026-09-29) triaged every open entry through rank 981:** 51 authored —
  the Enduring cycle, the Urza's lands, Mystic Sanctuary's cycle (its other members down to
  rank 4293), The Earth Crystal, Elspeth, Storm Slayer, Last March of the Ents and 36 more —
  with six small engine pieces (see `neededCards-features.md`,
  "Top-5000 batch 5"); 79 blocked, each in `engine/data/sweep-3/B5.json`. **Next**, by what
  blocks the most of them: a free cast during resolution (`effect:cast-during-resolution`, 4 —
  Isochron Scepter, Mizzix's Mastery, Beseech the Mirror, Buster Sword); then 3 each for
  "Sacrifice N [things]" as a cost (`cost:sacrifice-multiple` — Sai, Peregrin Took, Grim
  Hireling, and Mondrak and Magda before them), improvise (Kappa Cannoneer, Inspiring
  Statuary, Archway of Innovation) and a copy's new targets. Cheaper, and wider than this
  batch: an Aura's static that sets what the enchanted creature is (Kenrith's Transformation,
  Imprisoned in the Moon, then Darksteel Mutation, Song of the Dryads, Frogify) and a life-gain
  multiplier (The Wind Crystal, Alhammarret's Archive, Rhox Faithmender, Boon Reflection).
- **Top-5000 batch 6 (2026-09-29) triaged ranks 982–1210 and the three double-faced cards
  batch 5's list reader skipped:** 53 authored — 49 from the batch (Torbran, Annie Joins Up,
  Mirror Entity, Stoneforge Mystic, Bloodghast, Luminous Broodmoth, Archon of Cruelty and 42
  more) and 4 further down that its new engine pieces unblocked (Prowling Serpopard,
  Allosaurus Shepherd, Hexing Squelcher, Batterskull — see `neededCards-features.md`,
  "Top-5000 batch 6"); 64 blocked, each in `engine/data/sweep-3/B6.json`. **Next**, by what blocks the most of them:
  "you win the game" (`new:win-game`, 4 here — Approach of the Second Sun, Mechanized
  Production, Jace, Wielder of Mysteries, Revel in Riches — and 7 across every record, with
  Thassa's Oracle, Laboratory Maniac and Hellkite Tyrant); then 3 each for a variable number
  of targets (`decision:variable-target-count` — Agadeem's Awakening, Pest Infestation,
  Crackle with Power), ascend (Wayward Swordtooth, Ocelot Pride, Twilight Prophet) and
  looking at the top card of a library (`zone:visibility-extensions` — The Reality Chip,
  Mishra's Bauble, Augur of Autumn). Ojer Taq needs only two small pieces: a token
  multiplier limited to creature tokens, and a count of the creatures attacked with this turn.
- **Top-5000 batch 7 (2026-09-29) triaged ranks 1211–1356:** 61 authored — 60 from the batch
  (Dark Confidant, Past in Flames, Valakut, Ulamog, the Ceaseless Hunger, Courser of Kruphix,
  Akroma's Memorial and 54 more) and Will of the Jeskai, which Past in Flames' mass flashback
  unblocked (see `neededCards-features.md`, "Top-5000 batch 7"); 50 blocked, each in
  `engine/data/sweep-3/B7.json`. **Next**, by what blocks the most of them: ordering cards
  put back on a library (`decision:library-ordering`, 3 here — Stock Up, Halimar Depths,
  Experimental Augury — and 8 across every record, with Ponder, Sensei's Divining Top and Dig
  Through Time); then improvise (Whir of Invention, Organic Extinction; 5 across records) and
  an Aura or static that sets what a creature is (Amphibian Downpour, Vraska, Betrayal's
  Sting). Across every record the most-blocking open features are a copy's new targets
  (`decision:copy-new-targets`, 11), mana-ability extensions (`effect:add-mana-extensions`,
  10) and "sacrifice N" costs (`cost:sacrifice-multiple`, 9). Cascading Cataracts waits on a
  way to choose "five mana in any combination of colors" unit by unit
  (`new:mana-any-combination-choice`): activated by hand, that's 126 splits.
- **Top-5000 batch 8 (2026-09-29) triaged ranks 1357–1505:** 57 authored — 56 from the batch
  (Embercleave, Restoration Angel, Martial Coup, Rankle, Genesis Wave, Terastodon, Guide of
  Souls and 49 more) and Training Grounds, which the new one-mana floor on activation-cost
  reductions unblocked (see `neededCards-features.md`, "Top-5000 batch 8"); 54 blocked, each
  in `engine/data/sweep-3/B8.json`. **Next**, by what blocks the most of them: a copy's new
  targets (`decision:copy-new-targets`, 4 here — Thousand-Year Storm, Reverberate, Rings of
  Brighthearth, Echoes of Eternity — 10 across the sweep-3 records and 26 counting sweep-2's
  commanders); then 2 each for shuffling a graveyard into a library (Ulamog, the Infinite Gyre,
  Elixir of Immortality), "sacrifice N" costs, a land with an Adventure, a card chosen as a
  cost, damage prevented to a filter, and a variable number of targets. Across every record
  the next are a free cast during resolution (`effect:cast-during-resolution`, 16) and
  "sacrifice N" costs (`cost:sacrifice-multiple`, 15). Grab the Prize needs only the card
  discarded as its cost remembered, as a sacrificed one already is (`new:cost-discarded-reference`).
- **Top-5000 batch 9 (2026-09-29) triaged ranks 1507–1632:** 46 authored (Uro, Cryptic Command,
  Natural Order, Hangarback Walker, Monastery Mentor, Hydroid Krasis, It That Betrays and 39
  more, with Boon Reflection and The Wind Crystal from further down, which the new life-gain
  doubler unblocked — see `neededCards-features.md`, "Top-5000 batch 9"); 57 blocked, each in
  `engine/data/sweep-3/B9.json`. **Next**, by what blocks the most of them: discard (or exile
  cards) as an activation cost (`cost:choose-cards-as-cost`, 4 here — Tortured Existence, Fomori
  Vault, Kozilek, Chainer — and 14 across every record, with Yawgmoth, Fauna Shaman, Nezahal and
  Solphim waiting on nothing else); then "you win / lose the game" (`new:win-game`, 11 across
  records with Final Fortune, Felidar Sovereign and Twenty-Toed Toad). Cheap single-card
  pieces it found: stun counters (Unstoppable Slasher), a batched leaves-battlefield trigger
  (Dour Port-Mage), a damage replacement filtered by recipient (Losheel), the Kindred card type
  (Eldrazi Conscription).
- **Top-5000 batch 10 (2026-09-29) triaged ranks 1645–1722:** 31 authored (Nissa, Who Shakes the
  World, Glen Elendra Archmage, Blast Zone, Murderous Rider, Court of Grace, Jin-Gitaxias and 25
  more — see `neededCards-features.md`, "Top-5000 batch 10"); 29 blocked, each in
  `engine/data/sweep-3/B10.json`, almost all by features no other card here needs. Two measured
  surprises: a static can't choose what it affects by power or toughness (Tetsuko Umezawa — an
  `affects` filter reading P/T matches nothing inside the layer fold), and "whenever a counter is
  put on" is once per counter for Fathom Mage (its ruling) where `counters-put` fires per event.
  Across every record the leaders are unchanged: a copy's new targets
  (`decision:copy-new-targets`, 28), a free cast during resolution (18), "sacrifice N" costs (16).
- **Top-5000 batch 11 (2026-09-29) triaged ranks 1723–1801:** 31 authored with no new engine
  vocabulary (Mana Leak, Archmage's Charm, Death Baron, Alesha, Vaultborn Tyrant, Aurelia, the Law
  Above, Urabrask the Hidden and 24 more — `top5000-batch-11.test.ts`); 29 blocked, each in
  `engine/data/sweep-3/B11.json`. The copy family (`decision:copy-new-targets`, now 30 across
  records) and Rooms, rebound, d20 rolls and "choose one that hasn't been chosen this turn"
  (Teval's Judgment, Gala Greeters) each block two or more.
- **Discard as an activation cost is built (2026-09-29, `ability-discard-cost.test.ts`):**
  `AbilityCost.discard: { count, filter? }`, paid with the `discard` decision (narrowed to the
  matching cards for "Discard a creature card"; dev-rooms `DISCD`/`DISC4`). It unblocked
  Tortured Existence, Fomori Vault, Yawgmoth, Fauna Shaman and Solphim. Still waiting on other
  pieces: Nezahal (a flicker returning tapped), Key to the City and Ghostly Pilferer ("whenever
  this becomes untapped"), Kozilek (a discard matching the target's mana value), Jaxis (blitz),
  Chainer (a one-shot graveyard cast permission); and the other half of
  `cost:choose-cards-as-cost`, exiling cards from your graveyard as a cost (Mines of Moria,
  Varina).
- **Top-5000 batch 12 (2026-09-29) triaged ranks 1802–1877:** 34 authored (Casualties of War,
  Zacama, Orim's Chant, Lyra Dawnbringer, Arwen, Springleaf Parade, Insurrection and 27 more —
  `top5000-batch-12.test.ts`); 26 blocked, each in `engine/data/sweep-3/B12.json`. Two small
  pieces lead what's left here and in B11: "doesn't untap during its controller's next untap
  step" (Junk Winder, Vorinclex) and countering an activated or triggered ability (Disallow,
  Sublime Epiphany).
- **Top-5000 batch 13 (2026-09-29) triaged ranks 1880–1956:** 25 authored (Day of Judgment,
  Dragonlord Dromoka, Sword of Forge and Frontier, Black Sun's Zenith, Teshar, Nighthawk Scavenger
  and 19 more — `top5000-batch-13.test.ts`); 35 blocked, each in `engine/data/sweep-3/B13.json`,
  nearly all by one-card features. Cheap ones: `create-token-copy` with an amount for its count
  (For the Common Good), crew (Smuggler's Copter), a free cast "once each turn" (As Foretold, One
  with the Multiverse).
- **Top-5000 batch 14 (2026-09-29) triaged ranks 1957–2035:** 26 authored (Nevinyrral's Disk, The
  Eldest Reborn, Warping Wail, Cryptbreaker, Resplendent Angel, Grazilaxx and 20 more —
  `top5000-batch-14.test.ts`); 34 blocked, each in `engine/data/sweep-3/B14.json`. Across B9–B14
  the "look at the top card of your library any time" family (`zone:visibility-extensions`) and
  a damage replacement filtered by recipient (`new:damage-prevented-to-filter` — Losheel, Crystal
  Barricade, Mutational Advantage) come up most among the one-feature blockers.
- **Top-5000 batch 15 (2026-09-29) triaged ranks 2036–2111:** 25 authored (Birthing Pod, Garruk,
  Primal Hunter, Paradise Druid, Goblin Warchief, Trinket Mage and 16 more, plus Vengeful
  Ancestor, Sowing Mycospawn, Nissa, Resurgent Animist and Liesa from a recheck of its blockers —
  `top5000-batch-15.test.ts`); 35 blocked, each in `engine/data/sweep-3/B15.json`. Generous
  Plunderer was rechecked and waits only on a count of the defending player's permanents
  (`new:count-of-trigger-players-permanents`), the same count Will of the Mardu and Carpet of
  Flowers need for a target player.
- **Top-5000 batch 16 (2026-09-29) triaged ranks 2112–2184:** 25 authored (Koma, World-Eater,
  Master of Etherium, Mana Tithe, Trading Post, Aerith Gainsborough, Bone Miser and 19 more —
  `top5000-batch-16.test.ts`); 35 blocked, each in `engine/data/sweep-3/B16.json`. Recurring
  across B9–B16 and cheap: "can't cast more than one spell each turn" (Archon of Emeria,
  Deafening Silence), infect (Plague Myr, Inkmoth Nexus) and the d20 (Delina, both Ancient
  Dragons).
- **Top-5000 batch 17 (2026-09-29) was a short, time-boxed pass over ranks 2185–2243:** 9
  authored (Ondu Inversion, Scourge of Fleets, Assemble the Legion, Summon: Knights of Round,
  Slip Through Space, and — on a recheck of its blockers — Swarmyard Massacre, Forge of Heroes,
  Triplicate Titan, Earthbender Ascension; `top5000-batch-17.test.ts`); 31 blocked in
  `engine/data/sweep-3/B17.json`, every one now checked closely.
- **Top-5000 batch 18 (2026-09-30) triaged ranks 2245–2346:** 41 authored (Flickerwisp, Kokusho,
  Survival of the Fittest, Royal Assassin, Court of Garenbrig, Manamorphose, Tome of Legends and
  34 more — `top5000-batch-18.test.ts`); 34 blocked, each in `engine/data/sweep-3/B18.json`.
  One engine change: a flicker can return a permanent *with* its counters (Planar Incision).
  The blockers that recur across batches and are cheap to build: infect (Grafted Exoskeleton,
  Tainted Strike, plus B16's Plague Myr and Inkmoth Nexus), a card's own permission to be cast
  from its graveyard (Squee, Quilled Greatwurm, Gravecrawler), the legendary sorcery restriction
  (rule 205.4e — Jaya's Immolating Inferno, Urza's Ruinous Blast), "shuffle it into its owner's
  library instead" (Nexus of Fate, Darksteel Colossus at rank 2408), and offering every
  alternative cost that applies rather than the first found (Dracogenesis, Rooftop Storm — Jodah
  shows the gap today).
- **Enter the God-Eternals gains a fixed 4 life**, not "life equal to the damage dealt this way":
  wrong beside Torbran, Gratuitous Violence or prevention. It needs the damage actually dealt as an
  amount (`new:damage-dealt-this-way`), which Creeping Bloodsucker (B9) waits on too.
- **Next (after the TDC precon cards): the top 5000 cards, most-played first.**
  `top-commander-cards.txt` now lists the top 5000 by EDHREC rank (2,049 implemented). Work
  down its unmarked entries in rank order: author each card the engine runs faithfully, and
  build the engine features that block the most of the rest. `engine/data/sweep-2/K*.json`
  holds per-card blocker notes for the first 179 skipped, and `engine/data/sweep-3/B*.json`
  the batches since; past rank 2346, nothing is triaged.
- **What's left of "enters tapped and attacking" (rule 508.4).** Built 2026-09-28: tokens,
  cards (`look-and-choose`, `reveal-until`) and token copies (myriad, `myriad()` helper) can
  enter attacking, with the `enter-attacking` decision where there's a choice, and delayed
  triggers "at end of combat". `effect:enter-attacking` is in the gaps JSON's `built` list.
  19 cards use it (dev-rooms `ENTAT`, `MYRAD`). Still blocked, by family:
  - **Ninjutsu** (17 cards): an activated ability from hand (`ActivatedAbility.zone`) whose cost
    returns an unblocked attacker. The ninja attacks what that creature attacked (702.49c).
  - **Other myriad cards:** Scion of Calamity and Hammers of Moradin need a target "that player
    controls" for the damaged or each opponent; Elturel Survivors a count of the defending
    player's lands; Scurry of Squirrels, Battle Angels of Tyr, The Master, Multiplied and Auton
    Soldier their other text.
  - **Other token copies entering attacking:** Delina (a d20), Flamerush Rider (Dash),
    Redoubled Stormsinger ("tokens that entered this turn"), Echoing Assault (a copy "except
    it's 1/1" attacking a named player).
  - **Ilharg, the Raze-Boar**: "when it dies or is put into exile, put it into its owner's
    library third from the top". **Zara**: a creature from an opponent's hand under your
    control. **Senu**: a trigger while it's in exile. **Doors of Durin**: grants "until your next
    turn" conditioned on a Dwarf / an Elf.
  - **Hero of Bladehold**: battle cry and the token trigger fire together, and which resolves
    first is the player's choice (603.3b), so it waits on `decision:trigger-order`.
  - Cards blocked by other text as well: Otharri, Ghalta and Mavren, Caesar, Ainok Strike
    Leader, Endless Foot Assault, Andúril, Dalkovan Encampment, Zurgo Stormrender.
- **Modal activated abilities with targeted modes** (Breya, Etherium Shaper; Koma, Cosmos
  Serpent; Umezawa's Jitte): modes chosen as it's activated (rule 700.2b), each with its targets —
  the triggered half is built. See `neededCards-features.md`, "Modal triggers with targeted
  modes", for the rest of that family's blockers.
- **Host-trigger cards, 34 left** (the equipped/enchanted-creature triggers are built): each is
  blocked by something shared with other cards — a static "is goaded", "return this card" after
  its host died, per-event "deals damage", per-mode targets on a modal trigger, free casts during
  resolution, living weapon (tokens entering tapped and attacking are built). See `neededCards-features.md`,
  "Host triggers".

- **EDH-popularity feature tiers.** Tier 2 is Spree and Class. Tier 3 is Discover, Evoke and
  Reconfigure. Also open:
  damage doubling as a replacement, the rest of the Overload/free-cast/convoke families, and the
  items listed under each "still open". See `neededCards-features.md`, "Open: the card backlog".
- **More Oracle-parser templates.** Every card the parser reads whole is in the pool: 4,205 of
  them, each reviewed against its Oracle text, rulings and tokens (card sweep 3, 2026-09-25).
  `npm run card:scaffold -w engine -- --report --all` now finds none left: 26,469
  Commander-legal cards remain, each with a line the parser can't read. It reads the cost or
  trigger of 16,853 of their abilities and the effect of 22% of those. The unread lines that
  recur most are the next templates: an ability's "Choose one —" (266), Crew (180),
  "Regenerate ~" (151), "You may pay {…}" (142), "Transform ~" (138). Add one, keep
  `npm run card:parse-check -w engine` at zero disagreements, then `--auto-scan --all` writes
  what it unlocks to `review/` for checking.
- **Card sweep 2 (2026-09-25).** Five cloud batches triaged the 189 best-ranked unimplemented
  top-500 commanders (C1–C3) and the 208 best-ranked unimplemented top-2000 cards (K1–K2). Those
  208 include most of card sweep 1's 227 skips. They authored 36 cards and recorded 361 as
  blocked, each with its missing features, in `engine/data/sweep-2/*.json`. The keys are those of
  `top-commanders-gaps.json`, or `new:*` described in the file.
  - The most-needed features: `decision:copy-new-targets` (16), `effect:copy-exceptions` (14),
    `effect:may-sacrifice-then` (12), `effect:cast-during-resolution` and
    `condition:filter-card-property-clauses` (11 each), `effect:attach-extensions`,
    `effect:add-mana-extensions` and `bug:as-enters-choices-any-entry` (10 each).
  - The rest of the backlog is untriaged: 62 commanders and 1,006 cards, the lists' unmarked
    entries past those batches. The scaffolder can't finish any of them on its own.
- **The limitation ledger.** Protection from a filter is built (2026-09-21); what its "19 cards"
  still hides is protection *granted* by an effect with a duration (Akroma's Will, Mother of
  Runes), protection from a chosen colour, and player protection (The One Ring, Teferi's
  Protection). Beyond it: the "put into a graveyard from anywhere" trigger, "as this enters" on a non-cast
  permanent, and discard as an ability cost (regeneration is built, 2026-09-28). See `neededCards-features.md`, "The
  limitation ledger", and `cards/AUTHORING.md` §15.
- **The original deck lists.** `engine/src/cards/neededCards.txt` holds the first two decks
  the pool was built for (Ureni's Temur dragons, Korvold and Lord Windgrace's lands) and some
  one-off requests. 44 of its cards are still missing, and 7 of those aren't in the top-5000
  list, so nothing else tracks them. Their `FEATURE:` notes date from the P0–P20 passes, so
  re-check each one against the engine before building for it.
- **Precon stand-ins.** 98 cards in the five Tarkir: Dragonstorm starter decks play as
  substitutes; authoring them is the card priority ("Card backlog" above). See
  `docs/plans/precon-decks.md` (the substitution tables). Deleting a substitution is the whole
  revert.

## Engine rules gaps

- **Reveal lands never ask, and never show what they revealed** (Game Trail, Port Town,
  Foreboding Ruins, Fortified Village; the user hit it with Game Trail, 2026-09-30).
  `tappedUnlessRevealFromHand` reveals automatically whenever the hand has a qualifying card,
  so the player isn't given the "you may" (declining is legal: hide the card, take the tapped
  land), and nothing is emitted, so no other player sees the card and History has no entry,
  though a revealed card is shown to all players (rule 701.20a). The deliberate shortcut is
  noted in `AUTHORING.md` ("declining only ever hides information"). Needs a decision (like the
  shock lands' `pay-life-for-untapped`) offering which qualifying card to reveal or none, and a
  `cards-revealed` event for the one chosen, which the client already holds up for everyone.
- **Explore auto-determining the best trigger stacking order.** Simultaneous triggers a player
  controls go on the stack in detection order (`placePendingTriggers` in `game.ts`), never the
  player's choice (603.3b). Explore whether the engine could pick the best order itself, as an
  alternative to (or default for) the `decision:trigger-order` decision that blocks Tifa,
  Yarok, Hero of Bladehold and evoke creatures with order-dependent ETBs. Evoke's sacrifice
  already uses a hard-coded stand-in (`TriggeredAbility.stackFirst`: resolve after the ETBs).
- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring (Lord of the Nazgûl's
  "protection from Ring-bearers" is authored as inert on the strength of this: revisit it when
  the Ring lands), banding, Companion,
  snow *sources* (snow mana is generic), and full text-change beyond one creature-type word.
  ROADMAP's Phase 10 deferred these as large or niche. None of them blocks ordinary Commander
  play. The alt-cast long tail left by Phase 6 (retrace, Warp, Bestow, Prototype, …) is in
  AUTHORING §15 and the limitation ledger.
- **Labelled abilities the engine can't run.** Card sweep 3 found these dash labels, each of
  which changes how its line works. The scaffolder leaves them to author:
  - Power-up is built, and 21 of its 37 cards are authored. Blocked: Hulk, Gamma Goliath and
    Wonder Man (effects on other power-up abilities), Kang the Conqueror (no power-up during
    its extra turn), Thanos, the Mad Titan (an odd-or-even choice), Iron Fist (divided damage),
    Loki Laufeyson (a copy's new targets), Nick Fury (transforming a card it finds),
    Quicksilver (starting in play), Immortus, Donald Blake (a creature-type change that sets
    no P/T) and White Tiger (the Tiger God's blocking restriction). Not yet checked: Black
    Panther, Most Dangerous, Human Torch, Jack of Hearts, Shang-Chi and Stature.
  - Max speed (34): needs `mechanic:speed`.
  - A Case's To solve and Solved (13 each).
  - Forecast (11).
  - Companion (10).
  Exhaust and Boast are read, as the ability flags the engine already has.
- **Replacement ordering.** There is no `choose-replacement-order` (rule 616.1) and no damage
  redirection to a third object.
- **Static-effect dependency ordering** (rule 613.8) is not implemented. Statics apply in
  timestamp order only.
- **The rest of leaving the game** (rule 800.4). 800.4a is modeled (`leaveGame`), and so is
  800.4m (a duration tied to a departed player's next turn lasts until it would have begun).
  Not yet: a decision a departed player would have made (800.4g–h: another player makes it),
  and an effect ending that hands a permanent back to a departed default controller (800.4c:
  it's exiled instead).
- **Dividing among targets.** "Any number of target …" is built (the `any-number` group), and
  so are Fireball's "divided evenly" and Strive's cost per extra target (2026-09-28), but "N
  damage divided as you choose among" them (Fury, Magma Opus, Dragonlord Atarka) and "distribute
  N counters among" (Lathiel) aren't. See `neededCards-features.md`, "Unbounded targeting".
- **A copy never chooses new targets.** Tracked as `decision:copy-new-targets`, which is
  UI-bound.
- **Amass grows the first Army creature.** Rule 701.47a lets the player choose, and a changeling
  is an Army too (Morophon beside Orcish Bowmasters' Army). The `choose-permanents` decision
  (built 2026-09-26 for "untap up to N lands") is the piece it needs. See AUTHORING §15, "Partial".
- **A token copy isn't asked its "as this enters" choice** (a token copy of Clone, Morophon or
  Urza's Incubator), though the gaps list marks `bug:as-enters-choices-any-entry` built. See
  AUTHORING §15.
- **`sacrifice-all-but` always keeps the most it may.** "Choose up to N, then sacrifice the rest"
  never lets the player keep fewer (to sacrifice more for death triggers). The `choose-permanents`
  decision could ask it.
- **Proliferate over a token stack.** A stack is one proliferate entry and every member gets the
  counter; choosing some of them isn't built. (Splitting a stack across attackers or blockers is,
  since 2026-09-28.) See `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.
- **Kardur, Doomscourge forces attacks at players only.** The rulings say the affected creatures
  can attack planeswalkers too; the engine currently requires
  a player. Check the rulings before fixing. The requirement lives in the `attack-requirement`
  effect, `engine/src/combat/eligibility.ts` (~line 417).

## Bots

The plan of record is `docs/plans/bot-effect-knowledge.md`: keep v2, give it an effect-aware
base, retire v3. One line per step still open:

- **More training scenarios.** Every hand-built scenario the weights got wrong has since been
  fixed and moved into the gate (41 there, none left in training — `kind: "training"` in
  `bot/scenarios.ts`), so there is nothing to fit against. New ones come from live games: the
  in-game Capture button (`--capture`) saves a position to `captures/`, which `bot:scenarios`
  and `bot:fit-scenarios` read as training scenarios, as does each blunder `bot:behaviour`
  shows.

Beyond that plan:

- **Counterspells, beyond `answers`.** The reserve (`answers` 3) is a constant: the bot holds a
  Counterspell as firmly when every opponent's hand is empty as at full grip, and counters a
  Grizzly Bears (worth 4.6 to counter, largely `threat`). If live games show it holding one
  into a loss, or spending one on a small creature, capture the position: a reserve scaled by
  opponents' cards in hand is the obvious next shape.
- **Watch the wraths since `threat`.** With the threat term (2026-09-27) v2 casts more
  sweepers: in six four-player games, Cleansing Nova three times (at 33, 19 and 5 life) and
  Blasphemous Act over recasting its commander, and a turn-7 Magmaquake over Thunderbreak
  Regent. At low life that's right; at 33 it's a judgment call. The gate's "wraths when far
  behind" and "keeps its own winning board" hold. If a live game shows a wasted wrath, capture
  it: the scenario is what would say whether `threat` needs a cap or a sweeper needs pricing.
  Since `drawEngines` 4 (same day) Cleansing Nova's artifact-and-enchantment mode and removal
  go after opponents' draw engines too, and one edict took the bot's own commander (Emmara)
  over Mentor of the Meek, a judgment call worth capturing if it recurs.
- **Pumping an opponent's attacker: how often, now that it's ruled.** The user's rule
  (2026-09-27, `EvalBotController.opponentPump`): help an opponent's creature only while it
  attacks someone else, and then with help that ends at end of turn, on a creature goaded by
  us, or — lasting help — only when it kills the player attacked. Temporary pumps on someone
  else's attacker (Kessig Wolf Run, Unleash Fury) remain allowed and still cost mana the
  evaluation can't see (`untappedMana` is 0): if they come up too often in live games, capture
  one — the scenario says whether they need a price.
- **The rollout still can't see our own later spells — tried, level.** Pumps wait for combat
  and the upkeep's mana waits for the main phase (`wastedNow`, `holdsManaForMain`), but inside a
  main phase or combat the default rollout passes at every window, so v2 can't see what a spell
  it hasn't cast yet would have done with mana it spends now. The `"acting"` rollout policy
  (2026-09-28, `simulate.ts`) lets our own seat play the rest of its turn as v1, with ties
  against passing going to acting (without that the bot put its plays off — tested). It sees two
  Grizzly Bears over one Rumbling Baloth with four mana, but benched **level**: 26.0%
  [21.8, 30.6] against three default v2s over 400 four-player games (`bot:bench
  --candidate-options '{"rollout":"acting"}' --opponent shipped-2026-09-27c`), with 23 games
  timing out at 300 s. Opt-in, not the default. Worth another look only with a cheaper v1 in the
  rollout or a reason to expect a different result.
- **Big boards under count budgets.** Seed 50's turn 40 (73 permanents, `bot:replay --from`)
  takes 258 s (705 before 2026-09-27's fixes), and an ordinary four-player game's first 40
  turns 10.5 s (13.1 before the last two). Profiled after them, what's left is the engine's real
  work: state-based actions folding every permanent's characteristics each check
  (`stateBasedGraveyardMoves`, ~13%), the characteristics fold itself, and cloning states for
  the search (~9%). Tried and dropped, each measured at nothing: a per-region cache of condition
  answers (116 hits in 58,000 — a region lasts one event), deferring conditional trigger grants
  in the scan (under 2% once filters read types lazily), and a shared mana scan for casting
  (0.3% of an ordinary game). Live rooms stop at 300 ms, so this is the bench's time limit and a
  thinner search, not a hang.
- **A wider pool of bot decks (later — raised 2026-09-26).** A bot seat falls back to one of the
  five 2022 starter precons (`SAMPLE_DECKS`, via `server/src/decks.ts`), which the user finds too
  simple to play against. Add decks across a range of power levels for bots to bring. The same
  decks should widen the bench, which today measures every bot on those five midrange precons
  only — a result there isn't a result about the decks people bring. None of the five plays a
  counterspell, so `bot:diff` and the bench can't see the `answers` reserve at all. Unscoped: where the decks
  come from (curated lists, or built from the pool around a commander), how a host picks a power
  level, and how the bench samples them.
- **Biases for certain bots: Teval should always mill itself.** Some decks want their bot to
  lean a set way, and the user wants such biases added; the first they named is Teval, the
  Balanced Scale (Sultai Arisen's self-mill plan), which should always mill itself rather than
  its opponents. Today a mill's target is aimed by `target-polarity.ts`'s generic rule (`mill`
  harms its target), which points it at an opponent.
- **Lengthen the log Capture can reach back into.** A room keeps only its last 12 bot decisions
  (`CAPTURE_KEEP` in `server/src/capture.ts`, kept small because a late four-player state is a
  few megabytes), and a bot's misplay was followed by so many more of its actions that it had
  dropped out before the user could capture it.
- **Transcendent Dragon wasted with nothing to counter.** Look into bots casting it (flash; "when
  this creature enters, if you cast it, counter target spell") with no spell on the stack, so its
  trigger does nothing — it wants holding for an opponent's spell.

## Client / UI

### Legibility of play: animation and pacing (the user's list, 2026-09-30)

The build order and design are in `docs/plans/legibility-of-play.md`; every step of it has
shipped (2026-09-30), so what's left here is follow-ups. The problem is that a bot turn can't be
followed by eye, even at the slow bot speed. Only some kinds of event hold the game up for their
animation (`PACED` in `client/src/game/animationSchedule.ts`: a card played, a combat hit, a
permanent leaving, a tap, something leaving the stack, a trigger's source lighting up, a
permanent arriving, counters, buffs, a transform, life and damage).
Everything else lands with the next board and has no animation at all. The pipeline is in
`docs/architecture/client.md` (`usePlayback`/`animationBus`/`AnimationLayer`). Each item below is
now a small follow-up: a `slotFor` entry (which half of the frame, paced or not, shared beat or
not), then an effect in `AnimationLayer` — an `.animate()` on the tile for an `after` cue, or
`flyGhost` for a move — and each must honour `motionPrefs` (speed and reduced motion).

- **Re-measure the bot speeds.** Most events now hold the game for their animation, and the host
  can pause or step the bots, so `BOT_LINGER_MS` (`server/src/room.ts`: slow 1.6s, normal 0.7s,
  after each frame) may now make "slow" too slow. Watch a 4-player bot game at each speed before
  changing it.
- **A static buff has no animation.** Anthems and lords (Lord of Lineage's "other Vampires get
  +2/+2") change P/T through the layers without an event, so the tiles just show new numbers.
  `pt-modified` is only a one-shot pump.
- **Exiling the top of a library hasn't been seen live.** `runMill`'s exile look (a cardback
  flaring white-blue off the pile) shares its code with mill, which was checked, but no card in
  the pool exiles from a library simply enough to test it with.
- **The crown has only been seen popping in**, not flying between players: that needs one
  player taking the monarchy from another (combat damage), which no dev room sets up. It uses
  the same captured flight as a change of control, which was checked.

Follow-on ideas, approved by the user on 2026-09-30:

- **Arrows only for the aimed stack entry.** `ArrowLayer` draws the targets of the top entry (or
  the hovered one), like `aim`; a deep stack of targeted spells shows one set at a time.
- **Folded tokens arrive as one tile**: two Soldiers from Raise the Alarm are separate objects
  the board folds into one tile, so only the first one's `permanent-entered-battlefield` finds a
  tile to animate. Harmless, but a "×2" arriving could say so.
- **A dies trigger's source can't pulse**: `runPulse` lights the source's tile on the new board,
  and a creature whose own death triggered is gone from it. It would need a pulse in the frame's
  first half, over the old board, for a source that isn't on the new one.
- **The initiative has no animation**: unlike the monarch, it has no event to animate from.
- **A history entry whose cards have left the board highlights nothing**: `highlightEvent` finds
  only what's still drawn (a permanent, a stack entry, your hand, a player's panel). It could
  open the zone the card went to instead.
- **The sounds are synthesised placeholders** (`game/sound.ts`, Web Audio tones): licence-free
  and download-free, but plain. Real samples could replace them cue for cue.

- **A face-down exiled card drops out of its owner's exile count and list** for every seat that
  can't look at it (a foretold card, one exiled face down — Edward Kenway): `exileOf` in
  `App.tsx` groups exile by `view.objects[id].owner`, and a hidden card has no object. The
  owner is public (rule 406.3 hides the face, not whose card it is), so the view could carry
  owners for hidden exile ids.

- **Face-down permanents should sit on their controller's board, and turning one face up should
  work like any other activated ability** (the user's ask): a click on the card opens the same
  little menu another permanent's activated abilities use, with "turn face up" in it when the
  card can be turned face up.

- **One art-crop primitive (from the 2026-09-28 rendering audit).** The client draws a card
  eleven ways: `CardTile` in two layouts (title: stack, zone viewer, every hover card;
  art-first: hand, library top, cast spotlight, reveals), `MiniTile` (battlefield),
  `CommanderTile` (command zone), `CommanderDamageChip`, the card back, `CardImage` (library,
  replacement review), the lobby's `CommanderArt`, `PrintingPicker`'s thumbnails, the deck
  builder's text rows and the landing hero. Each shape answers a size the others can't, so
  merging them isn't worth it. What is duplicated is the art-crop box inside five of them:
  `queueArtLookup` / `isArtPending` / `resolveArtUrl` / `recordArtFailure` and the tint
  fallback, repeated in `CardTile`, `MiniTile`, `CommanderTile`, `CommanderDamageChip` and
  `CommanderArt`. Extract one `ArtCrop` component; and `PrintingPicker`'s raw `<img>` could be a
  `CardImage`.

- **Show regeneration shields on the card.** A permanent's shields (`GameObject
  .regenerationShields`) are public, but the view doesn't carry them and a tile shows nothing;
  only the log line says one was made. Add them to `VisibleObject` and a small badge beside
  the damage marker; check it live.

- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): 2.5 MB, 450 kB gzipped at 5,400 cards, and growing
  with the pool. They read only printed fields, each ability's text (colour identity) and the
  tokens a card makes. A generated catalog of just those, sharded the same way, would be a
  fraction of the size. The game page loads no definitions up front.

## Tooling / docs

- **Say which turn it is for whom (raised 2026-09-27).** A turn number counts every player's
  turns, so at a four-player table "turn 37" is the first player's 10th turn — which reads as a
  much longer game than it is. Talk about turns with that extra specificity. To be discussed
  before anything is built: where it applies and what form it takes.
- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
- **CI's fuzzer reaches three quarters of the pool.** CI's 38 fixed seeds put 3,904 of the
  5,369 deckable cards in some deck. The other quarter is never fuzzed in CI, only locally,
  where 150 two-player seeds reach all but 46. Either raise CI's game counts (about 60
  two-player seeds for 87%, roughly double the fuzz time), or start each run at a different
  seed so that successive runs sweep the whole pool.

## Code health

- **`change-text` / `choose-text` are unused (2026-09-28).** Artificial Evolution, their only
  card, was removed: it swapped one creature type on the type line from a fixed 12-type menu,
  not "all instances" across the card's text. Either build real layer-3 text changing (every
  creature-type word in a card's abilities, every creature type offered, spells as targets) or
  remove the effect and the decision kind.
- **Two ways to name a deck's commanders.** `DeckList` and `WireDeck` carry a lone
  `commander` beside `commanders`, and `commandersOf` reads either. `WireDeck`'s doc calls the
  lone field a shim for clients from before Partner pairs, but `SAMPLE_DECKS`, the server's
  `SEATS` and `PendingRoom`'s fallback deck still use it, as do ten test files. Move them all
  onto `commanders`, then drop the lone field.
- **Saved-deck migrations.** `client/src/deck-builder/decks.ts` rewrites two old shapes every
  time it reads saved decks: a lone `commander` (from before Partner pairs) and Princess Sarah's
  old name (renamed on 2026-09-16). Neither rewrite is saved, so an old deck needs them until
  it's next edited. Write each migrated deck back once, then drop both.
- **Vocabulary built ahead of any card.** About twenty effect, trigger, condition, filter and
  replacement pieces, plus a few dozen optional fields, have no card using them yet, and five
  have no test either. Keep them for the cards they were built for, but review the first card
  that uses each. The list is in `neededCards-features.md`, "Built ahead". `painIfUntapped` is
  the one no real card can use.
- **Prohibition scans are quadratic.** `abilitiesProhibited`/`prohibitionsOn` rescan the whole
  battlefield on every call, per permanent, and `recomputeControl` rescans for control Auras per
  permanent once anything has a control effect. On a land-heavy board they were 31% of a
  profile, and turns slow down steadily. Not a hang, but the fuzzer now meets it: four-player
  seed 27 (as the pool stood on 2026-09-29) is a 182-turn game of land-heavy boards that ends
  in deck-outs and takes ~32 s, past the local 30 s default (CI's four-player pass allows
  120 s), with `abilitiesProhibited`/`prohibitionsOn` ~10% of its profile and registry lookups
  another 10%.
- **Audit the engine tests (raised 2026-09-27).** Go through the engine suite we've been running
  (430 files, 3,979 tests, about 100 s) and check what it actually guards. Unscoped: what the
  audit looks for and what it produces.
