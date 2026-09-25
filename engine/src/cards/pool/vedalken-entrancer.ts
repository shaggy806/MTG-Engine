import { defineCard } from "../define.js";

export default defineCard({
  name: "Vedalken Entrancer",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 1,
  toughness: 4,
  text: "{U}, {T}: Target player mills two cards.",
  activated: [
    {
      cost: { mana: "{U}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "{U}, {T}: Target player mills two cards.",
    },
  ],
});
