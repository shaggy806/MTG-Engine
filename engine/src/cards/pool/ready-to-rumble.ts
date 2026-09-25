import { defineCard } from "../define.js";

export default defineCard({
  name: "Ready to Rumble",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Choose one —\n• Ready to Rumble deals 5 damage to target creature or planeswalker.\n• Destroy target artifact.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Ready to Rumble deals 5 damage to target creature or planeswalker.",
        targets: [
          {
            kind: "permanent",
            whose: "any",
            filter: { typesAnyOf: ["creature", "planeswalker"] },
          },
        ],
        effect: { kind: "damage", amount: 5, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
