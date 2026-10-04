import { defineCard } from "../define.js";

// EDHREC rank 5712.
//
// Rulings:
//   [2020-01-24] The second mode of Nylea’s Intervention has it deal damage to each creature with
//     flying equal to twice X. It doesn’t deal X damage to them then deal X damage again.

export default defineCard({
  name: "Nylea's Intervention",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose one —\n• Search your library for up to X land cards, reveal them, put them into your hand, then shuffle.\n• Nylea's Intervention deals twice X damage to each creature with flying.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Search your library for up to X land cards, reveal them, put them into your hand, then shuffle.",
        effect: { kind: "search-library", filter: { type: "land" }, destination: "hand", min: 0, max: "x", reveal: true },
      },
      {
        // Twice X, dealt once (the ruling) — not X twice.
        text: "Nylea's Intervention deals twice X damage to each creature with flying.",
        effect: { kind: "damage-all", filter: { type: "creature", keyword: "flying" }, amount: { product: [2, "x"] } },
      },
    ],
  },
});
