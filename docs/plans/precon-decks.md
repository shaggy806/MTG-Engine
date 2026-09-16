# Real precon decks for the bots

Status: **shipped, with substitutions** (2026-09-16) — `engine/src/sample-decks.ts` is now the
five 2022 **Starter Commander Decks** (MTGJSON set code `SCD`), replacing the four hand-curated
60-card lists. 451 of the 495 non-commander slots are the printed cards; the other 44 are
unimplemented cards played by hand-picked stand-ins, listed under
[Substitutions](#substitutions) below.

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

## Substitutions

The "author every card" plan above stopped at 44 cards short: the long tail (planeswalkers with
unusual abilities, "each opponent chooses" effects, storage and provenance lands, curses that
trigger on someone else's attack) was each a feature for one card. Rather than hold the decks back,
each missing card plays as a stand-in until it's authored.

**How it's recorded.** Each deck in `sample-decks.ts` keeps its `printed` list exactly as printed,
plus a `substitutions` table of `{ original, substitute, reason }`. `cards` — what's actually
played — is `printed` with those swaps applied. The printed list is never edited, so it stays the
record of what the real deck is.

**How each stand-in was picked.** By hand, not with `suggestReplacement`, which ignores colour
identity and singleton (see `card-replacer.md`). Every substitute:

- is inside the commander's colour identity,
- isn't already in that deck (singleton), and
- fills the original's role (planeswalker, sweeper, flier, token maker, utility land…) at a similar
  mana value, leaning toward precon power level over the strongest available card.

**Reverting one.** Once an original is implemented, delete its entry from that deck's
`substitutions` table — nothing else changes. `engine/src/test/sample-decks.test.ts` enforces this:
it fails for any substitution whose original is now registered, and checks every deck is a legal
100-card Commander deck of implemented cards with exactly its table's swaps applied.

The table below mirrors `sample-decks.ts` at the time of the swap; the code is authoritative.

### Draconic Destruction — Atarka, World Render (6)

| printed card | plays as | why |
|---|---|---|
| Sarkhan, the Dragonspeaker | Garruk Wildspeaker | Green planeswalker that makes creatures and has an overrun finisher. |
| Foe-Razer Regent | Old Gnawbone | Seven-mana green flying Dragon. |
| Savage Ventmaw | Lathliss, Dragon Queen | Six-mana flying Dragon. |
| Loaming Shaman | Scavenging Ooze | Cheap green creature that interacts with graveyards. |
| Haven of the Spirit Dragon | Kessig Wolf Run | Utility land that taps for colorless. |
| Path of Ancestry | Sheltered Thicket | Enters-tapped land that makes the deck's colours. |

### Chaos Incarnate — Kardur, Doomscourge (20)

| printed card | plays as | why |
|---|---|---|
| Deadly Tempest | Damnation | Destroy-all-creatures sorcery. |
| Dredge the Mire | Victimize | Reanimation sorcery. |
| Ob Nixilis Reignited | Ob Nixilis, the Fallen | Same-cost black Ob Nixilis that drains life; the only implemented black-red planeswalker is a three-mana Chandra. |
| Profane Command | Kolaghan's Command | Modal black-red Command with a recursion mode. |
| Reign of the Pit | Fleshbag Marauder | Each player sacrifices a creature. |
| Scythe Specter | Hypnotic Specter | Flying Specter that makes opponents discard. |
| Sepulchral Primordial | Overseer of the Damned | Seven-mana black top-end with an enters-the-battlefield payoff. |
| Soul Shatter | Diabolic Edict | Instant-speed edict. |
| Chaos Warp | Infernal Grasp | Cheap instant removal. |
| Combustible Gearhulk | Demanding Dragon | Punisher creature: the opponent picks the lesser evil. |
| Fiery Confluence | Chain Reaction | Four-mana red sweeper. |
| Sunbird's Invocation | Phyrexian Arena | Card-advantage enchantment. |
| Wild Ricochet | Act of Treason | Uses an opponent's resources against them. |
| Wildfire Devils | Cinder Elemental | Four-mana red creature that turns into damage. |
| Spiteful Visions | Greed | Four-mana card-draw enchantment paid for in life. |
| Coveted Jewel | Hedron Archive | Mana rock that cashes in for cards. |
| Syphon Mind | Blightning | Makes opponents discard. |
| Explosion of Riches | Fireball | Top-end damage spell aimed at opponents. |
| Molten Slagheap | Sulfurous Springs | Land that makes both colours. |
| Myriad Landscape | Evolving Wilds | Sacrifice-to-fetch basic land. |

### First Flight — Isperia, Supreme Judge (7)

| printed card | plays as | why |
|---|---|---|
| Cartographer's Hawk | Baithook Angler | Two-drop that comes back as a flier. |
| Gideon Jura | Ajani, Caller of the Pride | White planeswalker; its -3 grants flying. |
| Angler Turtle | Serra Angel | Large creature, and a flier, which Isperia rewards. |
| Bident of Thassa | Behold the Multiverse | Four-mana blue card draw. |
| Diluvian Primordial | Steel Hellkite | Large flying finisher. |
| Moorland Haunt | Blinkmoth Nexus | Utility land that makes a flier. |
| Jubilant Skybonder | Thieving Magpie | Blue flier that draws cards. |

### Token Triumph — Emmara, Soul of the Accord (3)

| printed card | plays as | why |
|---|---|---|
| Champion of Lambholt | Hanged Executioner | Three-mana creature that goes wide. |
| Trostani Discordant | Glorious Anthem | The anthem half of Trostani. |
| Curse of Bounty | Raise the Alarm | Two-mana token maker. |

### Grave Danger — Gisa and Geralf (8)

| printed card | plays as | why |
|---|---|---|
| Liliana, Untouched by Death | Mortivore | Four-mana black card that grows with graveyards; no blue-black planeswalker is implemented. |
| Necromantic Selection | Damnation | Destroy-all-creatures sorcery. |
| Scourge of Nel Toth | Rakshasa Debaser | Six-mana black finisher that returns creatures from graveyards to the battlefield. |
| Unbreathing Horde | Vampire Nighthawk | Three-mana black creature. |
| Havengul Lich | Bloodgift Demon | Five-mana value creature. |
| Grimoire of the Dead | Slate of Ancestry | Four-mana late-game artifact. |
| Curse of Disturbance | Phyrexian Arena | Three-mana black enchantment. |
| Syphon Flesh | Diabolic Edict | Makes an opponent sacrifice a creature. |

## Bugs the precons found

Playing the finished decks against each other — random-vs-random and bot-vs-bot
(`HeuristicBotController`, which fills every bot seat in a live room) at 2, 3 and 4 players —
turned up five bugs the old sample decks never exercised. Each would have thrown out of `dispatch`
or frozen a room. Three were in the bot:

- **Goad.** The bot sent every attacker at one defender, so a creature goaded by Kardur was sent at
  its goader when another defender was legal (rule 701.38b). It now picks per attacker from
  `LegalAction.defendersFor`.
- **Alternative costs.** `castExtras` never echoed `altCost`, so Sephara's "tap four fliers" variant
  was sent as a cast at the printed cost (the random fuzzer's controller shared the bug).
- **Equip {0}.** With Lightning Greaves the bot re-equipped between two creatures forever. It now
  leaves attached equipment alone, and caps any one ability at four activations per turn as a
  backstop against other free loops.

And two in the engine:

- **A granted ability outliving its grant** (rule 113.7a). Presence of Gond grants "{T}: create an
  Elf Warrior"; activate it, kill the creature in response, and the Aura goes too. The ability on
  the stack was looked up by index into the creature's *current* abilities, found nothing, and
  crashed. Each granted ability now records where it came from (`GrantedAbilityRef` in `state.ts`)
  when it's activated or triggers, and resolves from that.
- **A blocker removed from combat** (rule 506.4). Checking for a first-strike damage step read an
  attacker's raw `blockedBy`, so a token blocker exiled before damage (which no longer exists)
  crashed it, and a first-strike blocker that had left still earned a first-strike step. It now
  reads only blockers still on the battlefield, as the rest of combat damage already did.

Regression tests: `heuristic-bot.test.ts` (the three bot bugs) and `left-play-lki.test.ts`.
