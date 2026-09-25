import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Rotwurm",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Zombie", "Wurm"],
  power: 5,
  toughness: 4,
  text: "{B}, Sacrifice a creature: Target player loses 1 life.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: "creature-you-control" },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{B}, Sacrifice a creature: Target player loses 1 life.",
    },
  ],
});
