import { defineCard } from "../define.js";

export default defineCard({
  name: "Tradewind Rider",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{T}, Tap two untapped creatures you control: Return target permanent to its owner's hand.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 2, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: ["permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{T}, Tap two untapped creatures you control: Return target permanent to its owner's hand.",
    },
  ],
});
