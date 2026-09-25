import { defineCard } from "../define.js";

export default defineCard({
  name: "Rathi Trapper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Rogue"],
  power: 1,
  toughness: 2,
  text: "{B}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{B}, {T}: Tap target creature.",
    },
  ],
});
