import { defineCard } from "../define.js";

export default defineCard({
  name: "Temur Devotee",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\n{1}: Add {G}, {U}, or {R}. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U", "R"] }, amount: 1 },
      resolve: null,
      text: "{1}: Add {G}, {U}, or {R}. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
