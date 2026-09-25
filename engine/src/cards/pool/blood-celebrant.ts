import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Celebrant",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{B}, Pay 1 life: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{B}, Pay 1 life: Add one mana of any color.",
    },
  ],
});
