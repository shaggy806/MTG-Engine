import { defineCard } from "../define.js";

export default defineCard({
  name: "Hinterland Sanctifier",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Cleric"],
  power: 1,
  toughness: 2,
  text: "Whenever another creature you control enters, you gain 1 life.",
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
