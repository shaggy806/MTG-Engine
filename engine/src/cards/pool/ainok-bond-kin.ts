import { defineCard } from "../define.js";
import { outlast } from "../helpers.js";

// EDHREC rank 5515.
//
// Rulings:
//   [2014-09-20] Several creatures with outlast also grant an ability to creatures you control
//     with +1/+1 counters on them, including themselves. These counters could come from an outlast
//     ability, but any +1/+1 counter on the creature will count.

const FIRST_STRIKE_TEXT = "Each creature you control with a +1/+1 counter on it has first strike.";

// Abzan Falconer's shape.
export default defineCard({
  name: "Ainok Bond-Kin",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog", "Soldier"],
  power: 2,
  toughness: 1,
  text:
    "Outlast {1}{W} ({1}{W}, {T}: Put a +1/+1 counter on this creature. Outlast only as a sorcery.)\n" +
    FIRST_STRIKE_TEXT,
  activated: [outlast("{1}{W}")],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["first-strike"],
      text: FIRST_STRIKE_TEXT,
    },
  ],
});
