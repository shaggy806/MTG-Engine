import { defineCard } from "../define.js";

export default defineCard({
  name: "Ostiary Thrull",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 2,
  toughness: 2,
  text: "{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target creature.",
    },
  ],
});
