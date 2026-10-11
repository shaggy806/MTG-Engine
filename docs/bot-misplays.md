# Bot misplays from live games

Misplays the user saw on the live site that couldn't be captured, each rebuilt as a scenario in
`engine/src/bot/scenarios.ts` (the `bot-misplay` skill). Newest first. An entry stays until its
scenario passes and moves to the gate; then mark it `fixed` with the commit, or delete it.

## 2026-10-10 — Attackers sent in to die, or to trade, at four players

Status: open.

- **Seen:** "bots keep sending attackers in when they will die, which most of the time is not a good
  idea" — in a four-player game a trade leaves you and the player you traded with behind the other
  two (the user's words; no board saved).
- **Reproduced:** two Hill Giants, a Craw Wurm, and Giant + Grizzly Bears across three opponents against
  a Centaur Courser: v2 sends the Courser at the Giant + Bears player, at the room's 300 ms and unbudgeted
  alike. Bigger boards do the same (a Craw Wurm at a Craw Wurm + Hill Giant). With every opponent level
  (a Giant each) it keeps home, so it's the leading or the double-blocking player it goes at.
- **Right:** keep the creatures home — every attack there dies to a block or a trade.
- **Scenario:** "keeps a creature home when every attack dies to a block" (training; reads wrong today,
  the Courser at dave).
- **Why (two causes, measured):**
  1. *The block isn't foreseen.* The attack planner (`eval-bot.ts`, `declareAttackersSearched`) scores
     each attack by `simulateCombat` (`bot/simulate.ts`), whose defenders are v1
     (`CombatRolloutController`). v1's `declareBlockers` (`controller.ts`) takes a trade only for an
     attacker worth 2 more than the blocker, and a gang block only where no single blocker kills the
     attacker — so it blocks none of these, and the planner reads the Courser as 3 unblocked damage
     (+1.0, the Wurm +0.5). Live defenders are v2, whose own block search double-blocks both
     (−3.55 and −7.96 against keeping home).
  2. *A trade with the leader scores as a gain.* Foreseen, a Courser-for-Hill-Giant 1-for-1 with the
     leading opponent scores **+1.5**; the same trade with a trailing one, −4.46. `scoreOutcome`
     (`evaluate.ts`) subtracts the strongest opponent at `opponent` 1.0 and the rest at
     `otherOpponents` 0.5 over their average, so the leader's lost creature pays for ours in full,
     and the two who sat out barely count.
- **Fix (outline):**
  1. Predict the blocks live bots make: the combat rollout's defender takes even trades (a blocker
     that kills the attacker for one worth no more) and adds a second blocker beside one that trades
     when that kills the attacker for less. Best kept to `CombatRolloutController` (or a v1 option it
     sets) so v1's own blocking is unchanged. Risk: the planner turns timid where a real defender
     wouldn't block (a bluffed trade it now refuses); the gate's "attacks the open player" and the
     crackback scenarios guard the aggressive side.
  2. Price the bystanders in the attack planner, not in `scoreOutcome`: at three or more live players,
     each of our creatures the simulated combat kills costs a further share of its value (say
     `(n − 2)/(n − 1)` of it — two-thirds at four), so a 1-for-1 reads as a loss unless the damage or
     the kill is worth more. Kept out of `scoreOutcome` because removal and the priority search rely on
     the leader counting in full ("removal takes the leader's threat first"). Risk: fewer attacks
     that trade into a leader who is about to win; lethal and near-lethal swings are unaffected (the
     win term dwarfs it).

## 2026-10-10 — A Mountain played where the Forest would cast Sakura-Tribe Elder too

Status: open.

- **Seen:** room FU6RP, turn 11 (four players, the user's seat bot-played): the bot played a Mountain
  and cast Temur Battlecrier, with a Forest in hand that would also have cast Sakura-Tribe Elder.
- **Board:** Island, Hinterland Harbor, Mountain and Sol Ring out; in hand a Mountain, a Forest,
  Temur Battlecrier ({G}{U}{R}), Sakura-Tribe Elder ({1}{G}, {G} once Battlecrier's out), Frostcliff
  Siege and An Offer You Can't Refuse. The Harbor was the only green source.
- **Right:** the Forest — Forest, Island and Mountain cast Battlecrier, the Harbor the Elder. With the
  Mountain, Battlecrier takes the Harbor's {G} and the Elder has none.
- **Scenario:** "plays the Forest that casts Temur Battlecrier and Sakura-Tribe Elder, not a Mountain"
  (training; reads wrong today, choosing the Mountain).
- **Why:** v1's `bestLand` (`controller.ts`) ranks lands by `castableAfterPlay` — how many spells are
  castable *one at a time* after the land — and every spell here is, after either land, so they tie.
  The colour tie-break ties too (green and red are both on the board already: 2 wanted pips each), and
  a tie keeps enumeration order: the Mountain, listed first. v2's search scores each land, but its
  rollouts pass our own seat, so neither land's rollout casts a second spell; v1's pick, scored first,
  wins the tie.
- **Fix (outline):** in `castableAfterPlay`, look one spell deeper: for each castable spell after the
  land, cast it (and let it resolve) and count what's still castable, keeping the best pair — "how
  many spells this land casts together this turn" — as the first key, the single count after it.
  Risk: cost (a simulation per spell per land, on top of today's one per land; capped to the few
  spells the bot would cast), and a pair that isn't what the bot then plays (it may cast the bigger
  spell alone); the land drop is cheap to get right here, as the mana is all known.

## 2026-10-10 — Sarkhan, Soul Aflame copies a Dragon and loses the discount the next one needs

Status: open, fix not wanted for now (the user, 2026-10-10); the scenarios stay as recorded.

- **Seen:** "the bot doesn't know when to let Sarkhan, Soul Aflame transform into a Dragon" (no
  board saved) — the user's case: it didn't copy **Summon: Bahamut** as it entered.
- **Not reproduced (Bahamut):** precombat with Sarkhan unsick, at two and four players, with and
  without the room's 300 ms clock, v2 casts Bahamut before combat, copies it and attacks as the
  9/9 every time; the engine's copy is right too (no lore counters, so rule 714.4 leaves him). The
  one way it declines is when chapter I's "destroy up to one target nonland permanent" is aimed at
  Sarkhan himself — rightly, as he's about to be destroyed — which the bot's own aim doesn't do.
  Held as a gate: "has Sarkhan, Soul Aflame become Summon: Bahamut". The live board differed in
  something not yet known (whether Sarkhan came down that same turn, whether Bahamut came after
  combat or some other way than cast).
- **Reproduced instead:** over the other spots that matter, v2 copies precombat with Sarkhan unsick
  and declines postcombat or with Sarkhan summoning sick, and gets this one wrong.
- **Wrong spot:** precombat, ten Mountains, two Shivan Dragons in hand. The first is cast at the
  discount ({3}{R}{R}); Sarkhan's trigger asks, and the bot copies it. As a copy, Sarkhan has Shivan
  Dragon's abilities, not "Dragon spells you cast cost {1} less", so the second Shivan ({4}{R}{R},
  five Mountains left) can't be cast this turn.
- **Right:** decline, cast the second Shivan at the discount, and copy *that* one when its own
  enters trigger asks: two Dragons on the board and Sarkhan still attacking as one.
- **Scenario:** "keeps Sarkhan, Soul Aflame himself while his discount casts another Dragon"
  (training; reads wrong today, choosing the copy). Its gate twin, "has Sarkhan, Soul Aflame become
  the Dragon it can attack as", holds the spot it gets right.
- **Why:** v1's `chooseModes` prices the "you may" with `effect-worth.ts`, which has no worth for
  `become-copy`, so it's a tie and declining wins. v2's decision search (`bestDecision`,
  `eval-bot.ts`) overrules it: it plays each answer out, but the rollouts pass our own seat, so
  neither answer's rollout ever casts the second Dragon. What's left is the copy's 5 in the air
  this combat against Sarkhan's 2/4, and accepting wins.
- **Fix (outline):** before accepting a "you may" whose effect changes the source's own text (a
  `become-copy` of the source, until end of turn), ask what it costs this turn — as
  `reducerFirst` does: compare the spells castable once each answer resolves
  (`legalActionsAfter` on `[accept, passes…]` and `[decline, passes…]`), and if declining keeps a
  cast that accepting loses, decline (the next Dragon's trigger offers the copy again). Contained
  to `chooseModes` / the decision search for this effect kind. Risk: declining a copy when the
  spell kept is one the bot then doesn't cast (a sorcery-speed one after combat), losing the
  attack for nothing — so only where the lost spell is a Dragon that would re-offer the copy, or
  check that the bot's own priority answer casts it.

## 2026-10-08 — Klauth's mana: all white, asked one unit at a time

- **Seen:** the bot "has no clue how to add mana in any combination of colors", and the choice is
  asked as modes — 50+ decisions when a lot of creatures attack (Klauth, Unrivaled Ancient: "add X
  mana in any combination of colors, where X is the total power of attacking creatures").
- **Right:** the colours the hand's spells need — Klauth's deck is red and green, the mana only casts
  spells — asked as one decision, not one per unit.
- **Scenario:** "splits Klauth's mana into the colours its hand casts" (training) — Klauth and two
  Craw Wurms attack (16 power), Lightning Bolt and a Craw Wurm in hand: the pool comes out
  sixteen {W}, after sixteen `choose-modes` decisions.
- **Why, the decision:** `addManaChoice` (`effects.ts`) offers "N mana in any combination of …" as
  one choice of split only while there are at most `MAX_MANA_SPLIT_MODES` (35) splits; over five
  colours that's three units. Past it, each unit's colour is its own `modal` choice of five, up to
  1,000 — for a human seat too, one prompt per point of power.
- **Why, the colour:** v1's `chooseModes` scores each mode by `effectWorth`, which prices {W} and
  {R} alike, so the tie goes to mode 0, white, every unit. v2 searches each of the sixteen (a
  rollout per colour per unit) and the evaluation doesn't read the pool's colours either, so v1's
  pick stands.
- **Fix (outline):** two parts.
  1. *The bot's colours* (contained): in v1's `chooseModes`, when every mode is a single-colour
     `add-mana`, pick the colour the hand needs most that the pool (already holding the earlier
     units) and the untapped lands don't cover — the coloured pips of the spells in hand, honouring
     a spend restriction (Klauth's is spells only), then the commander's colours. v2 takes v1's
     answer for these without a search: the evaluation can't see the difference, and sixteen
     searched units are most of a big attack's time.
  2. *The decision's shape* (a design call): one decision for the whole split — a new decision kind
     ("share N mana among these colours", counts per colour summing to N) through the decision
     registry, with a client prompt of per-colour steppers and a bot answer from part 1. Cheaper
     middle ground: give each per-unit choice "the rest as {X}" modes, ending the run in one pick.
  Might break: a deck whose hand needs nothing still gets some colour, which is harmless; the new
  decision kind touches engine, protocol, server and client together.
- **Status:** fixed, both parts (the user chose the one split prompt, 2026-10-08). Past 35 splits
  `addManaChoice` raises one `split-mana` decision (`decisions/split-mana.ts`, `Game.applyManaSplit`):
  how many of each colour, summing to N. v1's `chooseManaSplit` fills the hand's coloured pips
  less the pool first, then shares the rest among the commander's colours (or the hand's); v2 has
  no candidates for it and takes v1's. The client's prompt is a `CountStepper` per colour. The
  scenario gates: sixteen mana as eight {R} and eight {G}, in one decision.

## 2026-10-08 — a basic played over a fetch land with a landfall payoff out

- **Seen (the user's rule):** with landfall triggers on the board and the mana not needed, the bot
  plays a regular land where any fetch land would do more: a fetch is two lands entering, itself and
  the land it finds, so two landfall triggers to a basic's one.
- **Right:** the fetch, whenever every land in hand casts the same this turn.
- **Scenarios:** "plays Evolving Wilds over a Forest for two landfall triggers", "plays Wooded
  Foothills over a Forest …" and "plays Evolving Wilds over a tapped Jungle Hollow …" (training) —
  five Forests out, Rampaging Baloths, and a Grizzly Bears in hand that casts either way: all three
  play the other land.
- **Why:** every land casts the same (`castableAfterPlay` looks past a fetch's crack already), so
  v2 searches them all with v1's pick first, and the search can't tell them apart: its rollouts
  never crack the fetch, so the second landfall trigger never appears, and the lands tie. On a tie
  v1's `bestLand` decides: first the tapped land (Jungle Hollow), then the land making the colours
  the hand wants — the Forest's green for the Bears, where a fetch makes no mana itself. With an
  empty hand the fetch scored 0 like the Forest and won only by being listed first, so a board with
  nothing to cast hid the miss.
- **Fix (outline):** in `bestLand`, ahead of the tapped and colour tie-breaks, prefer a land with a
  free fetch (`isFreeFetch`, or any fetch the bot would crack) when a landfall permanent of ours is
  on the battlefield (`isLandfallPermanent`) — the castable count already tied, which is the user's
  "doesn't need the mana". Separately, a fetch could count the colours of what it can find in the
  colour score, which would help without a landfall payoff too. Might break: a fetch whose life
  payment the bot won't make (`FETCH_LIFE_FLOOR`) or with nothing left to find shouldn't win —
  gate it on the crack being one the bot would make; and v2's search still ties, so v1's order has
  to carry it, as it does today.
- **Status:** fixed (the user asked, 2026-10-08), in both bots. v1's `bestLand` puts a fetch it would
  crack at once (`crackedOnPlay`: `isFreeFetch` asked of a copy with it played, and a land left in
  the library) ahead of the tapped and colour tie-breaks while a landfall permanent of ours is out.
  v2 alone still lost to Jungle Hollow's life, its rollouts never cracking the fetch, so its land
  search now scores such a fetch as the drop and the crack together (`scoreLandDrop`, any fetch,
  landfall or not). All three scenarios gate, with a guard: no landfall payoff, the Forest over a
  Wooded Foothills that only costs life. bot:diff v1 (40 games): 39 of 82,803 decisions, every one
  a fetch over another land with a landfall payoff out (Bojuka Bog six times — its graveyard exile
  held for later).

## 2026-10-08 — Young Pyromancer cast before Shiko and Narset, so Swords to Plowshares wasn't copied

- **Seen:** Kykar cast Young Pyromancer, then Shiko and Narset, Unified from the command zone,
  then Swords to Plowshares at Adeline with Shiko still on the stack. Swords was the turn's third
  spell, so Flurry ("whenever you cast your second spell each turn") had nothing to copy, even had
  Shiko resolved first.
- **Right:** Shiko first, Swords second — Flurry copies it and a second creature is exiled — then
  Pyromancer.
- **Scenario:** "casts Shiko before Young Pyromancer so Swords to Plowshares is copied" (training)
  — Shiko in the command zone, Young Pyromancer and Swords in hand, eight lands, Adeline and a Serra
  Angel across: casts Young Pyromancer first. Beside the gate's "casts Shiko first so the Lightning
  Bolt after her is copied", which passes: there's no second payoff in that hand.
- **Why:** no search at all (`via: "payoff first"`, 0 simulations). `payoffFirst`
  (`controller.ts`, both bots) returns the first cast payoff in the offer list that leaves another
  spell castable after it, and Young Pyromancer and Shiko are both cast payoffs (`isCastPayoff`).
  Pyromancer came first. Then Shiko went second through the same return, which doesn't record
  `actedOn` — the Guttersnipe entry's miss — so Swords was searched afresh and cast in response.
- **Fix (outline):** in `payoffFirst`, with several cast payoffs on offer, put one whose trigger
  counts the turn's spells (`nthEachTurn`, Flurry) first, since its window is the turn's first
  spells; and while such a payoff is ours with its spell still to come (spells cast this turn one
  short of its `nthEachTurn`), don't hand that spell to another payoff through `payoffFirst` when
  a spell it would copy (one that targets) is castable — leave the choice to the search, whose
  `"acting"` rollout sees the copy. Plus the Guttersnipe fix, so Swords waits for Shiko to
  resolve. Might break: a hand where the plain payoff first is better (Pyromancer before a pile
  of instants, with Flurry worth only a card) — the search would still weigh that once the
  shortcut stops deciding.
- **Status:** fixed as outlined (the user asked, 2026-10-08): `payoffFirst` tries a spell-count payoff
  (`spellCountPayoff`, read off the trigger's `nthEachTurn`) before the others, and while one of ours
  waits for its spell (`spellCountPayoffWaiting`) doesn't hand that spell to a payoff that targets
  nothing when a spell Flurry would copy is castable. With the Guttersnipe fix below, the scenario —
  now the whole turn: Shiko, Swords (copied, both creatures exiled), Pyromancer — gates. v1 shares
  `payoffFirst` but has no search for the held slot, so it falls to v1's usual order (bot:diff, 40
  games: seed 25 cast Lier there, not Monastery Mentor; Flurry draws either way).

## 2026-10-08 — a kill through Towering Titan's trample passed up

- **Seen:** found while chasing the Titan report below, not in a live game. Twice the bot could
  sacrifice one wall to Towering Titan for trample and kill an opponent, and passed both times.
- **Right:** one wall for a player eliminated, every time.
- **Scenarios:** "gives Bob's attack on Carol trample with Towering Titan to finish her"
  (training) — a bystander: Bob's Craw Wurms and Colossal Dreadmaw into Carol's chump blocks,
  Carol on 12, trample takes her to −2; and "tramples a chump-blocked Towering Titan over for
  lethal" (training) — Alice's 17/17 Titan chumped by a Bear, every opponent on 15. Both pass
  when the Titan is activated once (checked by forcing it).
- **Why:** the search sees both kills and scores them below passing: −19.2 against −7.1, and
  24.5 against 33.1. `scoreOutcome` (`evaluate.ts`) is our position minus the strongest
  opponent's and a share of the *average* of the rest, and nothing counts how many opponents are
  left. Killing the weakest opponent (Carol, low on life and cards) takes her out of that average,
  which goes *up* — the kill reads as a loss. With opponents alike, the player removed leaves the
  strongest and the average where they were, so the kill scores about nothing and the wall
  sacrificed decides it. The same blind spot prices every elimination, not just this card's:
  a burn spell at a player's face, an attack that finishes someone off.
- **Fix (outline):** reward each opponent eliminated. Either a fixed bonus per opponent who has
  lost (a new weight, well above a creature and well below `WIN`), or let an eliminated opponent
  stay in the average at a floor score, so removing the weakest lowers it rather than raising it.
  Might break: kill-chasing over the real threat (finishing a harmless player while the leader
  runs away), and the four-player benches' balance — it needs the scenario gate, `bot:diff` and
  an A/B run, not just these two scenarios.
- **Status:** fixed with the first part, valued as the user suggested — more as the game goes
  on: a new weight, `eliminations` (20), adds each opponent eliminated scaled by the round
  (`eliminationShare`: a quarter in round 1, all of it from round 10). Both scenarios gate (the
  bystander one flips between 8 and 12). The second part was tried and dropped: averaging over
  the starting seats closed only 3–4 points of each gap, and a decision-diff showed it also
  halved the second opponent's weight in every three-player endgame (Jaws of Defeat moving off
  the trailing player). Champions keep `eliminations` 0.

## 2026-10-08 — Towering Titan's sacrifice activated several times

- **Seen:** while one opponent attacked the user with everything, a third seat's bot (Abzan
  Armor, Felothar's deck) activated Towering Titan's "Sacrifice a creature with defender: All
  creatures gain trample until end of turn" several times, throwing away walls. The first
  activation can be a real play (the attacker's blocked creatures trample over the user's
  blockers), but every one after it gains nothing: trample doesn't stack.
- **Right:** at most one activation a turn, and only when the trample changes a combat.
- **Scenario:** none kept — **not reproduced.** Every board tried had v2 activate the Titan zero
  times: the bot's own turn with the Titan chump-blocked (Felothar out or not); an opponent
  attacking the bot, lethal or not; and the reported shape, Bob attacking Carol with Craw Wurms and
  a Colossal Dreadmaw into chump blocks while Alice holds the Titan and four walls. Likewise v1,
  and v2 under a live-room clock (`timeBudgetMs` 300 and 40).
- **What's known:** the default `"turn"` horizon rolls out past cleanup, so trample itself never
  scores (`evasivePower` in `features.ts` counts it only while it lasts); only the damage it
  lets through does. A second activation lets no more through, and a sacrificed wall costs
  `creatures`/`toughness`, so the repeat should score below passing. Something on the live board
  made a sacrificed wall read as a gain, or a repeat look like a fresh choice. Leads: a wall with
  value when it leaves (a token, a death trigger), the batch path (`simulateRepeated`, which
  re-offers `previous` with a fixed `sacrifice`), or the repeats spread over separate windows.
  The Capture button on the next sighting would settle it.
- **Seen on the way (not the report):** the opposite miss is reproducible — the entry above.
- **Status:** not reproduced.

## 2026-10-08 — an instant cast in response to the bot's own Guttersnipe

- **Seen:** the bot cast Guttersnipe, then an instant with Guttersnipe still on the stack. The
  instant resolved first, and Guttersnipe's 2 damage to each opponent was lost.
- **Right:** let Guttersnipe resolve, then cast the instant, which triggers it.
- **Scenario:** "lets Guttersnipe resolve before casting Lightning Bolt" (training) — four
  Mountains, Guttersnipe and Lightning Bolt in hand, Grizzly Bears across: casts Guttersnipe,
  then Bolts the Bears in response.
- **Why:** the same miss as the Archmage Emeritus entry below (2026-10-06), and a second gap
  behind it. Guttersnipe goes out through `payoffFirst`'s early return in `EvalBotController.act`,
  which doesn't record `actedOn`, so the next window isn't a held pass (`holdPass`) but a
  fresh search. In that search `castPayoff` — which turns on the `"acting"` rollout, the one
  where our own seat casts its spells later in the turn — reads the battlefield, hand and
  command zone but not the stack, so with Guttersnipe on the stack it's false and the rollout is
  the default `"combat"`, where our seat casts nothing. Passing is scored as Guttersnipe
  resolving with the Bolt never cast; Bolting the Bears now scores higher.
- **Fix (outline):** both parts. Record `actedOn` on the early returns that cast our own spell
  (`payoffFirst`, landfall-first, reducer-first), so the window after passes while it resolves —
  the Archmage entry's fix. And let `castPayoff` count our own payoff on the stack, so a window
  that is searched with it there (an opponent responded, a trigger landed, so `holdPass`
  doesn't apply) rolls our seat out acting, where the Bolt cast after it resolves scores the
  2 damage to each opponent. Might break: the first, nothing deliberate (a response to our own
  spell was never a searched choice). The second turns on `"acting"` in more windows — those
  rollouts cost more, and the tie in `act` goes to acting, so a window with a payoff on the
  stack could still cast in response on a tie; the scenario would show it.
- **Status:** fixed, both parts: `payoffFirst`, `reducerFirst` and landfall-first record `actedOn`
  (`EvalBotController.acted`), so the window after passes while the spell resolves; and `castPayoff`
  counts a payoff of ours on the stack. The scenario gates.

## 2026-10-07 — a fetch land not counted as this turn's mana

- **Seen:** the bots don't see a fetch land that can get an untapped land as mana for this turn,
  so they don't favour it even when cracking it would let them cast a spell that turn.
- **Right:** a fetch that finds an untapped land (Wooded Foothills for a Forest) is as good as
  that land this turn. Played and cracked, it casts what the land would.
- **Scenario:** "plays Wooded Foothills over a tapped Jungle Hollow to cast Birds of Paradise"
  (training) — turn one, Wooded Foothills, Jungle Hollow and Birds of Paradise in hand, a library
  of Forests: plays Jungle Hollow.
- **Why:** both bots rank land drops by what each casts right after it's played: v1's
  `bestLand` by `castableAfter` (`controller.ts`, `castableAfterPlay`), and v2 only searches the
  lands that cast the most. That look stops at the land drop, before the crack, and a fetch
  makes no mana itself, so the fetch reads as casting nothing: a tie with Jungle Hollow, and on
  a tie `bestLand` takes the tapped land. (Cracking itself is fine: once the fetch is down,
  `isFreeFetch` cracks it at once.)
- **Fix (outline):** in `castableAfterPlay`, look past a fetch as it does past a shock land's
  "pay 2 life?": when the land just played has a free fetch ability (`isFreeFetch`), carry the
  look on through activating it, every player passing so it resolves (as `reducerFirst`
  resolves a reducer), and answering its search as the bot would (the land its
  `choose-from-zone` answer picks), then count what's castable. A fetched land that enters
  tapped (Evolving Wilds, Terramorphic Expanse) then rightly counts as nothing, and a fetch
  whose life payment the bot wouldn't make (`FETCH_LIFE_FLOOR`) isn't looked past. Might break:
  the extra simulated steps cost time on every land drop holding a fetch (a few
  `legalActionsAfter` calls, each a cloned game), and the search's answer has to be the same
  one the bot gives later, or the land drop counts a land the crack won't find.
- **Status:** fixed: `castableAfterPlay` looks past a free fetch's crack (`fetchCrack`, `settledAfter`, on
  `ControllerView.viewAfter`, a new whole view of the throwaway copy): the activation, every player
  passing so it resolves, and its search answered through `answerAwaited`, the bot's own answer.
  The scenario gates, beside "plays a Forest for Birds of Paradise, not Evolving Wilds" (a fetch
  whose land enters tapped still counts as nothing)). Settling the stack fixed an older miscount on the way: a land with
  an enters trigger (a scry land, a gain land, Bojuka Bog) read as casting nothing while the trigger
  waited, so an untapped basic always beat it; now a tie plays the tapped land, as `bestLand` intends
  (bot:diff: 16 of 14,295 v2 decisions and 61 of 82,489 v1, all land drops of that kind).

## 2026-10-07 — a second destroy trigger aimed at what the first was already destroying

- **Seen:** with two Summon: Bahamuts, one's "destroy up to one target nonland permanent" chapter
  trigger was on the stack, and the other's was aimed at the same permanent.
- **Right:** the permanent the first trigger destroys is gone either way; the second goes at the
  next-best target.
- **Scenario:** "aims a second Summon: Bahamut trigger away from the first one's target"
  (training) — two Bahamuts enter, Serra Angel and Grizzly Bears across: both triggers take the
  Angel. The bot there gets one simulation, standing in for the live clock.
- **Why:** both bots aim a trigger with v1's `chooseTargets` (`controller.ts`: `aimedTargets`,
  `rankTargets`), which ranks the legal targets by value and never reads the stack, so the Angel
  is still the best target. v2 searches the choice with v1's pick scored first, and with its
  full budget it finds the Bears on this small board. Live, rooms give the bot a clock
  (`timeBudgetMs`, `Room.addBot`), and on a big board it runs out early, so v1's pick stands.
- **Fix (outline):** in `chooseTargets` (and the cast path through `aimedTargets`), drop from a
  harmful slot any permanent already doomed by our own destroy/exile effect on the stack (a
  stack object we control whose effect is destroy or exile and whose target is that permanent),
  unless no other worthwhile target is left. Might break: a permanent with indestructible or a
  regeneration shield, where a second destroy doesn't help either, and a target the first
  effect might lose (a hexproof grant in response) — rare, and still better aimed elsewhere.
- **Status:** fixed: v1's `aimedTargets` (which v2 scores first, and falls back on when its clock
  runs out) passes over, in a harmful slot, a permanent our own destroy or exile on the stack is
  already taking (`doomedByOurStack`: the stack object's card effect, a `destroy`/`exile` of a slot
  at its top level or in a `sequence`) while something else on the opponents' side is left. The
  scenario gates, still at one simulation.

## 2026-10-07 — Miirym cast instead of Urza's Incubator, which would have paid for both

- **Seen:** the bot cast Miirym, Sentinel Wyrm with Urza's Incubator also in hand. Incubator
  first, naming Dragon, would have made Miirym cost {2} less, and both fit in the turn's mana.
- **Right:** Incubator (3) naming Dragon, then Miirym for {1}{G}{U}{R} (4): two spells for
  seven mana instead of one.
- **Scenario:** "casts Urza's Incubator first so Miirym fits in the same turn" (training) — seven
  lands, both in hand: casts Miirym.
- **Why:** no bot knows a cost reducer makes the next spell cheaper. v1 casts the castable spell
  with the highest mana value (`controller.ts`'s `act`, the `spells.reduce` on `manaValueOf`), so
  Miirym (6) beats Incubator (3); v1 gets this scenario wrong too. v2's search scores each cast
  with rollouts that pass our own seat (the `"acting"` rollout is only for cast payoffs,
  `castPayoff`), so Incubator first reads as a three-mana artifact that does nothing this turn,
  and Miirym's later cast is never seen.
- **Fix (outline):** a sequencing rule beside "payoff first" (`payoffFirst`, `eval-bot.ts`): when
  a castable cost reducer (`costModification.reduceGeneric`, Incubator's chosen type included)
  lets the mana left after it still cast a spell in hand it reduces — one that the mana couldn't
  cast with the reducer's cost spent unreduced — cast the reducer first. Then the "choose a creature
  type" answer must name the type that spell has (check `answerAwaited`'s `choose-creature-type`
  picks Dragon here). Might break: a reducer cast first when the bigger spell alone was the
  better play (a wipe, a must-answer threat); keep it to turns where both fit.
- **Status:** fixed, in two parts. `reducerFirst` (`controller.ts`, both bots, beside
  `payoffFirst`): a castable reducer goes first when, resolved with its creature type named as the
  bot would (`chooseCreatureType`: Dragon), a spell castable now still is and that spell first
  would leave the reducer uncastable. And the auto-payer had paid Incubator's {3} with all three
  Forests, so even then Miirym had no green: generic mana now weighs each colour against the
  sources the payment leaves, and a reducer being paid for counts the cards it reduces at their
  reduced cost (`mana-keep-colors.test.ts`). The scenario gates; played out, the bot casts
  Incubator, names Dragon and casts Miirym.

## 2026-10-07 — fetch lands cracked before a landfall payoff was cast

- **Seen:** Kresh cracked five fetch lands (Rocky Tar Pit, Terramorphic Expanse, Escape Tunnel,
  Evolving Wilds, Fabled Passage), then cast Omnath, Locus of Rage and played Cinder Glade — one
  landfall trigger where Omnath first would have made six.
- **Right:** cast the landfall payoff first, then crack the fetches: every land that enters after
  it is another trigger.
- **Scenario:** "casts Omnath, Locus of Rage before cracking its fetch lands" (training) — six
  basics, Evolving Wilds, Fabled Passage and Terramorphic Expanse out, Omnath in hand: cracks a
  fetch.
- **Why:** not the search — a fixed rule ahead of it. Both bots crack a free fetch
  (`isFreeFetch`: a land that sacrifices itself for a land and costs no mana) the moment they
  can, before any spell: v2 in `eval-bot.ts`'s priority choice ("fetch"), v1 in `controller.ts`'s
  `act`. The rule that puts a landfall permanent first ("landfall first", `isLandfallPermanent`)
  only runs when a land drop is available, so it never weighs a fetch.
- **Fix (outline):** in both places, let a castable landfall permanent go before a free fetch, as
  it already goes before a land drop. Care where the fetch's land pays for the payoff (Fabled
  Passage's land enters untapped at four lands): crack only what the cast needs, or compare
  `castableAfter` with and without the fetch. Might break: the gate's fetch scenarios and a turn
  where the payoff costs more than the mana on hand.
- **Status:** fixed as outlined, both bots: a castable landfall permanent goes before a free fetch
  as it did before a land drop. The scenario's board was given a seventh basic: Omnath costs seven,
  so with six it wasn't castable before a fetch at all, and the right line there — crack only
  Fabled Passage, whose land enters untapped, cast Omnath, then the rest — is still not one either
  bot plays. The scenario gates.

## 2026-10-07 — Dragon Tempest cast after a Dragon instead of before it

- **Seen:** with Dragon Tempest and a Dragon in hand and mana for both, the bot cast the Dragon
  first and Tempest after, so neither of Tempest's triggers saw the Dragon enter.
- **Right:** Tempest first, then the Dragon: it enters with haste and deals X damage (X = Dragons
  you control) to any target.
- **Scenario:** "casts Dragon Tempest before the Dragon it pays off" (training) — eight Mountains,
  Furnace Whelp out, Tempest and Shivan Dragon in hand, Grizzly Bears across: casts Shivan Dragon.
- **Why:** the priority search (`bot/eval-bot.ts`) scores each cast with rollouts that pass our
  own seat for the rest of the turn, so Tempest first reads as an inert two-mana enchantment and
  the Dragon first as a 5/5 flier. The `"acting"` rollout, which plays out the rest of our turn,
  is switched on by `castPayoff` only for "whenever you cast" payoffs (Shiko and Narset, prowess),
  not for "whenever a creature you control enters" ones.
- **Fix (outline):** widen `castPayoff` to an enters payoff (an `enters-battlefield` trigger with
  `who: "you-control"`) on the battlefield or in hand while a creature it would see is also in
  hand, so the search scores Tempest with the Dragon cast after it. Then check v1's own cast order
  (`controller.ts`) under that rollout puts the payoff first — if v1 casts the Dragon first in
  the rollout, the line still isn't seen — and it does: v1 casts the highest mana value first
  and gets this scenario wrong too (checked 2026-10-07), so it needs a "payoff first" rule for
  enters payoffs as well. Might break: turns where the wider `"acting"` rollout
  costs time (Soul Warden-style lifegain triggers are common enters payoffs); check with the gate
  and `bot:diff`.
- **Status:** fixed through `payoffFirst` rather than the `"acting"` rollout: an enters payoff
  (`entersPayoffFilters`) goes first when a creature it would see enter is castable now and still
  castable once the payoff has resolved (every player passing once, asked of `legalActionsAfter`),
  both bots. The scenario gates.

## 2026-10-07 — a Spacecraft stationed past its last threshold

- **Seen:** bots station Spacecraft that already have every station band lit, tapping a creature
  for charge counters that do nothing.
- **Right:** past a Spacecraft's highest station threshold (rule 721.2; Hearthhull's 8+), more
  charge counters add nothing, so stationing only costs the tapped creature — a blocker or an
  attacker lost. Almost never worth it.
- **Scenario:** "does not station a Spacecraft past its last threshold" (training) — Hearthhull,
  the Worldseed at 10 charge counters, Craw Wurm untapped, a Centaur Courser across the table,
  postcombat main: the bot stations with the Wurm.
- **Why:** nothing in the bots knows about station. The evaluation's `counters` term
  (`bot/features.ts`) counts every counter not in `UNSCORED_COUNTERS` — charge counters included,
  uncapped — at weight 0.5 each (`bot/evaluate.ts`), so tapping a 6-power Wurm reads as +3.0
  against about 0.5 for keeping it untapped (`untappedCreatures`).
- **Fix (outline):** in `features.ts`, cap a station card's charge counters at its highest
  `stationBand` threshold (the largest `gte n` among its statics' charge-counter conditions), so
  counters past it score nothing and stationing reads as just the tapped creature. Might break: a
  Spacecraft whose own ability spends or counts charge counters (check the pool's Spacecraft for
  one before capping), and the gate's station scenarios.
- **Status:** fixed as outlined (`chargeCap`; no Spacecraft in the pool spends charge counters, and
  The Eternity Elevator, which counts them for mana, stays uncapped). A partner gate scenario
  checks the bot still stations Hearthhull from 4 counters to 10. This was most of World Shaper's
  trouble (the user: Hearthhull stationed with practically every creature); the wider point — any
  tapped creature is a blocker gone — landed the same day: a cast or activation that leaves the
  crackback lethal ranks below every safe move (`tapsIntoCrackback`; gate: "does not station its
  only blocker into a lethal crackback").

## 2026-10-07 — a Mountain played over Stomping Ground with Birds of Paradise in hand

- **Seen:** on turn one, alice played a Mountain with Stomping Ground and Birds of Paradise in
  hand (and no Forest), so nothing was cast.
- **Right:** Stomping Ground, paying 2 life so it enters untapped, then Birds of Paradise: three
  mana on turn two.
- **Scenario:** "plays Stomping Ground over a Mountain to cast Birds of Paradise" (training) —
  plays the Mountain.
- **Why:** two halves. v1's `bestLand` ranks lands by `castableAfter`, the spells it could cast
  after playing each; for Stomping Ground the engine's next question is "pay 2 life?"
  (`pay-life-for-untapped`), so the look-ahead stops there and counts 0, a tie with the Mountain
  (Valgavoth's Lair's colour choice is answered and looked past; this isn't). And v2's land search
  (`eval-bot.ts`, `lands.length > 1`) scores each land with rollouts that pass our own seat for the
  rest of the turn, so Birds is never cast in them: the shock reads as 2 life for nothing and the
  Mountain wins outright, not just on a tie.
- **Fix (outline):** in `castableAfter`, answer a shock land's pay-or-not as we would (pay when it
  casts something) and look past it, as for the Lair, so v1 counts Birds. Then in v2's land
  search, don't let a land that casts fewer spells this turn (`castableAfter`) beat one that casts
  more, since its rollouts can't see the cast — or score each land together with v1's first cast
  after it. Might break: the land search's other uses of its score (a fetch, a land that draws);
  check with the gate's land scenarios and `bot:diff`.
- **Status:** fixed (2026-10-07, the user asked): `castableAfter` looks past the shock as paid,
  and v2's land search keeps to the lands that cast the most this turn; the scenario gates.

## 2026-10-06 — Felothar sacrificed Seedborn Muse over Tree of Redemption

- **Seen:** a bot activated Felothar the Steadfast ("{3}, {T}, Sacrifice another creature: draw
  cards equal to its toughness, then discard cards equal to its power") sacrificing Seedborn Muse
  (draw 4, discard 2) with Tree of Redemption (draw 13, discard 0) on the board.
- **Right:** sacrifice the Tree.
- **Scenario:** "sacrifices Tree of Redemption to Felothar, not Seedborn Muse" (training) — the
  activation it chooses doesn't name the Tree (no sacrifice named, left to the engine's default).
- **Why:** an ability's sacrifice cost is never searched. v2's candidate fixes it to the last
  eligible permanent (`bot/candidates.ts`'s `abilityCandidates`, "settled deterministically"),
  and v1's activation picks the cheapest (`cheapestPermanents`); neither reads what the effect
  does with the sacrificed creature (`toughnessOf`/`powerOf: "sacrificed"`).
- **Fix (outline):** when an ability's effect reads the sacrificed creature, offer one candidate
  per sacrifice choice (capped, cheapest and highest-reading first) and let the search score
  them; the same for a spell's additional sacrifice cost (`castExtras`). Might cost a few more
  simulations on boards with many creatures.
- **Status:** fixed as outlined (the user asked, 2026-10-08): v2's `withSacrificeChoices` offers
  each candidate once per sacrifice (up to five, identical tokens as one, largest power plus
  toughness first) when the offer's effect reads `"sacrificed"` — 44 pool cards' effects do — for
  spells as for abilities. The scenario moved to the end of the turn before alice's, where the
  ability belongs: in her precombat main the search rightly passes (tapping Felothar costs his
  attack, and her cleanup discards thirteen to seven). It gates, and reads wrong with the
  expansion switched off.

## 2026-10-06 — Abrade cast over its own Archmage Emeritus

- **Seen:** Narset cast Archmage Emeritus, then Abrade at Weathered Sentinels with the Archmage
  still on the stack; Abrade resolved first, and magecraft's draw was missed.
- **Right:** let the Archmage resolve, then cast Abrade, drawing a card off it.
- **Scenario:** "lets Archmage Emeritus resolve before casting Abrade" (training) — casts Abrade in
  response.
- **Why:** v2 casts a cast payoff first (`payoffFirst`), but that early return doesn't record
  `actedOn`, which is what makes the next window a held pass while our own spell resolves
  (`holdPass`). So the window with the Archmage on the stack is searched afresh, and Abrade now
  scores as well as Abrade later — under the "acting" rollout a payoff turns on, the tie goes to
  acting.
- **Fix:** record `actedOn` on the payoff-first return (and the other early returns that cast our
  own spell — the landfall-first one), so the next window passes while it resolves. Might break:
  nothing that was deliberate — a response to our own spell was never a searched choice; an
  opponent's response still gets searched.
- **Status:** fixed with the Guttersnipe entry (2026-10-08): the shortcuts record `actedOn`. The
  scenario gates.

## 2026-10-05 — an untapped land over Glacial Fortress on turn one

- **Seen:** on turn one a bot played its untapped land over a Glacial Fortress (tapped, with no
  Plains or Island out). The untapped land made Sticky Fingers castable, but it had nothing of
  its own to enchant.
- **Right:** the Fortress, tapped, now. The user: "A land letting you cast a spell is of no value
  if you wouldn't cast the spell if you had the mana."
- **Scenario:** "plays Glacial Fortress tapped on turn one over a Mountain for nothing it would
  cast" (gate).
- **Why:** `bestLand`'s `castableAfter` counted every spell the engine called castable, Sticky
  Fingers at an opponent's creature included; and its tapped-land tie-break skipped check lands,
  whose tapped-ness is a condition.
- **Fix:** `castableAfter` (and the shock land's `payLifeForUntapped`) count only what v1 would
  cast (`wouldCast`, the filter `act` casts from), and `entersTapped` reads a check land's
  condition on the board as it is (`staticConditionMet`).
- **Status:** fixed.

## 2026-10-05 — a land sacrificed untapped (the user's rule)

- **Rule:** "spells that sacrifice lands should always prioritize tapped lands."
- **Scenario:** "sacrifices a tapped land to Harrow" (gate).
- **Why:** `cheapestPermanents` ranked by value alone, so a tapped and an untapped Forest tied
  to the first listed. And the engine paid a cast's mana before its sacrifice (rule 601.2g–h)
  without knowing which land was going, so it could tap the others and sacrifice one untapped.
- **Fix:** among the lands it may give up, a tapped one goes first (the lands keep the places
  the value ranking gave them, so a mixed choice still gives up the cheapest); and a single
  sacrificed permanent pays the spell's mana first where it can (`ManaSourceArrangement.first`,
  `additional-costs.test.ts`).
- **Status:** fixed.

## 2026-10-05 — Explore held on turn two

- **Seen:** on its second turn, with a Forest and a Mountain out and two Swamps in hand, a bot
  passed with Explore in hand — nothing else in hand cost two.
- **Right:** cast Explore, play the second Swamp: three lands on turn two and a card back.
- **Scenario:** "casts Explore on turn two with a land to play off it" (gate since the fix).
- **Why:** Explore isn't a cantrip to `controller.ts`'s `isCardFlow` (an `additional-land-drop`
  is neither a draw nor a filter), so `isCantripDue` never plays it and v2's search decides. Its
  rollouts pass our seat for the rest of the turn, so the extra land is never played: two mana
  for a card back scores no better than passing, and passing is scored first.
- **Fix:** an extra land drop with a land in hand to use it is due like a cantrip — in
  `isCantripDue` (or beside it), count `additional-land-drop` as worth a card when the hand
  holds a land and this turn's drop is used or about to be, so the search's pass turns into the
  cast. Explore, Growth Spiral, Urban Evolution and the like. Might break: casting one with no
  land to follow (the hand check guards it), or ahead of a better two-drop the search did want
  (it only applies when the search would pass).
- **Status:** fixed, more simply: `isCardFlow` reads an `additional-land-drop` as neutral, so
  Explore and Urban Evolution are cantrips (`isCantripDue`), cast in our main phase when the
  search would pass, and the land drop that follows is the bot's usual land-first play.

## 2026-10-05 — thirteen tokens at a five-loyalty planeswalker

- **Seen:** a bot attacked a planeswalker with 5 loyalty with all thirteen of its creature
  tokens.
- **Right:** five kill it; the other eight stay home as blockers.
- **Scenario:** "sends only enough of a token stack to kill a planeswalker" (training) — sends
  all 13 at Garruk, keeps none home.
- **Why:** neither bot can send part of a token stack. v2's attack climb (`bot/eval-bot.ts`,
  `declareAttackers`) adds one `{ attacker, defender }` at a time with no `count`, so a stack
  goes whole or not at all; v1's swing (`controller.ts`) declares whole stacks too. Only the
  kill planner (`alphaStrike`) splits stacks, and it plans kills on players, not planeswalkers.
  So the choice was 13 or 0, and 13 scored better.
- **Fix:** give the climb a move that sends `count` tokens of a stack — the fewest that kill a
  planeswalker or player through its blockers, and one more token at a time after that — as the
  blockers' climb already moves one token of a stack per step. Might break: more simulations per
  attack on wide token boards (the climb's budget is per simulation), and the crackback check
  then decides how many stay home, so it inherits that check's gaps (BACKLOG).
- **Status:** fixed. v2's attack climb sends a stack in parts — one token more, the fewest that
  finish a planeswalker, or all it has left, smallest first so a tie keeps the leaner attack.
  That alone sent the other eight at the walker's controller, since `untappedCreatures` counted
  only blockers that hold an attacker off alone. The user: "in most cases you want to keep at
  least a few blockers back if there are creatures on opponents' boards". `deterringBlockers`
  now counts small blockers in gangs that kill an attacker together, as many as the opponent
  with the most attackers would take; the scenario (gate) sends 5 at Garruk, 2 at bob and keeps
  6 home against two opponents' three 2/2s each.

## 2026-10-05 — Valgavoth's Lair named white in a Temur deck

- **Seen:** a Temur bot played Valgavoth's Lair and chose white.
- **Right:** a colour of its own deck — red here, for the dragons' {R}{R}{R}.
- **Scenario:** "names a colour its deck plays for Valgavoth's Lair" (training) — chooses W.
- **Why:** an "as this enters, choose a colour" (`chooseOnEnter`) is asked as a
  `choose-creature-type` over the five colours. Its `suggested` list is only computed for the
  creature-type catalog (`decisions/choose-creature-type.ts`), so it's empty, and every
  controller answers `suggested[0] ?? options[0]` — white, every time. Neither bot overrides
  it. The Thriving lands (`helpers.ts`, `chooseOnEnter: others`) take the first option too.
- **Fix:** when every option is a colour, v1's `chooseCreatureType` names the colour the hand's
  pips want most that the lands on the battlefield don't already make (`bestLand`'s tallies),
  within the commander's colour identity, falling back to the identity's first colour. v2
  inherits it. Low risk: today's answer is never deliberate.
- **Status:** fixed (`colorToName` in `land-colors.ts`, v1's `chooseCreatureType` override);
  the scenario gates.

## 2026-10-05 — untapped Forest played over a tapped Valgavoth's Lair

- **Seen:** a Temur dragons bot on four lands played a Forest while holding Valgavoth's Lair,
  with nothing in hand a fifth untapped mana could cast.
- **Right:** play the Lair now, while entering tapped costs nothing; the Forest comes down untapped
  on a turn it's needed (and Rorix Bladewing's {R}{R}{R} isn't a turn later).
- **Scenario:** "plays its tapped land when the untapped one casts nothing more" (training) —
  chooses the Forest.
- **Why:** v1's `bestLand` ranks by `castableAfter` (equal: Heroic Intervention either way),
  then by pips no land on board pays — the Lair's `"chosen"` mana counts for no colour in
  `colorsProducedBy`, so the Forest's green wins. Nothing weighs "enters tapped". v2's land search
  tries v1's pick first, and its rollouts pass our seat, so every land ties and v1's stands.
- **Fix:** in `bestLand`, among lands with the same `castableAfter`, prefer one that enters
  tapped (ahead of the pip score), and count a chosen-colour land as making any colour the
  identity allows. Might break: a tapped land played when the untapped one would have held up
  an instant — `castableAfter` already counts instants castable now, so that tie shouldn't
  arise; worth a `bot:diff`.
- **Found on the way:** `castableAfter` stopped at the Lair's colour choice and saw nothing
  castable behind it, so the Lair lost even to a land that cast no more. It now answers the
  choice (`legalActionsAfter` takes a sequence) and looks past it.
- **Status:** fixed (`bestLand`'s `entersTapped` tie-break); the scenario gates.

## 2026-10-04 — Jaddi Offshoot after the land drop

- **Seen:** on turn 2 a bot played a Swamp, then cast Jaddi Offshoot.
- **Right:** cast the Offshoot off its Forest first; the Swamp's landfall then gains a life.
- **Scenario:** "casts Jaddi Offshoot before its land drop" (gate since the fix).
- **Why:** both bots play a land before anything else whenever one can be played. v2 returns
  the only land outright (`bot/eval-bot.ts`, `lands.length === 1`) and scores several only
  against each other; v1's `act` plays `bestLand` first. Nothing ever weighs "a spell, then the
  land".
- **Fix:** a permanent with its own landfall trigger that's castable now goes before the land
  drop, in both bots (`controller.ts`'s `isLandfallPermanent`; v2 only from its own candidates,
  so its holds still apply). Mana is the same in either order, so it costs nothing.
- **Status:** fixed (`bot:diff` over 12 four-player games: 4 of 28,314 decisions, each a landfall
  permanent before the land — Avenger of Zendikar, Floral Evoker, Jaddi Offshoot).

## 2026-10-04 — Stomping Ground played tapped over a Forest for Birds of Paradise

- **Seen:** with Forest, Mountain, Stomping Ground and Birds of Paradise in hand, a bot played
  Stomping Ground, let it enter tapped, and couldn't cast the Birds.
- **Right:** play the Forest and cast the Birds (no life spent).
- **Scenario:** "plays a Forest for Birds of Paradise, not a tapped Stomping Ground" — **passes on
  the current build**, so it went straight to the gate. The land ranking learned "the land that
  lets you cast a spell this turn" on 2026-10-01 (95fe54c5); the site was most likely running an
  older build.
- **Found on the way:** neither bot paid a shock land's 2 life
  (`AutomaticController.payLifeForUntapped` returns false and nothing overrides it), and v1's
  `castableAfter` can't see a spell behind a shock land, since playing one stops at the pay
  decision. Scenario "pays 2 life for an untapped Stomping Ground to cast Birds of Paradise".
  **Fixed:** v1's `payLifeForUntapped` pays when the untapped land casts more spells this turn
  than the tapped one (`legalActionsAfter` both ways) and life stays above 15 after paying; v2
  takes v1's answer, since its rollouts pass our seat for the rest of the turn and never see the
  spell. "Lets Stomping Ground enter tapped with nothing to cast" holds the other side.
- **Status:** the report: not reproduced (fixed before it was seen). The shock-land payment: fixed.
