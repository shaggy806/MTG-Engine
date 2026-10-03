# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Commander gap (the current priority)

**339 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists.

- **Ready to author, no engine work: none left** (2026-10-02: Tifa Lockhart, Yarok, Storm,
  Force of Nature, Prismari and Teval, Arbiter of Virtue were the last).
- **Build down the greedy order.** `npm run cmdrs:gaps -w engine` ranks every missing engine
  feature over `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to
  that file's `built` array and author the commanders it unblocks in the same commit. The next
  ten, engine-only, with the commanders each fully unblocks:
  `cost:mana-spending-rules` (+2), `effect:amount-aggregate` (+1), `keyword:toxic` (+1),
  `zone:play-from-exile-with-counter` (+2), `trigger:discards-extensions` (+1),
  `zone:visibility-extensions` (+1), `zone:cast-from-library-top` (+2), `keyword:blitz` (+1),
  `keyword:mayhem` (+1), `effect:additional-upkeep-steps` (+1).
- **Most-needed features overall.** `effect:may-sacrifice-then` (13),
  `effect:copy-spell-extensions` and `decision:choose-permanent` (11 each).
  `decision:copy-new-targets` and `effect:copy-permanent-spell` landed 2026-09-30 (Shiko and
  Narset; storm asks too). `zone:exile-face-down` (Edward Kenway) was split
  out of `zone:visibility-extensions` and built; Gonti and Ixhel still need
  `cost:mana-spending-rules`. Live numbers come
  from `cmdrs:gaps`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:may-sacrifice-then` (13), `decision:choose-permanent`
  (11) and `effect:cast-during-resolution` (10 — partly built on 2026-09-30 as the `cast-now`
  effect; what's left is in its `top-commanders-gaps.json` description),
  `decision:free-cast-choices` (9), `effect:attach-extensions` (7). Sen Triplets also needs
  `zone:cast-from-opponents-hand` (playing cards from the target's revealed hand), on top of
  the revealed hand itself.
- **A commander dropped by its review.** Aragorn, the Uniter needs scry to let the player order
  the kept cards (`decision:library-ordering`).

## Card backlog (top-5000 staples and the precons)

What blocks each unimplemented card, batch by batch and family by family, is in
**`docs/card-blockers.md`** (and the per-card JSON records it indexes, `engine/data/sweep-2/` and
`sweep-3/`). Add each batch's summary there; this section keeps only what to do next.

- **Now (priority since 2026-09-30): the missing cards of the Tarkir: Dragonstorm precons.**
  The five TDC decks are `SAMPLE_DECKS`, so every bot and every unclaimed seat plays them, with
  stand-ins for what the engine can't run yet (`engine/src/sample-decks.ts`'s substitution
  tables; `docs/plans/precon-decks.md`). Author those cards deck by deck, ahead of the top-5000
  list; delete each one's substitution as it lands (`sample-decks.test.ts` insists). Missing
  now: Temur Roar 19, Sultai Arisen 25, Abzan Armor 15, Mardu Surge 12, Jeskai Striker 3 — 74,
  every one recorded with what it needs (`engine/data/sweep-3/TDC*.json`). No one feature leads
  any more. **Next:** two each for a triggered ability's divided damage, Omen and
  "the creature it sacrificed" (`docs/card-blockers.md`).
- **The nine other starter precons' stand-ins** (since 2026-10-02: the five 2022 Starter
  Commander Decks and Tramplesaurus Rex, Reign of Dragons, Family Matters, World Shaper in
  `SAMPLE_DECKS`): 71 stand-ins, every one recorded in `engine/data/sweep-3/PC-*.json`. Behind
  the TDC decks for authoring.
- **Deck win rates under identical bots (the user's next test).** Seat the same bot on every
  `SAMPLE_DECKS` deck, measure each deck's win rate, and flag `bench` on the decks that hold
  their own, so no deck that loses every game skews a bot benchmark.
- **"You may search" isn't optional on 35 cards.** Their `search-library` has `min: 0` and no
  `may` around it (Primal Druid), so declining still searches and shuffles, which a library
  ordering (a scry, a Brainstorm) loses. Fierce Empath has the right shape; sweep the rest.
- **Next (after the TDC precon cards): the top 5000 cards, most-played first.**
  `top-commander-cards.txt` lists the top 5000 by EDHREC rank (2,125 implemented). Work down its
  unmarked entries in rank order: author each card the engine runs faithfully, and build the
  engine features that block the most of the rest. Ranks through 2346 are triaged (batches 4–18);
  past that, nothing is. The cheap recurring blockers the batches found: infect, "you win the
  game" (`new:win-game`), a card's own permission to be cast from its graveyard, "can't cast more
  than one spell each turn", the legendary sorcery restriction (205.4e), library ordering
  (`decision:library-ordering`), "sacrifice N" costs (`cost:sacrifice-multiple`) and improvise.
- **Cards `cast-now` may have unblocked, outside the precons.** The feature stays out of the
  gaps JSON's `built` list (it's only partly built), so the top-5000 and commander batches would
  still skip these, each recorded as blocked on it: Rishkar's Expertise, Jodah, the Unifier (a
  `reveal-until` whose `then` is a free `cast-now`), Kellan, the Kid, Descendants' Path and
  Buster Sword. Recheck each against its Oracle text before authoring it.
- **Cards a built feature may have unblocked.** A copy's new targets (2026-09-30) was the most
  recorded blocker across sweep 2 and 3 (Thousand-Year Storm, Reverberate, Rings of
  Brighthearth, Echoes of Eternity, Loki Laufeyson, …); recheck the records that cite
  `decision:copy-new-targets` and author what needs nothing else.
- **The Incarnations' evoke: "Evoke—Exile a [color] card from your hand."** Evoke is built for
  mana costs (2026-09-29, Ashling); Endurance, Solitude, Fury and Subtlety (and Grief) pay theirs
  by exiling a card of their color from hand, a non-mana cost choice the evoke variant can't
  carry yet (`evokeCostsOf` in `game.ts`). Fury needs a triggered ability's divided damage too.
- **Enter the God-Eternals gains a fixed 4 life**, not "life equal to the damage dealt this way":
  wrong beside Torbran, Gratuitous Violence or prevention. It needs the damage actually dealt as an
  amount (`new:damage-dealt-this-way`), which Creeping Bloodsucker (B9) waits on too.
- **Ninjutsu** (17 cards) and the rest of "enters tapped and attacking": `docs/card-blockers.md`.
- **Modal activated abilities with targeted modes** (Breya, Etherium Shaper; Koma, Cosmos
  Serpent; Umezawa's Jitte): modes chosen as it's activated (rule 700.2b), each with its targets —
  the triggered half is built. See `neededCards-features.md`, "Modal triggers with targeted
  modes".
- **Host-trigger cards, 34 left**: each blocked by something shared with other cards. See
  `neededCards-features.md`, "Host triggers".
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
- **The limitation ledger.** Protection from a filter is built (2026-09-21); what its "19 cards"
  still hides is protection *granted* by an effect with a duration (Akroma's Will, Mother of
  Runes), protection from a chosen colour, and player protection (The One Ring, Teferi's
  Protection). Beyond it: the "put into a graveyard from anywhere" trigger and "as this enters"
  on a non-cast permanent. See `neededCards-features.md`, "The limitation ledger", and
  `cards/AUTHORING.md` §15.
- **The original deck lists.** `engine/src/cards/neededCards.txt` holds the first two decks
  the pool was built for (Ureni's Temur dragons, Korvold and Lord Windgrace's lands) and some
  one-off requests. 44 of its cards are still missing, and 7 of those aren't in the top-5000
  list, so nothing else tracks them. Their `FEATURE:` notes date from the P0–P20 passes, so
  re-check each one against the engine before building for it.

## Engine rules gaps

- **Delve and convoke together on an {X} spell.** `xCost.maxX` is the better of the two alone
  (`xPlanFor`), so Chord of Calling under Teval, Arbiter of Virtue can't reach the X both would
  pay together, and its offer's convoke proof and delve ranges are each worked out without the
  other. Needs a joint plan: convoke the creatures, delve the rest of the generic.
- **A smarter default trigger order.** A player who orders their own triggers is asked (the
  `order-triggers` decision, opt-in like MTG Arena's "auto order" switch); everyone else, bots
  included, gets the engine's order: `stackFirst` (evoke's sacrifice), then detection order
  (`triggerPlacement` in `game.ts`). A heuristic could do better — card draw before a discard,
  pumps before the attack they matter for — built from cases that come up in real games.
- **Not modeled.** Battles, phasing, dungeons/Initiative/the Ring (Lord of the Nazgûl's
  "protection from Ring-bearers" is authored as inert on the strength of this: revisit it when
  the Ring lands), banding, Companion,
  snow *sources* (snow mana is generic), and full text-change beyond one creature-type word.
  ROADMAP's Phase 10 deferred these as large or niche. None of them blocks ordinary Commander
  play. The alt-cast long tail left by Phase 6 (retrace, Warp, Bestow, Prototype, …) is in
  AUTHORING §15 and the limitation ledger.
- **Labelled abilities the engine can't run.** Card sweep 3 found these dash labels, each of
  which changes how its line works. The scaffolder leaves them to author:
  - Power-up is built, and 21 of its 37 cards are authored; the 16 left are in
    `docs/card-blockers.md`.
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
- **Dividing among targets: what's left.** A *spell's* "N damage divided as you choose among
  any number of targets" is built (2026-10-01 — Magma Opus: `CardDefinition.divided`, the
  cast's `division`, `damage-divided`, the client's division step). Not yet: a triggered
  ability's (Fury, Dragonlord Atarka — the `choose-targets` decision would need a division
  too), an X total (Fire Covenant), and "distribute N counters among" (Lathiel). See
  `neededCards-features.md`, "Unbounded targeting".
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
- **Distinct targets in one token stack.** An "another target" relation (`distinctTargets`, an
  `any-number` group) names a stack once (`otherSlotConflict`, `slotOptions`), so "two target
  creatures", Terastodon's three, Curse of the Swine's X or Pest Infestation's up to X can't take
  two tokens of one stack (five Treasures in one stack are one target). Needs the relation checks
  to allow a repeat up to `stackCount` and a client control for picking a stack more than once.
  See `docs/plans/token-stack-choices.md`.
- **Resolve-hatch sweep.** Convert the remaining imperative `resolve` cards to a declarative
  `effect`.

## Bots

The plan of record is `docs/plans/bot-effect-knowledge.md`: keep v2, give it an effect-aware
base, retire v3. One line per step still open:

- **More training scenarios.** 83 hand-built scenarios gate (`bot/scenarios.ts`); 2026-10-02
  added blocks, attack targets, answers on the stack (a pump against burn, Counterspell and
  Heroic Intervention against a wrath, Fog against lethal) and sequencing; two found bugs,
  since fixed (no answer to its own wrath, no chip damage at four players). More come from
  live games: the in-game Capture button (`--capture`) saves a position to `captures/`, which `bot:scenarios` and `bot:fit-scenarios`
  read as training scenarios, as does each blunder `bot:behaviour` shows. `npm run
  bot:captures -w engine` lists them with v2's answer today; once one is fixed, `-- resolve`
  moves it to `captures/resolved/`, where it gates. Planeswalkers, double blocks, flash
  and cantrips added the same day. Not yet covered: mulligans (`mulligan-policy.test.ts`).

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
  thinner search, not a hang. A second shape, deep stacks rather than wide boards: seed 313 of
  the 2026-10-02 A/B bench timed out on Jeskai's spell engine (Veyran doubling triggers,
  Archmage Emeritus, copies of its own spells) — 73 items on the stack and ~110 permanents on
  turn 42, each decision 5-30 s because every simulation resolves the whole stack. All seats
  there were the old build, but nothing since makes the new one cheaper on it.
- **A wider pool of bot decks (later — raised 2026-09-26).** A bot seat falls back to one of the
  five 2022 starter precons (`SAMPLE_DECKS`, via `server/src/decks.ts`), which the user finds too
  simple to play against. Add decks across a range of power levels for bots to bring. The same
  decks should widen the bench, which today measures every bot on those five midrange precons
  only — a result there isn't a result about the decks people bring. None of the five plays a
  counterspell, so `bot:diff` and the bench can't see the `answers` reserve at all. Unscoped: where the decks
  come from (curated lists, or built from the pool around a commander), how a host picks a power
  level, and how the bench samples them.
- **More deck biases.** `engine/src/deck-bias.ts` (2026-10-02, `docs/plans/deck-biases.md`)
  lets a commander's deck aim effects the other way and value its own board differently; Teval
  is the one entry. Add one when a live game shows a deck's bot playing against its plan, with a
  gate scenario that fails without it. Kinds not built: cards to cast first or hold, attack
  eagerness, and opponents' biases (milling an opponent's Teval still reads as neutral to us).
- **Skullclamp on a 1/1 token.** v2 passes on it (training scenario "Skullclamps a 1/1 token
  for two cards"): two cards score just under a 1/1 body and its point of attack, since every
  creature counts `creatures` 2.5 whatever its size. `bot:fit-scenarios` finds `creatures` 2.5 → 2
  breaks no gate scenario. Tried 2026-10-02: `bot:diff` over six four-player games changed 12
  of 11,553 decisions, mostly more token blocks and removal ahead of creatures, Sakura-Tribe
  Elder's land taken (right) and a 1/1 Rat token chump-blocking a 3/3 at 25 life (wrong) — not
  shipped. Likelier fix: a feature for Skullclamp-style "dies, draw" Equipment, not a weight.

## Client / UI

- **Next priority (the user, 2026-10-02): a scenario builder for testing cards and interactions.**
  Build a game state from scratch, searching cards from the card library and placing them, with
  no game triggers happening while building; then switch to game mode to play cards and see how
  they interact, how the bots react, or whether the engine works properly. Today the closest thing
  is `dev-rooms` (`server/scripts/dev-scenarios.mjs`, boards written in code, and the 4099 command
  port's `spawn`/`move`/`life`), which has no UI and needs a scenario authored per board.

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

- **Tokens merged into an engine stack arrive unanimated**: a second Raise the Alarm's Soldiers
  are folded by the engine into the first two's stack (`stackCount`), so the object their
  `permanent-entered-battlefield` names is gone from the view and nothing plays. The stack's tile
  could glow and say "+2", as a tile the board folded them into already does (`runEnters`).
- **A dies trigger's source can't pulse**: `runPulse` lights the source's tile on the new board,
  and a creature whose own death triggered is gone from it. It would need a pulse in the frame's
  first half, over the old board, for a source that isn't on the new one.
- **The initiative has no animation**: unlike the monarch, it has no event to animate from.
- **A history entry whose cards have left the board highlights nothing**: `highlightEvent` finds
  only what's still drawn (a permanent, a stack entry, your hand, a player's panel). It could
  open the zone the card went to instead.
- **The sounds are synthesised placeholders** (`game/sound.ts`, Web Audio tones): licence-free
  and download-free, but plain. Real samples could replace them cue for cue.

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

- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Convoke with a target-dependent cost.** The offered `proof` is priced at the dearer end of
  the target-count range. This is latent: no pool card has both.
- **Quality-of-life room options (house rules).** Options the room creator can turn on before a
  game that are technically against the rules but make play smoother. The user's example: mana
  that, when tapped, doesn't have its colour decided until it's spent on a specific coloured
  cost. Each would be an opt-in room setting (the lobby, `server/src/room.ts`), off by default,
  since the engine otherwise follows the Comprehensive Rules exactly.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): 2.5 MB, 450 kB gzipped at 5,400 cards, and growing
  with the pool. They read only printed fields, each ability's text (colour identity) and the
  tokens a card makes. A generated catalog of just those, sharded the same way, would be a
  fraction of the size. The game page loads no definitions up front. **Add a progress
  indicator while the library loads** (`client/src/library/LibraryPage.tsx`): the user wants one
  shown while those shards come in.
- **"Same for all" covers only a trigger's yes-or-no "you may"** (built 2026-10-02,
  `GameState.standingModeAnswers`). Not yet: a resolving trigger's choice among several modes, a
  "you may" asked after another decision in the same resolution (it parks, and loses
  `Game.resolvingTrigger`), the second player of an "each player may", and a trigger an effect
  granted (`grantedAbility` kind `modifier`, which has no signature).
- **Spells and abilities should point their arrows at their targets as they resolve.** Draw the
  target arrows (`client/src/ui/ArrowLayer.tsx`, kind `target`) from a resolving spell or
  ability to what it targets.

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
- **Saved-deck migrations.** `client/src/deck-builder/decks.ts` rewrites two old shapes every
  time it reads saved decks: a lone `commander` (from before Partner pairs) and a card held under
  its flavor name (Princess Sarah, renamed 2026-09-16; `nameForFlavorName`). Neither rewrite is saved, so an old deck needs them until
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
  another 10%. Four-player seed 10 (2026-09-30) is another: 176 turns, ~31 s.
- **Audit the engine tests (raised 2026-09-27).** Go through the engine suite we've been running
  (430 files, 3,979 tests, about 100 s) and check what it actually guards. Unscoped: what the
  audit looks for and what it produces.
