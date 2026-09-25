import { defineCard } from "../define.js";

export default defineCard({
  name: "Spinning Wheel",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add one mana of any color.\n{5}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{5}, {T}: Tap target creature.",
    },
  ],
});
