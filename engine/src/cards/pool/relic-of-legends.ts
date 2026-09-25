import { defineCard } from "../define.js";

export default defineCard({
  name: "Relic of Legends",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add one mana of any color.\nTap an untapped legendary creature you control: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 1,
          filter: { supertype: "legendary", type: "creature", controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Tap an untapped legendary creature you control: Add one mana of any color.",
    },
  ],
});
