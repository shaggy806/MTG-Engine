import { defineCard } from "../define.js";

export default defineCard({
  name: "Iroh's Demonstration",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Choose one —\n• Iroh's Demonstration deals 1 damage to each creature your opponents control.\n• Iroh's Demonstration deals 4 damage to target creature.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Iroh's Demonstration deals 1 damage to each creature your opponents control.",
        effect: {
          kind: "damage-all",
          amount: 1,
          filter: { type: "creature", controlledBy: "opponent" },
        },
      },
      {
        text: "Iroh's Demonstration deals 4 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 4, target: 0 },
      },
    ],
  },
});
