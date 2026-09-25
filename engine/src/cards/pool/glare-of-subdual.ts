import { defineCard } from "../define.js";

export default defineCard({
  name: "Glare of Subdual",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: "Tap an untapped creature you control: Tap target artifact or creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["artifact-or-creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Tap an untapped creature you control: Tap target artifact or creature.",
    },
  ],
});
