import { defineCard } from "../define.js";

// EDHREC rank 6667.
//
// "Put them back in any order" is every looked-at card chosen, back on top in
// the order picked (Halimar Depths' shape), behind Cream of the Crop's "may".
const TEXT =
  "At the beginning of your upkeep, you may look at the top three cards of your library, then put them back in any order.";

export default defineCard({
  name: "Mirri's Guile",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Look at the top three cards of your library?",
        effect: {
          kind: "look-and-choose",
          zone: "library",
          count: 3,
          min: 3,
          max: 3,
          destination: "library-top",
          leftover: "stay",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
