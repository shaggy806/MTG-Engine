import { defineCard } from "../define.js";

export default defineCard({
  name: "Tide Skimmer",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you attack with two or more creatures with flying, draw a card.",
  triggered: [
    {
      trigger: {
        on: "attack-with",
        who: "you",
        atLeast: 2,
        filter: { keyword: "flying" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you attack with two or more creatures with flying, draw a card.",
    },
  ],
});
