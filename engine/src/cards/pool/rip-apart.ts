import { defineCard } from "../define.js";

export default defineCard({
  name: "Rip Apart",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  text: "Choose one —\n• Rip Apart deals 3 damage to target creature or planeswalker.\n• Destroy target artifact or enchantment.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Rip Apart deals 3 damage to target creature or planeswalker.",
        targets: [
          {
            kind: "permanent",
            whose: "any",
            filter: { typesAnyOf: ["creature", "planeswalker"] },
          },
        ],
        effect: { kind: "damage", amount: 3, target: 0 },
      },
      {
        text: "Destroy target artifact or enchantment.",
        targets: ["artifact-or-enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
