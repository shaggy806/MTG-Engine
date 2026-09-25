import { defineCard } from "../define.js";

export default defineCard({
  name: "Depths of Desire",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target creature to its owner's hand. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
