import { defineCard } from "../define.js";

export default defineCard({
  name: "Frostbridge Guard",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental", "Soldier"],
  power: 2,
  toughness: 2,
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
