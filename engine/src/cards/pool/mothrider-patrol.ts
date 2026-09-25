import { defineCard } from "../define.js";

export default defineCard({
  name: "Mothrider Patrol",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Fox", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{3}{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{3}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{3}{W}, {T}: Tap target creature.",
    },
  ],
});
