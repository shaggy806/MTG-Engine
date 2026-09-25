import { defineCard } from "../define.js";

export default defineCard({
  name: "Witty Roastmaster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil", "Citizen"],
  power: 3,
  toughness: 2,
  text: "Alliance — Whenever another creature you control enters, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Alliance — Whenever another creature you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
});
