import { defineCard } from "../define.js";

// EDHREC rank 4355.
//
// Rulings:
//   [2023-11-10] If the target of Ancestors' Aid is illegal as the spell tries to resolve, it
//     won't resolve and none of its effects will happen. You won't create a Treasure token.

export default defineCard({
  name: "Ancestors' Aid",
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
