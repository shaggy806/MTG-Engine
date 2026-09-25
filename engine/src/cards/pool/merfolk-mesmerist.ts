import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk Mesmerist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 2,
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
