import { defineCard } from "../define.js";

export default defineCard({
  name: "Slagstorm",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Choose one —\n• Slagstorm deals 3 damage to each creature.\n• Slagstorm deals 3 damage to each player.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Slagstorm deals 3 damage to each creature.",
        effect: { kind: "damage-all", amount: 3, filter: { type: "creature" } },
      },
      {
        text: "Slagstorm deals 3 damage to each player.",
        effect: { kind: "damage", amount: 3, who: "each-player" },
      },
    ],
  },
});
