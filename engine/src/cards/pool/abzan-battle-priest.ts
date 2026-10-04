import { defineCard } from "../define.js";
import { outlast } from "../helpers.js";

// EDHREC rank 3678. Abzan Falconer's shape, granting lifelink.
//
// Rulings:
//   [2014-09-20] Several creatures with outlast also grant an ability to creatures you control
//     with +1/+1 counters on them, including themselves. These counters could come from an outlast
//     ability, but any +1/+1 counter on the creature will count.

const LIFELINK_TEXT = "Each creature you control with a +1/+1 counter on it has lifelink.";

export default defineCard({
  name: "Abzan Battle Priest",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 2,
  text: `Outlast {W} ({W}, {T}: Put a +1/+1 counter on this creature. Outlast only as a sorcery.)\n${LIFELINK_TEXT}`,
  activated: [outlast("{W}")],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["lifelink"],
      text: LIFELINK_TEXT,
    },
  ],
});
