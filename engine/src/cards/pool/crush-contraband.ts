import { defineCard } from "../define.js";

export default defineCard({
  name: "Crush Contraband",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Choose one or both —\n" +
    "• Exile target artifact.\n" +
    "• Exile target enchantment.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Exile target artifact.",
        targets: ["artifact"],
        effect: { kind: "exile", target: 0 },
      },
      {
        text: "Exile target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "exile", target: 0 },
      },
    ],
  },
});
