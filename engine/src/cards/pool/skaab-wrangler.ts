import { defineCard } from "../define.js";

export default defineCard({
  name: "Skaab Wrangler",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
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
