import { defineCard } from "../define.js";

// EDHREC rank 3181.
//
// Rulings:
//   [2013-01-24] You choose the mode as you cast the spell.

export default defineCard({
  name: "Merciless Eviction",
  manaCost: "{4}{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text:
    "Choose one —\n" +
    "• Exile all artifacts.\n" +
    "• Exile all creatures.\n" +
    "• Exile all enchantments.\n" +
    "• Exile all planeswalkers.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { targets: [], text: "Exile all artifacts.", effect: { kind: "exile-all", filter: { type: "artifact" } } },
      { targets: [], text: "Exile all creatures.", effect: { kind: "exile-all", filter: { type: "creature" } } },
      { targets: [], text: "Exile all enchantments.", effect: { kind: "exile-all", filter: { type: "enchantment" } } },
      { targets: [], text: "Exile all planeswalkers.", effect: { kind: "exile-all", filter: { type: "planeswalker" } } },
    ],
  },
});
