import { defineCard } from "../define.js";

export default defineCard({
  name: "Loxodon Mystic",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elephant", "Cleric"],
  power: 3,
  toughness: 3,
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
