import { defineCard } from "../define.js";

// EDHREC rank 2399.
const TEXT = "Attacking creatures you control have double strike.";

export default defineCard({
  name: "Berserkers' Onslaught",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", attacking: true, controlledBy: "you" } },
      grantKeywords: ["double-strike"],
      text: TEXT,
    },
  ],
});
