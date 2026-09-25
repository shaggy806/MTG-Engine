import { defineCard } from "../define.js";

export default defineCard({
  name: "Blistergrub",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 2,
  toughness: 2,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)\nWhen this creature dies, each opponent loses 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "When this creature dies, each opponent loses 2 life.",
    },
  ],
});
