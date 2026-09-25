import { defineCard } from "../define.js";

export default defineCard({
  name: "Prismite",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 1,
  text: "{2}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}: Add one mana of any color.",
    },
  ],
});
