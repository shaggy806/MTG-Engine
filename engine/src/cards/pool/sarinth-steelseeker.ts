import { defineCard } from "../define.js";

// EDHREC rank 4948.
//
// Rulings:
//   [2022-10-14] You don't have to reveal the card if it's a land card. You may choose not to
//     reveal it and instead put it into your graveyard.
//
// Gathering Stone's look: a land card may be revealed and taken (min 0); the
// card not taken may then go to the graveyard (`secondPick`, asked only of
// what the first pick left), or stay on top.
const TEXT =
  "Whenever an artifact you control enters, look at the top card of your library. If it's a land card, you may reveal it and put it into your hand. If you don't put the card into your hand, you may put it into your graveyard.";

export default defineCard({
  name: "Sarinth Steelseeker",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Artificer", "Scout"],
  power: 1,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { type: "land" },
        destination: "hand",
        secondPick: { min: 0, max: 1, destination: "graveyard" },
        leftover: "stay",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
