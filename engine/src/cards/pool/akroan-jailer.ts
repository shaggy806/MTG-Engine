import { defineCard } from "../define.js";

export default defineCard({
  name: "Akroan Jailer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "{2}{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}{W}, {T}: Tap target creature.",
    },
  ],
});
