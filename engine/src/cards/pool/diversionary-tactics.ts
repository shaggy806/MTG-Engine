import { defineCard } from "../define.js";

export default defineCard({
  name: "Diversionary Tactics",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Tap two untapped creatures you control: Tap target creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Tap two untapped creatures you control: Tap target creature.",
    },
  ],
});
