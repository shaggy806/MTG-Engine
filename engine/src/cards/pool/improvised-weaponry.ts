import { defineCard } from "../define.js";

export default defineCard({
  name: "Improvised Weaponry",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Improvised Weaponry deals 2 damage to any target. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 2, target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
