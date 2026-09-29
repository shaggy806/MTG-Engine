import { defineCard } from "../define.js";

export default defineCard({
  name: "Brass's Bounty",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "For each land you control, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  effect: {
    kind: "create-token",
    token: "Treasure Token",
    count: { countOf: { type: "land", controlledBy: "you" } },
  },
});
