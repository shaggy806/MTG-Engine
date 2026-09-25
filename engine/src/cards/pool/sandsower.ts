import { defineCard } from "../define.js";

export default defineCard({
  name: "Sandsower",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 3,
  text: "Tap three untapped creatures you control: Tap target creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Tap three untapped creatures you control: Tap target creature.",
    },
  ],
});
