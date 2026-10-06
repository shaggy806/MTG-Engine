import { defineCard } from "../define.js";

// EDHREC rank 6627.
// Thalia, Guardian of Thraben's tax: every player's noncreature spells.
const TEXT = "Noncreature spells cost {1} more to cast.";

export default defineCard({
  name: "Thorn of Amethyst",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { notTypes: ["creature"] },
        increaseGeneric: 1,
      },
      text: TEXT,
    },
  ],
});
