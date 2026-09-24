import { defineCard } from "../define.js";

// A multiplier, so it commutes with Doubling Season and the like: two of them
// on one creature quadruple, in either order.
export default defineCard({
  name: "Branching Evolution",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "If one or more +1/+1 counters would be put on a creature you control, twice that many +1/+1 counters are put on that creature instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-add-counter",
        multiplier: 2,
        counterKind: "+1/+1",
        filter: { type: "creature" },
      },
      text:
        "If one or more +1/+1 counters would be put on a creature you control, twice that many +1/+1 counters are put on that creature instead.",
    },
  ],
});
