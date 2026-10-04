import { defineCard } from "../define.js";
import { outlast } from "../helpers.js";

// EDHREC rank 5518.
//
// Rulings:
//   [2014-09-20] Several creatures with outlast also grant an ability to creatures you control
//     with +1/+1 counters on them, including themselves. These counters could come from an outlast
//     ability, but any +1/+1 counter on the creature will count.

const TRAMPLE_TEXT = "Each creature you control with a +1/+1 counter on it has trample.";

// Abzan Falconer's shape.
export default defineCard({
  name: "Tuskguard Captain",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: "Outlast {G} ({G}, {T}: Put a +1/+1 counter on this creature. Outlast only as a sorcery.)\n" + TRAMPLE_TEXT,
  activated: [outlast("{G}")],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});
