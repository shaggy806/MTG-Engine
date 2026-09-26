import { defineCard } from "../define.js";

// Modes are chosen as it's cast (rules 601.2b, 700.2a — `castModal`, with no
// targets), so everyone sees which two while it's on the stack. The chosen
// modes then happen in printed order (700.2d).
export default defineCard({
  name: "Austere Command",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Choose two —\n" +
    "• Destroy all artifacts.\n" +
    "• Destroy all enchantments.\n" +
    "• Destroy all creatures with mana value 3 or less.\n" +
    "• Destroy all creatures with mana value 4 or greater.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        targets: [],
        text: "Destroy all artifacts.",
        effect: { kind: "destroy-all", filter: { type: "artifact" } },
      },
      {
        targets: [],
        text: "Destroy all enchantments.",
        effect: { kind: "destroy-all", filter: { type: "enchantment" } },
      },
      {
        targets: [],
        text: "Destroy all creatures with mana value 3 or less.",
        effect: {
          kind: "destroy-all",
          filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
        },
      },
      {
        targets: [],
        text: "Destroy all creatures with mana value 4 or greater.",
        effect: {
          kind: "destroy-all",
          filter: { type: "creature", manaValue: { op: "gte", n: 4 } },
        },
      },
    ],
  },
});
