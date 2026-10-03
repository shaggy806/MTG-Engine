# Deck win rates and autopsies

Status: **first pass done** (2026-10-02, a second set of fixes 2026-10-03): the run, four
autopsies, the general bot fixes they found, and Sultai Arisen off the bench. What's left is
listed at the end and in `BACKLOG.md`.

## Why

Every bot benchmark seats the bots on `BENCH_DECKS`. A deck that loses every game no matter who
pilots it measures nothing about a bot; a deck the bots can't pilot measures only that. So
before trusting a bench, ask how each deck does when identical bots play every seat, and look
at the decks at the bottom to see whether the deck or the bot is losing.

## The run

`npm run bot:decks -w engine` (`engine/scripts/deck-winrates.mjs`): the same bot in every seat,
four distinct decks a game from all fourteen `SAMPLE_DECKS`, each round dealing every deck once
into tables, each table played once per seat rotation. `bot:autopsy` replays one of its games
turn by turn.

v2, 188 games (stopped early once the bottom was clear), and v1, 840 games, on the same tables:

| deck | v2 | v1 |
|---|---|---|
| Temur Roar* | 59% | 47% |
| Tramplesaurus Rex | 37% | 61% |
| Chaos Incarnate | 36% | 22.5% |
| Abzan Armor* | 33% | 25% |
| Reign of Dragons | 33% | 24% |
| Draconic Destruction | 28% | 20% |
| Token Triumph | 28% | 18% |
| First Flight | 21% | 20% |
| Family Matters | 17% | 11% |
| World Shaper | 12.5% | 8% |
| Sultai Arisen* | 11.5% | 10% |
| Mardu Surge* | 11% | 25% |
| Jeskai Striker* | 9% | 23% |
| Grave Danger | 7.5% | 24% |

(\* bench decks at the time.)

**The v1 column is not "how a weaker bot plays the deck".** v1's attack check ignored evasion,
so its Dragon decks kept their flyers home (Temur Roar dealt 6.1 damage a turn under v1, 13.7
under v2), and v1 defenders almost never blocked. Mixed tables settled it: Grave Danger on v2
against three v1 seats won 56%, Mardu Surge 43%, an average deck in that seat 51%. So the
ground decks' drop from v1 to v2 is mostly their opponents getting better, not their own seat
getting worse.

## What the autopsies found

Four read-only autopsies (Grave Danger, Jeskai Striker, Sultai Arisen, Mardu Surge), each
replaying its deck's losses and probing the scores of the bot's candidates.

- **Sultai Arisen** — mostly the deck: 25 stand-ins hollowed out the graveyard engine (Teval's
  Judgment, Essence Anchor, Kotis, Living Death all gone; Tasigur became a vanilla 3/4). Weak
  under both bots. Off the bench.
- **World Shaper** — weak under both bots; a land-recursion plan the bots can't pilot. Never on
  the bench.
- **Grave Danger** — about two-thirds matchup: a ground Zombie deck against four Dragon decks
  that attack properly. Its v2 seat plays it as well as any.
- **Jeskai Striker** — about 60% bot: the deck runs on card selection, flash and chained spells,
  which are v2's blind spots.
- **Mardu Surge** — mostly its opponents; its own seat wastes tokens chumping and drew more
  attacks.

### Fixed (2026-10-02), each with a gate scenario that fails without it

- Card selection that replaces itself counts as a cantrip (`isCardFlow` by net cards: Expressive
  Iteration, Compulsive Research aimed at ourselves, Brainstorm; not Faithless Looting).
- A suspend is played when the search would pass (`isSuspendDue`).
- A counter-creature (Transcendent Dragon) is cast for its body at the end of the turn before
  ours rather than held forever.
- "Any number of targets" groups are offered as the best one, two, three… (Curse of the Swine
  for X of 3+), not none / each alone / all.
- A wipe held for after combat stays a candidate; if it scores best, the bot passes to combat
  with its mana intact (Blood Money, Damnation).
- No mana spent in our main phase while only our own triggers are on the stack, nor on cycling
  in our upkeep (`holdsManaForMain`).
- A fetch takes the colour the hand's spells want and no land in hand makes (`colorWants`).
- v1 blocks — and so v2's prediction of every defender — take worthwhile trades and gang blocks,
  skip deathtouch attackers, and block with one token of a stack, not the stack. v1's attack
  check sees evasion and gang blocks (`wouldDieAttacking`, `blockWorth`, `gangLoss`).
- Engine: two count-scaled bonuses that count each other (two Zinnias) recursed forever in
  `computeCharacteristics` (`countInProgress`).

### Fixed (2026-10-03)

A second set, benched level against the first (26.4% [22.3, 30.9] over 400 four-player games,
even 25%), each pinned by a test or a gate scenario:

- `answers` counts a counterspell only while the untapped mana could cast it, cheapest first,
  so tapping out costs the reserve.
- A creature that's gone at the next end step (mobilize's Warriors, blitz, unearth) isn't
  counted as a body: its attack shows in life totals, and past this turn it's worth nothing.
- `alphaStrike` plans with every token of a stack, and can split a stack between defenders
  ("kills a player with a stack of tokens").
- Engine: a player who lost during their own turn kept receiving priority, recasting a spell
  that could go nowhere forever (a v1 run's seed 617); the turn now goes on without an active
  player (rule 800.4j) — no draw, attackers or cleanup discard for them.

Then `tokenEngines` (`shipped-2026-10-03`): the creature tokens a round a permanent keeps making
— Hero of Bladehold's two Soldiers each attack, Young Pyromancer's Elemental, Elspeth's +1 — rated
like `drawEngines` and priced at 2 a token. Mardu Surge runs fourteen such engines, Token Triumph
eleven; at 0 Hero of Bladehold was a 3/4, and removal took a vanilla 4/4 over it ("removal takes
the token engine"). Benched level: 24.5% [20.5, 28.9] over 400 four-player games.

Then the chump blocks at high life: `threat` took its life scale from the end of the simulated
combat, so each point taken also grew the threat of what dealt it (~20×power/life² on top of
`life`), and commander damage counted 2 a point from the first. At 35 life v2 threw a Soldier
token under a Craw Wurm and under a commander Centaur Courser. Now this turn's damage is
credited back to the scale as far as the life above 20 (`lifeLostThisTurn`) — at 35 a combat
doesn't grow the threat, at 6 going to 1 every creature is still lethal (crediting it all back
stopped a chump at 6, `bot:diff` found) — and commander damage counts squared over 21: 21 is
still 21, a first hit of 3 costs 0.4. Gate scenarios "takes a Craw Wurm's hit at 35 rather than
chump" and "takes a commander's first small hit at 35 rather than chump"; a commander Craw Wurm's
first 6 is still chumped, a defensible trade.

### Left

- **Chained spells are invisible** to the search: prowess, Shiko's Flurry, storm count — the
  first spell of a turn is never worth its payoff. A feature for spells cast this turn, or the
  `"acting"` rollout for decks whose commander has a cast trigger.
- **Token payoffs beyond engines**: what a token engine keeps making is priced now (above), but
  sacrifice outlets and "leaves the battlefield" payoffs aren't. Probed 2026-10-03: v2 casts
  Deadly Dispute sacrificing a Treasure (+1.85 over passing) or a mobilize token due to die
  (+2.2), but not a 1/1 Soldier token (−1.3) — two cards and a Treasure score below a 1/1 token,
  because every creature counts `creatures` 2.5 whatever its size (about 4.3 for a 1/1 against
  `hand`'s 2 a card). The same root as BACKLOG's Skullclamp item. A smaller flat value for small
  creatures would fix both, but makes tokens cheaper to chump with again — measure it against
  "takes a Craw Wurm's hit at 35 rather than chump" before shipping.
- **Neither bot goes wide** into a board of blockers with many small creatures.
- **Premium removal fired early** at weak targets. A flat reserve — cheap instant removal
  counted in `answers` at 3, like a counterspell — was tried 2026-10-03 and dropped: it held
  Swords to Plowshares from a Llanowar Elves but still fired it at a Wall of Reverence, which
  the evaluation prices at 6.0 to kill against a Grizzly Bears' 3.7 (mostly `toughness`), and
  it held Murder from a trailing player's Craw Wurm, the table's only creature (the gate's
  "kills a trailing player's threat"). The fix is in what a creature is worth to *kill* — its
  threat to us rather than its board value — or a reserve scaled by the threats still to come.
- **Stand-ins that gut a plan**: Sultai's Barrow Witches (vanilla without Knights) and Black
  Market Connections; Mardu's anthem and token-doubling cards.
