# Design records

Each plan says *why* its piece is shaped the way it is. A `Status:` line at the top of each says
where it stands, and none is living documentation: the code and `docs/architecture/` are.

The index, as of the last update:

Shipped: `basic-bots` (v1 bot), `card-library-page`, `deck-builder`, `scenario-builder` (a
developer's tool: build a board from scratch, then play it — the scenario is data, and every edit
rebuilds the game in a new frozen room under the same code), `card-replacer` (reworked
onto Scryfall Tagger oracle tags), `precon-decks` (the five Tarkir: Dragonstorm starter decks and their stand-ins), `resolve-all-stack` (the one-shot "resolve the whole stack" button),
`auto-pass-interruptions` (the shared "something real happened" scan that
stops both it and auto-pass), `deck-biases` (a commander's deck reading some effects the other
way round — Teval mills itself — read off the game state by every bot).
`engine-gaps` records the engine work that unblocked most of the precons, paused with the rest
substituted. `smarter-bots` (v2, one-ply search, what live rooms seat) is the search that stays: `bot-effect-knowledge` (**in progress**) is the plan of record for the bots — v2 on an effect-aware base (which side of the table each target belongs on, a v1 that targets by it, v2's candidates ordered by it, the evaluation terms that follow, weights tuned to hand-built right answers), with v3 retired; read it before changing how a bot picks actions. `bot-v3-search` (rollout search over sampled worlds, **retired** — seated for a day, then benched, found broken and retired) records why v3 was tried and why it lost: a plan walker that cast one spell a turn, and parity at best once fixed. `token-stack-choices` (**in progress**) designs picking some members of a token stack, the last stack gap after the counting and whole-stack fixes: sacrifice N, tap costs, convoke and splitting a stack across attackers or blockers are built; choosing which of a stack proliferate touches, and naming one stack more than once for distinct targets, are not. Its "Folding back" section records how tokens split off a stack go back into one once they're identical again, as soon as nothing is waiting. `commander-replacement` records how rule 903.9 is asked (never skipped: queued when it can't be asked yet, re-asked when overwritten), the older bugs found alongside it, all since fixed, and the move from the pre-2020 replacement to the current rule, where a commander dies first and a state-based action then offers the command zone. `damage-assignment-order` (**implemented**) records that Foundations removed damage assignment order, so a blocked creature's damage is divided freely among its blockers (trample still needs lethal on each first), and how the engine dropped its `order-blockers` decision and lethal-in-order validator for it. `legibility-of-play` (**shipped**) orders BACKLOG's animation and pacing list: a frame gets a before and an after half, tile effects are CSS animations on mount, and one viewer-owned timing scale. Server-side deck save/share
is still unscoped.

`upgraded-decks` (**shipped, first pass**) records where the upgraded precons' swaps came from (EDHREC's precon pages over Moxfield's upgrade lists), the bench that measured them, and what's open.

`deck-autopsies` (**first pass done**) records the deck-against-deck win-rate run, why its v1 column is confounded, the four deck autopsies, and the bot fixes they found and left.

`decision-registry` records how the decision kinds (19 then, 20 with `cast-now`) became one module each under
`engine/src/decisions/`, and why `game.ts` stays binary to git.

`lightsail-migration` (**planned**) moves the live site off the home box onto AWS Lightsail and
from `mtg.tobyens.com` to deckblitz.net: Cloudflare and the tunnel stay, why the instance needs
2 GB, what burstable CPU does to the bots' time budget, players' saved decks not following the
domain, the cutover order, and how deploying changes.
