import { defineCard } from "../define.js";

export default defineCard({
  name: "Pirate's Prize",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw two cards. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 2 }, { kind: "create-token", token: "Treasure Token", count: 1 }],
  },
});
