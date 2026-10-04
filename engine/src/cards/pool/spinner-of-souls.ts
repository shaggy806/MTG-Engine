import { defineCard } from "../define.js";

// EDHREC rank 3865.
//
// Rulings:
//   [2024-11-08] If Spinner of Souls dies at the same time as one or more other nontoken creatures
//     you control, its last ability will trigger for each of those other creatures.

export default defineCard({
  name: "Spinner of Souls",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider", "Spirit"],
  power: 4,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\nWhenever another nontoken creature you control dies, you may reveal cards from the top of your library until you reveal a creature card. Put that card into your hand and the rest on the bottom of your library in a random order.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Reveal cards until you reveal a creature card?",
        effect: { kind: "reveal-until", filter: { type: "creature" }, put: "hand", rest: "bottom-random" },
      },
      resolve: null,
      text: "Whenever another nontoken creature you control dies, you may reveal cards from the top of your library until you reveal a creature card. Put that card into your hand and the rest on the bottom of your library in a random order.",
    },
  ],
});
