import { defineCard } from "../define.js";

export default defineCard({
  name: "Gene Pollinator",
  manaCost: "{G}",
  colors: ["G"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Insect"],
  power: 1,
  toughness: 2,
  text: "{T}, Tap an untapped permanent you control: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true, tapOthers: { count: 1, filter: { controlledBy: "you" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Tap an untapped permanent you control: Add one mana of any color.",
    },
  ],
});
