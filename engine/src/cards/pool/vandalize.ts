import { defineCard } from "../define.js";

export default defineCard({
  name: "Vandalize",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Choose one or both —\n• Destroy target artifact.\n• Destroy target land.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target land.",
        targets: ["land"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
