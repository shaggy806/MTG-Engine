import { defineCard } from "../define.js";

// EDHREC rank 3197.
export default defineCard({
  name: "Pick Your Poison",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose one —\n• Each opponent sacrifices an artifact of their choice.\n• Each opponent sacrifices an enchantment of their choice.\n• Each opponent sacrifices a creature with flying of their choice.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Each opponent sacrifices an artifact of their choice.",
        effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "artifact" }, count: 1 },
      },
      {
        text: "Each opponent sacrifices an enchantment of their choice.",
        effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "enchantment" }, count: 1 },
      },
      {
        text: "Each opponent sacrifices a creature with flying of their choice.",
        effect: {
          kind: "sacrifice",
          who: "each-opponent",
          filter: { type: "creature", keyword: "flying" },
          count: 1,
        },
      },
    ],
  },
});
