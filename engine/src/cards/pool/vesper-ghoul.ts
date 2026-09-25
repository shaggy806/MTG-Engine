import { defineCard } from "../define.js";

export default defineCard({
  name: "Vesper Ghoul",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}, Pay 1 life: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add one mana of any color.",
    },
  ],
});
