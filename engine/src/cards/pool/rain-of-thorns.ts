import { defineCard } from "../define.js";

export default defineCard({
  name: "Rain of Thorns",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose one or more —\n• Destroy target artifact.\n• Destroy target enchantment.\n• Destroy target land.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
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
