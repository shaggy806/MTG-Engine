import { defineCard } from "../define.js";

export default defineCard({
  name: "Shopkeeper's Bane",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Badger", "Pest"],
  power: 4,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nWhenever this creature attacks, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever this creature attacks, you gain 2 life.",
    },
  ],
});
