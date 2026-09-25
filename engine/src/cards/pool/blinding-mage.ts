import { defineCard } from "../define.js";

export default defineCard({
  name: "Blinding Mage",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
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
