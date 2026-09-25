import { defineCard } from "../define.js";

export default defineCard({
  name: "Crack Open",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target artifact or enchantment. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
