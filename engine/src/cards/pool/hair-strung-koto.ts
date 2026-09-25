import { defineCard } from "../define.js";

export default defineCard({
  name: "Hair-Strung Koto",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "Tap an untapped creature you control: Target player mills a card.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "Tap an untapped creature you control: Target player mills a card.",
    },
  ],
});
