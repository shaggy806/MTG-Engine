import { defineCard } from "../define.js";

export default defineCard({
  name: "Stonecoil Serpent",
  manaCost: "{X}",
  types: ["artifact", "creature"],
  subtypes: ["Snake"],
  power: 0,
  toughness: 0,
  keywords: ["reach", "trample"],
  text:
    "Reach, trample, protection from multicolored\n" +
    "This creature enters with X +1/+1 counters on it.",
  static: [
    {
      affects: { scope: "self" },
      // The quality no colour list can name: "multicolored" is two-or-more
      // colours, not any particular ones.
      protection: { filter: { multicolored: true } },
      text: "Protection from multicolored",
    },
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: "x" },
      },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
});
