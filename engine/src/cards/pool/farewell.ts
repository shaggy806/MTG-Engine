import { defineCard } from "../define.js";

// Modes are chosen as it's cast (rule 601.2b, `castModal` with no targets),
// so it is still on the stack while "exile all graveyards" happens and never
// exiles itself. The chosen modes then happen in printed order (700.2d).
export default defineCard({
  name: "Farewell",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Choose one or more —\n" +
    "• Exile all artifacts.\n" +
    "• Exile all creatures.\n" +
    "• Exile all enchantments.\n" +
    "• Exile all graveyards.",
  castModal: {
    minModes: 1,
    maxModes: 4,
    modes: [
      {
        targets: [],
        text: "Exile all artifacts.",
        effect: { kind: "exile-all", filter: { type: "artifact" } },
      },
      {
        targets: [],
        text: "Exile all creatures.",
        effect: { kind: "exile-all", filter: { type: "creature" } },
      },
      {
        targets: [],
        text: "Exile all enchantments.",
        effect: { kind: "exile-all", filter: { type: "enchantment" } },
      },
      {
        targets: [],
        text: "Exile all graveyards.",
        effect: { kind: "exile-graveyard", target: "each-player" },
      },
    ],
  },
});
