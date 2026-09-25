import { defineCard } from "../define.js";

export default defineCard({
  name: "Molten Blast",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Choose one —\n• Molten Blast deals 2 damage to target creature or planeswalker.\n• Destroy target artifact.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Molten Blast deals 2 damage to target creature or planeswalker.",
        targets: [
          {
            kind: "permanent",
            whose: "any",
            filter: { typesAnyOf: ["creature", "planeswalker"] },
          },
        ],
        effect: { kind: "damage", amount: 2, target: 0 },
      },
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
