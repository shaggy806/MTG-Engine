import { defineCard } from "../define.js";

export default defineCard({
  name: "Auriok Transfixer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 1,
  text: "{W}, {T}: Tap target artifact.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["artifact"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target artifact.",
    },
  ],
});
