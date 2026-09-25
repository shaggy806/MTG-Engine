import { defineCard } from "../define.js";

export default defineCard({
  name: "Supportive Parents",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 3,
  toughness: 3,
  text: "Tap two untapped creatures you control: Add one mana of any color.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Tap two untapped creatures you control: Add one mana of any color.",
    },
  ],
});
