import { defineCard } from "../define.js";

export default defineCard({
  name: "Stinging Barrier",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{U}, {T}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{U}", tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{U}, {T}: This creature deals 1 damage to any target.",
    },
  ],
});
