import { defineCard } from "../define.js";

export default defineCard({
  name: "Squall Drifter",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["snow"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{W}, {T}: Tap target creature.",
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
