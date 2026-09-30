import { defineCard } from "../define.js";

export default defineCard({
  name: "Casualties of War",
  manaCost: "{2}{B}{B}{G}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text:
    "Choose one or more —\n" +
    "• Destroy target artifact.\n" +
    "• Destroy target creature.\n" +
    "• Destroy target enchantment.\n" +
    "• Destroy target land.\n" +
    "• Destroy target planeswalker.",
  castModal: {
    minModes: 1,
    maxModes: 5,
    modes: [
      { text: "Destroy target artifact.", targets: ["artifact"], effect: { kind: "destroy", target: 0 } },
      { text: "Destroy target creature.", targets: ["creature"], effect: { kind: "destroy", target: 0 } },
      { text: "Destroy target enchantment.", targets: ["enchantment"], effect: { kind: "destroy", target: 0 } },
      { text: "Destroy target land.", targets: ["land"], effect: { kind: "destroy", target: 0 } },
      {
        text: "Destroy target planeswalker.",
        targets: [{ kind: "permanent", filter: { type: "planeswalker" } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
