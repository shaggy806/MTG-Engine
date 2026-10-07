# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Questions for the user

Each waits on a decision only the user can make. Once one is answered, move the work it
decides into its section below.

- **What should "spread out attackers" mean?** (postponed by the user, 2026-10-06; capture HB5MR turn 20, open): dave sent everything at alice (38 life, no creatures) where the note asks the bot to spread its attackers; bob was on 13 with Felothar untapped. Never all damage at one player, pressure the lowest life, or something else — the user is considering it.
- **How should we say which turn it is, and for whom?** A turn number counts every player's
  turns, so at a four-player table "turn 37" is the first player's 10th turn, which reads as a
  much longer game than it is. Where should the more specific form apply (the client, bench
  output, docs, commit messages), and what should it look like?
- **What should the engine-test audit look for, and what should it produce?** The idea (raised
  2026-09-27) is to go through the engine suite and check what it actually guards. The suite is
  now 559 files and about 5,550 tests.
- **Build text changing properly, or remove it?** `change-text` / `choose-text` have no card
  since Artificial Evolution was removed (2026-09-28): it swapped one creature type on the
  type line from a fixed 12-type menu, not "all instances" across the card's text. Either
  build real layer-3 text changing (every creature-type word in a card's abilities, every
  creature type offered, spells as targets) or remove the effect and the decision kind.

## Commander gap (the current priority)

**392 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
`npm run cmdrs:mark -w engine`). An imported decklist usually has its commander substituted, and
that one card is the reason the deck exists. Live numbers for everything below come from
`npm run cmdrs:gaps -w engine`.

- **Ready to author, no engine work: none.** Jasmine Boreal of the Seven was listed as ready,
  but her real blocker is the mana-restriction gap under Engine rules gaps, now recorded in her
  gaps record as `cost:mana-restriction-at-cast`.
- **Build down the greedy order.** `cmdrs:gaps` ranks every missing engine feature over
  `engine/src/cards/top-commanders-gaps.json`. When a feature lands, add its key to that file's
  `built` array and author the commanders it unblocks in the same commit. The next ones,
  engine-only, with the commanders each fully unblocks: `keyword:decayed`,
  `trigger:activates-ability`, `trigger:you-tap-opponent-creature`, `effect:amount-aggregate`,
  `effect:put-commanders-onto-battlefield` (+1 each), `mechanic:speed` (+2), `keyword:mayhem`,
  `keyword:freerunning`, `replacement:mana-pool-emptying` and `static:mana-pool-reads` (+1
  each). Lynde, Cheerful Tormentor also waits on `effect:curse-attach-player` (a Curse put onto
  the battlefield attached to a player, or moved to an opponent).
- **Most-needed features overall.** `effect:cast-during-resolution` (9),
  `effect:attach-extensions` (7), `zone:visibility-extensions` (6), and
  `effect:missing-tokens`, `cost:sacrifice-multiple`, `static:self-type-changes` (5 each). Orvar needs `decision:choose-permanent` and `trigger:discards-extensions`. Ulalek needs
  `cost:colorless-hybrid-mana` and `keyword:devoid`.
- **UI-bound features.** These need a new client decision and a browser check:
  `effect:cast-during-resolution` (10; partly built on 2026-09-30 as the `cast-now` effect, and
  what's left is in its `top-commanders-gaps.json` description), `effect:attach-extensions` (7),
  `cost:sacrifice-multiple`, `decision:choose-permanent` and
  `decision:choose-from-zone-extensions` (5 each). Sen Triplets also needs
  `zone:cast-from-opponents-hand` (playing cards from the target's revealed hand), on top of
  the revealed hand itself.
- **Speed waits on the client** (AUTHORING §15). Speed (`mechanic:speed`) blocks Mendicant
  Core, Vnwxt, the four Raceways and Howlsquad Heavy, and Max speed's 34 cards. It needs the
  player panel to show a player's speed and the stack to draw its inherent trigger, which has
  no source (rule 702.179d).

## Card backlog (top-5000 staples and the precons)

What blocks each unimplemented card, and which cards a built feature may have unblocked, is in
**`docs/card-blockers.md`** ("Open leads" first, then batch by batch and family by family, over
the per-card JSON records in `engine/data/sweep-2/` and `sweep-3/`). Card lists go there; this
section keeps only what to do next.

- **Now (priority since 2026-09-30): the TDC precons' 5 missing cards** (`SAMPLE_DECKS`, so every
  bot plays them): Temur Roar 2, Sultai Arisen 1, Abzan Armor 2 (Jeskai Striker and Mardu Surge
  have none left), each behind a
  feature of its own. Delete a card's substitution in `sample-decks.ts` as it lands. Which
  feature each needs: `docs/card-blockers.md`, "Open leads".
- **The nine other starter precons' 46 stand-ins** (`engine/data/sweep-3/PC-*.json`), behind the
  TDC decks.
- **Next: the top 5000 cards, then past them.** `top-commander-cards.txt` (3,353 of 5,000
  implemented) is fully triaged, and past it Oracle EDHREC ranks 5011–6671 (batches 30–36);
  rank 6672 is next. Every card left needs engine work: build the features that block the most
  of them (`neededCards-features.md`, "Open: the card backlog"; the cheap recurring blockers
  are in `docs/card-blockers.md`, "Open leads").
- **Cards a built feature may have unblocked** — recheck each against its Oracle text:
  `docs/card-blockers.md`, "Open leads".
- **"You may search" isn't optional on about 35 cards.** Their `search-library` has `min: 0` and
  no `may` around it (Primal Druid), so declining still searches and shuffles, which a library
  ordering (a scry, a Brainstorm) loses. Fierce Empath has the right shape; sweep the rest. Not
  to be confused with the tutors under Engine rules gaps ("Search your library for a card"),
  whose `min: 0` is wrong the other way: they need `min: 1`, not a `may`.
- **Enter the God-Eternals gains a fixed 4 life**, not "life equal to the damage dealt this way":
  wrong beside Torbran, Gratuitous Violence or prevention. It needs the damage actually dealt as an
  amount (`new:damage-dealt-this-way`).
- **Features with a family of cards behind them**, each detailed where it points:
  Ninjutsu and the rest of "enters tapped and attacking" (`docs/card-blockers.md`); modal
  activated abilities with targeted modes, host triggers (28 cards), the EDH-popularity tiers
  (Class; Discover, Reconfigure) and the limitation ledger (`neededCards-features.md`); the
  Incarnations' evoke by exiling a card, and the labelled abilities (Case, Forecast, Max speed)
  (`docs/card-blockers.md`, "Open leads").
- **More Oracle-parser templates.** The unread lines that recur most are the next templates
  ("Choose one —" on an ability, Crew, "Regenerate ~", "You may pay {…}", "Transform ~"):
  `npm run card:scaffold -w engine -- --report --all` for today's figures; keep
  `npm run card:parse-check -w engine` at zero disagreements.

## Engine rules gaps

One line each; the detail (rule numbers, code sites, the cards each blocks) is in
**`docs/engine-gaps.md`**, under the same bold title. Delete both when a gap closes.

- **A mandatory loop throws instead of drawing the game** (104.4b, 732.4): the room stops that game rather than the server going down, but it should be a draw.
- **Blitz is offered only from the hand and the command zone** (702.152a).
- **A mana restriction reads the spell before it's cast** (Jasmine Boreal of the Seven waits).
- **Suspend's time-counter triggers don't use the stack** (702.62a).
- **"Search your library for a card" may fail to find** — twelve tutors need `min: 1` (701.23d).
- **704.5h reads "dealt deathtouch damage this turn", not "since the last state-based check".**
- **Changing a spell or ability's target** (115.7; Return the Favor).
- **"Whenever a creature you control deals combat damage to that player this turn"** (Great Train Heist).
- **"Whenever this Equipment becomes unattached from a permanent"** (Grafted Exoskeleton).
- **A card's own "if this would be put into a graveyard from anywhere … shuffle it into its library instead"** (Blightsteel Colossus).
- **A set rule on a graveyard choice** (Lively Dirge's total mana value 4 or less).
- **No state-based actions after a mana ability activated by hand** (117.3c, 117.5).
- **Counters put as a cost skip counter replacements and prohibitions** (latent).
- **Delve and convoke together on an {X} spell** (Chord of Calling under Teval).
- **Convoke with a target-dependent cost** (latent).
- **The least X a top-of-library cast allows is searched only up to the mana a player can make.**
- **Not modeled**: battles, phasing, dungeons/Initiative/the Ring, banding, Companion, snow sources, face-down permanents, full text-change.
- **"Whenever you activate an ability"** (Rings of Brighthearth).
- **An O-Ring's return is a triggered ability, not rule 610.3's one-shot effect.**
- **End-step token removal resolves without the stack** (603.7, 701.21a).
- **Replacement ordering** — no general `choose-replacement-order` (616.1).
- **Two opponents' Notion Thieves aren't ordered by the drawing player.**
- **Toxic's last two shapes** (Skrelv, Defector Mite; Skrelv's Hive).
- **A Siege's chosen side as it leaves** (Outpost Siege).
- **A look at nothing still asks** (`look-and-choose` over an empty library).
- **Revealing a card "of a type" from hand reads printed subtypes** (changeling, 702.73a).
- **Disturb's "exile it instead" is the cast path's, not the card's** (707.2).
- **An additional-cost option is offered without checking its mana** (Eaten Alive, pulled).
- **A milled card is looked for only in the graveyard** (701.17c).
- **"Return it transformed" brings back a card that can't transform** (712.14a).
- **A sacrifice trigger misses its own sacrifice** (603.10a): "whenever you sacrifice this or
  another …", and Korvold sacrificing himself.
- **A tapped-for-mana trigger adds only a fixed amount**: "an additional {G} for each Elf" adds
  nothing.
- **Damage modifiers apply in a fixed order** (616.1).
- **"You sacrifice it" at end step is done by its controller** (701.21a).
- **Pool cards the no-engine-work pass (2026-10-04) found sharing a blocked shape** — Ayara, Bloomvine Regent, Will of the Jeskai, Kwain, Forced Fruition, Ruric Thar, Spellshock, Magebane Lizard, Black Mage's Rod, and some 610.3c citations.
- **Static-effect dependency ordering** (613.8) beyond layer 4's type grants.
- **The rest of leaving the game** (800.4c, 800.4g–h).
- **Dividing among targets: what's left** — an X total, distributing counters.
- **A token copy isn't asked its "as this enters" choice.**
- **`sacrifice-all-but` always keeps the most it may.**
- **Proliferate over a token stack** gives every member a counter.
- **Distinct targets in one token stack** can't take two tokens of one stack.
- **A commander put into a library from a graveyard, exile or the stack isn't offered the command zone** (903.9b).
- **A token stack tapping fires `becomes-tapped` once.**
- **Creatures leave combat as the end of combat step begins, not as it ends** (511.3).

## Bots

Every step of `docs/plans/bot-effect-knowledge.md` (keep v2, give it an effect-aware base,
retire v3) has landed. What's open is tuning: the items below, and the ones waiting on a live
game to show a problem, listed in that plan's "Watching live games for" (wraths since
`threat`, pumping an opponent's attacker, the `"acting"` rollout, big boards and deep stacks
under count budgets).

- **An X ability activated at X=0** (decision diff, 2026-10-06): Necropolis Fiend taps for a -0/-0 on both the branch and main (seed 4, turn 36) — an X of 0 that does nothing shouldn't be a candidate.
- **The autopsies' open bot items** (`docs/plans/deck-autopsies.md`, "Left"): token payoffs
  beyond engines (sacrifice outlets, leaves-the-battlefield);
  premium removal fired at weak targets past the first two rounds (the early half is done).
- **More training scenarios.** 120 hand-built scenarios, all of them gating
  (`bot/scenarios.ts`). Not yet covered: mulligans (`mulligan-policy.test.ts`). More come from
  live games: the in-game Capture button (`--capture`) saves a position to `captures/`, which
  `bot:scenarios` and `bot:fit-scenarios` read as training scenarios, as does each blunder
  `bot:behaviour` shows. `npm run bot:captures -w engine` lists them with v2's answer today;
  once one is fixed, `-- resolve` moves it to `captures/resolved/`, where it gates.
- **A wider pool of bot decks (later — raised 2026-09-26).** `SAMPLE_DECKS` is fourteen precons
  since 2026-10-02 (the five Tarkir: Dragonstorm decks, the five 2022 starter decks and four more —
  `docs/plans/precon-decks.md`), five flagged `bench`, whose first four are the seats' fallbacks. Still unscoped: decks across
  a range of power levels for bots to bring, and how a host picks one.
- **More deck biases.** `engine/src/deck-bias.ts` (`docs/plans/deck-biases.md`) lets a
  commander's deck aim effects the other way and value its own board differently; Teval is the
  one entry. Add one when a live game shows a deck's bot playing against its plan, with a gate
  scenario that fails without it. Kinds not built: cards to cast first or hold, attack
  eagerness, and opponents' biases (milling an opponent's Teval still reads as neutral to us).
- **A body's worth on a wide board** (the user's question, 2026-10-04; shelved): every creature counts `creatures` 2.5 whether it's the first or the twentieth. Tried two ways. Discounting creatures past six on the board changed 28 of 28,856 decisions over 12 four-player games, half of them good (Felothar and Jarad sacrificing spares, more token attacks) but it also cut the value of *making* creatures (Raise the Alarm passed at 13 life). Discounting only creatures *lost* past six, counted from the decision's root, changed none of 28,501 at a refund of 2.5 or 4: a 2/2 is worth about 5.6 in all, so a refund flips a choice only near a whole creature (Village Rites on a spare Bears flips between 4.3 and 10). Revisit with a live misplay that needs it.
- **Fewer 1/1 tokens made since `smallTokens`** (2026-10-04): `bot:diff` showed March of the
  Multitudes, Raise the Alarm and Dawn of Hope's activation passed over for other plays. Watch the
  token decks (Token Triumph is on the bench); a token payoff on the board isn't priced yet.
- **Shiko or the other spell, when only one fits** (since the chained-spells change, 2026-10-04):
  with a cast payoff in reach the priority search rolls our turn out as v1 (`"acting"`), and where
  only one of Shiko and another spell is affordable it now often casts the other (16 times in 12
  games, `bot:diff`), where the old search cast Shiko. Bench level; worth a scenario from a live
  game before changing it.
- **A payoff permanent before the spell that triggers it, beyond cast triggers** (a capture,
  2026-10-04, HB5MR turn 22, open): bob cast Citywide Bust without casting Colfenor's Urn first.
  Re-diagnosed 2026-10-07: he could afford both, and Urn-first sets the Tree under the Urn (Felothar
  goes to the command zone before the Urn's trigger, rule 903.9a), so the payoff is deferred, not
  this turn. The search never has "Urn, then Bust" as a candidate: its rollouts pass our seat. Since
  the Urn's exile is now valued (`waitsToReturn`, linked exile in `effect-worth.ts`), the cheapest
  fix is a `payoffFirst`-style rule (`controller.ts` ~1507) applied after the search: when the best
  move is a wipe that takes our own creatures (`sweepTakesOurs`) and a "dies"/"leaves" payoff whose
  filter matches them is castable with the wipe still affordable after, cast the payoff first.
  Gate: Colfenor's Urn and Citywide Bust in hand, three Walls of Omens out. Risk: deterministic, so
  it must check the filter and the mana; the alternative is widening the `"acting"` rollout
  (`eval-bot.ts` ~843) to these windows, about 1.7× dearer there.
- **A vigilance creature tapped for mana before it attacks** (a capture, 2026-10-06, NZP7Q turn
  17, open — the user: "creatures with tap abilities and vigilance usually should use these
  abilities after combat"): bob cast Orzhov Signet precombat off Faeburrow Elder's mana, so it
  couldn't attack; with vigilance it attacks and still taps for the Signet in main 2. The search
  can't see main 2 (rollouts pass our seat). Fix outline: a `holdsTapForCombat` beside
  `holdsWipeForCombat` (`controller.ts` ~2108): our precombat main, the candidate taps an untapped
  vigilance creature of ours that could attack (seen from the cast-now rollout's end state); hold
  it (`heldForCombat`, `eval-bot.ts`) only if one more simulation, pass then the same cast in main
  2, scores at least as well, which keeps the right pre-combat plays (a haste creature, removing a
  blocker). Gate: Faeburrow Elder alone with Arcane Signet in hand passes. The capture's own
  position is the attack, which is fine, so it resolves `--force` against that gate.
- **A held wipe's mana isn't kept through combat** (from capture 9M59N t17, 2026-10-07): once a
  wipe is held for after combat (`heldForCombat`), nothing stops a combat pump spending its mana,
  and the rollouts never cast the wipe in main 2. Remember the held wipe for the turn and, in our
  own combat steps, drop candidates that leave less than its cost (as `holdsManaForMain` does),
  unless the pump is lethal. The existing gate covers only precombat.
- **The priority search scores pass before choosing its rollout policy** (diagnosis, 2026-10-07):
  `eval-bot.ts` ~819 scores the pass baseline before `decisionRollout` is set (~843), so with a
  cast payoff out, pass is scored under `"combat"` and the candidates under `"acting"`, and the
  batch loop uses `this.rollout` (~889). Live and replayed searches can disagree. Move the
  assignment above the baseline; changes Shiko/prowess decisions, so `bot:diff` it.
- **`crackbackGrowth` is unbenched since its last change** (2026-10-05, merged to main on the user's call with the tests, scenario gate and a 20-game fuzzer pass clean): the scaled crackback check now applies only while holding back passes it. Still to do: rerun the paired `bot:crackback` (0.5 against `--weights '{"crackbackGrowth":0}'`, 120+ seeds) to confirm the 25 swings into a plainly lethal board are gone and the 3.5% → 2.0% holds, re-bench against main, and add a training scenario (`docs/plans/smarter-bots.md`, "Combat: the alpha strike and crackback").
- **Crackback counts later opponents at half** (2026-10-05, `bot:crackback`): over 198 four-player games, 166 full swings into a board lethal with every opponent all-in passed the bot's check because `crackbackParanoia` weighs all but the next opponent at 0.5, and 17% of them died before the bot's next turn (2.7% when nothing showed lethal). `crackbackGrowth` doesn't touch it; a paranoia that rises as life falls, or as fewer opponents remain to split the attacks, is the lever (`docs/plans/smarter-bots.md`, "Combat: the alpha strike and crackback").
- **Haste enablers in the crackback** (2026-10-05, low): `combat-math.ts`'s `crackback` sees only creatures on the board; haste decided 10 of 70 crackback deaths, and an opponent's visible enabler (Swiftfoot Boots, Anger in a graveyard, Dragon Tempest, Crashing Drawbridge) raised the death rate about a point, inside the noise.
- **Tactical mercy for a player far behind** (the user, 2026-10-04 — a politeness thing more than a misplay, and the balance is still open): a bot kills a player who is far behind whenever it can, but there is merit in not killing a player unless they are a threat or the kill wins the game. Where the line sits between swinging at an open player and sparing one with no creatures on board isn't settled; the attack builder (`bot/eval-bot.ts`, `alphaStrike`'s kill planner) is where it would go. Related, from a capture (HB5MR turn 20): dave sent all three attackers at alice, the one player without blockers; the user would have spread them — a politics call, maybe their own bias, maybe how tables really play. Both want a model of how attacks make enemies.

## Client / UI

One line each; the detail is in **`docs/client-gaps.md`**, under the same bold title, and the
animation follow-ups in `docs/plans/legibility-of-play.md`, "Follow-ups". Delete both when an
item lands.

- **A revealed top card of a library has no hover card** (the user, 2026-10-07): hovering it should show the card blown up, as hovering a tile does.
- **The hand's hover-grow replays when another player plays a card** (a bug report, 2026-10-07): the card under the pointer shrinks and grows again; cause not yet found — see `docs/client-gaps.md`.
- **The top strip still clips the phase track at 1024 wide** (2026-10-06 UI review): with bot speed moved into Settings every step shows at 1366, but at 1024 the track stops at CD.
- **A gift's opponent is asked one opponent at a time** — one prompt naming every opponent would read better.
- **What the scenario builder can't say yet** — stolen, transformed or face-down cards, damage, turn-long effects, the stack, the turn number.
- **Face-down permanents on their controller's board, turned up from the ability menu** (blocked on the engine).
- **One art-crop primitive** — the art lookup is repeated in six components.
- **Large live mana amounts by hand** — a count picker past 22 splits; choosing what floats.
- **Quality-of-life room options (house rules)**, opt-in per room.
- **Server-side deck save and share** (decks live in `localStorage`).
- **The library and the deck builder load every card definition** (~3.1 MB).
- **"Same for all" covers only a trigger's yes-or-no "you may".**
- **Animation follow-ups** (re-measure bot speeds, static buffs, library put-backs, the exile filter, the crown's flight, merged tokens, folding tokens with counters, dies-trigger pulses, history highlights, real sounds): `docs/plans/legibility-of-play.md`, "Follow-ups".

## Tooling / docs

- **An on-screen progress bar for the long checks** (the user, 2026-10-06): use Claude Code's new mods feature (a plugin's live pane or status line — the `plugin-authoring` skill) to show progress for the runs we do regularly: the engine suite, `bot:scenarios`, `bot:diff`, `bot:ab`, the fuzzer and the Playwright suites.
- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.
- **CI's fuzzer reaches three quarters of the pool.** CI's 38 fixed seeds put 3,904 of the
  5,369 deckable cards in some deck. The other quarter is never fuzzed in CI, only locally,
  where 150 two-player seeds reach all but 46. Either raise CI's game counts (about 60
  two-player seeds for 87%, roughly double the fuzz time), or start each run at a different
  seed so that successive runs sweep the whole pool.
- **Eminence is cited as rule 702.106**, which is Hidden Agenda: `abilities.ts`
  (`fromCommandZone`), `cards/define.ts`, `game.ts` and `eminence.test.ts`. Eminence is an
  ability word (rule 207.2c), with no rule of its own; the cards' text is what works. Likewise
  "a delayed ability chooses no new targets" is cited as 603.7d, which is about its source and
  controller: its captured objects aren't targets because its text doesn't say "target". That
  citation is in AUTHORING §6, `effects.ts`'s `delayed-trigger`, `game.ts` (three places),
  `state.ts` and `target-polarity.ts`.

## Code health

- **Saved-deck migrations.** `client/src/deck-builder/decks.ts` rewrites two old shapes every
  time it reads saved decks: a lone `commander` (from before Partner pairs) and a card held under
  its flavor name (Princess Sarah, renamed 2026-09-16; `nameForFlavorName`). Neither rewrite is
  saved, so an old deck needs them until it's next edited. Write each migrated deck back once,
  then drop both.
- **Vocabulary built ahead of any card.** Effect, trigger, condition, filter and replacement
  pieces, plus optional fields, built before any card used them. Keep them for the cards they
  were built for, but review the first card that uses each. The list is in
  `neededCards-features.md`, "Built ahead", measured 2026-09-25 and now stale: about ten of its
  pieces have cards since (`day-night`, `gain-control-all`, `notColors`, `sharesCardTypeWith`,
  `xInManaCost`, `cardTypeCount`, `goadedForGame`, the `player-counters` condition, `{ sum }`,
  …), so recount it. `painIfUntapped` is the one no real card can use.
- **Prohibition scans are quadratic.** `abilitiesProhibited`/`prohibitionsOn` rescan the whole
  battlefield on every call, per permanent, and `recomputeControl` rescans for control Auras per
  permanent once anything has a control effect. On a land-heavy board they were 31% of a
  profile, and turns slow down steadily. Not a hang, but the fuzzer now meets it: four-player
  seed 27 (as the pool stood on 2026-09-29) is a 182-turn game of land-heavy boards that ends
  in deck-outs and takes ~32 s, past the local 30 s default (CI's four-player pass allows
  120 s), with `abilitiesProhibited`/`prohibitionsOn` ~10% of its profile and registry lookups
  another 10%. Four-player seed 10 (2026-09-30) is another: 176 turns, ~31 s. The bots' big
  boards are the same cost seen from the search (`bot-effect-knowledge.md`, "Watching live
  games for").
- **Resolve-hatch sweep.** Convert the four remaining imperative `resolve` cards (Atarka, World
  Render; Gaze of Granite; Green Sun's Zenith; Toxic Deluge) to a declarative `effect`.
- **Tokens that attacked stay split off their stack until cleanup**, even when they come out of
  combat identical, or all get the same counter from an attack trigger: ten such Warriors are
  ten objects (and, with counters, ten board tiles) through the second main phase.
  `refoldSplitTokens` skips them because `turnHistory.attackers` counts each creature once by
  object, and a stack folded mid-turn would attack in a second combat as itself plus fresh
  tokens split off it, counted again (Windbrisk Heights, `token-stack-refold.test.ts`). Folding
  them needs the history to know a split-off token's stack already attacked — say, count only
  attackers that hadn't attacked yet this turn (`attackedThisTurn` before the declaration).
  Nothing plays differently.
