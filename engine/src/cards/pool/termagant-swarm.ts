import { defineCard } from "../define.js";
import { ravenous } from "../helpers.js";

// EDHREC rank 6731.
//
// Ravenous is the helper (rule 702.156a — Jacked Rabbit): X counters as it
// enters, read off the X it was cast with, and the draw an intervening-if on
// that X (the rulings). Death Frenzy is an ability word: the count is its
// power as it last existed on the battlefield (the ruling; rule 608.2h —
// Elenda, the Dusk Rose's shape).

const RAVENOUS = ravenous();
const DEATH_TEXT =
  "Death Frenzy — When this creature dies, create a number of 1/1 green Tyranid creature tokens equal to this creature's power.";

export default defineCard({
  name: "Termagant Swarm",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 0,
  toughness: 0,
  text:
    "Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\n" +
    DEATH_TEXT,
  static: [RAVENOUS.static],
  triggered: [
    RAVENOUS.triggered,
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Tyranid Token", count: { powerOf: "source" } },
      resolve: null,
      text: DEATH_TEXT,
    },
  ],
});
