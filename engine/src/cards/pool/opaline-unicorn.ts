import { defineCard } from "../define.js";

export default defineCard({
  name: "Opaline Unicorn",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Unicorn"],
  power: 1,
  toughness: 2,
  text: "{T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
});
