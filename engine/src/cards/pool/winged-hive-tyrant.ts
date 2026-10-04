import { defineCard } from "../define.js";

// EDHREC rank 6416.

const TEXT = "The Will of the Hive Mind — Other creatures you control with counters on them have flying and haste.";

export default defineCard({
  name: "Winged Hive Tyrant",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${TEXT}`,
  static: [
    {
      // A counter of any kind (`kind` omitted), Chocobo Knights' filter.
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } },
        excludeSelf: true,
      },
      grantKeywords: ["flying", "haste"],
      text: TEXT,
    },
  ],
});
