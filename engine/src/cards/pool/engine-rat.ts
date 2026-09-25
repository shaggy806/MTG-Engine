import { defineCard } from "../define.js";

export default defineCard({
  name: "Engine Rat",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Rat"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\n{5}{B}: Each opponent loses 2 life.",
  activated: [
    {
      cost: { mana: "{5}{B}", tap: false },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "{5}{B}: Each opponent loses 2 life.",
    },
  ],
});
