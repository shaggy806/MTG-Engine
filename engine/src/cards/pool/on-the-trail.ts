import { defineCard } from "../define.js";

// EDHREC rank 4834.

// Alandra's "second card each turn" trigger, and Contaminant Grafter's "you
// may put a land card from your hand onto the battlefield", entering tapped.
const TEXT =
  "Whenever you draw your second card each turn, you may put a land card from your hand onto the battlefield tapped.";

export default defineCard({
  name: "On the Trail",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
        enterTapped: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
