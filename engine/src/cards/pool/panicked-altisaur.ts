import { defineCard } from "../define.js";

export default defineCard({
  name: "Panicked Altisaur",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 4,
  toughness: 5,
  keywords: ["reach"],
  text: "Reach\n{T}: This creature deals 2 damage to each opponent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "{T}: This creature deals 2 damage to each opponent.",
    },
  ],
});
