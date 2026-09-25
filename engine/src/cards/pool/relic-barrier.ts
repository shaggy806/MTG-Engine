import { defineCard } from "../define.js";

export default defineCard({
  name: "Relic Barrier",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Tap target artifact.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["artifact"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{T}: Tap target artifact.",
    },
  ],
});
