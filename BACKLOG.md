# BACKLOG.md

What is left to do, and nothing else. Each item is one line that points to where the detail
lives. Finished work belongs in `git log` and in the design records' `Status:` lines, not here.
When something lands, delete its line. When you find something new, add one.

## Questions for the user

Each waits on a decision only the user can make. Once one is answered, move the work it
decides into its section below.

None open.

## Commander gap (the current priority)

**393 of the 500 most-played commanders are implemented** (`top-commanders.txt`; re-mark with
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

- **Now: more cards, in EDHREC rank order** (the `author-top-cards` skill). `npm run cards:needs
  -w engine -- --next 60` lists the next untriaged cards by rank: Turntimber Symbiosis (rank
  2312) is triaged since batch 37, so rank 6672 on. The nine other starter precons' 32 stand-ins
  (`engine/data/sweep-3/PC-*.json`) go as their originals land.
- **Cards manifest and cloak may have unblocked** — recheck each: `docs/card-blockers.md`,
  "Open leads".
- **3 cards whose recorded blockers have all been built since** (The Legend of Kyoshi, The
  Restoration of Eiganjo, Jill, Shiva's Dominant — each a Saga or creature that returns
  transformed) — recheck each with `card:brief` (`npm run cards:needs -w engine -- --stale`).
- **Next: the top 5000 cards, then past them.** `top-commander-cards.txt` (3,408 of 5,000
  implemented) is fully triaged, and past it Oracle EDHREC ranks 5011–6671 (batches 30–36);
  rank 6672 is next. Every card left needs engine work: build the features that block the most
  of them (`neededCards-features.md`, "Open: the card backlog"; the cheap recurring blockers
  are in `docs/card-blockers.md`, "Open leads").
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

- **At most 100 tokens of one stack can block** (509.1a): `Game.MAX_MATERIALIZED` still caps a *blocking* stack; attacking was fixed on 2026-10-07 (a counted attacking stack, `attackingStackPart`).
- **A mandatory loop throws instead of drawing the game** (104.4b, 732.4): the room stops that game rather than the server going down, but it should be a draw.
- **Blitz is offered only from the hand and the command zone** (702.152a).
- **A mana restriction reads the spell before it's cast** (Jasmine Boreal of the Seven waits).
- **Suspend's time-counter triggers don't use the stack** (702.62a).
- **Changing a spell or ability's target** (115.7; Return the Favor).
- **"Whenever a creature you control deals combat damage to that player this turn"** (Great Train Heist).
- **"Whenever this Equipment becomes unattached from a permanent"** (Grafted Exoskeleton).
- **A card's own "if this would be put into a graveyard from anywhere … shuffle it into its library instead"** (Blightsteel Colossus).
- **A set rule on a graveyard choice** (Lively Dirge's total mana value 4 or less).
- **Delve and convoke together on an {X} spell** (Chord of Calling under Teval).
- **The least X a top-of-library cast allows is searched only up to the mana a player can make.**
- **Not modeled**: battles, phasing, dungeons/Initiative/the Ring, banding, Companion, snow sources, morph/disguise/manifest dread (face-down permanents are built: manifest and cloak), word-replacing text change (612.2).
- **"Whenever you activate an ability"** (Rings of Brighthearth).
- **An O-Ring's return is a triggered ability, not rule 610.3's one-shot effect.**
- **End-step token removal resolves without the stack** (603.7, 701.21a).
- **Replacement ordering** — no general `choose-replacement-order` (616.1).
- **Two opponents' Notion Thieves aren't ordered by the drawing player.**
- **Toxic's last two shapes** (Skrelv, Defector Mite; Skrelv's Hive).
- **Damage modifiers apply in a fixed order** (616.1).
- **Pool cards the no-engine-work pass (2026-10-04) found sharing a blocked shape** — Will of the Jeskai, Kwain, Forced Fruition, Ruric Thar, Spellshock, Magebane Lizard, Black Mage's Rod.
- **Static-effect dependency ordering** (613.8) beyond layer 4's type grants.
- **The rest of leaving the game** (800.4c, 800.4g–h).
- **Dividing among targets: what's left** — an X total, distributing counters.
- **A token copy isn't asked its "as this enters" choice.**
- **`sacrifice-all-but` always keeps the most it may.**
- **Proliferate over a token stack** gives every member a counter.
- **Distinct targets in one token stack** can't take two tokens of one stack.
- **"Its controller may search" always searches** (Path to Exile, Assassin's Trophy, Ghost Quarter, …): a `may` asks the effect's controller, not that player.
- **A source's chosen colour or number isn't read from last-known information** (latent).
- **A "trigger-object" that blinks is still found** (400.7): Atarka's double strike lands on a Dragon Cloudshifted in response.

Latent: the engine departs from the rules here, but no pool card reaches it yet. Fix each
when a card that needs it is authored.

- **Counters put as a cost skip counter replacements and prohibitions.**
- **Convoke with a target-dependent cost.**
- **A ceased token's last-known information lasts only the turn** (`ceasedTokens`; delayed triggers carry their own since 2026-10-09).
- **A `{T}` ability granted to a token stack taps the whole stack** without splitting one off.
- **Convoke with a choice of additional costs** (`castableAt` passes no `costOption`).

## Bots

Every step of `docs/plans/bot-effect-knowledge.md` (keep v2, give it an effect-aware base,
retire v3) has landed. What's open is tuning: the items below, and the ones waiting on a live
game to show a problem, listed in that plan's "Watching live games for" (wraths since
`threat`, pumping an opponent's attacker, the `"acting"` rollout, big boards and deep stacks
under count budgets, deck biases, 1/1 tokens since `smallTokens`, Shiko or the other spell, and
haste enablers in the crackback).

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
  `docs/plans/precon-decks.md`), six flagged `bench`, whose first four are the seats' fallbacks.
  Since 2026-10-07 the five TDC precons also come upgraded (`UPGRADED_DECKS`, a room's "Bot decks"
  setting; `docs/plans/upgraded-decks.md`). Still unscoped: more power levels, and upgrades of the
  other nine.
- **Sultai Arisen and Jeskai Striker (Upgraded) didn't measure stronger than their precons**
  (16.7% and 8.3% against 20.8% and 14.6%, 48 games each, within noise; Temur Roar's upgrade
  went 35% to 69%). More rounds, autopsies of their losses for cards the bots misuse, and
  revised swaps: `docs/plans/upgraded-decks.md`, "Open".
- **`crackbackGrowth` is unbenched since its last change** (2026-10-05, merged to main on the user's call with the tests, scenario gate and a 20-game fuzzer pass clean): the scaled crackback check now applies only while holding back passes it. Still to do: rerun the paired `bot:crackback` (0.5 against `--weights '{"crackbackGrowth":0}'`, 120+ seeds) to confirm the 25 swings into a plainly lethal board are gone and the 3.5% → 2.0% holds, re-bench against main, and add a training scenario (`docs/plans/smarter-bots.md`, "Combat: the alpha strike and crackback").
- **Crackback counts later opponents at half** (2026-10-05, `bot:crackback`): over 198 four-player games, 166 full swings into a board lethal with every opponent all-in passed the bot's check because `crackbackParanoia` weighs all but the next opponent at 0.5, and 17% of them died before the bot's next turn (2.7% when nothing showed lethal). `crackbackGrowth` doesn't touch it; a paranoia that rises as life falls, or as fewer opponents remain to split the attacks, is the lever (`docs/plans/smarter-bots.md`, "Combat: the alpha strike and crackback").

## Client / UI

One line each; the detail is in **`docs/client-gaps.md`**, under the same bold title, and the
animation follow-ups in `docs/plans/legibility-of-play.md`, "Follow-ups". Delete both when an
item lands.

- **The top strip still clips the phase track at 1024 wide** (2026-10-06 UI review): with bot speed moved into Settings every step shows at 1366, but at 1024 the track stops at EC.
- **A gift's opponent is asked one opponent at a time** — one prompt naming every opponent would read better.
- **What the scenario builder can't say yet** — stolen, transformed or face-down cards (manifested ones), damage, turn-long effects, the stack, the turn number.
- **One art-crop primitive** — the art lookup is repeated in six components.
- **Large live mana amounts by hand** — a count picker past 22 splits; choosing what floats.
- **Quality-of-life room options (house rules)**, opt-in per room.
- **Server-side deck save and share** (decks live in `localStorage`).
- **The library and the deck builder load every card definition** (~3.1 MB).
- **"Same for all" covers only a trigger's yes-or-no "you may".**
- **Copied triggers without targets aren't condensed on the stack** (the user, 2026-10-07): Scute Swarm's, for example.
- **Animation follow-ups** (re-measure bot speeds, static buffs, library put-backs, the exile filter, the crown's flight, merged tokens, folding tokens with counters, dies-trigger pulses, history highlights, real sounds): `docs/plans/legibility-of-play.md`, "Follow-ups".

## Tooling / docs

- **An on-screen progress bar for the long checks** (the user, 2026-10-06): use Claude Code's new mods feature (a plugin's live pane or status line — the `plugin-authoring` skill) to show progress for the runs we do regularly: the engine suite, `bot:scenarios`, `bot:diff`, `bot:ab`, the fuzzer and the Playwright suites.
- **Refresh the snapshots.** The EDHREC ranking snapshots (`top-commander-cards.txt`,
  `top-commanders.txt`) and `edhrec-rank.ts` are frozen. Re-fetching them moves the roster, so
  do it on purpose.

- **Stale 701.19b citations.** 701.19b is regenerate, but about 11 files cite it for "a search
  may fail to find" (701.23b): `effects.ts`, `game.ts`, `zone-choice-together.ts`, AUTHORING,
  Chord of Calling, Expedition Map, Krosan Verge, Wargate, Axgard Armory, Aang's Journey and
  `zone-choice-together.test.ts`.

## Code health

- **Drop the saved-deck migrations** (from about 2027). Since 2026-10-09 `client/src/deck-builder/decks.ts`
  writes a deck it migrated back on its first read (a lone `commander`, a flavor name); once old
  decks have had time to be read, `fromStorage`'s rewrites can go.
- **Vocabulary built ahead of any card.** Effect, trigger, condition, filter and replacement
  pieces, plus optional fields, built before any card used them. Keep them for the cards they
  were built for, but review the first card that uses each. The list is in
  `neededCards-features.md`, "Built ahead", recounted 2026-10-09: about 11 pieces and 14
  optional fields remain. `painIfUntapped` is the one no real card can use.
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
