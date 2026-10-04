import { defineCard } from "../define.js";
import type { CardFilter } from "../../filter.js";
import { ravenous } from "../helpers.js";

// EDHREC rank 5823.
//
// Ravenous is the `ravenous()` helper (Jacked Rabbit): X counters as it
// enters, and the draw is an intervening-if on the X it was cast with.
//
// "Creatures you control with counters on them" — any kind of counter — is
// the set as the ability resolves (Inspiring Call's one-shot grant): a counter
// put on later doesn't earn it.

const RAVENOUS = ravenous();
const SHIELDWALL_TEXT =
  "Shieldwall — Sacrifice this creature: Creatures you control with counters on them gain hexproof and indestructible until end of turn.";

const withCounters: CardFilter = {
  type: "creature",
  controlledBy: "you",
  counters: { compare: { op: "gte", n: 1 } },
};

export default defineCard({
  name: "Tyrant Guard",
  manaCost: "{X}{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 3,
  toughness: 3,
  text:
    "Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\n" +
    SHIELDWALL_TEXT,
  static: [RAVENOUS.static],
  triggered: [RAVENOUS.triggered],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: withCounters, keyword: "hexproof", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: withCounters, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: SHIELDWALL_TEXT,
    },
  ],
});
