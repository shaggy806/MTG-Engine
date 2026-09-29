import { defineCard } from "../define.js";
import { outlast } from "../helpers.js";

const FLYING_TEXT = "Each creature you control with a +1/+1 counter on it has flying.";

export default defineCard({
  name: "Abzan Falconer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text:
    "Outlast {W} ({W}, {T}: Put a +1/+1 counter on this creature. Outlast only as a sorcery.)\n" +
    FLYING_TEXT,
  activated: [outlast("{W}")],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["flying"],
      text: FLYING_TEXT,
    },
  ],
});
