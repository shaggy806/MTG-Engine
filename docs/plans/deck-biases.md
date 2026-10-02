# Deck biases: a deck's own reading of its cards

Status: **shipped** (2026-10-02), with one entry (Teval, the Balanced Scale). The vocabulary grows
when a live game shows a deck's bot playing against its own plan.

## The problem

The bots' card knowledge is generic, and has to be: `target-polarity.ts` reads which side of
the table each targeted effect belongs on from the effect tree, `effect-worth.ts` prices an
optional clause, and the evaluation (`bot/evaluate.ts`) prices every player's board with one
weight vector. That's right for nearly every deck and backwards for a few. The user's first
example: Teval, the Balanced Scale's deck (Sultai Arisen, one of the five `SAMPLE_DECKS` every
bot seat falls back to) mills itself to return lands and make Zombies, yet Hedron Crab's
"target player mills three cards" went at an opponent, because `mill` harms its target. The
gate even pins that generic answer ("mills an opponent, not itself").

## What was considered

- **A plan per deck, scripted** ("cast Hedron Crab before turn 3, always target yourself").
  A script is easy to write and impossible to keep right: it can't see the board, and v2 already searches
  the board. What v2 lacks is the deck's *values*, not its moves.
- **Per-card overrides** (Hedron Crab targets its controller), the shape of the AI hints in
  Forge's card scripts (`AIPreference`, `AI:RemoveDeck`). Wrong axis: Hedron Crab in a
  Mill-the-table deck wants the opponent. The deck decides, not the card.
- **A different weight vector per deck.** Close, but the evaluation is symmetric — it scores
  "mine minus theirs" with the same weights — so raising `graveyard` for Teval also made every
  opponent's graveyard a thing Teval wants to empty, and the gate's mill scenario shows why a
  shared `graveyard` raise is wrong for everyone else.
- **Learned per-deck evaluation.** Nothing to learn from: the bench resolves ~4 points in 400
  games, and a bias moves one deck's few decisions.

## The design

`engine/src/deck-bias.ts` holds `COMMANDER_BIASES`, keyed by commander name. An entry says:

- **`why`** — what the deck wants, in a line.
- **`polarity`** — effect kinds whose target slots this deck aims the other way (`mill:
  "help"`). Every `target-polarity.ts` query takes it as an optional `PolarityBias`, applied
  inside the rule walk (each rule's touches take the bias's side for that kind), so the
  strongest-effect-decides logic is unchanged: a bias on `mill` doesn't flip a slot whose
  deciding effect is removal. It reaches v1's targeting, the wrong-side screen, v2's target
  ranking (so the right side is among the eight combinations simulated) and `effect-worth.ts`.
- **`ownWeights`** — evaluation weights for the deck's *own* features only. `outcomeOf`
  attaches them; `scoreOutcome` scores `mine` with them laid over the shared vector and every
  opponent with the shared one. So `bot:fit-scenarios`' replays score exactly what the bot did.

### Why keyed by commander, read from the state

A bot doesn't know its deck's name; the `GameState` only knows cards. A commander is public,
fixed from setup, and the card that says what a Commander deck is for. Reading the bias off the
state (`deckBias(state, player)`: the commanders the player *owns*) means nothing is threaded
through options: v1, v2, the v1s that play every seat in v2's rollouts (so an opponent's Teval
is modelled milling itself too), and a person's own Teval deck seated with a bot all get it. A
partner pair merges both entries. The answer is cached per `state.objects` table — once a game
and once per search clone; commanders never change after setup.

A non-Commander game has no commander and so no bias, which is right: the precons are what
bots bring.

### Teval

`polarity: { mill: "help" }`, `ownWeights: { graveyard: 0.25, libraryDanger: 1 }`. The graveyard
is the deck's second hand, so its own graveyard cards are worth five times the shared 0.05
(milling itself three is +0.6, not 0). `libraryDanger` (0 for everyone else) keeps v2 from
milling itself out: below 15 cards each card off the top costs a point. Two gate scenarios pin
it — "Teval mills itself, not an opponent" and "Teval stops milling itself near an empty
library" — and each fails with its half of the entry removed (checked: no entry fails the first;
polarity alone fails the second). The weights alone happen to pass both, since v2 scores every
player target; the polarity is what v1 (v2's fallback and the rollouts' policy) reads.

Known limit: v1 has no library guard, so where v1 decides (a rollout, or v2's fallback at a
time-out) it mills itself whatever is left.

## Adding a bias

When a live game shows a deck's bot playing against its plan, capture the position, add the
entry, and add a gate scenario that fails without it. Prefer the smallest lever: a polarity flip
if the bot aims an effect the wrong way, an own weight if it values its own resources wrong.
Expect the vocabulary to grow; likely next kinds, none built:

- **Cards the deck wants to cast first or hold** (a combo piece, an engine) — a per-card nudge to
  `handManaValue`'s reading, or a candidate-order hint.
- **Attack eagerness** for decks whose commander has an attack trigger (Teval's own mill is on
  attack).
- **Opponents' biases**: our evaluation still scores an opponent's Teval graveyard at the shared
  weight, so milling Teval's player reads as neutral to us when it helps them.
