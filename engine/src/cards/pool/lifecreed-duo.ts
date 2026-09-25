import { defineCard } from "../define.js";

export default defineCard({
  name: "Lifecreed Duo",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bat", "Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever another creature you control enters, you gain 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
  ],
});
