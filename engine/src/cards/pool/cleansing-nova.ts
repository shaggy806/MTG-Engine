import { defineCard } from "../define.js";

export default defineCard({
  name: "Cleansing Nova",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Choose one —\n" +
    "• Destroy all creatures.\n" +
    "• Destroy all artifacts and enchantments.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy all creatures.",
        effect: { kind: "destroy-all", filter: { type: "creature" } },
      },
      {
        text: "Destroy all artifacts and enchantments.",
        effect: {
          kind: "destroy-all",
          filter: { typesAnyOf: ["artifact", "enchantment"] },
        },
      },
    ],
  },
});
