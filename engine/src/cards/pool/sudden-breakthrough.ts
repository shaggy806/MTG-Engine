import { defineCard } from "../define.js";

// EDHREC rank 4884.
// Same text and shape as Ancestors' Aid.

export default defineCard({
  name: "Sudden Breakthrough",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +2/+0 and gains first strike until end of turn.\nCreate a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
