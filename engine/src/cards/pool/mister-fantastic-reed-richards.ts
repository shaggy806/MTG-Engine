import { defineCard } from "../define.js";

// EDHREC rank 6222.
//
// Kambal, Profiteering Mayor's batched "one or more tokens you control enter".
const TEXT = "Whenever one or more tokens you control enter, you may draw a card.";

export default defineCard({
  name: "Mister Fantastic, Reed Richards",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist", "Hero"],
  power: 2,
  toughness: 4,
  keywords: ["reach"],
  text: `Reach\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true }, batched: true },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
