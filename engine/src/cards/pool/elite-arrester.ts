import { defineCard } from "../define.js";

export default defineCard({
  name: "Elite Arrester",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 0,
  toughness: 3,
  text: "{1}{U}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{1}{U}, {T}: Tap target creature.",
    },
  ],
});
