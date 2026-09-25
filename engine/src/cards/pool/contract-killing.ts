import { defineCard } from "../define.js";

export default defineCard({
  name: "Contract Killing",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature. Create two Treasure tokens. (They're artifacts with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 2 },
    ],
  },
});
