import { defineCard } from "../define.js";

const TEXT =
  "If one or more +1/+1 counters would be put on a creature you control, twice that many +1/+1 counters are put on it instead.";

// Branching Evolution on a body. It also doubles the counters a creature
// enters with, and two of them multiply (its rulings).
export default defineCard({
  name: "Corpsejack Menace",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 4,
  toughness: 4,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-add-counter",
        multiplier: 2,
        counterKind: "+1/+1",
        filter: { type: "creature" },
      },
      text: TEXT,
    },
  ],
});
