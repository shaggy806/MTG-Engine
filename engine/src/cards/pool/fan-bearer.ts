import { defineCard } from "../define.js";

export default defineCard({
  name: "Fan Bearer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 2,
  text: "{2}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}, {T}: Tap target creature.",
    },
  ],
});
