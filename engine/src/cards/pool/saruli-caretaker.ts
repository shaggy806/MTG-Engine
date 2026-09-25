import { defineCard } from "../define.js";

export default defineCard({
  name: "Saruli Caretaker",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\n{T}, Tap an untapped creature you control: Add one mana of any color.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Tap an untapped creature you control: Add one mana of any color.",
    },
  ],
});
