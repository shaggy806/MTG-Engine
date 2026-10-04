import { defineCard } from "../define.js";

// EDHREC rank 6323.

export default defineCard({
  name: "Heart Sliver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: "All Sliver creatures have haste.",
  static: [
    {
      // Every Sliver creature, whoever controls it, itself included (Winged Sliver's scope).
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      grantKeywords: ["haste"],
      text: "All Sliver creatures have haste.",
    },
  ],
});
