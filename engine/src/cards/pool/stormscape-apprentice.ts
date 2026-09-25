import { defineCard } from "../define.js";

export default defineCard({
  name: "Stormscape Apprentice",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{W}, {T}: Tap target creature.\n{B}, {T}: Target player loses 1 life.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target creature.",
    },
    {
      cost: { mana: "{B}", tap: true },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{B}, {T}: Target player loses 1 life.",
    },
  ],
});
